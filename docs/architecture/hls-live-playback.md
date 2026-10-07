# HLS and live playback

Oto models stream delivery separately from catalogue identity. An
`AudioSource` may declare `streamType: 'hls'`, and an `AudioTrack` may
declare `isLive: true`.

## Android

The Media3 backend maps HLS sources to
`MimeTypes.APPLICATION_M3U8`. The app already includes
`media3-exoplayer-hls`, so Media3 handles HLS manifests and live windows
natively.

## iOS

The RN Track Player v4 / AVPlayer path maps HLS sources to
`TrackType.HLS` and forwards `isLiveStream` into Now Playing metadata.
This keeps lock-screen duration semantics correct for live audio.

## Session model

Recorded audiobooks continue to use `ChapterPlaybackSession`, which requires
finite chapter durations so it can persist rendition-global progress.

Live audio uses `LivePlaybackSession` and does not invent a finite duration or
persist audiobook progress. HLS video-on-demand may still be used by the normal
audio engine without setting `isLive`.

## Authorization

HLS/live support does not bypass `RightsPolicy`. Providers and
`SourceResolver` must authorize a remote asset before application code turns
the resolved playable URI into an `AudioTrack`.
