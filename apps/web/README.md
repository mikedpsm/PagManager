# PagManager web

The frontend uses React 19, TypeScript, Vite, TanStack Router and Query,
Tailwind CSS 4, and Storybook 9. It lives in the pnpm workspace and consumes
the API and shared contracts from sibling workspace packages.

```sh
pnpm --filter @pagmanager/web dev
pnpm --filter @pagmanager/web typecheck
pnpm --filter @pagmanager/web test
pnpm --filter @pagmanager/web build
pnpm --filter @pagmanager/web storybook
```

Run the API separately with `pnpm --filter @pagmanager/api dev`. Vite forwards
`/api` requests to the local API on port 5000. Set `VITE_API_URL` only when the
API is hosted on a different origin; otherwise the browser uses the current
origin. The Storybook production bundle is checked with
`pnpm --filter @pagmanager/web storybook:build`.
