# Contributing

## Workflow

1. Branch off an up-to-date `main`. Name the branch `feat/<topic>`, `fix/<topic>` or `chore/<topic>`.
2. Work test-first: write a failing test, make it pass, then refactor.
3. Keep commits small and focused, and use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `test:`, `refactor:`, `chore:`, `docs:`).
4. Open a pull request using the template. CI has to pass before you merge.
5. Squash-merge into `main`. Use a merge commit instead when the PR's individual commits need to keep their hashes, for example a formatting commit listed in `.git-blame-ignore-revs`.

## Checks

Before you push, run:

```sh
npm run check   # typecheck, lint and tests
```

## Tests

- Tests live in `__tests__/`, which mirrors `app/`. For example, `__tests__/screens/Home.test.tsx`.
- Use `@testing-library/react-native`. Query by role, label or visible text, not by test IDs or styles.
- Each screen test asserts the copy, the accessible controls and the navigation targets shown on its design canvas artboard.

## Design

UI follows the [oto design canvas](https://claude.ai/artifact/NtXhA3VnydXvCvepVidLL6):

- Colours come from the theme tokens, never raw hex values in screens.
- Shippori Mincho for titles and book names, Figtree for everything else.
- Kaki (the vermilion accent) appears at most once per screen.
- Touch targets are at least 44 pt, and text contrast is at least 4.5:1.
