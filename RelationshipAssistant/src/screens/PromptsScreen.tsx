// SOURCE: IMPLEMENTATION_PLAN.md line 59 + AI suggestions screen requirements
// VERIFIED: PromptsScreen for managing active AI relationship suggestions

import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { GlassContainer, GlassText, GlassButton } from '../components/design/DesignSystem';
import { PromptCard } from '../components/PromptCard';
import { useAuth } from '../hooks/useAuth';
import { usePrompts, usePromptStats } from '../hooks/usePrompts';
import { useRelationships } from '../hooks/useRelationships';
import { RelationshipPrompt, PromptType, PromptUrgency } from '../types/prompt';
import { UI_CONSTANTS } from '../utils/constants';
import { hasPermission } from '../utils/permissions';

/**
 * PromptsScreen Component Props
 */
interface PromptsScreenProps {
  navigation: any;
}

/**
 * Filter Options
 */
type FilterType = 'all' | 'urgent' | 'today' | 'type' | 'person';
type SortType = 'newest' | 'oldest' | 'urgency' | 'confidence';

/**
 * PromptsScreen Component
 * Displays and manages active AI suggestions
 * SOURCE: IMPLEMENTATION_PLAN.md line 59 - PromptsScreen for active AI suggestions
 */
export const PromptsScreen: React.FC<PromptsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { relationships } = useRelationships();
  const { 
    prompts, 
    loading, 
    error,
    generateDailyPrompts,
    completePrompt,
    dismissPrompt,
    snoozePrompt,
    deletePrompt,
    refreshPrompts,
  } = usePrompts();
  const stats = usePromptStats();

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [selectedType, setSelectedType] = useState<PromptType | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Filter and sort prompts
   */
  const filteredAndSortedPrompts = useMemo(() => {
    let filtered = [...prompts];

    // Apply filters
    switch (activeFilter) {
      case 'urgent':
        filtered = filtered.filter(p => p.urgency === 'critical' || p.urgency === 'high');
        break;
      case 'today':
        const today = new Date().toDateString();
        filtered = filtered.filter(p => p.createdAt.toDateString() === today);
        break;
      case 'type':
        if (selectedType) {
          filtered = filtered.filter(p => p.type === selectedType);
        }
        break;
      case 'person':
        if (selectedPersonId) {
          filtered = filtered.filter(p => p.personId === selectedPersonId);
        }
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        break;
      case 'urgency':
        const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        filtered.sort((a, b) => urgencyOrder[b.urgency] - urgencyOrder[a.urgency]);
        break;
      case 'confidence':
        filtered.sort((a, b) => b.confidence - a.confidence);
        break;
    }

    return filtered;
  }, [prompts, activeFilter, sortBy, selectedType, selectedPersonId]);

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshPrompts();
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Handle generate new prompts
   */
  const handleGeneratePrompts = async () => {
    if (!user || !hasPermission('ai_processing')) {
      Alert.alert(
        'AI Processing Required',
        'Please enable AI processing in your privacy settings to generate suggestions.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsGenerating(true);
    try {
      const activeRelationships = relationships.filter(r => r.isActive !== false);
      await generateDailyPrompts(activeRelationships);
      Alert.alert('Success', 'New suggestions generated!');
    } catch (error) {
      console.error('Failed to generate prompts:', error);
      Alert.alert('Error', 'Failed to generate new suggestions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Handle prompt actions
   */
  const handlePromptAccept = async (prompt: RelationshipPrompt) => {
    try {
      await completePrompt(prompt.id);
      
      // Navigate to the person if available
      if (prompt.personId) {
        const person = relationships.find(p => p.id === prompt.personId);
        if (person) {
          navigation.navigate('Person', { personId: prompt.personId });
        }
      }
    } catch (error) {
      console.error('Failed to complete prompt:', error);
      Alert.alert('Error', 'Failed to complete suggestion. Please try again.');
    }
  };

  const handlePromptDismiss = async (prompt: RelationshipPrompt) => {
    try {
      await dismissPrompt(prompt.id);
    } catch (error) {
      console.error('Failed to dismiss prompt:', error);
      Alert.alert('Error', 'Failed to dismiss suggestion. Please try again.');
    }
  };

  const handlePromptSnooze = async (prompt: RelationshipPrompt) => {
    Alert.alert(
      'Snooze Suggestion',
      'When would you like to be reminded again?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: '1 Hour', 
          onPress: async () => {
            const snoozeUntil = new Date();
            snoozeUntil.setHours(snoozeUntil.getHours() + 1);
            await snoozePrompt(prompt.id, snoozeUntil);
          }
        },
        { 
          text: '1 Day', 
          onPress: async () => {
            const snoozeUntil = new Date();
            snoozeUntil.setDate(snoozeUntil.getDate() + 1);
            await snoozePrompt(prompt.id, snoozeUntil);
          }
        },
        { 
          text: '1 Week', 
          onPress: async () => {
            const snoozeUntil = new Date();
            snoozeUntil.setDate(snoozeUntil.getDate() + 7);
            await snoozePrompt(prompt.id, snoozeUntil);
          }
        },
      ]
    );
  };

  /**
   * Handle view person
   */
  const handleViewPerson = (personId: string) => {
    navigation.navigate('Person', { personId });
  };

  /**
   * Handle delete prompt
   */
  const handleDeletePrompt = (prompt: RelationshipPrompt) => {
    Alert.alert(
      'Delete Suggestion',
      'Are you sure you want to permanently delete this suggestion?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePrompt(prompt.id);
            } catch (error) {
              console.error('Failed to delete prompt:', error);
              Alert.alert('Error', 'Failed to delete suggestion. Please try again.');
            }
          },
        },
      ]
    );
  };

  /**
   * Get person name for prompt
   */
  const getPersonName = (personId: string): string => {
    const person = relationships.find(p => p.id === personId);
    return person?.displayName || 'Unknown Person';
  };

  // Show loading state
  if (loading) {
    return (
      <GlassContainer style={styles.container}>
        <View style={styles.loadingContainer}>
          <GlassText variant="body" color="secondary">
            Loading suggestions...
          </GlassText>
        </View>
      </GlassContainer>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Stats */}
        <GlassContainer style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <GlassText variant="h2" color="primary" weight="bold">
                AI Suggestions
              </GlassText>
              <GlassText variant="body" color="secondary">
                {stats.active} active • {stats.completed} completed
              </GlassText>
            </View>
            
            {hasPermission('ai_processing') && (
              <GlassButton
                variant="primary"
                onPress={handleGeneratePrompts}
                disabled={isGenerating}
                style={styles.generateButton}
                testID="generate-prompts-button"
              >
                <GlassText variant="caption" color="white" weight="medium">
                  {isGenerating ? '⏳ Generating...' : '✨ Generate'}
                </GlassText>
              </GlassButton>
            )}
          </View>

          {/* Stats Overview */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <GlassText variant="h3" color="accent" weight="bold">
                {stats.byUrgency.critical + stats.byUrgency.high}
              </GlassText>
              <GlassText variant="caption" color="secondary">
                Urgent
              </GlassText>
            </View>
            <View style={styles.statItem}>
              <GlassText variant="h3" color="accent" weight="bold">
                {stats.total}
              </GlassText>
              <GlassText variant="caption" color="secondary">
                Total
              </GlassText>
            </View>
            <View style={styles.statItem}>
              <GlassText variant="h3" color="accent" weight="bold">
                {Math.round((stats.completed / Math.max(stats.total, 1)) * 100)}%
              </GlassText>
              <GlassText variant="caption" color="secondary">
                Completed
              </GlassText>
            </View>
          </View>
        </GlassContainer>

        {/* Filter and Sort Controls */}
        <GlassContainer style={styles.controlsContainer}>
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            style={styles.filtersToggle}
            accessible={true}
            accessibilityLabel="Toggle filters"
            accessibilityRole="button"
          >
            <GlassText variant="body" color="accent" weight="medium">
              🔧 Filters & Sort
            </GlassText>
            <GlassText variant="body" color="secondary">
              {showFilters ? '▲' : '▼'}
            </GlassText>
          </TouchableOpacity>

          {showFilters && (
            <View style={styles.filtersContent}>
              {/* Filter Options */}
              <View style={styles.filterSection}>
                <GlassText variant="label" color="secondary" style={styles.filterLabel}>
                  FILTER BY
                </GlassText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.filterButtons}>
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'urgent', label: 'Urgent' },
                      { key: 'today', label: 'Today' },
                    ].map((filter) => (
                      <TouchableOpacity
                        key={filter.key}
                        onPress={() => {
                          setActiveFilter(filter.key as FilterType);
                          setSelectedType(null);
                          setSelectedPersonId(null);
                        }}
                        style={[
                          styles.filterButton,
                          activeFilter === filter.key && styles.activeFilterButton,
                        ]}
                        accessible={true}
                        accessibilityLabel={`Filter by ${filter.label}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected: activeFilter === filter.key }}
                      >
                        <GlassText
                          variant="caption"
                          color={activeFilter === filter.key ? 'accent' : 'secondary'}
                          weight={activeFilter === filter.key ? 'semibold' : 'regular'}
                        >
                          {filter.label}
                        </GlassText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Sort Options */}
              <View style={styles.filterSection}>
                <GlassText variant="label" color="secondary" style={styles.filterLabel}>
                  SORT BY
                </GlassText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.filterButtons}>
                    {[
                      { key: 'newest', label: 'Newest' },
                      { key: 'urgency', label: 'Urgency' },
                      { key: 'confidence', label: 'Confidence' },
                    ].map((sort) => (
                      <TouchableOpacity
                        key={sort.key}
                        onPress={() => setSortBy(sort.key as SortType)}
                        style={[
                          styles.filterButton,
                          sortBy === sort.key && styles.activeFilterButton,
                        ]}
                        accessible={true}
                        accessibilityLabel={`Sort by ${sort.label}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected: sortBy === sort.key }}
                      >
                        <GlassText
                          variant="caption"
                          color={sortBy === sort.key ? 'accent' : 'secondary'}
                          weight={sortBy === sort.key ? 'semibold' : 'regular'}
                        >
                          {sort.label}
                        </GlassText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          )}
        </GlassContainer>

        {/* Prompts List */}
        <View style={styles.promptsContainer}>
          {filteredAndSortedPrompts.length > 0 ? (
            <>
              {/* Active Filter Info */}
              {activeFilter !== 'all' && (
                <View style={styles.filterInfo}>
                  <GlassText variant="caption" color="secondary">
                    Showing {filteredAndSortedPrompts.length} of {prompts.length} suggestions
                    {activeFilter === 'urgent' && ' (urgent only)'}
                    {activeFilter === 'today' && ' (from today)'}
                  </GlassText>
                  <TouchableOpacity
                    onPress={() => {
                      setActiveFilter('all');
                      setSelectedType(null);
                      setSelectedPersonId(null);
                    }}
                    accessible={true}
                    accessibilityLabel="Clear filters"
                    accessibilityRole="button"
                  >
                    <GlassText variant="caption" color="accent" weight="medium">
                      Clear Filter
                    </GlassText>
                  </TouchableOpacity>
                </View>
              )}

              {/* Prompts */}
              {filteredAndSortedPrompts.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  onAccept={handlePromptAccept}
                  onDismiss={handlePromptDismiss}
                  onSnooze={handlePromptSnooze}
                  onViewPerson={handleViewPerson}
                  showActions={true}
                  testID={`prompt-${prompt.id}`}
                />
              ))}
            </>
          ) : prompts.length === 0 ? (
            // No prompts at all
            <GlassContainer style={styles.emptyStateContainer}>
              <View style={styles.emptyState}>
                <GlassText variant="h3" color="primary" style={styles.emptyStateTitle}>
                  No Suggestions Yet
                </GlassText>
                <GlassText variant="body" color="secondary" style={styles.emptyStateMessage}>
                  AI suggestions will appear here to help you maintain and strengthen your relationships.
                </GlassText>
                {hasPermission('ai_processing') ? (
                  <GlassButton
                    variant="primary"
                    onPress={handleGeneratePrompts}
                    disabled={isGenerating}
                    style={styles.generateFirstButton}
                    testID="generate-first-prompts-button"
                  >
                    <GlassText variant="body" color="white" weight="medium">
                      {isGenerating ? '⏳ Generating...' : '✨ Generate Your First Suggestions'}
                    </GlassText>
                  </GlassButton>
                ) : (
                  <GlassButton
                    variant="secondary"
                    onPress={() => navigation.navigate('Settings')}
                    style={styles.enableAIButton}
                  >
                    <GlassText variant="body" color="secondary" weight="medium">
                      Enable AI Features
                    </GlassText>
                  </GlassButton>
                )}
              </View>
            </GlassContainer>
          ) : (
            // No prompts matching filter
            <GlassContainer style={styles.emptyStateContainer}>
              <View style={styles.emptyState}>
                <GlassText variant="body" color="secondary" style={styles.emptyStateMessage}>
                  No suggestions match your current filter.
                </GlassText>
                <GlassButton
                  variant="secondary"
                  onPress={() => {
                    setActiveFilter('all');
                    setSelectedType(null);
                    setSelectedPersonId(null);
                  }}
                  style={styles.clearFilterButton}
                >
                  <GlassText variant="body" color="secondary" weight="medium">
                    Show All Suggestions
                  </GlassText>
                </GlassButton>
              </View>
            </GlassContainer>
          )}
        </View>

        {/* Error State */}
        {error && (
          <GlassContainer style={styles.errorContainer}>
            <GlassText variant="body" color="primary" style={styles.errorTitle}>
              Unable to load suggestions
            </GlassText>
            <GlassText variant="caption" color="secondary" style={styles.errorMessage}>
              {error}
            </GlassText>
            <GlassButton onPress={handleRefresh} style={styles.retryButton}>
              <GlassText variant="body" color="white" weight="medium">
                Try Again
              </GlassText>
            </GlassButton>
          </GlassContainer>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

/**
 * PromptsScreen Styles
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONSTANTS.COLORS.BACKGROUND_PRIMARY,
  },

  scrollView: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerContainer: {
    marginHorizontal: UI_CONSTANTS.SPACING.MD,
    marginTop: UI_CONSTANTS.SPACING.MD,
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },

  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },

  headerText: {
    flex: 1,
  },

  generateButton: {
    paddingHorizontal: UI_CONSTANTS.SPACING.MD,
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: UI_CONSTANTS.SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },

  statItem: {
    alignItems: 'center',
    gap: UI_CONSTANTS.SPACING.XS,
  },

  controlsContainer: {
    marginHorizontal: UI_CONSTANTS.SPACING.MD,
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },

  filtersToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: UI_CONSTANTS.SPACING.SM,
  },

  filtersContent: {
    paddingTop: UI_CONSTANTS.SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: UI_CONSTANTS.SPACING.MD,
  },

  filterSection: {
    gap: UI_CONSTANTS.SPACING.SM,
  },

  filterLabel: {
    marginBottom: UI_CONSTANTS.SPACING.XS,
  },

  filterButtons: {
    flexDirection: 'row',
    gap: UI_CONSTANTS.SPACING.SM,
  },

  filterButton: {
    paddingVertical: UI_CONSTANTS.SPACING.SM,
    paddingHorizontal: UI_CONSTANTS.SPACING.MD,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.SM,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  activeFilterButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },

  promptsContainer: {
    gap: UI_CONSTANTS.SPACING.SM,
  },

  filterInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: UI_CONSTANTS.SPACING.MD,
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },

  emptyStateContainer: {
    marginHorizontal: UI_CONSTANTS.SPACING.MD,
    marginVertical: UI_CONSTANTS.SPACING.LG,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: UI_CONSTANTS.SPACING.XL,
  },

  emptyStateTitle: {
    textAlign: 'center',
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },

  emptyStateMessage: {
    textAlign: 'center',
    marginBottom: UI_CONSTANTS.SPACING.LG,
    lineHeight: 22,
  },

  generateFirstButton: {
    paddingHorizontal: UI_CONSTANTS.SPACING.XL,
  },

  enableAIButton: {
    paddingHorizontal: UI_CONSTANTS.SPACING.XL,
  },

  clearFilterButton: {
    paddingHorizontal: UI_CONSTANTS.SPACING.XL,
  },

  errorContainer: {
    marginHorizontal: UI_CONSTANTS.SPACING.MD,
    marginVertical: UI_CONSTANTS.SPACING.LG,
    alignItems: 'center',
  },

  errorTitle: {
    textAlign: 'center',
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },

  errorMessage: {
    textAlign: 'center',
    marginBottom: UI_CONSTANTS.SPACING.LG,
  },

  retryButton: {
    minWidth: 120,
  },

  bottomSpacing: {
    height: UI_CONSTANTS.SPACING.XL,
  },
});

export default PromptsScreen;