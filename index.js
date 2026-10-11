/**
 * @format
 */

// Provides crypto.getRandomValues on device (Android SecureRandom), so the
// vault's salt and IVs are generated from a real CSPRNG. Must be imported
// before anything that derives keys or encrypts.
import 'react-native-get-random-values';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
