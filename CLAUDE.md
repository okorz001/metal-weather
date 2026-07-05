# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A Next.js site that shows a weather forecast for a location and plays a heavy metal song appropriate for the current conditions (e.g. _Raining Blood_ by Slayer for rain).

## Commands

```sh
npm run dev           # start the development server on port 3000
npm run build         # type-check and compile for production
npm run format        # format with Prettier
npm run format:check  # check formatting without writing
npm run lint          # lint src/ with ESLint
npm test              # run tests with Vitest (uses esbuild, does not type-check)
npm run verify        # run all checks in sequence (format:check + lint + test + build)
```

Always run `npm run format` before committing, then verify `npm run verify` passes before proposing a code change. For documentation-only changes (Markdown, JSON data), formatting is all that is needed.

## GitHub

When adding a GitHub Actions action, use the same version already used by other jobs in the workflow files if it exists. Only when introducing an action not yet used anywhere should you look up and use its latest stable release.

Never rebase or force push a branch that currently has an open PR.

## Project Docs

Keep `docs/project.md` up to date whenever a feature is added, removed, or significantly changed. Update the relevant sections (What the App Does, Components table, External APIs, data types) as part of the same change that implements the feature.

## Visual Style

Follow `docs/style.md` for all colors, typography, spacing, and icon conventions in UI changes. Keep it up to date whenever a visual pattern is introduced, changed, or retired, as part of the same change.

## Docs Style

All Markdown section headers and table headers must use title case.

## Code Style

All exported symbols must have a full TSDoc comment describing what the function does, its parameters (`@param`), and its return value (`@returns`). One-line summaries are not sufficient for exported API.

For optional values, prefer `?` shorthand (`field?: T`, `param?: T`) over explicit `| undefined` unions.
