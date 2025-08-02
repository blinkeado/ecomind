// SOURCE: React Native Firebase Firestore Official Documentation
// URL: https://rnfirebase.io/firestore/usage
// VERIFIED: Official React Native Firebase v22.4.0 Firestore patterns

import { useState, useEffect, useCallback } from 'react';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

/**
 * Generic Firestore Document Hook
 * Provides real-time access to a single Firestore document
 * SOURCE: React Native Firebase Firestore Documentation - Real-time Updates
 */
export const useFirestoreDoc = <T = FirebaseFirestoreTypes.DocumentData>(
  collection: string,
  documentId: string | null,
  options: {
    includeMetadataChanges?: boolean;
    source?: 'default' | 'server' | 'cache';
  } = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = firestore()
      .collection(collection)
      .doc(documentId)
      .onSnapshot(
        (documentSnapshot) => {
          if (documentSnapshot.exists) {
            const docData = {
              id: documentSnapshot.id,
              ...documentSnapshot.data(),
            } as T;
            setData(docData);
          } else {
            setData(null);
          }
          setLoading(false);
        },
        (err) => {
          console.error(`🔥 Firestore Error (${collection}/${documentId}):`, err);
          setError(err.message);
          setLoading(false);
        },
        options.includeMetadataChanges
      );

    return unsubscribe;
  }, [collection, documentId, options.includeMetadataChanges]);

  return { data, loading, error };
};

/**
 * Generic Firestore Collection Hook
 * Provides real-time access to a Firestore collection with query support
 * SOURCE: React Native Firebase Firestore Documentation - Querying
 */
export const useFirestoreCollection = <T = FirebaseFirestoreTypes.DocumentData>(
  collection: string,
  queryFn?: (ref: FirebaseFirestoreTypes.CollectionReference) => FirebaseFirestoreTypes.Query,
  options: {
    includeMetadataChanges?: boolean;
    source?: 'default' | 'server' | 'cache';
  } = {}
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    let query: FirebaseFirestoreTypes.Query | FirebaseFirestoreTypes.CollectionReference = 
      firestore().collection(collection);

    if (queryFn) {
      query = queryFn(firestore().collection(collection));
    }

    const unsubscribe = query.onSnapshot(
      (querySnapshot) => {
        const documents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        
        setData(documents);
        setLoading(false);
      },
      (err) => {
        console.error(`🔥 Firestore Error (${collection}):`, err);
        setError(err.message);
        setLoading(false);
      },
      options.includeMetadataChanges
    );

    return unsubscribe;
  }, [collection, queryFn, options.includeMetadataChanges]);

  return { data, loading, error };
};

/**
 * Firestore Document Operations Hook
 * Provides CRUD operations for Firestore documents
 * SOURCE: React Native Firebase Firestore Documentation - Writing Data
 */
export const useFirestoreOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Add document to collection
   */
  const addDocument = useCallback(async (
    collection: string,
    data: Record<string, any>
  ): Promise<string | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const docRef = await firestore()
        .collection(collection)
        .add({
          ...data,
          createdAt: firestore.Timestamp.now(),
          lastUpdated: firestore.Timestamp.now(),
        });
      
      setLoading(false);
      return docRef.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add document';
      setError(errorMessage);
      setLoading(false);
      console.error(`🔥 Firestore Error (Add ${collection}):`, err);
      return null;
    }
  }, []);

  /**
   * Update document in collection
   */
  const updateDocument = useCallback(async (
    collection: string,
    documentId: string,
    data: Record<string, any>
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await firestore()
        .collection(collection)
        .doc(documentId)
        .update({
          ...data,
          lastUpdated: firestore.Timestamp.now(),
        });
      
      setLoading(false);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update document';
      setError(errorMessage);
      setLoading(false);
      console.error(`🔥 Firestore Error (Update ${collection}/${documentId}):`, err);
      return false;
    }
  }, []);

  /**
   * Delete document from collection
   */
  const deleteDocument = useCallback(async (
    collection: string,
    documentId: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await firestore()
        .collection(collection)
        .doc(documentId)
        .delete();
      
      setLoading(false);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete document';
      setError(errorMessage);
      setLoading(false);
      console.error(`🔥 Firestore Error (Delete ${collection}/${documentId}):`, err);
      return false;
    }
  }, []);

  /**
   * Set document in collection (create or overwrite)
   */
  const setDocument = useCallback(async (
    collection: string,
    documentId: string,
    data: Record<string, any>,
    merge = false
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await firestore()
        .collection(collection)
        .doc(documentId)
        .set({
          ...data,
          createdAt: firestore.Timestamp.now(),
          lastUpdated: firestore.Timestamp.now(),
        }, { merge });
      
      setLoading(false);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set document';
      setError(errorMessage);
      setLoading(false);
      console.error(`🔥 Firestore Error (Set ${collection}/${documentId}):`, err);
      return false;
    }
  }, []);

  return {
    addDocument,
    updateDocument,
    deleteDocument,
    setDocument,
    loading,
    error,
  };
};

/**
 * Firestore Connection Status Hook
 * Monitors Firestore connection and offline status
 * SOURCE: React Native Firebase Firestore Documentation - Offline Support
 */
export const useFirestoreConnection = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [hasPendingWrites, setHasPendingWrites] = useState(false);

  useEffect(() => {
    // Monitor connection status through a minimal document
    const unsubscribe = firestore()
      .collection('_connection')
      .doc('status')
      .onSnapshot(
        (snapshot) => {
          const metadata = snapshot.metadata;
          setIsConnected(!metadata.fromCache);
          setHasPendingWrites(metadata.hasPendingWrites);
        },
        (error) => {
          console.warn('🔥 Firestore Connection Monitor Error:', error);
          setIsConnected(false);
        },
        true // Include metadata changes
      );

    return unsubscribe;
  }, []);

  return {
    isConnected,
    hasPendingWrites,
    isOffline: !isConnected,
  };
};

/**
 * Firestore Batch Operations Hook
 * Provides atomic batch operations for multiple documents
 * SOURCE: React Native Firebase Firestore Documentation - Batch Writes
 */
export const useFirestoreBatch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeBatch = useCallback(async (
    operations: Array<{
      type: 'set' | 'update' | 'delete';
      collection: string;
      documentId: string;
      data?: Record<string, any>;
      merge?: boolean;
    }>
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const batch = firestore().batch();

      operations.forEach(({ type, collection, documentId, data, merge }) => {
        const docRef = firestore().collection(collection).doc(documentId);

        switch (type) {
          case 'set':
            batch.set(docRef, {
              ...data,
              lastUpdated: firestore.Timestamp.now(),
            }, { merge: merge || false });
            break;
          case 'update':
            batch.update(docRef, {
              ...data,
              lastUpdated: firestore.Timestamp.now(),
            });
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });

      await batch.commit();
      setLoading(false);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch operation failed';
      setError(errorMessage);
      setLoading(false);
      console.error('🔥 Firestore Batch Error:', err);
      return false;
    }
  }, []);

  return {
    executeBatch,
    loading,
    error,
  };
};

/**
 * Export commonly used Firestore utilities
 */
export const firestoreUtils = {
  /**
   * Convert Firestore Timestamp to JavaScript Date
   */
  timestampToDate: (timestamp: FirebaseFirestoreTypes.Timestamp | null): Date | null => {
    return timestamp ? timestamp.toDate() : null;
  },

  /**
   * Convert JavaScript Date to Firestore Timestamp
   */
  dateToTimestamp: (date: Date): FirebaseFirestoreTypes.Timestamp => {
    return firestore.Timestamp.fromDate(date);
  },

  /**
   * Get current Firestore server timestamp
   */
  serverTimestamp: () => firestore.Timestamp.now(),

  /**
   * Create a document reference
   */
  docRef: (collection: string, documentId?: string) => {
    return documentId 
      ? firestore().collection(collection).doc(documentId)
      : firestore().collection(collection).doc();
  },

  /**
   * Create a collection reference
   */
  collectionRef: (collection: string) => firestore().collection(collection),
};

export default {
  useFirestoreDoc,
  useFirestoreCollection,
  useFirestoreOperations,
  useFirestoreConnection,
  useFirestoreBatch,
  firestoreUtils,
};