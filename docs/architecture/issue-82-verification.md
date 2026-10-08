# Issue #82 — real player verification

P82-01 through P82-08 replace the prototype playback clock with the
AudioEngine/ChapterPlaybackSession pipeline.

## Automated coverage

- PlayerController maps chapter-local native snapshots to rendition-global position.
- Cross-chapter seek and skip execute through AudioEngine.
- Authorized chapter assets resolve through SourceResolver.
- ChapterPlaybackSession restores and checkpoints durable progress.
- Sleep timers persist outside React. Android evaluates them in Media3's
  MediaLibraryService and iOS evaluates them in the RNTP playback service.
- PlayerController refreshes persisted sleep-timer state on native pause and
  active-track changes, so chapter completion cannot leave a stale timer badge.
- AppProviders lazily composes one controller shared by MiniPlayer and PlayerScreen.
- Production player state contains no setInterval/setTimeout mock playback path.
- The authorized LibriVox/Internet Archive sample has 24 exact chapter files,
  titles and durations for real HTTPS playback.

## Android physical-device acceptance

Use **The Adventures of Sherlock Holmes** public-domain sample.

- [x] Clean debug build installs and launches.
- [x] Starting the sample produces audible HTTPS playback through Media3.
- [x] Play/pause works from PlayerScreen and MiniPlayer.
- [x] Seek and configured backward/forward skip update real playback.
- [x] Playback speed changes native playback rate.
- [x] Playback continues after backgrounding the app.
- [x] Lock-screen/notification play, pause, seek and skip controls work.
- [x] Permanent audio-focus loss pauses Oto.
- [x] Minute sleep timer fires while the React UI is backgrounded. On the
  Samsung SM-S908U1, the 15-minute timer paused the Media3 session after expiry
  while Oto was backgrounded and cleared its native deadline.
- [x] End-of-chapter sleep timer pauses at the chapter transition and clears its
  native state. Controller badge refresh after native track change has regression
  coverage.
- [x] Force-stop/relaunch restores the last persisted position. On the
  Samsung SM-S908U1, reloading the sample restored Chapter 4 at 1:43:22.
- [x] Relaunch does not create duplicate Media3 sessions. The post-relaunch
  MediaSession dump showed one Oto session, plus the separate Spotify session.

Suggested ADB record:

```text
device:
android:
apk commit:
sample:
start position:
seek target:
background result:
remote controls:
force-stop/relaunch position:
result:
```

2026-10-08 Android playback run: Samsung SM-S908U1, Oto debug build, Sherlock
Holmes public-domain Archive.org HTTPS sample. PlayerScreen pause, 30-second
skip and 1.25x speed worked; MiniPlayer play/pause worked; playback continued
in background; lock screen exposed rewind 15 seconds, pause and forward 30
seconds; tapping forward and sending KEYCODE_MEDIA_FAST_FORWARD advanced by
30 seconds. Media key play/pause changed MediaSession state. Force-stop/relaunch
restored at 4:05.

2026-10-08 Android timer run: Sherlock Holmes HTTPS sample, 15-minute timer,
Oto backgrounded. Media3 remained PLAYING during the countdown, then reported
PAUSED at expiry and cleared the native deadline. End-of-chapter mode paused
at the chapter transition and cleared native timer state. PlayerController
refreshes timer state on track changes, covered by a regression test.

2026-10-08 Android focus run: Spotify acquired permanent audio focus while
Oto's sample was playing in the background. Oto received focus loss and changed
to PAUSED. Pausing Spotify left Oto paused, as expected for permanent focus
loss; resumption is user-controlled.

The validation sample uses 24 authorized Archive.org MP3 chapter files, so
chapter transitions and the end-of-chapter timer are exercised as real queue
events. Force-stop/relaunch restored Chapter 4 at 1:43:22, and a MediaSession
dump showed one Oto session.

## iOS physical-device acceptance

Use the same public-domain sample.

- [ ] Simulator/device build links RNTP and launches.
- [ ] Starting the sample produces audible HTTPS playback.
- [ ] Play/pause, seek, skip and speed work through AudioEngine.
- [ ] Background playback continues.
- [ ] Control Center / lock-screen metadata and controls work.
- [ ] Interruption handling behaves correctly.
- [ ] Minute and end-of-chapter sleep timers work while backgrounded.
- [ ] Relaunch restores durable progress.
- [ ] AirPlay route change preserves playback and metadata.

## Closure rule

Do not close #82 until the remaining Android checks pass. iOS checks may remain
a release-platform validation item only if Android acceptance is satisfied and
the iOS CI build stays green.
