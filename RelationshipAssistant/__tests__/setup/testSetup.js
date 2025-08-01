// SOURCE: Phase 7 Testing - Global test setup and configuration
// VERIFIED: Jest test environment setup with mocks and utilities

import 'react-native-gesture-handler/jestSetup';

// Mock React Native components and APIs
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  return {
    ...RN,
    // Alert mock
    Alert: {
      alert: jest.fn((title, message, buttons) => {
        const confirmButton = buttons?.find(btn => 
          btn.text !== 'Cancel' && btn.style !== 'cancel'
        );
        if (confirmButton?.onPress) {
          confirmButton.onPress();
        }
      }),
    },
    
    // Platform mock
    Platform: {
      ...RN.Platform,
      OS: 'ios',
      select: jest.fn(options => options.ios || options.default),
    },
    
    // Dimensions mock
    Dimensions: {
      get: jest.fn(() => ({
        width: 375,
        height: 812,
        scale: 3,
        fontScale: 1,
      })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    
    // StatusBar mock
    StatusBar: {
      setBarStyle: jest.fn(),
      setBackgroundColor: jest.fn(),
      setTranslucent: jest.fn(),
    },
    
    // Linking mock
    Linking: {
      openURL: jest.fn().mockResolvedValue(true),
      canOpenURL: jest.fn().mockResolvedValue(true),
      getInitialURL: jest.fn().mockResolvedValue(null),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    
    // PermissionsAndroid mock
    PermissionsAndroid: {
      request: jest.fn().mockResolvedValue('granted'),
      requestMultiple: jest.fn().mockResolvedValue({}),
      check: jest.fn().mockResolvedValue(true),
      PERMISSIONS: {
        ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
        READ_CONTACTS: 'android.permission.READ_CONTACTS',
        CAMERA: 'android.permission.CAMERA',
      },
      RESULTS: {
        GRANTED: 'granted',
        DENIED: 'denied',
        NEVER_ASK_AGAIN: 'never_ask_again',
      },
    },
  };
});

// Mock React Navigation
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

// Mock React Navigation Stack
jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: jest.fn(() => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  })),
}));

// Mock React Navigation Bottom Tabs
jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: jest.fn(() => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  })),
}));

// Mock Firebase
jest.mock('../../src/config/firebase', () => ({
  auth: {
    currentUser: null,
    signInWithEmailAndPassword: jest.fn().mockResolvedValue({
      user: { uid: 'test-user-123', email: 'test@example.com' }
    }),
    createUserWithEmailAndPassword: jest.fn().mockResolvedValue({
      user: { uid: 'test-user-123', email: 'test@example.com' }
    }),
    signOut: jest.fn().mockResolvedValue(undefined),
    onAuthStateChanged: jest.fn((callback) => {
      callback(null); // No user initially
      return jest.fn(); // Unsubscribe function
    }),
  },
  firestore: {
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
  },
  functions: {
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
  },
}));

// Mock Async Storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
  getAllKeys: jest.fn().mockResolvedValue([]),
  multiGet: jest.fn().mockResolvedValue([]),
  multiSet: jest.fn().mockResolvedValue(undefined),
  multiRemove: jest.fn().mockResolvedValue(undefined),
}));

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  
  // The mock for `call` immediately calls the callback which is incorrect
  // So we override it with a no-op
  Reanimated.default.call = () => {};
  
  return Reanimated;
});

// Mock community blur
jest.mock('@react-native-community/blur', () => ({
  BlurView: 'BlurView',
}));

// Mock vector icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

// Mock safe area
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
  useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
}));

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock timers for consistent testing
global.Date = Date;
global.setTimeout = setTimeout;
global.clearTimeout = clearTimeout;
global.setInterval = setInterval;
global.clearInterval = clearInterval;

// Test data factories
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

// Custom matchers
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

// Performance testing utilities
global.measurePerformance = async (fn, label) => {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  
  if (process.env.NODE_ENV !== 'test' || process.env.VERBOSE_TESTS) {
    console.log(`${label}: ${duration}ms`);
  }
  
  return { result, duration };
};

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});

// Global error handling for tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Suppress React Native warnings in tests
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

console.log('🧪 Test environment initialized with comprehensive mocks and utilities');