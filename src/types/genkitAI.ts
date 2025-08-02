/**
 * TypeScript interfaces for Firebase Studio Genkit AI integration
 * Supporting advanced AI workflows and multi-modal processing
 */

// Base workflow types
export interface GenkitFlowResult<T = any> {
  data: T;
  metadata: {
    model: string;
    processingTime: number;
    tokensUsed: number;
    workflowSteps: string[];
  };
}

export interface AIWorkflowMetrics {
  totalFlowExecutions: number;
  averageProcessingTime: number;
  successRate: number;
  errorRate: number;
}

// Relationship Insights
export interface RelationshipInsightRequest {
  relationshipId: string;
  userId: string;
  context: {
    relationshipData: any;
    recentInteractions: any[];
    emotionalSignals: any[];
    healthMetrics?: any;
  };
  analysisDepth?: 'basic' | 'standard' | 'comprehensive' | 'deep';
  focusAreas?: Array<'communication' | 'emotional_health' | 'growth_opportunities' | 'conflict_resolution' | 'intimacy' | 'shared_goals'>;
  includeRecommendations?: boolean;
  includePredictions?: boolean;
  timeHorizon?: '1_month' | '3_months' | '6_months' | '1_year';
}

export interface RelationshipInsightResponse {
  insights: {
    overall_assessment: {
      score: number; // 0-100
      trend: 'improving' | 'stable' | 'declining';
      key_strengths: string[];
      areas_for_growth: string[];
      summary: string;
    };
    communication: {
      effectiveness: number; // 0-100
      frequency: 'too_low' | 'optimal' | 'too_high';
      quality_indicators: string[];
      improvement_suggestions: string[];
    };
    emotional_connection: {
      depth: number; // 0-100
      stability: number; // 0-100
      emotional_patterns: Array<{
        emotion: string;
        frequency: number;
        context: string;
      }>;
      bonding_activities: string[];
    };
    growth_trajectory: {
      direction: 'upward' | 'lateral' | 'downward';
      rate: 'rapid' | 'steady' | 'slow';
      milestone_achievements: string[];
      next_growth_areas: string[];
    };
  };
  recommendations: Array<{
    category: 'communication' | 'quality_time' | 'emotional_support' | 'conflict_resolution' | 'shared_activities';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    actionable_steps: string[];
    expected_impact: 'high' | 'medium' | 'low';
    timeframe: string;
  }>;
  predictions?: {
    short_term: {
      likely_scenarios: Array<{
        scenario: string;
        probability: number;
        impact: 'positive' | 'neutral' | 'negative';
      }>;
      recommended_actions: string[];
    };
    long_term: {
      trajectory: 'strengthening' | 'maintaining' | 'at_risk';
      confidence: number;
      key_factors: string[];
    };
  };
  confidence: number; // 0-1
  processingTime: number;
  metadata: {
    model: string;
    tokensUsed: number;
    workflowSteps: string[];
    analysisDepth: string;
  };
}

// Multi-Modal Analysis
export interface MultiModalAnalysisRequest {
  text?: string;
  images?: Array<{
    url: string;
    type: 'profile_photo' | 'shared_memory' | 'screenshot' | 'document';
    context?: string;
  }>;
  audio?: Array<{
    url: string;
    duration: number;
    type: 'voice_note' | 'call_recording' | 'shared_music';
    context?: string;
  }>;
  contextData: {
    relationshipId: string;
    userId: string;
    analysisGoal: string;
    privacyConsent: boolean;
  };
  analysisGoals?: Array<'sentiment' | 'emotional_state' | 'relationship_dynamics' | 'content_themes' | 'behavioral_patterns'>;
  privacyLevel?: 'minimal' | 'standard' | 'comprehensive';
}

export interface MultiModalAnalysisResponse {
  textAnalysis?: {
    sentiment: {
      overall: 'positive' | 'neutral' | 'negative';
      confidence: number;
      emotional_indicators: string[];
    };
    themes: Array<{
      theme: string;
      relevance: number;
      context: string;
    }>;
    communication_style: {
      tone: string;
      formality: 'casual' | 'formal' | 'mixed';
      emotional_expression: 'high' | 'medium' | 'low';
    };
  };
  imageAnalysis?: {
    emotional_context: {
      detected_emotions: Array<{
        emotion: string;
        confidence: number;
      }>;
      scene_analysis: string;
      relationship_indicators: string[];
    };
    content_analysis: {
      setting: string;
      activities: string[];
      social_dynamics: string[];
    };
  };
  audioAnalysis?: {
    emotional_tone: {
      primary_emotion: string;
      secondary_emotions: string[];
      intensity: number;
    };
    communication_patterns: {
      speaking_pace: 'slow' | 'normal' | 'fast';
      vocal_stress_indicators: string[];
      engagement_level: number;
    };
  };
  combinedInsights: {
    coherence_score: number; // How well all modalities align
    dominant_themes: string[];
    emotional_consistency: boolean;
    relationship_health_indicators: string[];
    recommended_focus_areas: string[];
  };
  emotionalProfile: {
    current_state: string;
    stability: number;
    openness: number;
    connection_strength: number;
  };
  confidence: number;
  processingTime: number;
  metadata: {
    modalities: string[];
    model: string;
    privacyCompliant: boolean;
    tokensUsed: number;
  };
}

// Genkit Workflow Definitions
export interface GenkitWorkflowStep {
  name: string;
  type: 'prompt' | 'model_call' | 'data_processing' | 'validation';
  input: any;
  output: any;
  processingTime: number;
  success: boolean;
  error?: string;
}

export interface GenkitModelConfig {
  model: 'gemini-1.5-flash' | 'gemini-1.5-pro' | 'gemini-1.0-pro';
  temperature: number;
  topP: number;
  topK?: number;
  maxOutputTokens: number;
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

export interface GenkitPromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: Record<string, string>;
  modelConfig: GenkitModelConfig;
  validation?: {
    required_fields: string[];
    output_format: 'json' | 'text' | 'structured';
  };
}

// Performance and Monitoring
export interface GenkitPerformanceMetrics {
  workflow_id: string;
  execution_time: number;
  token_usage: {
    input_tokens: number;
    output_tokens: number;
    total_cost_estimate: number;
  };
  cache_hits: number;
  cache_misses: number;
  error_count: number;
  success_rate: number;
  timestamp: Date;
}

export interface GenkitHealthStatus {
  service: 'genkit_core' | 'gemini_model' | 'workflow_orchestration' | 'multi_modal';
  status: 'healthy' | 'degraded' | 'unhealthy';
  last_check: Date;
  response_time: number;
  error_rate: number;
  details?: string;
}

// Advanced AI Capabilities
export interface ConversationStarter {
  text: string;
  category: 'check_in' | 'shared_interest' | 'future_planning' | 'emotional_support' | 'fun_activity';
  confidence: number;
  reasoning: string;
  personalization_factors: string[];
  expected_engagement: 'high' | 'medium' | 'low';
}

export interface CommunicationPattern {
  pattern_type: 'frequency' | 'timing' | 'content' | 'emotional';
  description: string;
  trend: 'increasing' | 'decreasing' | 'stable' | 'cyclical';
  confidence: number;
  impact_on_relationship: 'positive' | 'neutral' | 'negative';
  recommendations: string[];
}

export interface RelationshipTrajectory {
  timeline: 'short_term' | 'medium_term' | 'long_term';
  outlook: string;
  confidence: number;
  key_factors: Array<{
    factor: string;
    influence: 'positive' | 'negative';
    weight: number;
  }>;
  scenario_analysis: Array<{
    scenario: string;
    probability: number;
    outcome: string;
    mitigation_strategies?: string[];
  }>;
}

// Privacy and Compliance
export interface GenkitPrivacyConfig {
  data_minimization: boolean;
  local_processing_preferred: boolean;
  retention_period_days: number;
  anonymization_level: 'none' | 'partial' | 'full';
  consent_required: boolean;
  audit_logging: boolean;
}

export interface GenkitAuditLog {
  workflow_id: string;
  user_id: string;
  operation: string;
  timestamp: Date;
  data_types_processed: string[];
  privacy_level: string;
  consent_status: boolean;
  processing_location: 'client' | 'server' | 'edge';
  retention_applied: boolean;
}

// Error Handling
export interface GenkitError {
  code: 'WORKFLOW_FAILED' | 'MODEL_UNAVAILABLE' | 'RATE_LIMIT_EXCEEDED' | 'INVALID_INPUT' | 'PRIVACY_VIOLATION';
  message: string;
  details?: any;
  timestamp: Date;
  workflow_step?: string;
  retryable: boolean;
  suggested_action?: string;
}

// Advanced Workflow Types
export interface GenkitWorkflowConfig {
  id: string;
  name: string;
  description: string;
  steps: GenkitWorkflowStep[];
  parallel_execution: boolean;
  timeout_ms: number;
  retry_policy: {
    max_attempts: number;
    backoff_strategy: 'exponential' | 'linear' | 'fixed';
    base_delay_ms: number;
  };
  fallback_strategy?: {
    enabled: boolean;
    fallback_model?: string;
    simplified_processing?: boolean;
  };
}

export interface BatchAnalysisRequest {
  items: Array<{
    id: string;
    type: 'relationship' | 'interaction' | 'emotional_signal';
    data: any;
  }>;
  workflow_config: GenkitWorkflowConfig;
  batch_size?: number;
  priority?: 'low' | 'normal' | 'high';
}

export interface BatchAnalysisResponse {
  results: Array<{
    id: string;
    success: boolean;
    data?: any;
    error?: GenkitError;
    processing_time: number;
  }>;
  summary: {
    total_items: number;
    successful: number;
    failed: number;
    total_processing_time: number;
    average_processing_time: number;
  };
  metadata: {
    batch_id: string;
    started_at: Date;
    completed_at: Date;
    workflow_version: string;
  };
}