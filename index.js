/**
 * @format
 */

// First, so the startup metric measures from the start of JS.
import './app/telemetry/startup';
import {AppRegistry, Platform} from 'react-native';
import App from './App';

import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);

// Android uses Media3. Loading RNTP's native module there fails during bridge
// initialization, so only register the RNTP service on the iOS runtime.
if (Platform.OS === 'ios') {
  const TrackPlayer = require('react-native-track-player').default;
  const {PlaybackService} = require('./app/adapters/audio/PlaybackService');
  TrackPlayer.registerPlaybackService(() => PlaybackService);
}
