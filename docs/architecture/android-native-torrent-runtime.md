# Android native torrent runtime

Issue #83 implements Oto's Android torrent transport behind the existing
`TorrentEngine` and `NativeRangeServer` contracts.

## Native engine

Oto uses FrostWire jlibtorrent 2.0.12.9 for Android. The binding is MIT
licensed, supports Android API 24+, ships arm, arm64, x86 and x86_64 native
artifacts, and is compatible with Android's 16 KiB page-size requirement.

The native engine:

- starts one libtorrent session per app process;
- accepts HTTPS torrent descriptors, magnet URIs, or an info hash that is
  converted to a magnet URI;
- limits fetched torrent metadata to 2 MiB;
- restores opaque fast-resume data supplied by the application layer;
- starts torrents with every file disabled until the selected file is retained;
- resolves files by exact index/path;
- maps requested byte ranges to libtorrent pieces and applies maximum piece
  priority plus near-term deadlines;
- exports fast-resume data as an opaque base64 string;
- removes the torrent handle when the final session lease is released.

The JavaScript bridge additionally requires `trustedSourceId` before native
open. This is defense in depth: authorization still belongs to
`RightsPolicy` and `SourceResolver`, which also check rights status and
territory before a torrent transport is prepared.

## Loopback range server

Each streaming route owns an ephemeral server bound explicitly to
`InetAddress.getLoopbackAddress()`. It never listens on LAN interfaces.

A route:

- uses a 192-bit SecureRandom URL-safe token;
- accepts only GET and HEAD;
- exposes exactly one selected torrent file;
- implements single HTTP byte ranges, including open-ended and suffix ranges;
- returns 206 with Content-Range for ranged requests;
- returns 416 for malformed/out-of-file ranges;
- does not expose filesystem paths in URLs;
- validates the torrent path remains under the per-torrent save directory;
- requests and waits for verified libtorrent pieces before reading each 128 KiB
  chunk from disk.

Playback therefore sees a normal
`http://127.0.0.1:<port>/media/<route-token>` source while the native engine
moves piece priority as Media3 seeks.

## Shared session lifecycle

On Android, `ApplicationContainer` adds the streaming transport to the production
`SourceResolver` registry. This keeps torrent sources behind the same
`RightsPolicy` and chapter asset-resolution path as HTTPS sources.
`createAndroidTorrentRuntime()` creates one `TorrentSessionPool` shared by
`TorrentStreamTransport` and `TorrentDownloadManager`. Streaming and
downloads of the same descriptor therefore share the native torrent handle.

Download resume data is stored through the existing `TorrentResumeStore`
contract. The Android factory uses AsyncStorage so a paused download can restore
the opaque libtorrent resume payload after process restart.

## Deliberate exclusions

This runtime does not add torrent search, indexing, discovery, or any mechanism
that bypasses Oto's existing trusted-source and rights policy. It is only a
transport for assets that the catalogue/provider layer has already authorized.

A physical-device public-domain streaming test is still required before issue
#83 is closed.
