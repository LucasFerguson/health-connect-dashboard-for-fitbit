# Manual test checklist

Things only a person with the phone and a browser can verify. An item is
checked off only after Lucas confirms it, never because code was written or
an automated check passed. Newest items at the top of each section.

Dashboard: http://192.168.8.239:3000 (prod), http://192.168.8.239:3001 (dev).

## Waiting on you

### Day view: date strip, recovery card, HR chart (committed 2026-10-18, on dev :3001 only; not deployed, not checked in a browser)
On http://192.168.8.239:3001/day at desktop width and on your phone:
- [ ] The date strip never scrolls sideways: it shows only as many days as fit, with the selected day in the middle (about 5 on a phone, more as the window widens, up to 15). Narrow the desktop window and days drop off both ends evenly.
- [ ] On a phone the RECORDED/PLANNED legend is gone and the date labels aren't cut off.
- [ ] The middle (green) bar in each strip cell now shows recovery; days without a score show it faint.
- [ ] The RECOVERY card shows the score (0-100) for a day that has one on `/recovery`, labelled PROVISIONAL (or PROVISIONAL · PARTIAL), and the bar fills to match. A day with no score still shows "—".
- [ ] 24-hour timeline: the HR dropdown switches between CANDLESTICK (5-minute candles) and LINE (1-minute line, colored by bpm); the subtitle says which. The choice sticks after a reload.
- [ ] The candles and line line up with the hour labels and sleep stages, and gaps in wear show as gaps.
- [ ] The day page doesn't feel noticeably slower to load (it now also reads that day's raw heart-rate samples).

### Mobile cleanup (deployed 2026-10-18; checked in headless Chromium at 390px, not yet on your phone)
On your phone, check each page looks right and nothing scrolls sideways:
- [ ] Nav: the menu button opens every page grouped by topic; the bar shows the current page.
- [ ] `/day`: readable card labels, 44px prev/next/TODAY, the day strip opens on today, the whole page scrolls normally.
- [ ] `/` overview: day tiles two per row; long sections fold closed with a Show button; the sleep calendar fits.
- [ ] `/recovery`: each day is a readable card; tapping a day opens its score details.
- [ ] Metric pages (Steps, Calories, Heart, HRV, Skin temp, Weight): charts open on the last 90 days and the slider reaches older data; swiping over a chart scrolls the page.
- [ ] `/habits`, `/explore`: controls are easy to tap; the Explore lag slider works by touch.
- [ ] `/data-sources`: categories are collapsed with counts and open on tap.
- [ ] The dark strip on the right of every page is gone (content fills the screen width).
- [ ] Year heatmaps open on recent months; tapping a square shows that day's value under the grid.
- [ ] Overview → Sleep stages: the time axis labels don't overlap.
- If anything is broken: `scripts/deploy.sh rollback` restores the previous version.

### Nav analysis indicator and raw records (added 2026-10-17, deployed to prod 2026-10-18)
- [ ] After a phone sync, the nav shows ANALYZING · Nm (purple) while the server recomputes (about 5 minutes), then a dim ANALYZED · just now; open pages refresh with the new numbers.
- [ ] On your phone, only a small purple pulsing square appears while analysis runs, and the nav doesn't scroll sideways.
- [ ] `/skin-temperature` → Source records lists all your nightly records with delta, baseline (°C and °F), location and source.
- [ ] `/hrv` → Source records groups readings by night; expanding a night shows every 5-minute reading; the 30d / 90d / All selector works.
- [ ] Spot-check one night's HRV against the Google Health app.

### Android app v2.3.0: HRV and skin temperature (added 2026-10-17)
Built on the server and published 2026-10-17: on your phone, open
http://192.168.8.239:3000/login and tap DOWNLOAD APK (v2.3.0, 69 MB), then
open the file to install it over the current app (same signing key).
- [ ] The permission prompt includes **Heart rate variability** and **Skin temperature**; allow both.
- [ ] Health Connect → App permissions → HCGateway shows both enabled.
- [ ] After a sync, the in-app status list shows a count for `HeartRateVariabilityRmssd` and `SkinTemperature` (not "no access" or "failed"), and the toast says "Sync completed".
- [ ] `/data-sources` lists `heartRateVariabilityRmssd` and `skinTemperature` with records and recent dates.
- [ ] About 5 minutes after that sync, `/hrv` and `/skin-temperature` show data, and the day view's recovery footer shows HRV and SKIN values.
- [ ] Logging out in the app leaves the website signed in (logout now ends only the phone's session).
- [ ] The login screen says to create accounts on the dashboard website.
- If skin temperature fails, `adb logcat` showing an unknown-record-type error means `node_modules` still had the old library.

### Phone stays signed in after the session change (added 2026-10-17)
- [ ] The phone app keeps syncing without asking you to log in again, checked about 12 hours after the 2026-10-17 backend deploy (when its old token would have expired and converted into a permanent session).

### Embedded dashboard (added 2026-10-17)
- [ ] In your embedding page over plain HTTP, the login page shows the notice explaining that sign-in can't work in the frame, with an "open in a new tab" link. (Deployed 2026-10-17.)
- [ ] Once the dashboard is served over HTTPS (for example through Cloudflare), signing in inside the embedded frame works and stays signed in.

### New account flow (for your friend)
- [ ] Create an account on `/signup`, then log into the phone app with it.
- [ ] Logging in with a username that doesn't exist fails in both the app and the website instead of creating an account.

### Android app download page (added 2026-10-17)
v2.3.0 is already published (built on the server). To publish a build from your PC instead:
`scp app-release.apk root@192.168.8.239:/root/HCGateway/releases/incoming.apk && ssh root@192.168.8.239 /root/HCGateway/scripts/publish-apk.sh /root/HCGateway/releases/incoming.apk`
(bump `expo.version`/`versionCode` in `app/app.json` and pull it on the server first; the script reads the version from the server's checkout).
- [ ] The login page shows the "Get the Android app" card with the right version, "updated …" time and size.
- [ ] The installed app reports the version the card showed.
- [ ] Signed-out, the download link still works (it needs no account).

## Confirmed

- [x] Downloading v2.3.0 from the login page's DOWNLOAD APK and installing it over the old app (2026-10-17)
- [x] Syncing on v2.3.0: the app reported skin temperature data points; the server has 31 skin temperature and 1,550 HRV records (2026-10-17)
- [x] Website login with your HCGateway account (2026-10-17)
- [x] Staying signed in across browser restarts (2026-10-17)
- [x] Changing your password on ACCOUNT, signing out, signing in with the new password (2026-10-17)
- [x] Logging into the phone app with the changed password (2026-10-17)
- [x] SIGN OUT on the website (2026-10-17)
