# React Native Firebase Environment Configuration - Official Documentation

## Version: 22.4.0 Environment Setup

### Platform Configuration Files

#### Android Configuration (google-services.json)

**Location**: `android/app/google-services.json`

**Setup Process**:
1. Go to Firebase Console → Project Settings → Your Apps → Android App
2. Download `google-services.json`
3. Place file at `android/app/google-services.json`

**Gradle Configuration Required**:

**Project-level build.gradle** (`android/build.gradle`):
```gradle
buildscript {
    dependencies {
        // Add the Google services Gradle plugin
        classpath 'com.google.gms:google-services:4.4.3'
    }
}

// Or using plugins block (newer syntax)
plugins {
    id("com.android.application") version "7.3.0" apply false
    id("com.google.gms.google-services") version "4.4.3" apply false
}
```

**App-level build.gradle** (`android/app/build.gradle`):
```gradle
apply plugin: 'com.android.application'
// Add the Google services plugin
apply plugin: 'com.google.gms.google-services'

dependencies {
    // Firebase BoM for version management
    implementation platform('com.google.firebase:firebase-bom:32.7.1')
    
    // Firebase services (versions managed by BoM)
    implementation 'com.google.firebase:firebase-analytics'
    implementation 'com.google.firebase:firebase-auth'
    implementation 'com.google.firebase:firebase-firestore'
    implementation 'com.google.firebase:firebase-functions'
}
```

#### iOS Configuration (GoogleService-Info.plist)

**Location**: Added to iOS bundle via Xcode

**Setup Process**:
1. Go to Firebase Console → Project Settings → Your Apps → iOS App
2. Download `GoogleService-Info.plist`
3. Open `ios/{ProjectName}.xcworkspace` in Xcode
4. Drag and drop the plist file into the project (ensure it's added to target)

### Multiple Environment Configuration

#### TypeScript Configuration Class

```typescript
import { Platform } from 'react-native';
import firebase from '@react-native-firebase/app';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  databaseURL?: string;
}

interface EnvironmentConfig {
  firebase: {
    development: FirebaseConfig;
    staging: FirebaseConfig;
    production: FirebaseConfig;
  };
  emulators: {
    enabled: boolean;
    auth: { host: string; port: number };
    firestore: { host: string; port: number };
    functions: { host: string; port: number };
  };
}

class ConfigManager {
  private static instance: ConfigManager;
  private config: EnvironmentConfig;
  
  private constructor() {
    this.config = this.loadConfig();
  }
  
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }
  
  private loadConfig(): EnvironmentConfig {
    const isDevelopment = __DEV__;
    const isStaging = process.env.NODE_ENV === 'staging';
    
    return {
      firebase: {
        development: {
          apiKey: 'AIzaSyDev_Development_Key',
          authDomain: 'myapp-dev.firebaseapp.com',
          projectId: 'myapp-dev',
          storageBucket: 'myapp-dev.appspot.com',
          messagingSenderId: '123456789',
          appId: '1:123456789:android:dev123',
          measurementId: 'G-DEV123',
          databaseURL: 'https://myapp-dev.firebaseio.com'
        },
        staging: {
          apiKey: 'AIzaSyStag_Staging_Key',
          authDomain: 'myapp-staging.firebaseapp.com',
          projectId: 'myapp-staging',
          storageBucket: 'myapp-staging.appspot.com',
          messagingSenderId: '987654321',
          appId: '1:987654321:android:staging123',
          measurementId: 'G-STAGING123',
          databaseURL: 'https://myapp-staging.firebaseio.com'
        },
        production: {
          apiKey: 'AIzaSyProd_Production_Key',
          authDomain: 'myapp-prod.firebaseapp.com',
          projectId: 'myapp-prod',
          storageBucket: 'myapp-prod.appspot.com',
          messagingSenderId: '555666777',
          appId: '1:555666777:android:prod123',
          measurementId: 'G-PROD123',
          databaseURL: 'https://myapp-prod.firebaseio.com'
        }
      },
      emulators: {
        enabled: isDevelopment,
        auth: { host: 'localhost', port: 9099 },
        firestore: { host: 'localhost', port: 8080 },
        functions: { host: 'localhost', port: 5001 }
      }
    };
  }
  
  getCurrentFirebaseConfig(): FirebaseConfig {
    if (__DEV__) {
      return this.config.firebase.development;
    } else if (process.env.NODE_ENV === 'staging') {
      return this.config.firebase.staging;
    } else {
      return this.config.firebase.production;
    }
  }
  
  getEmulatorConfig() {
    return this.config.emulators;
  }
  
  isEmulatorEnabled(): boolean {
    return this.config.emulators.enabled;
  }
}

export default ConfigManager;
```

#### Firebase Service Initialization

```typescript
import firebase from '@react-native-firebase/app';
import { getAuth, connectAuthEmulator } from '@react-native-firebase/auth';
import { getFirestore, connectFirestoreEmulator } from '@react-native-firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from '@react-native-firebase/functions';
import { Platform } from 'react-native';
import ConfigManager from './ConfigManager';

class FirebaseService {
  private static instance: FirebaseService;
  private initialized = false;
  
  private constructor() {}
  
  static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    const configManager = ConfigManager.getInstance();
    const firebaseConfig = configManager.getCurrentFirebaseConfig();
    const emulatorConfig = configManager.getEmulatorConfig();
    
    try {
      // Initialize secondary app for environment-specific config
      if (firebase.apps.length === 1) { // Only default app exists
        const platformConfig = Platform.select({
          android: firebaseConfig,
          ios: firebaseConfig,
        });
        
        if (platformConfig) {
          await firebase.initializeApp(platformConfig, {
            name: 'ENV_APP'
          });
        }
      }
      
      // Connect to emulators in development
      if (emulatorConfig.enabled) {
        await this.connectToEmulators(emulatorConfig);
      }
      
      this.initialized = true;
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Firebase initialization error:', error);
      throw error;
    }
  }
  
  private async connectToEmulators(emulatorConfig: any): Promise<void> {
    try {
      const auth = getAuth();
      const firestore = getFirestore();
      const functions = getFunctions();
      
      // Connect Auth emulator
      if (!auth._delegate._config.emulator) {
        connectAuthEmulator(auth, `http://${emulatorConfig.auth.host}:${emulatorConfig.auth.port}`);
      }
      
      // Connect Firestore emulator
      if (!firestore._delegate._databaseId.database.includes('localhost')) {
        connectFirestoreEmulator(firestore, emulatorConfig.firestore.host, emulatorConfig.firestore.port);
      }
      
      // Connect Functions emulator
      connectFunctionsEmulator(functions, emulatorConfig.functions.host, emulatorConfig.functions.port);
      
      console.log('Connected to Firebase emulators');
    } catch (error) {
      console.warn('Emulator connection warning:', error);
      // Don't throw - emulators might already be connected
    }
  }
  
  getApp(name?: string) {
    return firebase.app(name);
  }
  
  isInitialized(): boolean {
    return this.initialized;
  }
}

export default FirebaseService;
```

### Environment Variables Setup

#### .env Files

**`.env.development`**:
```env
FIREBASE_API_KEY=AIzaSyDev_Development_Key
FIREBASE_AUTH_DOMAIN=myapp-dev.firebaseapp.com
FIREBASE_PROJECT_ID=myapp-dev
FIREBASE_STORAGE_BUCKET=myapp-dev.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:android:dev123
FIREBASE_MEASUREMENT_ID=G-DEV123
FIREBASE_DATABASE_URL=https://myapp-dev.firebaseio.com

USE_EMULATORS=true
AUTH_EMULATOR_HOST=localhost
AUTH_EMULATOR_PORT=9099
FIRESTORE_EMULATOR_HOST=localhost
FIRESTORE_EMULATOR_PORT=8080
FUNCTIONS_EMULATOR_HOST=localhost
FUNCTIONS_EMULATOR_PORT=5001
```

**`.env.production`**:
```env
FIREBASE_API_KEY=AIzaSyProd_Production_Key
FIREBASE_AUTH_DOMAIN=myapp-prod.firebaseapp.com
FIREBASE_PROJECT_ID=myapp-prod
FIREBASE_STORAGE_BUCKET=myapp-prod.appspot.com
FIREBASE_MESSAGING_SENDER_ID=555666777
FIREBASE_APP_ID=1:555666777:android:prod123
FIREBASE_MEASUREMENT_ID=G-PROD123
FIREBASE_DATABASE_URL=https://myapp-prod.firebaseio.com

USE_EMULATORS=false
```

#### React Native Config Integration

**Installation**:
```bash
npm install react-native-config
# For iOS
cd ios && pod install
```

**Usage**:
```typescript
import Config from 'react-native-config';

const firebaseConfig = {
  apiKey: Config.FIREBASE_API_KEY,
  authDomain: Config.FIREBASE_AUTH_DOMAIN,
  projectId: Config.FIREBASE_PROJECT_ID,
  storageBucket: Config.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Config.FIREBASE_MESSAGING_SENDER_ID,
  appId: Config.FIREBASE_APP_ID,
  measurementId: Config.FIREBASE_MEASUREMENT_ID,
  databaseURL: Config.FIREBASE_DATABASE_URL
};

const useEmulators = Config.USE_EMULATORS === 'true';
```

### Firebase Emulator Configuration

#### firebase.json Configuration

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions"
  },
  "hosting": {
    "public": "public",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "functions": {
      "port": 5001
    },
    "hosting": {
      "port": 5000
    },
    "ui": {
      "enabled": true,
      "port": 4000
    },
    "singleProjectMode": true
  }
}
```

#### Emulator Initialization Service

```typescript
import { getAuth, connectAuthEmulator } from '@react-native-firebase/auth';
import { getFirestore, connectFirestoreEmulator } from '@react-native-firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from '@react-native-firebase/functions';
import Config from 'react-native-config';

class EmulatorService {
  private static connected = false;
  
  static async connect(): Promise<void> {
    if (this.connected || !__DEV__ || Config.USE_EMULATORS !== 'true') {
      return;
    }
    
    try {
      const auth = getAuth();
      const firestore = getFirestore();
      const functions = getFunctions();
      
      // Connect to Auth emulator
      connectAuthEmulator(auth, `http://${Config.AUTH_EMULATOR_HOST}:${Config.AUTH_EMULATOR_PORT}`);
      
      // Connect to Firestore emulator
      connectFirestoreEmulator(firestore, Config.FIRESTORE_EMULATOR_HOST, parseInt(Config.FIRESTORE_EMULATOR_PORT));
      
      // Connect to Functions emulator
      connectFunctionsEmulator(functions, Config.FUNCTIONS_EMULATOR_HOST, parseInt(Config.FUNCTIONS_EMULATOR_PORT));
      
      this.connected = true;
      console.log('✅ Connected to Firebase emulators');
    } catch (error) {
      console.warn('⚠️ Emulator connection failed:', error);
    }
  }
  
  static isConnected(): boolean {
    return this.connected;
  }
}

export default EmulatorService;
```

### App Initialization with Environment Configuration

```typescript
// App.tsx
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import FirebaseService from './services/FirebaseService';
import EmulatorService from './services/EmulatorService';
import { useAuthState } from './hooks/useAuthState';

const App = () => {
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const [initError, setInitError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        // Connect to emulators first (if enabled)
        await EmulatorService.connect();
        
        // Initialize Firebase services
        const firebaseService = FirebaseService.getInstance();
        await firebaseService.initialize();
        
        setFirebaseInitialized(true);
      } catch (error) {
        console.error('App initialization error:', error);
        setInitError(error as Error);
      }
    };

    initializeFirebase();
  }, []);

  if (initError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Initialization Error: {initError.message}</Text>
      </View>
    );
  }

  if (!firebaseInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Initializing Firebase...</Text>
      </View>
    );
  }

  return <MainApp />;
};

const MainApp = () => {
  const { user, loading } = useAuthState();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return user ? <AuthenticatedApp /> : <AuthScreen />;
};

export default App;
```

### Debug Configuration

#### Debug Logging

```typescript
// Enable Firebase debug logging
if (__DEV__) {
  // Enable Firestore debug logging
  firebase.firestore().settings({
    persistence: true,
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
  });
  
  // Log Firebase app info
  console.log('Firebase Apps:', firebase.apps.map(app => ({
    name: app.name,
    options: app.options
  })));
}
```

#### Build-time Configuration

**Metro Configuration** (`metro.config.js`):
```javascript
const { getDefaultConfig } = require('metro-config');

module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts },
  } = await getDefaultConfig();

  return {
    transformer: {
      babelTransformerPath: require.resolve('react-native-dotenv/babel-transform'),
    },
    resolver: {
      assetExts: assetExts.filter(ext => ext !== 'svg'),
      sourceExts: [...sourceExts, 'svg'],
    },
  };
})();
```

**Babel Configuration** (`.babelrc` or `babel.config.js`):
```javascript
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
      blacklist: null,
      whitelist: null,
      safe: false,
      allowUndefined: true,
    }],
  ],
};
```

This comprehensive environment configuration ensures your React Native Firebase app works correctly across development, staging, and production environments with proper emulator support and type safety.