# Elisa Batch Cooking — working rules

## Versioning (always)

The app version is the `"version"` in `package.json`. It is shown at the bottom of the admin and
chef dashboards (read by `src/lib/version.ts`), so the number on screen must always tell what is
running. Every change that reaches `main` bumps it — no exceptions, fixes included.

- **Patch** (1.1.0 → 1.1.1): a fix or a small change.
- **Minor** (1.1.x → 1.2.0): a new capability (new screen, new feature).
- **Major** (→ 2.0.0): a big change in how the app works.

How:
1. Bump `package.json` and the two root `"version"` lines at the top of `package-lock.json`
   (never other packages' versions in the lockfile).
2. Put the new version at the end of the commit message and of the merge commit into `main`,
   e.g. `fix(courses): … [v1.1.1]`.
3. One bump per merge to `main`: several commits on one branch share the version of that merge.
4. Say the new version to the user when reporting a merge.

## Branches

Each round of feedback goes on its own branch, pushed for a Vercel preview, and is merged to
`main` only when asked (urgent production fixes excepted — say so when merging).
