# Releasing

Releases follow Semantic Versioning. The `1.x` line is reserved for Vue 2.7-compatible maintenance; breaking Vue 3 work belongs in `2.x`.

## Prepare

1. Confirm the npm package name and maintainer access.
2. Update `package.json` and `CHANGELOG.md` with the same version.
3. Run:

   ```bash
   npm ci
   npm test
   npm run test:e2e
   npm run build
   npm run build:demo
   npm run test:package
   npm pack --dry-run
   ```

4. Commit the release and create an annotated tag, for example `git tag -a v1.0.0 -m "Release v1.0.0"`.

## Publish

Configure the GitHub `npm` environment with required reviewer approval and an `NPM_TOKEN` secret that can publish this package. Push the commit and matching tag. The release workflow refuses a tag/version mismatch, runs verification from a clean checkout, publishes with npm provenance, and creates the GitHub Release only after npm succeeds.

If the workflow fails, fix the cause and create a new version; never reuse a package version already published to npm.
