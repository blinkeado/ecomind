// SOURCE: Phase 7 Testing - Firebase configuration for testing
// VERIFIED: Mock Firebase configuration for test environment

import { initializeApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';

// Firebase configuration
const firebaseConfig = {
  apiKey: "test-api-key",
  authDomain: "test-project.firebaseapp.com",
  projectId: "test-project",
  storageBucket: "test-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "test-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export { app, auth, firestore, functions };

// Export default for backward compatibility
export default {
  app,
  auth,
  firestore,
  functions
}; 