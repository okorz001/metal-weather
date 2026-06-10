# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A Next.js site that shows a weather forecast for a location and plays a heavy metal song appropriate for the current conditions (e.g. _Raining Blood_ by Slayer for rain).

## Commands

```sh
npm run dev           # start the development server
npm run build         # type-check and compile for production
npm run format        # format with Prettier
npm run format:check  # check formatting without writing
npm run lint          # lint src/ with ESLint
npm test              # run tests with Vitest (uses esbuild, does not type-check)
npm run verify        # run all checks in sequence (format:check + lint + test + build)
```

Always verify `npm run verify` passes before proposing a code change.

## GitHub

When adding a GitHub Actions action, use the same version already used by other jobs in the workflow files if it exists. Only when introducing an action not yet used anywhere should you look up and use its latest stable release.

## Docs Style

All Markdown section headers and table headers must use title case.

## Code Style

All exported symbols must have a full TSDoc comment describing what the function does, its parameters (`@param`), and its return value (`@returns`). One-line summaries are not sufficient for exported API.
