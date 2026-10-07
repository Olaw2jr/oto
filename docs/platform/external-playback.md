# External playback surfaces

## AirPlay

Oto's iOS player uses the playback audio-session category and the AVPlayer-based
RNTP v4 backend. AirPlay routing is therefore handled by the system audio route;
Now Playing metadata follows the selected route.

## Android Auto

Android uses a Media3 `MediaLibraryService`. The service exposes a browsable
root and the current chapter queue as playable media items. The phone manifest
also declares the Android Auto `media` capability through
`automotive_app_desc.xml`.

## CarPlay

CarPlay audio apps require Apple's managed
`com.apple.developer.carplay-audio` entitlement. Oto includes
`Entitlements.carplay.template.plist` as the exact capability template, but it
is deliberately not attached to the shipping target until Apple grants the
managed entitlement and the matching provisioning profile is available.

Once granted, the CarPlay scene can use the existing Now Playing metadata and
AudioEngine queue. Do not enable the template entitlement in CI or production
signing before the developer account has the managed capability.
