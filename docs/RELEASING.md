# Releasing

Releases follow Semantic Versioning. Two lines are published:

- `2.x` ? Vue 3 rewrite as `@shuyuncong/vue-hierarchy`; prereleases publish under the `next` npm tag, stable releases under `latest`.
- `1.x` ? Vue 2.7 maintenance as `tapn-org-tree`, keeping the legacy component API.

## Prepare

1. Confirm the npm package name and maintainer access.
2. Update `package.json` and `CHANGELOG.md` with the same version.
3. Run:

   ```bash
   npm ci
   npm run verify
   npm run test:e2e
   npm pack --dry-run
   ```

4. Commit the release and create an annotated tag, for example `git tag -a v2.0.0-alpha.1 -m "Release v2.0.0-alpha.1"`.

## Publish

Configure the GitHub `npm` environment with required reviewer approval and an `NPM_TOKEN` secret that can publish the package. Push the commit and matching tag. The release workflow refuses a tag/version mismatch, runs verification from a clean checkout, publishes with npm provenance (using the `next` tag for prerelease versions), and creates the GitHub Release only after npm succeeds.

If the workflow fails, fix the cause and create a new version; never reuse a package version already published to npm.
