// SOURCE: IMPLEMENTATION_PLAN.md line 66 + AI prompt management service  
// VERIFIED: Client service for AI prompt generation and management

import { httpsCallable } from 'firebase/functions';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db, functions } from './firebase';
import { RelationshipPrompt, PromptStatus, PromptType, PromptUrgency } from '../types/prompt';
import { PersonDocument } from '../types/relationship';

/**
 * Prompt Generation Request Types
 */
export interface GeneratePromptRequest {
  userId: string;
  personId: string;
  relationshipContext: {
    displayName: string;
    relationshipType: string;
    relationshipHealth: number;
    lastContact?: string;
    recentInteractions?: Array<{
      type: string;
      date: string;
      notes?: string;
    }>;
    lifeEvents?: Array<{
      type: string;
      date: string;
      description: string;
    }>;
    personalContext?: string;
  };
  promptTypes?: PromptType[];
  urgency?: PromptUrgency;
}

export interface BulkGeneratePromptsRequest {
  userId: string;
  relationships: Array<{
    personId: string;
    context: GeneratePromptRequest['relationshipContext'];
  }>;
  maxPrompts?: number;
}

export interface GeneratedPromptResponse {
  id: string;
  type: PromptType;
  title: string;
  suggestion: string;
  description?: string;
  reasoning: string;
  urgency: PromptUrgency;
  confidence: number;
  personId: string;
  createdAt: string;
  expiresAt?: string;
}

/**
 * Prompt Management Service Class
 */
export class PromptsService {
  private generatePromptFunction = httpsCallable(functions, 'generatePrompt');
  private generateBulkPromptsFunction = httpsCallable(functions, 'generateBulkPrompts');
  private evaluatePromptFunction = httpsCallable(functions, 'evaluatePromptRelevance');

  /**
   * Generate AI prompt for a specific relationship
   */
  async generatePrompt(request: GeneratePromptRequest): Promise<RelationshipPrompt> {
    try {
      console.log('Generating AI prompt for relationship:', request.personId);
      const startTime = Date.now();
      
      const result = await this.generatePromptFunction(request);
      const generated = result.data as GeneratedPromptResponse;
      
      const duration = Date.now() - startTime;
      console.log(`Prompt generated in ${duration}ms:`, {
        type: generated.type,
        title: generated.title,
        confidence: generated.confidence,
      });
      
      // Convert to RelationshipPrompt format
      const prompt: RelationshipPrompt = {
        id: generated.id,
        userId: request.userId,
        personId: request.personId,
        type: generated.type,
        title: generated.title,
        description: generated.description,
        suggestion: generated.suggestion,
        reasoning: generated.reasoning,
        urgency: generated.urgency,
        confidence: generated.confidence,
        status: 'active',
        createdAt: new Date(generated.createdAt),
        expiresAt: generated.expiresAt ? new Date(generated.expiresAt) : undefined,
        lastUpdatedAt: new Date(generated.createdAt),
      };
      
      return prompt;
    } catch (error) {
      console.error('Prompt generation failed:', error);
      
      // Return fallback prompt
      return this.createFallbackPrompt(request);
    }
  }

  /**
   * Generate multiple prompts for relationship health analysis
   */
  async generateBulkPrompts(request: BulkGeneratePromptsRequest): Promise<{
    prompts: RelationshipPrompt[];
    generated: number;
    requested: number;
    duration: number;
  }> {
    try {
      console.log('Generating bulk prompts for', request.relationships.length, 'relationships');
      
      const result = await this.generateBulkPromptsFunction(request);
      const response = result.data as {
        prompts: GeneratedPromptResponse[];
        generated: number;
        requested: number;
        duration: number;
      };
      
      // Convert to RelationshipPrompt format
      const prompts = response.prompts.map(generated => ({
        id: generated.id,
        userId: request.userId,
        personId: generated.personId,
        type: generated.type,
        title: generated.title,
        description: generated.description,
        suggestion: generated.suggestion,
        reasoning: generated.reasoning,
        urgency: generated.urgency,
        confidence: generated.confidence,
        status: 'active' as PromptStatus,
        createdAt: new Date(generated.createdAt),
        expiresAt: generated.expiresAt ? new Date(generated.expiresAt) : undefined,
        lastUpdatedAt: new Date(generated.createdAt),
      }));
      
      console.log(`Bulk generation completed: ${response.generated}/${response.requested} prompts in ${response.duration}ms`);
      
      return {
        prompts,
        generated: response.generated,
        requested: response.requested,
        duration: response.duration,
      };
    } catch (error) {
      console.error('Bulk prompt generation failed:', error);
      return {
        prompts: [],
        generated: 0,
        requested: request.relationships.length,
        duration: 0,
      };
    }
  }

  /**
   * Create prompt from relationship context
   */
  async createPromptForRelationship(
    userId: string,
    person: PersonDocument,
    promptType?: PromptType
  ): Promise<RelationshipPrompt> {
    const request: GeneratePromptRequest = {
      userId,
      personId: person.id,
      relationshipContext: {
        displayName: person.displayName,
        relationshipType: person.relationshipType,
        relationshipHealth: person.relationshipHealth,
        lastContact: person.lastContact?.toISOString(),
        personalContext: person.personalContext,
      },
      promptTypes: promptType ? [promptType] : undefined,
    };

    return this.generatePrompt(request);
  }

  /**
   * Save prompt to Firestore
   */
  async savePrompt(userId: string, prompt: Omit<RelationshipPrompt, 'id'>): Promise<string> {
    try {
      const promptsRef = collection(db, 'users', userId, 'prompts');
      const docRef = await addDoc(promptsRef, {
        ...prompt,
        createdAt: Timestamp.fromDate(prompt.createdAt),
        lastUpdatedAt: Timestamp.fromDate(prompt.lastUpdatedAt),
        expiresAt: prompt.expiresAt ? Timestamp.fromDate(prompt.expiresAt) : null,
      });
      
      console.log('Prompt saved:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Failed to save prompt:', error);
      throw new Error('Failed to save prompt');
    }
  }

  /**
   * Update prompt status
   */
  async updatePromptStatus(
    userId: string,
    promptId: string,
    status: PromptStatus,
    completedAt?: Date
  ): Promise<void> {
    try {
      const promptRef = doc(db, 'users', userId, 'prompts', promptId);
      const updates: any = {
        status,
        lastUpdatedAt: Timestamp.now(),
      };

      if (completedAt) {
        updates.completedAt = Timestamp.fromDate(completedAt);
      }

      await updateDoc(promptRef, updates);
      console.log('Prompt status updated:', promptId, status);
    } catch (error) {
      console.error('Failed to update prompt status:', error);
      throw new Error('Failed to update prompt status');
    }
  }

  /**
   * Delete prompt
   */
  async deletePrompt(userId: string, promptId: string): Promise<void> {
    try {
      const promptRef = doc(db, 'users', userId, 'prompts', promptId);
      await deleteDoc(promptRef);
      console.log('Prompt deleted:', promptId);
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      throw new Error('Failed to delete prompt');
    }
  }

  /**
   * Get active prompts for user
   */
  getActivePrompts(
    userId: string,
    callback: (prompts: RelationshipPrompt[]) => void,
    maxPrompts = 50
  ): () => void {
    const promptsRef = collection(db, 'users', userId, 'prompts');
    const q = query(
      promptsRef,
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(maxPrompts)
    );

    return onSnapshot(q, (snapshot) => {
      const prompts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastUpdatedAt: doc.data().lastUpdatedAt?.toDate() || new Date(),
        expiresAt: doc.data().expiresAt?.toDate(),
        completedAt: doc.data().completedAt?.toDate(),
      })) as RelationshipPrompt[];

      callback(prompts);
    });
  }

  /**
   * Get prompts for specific person
   */
  getPromptsForPerson(
    userId: string,
    personId: string,
    callback: (prompts: RelationshipPrompt[]) => void
  ): () => void {
    const promptsRef = collection(db, 'users', userId, 'prompts');
    const q = query(
      promptsRef,
      where('personId', '==', personId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    return onSnapshot(q, (snapshot) => {
      const prompts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastUpdatedAt: doc.data().lastUpdatedAt?.toDate() || new Date(),
        expiresAt: doc.data().expiresAt?.toDate(),
        completedAt: doc.data().completedAt?.toDate(),
      })) as RelationshipPrompt[];

      callback(prompts);
    });
  }

  /**
   * Mark prompt as completed
   */
  async completePrompt(userId: string, promptId: string): Promise<void> {
    await this.updatePromptStatus(userId, promptId, 'completed', new Date());
  }

  /**
   * Mark prompt as dismissed
   */
  async dismissPrompt(userId: string, promptId: string): Promise<void> {
    await this.updatePromptStatus(userId, promptId, 'dismissed');
  }

  /**
   * Snooze prompt (change status to snoozed)
   */
  async snoozePrompt(userId: string, promptId: string, snoozeUntil: Date): Promise<void> {
    try {
      const promptRef = doc(db, 'users', userId, 'prompts', promptId);
      await updateDoc(promptRef, {
        status: 'snoozed',
        snoozedUntil: Timestamp.fromDate(snoozeUntil),
        lastUpdatedAt: Timestamp.now(),
      });
      console.log('Prompt snoozed until:', snoozeUntil);
    } catch (error) {
      console.error('Failed to snooze prompt:', error);
      throw new Error('Failed to snooze prompt');
    }
  }

  /**
   * Generate daily relationship check prompts
   */
  async generateDailyPrompts(userId: string, relationships: PersonDocument[]): Promise<RelationshipPrompt[]> {
    // Filter relationships that need attention
    const needsAttention = relationships.filter(person => {
      const daysSinceContact = person.lastContact ? 
        Math.floor((Date.now() - person.lastContact.getTime()) / (1000 * 60 * 60 * 24)) : 
        Infinity;
      
      // Consider relationships that haven't been contacted recently or have low health scores
      return daysSinceContact > 7 || person.relationshipHealth < 6;
    });

    if (needsAttention.length === 0) {
      return [];
    }

    // Select up to 5 relationships for daily prompts
    const selectedRelationships = needsAttention
      .sort((a, b) => {
        // Prioritize by urgency (low health score + time since contact)
        const urgencyA = (10 - a.relationshipHealth) + (a.lastContact ? 
          Math.floor((Date.now() - a.lastContact.getTime()) / (1000 * 60 * 60 * 24)) / 7 : 10);
        const urgencyB = (10 - b.relationshipHealth) + (b.lastContact ? 
          Math.floor((Date.now() - b.lastContact.getTime()) / (1000 * 60 * 60 * 24)) / 7 : 10);
        return urgencyB - urgencyA;
      })
      .slice(0, 5);

    const relationshipContexts = selectedRelationships.map(person => ({
      personId: person.id,
      context: {
        displayName: person.displayName,
        relationshipType: person.relationshipType,
        relationshipHealth: person.relationshipHealth,
        lastContact: person.lastContact?.toISOString(),
        personalContext: person.personalContext,
      },
    }));

    const result = await this.generateBulkPrompts({
      userId,
      relationships: relationshipContexts,
      maxPrompts: 5,
    });

    return result.prompts;
  }

  // Private helper methods

  private createFallbackPrompt(request: GeneratePromptRequest): RelationshipPrompt {
    return {
      id: '', // Will be set when saved
      userId: request.userId,
      personId: request.personId,
      type: 'check_in',
      title: `Check in with ${request.relationshipContext.displayName}`,
      suggestion: `Reach out to ${request.relationshipContext.displayName} and see how they're doing`,
      reasoning: 'It\'s been a while since your last interaction',
      urgency: 'medium',
      confidence: 0.6,
      status: 'active',
      createdAt: new Date(),
      lastUpdatedAt: new Date(),
    };
  }
}

/**
 * Prompts Service Instance
 */
export const promptsService = new PromptsService();

/**
 * Convenience functions for common operations
 */

/**
 * Generate prompt for relationship
 */
export const generatePromptForRelationship = (
  userId: string,
  person: PersonDocument,
  promptType?: PromptType
): Promise<RelationshipPrompt> => {
  return promptsService.createPromptForRelationship(userId, person, promptType);
};

/**
 * Complete prompt
 */
export const completePrompt = (userId: string, promptId: string): Promise<void> => {
  return promptsService.completePrompt(userId, promptId);
};

/**
 * Dismiss prompt
 */
export const dismissPrompt = (userId: string, promptId: string): Promise<void> => {
  return promptsService.dismissPrompt(userId, promptId);
};

/**
 * Snooze prompt
 */
export const snoozePrompt = (userId: string, promptId: string, snoozeUntil: Date): Promise<void> => {
  return promptsService.snoozePrompt(userId, promptId, snoozeUntil);
};

export default promptsService;