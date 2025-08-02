// Modern React Native Testing Setup - August 2025
// Using @testing-library/react-native best practices
// Minimal setup - let React Native preset handle most mocks

import 'react-native-gesture-handler/jestSetup';
import '@testing-library/jest-native/extend-expect';

// Only mock what we absolutely need to override from defaults

// Mock React Native Firebase before any imports
jest.mock('@react-native-firebase/app', () => ({
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({})),
  initializeApp: jest.fn(() => ({})),
}));

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({
    currentUser: null,
    isEmulatorEnabled: false,
    useEmulator: jest.fn(),
    signInWithEmailAndPassword: jest.fn().mockResolvedValue({
      user: { uid: 'test-user-123', email: 'test@example.com' }
    }),
    createUserWithEmailAndPassword: jest.fn().mockResolvedValue({
      user: { uid: 'test-user-123', email: 'test@example.com' }
    }),
    signOut: jest.fn().mockResolvedValue(undefined),
    onAuthStateChanged: jest.fn((callback) => {
      callback(null);
      return jest.fn(); // Unsubscribe function
    }),
  }),
  getAuth: jest.fn(() => ({
    currentUser: null,
    signInWithEmailAndPassword: jest.fn().mockResolvedValue({
      user: { uid: 'test-user-123', email: 'test@example.com' }
    }),
    createUserWithEmailAndPassword: jest.fn().mockResolvedValue({
      user: { uid: 'test-user-123', email: 'test@example.com' }
    }),
    signOut: jest.fn().mockResolvedValue(undefined),
    onAuthStateChanged: jest.fn((callback) => {
      callback(null);
      return jest.fn(); // Unsubscribe function
    }),
  })),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  __esModule: true,
  default: () => ({
    isEmulatorEnabled: false,
    useEmulator: jest.fn(),
    settings: jest.fn(),
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: jest.fn().mockReturnValue({}),
          id: 'mock-doc-id',
        }),
        set: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(undefined),
        onSnapshot: jest.fn(),
        collection: jest.fn(),
      })),
      add: jest.fn().mockResolvedValue({ id: 'mock-doc-id' }),
      get: jest.fn().mockResolvedValue({
        docs: [],
        size: 0,
        empty: true,
      }),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      onSnapshot: jest.fn(),
    })),
    doc: jest.fn(),
    batch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    })),
    FieldValue: {
      serverTimestamp: jest.fn(() => 'mock-timestamp'),
      arrayUnion: jest.fn((...items) => ({ arrayUnion: items })),
      arrayRemove: jest.fn((...items) => ({ arrayRemove: items })),
      increment: jest.fn((value) => ({ increment: value })),
      delete: jest.fn(() => ({ delete: true })),
    },
  }),
  getFirestore: jest.fn(() => ({
    settings: jest.fn(),
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: jest.fn().mockReturnValue({}),
          id: 'mock-doc-id',
        }),
        set: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(undefined),
        onSnapshot: jest.fn(),
        collection: jest.fn(),
      })),
      add: jest.fn().mockResolvedValue({ id: 'mock-doc-id' }),
      get: jest.fn().mockResolvedValue({
        docs: [],
        size: 0,
        empty: true,
      }),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      onSnapshot: jest.fn(),
    })),
    doc: jest.fn(),
    batch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    })),
    FieldValue: {
      serverTimestamp: jest.fn(() => 'mock-timestamp'),
      arrayUnion: jest.fn((...items) => ({ arrayUnion: items })),
      arrayRemove: jest.fn((...items) => ({ arrayRemove: items })),
      increment: jest.fn((value) => ({ increment: value })),
      delete: jest.fn(() => ({ delete: true })),
    },
  })),
}));

jest.mock('@react-native-firebase/functions', () => ({
  __esModule: true,
  default: () => ({
    isEmulatorEnabled: false,
    useEmulator: jest.fn(),
    httpsCallable: jest.fn((functionName) => 
      jest.fn().mockResolvedValue({
        data: { 
          success: true, 
          result: `mock-result-${functionName}`,
          prompt: {
            id: 'mock-prompt-id',
            content: 'Mock AI suggestion',
            type: 'check_in',
            urgency: 'medium',
            confidence: 0.85,
          },
          context: {
            id: 'mock-context-id',
            summary: 'Mock context summary',
            sentiment: 'positive',
            entities: ['person', 'event'],
            topics: ['work', 'personal'],
          }
        }
      })
    ),
  }),
  getFunctions: jest.fn(() => ({
    httpsCallable: jest.fn((functionName) => 
      jest.fn().mockResolvedValue({
        data: { 
          success: true, 
          result: `mock-result-${functionName}`,
          prompt: {
            id: 'mock-prompt-id',
            content: 'Mock AI suggestion',
            type: 'check_in',
            urgency: 'medium',
            confidence: 0.85,
          },
          context: {
            id: 'mock-context-id',
            summary: 'Mock context summary',
            sentiment: 'positive',
            entities: ['person', 'event'],
            topics: ['work', 'personal'],
          }
        }
      })
    ),
  })),
}));

// Modern React Navigation mocking
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    NavigationContainer: ({ children }) => children,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      replace: jest.fn(),
      reset: jest.fn(),
      setOptions: jest.fn(),
      dispatch: jest.fn(),
      canGoBack: jest.fn().mockReturnValue(true),
      isFocused: jest.fn().mockReturnValue(true),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }),
    useRoute: () => ({
      key: 'test-route',
      name: 'TestScreen',
      params: {},
    }),
    useFocusEffect: jest.fn(),
    useIsFocused: jest.fn().mockReturnValue(true),
  };
});

// Navigation stack mocks
jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: jest.fn(() => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  })),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: jest.fn(() => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  })),
}));


// Essential third-party mocks that React Native preset doesn't handle
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('@react-native-community/blur', () => ({
  BlurView: 'BlurView',
}));

jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
  useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
}));

// Test utilities and helpers
global.createMockUser = (overrides = {}) => ({
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  ...overrides,
});

global.createMockPerson = (overrides = {}) => ({
  id: 'test-person-123',
  displayName: 'John Doe',
  relationshipType: 'friend',
  relationshipHealth: 8.5,
  relationshipIntensity: 7.0,
  personalContext: 'Close friend from college',
  tags: ['college', 'tech'],
  roles: [],
  contactMethods: [],
  interactions: [],
  lifeEvents: [],
  lastContact: new Date(),
  createdBy: 'test-user-123',
  createdAt: new Date(),
  lastUpdatedAt: new Date(),
  isActive: true,
  ...overrides,
});

global.createMockPrompt = (overrides = {}) => ({
  id: 'test-prompt-123',
  type: 'check_in',
  content: 'Consider reaching out to this person',
  personId: 'test-person-123',
  urgency: 'medium',
  confidence: 0.85,
  reasoning: 'Based on interaction patterns',
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  ...overrides,
});

// Custom matchers for better assertions
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
  
  toHaveValidTimestamp(received) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid timestamp`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid timestamp`,
        pass: false,
      };
    }
  },
});

// Performance testing utility
global.measurePerformance = async (fn, label) => {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  
  if (process.env.NODE_ENV !== 'test' || process.env.VERBOSE_TESTS) {
    console.log(`${label}: ${duration}ms`);
  }
  
  return { result, duration };
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});

// Suppress unnecessary warnings in test environment
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('ReactNative.NativeModules') ||
     args[0].includes('Require cycle:') ||
     args[0].includes('componentWillMount'))
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

console.log('🧪 Modern React Native testing environment initialized');