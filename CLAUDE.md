# Working conventions

- **Build once, at the end.** When making a series of related changes (e.g. a multi-phase feature), don't run `npm run build` after every file or every phase — run `npx tsc --noEmit` for quick type feedback while iterating, and save the full `npm run build` (and any test suites) for a single pass after all the changes are in, right before wrapping up. This saves time and tokens compared to rebuilding repeatedly.
