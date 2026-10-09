// oto-api's base URL, e.g. 'https://api.oto.tz'. While it is null, nothing
// is sent anywhere: telemetry stays queued on the device, changes aren't
// recorded for sync, and sign-in stays local. See
// docs/release/configuration.md.
export const apiBaseUrl: string | null = null;

// Google OAuth client ids for native sign-in (Google Cloud console). The web
// client id is the one oto-api verifies ID tokens against. While null, the
// Google button keeps its local behaviour.
export const googleWebClientId: string | null = null;
export const googleIosClientId: string | null = null;
