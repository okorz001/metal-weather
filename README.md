# [Metal Weather](https://metalweather.korz.org/)

Weather forecasts and heavy metal ⛈️🎸

## Summary

Inspired by the timeless gag of listening to Slayer's _Raining Blood_ during pouring rain,
Metal Weather plays heavy metal song clips suitable for the current weather conditions.
Enjoy metal classics such as: _Raining Blood_, _Riding on the Wind_, and _In My Kingdom Cold_.

**Features:**

- **Location search** — look up any city or US zip code, enter GPS coordinates,
  or let the browser detect your location automatically
- **Weather forecast** — current temperature and conditions, plus forecast
- **Auto-playing soundtrack** — a curated catalog of heavy metal song clips,
  tied to specific weather conditions, plays automatically with fade in/out
- **Saved favorites** — bookmark locations for one-click access, editable display name
- **User settings** — toggle between metric and imperial units, and between light
  and dark themes
- **Runs entirely in the browser** — all data comes from free, open APIs. favorites and
  settings are saved to local storage.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [TypeScript 6](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)

## Development

Requires npm >=11.11.0 (Node >=24.15.0 is the earliest version bundling it).

Recommended: use [nvm](https://github.com/nvm-sh/nvm) with the repo's `.nvmrc`
to get the right Node/npm automatically:

```bash
nvm install
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
