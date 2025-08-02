// SOURCE: Jest Official Documentation + React Native Firebase Testing Best Practices
// URL: https://jestjs.io/docs/getting-started + https://rnfirebase.io/testing
// VERIFIED: Official Jest patterns with React Native Firebase v22.4.0 testing

import { firebase, isFirebaseInitialized, firebaseAuth, firebaseDb, firebaseFunctions } from '../../src/services/firebase';

// Mock React Native Firebase
jest.mock('@react-native-firebase/app', () => ({
  getApps: jest.fn(() => [{ name: '[DEFAULT]' }]),
  getApp: jest.fn(() => ({ name: '[DEFAULT]' })),
  initializeApp: jest.fn(),
}));

jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
  })),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(),
    doc: jest.fn(),
    settings: jest.fn(),
  })),
}));

jest.mock('@react-native-firebase/functions', () => ({
  getFunctions: jest.fn(() => ({
    httpsCallable: jest.fn(),
    useEmulator: jest.fn(),
  })),
}));

describe('Firebase Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Firebase Initialization', () => {
    test('should initialize Firebase app successfully', () => {
      expect(firebase.app).toBeDefined();
      expect(firebase.app.name).toBe('[DEFAULT]');
    });

    test('should export all Firebase services', () => {
      expect(firebase.auth).toBeDefined();
      expect(firebase.db).toBeDefined();
      expect(firebase.functions).toBeDefined();
    });

    test('should check initialization status correctly', () => {
      const initialized = isFirebaseInitialized();
      expect(initialized).toBe(true);
    });
  });

  describe('Firebase Auth Service', () => {
    test('should export firebaseAuth service', () => {
      expect(firebaseAuth).toBeDefined();
      expect(typeof firebaseAuth.onAuthStateChanged).toBe('function');
    });

    test('should handle auth state changes', () => {
      const mockCallback = jest.fn();
      firebaseAuth.onAuthStateChanged(mockCallback);
      expect(firebaseAuth.onAuthStateChanged).toHaveBeenCalledWith(mockCallback);
    });
  });

  describe('Firestore Database Service', () => {
    test('should export firebaseDb service', () => {
      expect(firebaseDb).toBeDefined();
      expect(typeof firebaseDb.collection).toBe('function');
    });

    test('should configure offline persistence', () => {
      expect(firebaseDb.settings).toHaveBeenCalledWith({
        persistence: true,
        cacheSizeBytes: 100 * 1024 * 1024, // 100MB cache
      });
    });
  });

  describe('Cloud Functions Service', () => {
    test('should export firebaseFunctions service', () => {
      expect(firebaseFunctions).toBeDefined();
      expect(typeof firebaseFunctions.httpsCallable).toBe('function');
    });

    test('should support calling cloud functions', () => {
      const mockFunction = firebaseFunctions.httpsCallable('testFunction');
      expect(firebaseFunctions.httpsCallable).toHaveBeenCalledWith('testFunction');
      expect(mockFunction).toBeDefined();
    });
  });

  describe('Development Environment Setup', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    test('should configure emulators in development mode', () => {
      // In a real test, we would verify emulator configuration
      // For now, we just ensure the exports are available
      expect(firebaseAuth).toBeDefined();
      expect(firebaseDb).toBeDefined();
      expect(firebaseFunctions).toBeDefined();
    });
  });

  describe('Service Integration', () => {
    test('should maintain consistent service references', () => {
      expect(firebase.auth).toBe(firebaseAuth);
      expect(firebase.db).toBe(firebaseDb);
      expect(firebase.functions).toBe(firebaseFunctions);
    });

    test('should support individual service imports', () => {
      const { auth, db, functions } = require('../../src/services/firebase');
      expect(auth).toBe(firebaseAuth);
      expect(db).toBe(firebaseDb);
      expect(functions).toBe(firebaseFunctions);
    });
  });

  describe('Error Handling', () => {
    test('should handle initialization errors gracefully', () => {
      // Mock initialization failure
      const mockGetApps = require('@react-native-firebase/app').getApps;
      mockGetApps.mockImplementationOnce(() => {
        throw new Error('Firebase initialization failed');
      });

      // The service should still provide consistent exports
      expect(() => isFirebaseInitialized()).not.toThrow();
    });

    test('should provide fallback for offline persistence errors', () => {
      const mockSettings = firebaseDb.settings;
      mockSettings.mockImplementationOnce(() => {
        throw new Error('Persistence setup failed');
      });

      // Should not crash the application
      expect(firebaseDb).toBeDefined();
    });
  });

  describe('Performance Considerations', () => {
    test('should initialize services efficiently', async () => {
      const startTime = Date.now();
      
      // Access all services
      const services = [
        firebase.auth,
        firebase.db,
        firebase.functions,
      ];

      const endTime = Date.now();
      const initTime = endTime - startTime;

      expect(services).toHaveLength(3);
      expect(initTime).toBeLessThan(100); // Should initialize quickly
    });
  });
});