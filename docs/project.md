# Plan: Implement Full Metal Weather App

## Context

The repo is a Next.js 16 / React 19 skeleton with only a static landing page. This plan builds out the full feature: location search → geocoding → weather fetch → condition-matched song → weather display with an embedded YouTube player, running entirely client-side with no server components or API routes.

Key requirements:
- Errors: full error card styled like a weather card, with a generic error song
- Song catalog: JSON data file (imported directly into the client bundle — no extra dependency)
- Error songs: one or more generic songs
- Weather fields shown: temperature (C/F toggle), wind speed + direction, humidity, precipitation
- Song player: embedded YouTube `<iframe>`
- All data fetching happens in the browser (no Next.js API routes, no SSR data fetching)

---

## Architecture

### External APIs (both free, no API key)

| API | Purpose |
|-----|---------|
| Open-Meteo Geocoding | City name → lat/lon/displayName |
| Open-Meteo Forecast | lat/lon → current weather (WMO code + fields) |

Open-Meteo geocoding endpoint: `https://geocoding-api.open-meteo.com/v1/search?name=<query>&count=1&language=en&format=json`
Open-Meteo forecast endpoint: `https://api.open-meteo.com/v1/forecast?latitude=<lat>&longitude=<lon>&current=temperature_2m,wind_speed_10m,wind_direction_10m,relative_humidity_2m,precipitation,weather_code`

### Request Flow (all client-side)

1. User types a location and submits
2. Client calls Open-Meteo Geocoding → gets lat/lon/displayName
3. Client calls Open-Meteo Forecast → gets current conditions
4. Client looks up WMO weather code in song catalog JSON → picks a song
5. Renders WeatherCard (success) or ErrorCard (any failure)

### Static Export

Add `output: 'export'` to `next.config.ts` so the build produces a fully static `out/` directory. The `npm run dev` server continues to work for local development.

---

## File Changes

### New Files

**`src/data/songs.json`** — Song catalog imported directly. Structure:

```json
{
  "conditions": [
    {
      "label": "Clear Sky",
      "codes": [0, 1],
      "songs": [
        { "title": "Highway to Hell", "artist": "AC/DC", "youtubeId": "..." }
      ]
    }
  ],
  "error": {
    "label": "System Error",
    "songs": [
      { "title": "The Wicker Man", "artist": "Iron Maiden", "youtubeId": "..." }
    ]
  }
}
```

Initial condition-to-song mapping (WMO groups). Use web search during implementation to verify YouTube IDs (prefer official uploads):

| Condition | WMO Codes | Song | Artist |
|-----------|-----------|------|--------|
| Clear Sky | 0, 1 | Highway to Hell | AC/DC |
| Partly Cloudy | 2 | Black | Metallica |
| Overcast | 3 | The Trooper | Iron Maiden |
| Foggy | 45, 48 | War Pigs | Black Sabbath |
| Drizzle | 51, 53, 55 | November Rain | Guns N' Roses |
| Rain | 61, 63, 65, 80, 81, 82 | Raining Blood | Slayer |
| Snow | 71, 73, 75, 77, 85, 86 | Snowblind | Black Sabbath |
| Thunderstorm | 95, 96, 99 | Thunderstruck | AC/DC |
| Error | — | The Wicker Man | Iron Maiden |

---

**`src/lib/types.ts`** — Shared TypeScript interfaces:
- `Song` — `{ title: string; artist: string; youtubeId?: string }`
- `SongCondition` — `{ label: string; codes: number[]; songs: Song[] }`
- `SongCatalog` — `{ conditions: SongCondition[]; error: { label: string; songs: Song[] } }`
- `WeatherData` — `{ displayName: string; temperatureCelsius: number; windSpeedKmh: number; windDirectionDeg: number; humidityPercent: number; precipitationMm: number; weatherCode: number; conditionLabel: string }`
- `WeatherResult` — union: `{ ok: true; weather: WeatherData; song: Song } | { ok: false; message: string; song: Song }`

---

**`src/lib/songs.ts`** — Catalog helpers (pure functions, imported by client):
- `pickSong(catalog: SongCatalog, weatherCode: number): { song: Song; conditionLabel: string }` — finds matching condition, picks first song; falls back to error song if no match
- `pickErrorSong(catalog: SongCatalog): Song` — returns first error song

---

**`src/lib/geocode.ts`** — Open-Meteo geocoding (runs in browser):
- `geocodeLocation(location: string): Promise<{ lat: number; lon: number; displayName: string }>` — fetches Open-Meteo geocoding API, constructs displayName from `name + admin1 + country`, throws descriptive error on no results or network failure

---

**`src/lib/weather.ts`** — Open-Meteo forecast (runs in browser):
- `fetchWeather(lat: number, lon: number, displayName: string): Promise<WeatherData>` — fetches current `temperature_2m`, `wind_speed_10m`, `wind_direction_10m`, `relative_humidity_2m`, `precipitation`, `weather_code`; maps to `WeatherData`

---

**`src/components/LocationSearch.tsx`** — Client component:
- Props: `onSearch: (location: string) => void; disabled?: boolean`
- Text input + submit button; submits on Enter or button click

---

**`src/components/WeatherCard.tsx`** — Client component:
- Props: `weather: WeatherData; song: Song`
- Shows: condition label, temperature with C/F toggle, wind speed + direction (cardinal), humidity %, precipitation mm
- "Now Playing" section with song title and artist
- If `song.youtubeId` present: renders `<iframe src="https://www.youtube.com/embed/{youtubeId}" allow="autoplay" ...>`

---

**`src/components/ErrorCard.tsx`** — Client component:
- Props: `message: string; song: Song`
- Styled consistently with WeatherCard (same dark zinc card)
- Shows error message and song info + YouTube embed

---

### Modified Files

**`next.config.ts`** — Add `output: 'export'` for true static build.

**`.gitignore`** — Append `/out` so the static export directory is not committed.

**`src/app/page.tsx`** — Thin shell (no `"use client"`) that wraps `<HomeContent>` in a `<Suspense>` boundary. This is required by Next.js static export when a child uses `useSearchParams`.

**`src/components/HomeContent.tsx`** — `"use client"` component that owns all app logic:
- Reads `?q=` search param via `useSearchParams()`; auto-triggers search on mount when param is present
- State: `result: WeatherResult | null`, `loading: boolean`
- `handleSearch(location)`: calls `geocodeLocation` → `fetchWeather` → `pickSong`, then calls `router.push('/?q=<location>')` to update the URL (enables back/forward and bookmarking); catches errors and sets error result with `pickErrorSong`
- Browser back/forward navigation re-triggers the search via the `useSearchParams` effect
- Renders `<LocationSearch>` always, then loading indicator / `<WeatherCard>` / `<ErrorCard>`

**`src/app/page.test.tsx`** — Update tests:
- Location search input renders on initial load
- Mocked fetch: success path renders weather + song, error path renders ErrorCard
- URL param `?q=Seattle` on initial render triggers an automatic search

---

## Testing

New test files:
- `src/components/HomeContent.test.tsx` — `?q=` param auto-triggers search on mount; `handleSearch` updates URL; back navigation re-fetches
- `src/lib/songs.test.ts` — `pickSong` (correct match, unknown code falls back to error song), `pickErrorSong`
- `src/lib/geocode.test.ts` — mocked `fetch`: success path, no-results path, network error
- `src/lib/weather.test.ts` — mocked `fetch`: success path, API error
- `src/components/LocationSearch.test.tsx` — renders, submits on Enter, submits on button click
- `src/components/WeatherCard.test.tsx` — renders all weather fields, C/F toggle works, iframe present when youtubeId set, absent when not
- `src/components/ErrorCard.test.tsx` — renders message and song

---

## Verification

```sh
npm run verify   # format:check + lint + test + build must all pass
```

Manual smoke test: `npm run dev`, search a city, confirm weather data and YouTube embed render in browser.
