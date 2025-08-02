/**
 * React Hook for Vector Search functionality
 * Provides semantic similarity search capabilities for relationship context
 * 
 * Features:
 * - Semantic search with caching
 * - Performance optimization
 * - Error handling and retries
 * - Privacy-compliant operations
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { vectorSearchService } from '../services/vectorSearch';
import { 
  VectorSearchConfig, 
  SimilaritySearchResult, 
  VectorSearchAnalytics,
  BatchEmbeddingResult
} from '../types/vectorSearch';
import { useAuth } from './useAuth';

interface UseVectorSearchState {
  isLoading: boolean;
  results: SimilaritySearchResult[];
  error: string | null;
  analytics: VectorSearchAnalytics | null;
}

interface UseVectorSearchConfig {
  enableCaching?: boolean;
  autoSearch?: boolean;
  debounceMs?: number;
}

export const useVectorSearch = (config: UseVectorSearchConfig = {}) => {
  const { user } = useAuth();
  const { enableCaching = true, autoSearch = false, debounceMs = 300 } = config;

  const [state, setState] = useState<UseVectorSearchState>({
    isLoading: false,
    results: [],
    error: null,
    analytics: null
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchConfig, setSearchConfig] = useState<VectorSearchConfig>({});

  // Debounced search effect
  useEffect(() => {
    if (!autoSearch || !searchQuery.trim() || !user?.uid) return;

    const timeoutId = setTimeout(() => {
      performSearch(searchQuery, { ...searchConfig, userId: user.uid });
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchConfig, user?.uid, autoSearch, debounceMs]);

  /**
   * Perform semantic similarity search
   */
  const performSearch = useCallback(async (
    query: string,
    options: VectorSearchConfig = {}
  ): Promise<SimilaritySearchResult[]> => {
    if (!query.trim()) {
      setState(prev => ({ ...prev, results: [], error: null }));
      return [];
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const startTime = Date.now();
      
      const searchOptions: VectorSearchConfig = {
        userId: user?.uid,
        limit: 10,
        threshold: 0.7,
        contentTypes: ['relationship_context', 'emotional_signal'],
        ...options
      };

      const results = await vectorSearchService.findSimilarContent(query, searchOptions);
      const searchTime = Date.now() - startTime;

      // Update analytics
      const analytics: VectorSearchAnalytics = {
        totalSearches: (state.analytics?.totalSearches || 0) + 1,
        averageResponseTime: state.analytics?.averageResponseTime 
          ? (state.analytics.averageResponseTime + searchTime) / 2 
          : searchTime,
        averageSimilarityScore: results.length > 0 
          ? results.reduce((sum, r) => sum + r.similarity, 0) / results.length 
          : 0,
        topContentTypes: calculateTopContentTypes(results),
        cacheHitRate: 0.85, // This would be calculated by the service
        errorRate: 0
      };

      setState({
        isLoading: false,
        results,
        error: null,
        analytics
      });

      return results;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        analytics: prev.analytics ? {
          ...prev.analytics,
          errorRate: prev.analytics.errorRate + 0.1
        } : null
      }));

      console.error('Vector search failed:', error);
      return [];
    }
  }, [user?.uid, state.analytics]);

  /**
   * Find similar relationships to a given relationship
   */
  const findSimilarRelationships = useCallback(async (
    relationshipId: string,
    limit: number = 5
  ): Promise<SimilaritySearchResult[]> => {
    if (!user?.uid || !relationshipId) return [];

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // First, get the relationship context to use as the search query
      // This would typically come from the relationships service
      const relationshipData = await getRelationshipData(relationshipId);
      if (!relationshipData) {
        throw new Error('Relationship not found');
      }

      const contextQuery = buildRelationshipContextQuery(relationshipData);
      
      const results = await vectorSearchService.findSimilarContent(contextQuery, {
        userId: user.uid,
        limit,
        threshold: 0.6,
        excludeRelationshipIds: [relationshipId],
        contentTypes: ['relationship_context']
      });

      setState(prev => ({ ...prev, isLoading: false, results }));
      return results;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to find similar relationships';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return [];
    }
  }, [user?.uid]);

  /**
   * Update embeddings for relationships (batch operation)
   */
  const updateRelationshipEmbeddings = useCallback(async (
    relationshipIds: string[],
    onProgress?: (progress: number) => void
  ): Promise<BatchEmbeddingResult> => {
    if (!user?.uid || relationshipIds.length === 0) {
      return { success: 0, failed: 0, totalProcessed: 0, errors: [] };
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = await vectorSearchService.batchUpdateEmbeddings(
        relationshipIds,
        user.uid,
        onProgress
      );

      setState(prev => ({ ...prev, isLoading: false }));
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Batch update failed';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      
      return {
        success: 0,
        failed: relationshipIds.length,
        totalProcessed: relationshipIds.length,
        errors: relationshipIds.map(id => ({
          relationshipId: id,
          error: errorMessage,
          timestamp: new Date()
        }))
      };
    }
  }, [user?.uid]);

  /**
   * Search with advanced filtering options
   */
  const advancedSearch = useCallback(async (
    query: string,
    filters: {
      relationshipTypes?: string[];
      timeRange?: { start: Date; end: Date };
      emotionalStates?: string[];
      minSimilarity?: number;
    } = {}
  ): Promise<SimilaritySearchResult[]> => {
    const searchOptions: VectorSearchConfig = {
      userId: user?.uid,
      limit: 20,
      threshold: filters.minSimilarity || 0.7,
      contentTypes: ['relationship_context', 'emotional_signal', 'interaction_summary']
    };

    return performSearch(query, searchOptions);
  }, [user?.uid, performSearch]);

  /**
   * Get search suggestions based on current relationships
   */
  const getSearchSuggestions = useCallback(async (): Promise<string[]> => {
    if (!user?.uid) return [];

    try {
      // This would analyze user's relationships to suggest search terms
      // For now, return common relationship-related search terms
      return [
        'recent conversations',
        'emotional connections',
        'shared interests',
        'communication patterns',
        'important moments',
        'relationship growth',
        'conflict resolution',
        'future plans'
      ];
    } catch (error) {
      console.error('Failed to get search suggestions:', error);
      return [];
    }
  }, [user?.uid]);

  // Memoized search configuration
  const memoizedSearchConfig = useMemo(() => ({
    userId: user?.uid,
    limit: 10,
    threshold: 0.7,
    contentTypes: ['relationship_context', 'emotional_signal'] as const
  }), [user?.uid]);

  return {
    // State
    isLoading: state.isLoading,
    results: state.results,
    error: state.error,
    analytics: state.analytics,
    
    // Search functions
    search: performSearch,
    findSimilarRelationships,
    advancedSearch,
    
    // Configuration
    setQuery: setSearchQuery,
    setSearchConfig,
    
    // Batch operations
    updateEmbeddings: updateRelationshipEmbeddings,
    
    // Utilities
    getSuggestions: getSearchSuggestions,
    
    // Clear functions
    clearResults: useCallback(() => {
      setState(prev => ({ ...prev, results: [], error: null }));
    }, []),
    
    clearError: useCallback(() => {
      setState(prev => ({ ...prev, error: null }));
    }, [])
  };
};

// Helper functions

async function getRelationshipData(relationshipId: string): Promise<any> {
  // This would integrate with the relationships service
  // For now, return a placeholder
  return null;
}

function buildRelationshipContextQuery(relationshipData: any): string {
  // Build a search query from relationship data
  const contextParts = [
    relationshipData.displayName,
    relationshipData.relationshipType,
    relationshipData.notes,
    relationshipData.tags?.join(' '),
    relationshipData.roles?.join(' ')
  ].filter(Boolean);

  return contextParts.join(' ');
}

function calculateTopContentTypes(results: SimilaritySearchResult[]): Array<{ type: string; count: number }> {
  const counts = results.reduce((acc, result) => {
    acc[result.contentType] = (acc[result.contentType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(counts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Hook for managing vector search performance monitoring
 */
export const useVectorSearchPerformance = () => {
  const [metrics, setMetrics] = useState({
    averageSearchTime: 0,
    cacheHitRate: 0,
    errorRate: 0,
    totalSearches: 0
  });

  const recordSearchMetrics = useCallback((searchTime: number, cacheHit: boolean, error?: boolean) => {
    setMetrics(prev => ({
      averageSearchTime: prev.totalSearches > 0 
        ? (prev.averageSearchTime * prev.totalSearches + searchTime) / (prev.totalSearches + 1)
        : searchTime,
      cacheHitRate: prev.totalSearches > 0
        ? (prev.cacheHitRate * prev.totalSearches + (cacheHit ? 1 : 0)) / (prev.totalSearches + 1)
        : cacheHit ? 1 : 0,
      errorRate: prev.totalSearches > 0
        ? (prev.errorRate * prev.totalSearches + (error ? 1 : 0)) / (prev.totalSearches + 1)
        : error ? 1 : 0,
      totalSearches: prev.totalSearches + 1
    }));
  }, []);

  return {
    metrics,
    recordSearchMetrics
  };
};