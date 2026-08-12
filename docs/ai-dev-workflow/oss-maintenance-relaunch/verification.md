# Verification

Verified on Windows with Node `22.22.3` and npm `10+` on 2026-08-12. These are maintainer tool requirements, not package-consumer runtime constraints.

## Passed checks

- `npm ci` — clean install from the public npm registry lock file.
- `npm test` — 9 component tests passed, covering installation, rendering, custom mappings, class callbacks, events, render-content return types, and label escaping.
- `npm run build` — generated ESM, UMD, and standalone CSS assets.
- `npm run build:demo` — generated the GitHub Pages demo.
- `npm run test:e2e` — 3 Chromium smoke tests passed, covering page rendering, branch collapse, and PNG screenshot download.
- `npm run test:package` — packed 6 intended files, installed the tarball in a clean fixture, loaded the plugin and CSS, and server-rendered a tree while keeping Vue external.
- `npm pack --dry-run --json` — package contents matched the intended release surface.
- `npm audit --omit=dev` — no production dependency vulnerabilities.
- `npm ls --all`, JSON parsing, YAML parsing, forbidden-marker search, and `git diff --check` — passed.
- The README screenshot was visually inspected and the documented GitHub Pages URL returned HTTP 200.

## Known limits

The full development dependency audit reports 2 low and 2 moderate advisories inherited from the end-of-life Vue 2.7 toolchain. There is no compatible upstream Vue 2 fix; `npm audit fix --force` would install incompatible packages. This residual risk is documented in `SECURITY.md` and the Vue 3 plan.

The npm registry currently reports `tapn-org-tree` as unclaimed, but this machine is not authenticated to npm and GitHub CLI is unavailable. Public npm publication, remote tag push, Pages activation, and GitHub Release creation therefore remain maintainer actions and are not claimed as complete.
