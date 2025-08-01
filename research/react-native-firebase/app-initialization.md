# React Native Firebase App Initialization - Official Documentation

## Version: 22.4.0 (Current as of August 2025)

### Core Installation

```bash
# Install the core app module
npm install @react-native-firebase/app
# or
yarn add @react-native-firebase/app

# For iOS (if using React Native CLI)
cd ios && pod install
```

### Basic App Initialization

React Native Firebase **automatically connects** to your Firebase project without manual initialization when using the default app. The app module provides the core functionality for all other Firebase services.

```typescript
// No explicit initialization needed for default app
// Simply import the app module
import firebase from '@react-native-firebase/app';

// The app is automatically connected using platform-specific config files:
// - Android: google-services.json
// - iOS: GoogleService-Info.plist
```

### Secondary App Initialization (Advanced)

For multiple Firebase projects or environments:

```typescript
import firebase from '@react-native-firebase/app';
import { Platform } from 'react-native';

// Platform-specific credentials
const credentials = Platform.select({
  android: {
    clientId: 'YOUR_ANDROID_CLIENT_ID',
    appId: 'YOUR_ANDROID_APP_ID',
    apiKey: 'YOUR_ANDROID_API_KEY',
    databaseURL: 'https://your-project.firebaseio.com',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    projectId: 'your-project-id',
  },
  ios: {
    clientId: 'YOUR_IOS_CLIENT_ID',
    appId: 'YOUR_IOS_APP_ID',
    apiKey: 'YOUR_IOS_API_KEY',
    databaseURL: 'https://your-project.firebaseio.com',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    projectId: 'your-project-id',
  },
});

const config = {
  name: 'SECONDARY_APP',
};

// Initialize secondary app
const secondaryApp = await firebase.initializeApp(credentials, config);

// Use secondary app for services
const authSecondary = firebase.app('SECONDARY_APP').auth();
const firestoreSecondary = firebase.app('SECONDARY_APP').firestore();
```

### App Management

```typescript
// List all initialized apps
console.log('Available apps:', firebase.apps);

// Check if app exists
const appExists = firebase.apps.some(app => app.name === 'SECONDARY_APP');

// Delete secondary app
await firebase.app('SECONDARY_APP').delete();
```

### Platform Configuration Files

#### Android: google-services.json
- Location: `android/app/google-services.json`
- Generated from Firebase Console
- Contains all Android-specific configuration

#### iOS: GoogleService-Info.plist
- Location: Add to iOS bundle via Xcode
- Generated from Firebase Console
- Contains all iOS-specific configuration

### Gradle Configuration (Android)

**Project-level build.gradle** (`android/build.gradle`):
```gradle
plugins {
    id("com.android.application") version "7.3.0" apply false
    // Add the Google services Gradle plugin
    id("com.google.gms.google-services") version "4.4.3" apply false
}
```

**App-level build.gradle** (`android/app/build.gradle`):
```gradle
plugins {
    id 'com.android.application'
    // Add the Google services Gradle plugin
    id 'com.google.gms.google-services'
}

dependencies {
    // Firebase BoM for version management
    implementation platform('com.google.firebase:firebase-bom:32.7.1')
}
```

### Environment Configuration Best Practices

```typescript
import firebase from '@react-native-firebase/app';
import { Platform } from 'react-native';

// Environment-based configuration
const getFirebaseConfig = () => {
  if (__DEV__) {
    // Development configuration
    return Platform.select({
      android: require('../config/firebase-dev-android.json'),
      ios: require('../config/firebase-dev-ios.json'),
    });
  } else {
    // Production configuration
    return Platform.select({
      android: require('../config/firebase-prod-android.json'),
      ios: require('../config/firebase-prod-ios.json'),
    });
  }
};

// Initialize with environment-specific config
const initializeFirebaseApp = async () => {
  const config = getFirebaseConfig();
  if (config && firebase.apps.length === 1) { // Only default app exists
    await firebase.initializeApp(config, { name: 'ENV_APP' });
  }
};
```

### TypeScript Support

React Native Firebase provides comprehensive TypeScript definitions:

```typescript
import firebase, { FirebaseApp } from '@react-native-firebase/app';

// Strongly typed app reference
const app: FirebaseApp = firebase.app();

// Type-safe app name checking
const appName: string = app.name;
const isDefaultApp: boolean = app.name === '[DEFAULT]';
```

### Supported Services for Secondary Apps

- App Check
- Authentication
- Realtime Database
- Cloud Firestore
- Cloud Functions
- Cloud Storage
- ML
- Installations
- Remote Config

### Auto-linking

React Native 0.60+ includes auto-linking support. After installation:

```bash
# Rebuild for Android
npx react-native run-android

# Rebuild for iOS
cd ios && pod install && cd ..
npx react-native run-ios
```

No manual linking configuration required for modern React Native versions.