#!/bin/sh
set -eu

# Bind-mounted source hides the image's dependencies. Install into Linux-only
# named volumes, and refresh them when the lockfile changes.
CI=true pnpm install --frozen-lockfile
exec "$@"
