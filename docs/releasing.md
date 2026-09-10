# Releasing Typehug

All four packages are released together. Do not run the publish commands until you control the `@typehug` organization and have permission to publish there. Complete authentication and two-factor prompts directly; never put credentials in the repository.

## Prepare

1. Confirm all CI checks pass on Node.js 22 and 24.
2. Confirm the intended version in the root and four package manifests, exact internal dependency versions, and lockfile. Update the changelog with the release date, API availability notices, website version links, and release feed. Keep earlier changelog and feed entries.
3. Run `npm ci`, `npm run check`, and `npm run site:check` from a clean checkout.
4. Inspect each package with `npm pack --workspace @typehug/core --dry-run` and repeat for `pl`, `en`, and `all`. Check declarations, JavaScript, license, and README.
5. Confirm the active npm account with `npm whoami` and its access to `@typehug`.

## Publish

Publish in dependency order from the repository root, after explicit release authorization:

```sh
npm publish --workspace @typehug/core --access public
npm publish --workspace @typehug/pl --access public
npm publish --workspace @typehug/en --access public
npm publish --workspace @typehug/all --access public
```

If a step fails, inspect which versions are already present before retrying. Published versions cannot be replaced by a different tarball with the same version.

After all four packages are available, verify installation from the registry in a fresh project. Create the corresponding Git tag and GitHub release. Deploy the validated website after the npm version is installable, following the [site guide](../site/README.md), then check its version link, playground, exported Markdown, and release feed.

## Next versions

Update the package versions and exact internal dependency versions together, then run `npm install` to update the lockfile. Add regression tests for rule changes and describe them in the changelog. A dictionary change can alter output, so document it even when the function signatures stay the same.

CI only verifies the project. It does not publish packages or hold npm credentials.
