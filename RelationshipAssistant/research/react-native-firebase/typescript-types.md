# React Native Firebase TypeScript Types - Official Documentation

## Version: 22.4.0 Type Definitions

### Core App Types

```typescript
import firebase, { FirebaseApp } from '@react-native-firebase/app';

// Firebase App instance type
type FirebaseApp = FirebaseApp;

// App configuration type
interface FirebaseOptions {
  apiKey: string;
  appId: string;
  databaseURL?: string;
  messagingSenderId?: string;
  projectId: string;
  storageBucket?: string;
  authDomain?: string;
  measurementId?: string;
  clientId?: string;
}

// App initialization config
interface FirebaseAppConfig {
  name: string;
  automaticDataCollectionEnabled?: boolean;
}

// Platform-specific credentials
interface PlatformCredentials {
  android?: FirebaseOptions;
  ios?: FirebaseOptions;
}
```

### Authentication Types

```typescript
import { FirebaseAuthTypes } from '@react-native-firebase/auth';

// User type
type User = FirebaseAuthTypes.User;

// Auth state change callback
type AuthStateChangeCallback = (user: FirebaseAuthTypes.User | null) => void;

// User credential
type UserCredential = FirebaseAuthTypes.UserCredential;

// Auth error
type AuthError = FirebaseAuthTypes.NativeFirebaseAuthError;

// Auth provider types
type AuthProvider = FirebaseAuthTypes.AuthProvider;
type EmailAuthProvider = FirebaseAuthTypes.EmailAuthProvider;
type PhoneAuthProvider = FirebaseAuthTypes.PhoneAuthProvider;
type GoogleAuthProvider = FirebaseAuthTypes.GoogleAuthProvider;
type FacebookAuthProvider = FirebaseAuthTypes.FacebookAuthProvider;
type AppleAuthProvider = FirebaseAuthTypes.AppleAuthProvider;

// User profile update data
interface UserProfileUpdateData {
  displayName?: string | null;
  photoURL?: string | null;
}

// Phone auth credential
interface PhoneAuthCredential {
  providerId: string;
  signInMethod: string;
  verificationId: string;
  verificationCode: string;
}

// Multi-factor types
type MultiFactorSession = FirebaseAuthTypes.MultiFactorSession;
type MultiFactorInfo = FirebaseAuthTypes.MultiFactorInfo;
type MultiFactorResolver = FirebaseAuthTypes.MultiFactorResolver;

// Custom claims type
type CustomClaims = { [key: string]: any };

// User metadata
interface UserMetadata {
  creationTime?: string;
  lastSignInTime?: string;
}
```

### Firestore Types

```typescript
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// Document types
type DocumentSnapshot<T = FirebaseFirestoreTypes.DocumentData> = FirebaseFirestoreTypes.DocumentSnapshot<T>;
type QuerySnapshot<T = FirebaseFirestoreTypes.DocumentData> = FirebaseFirestoreTypes.QuerySnapshot<T>;
type QueryDocumentSnapshot<T = FirebaseFirestoreTypes.DocumentData> = FirebaseFirestoreTypes.QueryDocumentSnapshot<T>;

// Reference types
type DocumentReference<T = FirebaseFirestoreTypes.DocumentData> = FirebaseFirestoreTypes.DocumentReference<T>;
type CollectionReference<T = FirebaseFirestoreTypes.DocumentData> = FirebaseFirestoreTypes.CollectionReference<T>;
type Query<T = FirebaseFirestoreTypes.DocumentData> = FirebaseFirestoreTypes.Query<T>;

// Data types
type DocumentData = FirebaseFirestoreTypes.DocumentData;
type FieldValue = FirebaseFirestoreTypes.FieldValue;
type Timestamp = FirebaseFirestoreTypes.Timestamp;
type GeoPoint = FirebaseFirestoreTypes.GeoPoint;

// Transaction and batch types
type Transaction = FirebaseFirestoreTypes.Transaction;
type WriteBatch = FirebaseFirestoreTypes.WriteBatch;

// Settings types
interface FirestoreSettings {
  host?: string;
  ssl?: boolean;
  persistence?: boolean;
  cacheSizeBytes?: number;
  experimentalForceLongPolling?: boolean;
  ignoreUndefinedProperties?: boolean;
}

// Query constraint types
type WhereFilterOp = FirebaseFirestoreTypes.WhereFilterOp;
type OrderByDirection = FirebaseFirestoreTypes.OrderByDirection;

// Document change types
type DocumentChangeType = FirebaseFirestoreTypes.DocumentChangeType;
type DocumentChange<T = DocumentData> = FirebaseFirestoreTypes.DocumentChange<T>;

// Listener types
type SnapshotListenOptions = FirebaseFirestoreTypes.SnapshotListenOptions;
type SnapshotMetadata = FirebaseFirestoreTypes.SnapshotMetadata;

// Server timestamp type
type ServerTimestamp = FirebaseFirestoreTypes.FieldValue;
```

### Functions Types

```typescript
import { FirebaseFunctionsTypes } from '@react-native-firebase/functions';

// Functions instance
type Functions = FirebaseFunctionsTypes.Module;

// Callable function
type HttpsCallable<T = any, R = any> = FirebaseFunctionsTypes.HttpsCallable<T, R>;
type HttpsCallableResult<T = any> = FirebaseFunctionsTypes.HttpsCallableResult<T>;

// Function error
type FunctionsError = FirebaseFunctionsTypes.HttpsError;
type FunctionsErrorCode = FirebaseFunctionsTypes.HttpsErrorCode;
```

### Custom Type Interfaces

```typescript
// User profile interface
interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  customClaims?: CustomClaims;
}

// Firestore document with ID
interface DocumentWithId<T = DocumentData> extends T {
  id: string;
}

// Paginated query result
interface PaginatedResult<T> {
  data: T[];
  lastVisible: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

// API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// Auth state
interface AuthState {
  user: User | null;
  loading: boolean;
  error: AuthError | null;
  authenticated: boolean;
}

// Firestore hook state
interface FirestoreHookState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

// Collection hook state
interface CollectionHookState<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  loadMore?: () => void;
  hasMore?: boolean;
}
```

### Generic Types and Utilities

```typescript
// Generic document type
type Document<T = DocumentData> = T & {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// Partial update type
type PartialUpdate<T> = Partial<Omit<T, 'id' | 'createdAt'>> & {
  updatedAt: FieldValue;
};

// Create document type (without auto-generated fields)
type CreateDocument<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

// Firestore converter type
interface FirestoreDataConverter<T> {
  toFirestore(modelObject: T): DocumentData;
  toFirestore(modelObject: Partial<T>, options: SetOptions): DocumentData;
  fromFirestore(snapshot: QueryDocumentSnapshot): T;
}

// Query builder type
type QueryConstraint = 
  | ReturnType<typeof where>
  | ReturnType<typeof orderBy>
  | ReturnType<typeof limit>
  | ReturnType<typeof startAfter>
  | ReturnType<typeof endBefore>;

// Listener unsubscribe function
type Unsubscribe = () => void;

// Firebase error with code
interface FirebaseError extends Error {
  code: string;
  details?: any;
}
```

### Hook Types

```typescript
// Auth hook return type
interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: AuthError | null;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// Document hook return type
interface UseDocumentReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  update: (data: Partial<T>) => Promise<void>;
  delete: () => Promise<void>;
  refresh: () => void;
}

// Collection hook return type
interface UseCollectionReturn<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  add: (data: CreateDocument<T>) => Promise<DocumentReference>;
  refresh: () => void;
}

// Query hook return type
interface UseQueryReturn<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  loadMore?: () => Promise<void>;
  hasMore?: boolean;
  refresh: () => void;
}
```

### Component Props Types

```typescript
// Auth component props
interface AuthProviderProps {
  children: React.ReactNode;
  onAuthStateChanged?: (user: User | null) => void;
}

// Protected route props
interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ComponentType;
  requireAuth?: boolean;
}

// User profile props
interface UserProfileProps {
  user: User;
  editable?: boolean;
  onUpdate?: (data: UserProfileUpdateData) => Promise<void>;
}

// Document list props
interface DocumentListProps<T> {
  data: T[];
  loading?: boolean;
  error?: Error | null;
  onItemPress?: (item: T) => void;
  onRefresh?: () => void;
  ListEmptyComponent?: React.ComponentType;
}
```

### Environment Types

```typescript
// Environment configuration
interface EnvironmentConfig {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
  emulators?: {
    auth?: { host: string; port: number };
    firestore?: { host: string; port: number };
    functions?: { host: string; port: number };
  };
}

// Build configuration
interface BuildConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  useEmulators: boolean;
  debugMode: boolean;
}
```

### Type Guards

```typescript
// Type guard for Firebase user
const isAuthenticatedUser = (user: User | null): user is User => {
  return user !== null;
};

// Type guard for document existence
const documentExists = <T>(
  snapshot: DocumentSnapshot<T>
): snapshot is QueryDocumentSnapshot<T> => {
  return snapshot.exists();
};

// Type guard for Firebase error
const isFirebaseError = (error: any): error is FirebaseError => {
  return error && typeof error.code === 'string';
};

// Type guard for auth error
const isAuthError = (error: any): error is AuthError => {
  return error && error.code && error.code.startsWith('auth/');
};
```

### Module Declaration Augmentation

```typescript
// Extend Firebase user with custom properties
declare module '@react-native-firebase/auth' {
  namespace FirebaseAuthTypes {
    interface User {
      customProfile?: {
        preferences: Record<string, any>;
        metadata: Record<string, any>;
      };
    }
  }
}

// Extend Firestore document data
declare module '@react-native-firebase/firestore' {
  namespace FirebaseFirestoreTypes {
    interface DocumentData {
      createdAt?: Timestamp;
      updatedAt?: Timestamp;
    }
  }
}
```

### Usage Examples with Types

```typescript
// Typed user service
class UserService {
  private db = getFirestore();
  
  async createUser(userData: CreateDocument<UserProfile>): Promise<DocumentWithId<UserProfile>> {
    const docRef = await addDoc(collection(this.db, 'users'), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    const doc = await getDoc(docRef);
    return { id: doc.id, ...doc.data() } as DocumentWithId<UserProfile>;
  }
  
  async getUser(userId: string): Promise<UserProfile | null> {
    const docSnap = await getDoc(doc(this.db, 'users', userId));
    
    if (documentExists(docSnap)) {
      return { id: docSnap.id, ...docSnap.data() } as UserProfile;
    }
    
    return null;
  }
}

// Typed auth context
interface AuthContextType extends UseAuthReturn {
  user: User | null;
  userProfile: UserProfile | null;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Custom hook with proper typing
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

This comprehensive type system ensures type safety throughout your React Native Firebase implementation while providing excellent IntelliSense support and compile-time error checking.