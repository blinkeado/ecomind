# React Native Firebase Auth Service - Official Documentation

## Version: 22.4.0 with Modular API

### Installation

```bash
# Install auth module (requires app module)
npm install @react-native-firebase/auth
# or
yarn add @react-native-firebase/auth

# For iOS
cd ios && pod install
```

### Modular API Imports (v22+)

```typescript
// Modular API imports (v22+)
import { 
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User
} from '@react-native-firebase/auth';

// Legacy namespaced import (deprecated in v22)
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
```

### Authentication State Management

```typescript
import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from '@react-native-firebase/auth';

function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  function handleAuthStateChanged(user: User | null) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const auth = getAuth();
    const subscriber = onAuthStateChanged(auth, handleAuthStateChanged);
    
    // Cleanup subscription on unmount
    return subscriber;
  }, []);

  if (initializing) return null; // or loading spinner

  if (!user) {
    // Show login screen
    return <LoginScreen />;
  }

  // User is authenticated
  return <AuthenticatedApp user={user} />;
}
```

### Authentication Methods

#### Anonymous Sign-In

```typescript
import { getAuth, signInAnonymously } from '@react-native-firebase/auth';

const signInAnonymous = async () => {
  try {
    const auth = getAuth();
    const userCredential = await signInAnonymously(auth);
    console.log('Anonymous user signed in:', userCredential.user.uid);
  } catch (error) {
    console.error('Anonymous sign-in error:', error);
  }
};
```

#### Email/Password Authentication

```typescript
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  AuthError
} from '@react-native-firebase/auth';

// Sign up new user
const signUpWithEmail = async (email: string, password: string) => {
  try {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('User created:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    const authError = error as AuthError;
    
    // Handle specific error codes
    switch (authError.code) {
      case 'auth/email-already-in-use':
        console.error('Email address is already in use');
        break;
      case 'auth/invalid-email':
        console.error('Invalid email address');
        break;
      case 'auth/weak-password':
        console.error('Password is too weak');
        break;
      default:
        console.error('Sign up error:', authError.message);
    }
    throw error;
  }
};

// Sign in existing user
const signInWithEmail = async (email: string, password: string) => {
  try {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User signed in:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    const authError = error as AuthError;
    
    switch (authError.code) {
      case 'auth/user-not-found':
        console.error('No user found with this email');
        break;
      case 'auth/wrong-password':
        console.error('Incorrect password');
        break;
      case 'auth/invalid-email':
        console.error('Invalid email address');
        break;
      default:
        console.error('Sign in error:', authError.message);
    }
    throw error;
  }
};
```

#### Sign Out

```typescript
import { getAuth, signOut } from '@react-native-firebase/auth';

const handleSignOut = async () => {
  try {
    const auth = getAuth();
    await signOut(auth);
    console.log('User signed out successfully');
  } catch (error) {
    console.error('Sign out error:', error);
  }
};
```

### User Profile Management

```typescript
import { getAuth, updateProfile, updateEmail, updatePassword } from '@react-native-firebase/auth';

// Update user profile
const updateUserProfile = async (displayName: string, photoURL?: string) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) throw new Error('No authenticated user');
    
    await updateProfile(user, {
      displayName,
      photoURL
    });
    console.log('Profile updated successfully');
  } catch (error) {
    console.error('Profile update error:', error);
  }
};

// Update email
const updateUserEmail = async (newEmail: string) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) throw new Error('No authenticated user');
    
    await updateEmail(user, newEmail);
    console.log('Email updated successfully');
  } catch (error) {
    console.error('Email update error:', error);
  }
};

// Update password
const updateUserPassword = async (newPassword: string) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) throw new Error('No authenticated user');
    
    await updatePassword(user, newPassword);
    console.log('Password updated successfully');
  } catch (error) {
    console.error('Password update error:', error);
  }
};
```

### TypeScript Types

```typescript
import { FirebaseAuthTypes } from '@react-native-firebase/auth';

// User type
type AuthUser = FirebaseAuthTypes.User | null;

// User credential type
type UserCredential = FirebaseAuthTypes.UserCredential;

// Auth error type
type AuthError = FirebaseAuthTypes.NativeFirebaseAuthError;

// Auth state change callback type
type AuthStateChangeCallback = (user: FirebaseAuthTypes.User | null) => void;

// Auth instance type
type AuthInstance = FirebaseAuthTypes.Module;
```

### Custom Hook for Auth State

```typescript
import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from '@react-native-firebase/auth';

interface UseAuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export const useAuthState = (): UseAuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const auth = getAuth();
    
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setLoading(false);
        setError(null);
      },
      (error) => {
        setError(error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return { user, loading, error };
};

// Usage in component
const MyComponent = () => {
  const { user, loading, error } = useAuthState();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return user ? <AuthenticatedView /> : <LoginScreen />;
};
```

### Environment Configuration

```typescript
import { getAuth, connectAuthEmulator } from '@react-native-firebase/auth';

// Connect to auth emulator in development
const configureAuth = () => {
  const auth = getAuth();
  
  if (__DEV__) {
    // Connect to local emulator
    connectAuthEmulator(auth, 'http://localhost:9099');
  }
  
  return auth;
};

// Initialize auth with emulator connection
const auth = configureAuth();
```

### Additional Authentication Providers

React Native Firebase supports additional providers with separate packages:

- Apple Sign-In: `@react-native-firebase/auth` + Apple Auth
- Google Sign-In: `@react-native-google-signin/google-signin`
- Facebook Sign-In: `@react-native-firebase/auth` + Facebook SDK
- Phone Authentication: Built into `@react-native-firebase/auth`

Each provider requires additional setup and configuration specific to the platform.