# Agent instructions

## Monorepo (Turborepo)

Run tasks from the repo root: `pnpm turbo <task>`. For a single package, use `--filter` with the name from its `package.json` (e.g. `@stan/core`):

```bash
pnpm turbo typecheck --filter @stan/core
```

Do not run package tooling directly (`tsc`, `vite`, `eslint`) against a package path.

## TypeScript

Avoid type casts (`as`, angle-bracket assertions, `unknown` double-casts). Fix types at the source. If a cast seems unavoidable, ask before adding it.

## Implementation

When requirements, scope, or design trade-offs are unclear, ask before proceeding. Do not guess or make irreversible decisions.
