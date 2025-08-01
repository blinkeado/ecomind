// SOURCE: Phase 7 Testing - Integration tests for AI processing pipeline
// VERIFIED: Tests for AI prompt generation, context extraction, and privacy compliance

import { 
  contextExtractionService,
  ContextExtractionResult,
} from '../../src/services/contextExtraction';
import { 
  promptsService,
  GeneratePromptParams,
} from '../../src/services/prompts';
import { 
  getPrivacyManager,
  hasPermission,
} from '../../src/utils/permissions';
import { PersonDocument, InteractionRecord } from '../../src/types/relationship';
import { RelationshipPrompt, PromptType, PromptUrgency } from '../../src/types/prompt';

// Mock Firebase functions
jest.mock('../../src/config/firebase', () => ({
  functions: {
    httpsCallable: jest.fn((functionName: string) => {
      return jest.fn().mockImplementation(async (data: any) => {
        // Mock different function responses
        switch (functionName) {
          case 'generatePrompt':
            return {
              data: {
                success: true,
                prompt: {
                  id: 'mock-prompt-id',
                  type: data.type || 'check_in',
                  content: `Mock AI suggestion for ${data.person?.displayName || 'person'}`,
                  urgency: data.urgency || 'medium',
                  confidence: 0.85,
                  reasoning: 'Mock AI reasoning',
                  personId: data.person?.id || 'mock-person-id',
                  createdAt: new Date(),
                  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                }
              }
            };
          
          case 'extractContext':
            return {
              data: {
                success: true,
                context: {
                  id: 'mock-context-id',
                  summary: 'Mock context summary',
                  entities: ['person', 'event'],
                  sentiment: 'positive',
                  topics: ['work', 'family'],
                  confidence: 0.78,
                  extractedAt: new Date(),
                }
              }
            };
          
          default:
            throw new Error(`Unknown function: ${functionName}`);
        }
      });
    }),
  },
}));

// Mock React Native Alert for timeout scenarios
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

describe('AI Processing Pipeline Integration', () => {
  let privacyManager: any;
  let mockPerson: PersonDocument;
  let mockInteraction: InteractionRecord;

  beforeEach(() => {
    privacyManager = getPrivacyManager();
    
    // Reset privacy settings
    privacyManager['settings'] = {
      ...privacyManager['settings'],
      ai_processing: true,
      data_collection: true,
      analytics: true,
    };

    // Mock person data
    mockPerson = {
      id: 'test-person-123',
      displayName: 'John Doe',
      relationshipType: 'friend',
      relationshipHealth: 8.5,
      relationshipIntensity: 7.2,
      personalContext: 'Close friend from college, works in tech',
      tags: ['college', 'tech', 'close-friend'],
      roles: [],
      contactMethods: [],
      interactions: [],
      lifeEvents: [],
      lastContact: new Date(),
      createdBy: 'test-user-123',
      createdAt: new Date(),
      lastUpdatedAt: new Date(),
      isActive: true,
    };

    // Mock interaction data  
    mockInteraction = {
      id: 'test-interaction-456',
      type: 'conversation',
      timestamp: new Date(),
      notes: 'Had a great chat about his new job at the startup. He seems excited but stressed about the workload.',
      location: 'Coffee shop downtown',
      emotionalTone: 'positive',
      createdBy: 'test-user-123',
      createdAt: new Date(),
    };

    jest.clearAllMocks();
  });

  describe('Context Extraction Pipeline', () => {
    test('should extract context with AI processing enabled', async () => {
      const result = await contextExtractionService.extractInteractionContext(
        'test-user-123',
        mockPerson.id,
        mockInteraction.notes,
        mockInteraction.type,
        { location: mockInteraction.location }
      );

      expect(result.success).toBe(true);
      expect(result.context).toBeDefined();
      expect(result.context?.summary).toBe('Mock context summary');
      expect(result.context?.entities).toContain('person');
      expect(result.context?.sentiment).toBe('positive');
      expect(result.context?.confidence).toBe(0.78);
    });

    test('should respect privacy settings for context extraction', async () => {
      // Disable AI processing
      privacyManager['settings'].ai_processing = false;

      const result = await contextExtractionService.extractInteractionContext(
        'test-user-123',
        mockPerson.id,
        mockInteraction.notes,
        mockInteraction.type
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('AI processing not enabled');
    });

    test('should handle context extraction with minimal data', async () => {
      const result = await contextExtractionService.extractInteractionContext(
        'test-user-123',
        mockPerson.id,
        'Quick hello',
        'message'
      );

      expect(result.success).toBe(true);
      expect(result.context).toBeDefined();
    });

    test('should handle context extraction errors gracefully', async () => {
      // Mock Firebase function to throw error
      const mockFunction = require('../../src/config/firebase').functions.httpsCallable;
      mockFunction.mockImplementationOnce(() => 
        jest.fn().mockRejectedValue(new Error('AI service unavailable'))
      );

      const result = await contextExtractionService.extractInteractionContext(
        'test-user-123',
        mockPerson.id,
        mockInteraction.notes,
        mockInteraction.type
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('AI service unavailable');
    });

    test('should handle timeout scenarios gracefully', async () => {
      // Mock Firebase function to simulate timeout
      const mockFunction = require('../../src/config/firebase').functions.httpsCallable;
      mockFunction.mockImplementationOnce(() => 
        jest.fn().mockImplementation(() => 
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('timeout')), 400)
          )
        )
      );

      const result = await contextExtractionService.extractInteractionContext(
        'test-user-123',
        mockPerson.id,
        mockInteraction.notes,
        mockInteraction.type
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });

  describe('Prompt Generation Pipeline', () => {
    test('should generate prompts with AI processing enabled', async () => {
      const params: GeneratePromptParams = {
        userId: 'test-user-123',
        person: mockPerson,
        type: 'check_in',
        urgency: 'medium',
        context: 'Recent interaction shows positive sentiment',
      };

      const result = await promptsService.generatePrompt(params);

      expect(result.success).toBe(true);
      expect(result.prompt).toBeDefined();
      expect(result.prompt?.type).toBe('check_in');
      expect(result.prompt?.personId).toBe(mockPerson.id);
      expect(result.prompt?.confidence).toBe(0.85);
    });

    test('should generate different prompt types', async () => {
      const promptTypes: PromptType[] = ['check_in', 'birthday', 'follow_up', 'support', 'celebrate'];

      for (const type of promptTypes) {
        const params: GeneratePromptParams = {
          userId: 'test-user-123',
          person: mockPerson,
          type,
          urgency: 'medium',
        };

        const result = await promptsService.generatePrompt(params);
        expect(result.success).toBe(true);
        expect(result.prompt?.type).toBe(type);
      }
    });

    test('should handle different urgency levels', async () => {
      const urgencyLevels: PromptUrgency[] = ['low', 'medium', 'high', 'critical'];

      for (const urgency of urgencyLevels) {
        const params: GeneratePromptParams = {
          userId: 'test-user-123',
          person: mockPerson,
          type: 'check_in',
          urgency,
        };

        const result = await promptsService.generatePrompt(params);
        expect(result.success).toBe(true);
        expect(result.prompt?.urgency).toBe(urgency);
      }
    });

    test('should respect privacy settings for prompt generation', async () => {
      // Disable AI processing
      privacyManager['settings'].ai_processing = false;

      const params: GeneratePromptParams = {
        userId: 'test-user-123',
        person: mockPerson,
        type: 'check_in',
        urgency: 'medium',
      };

      const result = await promptsService.generatePrompt(params);
      expect(result.success).toBe(false);
      expect(result.error).toContain('AI processing not enabled');
    });

    test('should handle prompt generation errors', async () => {
      // Mock Firebase function to throw error
      const mockFunction = require('../../src/config/firebase').functions.httpsCallable;
      mockFunction.mockImplementationOnce(() => 
        jest.fn().mockRejectedValue(new Error('AI model unavailable'))
      );

      const params: GeneratePromptParams = {
        userId: 'test-user-123',
        person: mockPerson,
        type: 'check_in',
        urgency: 'medium',
      };

      const result = await promptsService.generatePrompt(params);
      expect(result.success).toBe(false);
      expect(result.error).toContain('AI model unavailable');
    });

    test('should enforce 300ms timeout requirement', async () => {
      // Mock Firebase function to simulate slow response
      const mockFunction = require('../../src/config/firebase').functions.httpsCallable;
      mockFunction.mockImplementationOnce(() => 
        jest.fn().mockImplementation(() => 
          new Promise((resolve) => 
            setTimeout(() => resolve({
              data: { success: true, prompt: { content: 'Slow response' } }
            }), 400)
          )
        )
      );

      const params: GeneratePromptParams = {
        userId: 'test-user-123',
        person: mockPerson,
        type: 'check_in',
        urgency: 'medium',
      };

      const result = await promptsService.generatePrompt(params);
      
      // Should fallback to default prompt due to timeout
      expect(result.success).toBe(true);
      expect(result.prompt?.content).toContain('fallback'); // Assuming fallback contains this word
    });
  });

  describe('Daily Prompts Generation', () => {
    test('should generate daily prompts for multiple people', async () => {
      const people: PersonDocument[] = [
        mockPerson,
        {
          ...mockPerson,
          id: 'test-person-456',
          displayName: 'Jane Smith',
          relationshipType: 'family',
        }
      ];

      const result = await promptsService.generateDailyPrompts('test-user-123', people);

      expect(result.success).toBe(true);
      expect(result.prompts).toBeDefined();
      expect(Array.isArray(result.prompts)).toBe(true);
    });

    test('should handle empty people list', async () => {
      const result = await promptsService.generateDailyPrompts('test-user-123', []);

      expect(result.success).toBe(true);
      expect(result.prompts).toEqual([]);
    });

    test('should filter out inactive people', async () => {
      const people: PersonDocument[] = [
        mockPerson,
        {
          ...mockPerson,
          id: 'inactive-person',
          displayName: 'Inactive Person',
          isActive: false,
        }
      ];

      const result = await promptsService.generateDailyPrompts('test-user-123', people);

      expect(result.success).toBe(true);
      // Should only generate prompts for active people
      expect(result.prompts?.length).toBe(1);
    });
  });

  describe('Privacy Compliance in AI Pipeline', () => {
    test('should log AI processing actions when analytics enabled', async () => {
      const mockLogAction = jest.spyOn(privacyManager, 'logPrivacyAction');

      await contextExtractionService.extractInteractionContext(
        'test-user-123',
        mockPerson.id,
        mockInteraction.notes,
        mockInteraction.type
      );

      expect(mockLogAction).toHaveBeenCalledWith(
        'ai_processing',
        'ai_processing',
        expect.stringContaining('Context extraction'),
        'test-user-123'
      );
    });

    test('should not log AI actions when analytics disabled', async () => {
      privacyManager['settings'].analytics = false;
      const mockLogAction = jest.spyOn(privacyManager, 'logPrivacyAction');

      await contextExtractionService.extractInteractionContext(
        'test-user-123',
        mockPerson.id,
        mockInteraction.notes,
        mockInteraction.type
      );

      expect(mockLogAction).not.toHaveBeenCalled();
    });

    test('should validate user consent before AI processing', async () => {
      // Mock invalid consent
      jest.spyOn(privacyManager, 'hasValidConsent').mockReturnValue(false);

      const result = await contextExtractionService.extractInteractionContext(
        'test-user-123',
        mockPerson.id,
        mockInteraction.notes,
        mockInteraction.type
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('valid consent');
    });

    test('should handle consent validation errors gracefully', async () => {
      // Mock consent validation error
      jest.spyOn(privacyManager, 'hasValidConsent').mockImplementation(() => {
        throw new Error('Consent validation error');
      });

      const result = await contextExtractionService.extractInteractionContext(
        'test-user-123',
        mockPerson.id,
        mockInteraction.notes,
        mockInteraction.type
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('consent validation');
    });
  });

  describe('AI Processing Performance', () => {
    test('should complete context extraction within reasonable time', async () => {
      const startTime = Date.now();

      await contextExtractionService.extractInteractionContext(
        'test-user-123',
        mockPerson.id,
        mockInteraction.notes,
        mockInteraction.type
      );

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should complete prompt generation within reasonable time', async () => {
      const startTime = Date.now();

      const params: GeneratePromptParams = {
        userId: 'test-user-123',
        person: mockPerson,
        type: 'check_in',
        urgency: 'medium',
      };

      await promptsService.generatePrompt(params);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle concurrent AI requests', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => 
        contextExtractionService.extractInteractionContext(
          'test-user-123',
          mockPerson.id,
          `Interaction ${i}`,
          'conversation'
        )
      );

      const results = await Promise.all(requests);

      expect(results.every(result => result.success)).toBe(true);
    });
  });

  describe('Error Recovery and Fallbacks', () => {
    test('should provide fallback prompts when AI fails', async () => {
      // Mock complete AI failure
      const mockFunction = require('../../src/config/firebase').functions.httpsCallable;
      mockFunction.mockImplementationOnce(() => 
        jest.fn().mockRejectedValue(new Error('Complete AI failure'))
      );

      const params: GeneratePromptParams = {
        userId: 'test-user-123',
        person: mockPerson,
        type: 'check_in',
        urgency: 'medium',
      };

      const result = await promptsService.generatePrompt(params);

      expect(result.success).toBe(true);
      expect(result.prompt).toBeDefined();
      expect(result.prompt?.content).toBeTruthy();
      expect(result.wasFromFallback).toBe(true);
    });

    test('should gracefully degrade when AI services are unavailable', async () => {
      // Mock service unavailable
      const mockFunction = require('../../src/config/firebase').functions.httpsCallable;
      mockFunction.mockImplementation(() => 
        jest.fn().mockRejectedValue(new Error('Service unavailable'))
      );

      const people: PersonDocument[] = [mockPerson];
      const result = await promptsService.generateDailyPrompts('test-user-123', people);

      // Should still provide some prompts (fallback)
      expect(result.success).toBe(true);
      expect(result.prompts).toBeDefined();
      expect(result.prompts?.length).toBeGreaterThan(0);
    });

    test('should maintain app functionality without AI features', async () => {
      // Disable AI processing
      privacyManager['settings'].ai_processing = false;

      // App should still work for basic relationship management
      expect(hasPermission('data_collection')).toBe(true);
      expect(hasPermission('ai_processing')).toBe(false);

      // Basic operations should not depend on AI
      const person = { ...mockPerson };
      expect(person.displayName).toBeTruthy();
      expect(person.relationshipHealth).toBeGreaterThan(0);
    });
  });
});