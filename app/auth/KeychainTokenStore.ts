import * as Keychain from 'react-native-keychain';

import type {StoredTokens, TokenStore} from './TokenStore';

const SERVICE = 'tz.co.oto.api';

// Tokens in the iOS Keychain or Android's Keystore-backed storage, readable
// only while the device is unlocked and never backed up to other devices.
export class KeychainTokenStore implements TokenStore {
  async load(): Promise<StoredTokens | null> {
    const saved = await Keychain.getGenericPassword({service: SERVICE});
    if (!saved) {
      return null;
    }
    try {
      const tokens = JSON.parse(saved.password) as StoredTokens;
      return tokens.accessToken && tokens.refreshToken ? tokens : null;
    } catch {
      return null;
    }
  }

  async save(tokens: StoredTokens): Promise<void> {
    await Keychain.setGenericPassword('oto', JSON.stringify(tokens), {
      service: SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }

  async clear(): Promise<void> {
    await Keychain.resetGenericPassword({service: SERVICE});
  }
}
