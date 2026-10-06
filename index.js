/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import TrackPlayer from 'react-native-track-player';

import {name as appName} from './app.json';
import {PlaybackService} from './app/audio/rntp/PlaybackService';

AppRegistry.registerComponent(appName, () => App);
TrackPlayer.registerPlaybackService(() => PlaybackService);
