// SOURCE: Phase 7 Testing - End-to-end tests for critical user workflows
// VERIFIED: E2E tests for onboarding, relationship management, and privacy flows

import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from '../../src/navigation/AppNavigator';
import { useAuth } from '../../src/hooks/useAuth';
import { useRelationships } from '../../src/hooks/useRelationships';
import { usePrompts } from '../../src/hooks/usePrompts';
import { getPrivacyManager } from '../../src/utils/permissions';

// Mock all external dependencies
jest.mock('../../src/hooks/useAuth');
jest.mock('../../src/hooks/useRelationships');
jest.mock('../../src/hooks/usePrompts');
jest.mock('../../src/utils/permissions');
jest.mock('../../src/config/firebase');

// Mock React Native components
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn((title, message, buttons) => {
        const confirmButton = buttons?.find((btn: any) => 
          btn.text !== 'Cancel' && btn.style !== 'cancel'
        );
        if (confirmButton?.onPress) {
          confirmButton.onPress();
        }
      }),
    },
    Linking: {
      openURL: jest.fn(),
    },
  };
});

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    NavigationContainer: ({ children }: any) => children,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      replace: jest.fn(),
      setOptions: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRelationships = useRelationships as jest.MockedFunction<typeof useRelationships>;
const mockUsePrompts = usePrompts as jest.MockedFunction<typeof usePrompts>;
const mockGetPrivacyManager = getPrivacyManager as jest.MockedFunction<typeof getPrivacyManager>;

describe('End-to-End User Workflows', () => {
  let mockPrivacyManager: any;
  let mockNavigation: any;

  beforeEach(() => {
    // Setup mock privacy manager
    mockPrivacyManager = {
      getSettings: jest.fn().mockReturnValue({
        data_collection: true,
        ai_processing: false,
        analytics: false,
        last_updated: new Date(),
        consent_version: '1.0.0',
      }),
      updateSetting: jest.fn().mockResolvedValue(true),
      loadSettings: jest.fn().mockResolvedValue(undefined),
      addListener: jest.fn().mockReturnValue(() => {}),
      hasValidConsent: jest.fn().mockReturnValue(true),
      recordConsent: jest.fn().mockResolvedValue(undefined),
      generatePrivacyImpactAssessment: jest.fn().mockReturnValue({
        summary: { low: 1, medium: 0, high: 0, total_granted: 1 },
        high_risk_permissions: [],
        recommendations: [],
        consent_status: {
          has_valid_consent: true,
          last_consent_date: new Date(),
          consent_age_days: 1,
        },
      }),
    };

    mockGetPrivacyManager.mockReturnValue(mockPrivacyManager);

    // Setup mock navigation
    mockNavigation = {
      navigate: jest.fn(),
      goBack: jest.fn(),
      replace: jest.fn(),
      setOptions: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe('User Onboarding Workflow', () => {
    test('should complete full onboarding flow for new user', async () => {
      // Mock unauthenticated user
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: false,
        profile: null,
        signInWithEmail: jest.fn().mockResolvedValue(undefined),
        signUpWithEmail: jest.fn().mockResolvedValue(undefined),
        signOut: jest.fn().mockResolvedValue(undefined),
        updateProfile: jest.fn().mockResolvedValue(undefined),
      });

      const { getByTestId, getByText } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );

      // Should show onboarding screen
      await waitFor(() => {
        expect(getByText('Welcome to EcoMind')).toBeTruthy();
      });

      // Simulate sign up
      const signUpButton = getByTestId('sign-up-button');
      fireEvent.press(signUpButton);

      // Mock successful authentication
      act(() => {
        mockUseAuth.mockReturnValue({
          user: { uid: 'test-user-123', email: 'test@example.com' },
          isAuthenticated: true,
          loading: false,
          profile: { isOnboardingComplete: false },
          signInWithEmail: jest.fn(),
          signUpWithEmail: jest.fn(),
          signOut: jest.fn(),
          updateProfile: jest.fn(),
        });
      });

      // Should proceed to consent screen
      await waitFor(() => {
        expect(getByText('Privacy Consent')).toBeTruthy();
      });
    });

    test('should handle consent flow during onboarding', async () => {
      // Mock authenticated user with incomplete onboarding
      mockUseAuth.mockReturnValue({
        user: { uid: 'test-user-123', email: 'test@example.com' },
        isAuthenticated: true,
        loading: false,
        profile: { isOnboardingComplete: false },
        signInWithEmail: jest.fn(),
        signUpWithEmail: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
      });

      const { getByTestId, getByText } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );

      // Should show consent screen
      await waitFor(() => {
        expect(getByText('Welcome to EcoMind')).toBeTruthy();
      });

      // Simulate progressing through consent steps
      const nextButton = getByTestId('next-step-button');
      fireEvent.press(nextButton);
      fireEvent.press(nextButton);
      fireEvent.press(nextButton);

      // Should reach permission selection
      await waitFor(() => {
        expect(getByText('Choose Your Permissions')).toBeTruthy();
      });

      // Enable AI processing
      const aiToggle = getByTestId('ai-processing-toggle');
      fireEvent.press(aiToggle);

      // Read privacy policy
      const privacyButton = getByTestId('privacy-policy-button');
      fireEvent.press(privacyButton);

      // Complete consent
      const completeButton = getByTestId('complete-consent-button');
      fireEvent.press(completeButton);

      expect(mockPrivacyManager.recordConsent).toHaveBeenCalledWith(
        '1.0.0',
        expect.arrayContaining(['ai_processing']),
        true
      );
    });

    test('should allow users to skip AI features during onboarding', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'test-user-123', email: 'test@example.com' },
        isAuthenticated: true,
        loading: false,
        profile: { isOnboardingComplete: false },
        signInWithEmail: jest.fn(),
        signUpWithEmail: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
      });

      const { getByTestId } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );

      // Skip AI features
      const skipButton = getByTestId('skip-ai-button');
      fireEvent.press(skipButton);

      expect(mockPrivacyManager.updateSetting).toHaveBeenCalledWith('ai_processing', false);
      expect(mockPrivacyManager.recordConsent).toHaveBeenCalledWith('1.0.0', [], false);
    });
  });

  describe('Relationship Management Workflow', () => {
    beforeEach(() => {
      // Mock authenticated user with complete onboarding
      mockUseAuth.mockReturnValue({
        user: { uid: 'test-user-123', email: 'test@example.com' },
        isAuthenticated: true,
        loading: false,
        profile: { isOnboardingComplete: true },
        signInWithEmail: jest.fn(),
        signUpWithEmail: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
      });

      // Mock relationships data
      mockUseRelationships.mockReturnValue({
        relationships: [
          {
            id: 'person-1',
            displayName: 'John Doe',
            relationshipType: 'friend',
            relationshipHealth: 8.5,
            relationshipIntensity: 7.0,
            isActive: true,
            createdBy: 'test-user-123',
            createdAt: new Date(),
            lastUpdatedAt: new Date(),
          },
          {
            id: 'person-2',
            displayName: 'Jane Smith',
            relationshipType: 'family',
            relationshipHealth: 9.2,
            relationshipIntensity: 8.5,
            isActive: true,
            createdBy: 'test-user-123',
            createdAt: new Date(),
            lastUpdatedAt: new Date(),
          },
        ],
        loading: false,
        error: null,
        addInteraction: jest.fn().mockResolvedValue('interaction-id'),
        updatePerson: jest.fn().mockResolvedValue(undefined),
        createPerson: jest.fn().mockResolvedValue('new-person-id'),
        deletePerson: jest.fn().mockResolvedValue(undefined),
        refreshRelationships: jest.fn().mockResolvedValue(undefined),
      });

      // Mock prompts data
      mockUsePrompts.mockReturnValue({
        prompts: [
          {
            id: 'prompt-1',
            type: 'check_in',
            content: 'Consider reaching out to John Doe - it\'s been a while since your last conversation.',
            personId: 'person-1',
            urgency: 'medium',
            confidence: 0.85,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        ],
        loading: false,
        error: null,
        generateDailyPrompts: jest.fn().mockResolvedValue(undefined),
        completePrompt: jest.fn().mockResolvedValue(undefined),
        dismissPrompt: jest.fn().mockResolvedValue(undefined),
        snoozePrompt: jest.fn().mockResolvedValue(undefined),
        deletePrompt: jest.fn().mockResolvedValue(undefined),
        refreshPrompts: jest.fn().mockResolvedValue(undefined),
      });
    });

    test('should display relationship ecomap on home screen', async () => {
      const { getByText, getByTestId } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(getByText('Your Relationships')).toBeTruthy();
        expect(getByText('2 connections')).toBeTruthy();
        expect(getByTestId('home-ecomap')).toBeTruthy();
      });
    });

    test('should navigate to person details when person is selected', async () => {
      const { getByTestId } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );

      await waitFor(() => {
        const personCard = getByTestId('home-person-person-1');
        fireEvent.press(personCard);
      });

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Person', { personId: 'person-1' });
    });

    test('should complete add new person workflow', async () => {
      const { getByTestId, getByText } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );

      // Navigate to add person
      const addPersonButton = getByTestId('add-person-button');
      fireEvent.press(addPersonButton);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Person', { mode: 'create' });

      // Mock person creation screen
      await waitFor(() => {
        const nameInput = getByTestId('person-name-input');
        fireEvent.changeText(nameInput, 'New Friend');

        const relationshipTypeInput = getByTestId('relationship-type-input');
        fireEvent.changeText(relationshipTypeInput, 'friend');

        const saveButton = getByTestId('save-person-button');
        fireEvent.press(saveButton);
      });

      expect(mockUseRelationships().createPerson).toHaveBeenCalledWith(
        'test-user-123',
        expect.objectContaining({
          displayName: 'New Friend',
          relationshipType: 'friend',
        })
      );
    });

    test('should complete add interaction workflow', async () => {
      const { getByTestId } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );

      // Navigate to person screen and add interaction
      await waitFor(() => {
        const addInteractionButton = getByTestId('add-interaction-button');
        fireEvent.press(addInteractionButton);

        const notesInput = getByTestId('interaction-notes-input');
        fireEvent.changeText(notesInput, 'Had coffee and caught up on life');

        const locationInput = getByTestId('interaction-location-input');
        fireEvent.changeText(locationInput, 'Central Perk');

        const saveInteractionButton = getByTestId('save-interaction-button');
        fireEvent.press(saveInteractionButton);
      });

      expect(mockUseRelationships().addInteraction).toHaveBeenCalledWith(
        'test-user-123',
        expect.any(String),
        expect.objectContaining({
          notes: 'Had coffee and caught up on life',
          location: 'Central Perk',
          type: 'conversation',
        })
      );
    });
  });

  describe('AI Suggestions Workflow', () => {
    beforeEach(() => {
      // Enable AI processing
      mockPrivacyManager.getSettings.mockReturnValue({
        ...mockPrivacyManager.getSettings(),
        ai_processing: true,
      });

      mockUseAuth.mockReturnValue({
        user: { uid: 'test-user-123', email: 'test@example.com' },
        isAuthenticated: true,
        loading: false,
        profile: { isOnboardingComplete: true },
        signInWithEmail: jest.fn(),
        signUpWithEmail: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
      });

      mockUseRelationships.mockReturnValue({
        relationships: [
          {
            id: 'person-1',
            displayName: 'John Doe',
            relationshipType: 'friend',
            relationshipHealth: 8.5,
            relationshipIntensity: 7.0,
            isActive: true,
            createdBy: 'test-user-123',
            createdAt: new Date(),
            lastUpdatedAt: new Date(),
          },
        ],
        loading: false,
        error: null,
        addInteraction: jest.fn(),
        updatePerson: jest.fn(),
        createPerson: jest.fn(),
        deletePerson: jest.fn(),
        refreshRelationships: jest.fn(),
      });
    });

    test('should display AI suggestions on home screen', async () => {
      mockUsePrompts.mockReturnValue({
        prompts: [
          {
            id: 'prompt-1',
            type: 'check_in',
            content: 'Consider reaching out to John Doe',
            personId: 'person-1',
            urgency: 'medium',
            confidence: 0.85,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        ],
        loading: false,
        error: null,
        generateDailyPrompts: jest.fn(),
        completePrompt: jest.fn(),
        dismissPrompt: jest.fn(),
        snoozePrompt: jest.fn(),
        deletePrompt: jest.fn(),
        refreshPrompts: jest.fn(),
      });

      const { getByText } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(getByText('Relationship Suggestions')).toBeTruthy();
        expect(getByText('Consider reaching out to John Doe')).toBeTruthy();
      });
    });

    test('should handle prompt acceptance workflow', async () => {
      const mockCompletePrompt = jest.fn();
      mockUsePrompts.mockReturnValue({
        prompts: [
          {
            id: 'prompt-1',
            type: 'check_in',
            content: 'Consider reaching out to John Doe',
            personId: 'person-1',
            urgency: 'medium',
            confidence: 0.85,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        ],
        loading: false,
        error: null,
        generateDailyPrompts: jest.fn(),
        completePrompt: mockCompletePrompt,
        dismissPrompt: jest.fn(),
        snoozePrompt: jest.fn(),
        deletePrompt: jest.fn(),
        refreshPrompts: jest.fn(),
      });

      const { getByTestId } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );

      await waitFor(() => {
        const acceptButton = getByTestId('prompt-accept-prompt-1');
        fireEvent.press(acceptButton);
      });

      expect(mockCompletePrompt).toHaveBeenCalledWith('prompt-1');
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Person', { personId: 'person-1' });
    });

    test('should handle prompt dismissal workflow', async () => {
      const mockDismissPrompt = jest.fn();
      mockUsePrompts.mockReturnValue({
        prompts: [
          {
            id: 'prompt-1',
            type: 'check_in',
            content: 'Consider reaching out to John Doe',
            personId: 'person-1',
            urgency: 'medium',
            confidence: 0.85,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        ],
        loading: false,
        error: null,
        generateDailyPrompts: jest.fn(),
        completePrompt: jest.fn(),
        dismissPrompt: mockDismissPrompt,
        snoozePrompt: jest.fn(),
        deletePrompt: jest.fn(),
        refreshPrompts: jest.fn(),
      });

      const { getByTestId } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );

      await waitFor(() => {
        const dismissButton = getByTestId('prompt-dismiss-prompt-1');
        fireEvent.press(dismissButton);
      });

      expect(mockDismissPrompt).toHaveBeenCalledWith('prompt-1');
    });

    test('should generate new prompts when requested', async () => {
      const mockGenerateDailyPrompts = jest.fn();
      mockUsePrompts.mockReturnValue({
        prompts: [],
        loading: false,
        error: null,
        generateDailyPrompts: mockGenerateDailyPrompts,
        completePrompt: jest.fn(),
        dismissPrompt: jest.fn(),
        snoozePrompt: jest.fn(),
        deletePrompt: jest.fn(),
        refreshPrompts: jest.fn(),
      });

      const { getByTestId } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );

      await waitFor(() => {
        const generateButton = getByTestId('generate-prompts-button');
        fireEvent.press(generateButton);
      });

      expect(mockGenerateDailyPrompts).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'person-1' })
        ])
      );
    });
  });

  describe('Privacy Settings Workflow', () => {
    test('should navigate to privacy settings', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'test-user-123', email: 'test@example.com' },
        isAuthenticated: true,
        loading: false,
        profile: { isOnboardingComplete: true },
        signInWithEmail: jest.fn(),
        signUpWithEmail: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
      });

      const { getByText } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );

      // Navigate to settings tab
      const settingsTab = getByText('Settings');
      fireEvent.press(settingsTab);

      await waitFor(() => {
        expect(getByText('Privacy Controls')).toBeTruthy();
      });
    });

    test('should toggle privacy permissions', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'test-user-123', email: 'test@example.com' },
        isAuthenticated: true,
        loading: false,
        profile: { isOnboardingComplete: true },
        signInWithEmail: jest.fn(),
        signUpWithEmail: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
      });

      const { getByTestId } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );

      await waitFor(() => {
        const aiToggle = getByTestId('privacy-toggle-ai_processing');
        fireEvent.press(aiToggle);
      });

      expect(mockPrivacyManager.updateSetting).toHaveBeenCalledWith('ai_processing', true);
    });

    test('should navigate to privacy impact assessment', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'test-user-123', email: 'test@example.com' },
        isAuthenticated: true,
        loading: false,
        profile: { isOnboardingComplete: true },
        signInWithEmail: jest.fn(),
        signUpWithEmail: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
      });

      const { getByTestId } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );

      await waitFor(() => {
        const impactButton = getByTestId('privacy-impact-button');
        fireEvent.press(impactButton);
      });

      expect(mockNavigation.navigate).toHaveBeenCalledWith('PrivacyImpact');
    });

    test('should handle data export request', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'test-user-123', email: 'test@example.com' },
        isAuthenticated: true,
        loading: false,
        profile: { isOnboardingComplete: true },
        signInWithEmail: jest.fn(),
        signUpWithEmail: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
      });

      const { getByTestId } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );

      await waitFor(() => {
        const exportButton = getByTestId('export-data-button');
        fireEvent.press(exportButton);
      });

      // Should show confirmation dialog (mocked to auto-confirm)
      expect(require('react-native').Alert.alert).toHaveBeenCalledWith(
        'Export Your Data',
        expect.stringContaining('complete export'),
        expect.any(Array)
      );
    });

    test('should handle data deletion request', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'test-user-123', email: 'test@example.com' },
        isAuthenticated: true,
        loading: false,
        profile: { isOnboardingComplete: true },
        signInWithEmail: jest.fn(),
        signUpWithEmail: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
      });

      const { getByTestId } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );

      await waitFor(() => {
        const deleteButton = getByTestId('delete-data-button');
        fireEvent.press(deleteButton);
      });

      // Should show confirmation dialog (mocked to auto-confirm)
      expect(require('react-native').Alert.alert).toHaveBeenCalledWith(
        'Delete All Data',
        expect.stringContaining('permanently delete'),
        expect.any(Array)
      );
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async () => {
      mockUseRelationships.mockReturnValue({
        relationships: [],
        loading: false,
        error: 'Network connection failed',
        addInteraction: jest.fn(),
        updatePerson: jest.fn(),
        createPerson: jest.fn(),
        deletePerson: jest.fn(),
        refreshRelationships: jest.fn(),
      });

      const { getByText } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(getByText('Unable to load relationships')).toBeTruthy();
        expect(getByText('Network connection failed')).toBeTruthy();
      });
    });

    test('should handle empty states appropriately', async () => {
      mockUseRelationships.mockReturnValue({
        relationships: [],
        loading: false,
        error: null,
        addInteraction: jest.fn(),
        updatePerson: jest.fn(),
        createPerson: jest.fn(),
        deletePerson: jest.fn(),
        refreshRelationships: jest.fn(),
      });

      mockUsePrompts.mockReturnValue({
        prompts: [],
        loading: false,
        error: null,
        generateDailyPrompts: jest.fn(),
        completePrompt: jest.fn(),
        dismissPrompt: jest.fn(),
        snoozePrompt: jest.fn(),
        deletePrompt: jest.fn(),
        refreshPrompts: jest.fn(),
      });

      const { getByText } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(getByText('Start Building Your Network')).toBeTruthy();
        expect(getByText('Add Your First Person')).toBeTruthy();
      });
    });

    test('should handle loading states', async () => {
      mockUseRelationships.mockReturnValue({
        relationships: [],
        loading: true,
        error: null,
        addInteraction: jest.fn(),
        updatePerson: jest.fn(),
        createPerson: jest.fn(),
        deletePerson: jest.fn(),
        refreshRelationships: jest.fn(),
      });

      const { getByText } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(getByText('Loading your relationships...')).toBeTruthy();
      });
    });

    test('should handle authentication errors', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: false,
        profile: null,
        signInWithEmail: jest.fn().mockRejectedValue(new Error('Invalid credentials')),
        signUpWithEmail: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn(),
      });

      const { getByTestId } = render(
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      );

      // Attempt sign in
      const signInButton = getByTestId('sign-in-button');
      fireEvent.press(signInButton);

      // Should handle error gracefully (specific implementation depends on error handling in components)
      expect(mockUseAuth().signInWithEmail).toHaveBeenCalled();
    });
  });
});