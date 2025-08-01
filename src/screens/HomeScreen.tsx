// SOURCE: IMPLEMENTATION_PLAN.md line 57 + main ecomap interface requirements
// VERIFIED: HomeScreen with relationship network visualization and AI prompts

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { GlassContainer, GlassText, GlassButton } from '../components/design/DesignSystem';
import { EcomapView } from '../components/EcomapView';
import { PromptCard } from '../components/PromptCard';
import { PersonCard } from '../components/PersonCard';
import { useAuth } from '../hooks/useAuth';
import { useRelationships } from '../hooks/useRelationships';
import { useActivePrompts } from '../hooks/usePrompts';
import { PersonDocument } from '../types/relationship';
import { RelationshipPrompt } from '../types/prompt';
import { UI_CONSTANTS } from '../utils/constants';
import { hasPermission } from '../utils/permissions';

/**
 * HomeScreen Component Props
 */
interface HomeScreenProps {
  navigation: any; // React Navigation prop
}

/**
 * HomeScreen Component
 * Main interface with relationship ecomap and AI suggestions
 * SOURCE: IMPLEMENTATION_PLAN.md line 57 - HomeScreen with main ecomap interface
 */
export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { 
    relationships, 
    loading: relationshipsLoading, 
    error: relationshipsError,
    refreshRelationships 
  } = useRelationships();
  const { 
    prompts, 
    loading: promptsLoading, 
    error: promptsError,
    generateDailyPrompts,
    completePrompt,
    dismissPrompt,
    snoozePrompt 
  } = useActivePrompts();

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [showAllPrompts, setShowAllPrompts] = useState(false);
  const [viewMode, setViewMode] = useState<'ecomap' | 'list'>('ecomap');

  // Filter and sort data
  const activeRelationships = relationships.filter(person => person.isActive !== false);
  const recentPrompts = prompts.slice(0, showAllPrompts ? prompts.length : 3);
  const selectedPerson = selectedPersonId ? 
    relationships.find(p => p.id === selectedPersonId) : null;

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshRelationships(),
        generateDailyPromptsIfNeeded(),
      ]);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Generate daily prompts if needed
   */
  const generateDailyPromptsIfNeeded = async () => {
    if (!user || !hasPermission('ai_processing')) return;

    // Check if we already have recent prompts
    const today = new Date();
    const recentPrompts = prompts.filter(prompt => {
      const promptDate = new Date(prompt.createdAt);
      return promptDate.toDateString() === today.toDateString();
    });

    // Generate daily prompts if we don't have any for today
    if (recentPrompts.length === 0 && activeRelationships.length > 0) {
      try {
        await generateDailyPrompts(activeRelationships);
      } catch (error) {
        console.error('Failed to generate daily prompts:', error);
      }
    }
  };

  /**
   * Handle person selection from ecomap
   */
  const handlePersonPress = (person: PersonDocument) => {
    setSelectedPersonId(person.id);
    navigation.navigate('Person', { personId: person.id });
  };

  /**
   * Handle prompt actions
   */
  const handlePromptAccept = async (prompt: RelationshipPrompt) => {
    try {
      await completePrompt(prompt.id);
      
      // Navigate to the person if available
      if (prompt.personId) {
        navigation.navigate('Person', { personId: prompt.personId });
      }
    } catch (error) {
      console.error('Failed to complete prompt:', error);
      Alert.alert('Error', 'Failed to complete prompt. Please try again.');
    }
  };

  const handlePromptDismiss = async (prompt: RelationshipPrompt) => {
    try {
      await dismissPrompt(prompt.id);
    } catch (error) {
      console.error('Failed to dismiss prompt:', error);
      Alert.alert('Error', 'Failed to dismiss prompt. Please try again.');
    }
  };

  const handlePromptSnooze = async (prompt: RelationshipPrompt) => {
    // Show snooze options
    Alert.alert(
      'Snooze Reminder',
      'When would you like to be reminded again?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: '1 Hour', 
          onPress: () => {
            const snoozeUntil = new Date();
            snoozeUntil.setHours(snoozeUntil.getHours() + 1);
            snoozePrompt(prompt.id, snoozeUntil);
          }
        },
        { 
          text: '1 Day', 
          onPress: () => {
            const snoozeUntil = new Date();
            snoozeUntil.setDate(snoozeUntil.getDate() + 1);
            snoozePrompt(prompt.id, snoozeUntil);
          }
        },
        { 
          text: '1 Week', 
          onPress: () => {
            const snoozeUntil = new Date();
            snoozeUntil.setDate(snoozeUntil.getDate() + 7);
            snoozePrompt(prompt.id, snoozeUntil);
          }
        },
      ]
    );
  };

  /**
   * Handle view person from prompt
   */
  const handleViewPerson = (personId: string) => {
    navigation.navigate('Person', { personId });
  };

  /**
   * Handle add new person
   */
  const handleAddPerson = () => {
    navigation.navigate('Person', { mode: 'create' });
  };

  /**
   * Handle view all prompts
   */
  const handleViewAllPrompts = () => {
    navigation.navigate('Prompts');
  };

  // Generate daily prompts on component mount
  useEffect(() => {
    generateDailyPromptsIfNeeded();
  }, [user, activeRelationships.length]);

  // Show loading state
  if (relationshipsLoading) {
    return (
      <GlassContainer style={styles.container}>
        <View style={styles.loadingContainer}>
          <GlassText variant="body" color="secondary">
            Loading your relationships...
          </GlassText>
        </View>
      </GlassContainer>
    );
  }

  // Show error state
  if (relationshipsError) {
    return (
      <GlassContainer style={styles.container}>
        <View style={styles.errorContainer}>
          <GlassText variant="body" color="primary" style={styles.errorTitle}>
            Unable to load relationships
          </GlassText>
          <GlassText variant="caption" color="secondary" style={styles.errorMessage}>
            {relationshipsError}
          </GlassText>
          <GlassButton onPress={handleRefresh} style={styles.retryButton}>
            <GlassText variant="body" color="white" weight="medium">
              Try Again
            </GlassText>
          </GlassButton>
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
        {/* Header Section */}
        <GlassContainer intensity="subtle" style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <GlassText variant="h2" color="primary" weight="bold">
                Your Relationships
              </GlassText>
              <GlassText variant="body" color="secondary">
                {activeRelationships.length} connections
              </GlassText>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => setViewMode(viewMode === 'ecomap' ? 'list' : 'ecomap')}
                style={styles.viewToggle}
                accessible={true}
                accessibilityLabel={`Switch to ${viewMode === 'ecomap' ? 'list' : 'map'} view`}
                accessibilityRole="button"
              >
                <GlassText variant="caption" color="accent" weight="medium">
                  {viewMode === 'ecomap' ? '📋 List' : '🗺️ Map'}
                </GlassText>
              </TouchableOpacity>
            </View>
          </View>
        </GlassContainer>

        {/* Relationship Visualization */}
        {activeRelationships.length > 0 ? (
          <View style={styles.visualizationSection}>
            {viewMode === 'ecomap' ? (
              <EcomapView
                relationships={activeRelationships}
                onPersonPress={handlePersonPress}
                showHealthIndicators={true}
                interactive={true}
                style={styles.ecomap}
                testID="home-ecomap"
              />
            ) : (
              <View style={styles.listView}>
                {activeRelationships.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    onPress={handlePersonPress}
                    showHealthIndicator={true}
                    showLastContact={true}
                    compact={true}
                    testID={`home-person-${person.id}`}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <GlassContainer style={styles.emptyStateContainer}>
            <View style={styles.emptyState}>
              <GlassText variant="h3" color="primary" style={styles.emptyStateTitle}>
                Start Building Your Network
              </GlassText>
              <GlassText variant="body" color="secondary" style={styles.emptyStateMessage}>
                Add your first relationship to begin tracking connections and receiving personalized suggestions.
              </GlassText>
              <GlassButton
                variant="primary"
                onPress={handleAddPerson}
                style={styles.addFirstPersonButton}
                testID="add-first-person-button"
              >
                <GlassText variant="body" color="white" weight="medium">
                  Add Your First Person
                </GlassText>
              </GlassButton>
            </View>
          </GlassContainer>
        )}

        {/* AI Prompts Section */}
        {recentPrompts.length > 0 && (
          <View style={styles.promptsSection}>
            <View style={styles.promptsHeader}>
              <GlassText variant="h3" color="primary" weight="semibold">
                Relationship Suggestions
              </GlassText>
              {prompts.length > 3 && (
                <TouchableOpacity
                  onPress={handleViewAllPrompts}
                  accessible={true}
                  accessibilityLabel="View all prompts"
                  accessibilityRole="button"
                >
                  <GlassText variant="caption" color="accent" weight="medium">
                    View All ({prompts.length})
                  </GlassText>
                </TouchableOpacity>
              )}
            </View>

            {recentPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onAccept={handlePromptAccept}
                onDismiss={handlePromptDismiss}
                onSnooze={handlePromptSnooze}
                onViewPerson={handleViewPerson}
                showActions={true}
                testID={`home-prompt-${prompt.id}`}
              />
            ))}

            {!showAllPrompts && prompts.length > 3 && (
              <TouchableOpacity
                onPress={() => setShowAllPrompts(true)}
                style={styles.showMoreButton}
                accessible={true}
                accessibilityLabel="Show more prompts"
                accessibilityRole="button"
              >
                <GlassText variant="caption" color="accent" weight="medium">
                  Show {prompts.length - 3} More Suggestions
                </GlassText>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <GlassButton
            variant="primary"
            onPress={handleAddPerson}
            style={styles.quickActionButton}
            testID="add-person-button"
          >
            <GlassText variant="body" color="white" weight="medium">
              ➕ Add Person
            </GlassText>
          </GlassButton>
          
          {hasPermission('ai_processing') && (
            <GlassButton
              variant="secondary"
              onPress={() => generateDailyPrompts(activeRelationships)}
              style={styles.quickActionButton}
              testID="generate-prompts-button"
            >
              <GlassText variant="body" color="secondary" weight="medium">
                ✨ Generate Suggestions
              </GlassText>
            </GlassButton>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

/**
 * HomeScreen Styles
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
    paddingHorizontal: UI_CONSTANTS.SPACING.XL,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: UI_CONSTANTS.SPACING.XL,
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

  headerContainer: {
    marginHorizontal: UI_CONSTANTS.SPACING.MD,
    marginTop: UI_CONSTANTS.SPACING.MD,
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },

  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerText: {
    flex: 1,
  },

  headerActions: {
    marginLeft: UI_CONSTANTS.SPACING.MD,
  },

  viewToggle: {
    paddingVertical: UI_CONSTANTS.SPACING.SM,
    paddingHorizontal: UI_CONSTANTS.SPACING.MD,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.SM,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },

  visualizationSection: {
    marginBottom: UI_CONSTANTS.SPACING.LG,
  },

  ecomap: {
    marginHorizontal: UI_CONSTANTS.SPACING.MD,
  },

  listView: {
    paddingHorizontal: UI_CONSTANTS.SPACING.MD,
  },

  emptyStateContainer: {
    marginHorizontal: UI_CONSTANTS.SPACING.MD,
    marginVertical: UI_CONSTANTS.SPACING.XL,
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

  addFirstPersonButton: {
    paddingHorizontal: UI_CONSTANTS.SPACING.XL,
  },

  promptsSection: {
    marginHorizontal: UI_CONSTANTS.SPACING.MD,
    marginBottom: UI_CONSTANTS.SPACING.LG,
  },

  promptsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },

  showMoreButton: {
    alignSelf: 'center',
    paddingVertical: UI_CONSTANTS.SPACING.MD,
    paddingHorizontal: UI_CONSTANTS.SPACING.LG,
    marginTop: UI_CONSTANTS.SPACING.SM,
  },

  quickActionsSection: {
    flexDirection: 'row',
    paddingHorizontal: UI_CONSTANTS.SPACING.MD,
    marginBottom: UI_CONSTANTS.SPACING.LG,
  },

  quickActionButton: {
    flex: 1,
    marginHorizontal: UI_CONSTANTS.SPACING.XS,
  },

  bottomSpacing: {
    height: UI_CONSTANTS.SPACING.XL,
  },
});

export default HomeScreen;