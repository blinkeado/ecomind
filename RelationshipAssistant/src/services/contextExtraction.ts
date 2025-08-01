// SOURCE: IMPLEMENTATION_PLAN.md line 67 + AI context extraction service
// VERIFIED: Client service for AI context extraction and sentiment analysis

import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

/**
 * Context Extraction Types
 */
export interface ExtractContextRequest {
  userId: string;
  personId?: string;
  text: string;
  interactionType?: string;
  metadata?: {
    timestamp?: string;
    location?: string;
    participants?: string[];
  };
}

export interface ExtractedContext {
  summary: string;
  keyPoints: string[];
  emotionalTone: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative' | 'mixed';
  topics: string[];
  actionItems?: string[];
  relationshipInsights?: string[];
  confidenceScore: number;
  extractedAt: string;
}

export interface SentimentAnalysisRequest {
  userId: string;
  interactions: Array<{
    id: string;
    text: string;
    timestamp: string;
    type: string;
  }>;
  personId?: string;
}

export interface SentimentAnalysisResult {
  overallSentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative' | 'mixed';
  sentimentTrend: 'improving' | 'stable' | 'declining';
  individualScores: Array<{
    id: string;
    sentiment: string;
    confidence: number;
  }>;
  insights: string[];
  analysisDate: string;
}

export interface RelationshipInsightsRequest {
  userId: string;
  personId: string;
  analysisType?: 'health' | 'communication' | 'engagement' | 'comprehensive';
}

export interface RelationshipInsights {
  healthScore: number;
  healthTrend: 'improving' | 'stable' | 'declining';
  communicationPatterns: string[];
  engagementLevel: 'low' | 'medium' | 'high';
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  suggestedActions: string[];
  riskFactors: string[];
  opportunities: string[];
  generatedAt: string;
  analysisType: string;
}

/**
 * Context Extraction Service Class
 */
export class ContextExtractionService {
  private extractContextFunction = httpsCallable(functions, 'extractContextFromText');
  private analyzeSentimentFunction = httpsCallable(functions, 'analyzeInteractionSentiment');
  private generateInsightsFunction = httpsCallable(functions, 'generateRelationshipInsights');

  /**
   * Extract context from text using AI
   */
  async extractContext(request: ExtractContextRequest): Promise<ExtractedContext> {
    try {
      console.log('Extracting context from text...');
      
      const result = await this.extractContextFunction(request);
      const context = result.data as ExtractedContext;
      
      console.log('Context extraction completed:', {
        summary: context.summary,
        emotionalTone: context.emotionalTone,
        topicsCount: context.topics.length,
        confidence: context.confidenceScore,
      });
      
      return context;
    } catch (error) {
      console.error('Context extraction failed:', error);
      
      // Return fallback context if AI fails
      return this.getFallbackContext(request.text);
    }
  }

  /**
   * Analyze sentiment across multiple interactions
   */
  async analyzeSentiment(request: SentimentAnalysisRequest): Promise<SentimentAnalysisResult> {
    try {
      console.log('Analyzing sentiment for interactions...');
      
      const result = await this.analyzeSentimentFunction(request);
      const analysis = result.data as SentimentAnalysisResult;
      
      console.log('Sentiment analysis completed:', {
        overallSentiment: analysis.overallSentiment,
        trend: analysis.sentimentTrend,
        interactionsAnalyzed: analysis.individualScores.length,
      });
      
      return analysis;
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      
      // Return fallback analysis
      return this.getFallbackSentimentAnalysis(request.interactions);
    }
  }

  /**
   * Generate comprehensive relationship insights
   */
  async generateInsights(request: RelationshipInsightsRequest): Promise<RelationshipInsights> {
    try {
      console.log('Generating relationship insights...');
      
      const result = await this.generateInsightsFunction(request);
      const insights = result.data as RelationshipInsights;
      
      console.log('Relationship insights generated:', {
        healthScore: insights.healthScore,
        healthTrend: insights.healthTrend,
        engagementLevel: insights.engagementLevel,
        recommendationsCount: insights.recommendations.length,
      });
      
      return insights;
    } catch (error) {
      console.error('Relationship insights generation failed:', error);
      
      // Return fallback insights
      return this.getFallbackInsights();
    }
  }

  /**
   * Extract context from conversation notes
   */
  async extractConversationContext(
    userId: string,
    personId: string,
    conversationText: string,
    timestamp?: Date
  ): Promise<ExtractedContext> {
    return this.extractContext({
      userId,
      personId,
      text: conversationText,
      interactionType: 'conversation',
      metadata: {
        timestamp: timestamp?.toISOString(),
      },
    });
  }

  /**
   * Extract context from interaction notes
   */
  async extractInteractionContext(
    userId: string,
    personId: string,
    interactionText: string,
    interactionType: string,
    metadata?: { location?: string; participants?: string[] }
  ): Promise<ExtractedContext> {
    return this.extractContext({
      userId,
      personId,
      text: interactionText,
      interactionType,
      metadata,
    });
  }

  /**
   * Analyze relationship health trend
   */
  async analyzeRelationshipTrend(
    userId: string,
    personId: string,
    interactions: Array<{
      id: string;
      notes: string;
      type: string;
      timestamp: Date;
    }>
  ): Promise<SentimentAnalysisResult> {
    const formattedInteractions = interactions.map(interaction => ({
      id: interaction.id,
      text: interaction.notes,
      timestamp: interaction.timestamp.toISOString(),
      type: interaction.type,
    }));

    return this.analyzeSentiment({
      userId,
      personId,
      interactions: formattedInteractions,
    });
  }

  /**
   * Get quick sentiment for single text
   */
  async getQuickSentiment(
    userId: string,
    text: string
  ): Promise<'positive' | 'neutral' | 'negative'> {
    try {
      const context = await this.extractContext({
        userId,
        text,
        interactionType: 'quick_analysis',
      });

      // Map detailed sentiment to simple sentiment
      switch (context.emotionalTone) {
        case 'very_positive':
        case 'positive':
          return 'positive';
        case 'very_negative':
        case 'negative':
          return 'negative';
        default:
          return 'neutral';
      }
    } catch (error) {
      console.error('Quick sentiment analysis failed:', error);
      return 'neutral';
    }
  }

  // Private helper methods

  private getFallbackContext(text: string): ExtractedContext {
    return {
      summary: text.length > 100 ? `${text.substring(0, 100)}...` : text,
      keyPoints: [],
      emotionalTone: 'neutral',
      topics: [],
      actionItems: [],
      relationshipInsights: [],
      confidenceScore: 0.3,
      extractedAt: new Date().toISOString(),
    };
  }

  private getFallbackSentimentAnalysis(interactions: any[]): SentimentAnalysisResult {
    return {
      overallSentiment: 'neutral',
      sentimentTrend: 'stable',
      individualScores: interactions.map(i => ({
        id: i.id,
        sentiment: 'neutral',
        confidence: 0.3,
      })),
      insights: ['Unable to analyze sentiment at this time'],
      analysisDate: new Date().toISOString(),
    };
  }

  private getFallbackInsights(): RelationshipInsights {
    return {
      healthScore: 7.0,
      healthTrend: 'stable',
      communicationPatterns: [],
      engagementLevel: 'medium',
      strengths: [],
      improvements: [],
      recommendations: [],
      suggestedActions: [],
      riskFactors: [],
      opportunities: [],
      generatedAt: new Date().toISOString(),
      analysisType: 'fallback',
    };
  }
}

/**
 * Context Extraction Service Instance
 */
export const contextExtractionService = new ContextExtractionService();

/**
 * Convenience functions for common operations
 */

/**
 * Extract context from text
 */
export const extractContext = (request: ExtractContextRequest): Promise<ExtractedContext> => {
  return contextExtractionService.extractContext(request);
};

/**
 * Analyze sentiment
 */
export const analyzeSentiment = (request: SentimentAnalysisRequest): Promise<SentimentAnalysisResult> => {
  return contextExtractionService.analyzeSentiment(request);
};

/**
 * Generate relationship insights
 */
export const generateRelationshipInsights = (request: RelationshipInsightsRequest): Promise<RelationshipInsights> => {
  return contextExtractionService.generateInsights(request);
};

export default contextExtractionService;