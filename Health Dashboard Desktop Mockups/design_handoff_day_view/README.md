# Handoff: Meridian — DAY view (desktop)

## Overview

The DAY view is the home screen of Meridian, a personal health dashboard for a sleep-focused athlete. It answers one question for one date: *how did this day go, and how does it set up tonight?* Three headline scores sit at the top, a single fixed 24-hour timeline occupies the middle, and three supporting panels sit below.

Two structural ideas drive everything:

1. **The screen is date-addressed, not "today".** A stepper and a ±7-day strip move the cursor. Past days read as recorded; future days read as planned. Today is just the default cursor position.
2. **The timeline is always exactly 24 hours.** Midnight to midnight, never zoomed, never rescaled. Four lanes share one x-axis so a heart-rate bump can be read straight down into "commute" or "REM". The app's global range selector (24H / 7D / 30D / 90D / 1Y / Custom) stays visible in the context bar but is disabled on this screen, labelled `LOCKED ON DAY`.

## About the design files

`day-view-3a.html` is a **design reference created in HTML** — a static prototype showing intended look and structure. It is not production code and should not be copied into the app. The task is to **recreate this design in the dashboard repo's existing environment**, using its established component patterns, styling approach, and charting libraries. If the repo has no front-end environment yet, pick the framework that best fits the project and build it there.

The prototype hardcodes one day of plausible data (Sunday 23 Aug 2026, 09:41 local). Every number is placeholder — the real values come from the backend. `backend-data-questions.md` in the parent project is the companion document describing what data each element needs.

## Fidelity

**High fidelity.** Colors, typography, spacing, and lane geometry are final and intentional. Recreate pixel-accurately using the codebase's own primitives. Exact values are in *Design tokens* below.

One caveat: the prototype fakes the charts with absolutely-positioned divs because it is a static mock. In the real implementation, **the heart-rate candles, sleep-stage lane, and movement lane should be rendered by whatever charting approach the repo already uses** (SVG, canvas, D3, a chart library). Match the visual result, not the div technique. The plan lane and the strip are ordinary layout, not charts.

---

## Layout

Root container: fixed **1320 × 940 px** in the mock, background `#0C0A11`, color `#EFECF5`, `display:flex; flex-direction:column`. In production this is a full-window desktop layout: the four horizontal bands keep fixed heights and the content region flexes.

Bands top to bottom:

| Band | Height | Background | Notes |
|---|---|---|---|
| Menu bar | 38px | `#08060C` | Bottom border `1px solid #1D1826` |
| Context bar | 40px | `#0C0A11` | Bottom border `1px solid #1D1826` |
| Day strip | 54px | `#08060C` | Bottom border `1px solid #1D1826` |
| Content | flex:1 | `#0C0A11` | `padding: 14px 16px 16px`, `display:flex; flex-direction:column; gap:12px` |

Content region children:
1. **Pillar row** — `display:grid; grid-template-columns:repeat(3,1fr); gap:12px`, `flex:none`, intrinsic height (~118px).
2. **Timeline card** — `flex:1; min-height:0`.
3. **Panel row** — `display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; height:158px; flex:none`.

### The clipped-corner motif

Every card and most controls use a 45° notch on the bottom-right corner, via `clip-path: polygon(0 0, 100% 0, 100% calc(100% - Npx), calc(100% - Npx) 100%, 0 100%)`. Notch sizes: **15px** on pillar cards and panel cards, **16px** on the timeline card, **8px** on the range selector, **7px** on context-bar dropdown buttons, **6px** on the TODAY chip and the logo mark. This is the single most identifiable brand element — keep it. If the repo's CSS pipeline makes `clip-path` awkward, a shared utility class or mixin taking the notch size is the right abstraction.

---

## Band 1 — Menu bar (38px)

- **Logo mark**: 14×14px, `#A97BFF`, 6px notch. Then wordmark `MERIDIAN`, Iceland 18px, `letter-spacing:.14em`. The pair has `padding-right:18px`.
- **Six menus**: `DAY` (active), `SLEEP`, `RECOVERY`, `STRAIN`, `BODY`, `DATA`, `VIEW`. Iceland 15px, `letter-spacing:.08em`, `padding: 0 13px`, full 38px height, each followed by a 9px `▼` caret.
  - Active: color `#EFECF5`, background `#15121C`, `box-shadow: inset 0 -2px 0 #A97BFF` (an inset underline, not a border — it must not shift layout).
  - Inactive: color `#9A93AB`, caret `#5E5870`, transparent background.
  - Hover should adopt the active background without the underline.
- **Right cluster**: `BAND 87%`, `SYNC 4M`, `LF`. JetBrains Mono 9.5px, `letter-spacing:.08em`, color `#5E5870` (the user initials `LF` at `#9A93AB`), `gap:14px`, pushed right with `margin-left:auto`.

The dropdown contents are documented in turn 2 of the parent design file (`Health Dashboard.dc.html`, option `2c`) — not repeated here.

## Band 2 — Context bar (40px)

`padding: 0 16px`, `gap:12px`, items vertically centered. Left to right:

1. **Date stepper** — three joined 24px-tall cells, `gap:1px`, borders `1px solid #241D30`:
   - `‹` button, 24×24px, JetBrains Mono 11px, `#9A93AB`.
   - Date cell: background `#15121C`, `padding: 0 12px`, no left/right border. Contains `SUN 23 AUG` (Iceland 18px, `letter-spacing:.1em`) then `2026 · DAY 235` (JetBrains Mono 9px, `#5E5870`, `letter-spacing:.08em`), `gap:9px`.
   - `›` button, mirror of `‹`.
2. **TODAY chip** — height 24px, `padding: 0 9px`, background `#6B3FD4`, white JetBrains Mono 9px `500`, `letter-spacing:.1em`, 6px notch. Returns the cursor to today; should be disabled or hidden when already on today.
3. **Divider** — 1×16px, `#241D30`.
4. **DAY START 00:00 ▾** — outlined dropdown, `1px solid #241D30`, height 24px, `padding: 0 10px`, JetBrains Mono 9.5px `#9A93AB`, `letter-spacing:.06em`, 7px notch. Pivots the axis origin so a night can be seen whole (e.g. 18:00 → 18:00). **Open question for the user — 18:00 may become the default.** Build the axis origin as a parameter, not a constant.
5. **COMPARE ▾** — same treatment. Overlays another day's HR/sleep as a ghost series.
6. **Right cluster** — `RANGE` label (JetBrains Mono 9px, `#5E5870`, `letter-spacing:.14em`), then the six-segment range selector, then `LOCKED ON DAY` (JetBrains Mono 8px).
   - Selector: single bordered strip, `1px solid #241D30`, 8px notch, **`opacity:.55` on this screen** because it is disabled. Segments height 24px, `padding: 0 11px`, JetBrains Mono 9.5px, `letter-spacing:.06em`. Active `24H` = background `#6B3FD4`, white, with a trailing 8px `▮`; inactive `#5E5870`.
   - This selector is shared chrome across every screen in the app — extract it as a component with a `disabled` state.

## Band 3 — Day strip (54px)

A scrubbable ±7-day strip. `padding: 0 16px`.

- **Legend block** (left): two stacked labels, `RECORDED` (`#5E5870`) and `PLANNED` (`#6B3FD4`), JetBrains Mono 8px, `letter-spacing:.12em`, `gap:2px`, `padding-right:12px`, `border-right:1px solid #1D1826`, `margin-right:10px`.
- **Day cells**: `display:flex; gap:3px`, each `flex:1`, background `#0C0A11`, `padding: 0 6px`, `gap:4px` internally.
  - Top row: weekday + date (`MON 17`) left, recovery score right. JetBrains Mono 8.5px, `#5E5870`.
  - Bottom row: three 5px-tall bars, `gap:2px`, `flex:1` each — sleep (blue), recovery (green/yellow), strain (orange/red) — using the pillar hues at varying opacity as a sparkline-grade summary. Deliberately low resolution.
  - **Selected day** (`SUN 23`): `flex:1.35`, background `#15121C`, `border:1px solid #A97BFF`, `padding: 0 8px`, label color `#EFECF5` weight 500, score in `#4FC98A`, bars at full opacity.
  - **Future days** (`MON 24` onward): `border:1px dashed #302842`, score replaced by `PLAN` in `#6B3FD4`, bars flattened to `#302842` / `#3E2E6E`.
- The mock shows 6 past + selected + 3 future. Real behavior: horizontally scrubbable, selected cell kept in view.

---

## Pillar cards (3 × equal)

All three: background `#15121C`, `border:1px solid #241D30`, a **2px top border in the pillar hue**, 15px notch, `padding: 13px 17px 12px`.

Shared internal structure:
- Header row, `justify-content:space-between; align-items:baseline`: pillar name in Iceland 16px, `letter-spacing:.12em`, in the pillar hue; right-side qualifier in JetBrains Mono 9px `#5E5870`, `letter-spacing:.08em`.
- Value row, `margin: 7px 0 9px`, `gap:8px`, `align-items:baseline`: big number JetBrains Mono **700 34px**, `letter-spacing:-.03em`; delta JetBrains Mono 500 11px (green `#4FC98A` for good, `#5E5870` for neutral); right-aligned context in JetBrains Mono 9px `#5E5870`.
- A 7px-tall bar.
- Footer row of 3–4 metrics, `justify-content:space-between`, JetBrains Mono 8.5px `#5E5870`, `margin-top:6px`.

| | SLEEP | RECOVERY | STRAIN |
|---|---|---|---|
| Hue (top border, title) | `#6E9CFF` | `#4FC98A` | `#F59A3E` |
| Qualifier | `96% OF NEED` | `HIGH` | `TARGET 14.0` |
| Value | `7:42` | `82%` (the `%` is 16px weight 400 `#5E5870`) | `6.4` |
| Delta | `+0:34` | `+11` | `46% OF PLAN` |
| Context | `00:04 → 07:04` | `14D AVG 71` | `RUN AT 17:35` |
| Bar | 4 stage segments, `gap:2px`, flex `2.2 / 1.5 / 3.1 / .6` in `#6E9CFF` `#4A78D6` `#2E4A8A` `#241D30` | track `#241D30`, fill `#4FC98A` to 82%, plus a 2px `#EFECF5` baseline marker at 71% overhanging 3px top and bottom | track `#241D30`, fill `#F59A3E` to 30%, `#EFECF5` marker at 66% |
| Footer | `DEEP 1:38` `REM 2:04` `LGT 3:32` `AWK 0:28` | `HRV 64ms` `RHR 48` `RESP 14.2` `SKIN -0.2` | `STEPS 11,204` `KCAL 2,684` `ZONE 3+ 0:26` |

The white overhanging marker means "your recent baseline" and recurs across the app — worth a small shared component.

---

## The 24-hour timeline (the core of the screen)

Card: background `#15121C`, `border:1px solid #241D30`, 16px notch, `padding: 14px 20px 12px`, `flex:1; min-height:0`, column flex.

### Card header
`margin-bottom:11px`, `align-items:baseline`, `gap:14px`:
- Title `24-HOUR TIMELINE`, Iceland 17px, `letter-spacing:.12em`.
- Subtitle `00:00 → 24:00 · HR CANDLES · SLEEP STAGES · MOVEMENT · PLAN`, JetBrains Mono 9px `#5E5870`.
- Right: the HR intensity legend — `40`, a 120×7px six-stop swatch, `180 BPM AVG`. Stops in order: `#3FC4D9` `#6E9CFF` `#4FC98A` `#D9C13A` `#F59A3E` `#FF6B7A`.

### Structure
`display:flex; gap:9px; flex:1; min-height:0`. A 30px fixed gutter on the left, then the plot column.

**Gutter** (30px, right-aligned, JetBrains Mono 8.5px `#5E5870`): HR axis labels `180 / 145 / 110 / 75 / 40` distributed with `justify-content:space-between` over the HR lane's height; a 14px spacer matching the x-axis strip; then lane names `SLEEP`, `MOVE`, `PLAN` at 7.5px, `letter-spacing:.08em`, each vertically centered against its lane.

**Plot column** — `position:relative`, column flex. Lane stack:

| Lane | Height | Background |
|---|---|---|
| HR candles | `flex:1; min-height:0` | `#100D17`, `border-left:1px solid #241D30`, `border-bottom:1px solid #241D30` |
| X-axis labels | 14px | transparent |
| Sleep | 30px | `#100D17`, `border-left:1px solid #241D30` |
| Movement | 22px, `margin-top:4px` | same |
| Plan | 46px, `margin-top:8px` | same |

**Every lane maps time → x identically.** One hour = `100/24 = 4.1667%`. All positions below are percentages of the same axis, which is what makes vertical reading work. Implement the axis scale once and share it.

### Lane 1 — Heart-rate candlesticks

- **Y scale**: 40–180 bpm, linear, top = 180.
- **Grid**: horizontal 1px `#1D1826` lines at 25% / 50% / 75%. A resting-HR reference line at 65.7% (= 48 bpm) in `#A97BFF` at `opacity:.45`, labelled `RHR 48` (JetBrains Mono 8px, `#A97BFF`) sitting just above the line at the right edge.
- **Sleep shading**: a block from 0 to 29.17% (00:00–07:00) in `#0D1226` — a colder ground tone marking the sleep window behind the candles.
- **Candles**: 24 hourly slots, `display:flex; gap:2px`, each `flex:1`:
  - **Wick**: 1px centered vertical line from max to min, at `opacity:.5`.
  - **Body**: filled block spanning the interquartile range, insets 1px from the slot edges.
  - **Fill color**: the zone color of the hour's *average* bpm, from the six-stop ramp. Currently: `#3FC4D9` <60, `#6E9CFF` 60–95, `#4FC98A` 95–115, `#D9C13A` 115–135, `#F59A3E` 135–155, `#FF6B7A` 155+.
  - ⚠ **Open item:** those cut points are placeholders. They should come from the user's personal zone thresholds (LT2 test), so the ramp means the same thing in every chart. Read them from config/API, do not hardcode.
- **Future hours**: hours at or after `now` draw **only a 1px `#241D30` baseline** at the bottom of the lane — no candle, no forecast. In the mock, hours 10–23.
- **Tooltip** (hover state, shown statically in the mock as an example): background `#241D30`, `border:1px solid #302842`, `padding: 5px 8px`, JetBrains Mono 8.5px `line-height:1.6`. Two lines: `09:00–09:41 · WORK` then `MAX 92 · MIN 58 · AVG 74` with MAX in `#FF6B7A` and MIN in `#9A93AB`. Note the tooltip includes **the plan block name for that hour** — it reads across lanes. Positioned to the side of the cursor, offset 8px, and vertically below the overlay labels (`top:38px`) so it never covers the ALARM/NOW times.

### X-axis strip (14px)
Twelve `flex:1` cells labelled `00 02 04 … 22`, JetBrains Mono 8px `line-height:14px`, `#5E5870`. The final cell also carries a right-anchored `24`.

### Lane 2 — Sleep stages (30px)

Absolutely-positioned segments, each `left`/`width` as a percentage of 24h. Stage determines vertical offset and color — **a step chart, not a stacked bar**:

| Stage | `top` | Height | Color |
|---|---|---|---|
| Awake | 2px | 5px | `#3E2E6E` |
| REM | 8px | 8px | `#6E9CFF` |
| Light | 13px | 8px | `#4A78D6` |
| Deep | 20px | 8px | `#2E4A8A` |

Segments in the mock (00:00–07:00): awake 0–1.39%, deep 1.39–6.94%, light 6.94–10.42%, REM 10.42–13.54%, light 13.54–18.06%, deep 18.06–20.83%, awake 20.83–21.67%, REM 21.67–25.69%, light 25.69–29.17%. Naps use the same lane at `opacity:.75`.

Right-aligned legend inside the lane: `DEEP` `LIGHT` `REM` `AWAKE` in their own colors, JetBrains Mono 7.5px, `gap:9px`, `z-index:6` so it stays above the future dim.

### Lane 3 — Movement (22px)

24 hourly bars, `display:flex; align-items:flex-end; gap:2px`, each `flex:1`, height as % of the day's peak steps/hour, color `#A97BFF` with opacity as a second magnitude cue (`.35` for near-zero up to `1` at peak). **The workout hour switches to `#F59A3E`** so intentional effort reads differently from incidental movement. Future hours: 1px `#241D30` baseline only. Right-aligned caption `STEPS/H · PEAK 1,180 AT 08:00`, JetBrains Mono 7.5px `#5E5870`, `z-index:6`.

### Lane 4 — Plan blocks (46px)

Absolutely-positioned blocks, each: `top:0; bottom:0`, a **2px left border** in the block's accent, `padding: 6px 8px` (tighter for narrow blocks), `display:flex; flex-direction:column; justify-content:space-between` — name on top (Public Sans 600 10px), time/detail below (JetBrains Mono 8px).

| Block | Span | left / width | Background | Accent | Detail line |
|---|---|---|---|---|---|
| SLEEP | 00:00–07:00 | 0% / 29.17% | `#182448` | `#6E9CFF` | `00:00–07:00 · 7:00` (text `#C6D6FF` / `#7E93C9`) |
| WAKE | 07:00–07:50 | 29.17% / 3.47% | `#241D30` | `#A97BFF` | `07:00` |
| CMT | 07:50–08:25 | 32.64% / 2.43% | `#1A1622` | `#5E5870` | `35M` |
| WORK | 08:25–17:00 | 34.72% / 35.76% | `#1D1826` | `#C8C2D6` | `08:25–17:00 · DESK 6:10 · STOOD 1:05` |
| CMT | 17:00–17:35 | 70.83% / 2.43% | `#1A1622` | `#5E5870` | `35M` |
| RUN | 17:35–18:30 | 73.26% / 3.82% | `#3A2610` | `#F59A3E` | `55M` (text `#F9C48A` / `#B57B3C`) |
| DINNER | 18:30–19:30 | 77.08% / 4.17% | `#2E2A12` | `#D9C13A` | `18:30` (text `#E8DC93` / `#9A8F42`) |
| EVENING | 19:30–22:30 | 81.25% / 12.5% | `#15121C` | `#5E5870` | `19:30–22:30` |
| WIND DOWN | 22:30–24:00 | 93.75% / 6.25% | `#211640` | `#6B3FD4` | `22:30` (text `#C9B4FF` / `#8A73C4`) |

**Narrow-block rule:** blocks under ~40px wide drop to a 3-letter code and keep only the duration (`CMT / 35M`), with `overflow:hidden` and reduced horizontal padding. Implement as a width-driven truncation, not per-block hardcoding.

Blocks are **draggable to reschedule** — the primary interaction on a future day.

### Overlays (span all lanes, `position:absolute` on the plot column, `z-index:5`)

1. **Alarm 07:00** — 1px dashed vertical at 29.17%, `background: repeating-linear-gradient(#A97BFF 0 4px, transparent 4px 8px)`. Label `ALARM / 07:00` on two lines, right-aligned to the *left* of the line (`transform: translate(-100%,0); padding-right:5px`), JetBrains Mono 500 8px `#A97BFF`.
2. **Now 09:41** — solid 1px `#EFECF5` at 40.35%. Label `NOW / 09:41` to the right of the line (`translateX(4px)`), same type in `#EFECF5`.
3. **Bed target 00:00** — 1px dashed `#6B3FD4` on the right edge. Label `BED TARGET / 00:00` right-aligned inside the edge. Moves inboard if day start is pivoted to 18:00.
4. **Future dim** — `rgba(12,10,17,.55)` from the now line to the right edge, `z-index:4`, `pointer-events:none`. It sits *below* the overlay lines and above the lane content; lane legends are lifted to `z-index:6` to stay readable through it.

On a past day: no now line, no dim. On a future day: the whole plot is future — HR and movement lanes are empty baselines, the sleep lane shows the *projected* window back-solved from the alarm rendered as a hatch rather than a fill, and the plan lane is the point of the screen.

---

## Panel row (158px, three equal)

All three: background `#15121C`, `border:1px solid #241D30`, 15px notch, `padding: 13px 17px`, column flex. Titles Iceland 15px, `letter-spacing:.12em`.

### TIME IN ZONE
Header right: `SO FAR TODAY` (JetBrains Mono 8.5px `#5E5870`). Five rows, `gap:5px`, vertically centered, each `align-items:center; gap:9px`:
- 44px label: `Z5 175+` `Z4 155` `Z3 135` `Z2 115` `Z1 95`, JetBrains Mono 8.5px in the zone color (`#FF6B7A` `#F59A3E` `#D9C13A` `#4FC98A` `#6E9CFF`).
- Flexible 10px track, background `#100D17`, fill in the zone color at 4 / 14 / 23 / 41 / 68 %.
- 34px right-aligned duration, JetBrains Mono 500 9.5px: `0:02 0:09 0:15 0:27 1:12`.

Footer, `margin-top:8px; padding-top:7px; border-top:1px solid #241D30`, JetBrains Mono 8.5px `#5E5870`: `ZONES FROM LT2 TEST · 2026-06-14`. Zone boundaries are user data — surface the test date because it's the provenance of every color in the app.

### REST OF DAY
Header right: `PLANNED` in `#6B3FD4`. Four rows, `gap:7px`, `align-items:center; gap:10px`: a 38px time in JetBrains Mono 500 9.5px in the relevant hue, then a line of Public Sans 10px `#C8C2D6`:
- `17:35` (`#F59A3E`) — Easy 8k — hold Z2, cap at 145
- `18:30` (`#D9C13A`) — Dinner — last meal 3h before bed
- `22:30` (`#6B3FD4`) — Wind down — screens off, lights 20%
- `00:00` (`#6E9CFF`) — Bed — 7:00 to hit the 07:00 alarm

Footer as above: `DRAG A BLOCK ON THE TIMELINE TO RESCHEDULE`.

### SIGNALS
`gap:8px`. Three items, each `display:flex; gap:9px` with a 2px full-height colored rule on the left, then a headline (Public Sans 600 11px) and a supporting line (Public Sans 10px `#9A93AB`, `margin-top:2px`):
- `#6E9CFF` — "Sleep midpoint 03:32 — 26 min later than target" / "Fourth night drifting. The 07:00 alarm is the fixed end."
- `#F59A3E` — "Morning HR ceiling 20 bpm above your Sunday norm" / "Keep the 17:35 run in Z2 or the bed target slips again."
- `#4FC98A` — "Resting HR at a 90-day low" / "48 bpm, down from 53 in May."

These are generated insights, ranked, capped at three. The rule color encodes which pillar the signal belongs to.

---

## Interactions & behavior

- **Date navigation** — `‹` / `›` step one day; `TODAY` jumps to today; clicking a strip cell selects it. Left/right arrow keys should step. The date belongs in the URL so a day is linkable and the back button works.
- **Day start** — dropdown pivots the axis origin (00:00 today, 18:00 candidate default). Changing it re-lays out every lane; the overlays move with the scale.
- **Compare** — overlays another day's HR and sleep as a desaturated ghost series behind the current one.
- **Range selector** — disabled here, active on every other screen. Keep it mounted and visibly present rather than hidden.
- **Timeline hover** — a shared crosshair across all four lanes: one vertical line follows the cursor and each lane reports its value for that instant. The tooltip shows the hovered hour's HR stats *plus* the plan block name.
- **Plan blocks** — drag to move, edge-drag to resize; the pillar cards and REST OF DAY recompute against the new schedule. Snap to 5 minutes.
- **Now line** — advances live; the dim boundary follows it. A new candle appears as each hour completes.
- **Loading** — lanes render their frame, axis, and gutter immediately with empty lane bodies; do not collapse the layout or show a spinner over the whole card. Pillar values fall back to `—` at the same type size so nothing reflows on arrival.
- **Stale data** — `SYNC 4M` in the menu bar is the freshness indicator. Beyond some threshold it should warn, and the right edge of the recorded region should read as "last known", not "zero".
- **Empty day** (no wearable data) — lanes show baselines only, pillars show `—`, and the plan lane still renders. A day with no data is a valid day.
- **Responsive** — desktop-first. The timeline is the last thing to give up width; below roughly 1100px the panel row stacks before the timeline shrinks. This is not a mobile layout.
- **Hover states** are not fully specified in the mock. Default rule: interactive surfaces lift from `#15121C` to `#1D1826`, borders from `#241D30` to `#302842`, text from `#9A93AB` to `#EFECF5`. Transitions ~120ms ease-out. Nothing moves position on hover.
- **Motion** — restrained. Cross-fade values on date change (~150ms); no chart draw-in animation, no sliding lanes. The screen should feel like an instrument, not a presentation.

## State

- `selectedDate` (URL-backed), `dayStartHour` (0 or 18, persisted preference), `compareDate | null`, `now` (ticking), hover position on the timeline, and drag state for plan blocks.
- Per-date data: pillar scores, hourly HR aggregates (min / max / p25 / p75 / mean), sleep stage segments, hourly steps, workouts, plan blocks, zone minutes, signals. Plus the ±7-day summary set for the strip and rolling baselines (14-day, 90-day) for the deltas and markers.
- Prefetch the adjacent days so stepping is instant. Cache by date; a past date is immutable once the day has closed and can be cached hard.
- Zone thresholds and alarm/bed targets are user config, not per-day data — load once.

See `backend-data-questions.md` in this bundle for the full field-by-field data inventory, including which pieces likely don't exist yet (the plan blocks and the modelled recovery / strain / sleep-need scores are the two suspects).

## Design tokens

**Chrome / neutrals**
`#08060C` deepest (menu bar, strip) · `#0C0A11` page · `#100D17` lane wells · `#15121C` card surface · `#1A1622` recessed block · `#1D1826` hairline / raised block · `#241D30` border · `#302842` border hover, flattened future bar · `#3E2E6E` awake stage, muted plan bar · `#5E5870` dim text · `#9A93AB` secondary text · `#C8C2D6` bright secondary · `#EFECF5` primary text

**Brand purple** `#6B3FD4` primary action / planned · `#A97BFF` accent, selection, movement · `#211640` wind-down fill · `#C9B4FF` `#8A73C4` wind-down text

**Data hues** — sleep `#6E9CFF` (with `#4A78D6` light, `#2E4A8A` deep, `#0D1226` sleep-window ground, `#182448` sleep block fill, `#C6D6FF` / `#7E93C9` sleep block text) · recovery `#4FC98A` · strain `#F59A3E` (with `#3A2610` fill, `#F9C48A` / `#B57B3C` text) · caution `#D9C13A` (with `#2E2A12` fill, `#E8DC93` / `#9A8F42` text) · alert `#FF6B7A` · low/cold `#3FC4D9`

**HR intensity ramp** (6 stops, low→high) `#3FC4D9` `#6E9CFF` `#4FC98A` `#D9C13A` `#F59A3E` `#FF6B7A`

**Type** — three faces, strictly assigned:
- **Iceland** — all headings, labels, and menu items. Always uppercase, `letter-spacing` .08–.14em. Sizes 15 / 16 / 17 / 18 / 19px.
- **JetBrains Mono** — **every numeral in the product**, plus small technical labels. 7.5 / 8 / 8.5 / 9 / 9.5 / 10 / 11px for labels; 34px 700 for pillar values. `letter-spacing: -.03em` on the large values, .06–.14em on small caps labels.
- **Public Sans** — prose only: signal headlines (600 11px), plan/schedule descriptions (400 10px), plan block names (600 8.5–10px).

If Iceland is not already in the repo, load it from Google Fonts; it carries most of the personality and shouldn't be substituted.

**Spacing** — 2 / 4 / 6 / 7 / 8 / 9 / 10 / 12 / 14 / 16 / 17 / 20px. Card gap 12px, card padding 13px 17px, content padding 14px 16px 16px.

**Geometry** — no border radius anywhere. Corners are square, except the 45° bottom-right notch documented above. Bars, tracks, and lane wells are all hard-edged. This is deliberate: it's a measuring instrument.

## Assets

None. No images, no icon font. The few glyphs are text characters: `▼ ▾ ‹ › ▮`. The logo mark is a clipped square. If the repo has an icon set, `‹ ›` and the carets can use it; keep everything else as-is.

## Files

- `day-view-3a.html` — the DAY view design reference (this is the one to build).
- `../Health Dashboard.dc.html` — the full design document, including earlier turns: the top-menu map and dropdown contents (`2c`), the candlestick anatomy spec (`2b`), and a written spec of the timeline lanes and overlays (`3b`). Worth opening for the dropdown contents in particular.
- `backend-data-questions.md` — the data inventory and open questions for the backend (included in this bundle).

## Open questions for the user (do not decide these alone)

1. **Day start default** — 00:00 splits a night across both edges of the screen. 18:00 keeps a night whole but makes "today" less literal. The user is deciding; build it as a parameter either way.
2. **HR zone thresholds** — must come from the LT2 test values, not the placeholder bpm cut points in the mock. Blocked on where those live.
3. **Plan block source** — calendar, inferred, user-declared routine, or a mix. This changes whether the lane is editable, suggested, or both.

## Implementation notes (added post-build, not part of the original design ask)

The DAY view now exists at `/day/[date]` in the app, built from real data where it exists and honest placeholder shells everywhere it doesn't (see `backend-data-questions.md` for the corresponding data gaps). Known limitations worth tracking:

- **Health Connect data can be up to ~5 minutes stale.** The app fetches the full history from the Health Connect gateway (a local Docker container) and caches it in memory for 5 minutes to avoid re-running a login-plus-six-fetch round trip on every page load. This means a value your wearable just synced may not appear on screen for up to 5 minutes after syncing, even though the underlying request is otherwise fast (sub-second on a warm cache). If this lag ever needs to be shorter, the fix is a smaller `CACHE_TTL_MS` in `src/server/health/getDayViewSnapshot.ts` — or a push-based invalidation if the gateway can signal new data — traded against how often the whole dataset gets re-fetched.
- **All times are computed in `HEALTH_HOME_TIME_ZONE`** (see `.env.local` / `.env.example`), not the server's or the viewer's own time zone. This matters because the app is self-hosted and the Node process may run in UTC — without this, "now", the sleep-stage lane, and "today" itself can all be silently off by however many hours the server's zone differs from the user's.
