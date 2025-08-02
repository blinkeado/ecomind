/**
 * TypeScript interfaces for Vector Search functionality
 * Following official Google Cloud Firestore Vector Search patterns
 * Supporting Vertex AI text-embedding-004 (768 dimensions)
 */
export interface EmbeddingMetadata {
    model: string;
    dimensions: number;
    generatedAt: Date;
    contentHash: string;
    version: string;
}
export interface VectorDocument {
    id: string;
    relationshipId: string;
    userId: string;
    contentType: 'relationship_context' | 'emotional_signal' | 'interaction_summary' | 'life_event';
    embedding: number[];
    metadata: EmbeddingMetadata;
    searchableContent: string;
    lastUpdated: Date;
    isActive: boolean;
}
export interface VectorSearchConfig {
    limit?: number;
    threshold?: number;
    contentTypes?: VectorDocument['contentType'][];
    userId?: string;
    excludeRelationshipIds?: string[];
    includeMetadata?: boolean;
}
export interface SimilaritySearchResult {
    id: string;
    relationshipId: string;
    contentType: VectorDocument['contentType'];
    similarity: number;
    content: string;
    metadata: EmbeddingMetadata;
    lastUpdated: Date;
}
export interface VectorSearchAnalytics {
    totalSearches: number;
    averageResponseTime: number;
    averageSimilarityScore: number;
    topContentTypes: Array<{
        type: VectorDocument['contentType'];
        count: number;
    }>;
    cacheHitRate: number;
    errorRate: number;
}
export interface BatchEmbeddingResult {
    success: number;
    failed: number;
    totalProcessed: number;
    errors: Array<{
        relationshipId: string;
        error: string;
        timestamp: Date;
    }>;
}
export interface VectorSearchPerformanceMetrics {
    embeddingGenerationTime: number;
    searchQueryTime: number;
    totalResponseTime: number;
    cacheHit: boolean;
    resultCount: number;
    queryComplexity: 'simple' | 'filtered' | 'complex';
}
export interface EmbeddingRequest {
    content: string;
    contentType?: VectorDocument['contentType'];
    userId?: string;
}
export interface EmbeddingResponse {
    embedding: number[];
    model: string;
    processingTime: number;
    tokenCount: number;
}
export interface VectorIndexConfig {
    collectionGroup: string;
    fields: Array<{
        fieldPath: string;
        order?: 'ASCENDING' | 'DESCENDING';
        vectorConfig?: {
            dimension: number;
            flat?: object;
        };
    }>;
    queryScope: 'COLLECTION' | 'COLLECTION_GROUP';
}
export interface SearchOptimizationStrategy {
    enableCaching: boolean;
    cacheTimeToLive: number;
    batchSize: number;
    maxConcurrentRequests: number;
    enablePrefiltering: boolean;
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
        recencyBoost: number;
        relationshipStrengthMultiplier: number;
        emotionalRelevanceWeight: number;
    };
}
export interface VectorPrivacyConfig {
    enableDataMinimization: boolean;
    automaticCleanup: boolean;
    retentionPeriodDays: number;
    enableAuditLogging: boolean;
    userConsentRequired: boolean;
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
        throughput: number;
    };
    lastChecked: Date;
}
//# sourceMappingURL=vectorSearch.d.ts.map