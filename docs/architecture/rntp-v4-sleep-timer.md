# Sleep timer on RN Track Player v4

RN Track Player v4 does not expose a native countdown timer API. Its v4.1
guidance recommends persisting a sleep deadline and checking it from
`PlaybackProgressUpdated` inside the playback service.

Oto follows that pattern:

- minute timers persist an absolute deadline, not a UI timeout;
- the background playback service evaluates the deadline on progress events;
- end-of-chapter mode persists the armed track index and pauses when the active
  track changes;
- the timer state lives in AsyncStorage at `oto.audio.sleepTimer`, so React
  component unmounts do not cancel it;
- the composition root exposes a lazy controller so importing application
  architecture does not initialize RNTP.

This is background-safe within the v4 playback-service lifecycle. Process-death
survival and a fully platform-native timer belong with the later Media3/AVPlayer
native hardening work.
