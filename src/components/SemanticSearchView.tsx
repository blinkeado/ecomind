/**
 * Semantic Search View Component
 * Provides intuitive interface for semantic similarity search
 * 
 * Features:
 * - Real-time search with debouncing
 * - Visual similarity indicators
 * - Relationship context preview
 * - Search suggestions and filters
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useVectorSearch } from '../hooks/useVectorSearch';
import { SimilaritySearchResult } from '../types/vectorSearch';
import { DesignSystem } from './design/DesignSystem';

const { width: screenWidth } = Dimensions.get('window');

interface SemanticSearchViewProps {
  onResultSelect?: (result: SimilaritySearchResult) => void;
  placeholder?: string;
  maxResults?: number;
  enableAdvancedFilters?: boolean;
}

export const SemanticSearchView: React.FC<SemanticSearchViewProps> = ({
  onResultSelect,
  placeholder = "Search relationships by context, emotions, or patterns...",
  maxResults = 10,
  enableAdvancedFilters = true
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    contentTypes: ['relationship_context', 'emotional_signal'] as const,
    minSimilarity: 0.7,
    relationshipTypes: [] as string[]
  });

  const {
    isLoading,
    results,
    error,
    analytics,
    search,
    getSuggestions,
    clearResults,
    clearError
  } = useVectorSearch({
    enableCaching: true,
    autoSearch: true,
    debounceMs: 300
  });

  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Load search suggestions on mount
  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = useCallback(async () => {
    try {
      const searchSuggestions = await getSuggestions();
      setSuggestions(searchSuggestions);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  }, [getSuggestions]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      clearResults();
      return;
    }

    try {
      await search(query, {
        limit: maxResults,
        threshold: selectedFilters.minSimilarity,
        contentTypes: selectedFilters.contentTypes
      });
    } catch (error) {
      Alert.alert('Search Error', 'Failed to perform search. Please try again.');
    }
  }, [search, maxResults, selectedFilters, clearResults]);

  const handleSuggestionPress = useCallback((suggestion: string) => {
    setSearchQuery(suggestion);
    handleSearch(suggestion);
  }, [handleSearch]);

  const handleResultPress = useCallback((result: SimilaritySearchResult) => {
    onResultSelect?.(result);
  }, [onResultSelect]);

  const renderSuggestions = () => (
    <View style={styles.suggestionsContainer}>
      <Text style={[DesignSystem.text.caption, styles.suggestionsTitle]}>
        Suggested searches:
      </Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.suggestionsScroll}
      >
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={styles.suggestionChip}
            onPress={() => handleSuggestionPress(suggestion)}
          >
            <Text style={[DesignSystem.text.caption, styles.suggestionText]}>
              {suggestion}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderFilters = () => {
    if (!enableAdvancedFilters || !showFilters) return null;

    return (
      <View style={styles.filtersContainer}>
        <Text style={[DesignSystem.text.body, styles.filtersTitle]}>
          Search Filters
        </Text>
        
        {/* Similarity Threshold */}
        <View style={styles.filterSection}>
          <Text style={[DesignSystem.text.caption, styles.filterLabel]}>
            Minimum Similarity: {Math.round(selectedFilters.minSimilarity * 100)}%
          </Text>
          <View style={styles.thresholdButtons}>
            {[0.5, 0.7, 0.8, 0.9].map((threshold) => (
              <TouchableOpacity
                key={threshold}
                style={[
                  styles.thresholdButton,
                  selectedFilters.minSimilarity === threshold && styles.thresholdButtonActive
                ]}
                onPress={() => setSelectedFilters(prev => ({ ...prev, minSimilarity: threshold }))}
              >
                <Text style={[
                  DesignSystem.text.caption,
                  selectedFilters.minSimilarity === threshold && styles.thresholdButtonTextActive
                ]}>
                  {Math.round(threshold * 100)}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Content Types */}
        <View style={styles.filterSection}>
          <Text style={[DesignSystem.text.caption, styles.filterLabel]}>
            Search in:
          </Text>
          <View style={styles.contentTypeButtons}>
            {[
              { value: 'relationship_context', label: 'Relationships' },
              { value: 'emotional_signal', label: 'Emotions' },
              { value: 'interaction_summary', label: 'Interactions' },
              { value: 'life_event', label: 'Life Events' }
            ].map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.contentTypeButton,
                  selectedFilters.contentTypes.includes(type.value as any) && styles.contentTypeButtonActive
                ]}
                onPress={() => {
                  setSelectedFilters(prev => ({
                    ...prev,
                    contentTypes: prev.contentTypes.includes(type.value as any)
                      ? prev.contentTypes.filter(t => t !== type.value)
                      : [...prev.contentTypes, type.value] as any
                  }));
                }}
              >
                <Text style={[
                  DesignSystem.text.caption,
                  selectedFilters.contentTypes.includes(type.value as any) && styles.contentTypeButtonTextActive
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderSearchResult = (result: SimilaritySearchResult, index: number) => (
    <TouchableOpacity
      key={result.id}
      style={styles.resultCard}
      onPress={() => handleResultPress(result)}
    >
      <View style={styles.resultHeader}>
        <View style={styles.resultInfo}>
          <Text style={[DesignSystem.text.body, styles.resultTitle]}>
            {getResultTitle(result)}
          </Text>
          <Text style={[DesignSystem.text.caption, styles.resultType]}>
            {formatContentType(result.contentType)}
          </Text>
        </View>
        <View style={styles.similarityContainer}>
          <View style={[
            styles.similarityBar,
            { width: result.similarity * 80 }
          ]} />
          <Text style={[DesignSystem.text.caption, styles.similarityText]}>
            {Math.round(result.similarity * 100)}%
          </Text>
        </View>
      </View>
      
      <Text style={[DesignSystem.text.caption, styles.resultContent]} numberOfLines={2}>
        {result.content || 'No preview available'}
      </Text>
      
      <Text style={[DesignSystem.text.caption, styles.resultDate]}>
        Updated {formatDate(result.lastUpdated)}
      </Text>
    </TouchableOpacity>
  );

  const renderAnalytics = () => {
    if (!analytics) return null;

    return (
      <View style={styles.analyticsContainer}>
        <Text style={[DesignSystem.text.caption, styles.analyticsText]}>
          Found {results.length} results • Avg similarity: {Math.round(analytics.averageSimilarityScore * 100)}%
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[DesignSystem.text.body, styles.searchInput]}
          placeholder={placeholder}
          placeholderTextColor={DesignSystem.colors.textSecondary}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            handleSearch(text);
          }}
          returnKeyType="search"
          onSubmitEditing={() => handleSearch(searchQuery)}
        />
        
        {enableAdvancedFilters && (
          <TouchableOpacity
            style={styles.filtersButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Text style={[DesignSystem.text.caption, styles.filtersButtonText]}>
              Filters
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={[DesignSystem.text.caption, styles.errorText]}>
            {error}
          </Text>
          <TouchableOpacity onPress={clearError}>
            <Text style={[DesignSystem.text.caption, styles.errorDismiss]}>
              Dismiss
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filters */}
      {renderFilters()}

      {/* Loading State */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={DesignSystem.colors.primary} />
          <Text style={[DesignSystem.text.caption, styles.loadingText]}>
            Searching...
          </Text>
        </View>
      )}

      {/* Search Results */}
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {!searchQuery.trim() && renderSuggestions()}
        
        {results.length > 0 && (
          <>
            {renderAnalytics()}
            {results.map(renderSearchResult)}
          </>
        )}
        
        {searchQuery.trim() && results.length === 0 && !isLoading && !error && (
          <View style={styles.emptyContainer}>
            <Text style={[DesignSystem.text.body, styles.emptyText]}>
              No similar relationships found
            </Text>
            <Text style={[DesignSystem.text.caption, styles.emptySubtext]}>
              Try adjusting your search terms or lowering the similarity threshold
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// Helper functions
function getResultTitle(result: SimilaritySearchResult): string {
  switch (result.contentType) {
    case 'relationship_context':
      return 'Relationship Context';
    case 'emotional_signal':
      return 'Emotional Pattern';
    case 'interaction_summary':
      return 'Interaction Summary';
    case 'life_event':
      return 'Life Event';
    default:
      return 'Related Content';
  }
}

function formatContentType(contentType: string): string {
  return contentType.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: DesignSystem.spacing.md,
    marginTop: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: DesignSystem.colors.surface,
    borderRadius: DesignSystem.borderRadius.md,
    paddingHorizontal: DesignSystem.spacing.md,
    color: DesignSystem.colors.text,
    ...DesignSystem.shadows.small,
  },
  filtersButton: {
    marginLeft: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.md,
    backgroundColor: DesignSystem.colors.primary,
    borderRadius: DesignSystem.borderRadius.sm,
  },
  filtersButtonText: {
    color: DesignSystem.colors.background,
    fontWeight: '500',
  },
  filtersContainer: {
    backgroundColor: DesignSystem.colors.surface,
    marginHorizontal: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.md,
    ...DesignSystem.shadows.small,
  },
  filtersTitle: {
    fontWeight: '600',
    marginBottom: DesignSystem.spacing.sm,
    color: DesignSystem.colors.text,
  },
  filterSection: {
    marginBottom: DesignSystem.spacing.md,
  },
  filterLabel: {
    marginBottom: DesignSystem.spacing.xs,
    color: DesignSystem.colors.textSecondary,
  },
  thresholdButtons: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.xs,
  },
  thresholdButton: {
    paddingVertical: DesignSystem.spacing.xs,
    paddingHorizontal: DesignSystem.spacing.sm,
    backgroundColor: DesignSystem.colors.background,
    borderRadius: DesignSystem.borderRadius.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border,
  },
  thresholdButtonActive: {
    backgroundColor: DesignSystem.colors.primary,
    borderColor: DesignSystem.colors.primary,
  },
  thresholdButtonTextActive: {
    color: DesignSystem.colors.background,
  },
  contentTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSystem.spacing.xs,
  },
  contentTypeButton: {
    paddingVertical: DesignSystem.spacing.xs,
    paddingHorizontal: DesignSystem.spacing.sm,
    backgroundColor: DesignSystem.colors.background,
    borderRadius: DesignSystem.borderRadius.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border,
  },
  contentTypeButtonActive: {
    backgroundColor: DesignSystem.colors.secondary,
    borderColor: DesignSystem.colors.secondary,
  },
  contentTypeButtonTextActive: {
    color: DesignSystem.colors.background,
  },
  errorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.error,
    marginHorizontal: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
    padding: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.sm,
  },
  errorText: {
    color: DesignSystem.colors.background,
    flex: 1,
  },
  errorDismiss: {
    color: DesignSystem.colors.background,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignSystem.spacing.md,
  },
  loadingText: {
    marginLeft: DesignSystem.spacing.sm,
    color: DesignSystem.colors.textSecondary,
  },
  suggestionsContainer: {
    marginBottom: DesignSystem.spacing.md,
  },
  suggestionsTitle: {
    marginHorizontal: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
    color: DesignSystem.colors.textSecondary,
  },
  suggestionsScroll: {
    paddingLeft: DesignSystem.spacing.md,
  },
  suggestionChip: {
    backgroundColor: DesignSystem.colors.surface,
    paddingVertical: DesignSystem.spacing.xs,
    paddingHorizontal: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.lg,
    marginRight: DesignSystem.spacing.xs,
    ...DesignSystem.shadows.small,
  },
  suggestionText: {
    color: DesignSystem.colors.text,
  },
  resultsContainer: {
    flex: 1,
  },
  analyticsContainer: {
    marginHorizontal: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
  },
  analyticsText: {
    color: DesignSystem.colors.textSecondary,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: DesignSystem.colors.surface,
    marginHorizontal: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.md,
    ...DesignSystem.shadows.small,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.sm,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontWeight: '600',
    color: DesignSystem.colors.text,
    marginBottom: 2,
  },
  resultType: {
    color: DesignSystem.colors.textSecondary,
  },
  similarityContainer: {
    alignItems: 'flex-end',
    width: 100,
  },
  similarityBar: {
    height: 4,
    backgroundColor: DesignSystem.colors.primary,
    borderRadius: 2,
    marginBottom: 2,
  },
  similarityText: {
    color: DesignSystem.colors.primary,
    fontWeight: '500',
  },
  resultContent: {
    color: DesignSystem.colors.textSecondary,
    lineHeight: 18,
    marginBottom: DesignSystem.spacing.sm,
  },
  resultDate: {
    color: DesignSystem.colors.textSecondary,
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: DesignSystem.spacing.xl,
  },
  emptyText: {
    color: DesignSystem.colors.textSecondary,
    marginBottom: DesignSystem.spacing.xs,
  },
  emptySubtext: {
    color: DesignSystem.colors.textSecondary,
    textAlign: 'center',
  },
});