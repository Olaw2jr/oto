# Issue 81 verification

Validated 2026-10-08 on the connected Samsung SM-S908U1 (ADB serial
R5CT31G2GLB), using the combined #81/#82 Android debug build.

- `npm run check` passed: 106 suites and 485 tests. Lint has three existing
  `no-void` warnings and no errors.
- Real SQLite tests cover file reopen, legacy data preservation, migration DDL
  rollback/retry, and recovery after a rejected write.
- `./gradlew :app:assembleDebug --no-daemon --max-workers=2` passed, including
  OP-SQLite compilation and linking for all configured ABIs.
- Existing Sherlock Holmes state survived the app update without clearing or
  uninstalling the app. After changing/playing the book, SQLite contained
  `listening` and `8227.52` seconds in both `library_entries` and
  `listening_progress` (rendition
  `adventures-of-sherlock-holmes-public-domain:seed`).
- After `adb shell am force-stop tz.co.oto` and relaunch, the Sherlock detail
  page showed `Listening` and `Resume · 2 h 17 min in`; both SQLite rows retained
  the same status and position.
- Android uses Media3 and registers only its selected engine. iOS physical
  checks were skipped as requested.
