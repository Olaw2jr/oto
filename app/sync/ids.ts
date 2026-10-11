// Server ids for things the app records offline. oto-api derives the same
// ids for the bundled catalogue (app/ids.py there), so a change can be queued
// with the right id before the app ever talks to the server.

const hex = (bytes: Uint8Array) =>
  Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');

const format = (bytes: Uint8Array) => {
  const h = hex(bytes);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
};

const parse = (uuid: string) =>
  Uint8Array.from(uuid.replace(/-/g, '').match(/../g) ?? [], b => parseInt(b, 16));

// SHA-1 (FIPS 180-4), only for name-based UUIDs; not for security.
const sha1 = (message: Uint8Array): Uint8Array => {
  const length = message.length;
  const padded = new Uint8Array(((length + 9 + 63) >> 6) << 6);
  padded.set(message);
  padded[length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 4, length * 8);
  view.setUint32(padded.length - 8, Math.floor(length / 0x20000000));

  const h = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
  const w = new Uint32Array(80);
  const rotl = (x: number, n: number) => (x << n) | (x >>> (32 - n));
  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4);
    }
    for (let i = 16; i < 80; i++) {
      w[i] = rotl(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
    }
    let [a, b, c, d, e] = h;
    for (let i = 0; i < 80; i++) {
      const [f, k] =
        i < 20
          ? [(b & c) | (~b & d), 0x5a827999]
          : i < 40
            ? [b ^ c ^ d, 0x6ed9eba1]
            : i < 60
              ? [(b & c) | (b & d) | (c & d), 0x8f1bbcdc]
              : [b ^ c ^ d, 0xca62c1d6];
      const temp = (rotl(a, 5) + f + e + k + w[i]) >>> 0;
      e = d;
      d = c;
      c = rotl(b, 30) >>> 0;
      b = a;
      a = temp;
    }
    h[0] = (h[0] + a) >>> 0;
    h[1] = (h[1] + b) >>> 0;
    h[2] = (h[2] + c) >>> 0;
    h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0;
  }
  const digest = new Uint8Array(20);
  const out = new DataView(digest.buffer);
  h.forEach((word, i) => out.setUint32(i * 4, word));
  return digest;
};

// RFC 4122 name-based UUID, version 5.
export const uuid5 = (namespace: string, name: string): string => {
  const ns = parse(namespace);
  const nameBytes = new TextEncoder().encode(name);
  const input = new Uint8Array(ns.length + nameBytes.length);
  input.set(ns);
  input.set(nameBytes, ns.length);
  const bytes = sha1(input).slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return format(bytes);
};

const NAMESPACE_URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
export const OTO_NAMESPACE = uuid5(NAMESPACE_URL, 'https://oto.tz/ids');

export const bookEntityId = (slug: string) => uuid5(OTO_NAMESPACE, `book:${slug}`);
export const editionEntityId = (slug: string) =>
  uuid5(OTO_NAMESPACE, `edition:${slug}`);

// Random version 4 UUID, for things created on the device (shelves,
// mutations). Uses the platform's secure random source when there is one.
export const randomUuid = (): string => {
  const bytes = new Uint8Array(16);
  const crypto = (globalThis as {crypto?: {getRandomValues?: (a: Uint8Array) => void}})
    .crypto;
  if (crypto?.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return format(bytes);
};

export const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
