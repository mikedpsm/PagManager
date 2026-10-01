# syntax=docker/dockerfile:1.7

FROM node:24-bookworm-slim AS pnpm-base

ENV COREPACK_HOME=/corepack \
    PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH

WORKDIR /app

COPY package.json ./
RUN corepack enable \
    && corepack install

# Fetch from the lockfile before copying source so dependency layers can be cached.
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch

FROM pnpm-base AS development

ENV LEFTHOOK=0
COPY . .
RUN pnpm install --offline --frozen-lockfile
ENTRYPOINT ["/bin/sh", "/app/scripts/container-entrypoint.sh"]
CMD ["pnpm", "dev:docker"]

FROM development AS e2e

ENV PLAYWRIGHT_BROWSERS_PATH=/opt/playwright
RUN pnpm exec playwright install --with-deps chromium
CMD ["pnpm", "test:e2e"]

FROM pnpm-base AS build

COPY . .

RUN pnpm install --offline --frozen-lockfile
RUN pnpm --filter @pagmanager/contracts build \
    && pnpm --filter @pagmanager/db build \
    && pnpm --filter @pagmanager/api build \
    && pnpm --filter @pagmanager/web build
RUN mkdir -p /image-data && chown 65532:65532 /image-data

FROM pnpm-base AS production-dependencies

COPY package.json ./
COPY scripts/install-hooks.mjs scripts/install-hooks.mjs
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/db/package.json packages/db/package.json

# `pnpm fetch` populated the virtual store with every locked package. Keep the
# shared content-addressable cache, but reinstall only the API production graph
# so development and web tooling never reaches the runtime image.
RUN rm -rf node_modules \
    && pnpm install --prod --offline --frozen-lockfile --filter @pagmanager/api...

FROM gcr.io/distroless/nodejs24-debian13:nonroot AS runtime

ENV NODE_ENV=production \
    PORT=8080 \
    DATA_DIR=/data

WORKDIR /app
USER 65532:65532

# Keep the workspace paths used by the compiled API and migration resolver.
COPY --from=production-dependencies /app/node_modules /app/node_modules
COPY --from=production-dependencies /app/apps/api/node_modules /app/apps/api/node_modules
COPY --from=production-dependencies /app/packages/contracts/node_modules /app/packages/contracts/node_modules
COPY --from=production-dependencies /app/packages/db/node_modules /app/packages/db/node_modules

COPY --from=build /app/apps/api/package.json /app/apps/api/package.json
COPY --from=build /app/apps/api/dist /app/apps/api/dist
COPY --from=build /app/apps/web/dist /app/apps/web/dist
COPY --from=build /app/packages/contracts/package.json /app/packages/contracts/package.json
COPY --from=build /app/packages/contracts/dist /app/packages/contracts/dist
COPY --from=build /app/packages/db/package.json /app/packages/db/package.json
COPY --from=build /app/packages/db/dist /app/packages/db/dist
COPY --from=build /app/db/migrations /app/db/migrations

# The non-root runtime needs a writable mount for PGlite and its generated JWT secret.
COPY --from=build --chown=65532:65532 /image-data /data

VOLUME ["/data"]
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
    CMD ["/nodejs/bin/node", "apps/api/dist/server.mjs", "--healthcheck"]

CMD ["apps/api/dist/server.mjs"]
