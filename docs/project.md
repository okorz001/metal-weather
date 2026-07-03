# Metal Weather

A Next.js site that fetches the current weather for a location and plays a
heavy metal song matched to the conditions (e.g. _Raining Blood_ by Slayer for
rain).

## Current State

### What the App Does

1. User searches for a city by name via the modal, or uses the GPS button in
   `LocationBar` to detect their location via the browser Geolocation API. The
   active location is reflected in the URL as
   `?name=Seattle&lat=47.6061&lon=-122.3328`.
2. Forward and reverse geocoding (city name / US zip code → lat/lon and GPS
   coordinates → display name) both use Nominatim (OpenStreetMap).
3. Weather is fetched from Open-Meteo Forecast. The WMO weather code is mapped
   to one of seven `WeatherStatus` values; a matching song is selected from the
   JSON catalog. Catalog conditions may additionally specify numeric bounds
   (temperature, wind speed) to enable finer-grained matching within a status
   (e.g. separate songs for hot, cold, or windy clear weather). The first
   matching condition with a non-empty songs list wins, falling back to a
   generic status match and then to the error song.
4. The matched song plays automatically (HTML5 `<audio>` with fade in/out
   cropping). The user can pause, seek, and resume.
5. On any error (geocode failure, network error, unrecognized code) an error
   card is shown with a fallback song.
6. The user can bookmark the current location via the star icon in `LocationBar`.
   Favorites are persisted to `localStorage` and listed in the search modal for
   one-click access. The bookmark icon reflects the saved state and toggles
   add/remove. Each favorite can be renamed via the ✏️ button next to its name,
   which opens a modal pre-filled with the current name.

### Technology

- **Framework**: Next.js 16 (App Router, `output: "export"` for fully-static build)
- **Language**: TypeScript / React 19
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest + Testing Library

### Key Data Types

**`Song`** (`src/lib/types.ts`):

| Field       | Type     | Description                         |
| ----------- | -------- | ----------------------------------- |
| `title`     | `string` | Song title                          |
| `artist`    | `string` | Performing artist or band           |
| `audioFile` | `string` | Path to MP3 in `public/`            |
| `youtubeId` | `string` | YouTube video ID                    |
| `startTime` | `number` | Clip start (seconds)                |
| `endTime`   | `number` | Clip end (seconds)                  |
| `fadeIn`    | `number` | Fade-in duration (seconds)          |
| `fadeOut`   | `number` | Fade-out duration (seconds)         |
| `coverArt?` | `string` | Path to cover art JPEG in `public/` |

**`SongCondition`** (`src/lib/types.ts`):

| Field                       | Type            | Description                                                                    |
| --------------------------- | --------------- | ------------------------------------------------------------------------------ |
| `status`                    | `WeatherStatus` | Weather status this condition matches                                          |
| `minTemperatureFahrenheit?` | `number`        | Lower inclusive temperature bound (°F); absent means no lower bound            |
| `maxTemperatureFahrenheit?` | `number`        | Upper inclusive temperature bound (°F); absent means no upper bound            |
| `minWindSpeedMph?`          | `number`        | Lower inclusive wind speed bound (mph); absent means no bound                  |
| `songs`                     | `Song[]`        | Songs for this condition; an empty array causes fall-through to the next match |

**`SongContext`** (`src/lib/types.ts`) — numeric weather measurements passed to
`pickSong` to enable condition-specific matching:

| Field                    | Type            | Description               |
| ------------------------ | --------------- | ------------------------- |
| `status?`                | `WeatherStatus` | Current weather status    |
| `temperatureFahrenheit?` | `number`        | Current temperature in °F |
| `windSpeedMph?`          | `number`        | Current wind speed in mph |

**`WeatherData`** (`src/lib/types.ts`) — current conditions plus today's
high/low, all numeric fields provided in both metric and imperial units.
Includes feels-like (apparent) temperature and relative humidity.
Includes an `hourly` block with the next 12 hours of temperatures
and `WeatherStatus` values pre-derived from WMO codes.

**`Location`** (`src/lib/types.ts`) — a resolved location with `displayName`,
`lat`, and `lon`. Used for saved favorites (persisted as a JSON array under the
`"favorites"` `localStorage` key) and as the canonical location type throughout
the app.

### Components

| Component             | Role                                                                                                                               |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `AppBar`              | Top navigation bar with settings (units toggle, dark/light theme)                                                                  |
| `LocationBar`         | Persistent bar showing current location; GPS, open-modal, and bookmark buttons                                                     |
| `LocationModal`       | Full-screen overlay with `LocationSearch` form and saved favorites list; opens `RenameFavoriteModal`                               |
| `RenameFavoriteModal` | Centered modal for editing a favorite's display name                                                                               |
| `LocationSearch`      | Text input + Go button                                                                                                             |
| `WeatherCard`         | Current temperature, condition icon, hi/lo, wind speed with compass direction, precipitation, feels-like temperature, and humidity |
| `SongCard`            | Cover art, song title/artist, `MusicPlayer` controls                                                                               |
| `HourlyForecast`      | Horizontally scrolling 12-hour strip (temp + icon + hour)                                                                          |
| `WeatherIcon`         | Inline SVG condition icon (one per `WeatherStatus`), sized at `1em` to scale with the surrounding font                             |
| `ErrorCard`           | Error message + fallback song                                                                                                      |
| `MusicPlayer`         | HTML5 audio player with play/pause, seek, and time display                                                                         |
| `Spinner`             | Centered animated loading indicator shown during weather fetches                                                                   |
| `HomeContent`         | Orchestrates all search state and renders the above cards                                                                          |
| `SettingsContext`     | React context for unit system (metric / imperial) and theme                                                                        |
| `FavoritesContext`    | React context for saved locations, backed by `localStorage`                                                                        |
| `MockWeatherContext`  | React context exposing mock weather overrides parsed from `_`-prefixed query params (dev/testing)                                  |

### External APIs (Free, No API Key)

| API                       | Purpose                                                               |
| ------------------------- | --------------------------------------------------------------------- |
| Nominatim (OpenStreetMap) | City name / US zip code → lat/lon/displayName; lat/lon → display name |
| Open-Meteo Forecast       | lat/lon → current weather + hourly 12-hour forecast                   |

### URL Parameters

The active location is stored in three query parameters. `lat` and `lon` are
canonical — they drive the weather fetch directly. `name` is the human-readable
display name shown in `LocationBar`.

Every user action (text search, coordinate input, GPS, select favorite) writes
all three parameters to the URL so the result is always bookmarkable and
reloadable. If only some parameters are present on load, the missing ones are
resolved and the URL is updated before fetching. With no parameters, the search
modal opens.

#### Mock Data Parameters (Development / Testing)

To exercise rare weather conditions without hitting real data, any top-level
property of `WeatherData` can be overridden with an underscore-prefixed query
parameter, e.g. `?_status=Thunderstorm` or `?_temperatureCelsius=5`. The
underscore prefix distinguishes development params from the canonical
`name`/`lat`/`lon`.

`MockWeatherProvider` parses these params into a partial `WeatherData` and
`HomeContent` (the rendering layer) shallow-merges them on top of the real
fetched data before display, re-deriving the song from the merged status. The
overrides are never passed to the data layer (`fetchWeather`), and the merge is
shallow, so an array/object property such as `hourly` would be replaced
entirely if specified. Numeric values are coerced to numbers; all other values
remain strings.

#### URL Load Sequences

**All three parameters present** — weather is fetched directly, no geocoding:

```mermaid
sequenceDiagram
    participant App as HomeContent
    participant OpenMeteo as Open-Meteo

    Note over App: ?name=Seattle&lat=47.6&lon=-122.3
    App->>OpenMeteo: fetchWeather(47.6, -122.3)
    OpenMeteo-->>App: WeatherData
```

**Coordinates only, no `name`** — reverse geocoded first, URL updated with resolved name:

```mermaid
sequenceDiagram
    participant App as HomeContent
    participant Nominatim
    participant OpenMeteo as Open-Meteo

    Note over App: ?lat=47.6&lon=-122.3
    App->>Nominatim: reverseGeocode(47.6, -122.3)
    Nominatim-->>App: "Seattle, WA"
    App->>App: replace URL → ?name=Seattle%2C+WA&lat=47.6&lon=-122.3
    App->>OpenMeteo: fetchWeather(47.6, -122.3)
    OpenMeteo-->>App: WeatherData
```

**Name only, no coordinates** — geocoded first, URL updated with resolved coordinates:

```mermaid
sequenceDiagram
    participant App as HomeContent
    participant Nominatim
    participant OpenMeteo as Open-Meteo

    Note over App: ?name=Seattle
    App->>Nominatim: geocodeLocation("Seattle")
    Nominatim-->>App: {lat: 47.6, lon: -122.3, displayName: "Seattle, WA, US"}
    App->>App: replace URL → ?name=Seattle%2C+WA%2C+US&lat=47.6&lon=-122.3
    App->>OpenMeteo: fetchWeather(47.6, -122.3)
    OpenMeteo-->>App: WeatherData
```

### API Call Flow by Input Type

| User Action                           | API Calls                                              |
| ------------------------------------- | ------------------------------------------------------ |
| Type city name or zip code            | Nominatim → Open-Meteo                                 |
| Type coordinates (e.g. `47.6,-122.3`) | Nominatim (reverse) → Open-Meteo                       |
| GPS button                            | Browser Geolocation → Nominatim (reverse) → Open-Meteo |
| Select saved favorite                 | Open-Meteo only                                        |

#### User Action Sequences

**City name or zip code:**

```mermaid
sequenceDiagram
    actor User
    participant App as HomeContent
    participant Nominatim
    participant OpenMeteo as Open-Meteo

    User->>App: submit "Seattle"
    App->>Nominatim: geocodeLocation("Seattle")
    Nominatim-->>App: {lat: 47.6, lon: -122.3, displayName: "Seattle, WA, US"}
    App->>App: push URL → ?name=Seattle%2C+WA%2C+US&lat=47.6&lon=-122.3
    App->>OpenMeteo: fetchWeather(47.6, -122.3)
    OpenMeteo-->>App: WeatherData
```

**Coordinate input (e.g. `47.6,-122.3`):**

```mermaid
sequenceDiagram
    actor User
    participant App as HomeContent
    participant Nominatim
    participant OpenMeteo as Open-Meteo

    User->>App: submit "47.6,-122.3"
    App->>Nominatim: reverseGeocode(47.6, -122.3)
    Nominatim-->>App: "Seattle, WA"
    App->>App: push URL → ?name=Seattle%2C+WA&lat=47.6&lon=-122.3
    App->>OpenMeteo: fetchWeather(47.6, -122.3)
    OpenMeteo-->>App: WeatherData
```

**GPS button:**

```mermaid
sequenceDiagram
    actor User
    participant App as HomeContent
    participant Geo as Geolocation API
    participant Nominatim
    participant OpenMeteo as Open-Meteo

    User->>App: click GPS button
    App->>Geo: getCurrentPosition()
    Geo-->>App: {lat, lon}
    App->>Nominatim: reverseGeocode(lat, lon)
    Nominatim-->>App: "Seattle, WA"
    App->>App: push URL → ?name=Seattle%2C+WA&lat=...&lon=...
    App->>OpenMeteo: fetchWeather(lat, lon)
    OpenMeteo-->>App: WeatherData
```

**Select saved favorite:**

```mermaid
sequenceDiagram
    actor User
    participant App as HomeContent
    participant OpenMeteo as Open-Meteo

    User->>App: click saved favorite
    App->>App: push URL → ?name=...&lat=...&lon=...
    App->>OpenMeteo: fetchWeather(lat, lon)
    OpenMeteo-->>App: WeatherData
```

### Song Catalog

Defined in `src/data/songs.json`. The `conditions` array is matched in order:
`pickSong` returns the first song from the first condition where the status
matches, all specified numeric bounds are satisfied by the current `SongContext`,
and the `songs` array is non-empty. Conditions with empty `songs` arrays act as
placeholders and fall through to the next matching entry. A generic (no numeric
bounds) entry at the end of each status group serves as a fallback. The top-level
`error` entry provides a fallback when no condition matches or weather data is
unavailable. Cover art JPEGs are stored alongside MP3s in `public/assets/`.
