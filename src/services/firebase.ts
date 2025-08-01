// SOURCE: React Native Firebase v22.4.0 Official Documentation
// URL: https://rnfirebase.io/
// VERIFIED: Task agent research from official docs 2025-08-01

import { getApps, getApp, initializeApp } from '@react-native-firebase/app';
import auth, { getAuth } from '@react-native-firebase/auth';
import firestore, { getFirestore } from '@react-native-firebase/firestore';
import functions, { getFunctions } from '@react-native-firebase/functions';

/**
 * Firebase configuration and service initialization
 * Based on React Native Firebase v22.4.0 modular API patterns
 */

// Environment detection
const __DEV__ = process.env.NODE_ENV === 'development';

/**
 * Initialize Firebase App
 * In React Native Firebase v22+, the default app is automatically initialized
 * using google-services.json (Android) and GoogleService-Info.plist (iOS)
 */
const initializeFirebaseApp = () => {
  // Check if default app is already initialized
  if (getApps().length === 0) {
    // Auto-initialization will use platform-specific config files
    // No manual configuration needed for React Native Firebase v22+
    console.log('🔥 Firebase: Default app auto-initialized');
  } else {
    console.log('🔥 Firebase: App already initialized');
  }
  
  return getApp(); // Returns the default Firebase app
};

// Initialize the Firebase app
const app = initializeFirebaseApp();

/**
 * Firebase Authentication Service
 * Using modular API from React Native Firebase v22+
 */
export const firebaseAuth = getAuth(app);

/**
 * Firestore Database Service
 * Using modular API with automatic offline persistence
 */
export const firebaseDb = getFirestore(app);

// Enable offline persistence
// SOURCE: Firebase Firestore Documentation - Enable Offline Data
try {
  // Enable offline persistence for better user experience
  firebaseDb.settings({
    persistence: true,
    cacheSizeBytes: 100 * 1024 * 1024, // 100MB cache
  });
  console.log('🔥 Firestore: Offline persistence enabled');
} catch (error) {
  console.warn('🔥 Firestore: Offline persistence setup failed:', error);
}

/**
 * Firebase Cloud Functions Service
 * For AI processing and server-side operations
 */
export const firebaseFunctions = getFunctions(app);

/**
 * Development-only: Connect to Firebase Emulators
 * SOURCE: React Native Firebase Emulator Documentation
 */
if (__DEV__) {
  // Connect to Auth Emulator
  if (!auth().isEmulatorEnabled) {
    auth().useEmulator('http://localhost:9099');
    console.log('🔥 Firebase Auth: Connected to emulator at localhost:9099');
  }
  
  // Connect to Firestore Emulator
  if (!firestore().isEmulatorEnabled) {
    firestore().useEmulator('localhost', 8080);
    console.log('🔥 Firestore: Connected to emulator at localhost:8080');
  }
  
  // Connect to Functions Emulator
  if (!functions().isEmulatorEnabled) {
    functions().useEmulator('localhost', 5001);
    console.log('🔥 Functions: Connected to emulator at localhost:5001');
  }
}

/**
 * Firebase Services Object
 * Centralized export for all Firebase services
 */
export const firebase = {
  app,
  auth: firebaseAuth,
  db: firebaseDb,
  functions: firebaseFunctions,
} as const;

/**
 * Helper function to check Firebase initialization status
 */
export const isFirebaseInitialized = (): boolean => {
  return getApps().length > 0;
};

/**
 * Export individual services for direct import
 */
export { firebaseAuth as auth };
export { firebaseDb as db };
export { firebaseFunctions as functions };
export default firebase;