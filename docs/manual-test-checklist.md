# Manual test checklist

Things only a person with the phone and a browser can verify. An item is
checked off only after Lucas confirms it, never because code was written or
an automated check passed. Newest items at the top of each section.

Dashboard: http://192.168.8.239:3000 (prod), http://192.168.8.239:3001 (dev).

## Waiting on you

### Android app v2.3.0: HRV and skin temperature (added 2026-10-17)
Build on your PC first: `cd app && npm install` (the build script won't catch
a stale install and would silently use the old Health Connect library), then
`./build-android-apk-on-linux.sh` from the HCGateway repo root.
- [ ] Android → Apps → HCGateway shows version 2.3.0.
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
- [ ] In your embedding page over plain HTTP, the login page shows the notice explaining that sign-in can't work in the frame, with an "open in a new tab" link. (Ships with the next frontend deploy.)
- [ ] Once the dashboard is served over HTTPS (for example through Cloudflare), signing in inside the embedded frame works and stays signed in.

### New account flow (for your friend)
- [ ] Create an account on `/signup`, then log into the phone app with it.
- [ ] Logging in with a username that doesn't exist fails in both the app and the website instead of creating an account.

### Android app download page (added 2026-10-17)
Publish a build first, from your PC:
`scp app-release.apk root@192.168.8.239:/root/HCGateway/releases/incoming.apk && ssh root@192.168.8.239 /root/HCGateway/scripts/publish-apk.sh /root/HCGateway/releases/incoming.apk`
(bump `expo.version`/`versionCode` in `app/app.json` and pull it on the server first; the script reads the version from the server's checkout).
- [ ] The login page shows the "Get the Android app" card with the right version, "updated …" time and size.
- [ ] On your phone, DOWNLOAD APK downloads the file, and opening it starts Android's installer (allow installs from your browser if asked).
- [ ] The installed app reports the version the card showed.
- [ ] Signed-out, the download link still works (it needs no account).

## Confirmed

- [x] Website login with your HCGateway account (2026-10-17)
- [x] Staying signed in across browser restarts (2026-10-17)
- [x] Changing your password on ACCOUNT, signing out, signing in with the new password (2026-10-17)
- [x] Logging into the phone app with the changed password (2026-10-17)
- [x] SIGN OUT on the website (2026-10-17)
