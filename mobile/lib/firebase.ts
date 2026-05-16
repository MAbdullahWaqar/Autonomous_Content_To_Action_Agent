// ============================================================
// Firebase Client Configuration (React Native / Expo)
// Uses the Firebase JS SDK (compatible with Expo Go)
// ============================================================

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
  type Auth,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyCrw2GRhaC_4utbPmSlsn3rhA4YnykTcPQ',
  authDomain: 'gen-lang-client-0841257737.firebaseapp.com',
  projectId: 'gen-lang-client-0841257737',
  storageBucket: 'gen-lang-client-0841257737.firebasestorage.app',
  messagingSenderId: '511680675738',
  appId: '1:511680675738:web:cb25a5d3e80877686f4423',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

function createAuth(): Auth {
  if (Platform.OS === 'web') {
    return getAuth(app);
  }

  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code;
    if (code === 'auth/already-initialized') {
      return getAuth(app);
    }
    throw error;
  }
}

export const auth = createAuth();
export default app;
