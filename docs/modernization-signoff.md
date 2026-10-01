# Modernization technical sign-off

Updated: 2026-10-01 (America/Sao_Paulo). Technical parity audit: 2026-09-30.

Technical parity was accepted before the T8.4 cleanup. The audit covered authentication and session recovery, profile credentials, dashboard totals and groups, client and invoice CRUD/search/filter behavior, pt-BR currency and contact formats, API documentation, health checks and user isolation. Phone and CEP validation gaps identified during the audit were corrected before sign-off.

Validation used Node 24.19.0 and pnpm 10.34.6:

- `pnpm install --frozen-lockfile`, `pnpm lint` and `pnpm typecheck` passed on the integrated implementation.
- `pnpm test` passed: 22 test files, 192 tests passed and 2 conditional PostgreSQL tests skipped because no local PostgreSQL URL was configured.
- `pnpm test:e2e` passed: 5 Chromium tests using temporary PGlite data, including profile updates and client/invoice operations. The command also built the shared packages, API and web app.
- The local production Docker build passed, including offline frozen development and production installs. Its gzip-compressed archive measured 76,978,773 bytes (76.98 MB), within the 80 MB budget. The non-root container served the UI/API, passed the built-in healthcheck, and retained the account and original JWT after restart.
- Main CI [run 36797396727](https://github.com/mikedpsm/PagManager/actions/runs/36797396727) passed at `8f685c9821f4b544c5bd0db5298478700661b5e0`, including PostgreSQL and container checks. This historical run validates that commit; final changes require their own CI.

These checks establish technical parity, not exhaustive coverage of every browser, viewport or external service. The browser suite verifies invalid-session recovery; it does not separately simulate a genuinely expired signed JWT. Phone and CEP validation checks syntax and normalization rather than allocation or real-world existence.

The obsolete backend and temporary frontend/API inventories were removed after this gate. Commit `d50683e92914ba23f2d5e3652ca9b8740d5fcfc6` preserves the complete pre-cleanup implementation and inventory documents. They remain recoverable with `git show d50683e:docs/frontend-inventory.md`, `git show d50683e:docs/api-contract.md` and `git ls-tree -r d50683e legacy`. The `legacy-v1` tag preserves the original backend; README retains its reference and frontend attribution.

The cleanup merged through [PR #104](https://github.com/mikedpsm/PagManager/pull/104) at release commit `402acf70eb06adc6b64225f465fa8f1c8e2a2cdb`. [Final main CI](https://github.com/mikedpsm/PagManager/actions/runs/36800928561), [main image publishing](https://github.com/mikedpsm/PagManager/actions/runs/36800928576), and [v2.0.0 image publishing](https://github.com/mikedpsm/PagManager/actions/runs/36801629841) completed successfully on that commit. This historical release validation used PostgreSQL 16; it does not validate subsequent changes to the CI database version.

The annotated [`v2.0.0` tag](https://github.com/mikedpsm/PagManager/tree/v2.0.0) points to the same release commit. The published image `ghcr.io/mikedpsm/pagmanager:2.0.0` supports `linux/amd64` and `linux/arm64`, with index digest `sha256:73d5df98cb3ee332b1ac7ed27eb8eecd67a12871da8dbb6163496b64ccbd6e01`. The tag workflow passed its critical-vulnerability scan, compressed-image budget (75.18 MB), and persisted-account restart smoke check, and published provenance/SBOM attestations.

T8.5 ([#88](https://github.com/mikedpsm/PagManager/issues/88)), phase 8 ([#9](https://github.com/mikedpsm/PagManager/issues/9)), and the final modernization tracker ([#10](https://github.com/mikedpsm/PagManager/issues/10)) are complete and closed. All nine issues open at the start of the final modernization work were closed. The release evidence above applies to `402acf70`; later changes require their own validation. No separate GitHub Release page was created: T8.5 required the tag-triggered GHCR publication.

Post-release housekeeping was locally validated on 2026-10-01 with the same Node and pnpm versions. Unused root dependencies, the obsolete entrypoint, and the root npm lock were removed; the pnpm lock dropped 474 package entries without introducing new versions, while the isolated contracts npm lock was preserved. CI now targets PostgreSQL 17 to match Compose. Migrations, seed, database build/typecheck, and all 10 database tests passed against PostgreSQL 17.11, including both real PostgreSQL cases. Integrated lint/typecheck, 192 unit tests, and 5 Chromium tests passed. The new production image passed offline frozen installs and the UI/API/restart smoke check; its compressed archive measured 69,641,065 bytes (69.64 MB). An initial Windows unit run hit two PGlite timeouts; the isolated rerun passed without source changes. These are local follow-up checks; the release evidence and image digest above continue to identify the original v2.0.0 commit.
