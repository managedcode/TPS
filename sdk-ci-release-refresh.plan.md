# SDK CI And Release Refresh Plan

1. Replace SDK workflow sprawl with a single staged workflow.
   - Create `.github/workflows/sdk-ci.yml`.
   - Include `quality`, runtime build/test matrix, and runtime coverage matrix jobs.
   - Remove redundant `.github/workflows/sdk-*.yml` files.

2. Harden release creation.
   - Update `.github/workflows/release.yml` to create and push `v{VERSION}` before creating the GitHub release.
   - Keep release creation idempotent when rerun.

3. Align docs and generated pages.
   - Update `README.md` AI Skills and SDK references only where workflow links or install guidance changed.
   - Update `SDK/README.md` and runtime READMEs to reference the consolidated workflow.
   - Update `scripts/build-site.mjs` so `/skills/` mirrors the real install instructions.

4. Verify locally.
   - `npm run build`
   - `npm run test`
   - `npm run coverage:sdk`
   - `dotnet format SDK/dotnet/ManagedCode.Tps.slnx --verify-no-changes`
   - `dotnet build SDK/dotnet/ManagedCode.Tps.slnx -c Release -warnaserror --no-restore`

5. Publish.
   - Commit and push to `main`.
   - Recreate `v1.1.0` tag and release if still absent after push.
