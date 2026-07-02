import { Platform } from 'react-native';

// On web the app is served from the same origin as the API
// (games.brandonssandbox.com), so use relative URLs. Native apps
// need the absolute production URL.
export const BACKEND_URL =
    Platform.OS === 'web' ? '' : 'https://games.brandonssandbox.com';
