# metal-weather

The weather forecast, now with heavy metal.

## What It Does

metal-weather is a weather app with a twist: every time you check the forecast,
it automatically plays a heavy metal song matched to the current conditions. Rain
calls up _Raining Blood_ by Slayer. A heat wave gets something scorching.
A cold snap gets something frostier. The song selection goes beyond just the
weather code — temperature and wind speed factor in too, so the same "clear sky"
can sound very different depending on whether it's a blistering summer afternoon
or a howling winter night.

**Core features:**

- **Location search** — look up any city or US zip code, enter GPS coordinates,
  or let the browser detect your location automatically
- **Weather forecast** — current temperature and conditions plus a 12-hour
  hourly outlook
- **Auto-playing soundtrack** — a hand-curated catalog of heavy metal songs,
  each tied to specific weather conditions, plays automatically with fade in/out
- **Music player** — play, pause, and seek through the matched clip
- **Saved favorites** — bookmark locations for one-click access
- **Units and theme** — toggle between metric and imperial, and between light
  and dark themes
- **No account or API key required** — powered by free, open APIs
  ([Open-Meteo](https://open-meteo.com/) and
  [Nominatim](https://nominatim.org/))

## Stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [TypeScript 6](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
