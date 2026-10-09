# Android Media3 backend

Android playback is owned by `OtoMedia3PlaybackService`, a Media3
`MediaLibraryService`. The service owns ExoPlayer and the media session, so
playback survives UI/background transitions and is discoverable by platform
media controllers.

Media3 is pinned to 1.11.1. Playback and preload warming share one 512 MiB LRU
`SimpleCache` through a `CacheDataSource.Factory`.

The React Native bridge is intentionally thin. Oto's application layer still
depends on `AudioEngine`; Android selects `Media3Driver`, while iOS remains
on the RNTP v4 adapter until AU-10 hardening.

Cache warm sizes use a conservative audiobook bitrate heuristic. This is a
startup-latency optimization, not an offline-download guarantee.
