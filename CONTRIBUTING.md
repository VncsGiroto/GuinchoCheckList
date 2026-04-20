# Contributing

## Development setup

```bash
corepack pnpm install
corepack pnpm run typecheck
corepack pnpm run test
corepack pnpm run android
```

## Pull Request checklist

- Keep changes focused and small
- Follow TypeScript strict mode (avoid `any`)
- Run:
  - `corepack pnpm run typecheck`
  - `corepack pnpm run test`
- Include screenshots/video for UI changes
- Update docs when behavior changes

## Coding guidelines

- Prefer immutable updates
- Use clear naming (Portuguese or English, but keep consistency)
- Handle errors in filesystem, camera, location, and database flows
- Do not introduce secrets or personal data into fixtures/docs

## Commit style

Recommended prefixes:

- `feat:`
- `fix:`
- `chore:`
- `docs:`
- `test:`
