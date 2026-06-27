---
name: dev
description: >
  Start the metal-weather local development server. Use this skill whenever the
  user asks to run, start, launch, open, or bring up the dev server, the app,
  the site, localhost, or port 3000 — even if they don't say "skill" or "dev
  server" explicitly. Also use this when the user wants to see the app in a
  browser or verify that something looks right visually.
---

# Dev Server

Start the metal-weather Next.js dev server and open it in a browser.

## Steps

1. **Resolve the hostname** — check `.env.local` for `CLAUDE_DEV_HOSTNAME`. If set,
   use it; otherwise fall back to `localhost`.
   ```bash
   HOSTNAME=$(grep -E '^CLAUDE_DEV_HOSTNAME=' .env.local 2>/dev/null | cut -d= -f2-)
   HOST=${HOSTNAME:-localhost}
   ```

2. **Start the server** using the Bash tool with `run_in_background: true`:
   ```bash
   npm run dev
   ```
   This keeps the process tracked so it can be stopped easily by killing the background task.

3. **Wait for the server to be ready** — poll the output file until Next.js prints
   the "Local:" line, then extract the actual port (it may differ from 3000 if there
   was a collision):
   ```bash
   until grep -qE "Ready|Local:" <output-file> 2>/dev/null; do sleep 1; done
   PORT=$(grep -oP '(?<=localhost:)\d+' <output-file> | head -1)
   PORT=${PORT:-3000}
   ```
   If it hasn't come up within 30 seconds, check the output and report what went wrong.

4. **Report** the URL (`http://$HOST:$PORT`) and confirm the server is running. If
   there were any compilation warnings or errors worth noting, surface them briefly.
   Only open the browser if the user explicitly asks.

## Notes

- The server hot-reloads on file changes; no restart needed for most edits.
- To stop the server, use the TaskStop tool on the background task.
