// SOURCE: Phase 7 Testing - Jest configuration for comprehensive test coverage
// VERIFIED: Complete test configuration for unit, integration, and e2e tests

module.exports = {
  preset: 'react-native',
  
  // Test environment setup
  testEnvironment: 'node',
  setupFilesAfterEnv: [
    '<rootDir>/__tests__/setup/testSetup.js'
  ],

  // Module resolution
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },

  // Module name mapping for React Native and custom paths
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/__tests__/$1',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__tests__/mocks/fileMock.js',
  },

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],

  // Files to ignore
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/android/',
    '<rootDir>/ios/',
    '<rootDir>/__tests__/setup/',
    '<rootDir>/__tests__/mocks/',
  ],

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/config/**',
    '!src/types/**',
    '!src/utils/constants.ts',
  ],

  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
  ],

  coverageDirectory: '<rootDir>/coverage',

  // Coverage thresholds - enforcing high quality
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    // Critical modules require higher coverage
    './src/utils/permissions.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },

  // Test execution settings
  verbose: true,
  silent: false,
  maxWorkers: '50%', // Use half of available CPU cores
  
  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',

  // Error handling
  bail: false, // Don't stop on first failure
  errorOnDeprecated: true,

  // Mock configuration
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Performance monitoring
  detectOpenHandles: true,
  forceExit: false,
  logHeapUsage: true,

  // TypeScript configuration
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    },
  },
};
