# Visual Style Guide

Rules for the visual design of Metal Weather. These are requirements, not
suggestions — new UI must follow them unless a change is discussed and this
document is updated to match (see [CLAUDE.md](../CLAUDE.md)).

## Color Palette

### Neutral Scale

All UI chrome (backgrounds, text, borders) MUST use Tailwind's `zinc` scale.
Do not introduce other neutrals (`gray`, `slate`, `neutral`) — mixing neutral
scales causes visible color-temperature mismatches between elements.

| Surface                         | Light                                          | Dark               |
| ------------------------------- | ---------------------------------------------- | ------------------ |
| Page background                 | `zinc-100`                                     | `zinc-950`         |
| Card background                 | `zinc-50`                                      | `zinc-900`         |
| Modal background                | `white`                                        | `zinc-800`         |
| App bar background              | `zinc-900` (fixed, does not change with theme) |                    |
| Primary text                    | `zinc-900`                                     | `white`/`zinc-100` |
| Secondary/muted text            | `zinc-500`/`zinc-600`                          | `zinc-400`         |
| Borders/dividers                | `zinc-200`                                     | `zinc-700`         |
| Input background                | `zinc-200`                                     | `zinc-700`         |
| Hover background (icon buttons) | `zinc-200`                                     | `zinc-700`         |

Rules:

- Card backgrounds MUST be one step lighter than the page background in both
  themes (`zinc-50` on `zinc-100`; `zinc-900` on `zinc-950`). This is the only
  visual separation cards get — cards have no border and no shadow.
- Modals are visually distinct from cards: they use `white`/`zinc-800`
  (brighter than a card) plus `shadow-xl`, signaling an overlay above the page.
- The app bar (`AppBar`) is always `zinc-900` regardless of theme — it does
  not participate in light/dark switching.

### Accent Colors

Accent colors are reserved for specific meanings and MUST NOT be reused for
unrelated UI:

| Color                               | Hex       | Meaning                                |
| ----------------------------------- | --------- | -------------------------------------- |
| Amber (`amber-500` / `#f59e0b`)     | `#f59e0b` | Sun (Clear / Partly Cloudy icons)      |
| Gray (`#9ca3af`, ~`gray-400`)       | `#9ca3af` | Cloud outlines                         |
| Blue (`blue-500` / `#3b82f6`)       | `#3b82f6` | Rain, and the "low" temperature arrow  |
| Light blue (`blue-300` / `#93c5fd`) | `#93c5fd` | Snow                                   |
| Yellow (`yellow-400` / `#facc15`)   | `#facc15` | Lightning bolt (Thunderstorm)          |
| Red (`red-500`)                     | —         | The "high" temperature arrow           |
| Red (`red-400`)                     | —         | Error state label                      |
| Yellow (`yellow-400`)               | —         | Active/filled favorite (bookmark) star |

Weather icon colors are hardcoded hex constants in `WeatherIcon.tsx` (not
Tailwind classes) so each glyph keeps its exact color on both light and dark
card backgrounds. New weather icons MUST reuse these existing constants
(`SUN`, `CLOUD`, `RAIN`, `SNOW`, `BOLT`) rather than introducing new colors.

## Typography

### Font Families

| Token        | Font                           | Usage                                                                                                                    |
| ------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `font-sans`  | Noto Sans                      | Default body font — everything not covered below                                                                         |
| `font-serif` | Jim Nightshade                 | Reserved for two "hero" spots only: the app title in `AppBar` and the large current-temperature display in `WeatherCard` |
| `font-mono`  | System mono (Tailwind default) | Numeric/time display only (`MusicPlayer` elapsed/duration)                                                               |

Rules:

- `font-serif` (Jim Nightshade, a gothic display face) is the brand accent
  and MUST stay rare. Do not apply it to body copy, buttons, or lists — it
  only belongs on the app title and the hero temperature number.
- Do not add additional font families without updating this table.

### Type Scale And Weights

- Hero numbers/icons: `text-7xl` (current temperature, current condition icon).
- App title: `text-3xl` with `font-serif`.
- Primary content: default size, `font-semibold` for emphasis (location name,
  song title uses `font-bold`).
- Secondary/metadata text: `text-xs` or `text-sm`, paired with a muted color
  (`text-zinc-500`/`600` light, `text-zinc-400` dark).
- "Eyebrow" labels (small section headers inside cards/menus, e.g. "Theme",
  "Error", "Now Playing"): MUST use
  `text-xs font-semibold tracking-wide uppercase`, colored
  `text-zinc-500 dark:text-zinc-400` (or `text-red-400` for the error label).
  Use this exact combination for any new section label of this kind.

## Layout And Spacing

- Page content is a single centered column: `max-w-3xl`, vertical rhythm via
  `space-y-2` between stacked cards.
- Cards MUST use `rounded-lg`, `p-2` padding, no border, no shadow. Background
  per the [Neutral Scale](#neutral-scale) table above.
- Modals MUST use `rounded-lg`, `p-4` padding, `shadow-xl`, and a
  `bg-black/50` full-screen backdrop (`fixed inset-0`). Stack overlays with
  incrementing `z-*` (the base modal is `z-50`; a modal opened on top of
  another, like `RenameFavoriteModal` over `LocationModal`, is `z-60`).
- The app bar is `fixed top-0`, `h-14`, with a `shadow-md` — it is the one
  piece of chrome that uses a shadow instead of a background-color step, since
  it sits above the page rather than being a card within it.
- Icon-only buttons MUST use the shared pattern:
  `rounded p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50`.
  Larger icon buttons (e.g. GPS, search) use `rounded-lg px-2` instead of
  `rounded p-1`.
- Text inputs MUST use:
  `rounded-lg bg-zinc-200 px-2 py-2 focus:ring-2 focus:ring-zinc-400 focus:outline-none dark:bg-zinc-700 dark:focus:ring-zinc-500`.
- Primary action buttons (e.g. "Save") MUST use:
  `rounded-lg bg-zinc-400 px-3 py-2 text-white hover:bg-zinc-500 dark:bg-zinc-600 dark:hover:bg-zinc-500`.
- Segmented toggle controls (e.g. Light/Dark, Metric/Imperial) MUST use:
  `flex-1 rounded-md py-1.5 text-sm font-medium transition-colors`, with the
  active option `bg-zinc-200 text-zinc-900 dark:bg-zinc-600 dark:text-white`
  and the inactive option
  `text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200`.

## Icons

All icons are inline SVG components in `WeatherIcon.tsx` (or inlined directly
for one-off UI icons like close/search/GPS). New icons MUST follow the
existing conventions:

- 24x24 `viewBox`, drawn at `1em` size so they scale with surrounding text.
- `strokeWidth={2}`, `strokeLinecap="round"`, `strokeLinejoin="round"`,
  `fill="none"` by default (only filled where the glyph calls for it, e.g.
  the lightning bolt, play/pause bars, the water drop, a filled favorite star).
- Generic UI icons (menu, close, search, GPS, bookmark, edit, trash) MUST use
  `stroke="currentColor"` so they inherit the surrounding text color and need
  no separate dark-mode variant.
- Weather-condition icons use the fixed accent hex constants from the
  [Accent Colors](#accent-colors) table instead of `currentColor`, since they
  must keep a consistent, weather-appropriate hue on both card backgrounds.
- Every icon component exposes an accessible name via `role="img"` and
  `aria-label` (handled by the shared `Glyph` wrapper in `WeatherIcon.tsx`) —
  do not render a bare `<svg>` without one.
- When a new icon shares a silhouette with an existing one at a different
  size (e.g. `Partly Cloudy`'s cloud vs. `Overcast`'s cloud), reuse the same
  `d` path via an SVG `transform` (`scale`/`translate`) rather than hand-drawing
  a second, slightly different shape. This keeps the family visually
  consistent and is a single source of truth if the shape ever changes.

## Interactive States

- Hover: subtle background shift only (`hover:bg-zinc-200` /
  `dark:hover:bg-zinc-700` for icon buttons; darker/lighter shade for filled
  buttons). No hover color change on icon strokes themselves.
- Disabled: `disabled:opacity-50` (icon buttons, inputs) or `opacity-40` for
  the compact `MusicPlayer` controls; pair with `disabled:cursor-not-allowed`
  where the control is otherwise clickable-looking (sliders, play button).
- Focus: text inputs MUST show `focus:ring-2 focus:ring-zinc-400
focus:outline-none` (`dark:focus:ring-zinc-500` in dark mode). Buttons rely
  on the browser default focus indicator — do not suppress it with
  `focus:outline-none` unless a replacement ring is also added.
- Transitions: use `transition-colors` on elements that switch background
  color based on state (segmented toggle buttons). Do not add motion/transform
  transitions elsewhere — the app's interactions are deliberately static.

## Dark Mode

- Dark mode is class-based (`.dark` on a wrapper `div`), toggled by the user
  and persisted to `localStorage`, defaulting to dark. It is not driven by
  `prefers-color-scheme` alone.
- Every color decision in this document is expressed as a light/dark pair.
  New components MUST specify both — there is no acceptable "light mode only"
  or "dark mode only" styling.

## Checklist For New Components

Before adding a new card, modal, button, or icon, confirm:

- [ ] Backgrounds use only `zinc-*` neutrals, following the light/dark pairs
      in [Neutral Scale](#neutral-scale).
- [ ] Any new accent color is justified by a new _meaning_ (not decoration)
      and added to the [Accent Colors](#accent-colors) table.
- [ ] `font-serif` is not used outside the app title and hero temperature.
- [ ] Cards: `rounded-lg`, `p-2`, no border, no shadow. Modals: `rounded-lg`,
      `p-4`, `shadow-xl`, `bg-black/50` backdrop.
- [ ] Icon buttons, inputs, and primary buttons reuse the exact class strings
      in [Layout And Spacing](#layout-and-spacing) rather than inventing new
      variants.
- [ ] New icons match the SVG conventions in [Icons](#icons), including an
      accessible name.
- [ ] Both light and dark styling are specified together.
