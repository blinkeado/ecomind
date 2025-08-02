/**
 * TypeScript interfaces for Vector Search functionality
 * Following official Google Cloud Firestore Vector Search patterns
 * Supporting Vertex AI text-embedding-004 (768 dimensions)
 */

export interface EmbeddingMetadata {
  model: string;              // 'text-embedding-004'
  dimensions: number;         // 768 for text-embedding-004
  generatedAt: Date;
  contentHash: string;        // For cache invalidation and deduplication
  version: string;            // Schema version for future compatibility
}

export interface VectorDocument {
  id: string;
  relationshipId: string;
  userId: string;             // Critical for privacy isolation
  contentType: 'relationship_context' | 'emotional_signal' | 'interaction_summary' | 'life_event';
  embedding: number[];        // 768-dimensional vector from text-embedding-004
  metadata: EmbeddingMetadata;
  searchableContent: string;  // Original text (truncated for storage optimization)
  lastUpdated: Date;
  isActive: boolean;          // For soft deletion and filtering
}

export interface VectorSearchConfig {
  limit?: number;                                    // Max results to return (default: 10, max: 100)
  threshold?: number;                               // Similarity threshold 0-1 (default: 0.7)
  contentTypes?: VectorDocument['contentType'][];   // Filter by content types
  userId?: string;                                  // Privacy filter - only return user's data
  excludeRelationshipIds?: string[];               // Exclude specific relationships
  includeMetadata?: boolean;                        // Include embedding metadata in results
}

export interface SimilaritySearchResult {
  id: string;                                       // Vector document ID
  relationshipId: string;                          // Associated relationship ID
  contentType: VectorDocument['contentType'];      // Type of content
  similarity: number;                              // Similarity score 0-1 (higher = more similar)
  content: string;                                 // Searchable content (truncated)
  metadata: EmbeddingMetadata;                     // Embedding generation metadata
  lastUpdated: Date;                               // When vector was last updated
}

export interface VectorSearchAnalytics {
  totalSearches: number;                           // Total search queries performed
  averageResponseTime: number;                     // Average search response time (ms)
  averageSimilarityScore: number;                  // Average similarity of returned results
  topContentTypes: Array<{                         // Most searched content types
    type: VectorDocument['contentType'];
    count: number;
  }>;
  cacheHitRate: number;                           // Percentage of queries served from cache
  errorRate: number;                              // Percentage of failed searches
}

export interface BatchEmbeddingResult {
  success: number;                                // Number of successful embeddings generated
  failed: number;                                 // Number of failed embedding attempts
  totalProcessed: number;                         // Total items processed
  errors: Array<{
    relationshipId: string;
    error: string;
    timestamp: Date;
  }>;
}

export interface VectorSearchPerformanceMetrics {
  embeddingGenerationTime: number;                // Time to generate embedding (ms)
  searchQueryTime: number;                        // Time to execute search query (ms)
  totalResponseTime: number;                      // End-to-end response time (ms)
  cacheHit: boolean;                             // Whether result was served from cache
  resultCount: number;                           // Number of results returned
  queryComplexity: 'simple' | 'filtered' | 'complex'; // Query complexity level
}

// Firebase Cloud Function interfaces
export interface EmbeddingRequest {
  content: string;
  contentType?: VectorDocument['contentType'];
  userId?: string;  // For audit logging
}

export interface EmbeddingResponse {
  embedding: number[];                            // 768-dimensional vector
  model: string;                                 // Model used for generation
  processingTime: number;                        // Generation time (ms)
  tokenCount: number;                            // Input tokens processed
}

// Vector index configuration interface
export interface VectorIndexConfig {
  collectionGroup: string;                       // 'vectors'
  fields: Array<{
    fieldPath: string;
    order?: 'ASCENDING' | 'DESCENDING';
    vectorConfig?: {
      dimension: number;                         // 768 for text-embedding-004
      flat?: object;                            // Flat index configuration
    };
  }>;
  queryScope: 'COLLECTION' | 'COLLECTION_GROUP';
}

// Search optimization interfaces
export interface SearchOptimizationStrategy {
  enableCaching: boolean;                        // Enable query result caching
  cacheTimeToLive: number;                      // Cache TTL in milliseconds
  batchSize: number;                            // Batch size for bulk operations
  maxConcurrentRequests: number;                // Max parallel embedding requests
  enablePrefiltering: boolean;                  // Apply filters before vector search
}

export interface SemanticSearchContext {
  queryIntent: 'find_similar' | 'discover_related' | 'analyze_patterns';
  contextualFilters: {
    temporalRange?: {
      startDate: Date;
      endDate: Date;
    };
    relationshipTypes?: string[];
    emotionalStates?: string[];
    interactionFrequency?: 'high' | 'medium' | 'low';
  };
  businessLogicWeights: {
    recencyBoost: number;                       // Boost recent interactions
    relationshipStrengthMultiplier: number;     // Weight by relationship importance
    emotionalRelevanceWeight: number;           // Weight by emotional context
  };
}

// Privacy and compliance interfaces
export interface VectorPrivacyConfig {
  enableDataMinimization: boolean;               // Minimize stored content
  automaticCleanup: boolean;                    // Auto-delete old vectors
  retentionPeriodDays: number;                  // How long to keep vectors
  enableAuditLogging: boolean;                  // Log all vector operations
  userConsentRequired: boolean;                 // Require explicit consent
}

export interface VectorSearchAuditLog {
  userId: string;
  operation: 'generate' | 'search' | 'update' | 'delete';
  timestamp: Date;
  vectorDocumentId?: string;
  queryText?: string;
  resultCount?: number;
  processingTime: number;
  ipAddress?: string;
  userAgent?: string;
}

// Performance monitoring interfaces
export interface VectorPerformanceAlert {
  type: 'slow_query' | 'high_error_rate' | 'cache_miss_spike' | 'embedding_failure';
  threshold: number;
  currentValue: number;
  timestamp: Date;
  severity: 'warning' | 'error' | 'critical';
  metadata: Record<string, any>;
}

export interface VectorHealthCheck {
  isHealthy: boolean;
  checks: {
    embeddingServiceAvailable: boolean;
    firestoreConnected: boolean;
    cacheOperational: boolean;
    indexesOptimized: boolean;
  };
  performanceMetrics: {
    averageResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
    throughput: number; // Queries per second
  };
  lastChecked: Date;
}