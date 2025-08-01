# React Native Firebase Firestore Service - Official Documentation

## Version: 22.4.0 with Modular API

### Installation

```bash
# Install firestore module (requires app module)
npm install @react-native-firebase/firestore
# or
yarn add @react-native-firebase/firestore

# For iOS
cd ios && pod install
```

### Modular API Imports (v22+)

```typescript
// Modular API imports (v22+)
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  runTransaction,
  writeBatch,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot,
  QuerySnapshot,
  DocumentReference,
  CollectionReference
} from '@react-native-firebase/firestore';

// Legacy namespaced import (deprecated in v22)
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
```

### Basic Firestore Initialization

```typescript
import { getFirestore } from '@react-native-firebase/firestore';

// Get default Firestore instance
const db = getFirestore();

// Or get Firestore instance for specific app
const db = getFirestore(app);
```

### Document Operations

#### Adding Documents

```typescript
import { getFirestore, collection, addDoc, setDoc, doc, serverTimestamp } from '@react-native-firebase/firestore';

const db = getFirestore();

// Add document with auto-generated ID
const addUser = async (userData: { name: string; email: string; age: number }) => {
  try {
    const docRef = await addDoc(collection(db, 'users'), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('Document written with ID: ', docRef.id);
    return docRef;
  } catch (error) {
    console.error('Error adding document: ', error);
    throw error;
  }
};

// Set document with specific ID
const setUser = async (userId: string, userData: { name: string; email: string; age: number }) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('Document set with ID: ', userId);
  } catch (error) {
    console.error('Error setting document: ', error);
    throw error;
  }
};

// Merge with existing document
const updateOrCreateUser = async (userId: string, userData: Partial<{ name: string; email: string; age: number }>) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp()
    }, { merge: true });
    console.log('Document updated/created with ID: ', userId);
  } catch (error) {
    console.error('Error updating document: ', error);
    throw error;
  }
};
```

#### Reading Documents

```typescript
import { getFirestore, doc, getDoc, collection, getDocs } from '@react-native-firebase/firestore';

const db = getFirestore();

// Get single document
const getUser = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      console.log('Document data:', docSnap.data());
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log('No such document!');
      return null;
    }
  } catch (error) {
    console.error('Error getting document: ', error);
    throw error;
  }
};

// Get all documents in collection
const getAllUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const users: any[] = [];
    
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    return users;
  } catch (error) {
    console.error('Error getting documents: ', error);
    throw error;
  }
};
```

#### Updating Documents

```typescript
import { getFirestore, doc, updateDoc, serverTimestamp } from '@react-native-firebase/firestore';

const db = getFirestore();

// Update specific fields
const updateUser = async (userId: string, updates: Partial<{ name: string; email: string; age: number }>) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    console.log('Document updated successfully');
  } catch (error) {
    console.error('Error updating document: ', error);
    throw error;
  }
};
```

#### Deleting Documents

```typescript
import { getFirestore, doc, deleteDoc } from '@react-native-firebase/firestore';

const db = getFirestore();

// Delete document
const deleteUser = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    console.log('Document deleted successfully');
  } catch (error) {
    console.error('Error deleting document: ', error);
    throw error;
  }
};
```

### Querying Data

```typescript
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  getDocs 
} from '@react-native-firebase/firestore';

const db = getFirestore();

// Simple query
const getAdultUsers = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('age', '>=', 18)
    );
    
    const querySnapshot = await getDocs(q);
    const users: any[] = [];
    
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    return users;
  } catch (error) {
    console.error('Error querying documents: ', error);
    throw error;
  }
};

// Complex query with multiple conditions
const getFilteredUsers = async (minAge: number, maxResults: number) => {
  try {
    const q = query(
      collection(db, 'users'),
      where('age', '>=', minAge),
      where('active', '==', true),
      orderBy('age', 'desc'),
      orderBy('name', 'asc'),
      limit(maxResults)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error in complex query: ', error);
    throw error;
  }
};

// Pagination
const getUsersPaginated = async (pageSize: number, lastDoc?: DocumentSnapshot) => {
  try {
    let q = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );
    
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    
    const querySnapshot = await getDocs(q);
    const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    return { users, lastVisible };
  } catch (error) {
    console.error('Error in paginated query: ', error);
    throw error;
  }
};
```

### Real-time Listeners

```typescript
import { getFirestore, collection, doc, onSnapshot, query, where } from '@react-native-firebase/firestore';

const db = getFirestore();

// Listen to single document
const subscribeToUser = (userId: string, callback: (userData: any) => void) => {
  const userRef = doc(db, 'users', userId);
  
  const unsubscribe = onSnapshot(
    userRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() });
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error listening to document: ', error);
    }
  );
  
  return unsubscribe;
};

// Listen to collection query
const subscribeToActiveUsers = (callback: (users: any[]) => void) => {
  const q = query(
    collection(db, 'users'),
    where('active', '==', true),
    orderBy('lastSeen', 'desc')
  );
  
  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const users: any[] = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      callback(users);
    },
    (error) => {
      console.error('Error listening to collection: ', error);
    }
  );
  
  return unsubscribe;
};

// Usage in React component
const UserList = () => {
  const [users, setUsers] = useState<any[]>([]);
  
  useEffect(() => {
    const unsubscribe = subscribeToActiveUsers(setUsers);
    
    // Cleanup listener on unmount
    return unsubscribe;
  }, []);
  
  return (
    <View>
      {users.map(user => (
        <Text key={user.id}>{user.name}</Text>
      ))}
    </View>
  );
};
```

### Transactions

```typescript
import { getFirestore, doc, runTransaction } from '@react-native-firebase/firestore';

const db = getFirestore();

// Transfer credits between users
const transferCredits = async (fromUserId: string, toUserId: string, amount: number) => {
  try {
    await runTransaction(db, async (transaction) => {
      const fromUserRef = doc(db, 'users', fromUserId);
      const toUserRef = doc(db, 'users', toUserId);
      
      const fromUserDoc = await transaction.get(fromUserRef);
      const toUserDoc = await transaction.get(toUserRef);
      
      if (!fromUserDoc.exists() || !toUserDoc.exists()) {
        throw new Error('One or both users do not exist');
      }
      
      const fromUserData = fromUserDoc.data();
      const toUserData = toUserDoc.data();
      
      if (fromUserData.credits < amount) {
        throw new Error('Insufficient credits');
      }
      
      transaction.update(fromUserRef, {
        credits: fromUserData.credits - amount,
        updatedAt: serverTimestamp()
      });
      
      transaction.update(toUserRef, {
        credits: toUserData.credits + amount,
        updatedAt: serverTimestamp()
      });
    });
    
    console.log('Credits transferred successfully');
  } catch (error) {
    console.error('Transaction failed: ', error);
    throw error;
  }
};
```

### Batch Writes

```typescript
import { getFirestore, doc, writeBatch, serverTimestamp } from '@react-native-firebase/firestore';

const db = getFirestore();

// Batch create multiple users
const createMultipleUsers = async (users: Array<{ name: string; email: string; age: number }>) => {
  try {
    const batch = writeBatch(db);
    
    users.forEach((userData, index) => {
      const userRef = doc(collection(db, 'users'));
      batch.set(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    console.log('Batch write completed successfully');
  } catch (error) {
    console.error('Batch write failed: ', error);
    throw error;
  }
};
```

### TypeScript Types

```typescript
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// Document snapshot types
type DocumentSnapshot = FirebaseFirestoreTypes.DocumentSnapshot;
type QuerySnapshot = FirebaseFirestoreTypes.QuerySnapshot;

// Reference types
type DocumentReference = FirebaseFirestoreTypes.DocumentReference;
type CollectionReference = FirebaseFirestoreTypes.CollectionReference;

// Timestamp type
type Timestamp = FirebaseFirestoreTypes.Timestamp;

// User interface example
interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Typed document operations
const addTypedUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
  const docRef = await addDoc(collection(db, 'users'), {
    ...userData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef;
};

const getTypedUser = async (userId: string): Promise<User | null> => {
  const docSnap = await getDoc(doc(db, 'users', userId));
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as User;
  }
  
  return null;
};
```

### Environment Configuration

```typescript
import { getFirestore, connectFirestoreEmulator } from '@react-native-firebase/firestore';

// Connect to Firestore emulator in development
const configureFirestore = () => {
  const db = getFirestore();
  
  if (__DEV__) {
    // Connect to local emulator
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
    } catch (error) {
      // Emulator connection might already be established
      console.log('Firestore emulator connection:', error);
    }
  }
  
  return db;
};

// Initialize Firestore with emulator connection
const db = configureFirestore();
```

### Offline Capabilities

```typescript
import { getFirestore, enableNetwork, disableNetwork } from '@react-native-firebase/firestore';

const db = getFirestore();

// Enable/disable network
const toggleOfflineMode = async (offline: boolean) => {
  try {
    if (offline) {
      await disableNetwork(db);
      console.log('Firestore offline mode enabled');
    } else {
      await enableNetwork(db);
      console.log('Firestore online mode enabled');
    }
  } catch (error) {
    console.error('Error toggling network:', error);
  }
};
```

### Custom Hooks for Firestore

```typescript
import { useState, useEffect } from 'react';
import { getFirestore, doc, onSnapshot, DocumentSnapshot } from '@react-native-firebase/firestore';

// Hook for document subscription
export const useDocument = <T>(collectionName: string, documentId: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const db = getFirestore();
    const docRef = doc(db, collectionName, documentId);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setData({ id: docSnap.id, ...docSnap.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      (error) => {
        setError(error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [collectionName, documentId]);

  return { data, loading, error };
};

// Usage
const UserProfile = ({ userId }: { userId: string }) => {
  const { data: user, loading, error } = useDocument<User>('users', userId);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return <NotFound />;

  return <UserDetails user={user} />;
};
```