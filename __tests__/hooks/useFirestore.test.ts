// SOURCE: React Native Testing Library + Jest Official Documentation
// URL: https://testing-library.com/docs/react-native-testing-library/intro + https://jestjs.io/docs/getting-started
// VERIFIED: Official React hooks testing patterns with Firebase mocking

import { renderHook, act } from '@testing-library/react-native';
import {
  useFirestoreDoc,
  useFirestoreCollection,
  useFirestoreOperations,
  useFirestoreConnection,
  useFirestoreBatch,
  firestoreUtils,
} from '../../src/hooks/useFirestore';

// Mock React Native Firebase Firestore
jest.mock('@react-native-firebase/firestore', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        onSnapshot: jest.fn((callback) => {
          // Simulate document exists with data
          callback({
            exists: true,
            id: 'test-doc-id',
            data: () => ({ name: 'Test Document', createdAt: new Date() }),
          });
          return jest.fn(); // Unsubscribe function
        }),
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'test-doc-id',
          data: () => ({ name: 'Test Document' }),
        }),
        set: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(undefined),
      })),
      add: jest.fn().mockResolvedValue({ id: 'new-doc-id' }),
      onSnapshot: jest.fn((callback) => {
        callback({
          docs: [
            {
              id: 'doc-1',
              data: () => ({ name: 'Document 1' }),
            },
            {
              id: 'doc-2', 
              data: () => ({ name: 'Document 2' }),
            },
          ],
        });
        return jest.fn(); // Unsubscribe function
      }),
    })),
    batch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    })),
  })),
  Timestamp: {
    now: jest.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
    fromDate: jest.fn((date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 })),
  },
}));

describe('useFirestore Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useFirestoreDoc', () => {
    test('should fetch and return document data', async () => {
      const { result } = renderHook(() =>
        useFirestoreDoc('users', 'test-user-id')
      );

      expect(result.current.loading).toBe(true);

      // Wait for the hook to process the mock data
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual({
        id: 'test-doc-id',
        name: 'Test Document',
        createdAt: expect.any(Date),
      });
      expect(result.current.error).toBe(null);
    });

    test('should handle null document ID', async () => {
      const { result } = renderHook(() =>
        useFirestoreDoc('users', null)
      );

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);
    });

    test('should handle document not found', async () => {
      const firestore = require('@react-native-firebase/firestore').default;
      firestore.mockImplementationOnce(() => ({
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            onSnapshot: jest.fn((callback) => {
              callback({ exists: false });
              return jest.fn();
            }),
          })),
        })),
      }));

      const { result } = renderHook(() =>
        useFirestoreDoc('users', 'non-existent-id')
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.data).toBe(null);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('useFirestoreCollection', () => {
    test('should fetch and return collection data', async () => {
      const { result } = renderHook(() =>
        useFirestoreCollection('users')
      );

      expect(result.current.loading).toBe(true);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data[0]).toEqual({
        id: 'doc-1',
        name: 'Document 1',
      });
      expect(result.current.error).toBe(null);
    });

    test('should apply query function when provided', async () => {
      const mockQueryFn = jest.fn((ref) => ref);
      
      renderHook(() =>
        useFirestoreCollection('users', mockQueryFn)
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockQueryFn).toHaveBeenCalled();
    });
  });

  describe('useFirestoreOperations', () => {
    test('should add document successfully', async () => {
      const { result } = renderHook(() => useFirestoreOperations());

      let documentId;
      await act(async () => {
        documentId = await result.current.addDocument('users', { name: 'New User' });
      });

      expect(documentId).toBe('new-doc-id');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    test('should update document successfully', async () => {
      const { result } = renderHook(() => useFirestoreOperations());

      let success;
      await act(async () => {
        success = await result.current.updateDocument('users', 'doc-id', { name: 'Updated User' });
      });

      expect(success).toBe(true);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    test('should delete document successfully', async () => {
      const { result } = renderHook(() => useFirestoreOperations());

      let success;
      await act(async () => {
        success = await result.current.deleteDocument('users', 'doc-id');
      });

      expect(success).toBe(true);
      expect(result.current.loading).toBe(false);
    });

    test('should handle operation errors', async () => {
      const firestore = require('@react-native-firebase/firestore').default;
      firestore.mockImplementationOnce(() => ({
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            update: jest.fn().mockRejectedValue(new Error('Update failed')),
          })),
        })),
      }));

      const { result } = renderHook(() => useFirestoreOperations());

      let success;
      await act(async () => {
        success = await result.current.updateDocument('users', 'doc-id', { name: 'Failed Update' });
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Update failed');
    });
  });

  describe('useFirestoreConnection', () => {
    test('should monitor connection status', async () => {
      const { result } = renderHook(() => useFirestoreConnection());

      // Initially assume connected
      expect(result.current.isConnected).toBe(true);
      expect(result.current.isOffline).toBe(false);
    });

    test('should detect offline status', async () => {
      const firestore = require('@react-native-firebase/firestore').default;
      firestore.mockImplementationOnce(() => ({
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            onSnapshot: jest.fn((callback) => {
              callback({
                metadata: {
                  fromCache: true,
                  hasPendingWrites: false,
                },
              });
              return jest.fn();
            }),
          })),
        })),
      }));

      const { result } = renderHook(() => useFirestoreConnection());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isOffline).toBe(true);
    });
  });

  describe('useFirestoreBatch', () => {
    test('should execute batch operations successfully', async () => {
      const { result } = renderHook(() => useFirestoreBatch());

      const operations = [
        {
          type: 'set' as const,
          collection: 'users',
          documentId: 'user-1',
          data: { name: 'User 1' },
        },
        {
          type: 'update' as const,
          collection: 'users',
          documentId: 'user-2',
          data: { name: 'Updated User 2' },
        },
        {
          type: 'delete' as const,
          collection: 'users',
          documentId: 'user-3',
        },
      ];

      let success;
      await act(async () => {
        success = await result.current.executeBatch(operations);
      });

      expect(success).toBe(true);
      expect(result.current.loading).toBe(false);
    });

    test('should handle batch operation errors', async () => {
      const firestore = require('@react-native-firebase/firestore').default;
      firestore.mockImplementationOnce(() => ({
        batch: jest.fn(() => ({
          set: jest.fn(),
          commit: jest.fn().mockRejectedValue(new Error('Batch failed')),
        })),
        collection: jest.fn(() => ({
          doc: jest.fn(),
        })),
      }));

      const { result } = renderHook(() => useFirestoreBatch());

      let success;
      await act(async () => {
        success = await result.current.executeBatch([{
          type: 'set',
          collection: 'users',
          documentId: 'user-1',
          data: { name: 'User 1' },
        }]);
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Batch failed');
    });
  });

  describe('firestoreUtils', () => {
    test('should convert Timestamp to Date', () => {
      const mockTimestamp = {
        toDate: jest.fn(() => new Date('2025-01-01')),
      };

      const date = firestoreUtils.timestampToDate(mockTimestamp as any);
      expect(date).toEqual(new Date('2025-01-01'));
      expect(mockTimestamp.toDate).toHaveBeenCalled();
    });

    test('should handle null Timestamp', () => {
      const date = firestoreUtils.timestampToDate(null);
      expect(date).toBe(null);
    });

    test('should convert Date to Timestamp', () => {
      const testDate = new Date('2025-01-01');
      const timestamp = firestoreUtils.dateToTimestamp(testDate);
      
      const Timestamp = require('@react-native-firebase/firestore').Timestamp;
      expect(Timestamp.fromDate).toHaveBeenCalledWith(testDate);
    });

    test('should create server timestamp', () => {
      const timestamp = firestoreUtils.serverTimestamp();
      
      const Timestamp = require('@react-native-firebase/firestore').Timestamp;
      expect(Timestamp.now).toHaveBeenCalled();
    });

    test('should create document references', () => {
      const firestore = require('@react-native-firebase/firestore').default;
      
      firestoreUtils.docRef('users', 'user-id');
      expect(firestore().collection).toHaveBeenCalledWith('users');
      
      firestoreUtils.collectionRef('users');
      expect(firestore().collection).toHaveBeenCalledWith('users');
    });
  });

  describe('Hook Performance', () => {
    test('should cleanup listeners on unmount', () => {
      const mockUnsubscribe = jest.fn();
      const firestore = require('@react-native-firebase/firestore').default;
      
      firestore.mockImplementationOnce(() => ({
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            onSnapshot: jest.fn(() => mockUnsubscribe),
          })),
        })),
      }));

      const { unmount } = renderHook(() =>
        useFirestoreDoc('users', 'test-user-id')
      );

      unmount();
      
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    test('should handle rapid state changes', async () => {
      const { result, rerender } = renderHook(
        ({ docId }) => useFirestoreDoc('users', docId),
        { initialProps: { docId: 'user-1' } }
      );

      expect(result.current.loading).toBe(true);

      // Change document ID rapidly
      rerender({ docId: 'user-2' });
      rerender({ docId: 'user-3' });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should handle the changes without errors
      expect(result.current.loading).toBe(false);
    });
  });
});