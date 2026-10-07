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
- AppProviders lazily composes one controller shared by MiniPlayer and PlayerScreen.
- Production player state contains no setInterval/setTimeout mock playback path.
- A public-domain LibriVox/Internet Archive sample is available for real HTTPS playback.

## Android physical-device acceptance

Use **The Adventures of Sherlock Holmes** public-domain sample.

- [ ] Clean debug build installs and launches.
- [ ] Starting the sample produces audible HTTPS playback through Media3.
- [ ] Play/pause works from PlayerScreen and MiniPlayer.
- [ ] Seek and configured backward/forward skip update real playback.
- [ ] Playback speed changes native playback rate.
- [ ] Playback continues after backgrounding the app.
- [ ] Lock-screen/notification play, pause, seek and skip controls work.
- [ ] Audio focus/interruption behavior pauses/ducks and resumes as expected.
- [ ] Minute sleep timer fires while the React UI is backgrounded.
- [ ] End-of-chapter sleep timer stops at the chapter boundary.
- [ ] Force-stop/relaunch restores the last persisted position.
- [ ] Relaunch does not create duplicate Media3 sessions.

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

Do not close #82 until the Android physical-device checks pass. iOS checks may
remain a release-platform validation item only if #82's Android acceptance
criteria are satisfied and the iOS CI build stays green.
