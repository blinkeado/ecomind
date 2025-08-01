# Testing Strategy: Relationship Assistant App

## 📋 Overview

This document outlines the comprehensive testing strategy for the **React Native Relationship Assistant App** with Firebase backend and AI-powered relationship intelligence. The strategy follows official testing best practices from React Native Testing Library, Firebase, and Jest communities as of July 2025.

## 🎯 Testing Objectives

- **Relationship Intelligence Accuracy**: Verify AI context extraction and prompt generation
- **Privacy Compliance**: Ensure user data isolation and secure access patterns
- **Real-time Synchronization**: Validate Firebase real-time data consistency
- **Cross-platform Reliability**: Consistent behavior across iOS and Android
- **Performance Thresholds**: Meet latency and memory usage requirements

## 🧪 Test Categories & Architecture

### 1. **Unit Tests** 
*Focus: Pure business logic and isolated components*

#### **Relationship Logic Tests**
```typescript
// __tests__/logic/relationshipScoring.test.ts
import { calculateRelationshipHealth, generatePromptSuggestions } from '@/lib/relationshipLogic';

describe('Relationship Health Scoring', () => {
  test('should calculate correct health score for recent contact', () => {
    const relationship = {
      lastContact: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      intensity: 8,
      communicationFrequency: 14 // days average
    };
    
    const healthScore = calculateRelationshipHealth(relationship);
    expect(healthScore).toBeGreaterThan(7);
  });
  
  test('should identify stale relationships requiring attention', () => {
    const relationship = {
      lastContact: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      intensity: 9,
      communicationFrequency: 21
    };
    
    const healthScore = calculateRelationshipHealth(relationship);
    expect(healthScore).toBeLessThan(5);
  });
});
```

#### **Context Extraction Tests**
```typescript
// __tests__/ai/contextExtraction.test.ts
import { extractRelationshipContext, extractLifeEvents } from '@/lib/ai/contextProcessor';

describe('AI Context Extraction', () => {
  test('should extract birthday information from text', async () => {
    const inputText = "Had coffee with Sarah, her birthday is next Tuesday";
    const extracted = await extractRelationshipContext(inputText);
    
    expect(extracted.person).toBe('Sarah');
    expect(extracted.events).toHaveLength(1);
    expect(extracted.events[0].type).toBe('birthday');
    expect(extracted.events[0].date).toBeDefined();
  });
  
  test('should handle ambiguous context gracefully', async () => {
    const inputText = "Talked to someone about work stuff";
    const extracted = await extractRelationshipContext(inputText);
    
    expect(extracted.confidence).toBeLessThan(0.5);
    expect(extracted.requiresUserInput).toBe(true);
  });
});
```

#### **Component Unit Tests** *(Following RNTL best practices)*
```typescript
// __tests__/components/PersonCard.test.tsx
import { render, screen, userEvent } from '@testing-library/react-native';
import { PersonCard } from '@/components/PersonCard';

jest.useFakeTimers(); // Required for userEvent

describe('PersonCard Component', () => {
  const mockPerson = {
    id: 'person-1',
    displayName: 'Sarah Chen',
    lastContact: new Date('2025-07-20'),
    relationshipHealth: 8,
    roles: ['friend', 'colleague']
  };

  test('renders person information correctly', () => {
    render(<PersonCard person={mockPerson} />);
    
    expect(screen.getByText('Sarah Chen')).toBeOnTheScreen();
    expect(screen.getByText(/friend, colleague/i)).toBeOnTheScreen();
    expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({ now: 8, min: 0, max: 10 });
  });

  test('triggers contact action when tapped', async () => {
    const mockOnContact = jest.fn();
    const user = userEvent.setup();
    
    render(<PersonCard person={mockPerson} onContact={mockOnContact} />);
    
    await user.press(screen.getByRole('button', { name: /contact sarah/i }));
    expect(mockOnContact).toHaveBeenCalledWith(mockPerson.id);
  });
});
```

### 2. **Integration Tests**
*Focus: Firebase interactions and cross-service communication*

#### **Firebase Authentication Tests**
```typescript
// __tests__/integration/auth.test.ts
import { FirebaseAuthService } from '@/lib/firebase/auth';
import { connectAuthEmulator, getAuth } from 'firebase/auth';

describe('Firebase Authentication Integration', () => {
  beforeAll(() => {
    // Connect to Firebase Auth Emulator
    const auth = getAuth();
    connectAuthEmulator(auth, 'http://localhost:9099');
  });

  test('should create user profile on first sign-in', async () => {
    const testUser = await FirebaseAuthService.signInWithEmailAndPassword(
      'test@example.com',
      'testpassword123'
    );
    
    expect(testUser.uid).toBeDefined();
    
    // Verify profile document was created
    const profile = await FirebaseAuthService.getUserProfile(testUser.uid);
    expect(profile.createdAt).toBeDefined();
    expect(profile.preferences).toBeDefined();
  });
});
```

#### **Firestore Read/Write Tests**
```typescript
// __tests__/integration/firestore.test.ts
import { RelationshipService } from '@/lib/firebase/relationships';
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';

describe('Firestore Relationship Operations', () => {
  let testEnv: RulesTestEnvironment;
  let service: RelationshipService;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'relationship-assistant-test',
      firestore: {
        rules: await fs.readFile('firestore.rules', 'utf8'),
        host: 'localhost',
        port: 8080
      }
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    service = new RelationshipService(testEnv.authenticatedContext('user-123'));
  });

  test('should create and retrieve person relationships', async () => {
    const personData = {
      displayName: 'John Doe',
      roles: ['friend'],
      contactMethods: [{ type: 'email', value: 'john@example.com' }]
    };

    const personId = await service.createPerson(personData);
    const retrievedPerson = await service.getPerson(personId);

    expect(retrievedPerson.displayName).toBe('John Doe');
    expect(retrievedPerson.createdAt).toBeDefined();
  });

  test('should enforce user isolation in relationships', async () => {
    const otherUserService = new RelationshipService(testEnv.authenticatedContext('user-456'));
    
    // User-123 creates a person
    const personId = await service.createPerson({ displayName: 'Private Contact' });
    
    // User-456 should not be able to access it
    await expect(otherUserService.getPerson(personId)).rejects.toThrow(/permission-denied/);
  });
});
```

#### **Cloud Functions Tests**
```typescript
// __tests__/integration/cloudFunctions.test.ts
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

describe('Cloud Functions Integration', () => {
  test('should generate relationship prompts', async () => {
    const generatePrompts = httpsCallable(functions, 'generateRelationshipPrompts');
    
    const result = await generatePrompts({
      userId: 'test-user-id',
      timeframe: '7days'
    });

    expect(result.data.prompts).toBeInstanceOf(Array);
    expect(result.data.prompts.length).toBeGreaterThan(0);
    expect(result.data.prompts[0]).toHaveProperty('type');
    expect(result.data.prompts[0]).toHaveProperty('personId');
    expect(result.data.prompts[0]).toHaveProperty('suggestion');
  });

  test('should handle context extraction requests', async () => {
    const extractContext = httpsCallable(functions, 'extractRelationshipContext');
    
    const result = await extractContext({
      text: "Had lunch with Maria, she mentioned her new job at Google",
      userId: 'test-user-id'
    });

    expect(result.data.extractedContext).toBeDefined();
    expect(result.data.extractedContext.person).toBe('Maria');
    expect(result.data.extractedContext.events).toContainEqual(
      expect.objectContaining({ type: 'job_change' })
    );
  });
});
```

### 3. **End-to-End (E2E) Tests**
*Focus: Complete user workflows and cross-platform behavior*

#### **User Onboarding Flow**
```typescript
// e2e/onboarding.e2e.ts
import { device, element, by, expect as detoxExpect } from 'detox';

describe('User Onboarding Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  test('should complete first-time user setup', async () => {
    // Welcome screen
    await detoxExpect(element(by.text('Welcome to Your Relationship Assistant'))).toBeVisible();
    await element(by.id('get-started-button')).tap();

    // Authentication
    await element(by.id('email-input')).typeText('newuser@example.com');
    await element(by.id('password-input')).typeText('securepassword123');
    await element(by.id('sign-up-button')).tap();

    // Profile setup
    await detoxExpect(element(by.text('Set Up Your Profile'))).toBeVisible();
    await element(by.id('display-name-input')).typeText('Alex Johnson');
    await element(by.id('continue-button')).tap();

    // First relationship
    await detoxExpect(element(by.text('Add Your First Connection'))).toBeVisible();
    await element(by.id('person-name-input')).typeText('Sarah Chen');
    await element(by.id('relationship-type-selector')).tap();
    await element(by.text('Friend')).tap();
    await element(by.id('add-person-button')).tap();

    // Verify main screen
    await detoxExpect(element(by.text('Sarah Chen'))).toBeVisible();
    await detoxExpect(element(by.id('ecomap-view'))).toBeVisible();
  });
});
```

#### **Relationship Management Workflow**
```typescript
// e2e/relationshipManagement.e2e.ts
describe('Relationship Management', () => {
  test('should add interaction and generate prompt', async () => {
    // Navigate to person detail
    await element(by.id('person-card-sarah')).tap();
    
    // Add interaction
    await element(by.id('add-interaction-button')).tap();
    await element(by.id('interaction-note')).typeText('Had coffee, discussed her new startup idea');
    await element(by.id('save-interaction-button')).tap();

    // Verify interaction appears
    await detoxExpect(element(by.text('Had coffee, discussed her new startup idea'))).toBeVisible();

    // Navigate back to main screen
    await element(by.id('back-button')).tap();

    // Wait for prompt generation (may take a few seconds)
    await waitFor(element(by.id('active-prompts-section'))).toBeVisible().withTimeout(5000);
    
    // Verify follow-up prompt was generated
    await detoxExpect(element(by.text(/follow up.*startup/i))).toBeVisible();
  });
});
```

#### **Offline Behavior Tests**
```typescript
// e2e/offlineBehavior.e2e.ts
describe('Offline Functionality', () => {
  test('should cache data and sync when online', async () => {
    // Create relationship while online
    await element(by.id('add-person-button')).tap();
    await element(by.id('person-name-input')).typeText('Michael Turner');
    await element(by.id('save-person-button')).tap();

    // Go offline
    await device.setNetworkConnection('none');

    // Add offline interaction
    await element(by.id('person-card-michael')).tap();
    await element(by.id('add-interaction-button')).tap();
    await element(by.id('interaction-note')).typeText('Met at conference - offline note');
    await element(by.id('save-interaction-button')).tap();

    // Verify offline indicator
    await detoxExpect(element(by.id('offline-indicator'))).toBeVisible();

    // Go back online
    await device.setNetworkConnection('wifi');

    // Wait for sync
    await waitFor(element(by.id('sync-complete-indicator'))).toBeVisible().withTimeout(10000);

    // Verify data was synced
    await detoxExpect(element(by.text('Met at conference - offline note'))).toBeVisible();
  });
});
```

### 4. **Privacy & Security Tests**
*Focus: Data protection and access control validation*

#### **User Data Isolation Tests**
```typescript
// __tests__/security/dataIsolation.test.ts
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

describe('User Data Isolation', () => {
  test('should prevent cross-user data access', async () => {
    const testEnv = await initializeTestEnvironment({
      projectId: 'security-test',
      firestore: { rules: await fs.readFile('firestore.rules', 'utf8') }
    });

    const user1Context = testEnv.authenticatedContext('user-1');
    const user2Context = testEnv.authenticatedContext('user-2');

    // User 1 creates private relationship data
    await user1Context.firestore()
      .collection('users/user-1/relationships')
      .add({ name: 'Private Contact', phone: '+1234567890' });

    // User 2 should not be able to read User 1's data
    const user2ReadAttempt = user2Context.firestore()
      .collection('users/user-1/relationships')
      .get();

    await expect(user2ReadAttempt).rejects.toThrow(/permission-denied/);
  });

  test('should validate relationship data schema', async () => {
    const testEnv = await initializeTestEnvironment({
      projectId: 'validation-test',
      firestore: { rules: await fs.readFile('firestore.rules', 'utf8') }
    });

    const userContext = testEnv.authenticatedContext('user-1');

    // Valid relationship data should succeed
    const validWrite = userContext.firestore()
      .collection('users/user-1/relationships')
      .add({
        displayName: 'John Doe',
        roles: ['friend'],
        createdAt: new Date(),
        lastUpdated: new Date()
      });

    await expect(validWrite).resolves.toBeDefined();

    // Invalid data should be rejected
    const invalidWrite = userContext.firestore()
      .collection('users/user-1/relationships')
      .add({
        // Missing required fields
        invalidField: 'should not be allowed'
      });

    await expect(invalidWrite).rejects.toThrow(/validation-failed/);
  });
});
```

#### **Privacy Compliance Tests**
```typescript
// __tests__/security/privacyCompliance.test.ts
describe('Privacy Compliance', () => {
  test('should support GDPR data export', async () => {
    const userId = 'gdpr-test-user';
    const exportService = new DataExportService();

    const exportedData = await exportService.exportAllUserData(userId);

    expect(exportedData).toHaveProperty('personalProfile');
    expect(exportedData).toHaveProperty('relationships');
    expect(exportedData).toHaveProperty('interactions');
    expect(exportedData).toHaveProperty('prompts');
    expect(exportedData.exportedAt).toBeDefined();
  });

  test('should support right to erasure', async () => {
    const userId = 'erasure-test-user';
    const deletionService = new DataDeletionService();

    // Create test data
    await createTestUserData(userId);

    // Request deletion
    await deletionService.deleteAllUserData(userId);

    // Verify all data is removed
    const remainingData = await getAllUserCollections(userId);
    expect(remainingData.every(collection => collection.empty)).toBe(true);
  });
});
```

## 🛠 Testing Tools & Configuration

### **Primary Testing Stack**
```json
{
  "dependencies": {
    "@testing-library/react-native": "^12.4.0",
    "@testing-library/jest-native": "^5.4.3",
    "@testing-library/user-event": "^14.5.0",
    "jest": "^29.7.0",
    "detox": "^20.19.0",
    "@firebase/rules-unit-testing": "^3.0.0"
  }
}
```

### **Jest Configuration**
```javascript
// jest.config.js
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/src/setupTests.ts'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@firebase|firebase)/)'
  ],
  testEnvironment: 'jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/setupTests.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### **Test Setup File**
```typescript
// src/setupTests.ts
import 'react-native-gesture-handler/jestSetup';
import '@testing-library/jest-native/extend-expect';

// Mock Firebase
jest.mock('@react-native-firebase/app', () => ({
  apps: [],
  initializeApp: jest.fn()
}));

jest.mock('@react-native-firebase/auth', () => ({
  auth: jest.fn(() => ({
    currentUser: null,
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn()
  }))
}));

// Mock AI services
jest.mock('@/lib/ai/contextProcessor', () => ({
  extractRelationshipContext: jest.fn().mockResolvedValue({
    person: 'Test Person',
    events: [],
    confidence: 0.8
  })
}));

// Enable fake timers for userEvent
jest.useFakeTimers();

// Global test timeout
jest.setTimeout(10000);
```

## 📊 Performance Benchmarks

### **Response Time Thresholds**
- **Prompt Generation**: < 300ms for simple prompts, < 1000ms for AI-enhanced prompts
- **Relationship Loading**: < 200ms for up to 100 relationships
- **Search Results**: < 150ms for text-based search
- **Ecomap Rendering**: < 500ms for initial load, < 100ms for updates

### **Memory Usage Limits**
- **Relationship Cache**: Max 50MB for active relationships
- **Image Assets**: Max 20MB cached profile images
- **Total App Memory**: < 150MB on iOS, < 200MB on Android

### **Network Efficiency**
- **Offline Support**: 7 days of cached relationship data
- **Sync Efficiency**: Batch updates to minimize Firebase reads/writes
- **Data Compression**: Use Firebase bundle compression for large datasets

### **Load Testing Scenarios**
```typescript
// __tests__/performance/loadTesting.test.ts
describe('Performance Load Tests', () => {
  test('should handle 500 relationships without degradation', async () => {
    const startTime = performance.now();
    
    const relationships = await RelationshipService.loadAllRelationships('heavy-user');
    
    const loadTime = performance.now() - startTime;
    expect(loadTime).toBeLessThan(2000); // 2 second limit
    expect(relationships.length).toBe(500);
  });

  test('should generate prompts for large relationship graphs efficiently', async () => {
    const startTime = performance.now();
    
    const prompts = await PromptService.generateDailyPrompts('heavy-user');
    
    const generationTime = performance.now() - startTime;
    expect(generationTime).toBeLessThan(5000); // 5 second limit
    expect(prompts.length).toBeGreaterThan(0);
  });
});
```

## 🚀 Test Execution Strategy

### **Development Workflow**
```bash
# Run unit tests on file change
npm run test:watch

# Run integration tests
npm run test:integration

# Run full test suite
npm run test:all

# Run E2E tests (requires emulator)
npm run test:e2e:ios
npm run test:e2e:android
```

### **CI/CD Pipeline Tests**
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:unit

  integration-tests:
    runs-on: ubuntu-latest
    services:
      firebase-emulator:
        image: firebase/firebase-tools
        options: --health-cmd "curl -f http://localhost:4000" --health-interval 30s
    steps:
      - uses: actions/checkout@v4
      - run: firebase emulators:start --detached
      - run: npm run test:integration

  e2e-tests:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: cd ios && pod install
      - run: npm run build:e2e:ios
      - run: npm run test:e2e:ios
```

### **Test Data Management**
```typescript
// __tests__/helpers/testDataFactory.ts
export class TestDataFactory {
  static createPerson(overrides: Partial<PersonData> = {}): PersonData {
    return {
      displayName: faker.person.fullName(),
      roles: ['friend'],
      contactMethods: [{
        type: 'email',
        value: faker.internet.email()
      }],
      relationshipIntensity: faker.number.int({ min: 1, max: 10 }),
      lastContact: faker.date.recent({ days: 30 }),
      createdAt: new Date(),
      lastUpdated: new Date(),
      ...overrides
    };
  }

  static createInteraction(personId: string, overrides: Partial<InteractionData> = {}): InteractionData {
    return {
      personId,
      type: 'conversation',
      notes: faker.lorem.sentence(),
      timestamp: faker.date.recent({ days: 7 }),
      emotionalTone: 'positive',
      ...overrides
    };
  }
}
```

## ✅ Success Criteria

### **Test Coverage Requirements**
- **Unit Tests**: 90% code coverage for business logic
- **Integration Tests**: 100% coverage for Firebase operations
- **E2E Tests**: Coverage of all critical user journeys
- **Security Tests**: 100% coverage of access control rules

### **Quality Gates**
- All tests must pass before merge
- No console errors or warnings in test output
- Performance benchmarks must be met
- Security tests must validate user isolation

### **Regression Prevention**
- Automated test execution on every commit
- Performance regression detection
- Visual regression testing for UI components
- Database schema migration testing

This comprehensive testing strategy ensures the relationship assistant app maintains high quality, security, and performance while supporting the complex requirements of AI-powered relationship intelligence and privacy-first design principles.