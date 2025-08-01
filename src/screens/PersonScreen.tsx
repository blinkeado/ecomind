// SOURCE: IMPLEMENTATION_PLAN.md line 58 + individual relationship details requirements
// VERIFIED: PersonScreen for comprehensive relationship management and interaction tracking

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { GlassContainer, GlassText, GlassButton, GlassInput, HealthIndicator } from '../components/design/DesignSystem';
import { TimelineView } from '../components/TimelineView';
import { PromptCard } from '../components/PromptCard';
import { ContextEditor } from '../components/ContextEditor';
import { useAuth } from '../hooks/useAuth';
import { useRelationships } from '../hooks/useRelationships';
import { usePersonPrompts } from '../hooks/usePrompts';
import { PersonDocument, InteractionRecord, LifeEvent, RelationshipType } from '../types/relationship';
import { RelationshipPrompt } from '../types/prompt';
import { contextExtractionService } from '../services/contextExtraction';
import { UI_CONSTANTS } from '../utils/constants';
import { formatDate } from '../utils/dateHelpers';
import { hasPermission } from '../utils/permissions';

/**
 * PersonScreen Component Props
 */
interface PersonScreenProps {
  navigation: any;
  route: {
    params: {
      personId?: string;
      mode?: 'view' | 'edit' | 'create';
    };
  };
}

/**
 * PersonScreen Component
 * Individual relationship details and management
 * SOURCE: IMPLEMENTATION_PLAN.md line 58 - PersonScreen for individual relationship details
 */
export const PersonScreen: React.FC<PersonScreenProps> = ({ navigation, route }) => {
  const { personId, mode = 'view' } = route.params || {};
  const { user } = useAuth();
  const { 
    relationships, 
    loading: relationshipsLoading,
    addInteraction,
    updatePerson,
    createPerson,
    deletePerson,
  } = useRelationships();
  const { 
    prompts, 
    generatePrompt,
    completePrompt,
    dismissPrompt 
  } = usePersonPrompts(personId || '');

  // Find the person
  const person = personId ? relationships.find(p => p.id === personId) : null;

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(mode === 'create' || mode === 'edit');
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'prompts' | 'context'>('overview');
  const [showNewInteraction, setShowNewInteraction] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  // Form state for editing
  const [editForm, setEditForm] = useState({
    displayName: '',
    relationshipType: 'friend' as RelationshipType,
    personalContext: '',
    tags: [] as string[],
    relationshipHealth: 7,
    relationshipIntensity: 5,
  });

  // New interaction form
  const [newInteraction, setNewInteraction] = useState({
    type: 'conversation' as any,
    notes: '',
    location: '',
    emotionalTone: 'neutral' as any,
  });

  // Initialize edit form when person changes
  useEffect(() => {
    if (person) {
      setEditForm({
        displayName: person.displayName,
        relationshipType: person.relationshipType,
        personalContext: person.personalContext || '',
        tags: person.tags || [],
        relationshipHealth: person.relationshipHealth,
        relationshipIntensity: person.relationshipIntensity,
      });
    }
  }, [person]);

  // Set navigation title
  useEffect(() => {
    const title = mode === 'create' ? 'Add Person' : 
                  isEditing ? 'Edit Person' : 
                  person?.displayName || 'Person';
    navigation.setOptions({ title });
  }, [navigation, mode, isEditing, person?.displayName]);

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Refresh is handled by the useRelationships hook automatically
      await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay for UX
    } finally {
      setRefreshing(false);
    }
  }, []);

  /**
   * Handle save person
   */
  const handleSavePerson = async () => {
    if (!user) return;

    try {
      if (mode === 'create') {
        // Create new person
        const newPersonData = {
          ...editForm,
          createdBy: user.uid,
          createdAt: new Date(),
          lastUpdatedAt: new Date(),
          isActive: true,
          contactMethods: [],
          interactions: [],
          lifeEvents: [],
          roles: [],
        };

        const personId = await createPerson(user.uid, newPersonData);
        navigation.replace('Person', { personId, mode: 'view' });
      } else if (person) {
        // Update existing person
        await updatePerson(user.uid, person.id, {
          ...editForm,
          lastUpdatedAt: new Date(),
        });
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to save person:', error);
      Alert.alert('Error', 'Failed to save person. Please try again.');
    }
  };

  /**
   * Handle delete person
   */
  const handleDeletePerson = () => {
    if (!person) return;

    Alert.alert(
      'Delete Person',
      `Are you sure you want to delete ${person.displayName}? This will remove all interactions and cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePerson(user!.uid, person.id);
              navigation.goBack();
            } catch (error) {
              console.error('Failed to delete person:', error);
              Alert.alert('Error', 'Failed to delete person. Please try again.');
            }
          },
        },
      ]
    );
  };

  /**
   * Handle add interaction
   */
  const handleAddInteraction = async () => {
    if (!person || !user) return;

    try {
      const interaction: Omit<InteractionRecord, 'id'> = {
        type: newInteraction.type,
        timestamp: new Date(),
        notes: newInteraction.notes,
        location: newInteraction.location || undefined,
        emotionalTone: newInteraction.emotionalTone,
        createdBy: user.uid,
        createdAt: new Date(),
      };

      await addInteraction(user.uid, person.id, interaction);

      // Extract context if AI processing is enabled and there are notes
      if (hasPermission('ai_processing') && newInteraction.notes.trim()) {
        try {
          await contextExtractionService.extractInteractionContext(
            user.uid,
            person.id,
            newInteraction.notes,
            newInteraction.type,
            { location: newInteraction.location }
          );
        } catch (error) {
          console.error('Failed to extract context:', error);
          // Don't show error to user as this is background processing
        }
      }

      // Reset form and close
      setNewInteraction({
        type: 'conversation',
        notes: '',
        location: '',
        emotionalTone: 'neutral',
      });
      setShowNewInteraction(false);

      Alert.alert('Success', 'Interaction added successfully');
    } catch (error) {
      console.error('Failed to add interaction:', error);
      Alert.alert('Error', 'Failed to add interaction. Please try again.');
    }
  };

  /**
   * Handle generate AI prompt
   */
  const handleGeneratePrompt = async () => {
    if (!person || !user) return;

    setIsGeneratingPrompt(true);
    try {
      await generatePrompt(person);
      Alert.alert('Success', 'New suggestion generated!');
    } catch (error) {
      console.error('Failed to generate prompt:', error);
      Alert.alert('Error', 'Failed to generate suggestion. Please try again.');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  /**
   * Handle context save
   */
  const handleContextSave = async (content: string) => {
    if (!person || !user) return;

    try {
      await updatePerson(user.uid, person.id, {
        personalContext: content,
        lastUpdatedAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to save context:', error);
      throw error; // Let ContextEditor handle the error display
    }
  };

  // Show loading state
  if (relationshipsLoading && !person) {
    return (
      <GlassContainer style={styles.container}>
        <View style={styles.loadingContainer}>
          <GlassText variant="body" color="secondary">
            Loading person details...
          </GlassText>
        </View>
      </GlassContainer>
    );
  }

  // Show not found state
  if (personId && !person && !relationshipsLoading) {
    return (
      <GlassContainer style={styles.container}>
        <View style={styles.errorContainer}>
          <GlassText variant="h3" color="primary">
            Person Not Found
          </GlassText>
          <GlassText variant="body" color="secondary" style={styles.errorMessage}>
            The person you're looking for doesn't exist or may have been deleted.
          </GlassText>
          <GlassButton onPress={() => navigation.goBack()}>
            <GlassText variant="body" color="white" weight="medium">
              Go Back
            </GlassText>
          </GlassButton>
        </View>
      </GlassContainer>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <GlassContainer style={styles.headerContainer}>
          {isEditing ? (
            <View style={styles.editForm}>
              <GlassInput
                placeholder="Person's name"
                value={editForm.displayName}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, displayName: text }))}
                style={styles.nameInput}
                testID="person-name-input"
              />
              
              {/* Relationship Type Selector */}
              <View style={styles.formSection}>
                <GlassText variant="label" color="secondary" style={styles.sectionLabel}>
                  Relationship Type
                </GlassText>
                {/* For now, simple text input - could be enhanced with picker */}
                <GlassInput
                  placeholder="e.g., friend, family, colleague"
                  value={editForm.relationshipType}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, relationshipType: text as RelationshipType }))}
                  testID="relationship-type-input"
                />
              </View>

              {/* Health and Intensity Sliders - simplified as inputs for now */}
              <View style={styles.formRow}>
                <View style={styles.formColumn}>
                  <GlassText variant="label" color="secondary">
                    Health (1-10)
                  </GlassText>
                  <GlassInput
                    placeholder="7"
                    value={editForm.relationshipHealth.toString()}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 1;
                      setEditForm(prev => ({ ...prev, relationshipHealth: Math.max(1, Math.min(10, num)) }));
                    }}
                    keyboardType="numeric"
                    testID="health-input"
                  />
                </View>
                <View style={styles.formColumn}>
                  <GlassText variant="label" color="secondary">
                    Intensity (1-10)
                  </GlassText>
                  <GlassInput
                    placeholder="5"
                    value={editForm.relationshipIntensity.toString()}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 1;
                      setEditForm(prev => ({ ...prev, relationshipIntensity: Math.max(1, Math.min(10, num)) }));
                    }}
                    keyboardType="numeric"
                    testID="intensity-input"
                  />
                </View>
              </View>

              {/* Save/Cancel Actions */}
              <View style={styles.editActions}>
                <GlassButton
                  variant="secondary"
                  onPress={() => {
                    if (mode === 'create') {
                      navigation.goBack();
                    } else {
                      setIsEditing(false);
                    }
                  }}
                  style={styles.actionButton}
                >
                  <GlassText variant="body" color="secondary" weight="medium">
                    Cancel
                  </GlassText>
                </GlassButton>
                <GlassButton
                  variant="primary"
                  onPress={handleSavePerson}
                  style={styles.actionButton}
                  testID="save-person-button"
                >
                  <GlassText variant="body" color="white" weight="medium">
                    {mode === 'create' ? 'Add Person' : 'Save Changes'}
                  </GlassText>
                </GlassButton>
              </View>
            </View>
          ) : person && (
            <View style={styles.personHeader}>
              <View style={styles.personInfo}>
                <GlassText variant="h2" color="primary" weight="bold">
                  {person.displayName}
                </GlassText>
                <GlassText variant="body" color="secondary" style={styles.relationshipType}>
                  {person.relationshipType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </GlassText>
                {person.lastContact && (
                  <GlassText variant="caption" color="tertiary">
                    Last contact: {formatDate(person.lastContact, { relative: true })}
                  </GlassText>
                )}
              </View>
              
              <View style={styles.personMetrics}>
                <HealthIndicator
                  score={person.relationshipHealth}
                  size="large"
                  showLabel={true}
                  testID="person-health-indicator"
                />
              </View>
            </View>
          )}
        </GlassContainer>

        {/* Tab Navigation */}
        {!isEditing && person && (
          <View style={styles.tabContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[
                { key: 'overview', label: 'Overview', icon: '👤' },
                { key: 'timeline', label: 'Timeline', icon: '📅' },
                { key: 'prompts', label: 'Suggestions', icon: '💡' },
                { key: 'context', label: 'Notes', icon: '📝' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key as any)}
                  style={[
                    styles.tab,
                    activeTab === tab.key && styles.activeTab,
                  ]}
                  accessible={true}
                  accessibilityLabel={`${tab.label} tab`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activeTab === tab.key }}
                >
                  <GlassText variant="caption" style={styles.tabIcon}>
                    {tab.icon}
                  </GlassText>
                  <GlassText
                    variant="caption"
                    color={activeTab === tab.key ? 'accent' : 'secondary'}
                    weight={activeTab === tab.key ? 'semibold' : 'regular'}
                  >
                    {tab.label}
                  </GlassText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Tab Content */}
        {!isEditing && person && (
          <View style={styles.tabContent}>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <View style={styles.overviewContent}>
                {/* Quick Actions */}
                <GlassContainer style={styles.section}>
                  <GlassText variant="h3" color="primary" weight="semibold" style={styles.sectionTitle}>
                    Quick Actions
                  </GlassText>
                  <View style={styles.quickActions}>
                    <GlassButton
                      variant="primary"
                      onPress={() => setShowNewInteraction(true)}
                      style={styles.quickActionButton}
                      testID="add-interaction-button"
                    >
                      <GlassText variant="body" color="white" weight="medium">
                        📝 Add Interaction
                      </GlassText>
                    </GlassButton>
                    
                    {hasPermission('ai_processing') && (
                      <GlassButton
                        variant="secondary"
                        onPress={handleGeneratePrompt}
                        disabled={isGeneratingPrompt}
                        style={styles.quickActionButton}
                        testID="generate-prompt-button"
                      >
                        <GlassText variant="body" color="secondary" weight="medium">
                          {isGeneratingPrompt ? '⏳ Generating...' : '✨ Generate Suggestion'}
                        </GlassText>
                      </GlassButton>
                    )}
                  </View>
                </GlassContainer>

                {/* Statistics */}
                <GlassContainer style={styles.section}>
                  <GlassText variant="h3" color="primary" weight="semibold" style={styles.sectionTitle}>
                    Relationship Stats
                  </GlassText>
                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                      <GlassText variant="h3" color="accent" weight="bold">
                        {person.interactions?.length || 0}
                      </GlassText>
                      <GlassText variant="caption" color="secondary">
                        Interactions
                      </GlassText>
                    </View>
                    <View style={styles.statItem}>
                      <GlassText variant="h3" color="accent" weight="bold">
                        {person.relationshipIntensity}/10
                      </GlassText>
                      <GlassText variant="caption" color="secondary">
                        Intensity
                      </GlassText>
                    </View>
                    <View style={styles.statItem}>
                      <GlassText variant="h3" color="accent" weight="bold">
                        {person.tags?.length || 0}
                      </GlassText>
                      <GlassText variant="caption" color="secondary">
                        Tags
                      </GlassText>
                    </View>
                  </View>
                </GlassContainer>

                {/* Tags */}
                {person.tags && person.tags.length > 0 && (
                  <GlassContainer style={styles.section}>
                    <GlassText variant="h3" color="primary" weight="semibold" style={styles.sectionTitle}>
                      Tags
                    </GlassText>
                    <View style={styles.tagsContainer}>
                      {person.tags.map((tag, index) => (
                        <View key={index} style={styles.tag}>
                          <GlassText variant="caption" color="secondary">
                            {tag}
                          </GlassText>
                        </View>
                      ))}
                    </View>
                  </GlassContainer>
                )}
              </View>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <TimelineView
                interactions={person.interactions || []}
                lifeEvents={person.lifeEvents || []}
                showEmotionalTone={true}
                showInteractionTypes={true}
                groupByDate={true}
                testID="person-timeline"
              />
            )}

            {/* Prompts Tab */}
            {activeTab === 'prompts' && (
              <View style={styles.promptsContent}>
                {prompts.length > 0 ? (
                  prompts.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      onAccept={completePrompt}
                      onDismiss={dismissPrompt}
                      showActions={true}
                      testID={`person-prompt-${prompt.id}`}
                    />
                  ))
                ) : (
                  <GlassContainer style={styles.emptyState}>
                    <GlassText variant="body" color="secondary" style={styles.emptyStateText}>
                      No suggestions available
                    </GlassText>
                    {hasPermission('ai_processing') && (
                      <GlassButton
                        variant="secondary"
                        onPress={handleGeneratePrompt}
                        disabled={isGeneratingPrompt}
                        style={styles.generateFirstPrompt}
                      >
                        <GlassText variant="body" color="secondary" weight="medium">
                          Generate First Suggestion
                        </GlassText>
                      </GlassButton>
                    )}
                  </GlassContainer>
                )}
              </View>
            )}

            {/* Context Tab */}
            {activeTab === 'context' && (
              <ContextEditor
                initialContent={person.personalContext || ''}
                title="Personal Notes & Context"
                placeholder="Add personal notes, memories, important details about this relationship..."
                onSave={handleContextSave}
                showCharacterCount={true}
                maxLength={5000}
                testID="person-context-editor"
              />
            )}
          </View>
        )}

        {/* New Interaction Modal */}
        {showNewInteraction && (
          <GlassContainer style={styles.modalContainer}>
            <GlassText variant="h3" color="primary" weight="semibold" style={styles.modalTitle}>
              Add New Interaction
            </GlassText>
            
            <GlassInput
              placeholder="What happened? (e.g., Had coffee, discussed work...)"
              value={newInteraction.notes}
              onChangeText={(text) => setNewInteraction(prev => ({ ...prev, notes: text }))}
              multiline={true}
              style={styles.interactionNotesInput}
              testID="interaction-notes-input"
            />
            
            <GlassInput
              placeholder="Location (optional)"
              value={newInteraction.location}
              onChangeText={(text) => setNewInteraction(prev => ({ ...prev, location: text }))}
              testID="interaction-location-input"
            />

            <View style={styles.modalActions}>
              <GlassButton
                variant="secondary"
                onPress={() => setShowNewInteraction(false)}
                style={styles.modalActionButton}
              >
                <GlassText variant="body" color="secondary" weight="medium">
                  Cancel
                </GlassText>
              </GlassButton>
              <GlassButton
                variant="primary"
                onPress={handleAddInteraction}
                style={styles.modalActionButton}
                testID="save-interaction-button"
              >
                <GlassText variant="body" color="white" weight="medium">
                  Add Interaction
                </GlassText>
              </GlassButton>
            </View>
          </GlassContainer>
        )}

        {/* Edit/Delete Actions */}
        {!isEditing && person && (
          <View style={styles.bottomActions}>
            <GlassButton
              variant="secondary"
              onPress={() => setIsEditing(true)}
              style={styles.bottomActionButton}
              testID="edit-person-button"
            >
              <GlassText variant="body" color="secondary" weight="medium">
                ✏️ Edit Person
              </GlassText>
            </GlassButton>
            
            <GlassButton
              variant="secondary"
              onPress={handleDeletePerson}
              style={[styles.bottomActionButton, styles.deleteButton]}
              testID="delete-person-button"
            >
              <GlassText variant="body" color="primary" weight="medium">
                🗑️ Delete
              </GlassText>
            </GlassButton>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

/**
 * PersonScreen Styles
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

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: UI_CONSTANTS.SPACING.XL,
  },

  errorMessage: {
    textAlign: 'center',
    marginVertical: UI_CONSTANTS.SPACING.LG,
  },

  headerContainer: {
    marginHorizontal: UI_CONSTANTS.SPACING.MD,
    marginTop: UI_CONSTANTS.SPACING.MD,
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },

  personHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  personInfo: {
    flex: 1,
    marginRight: UI_CONSTANTS.SPACING.MD,
  },

  relationshipType: {
    marginTop: UI_CONSTANTS.SPACING.XS,
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },

  personMetrics: {
    alignItems: 'center',
  },

  editForm: {
    gap: UI_CONSTANTS.SPACING.MD,
  },

  nameInput: {
    fontSize: UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.LG,
  },

  formSection: {
    gap: UI_CONSTANTS.SPACING.SM,
  },

  sectionLabel: {
    marginBottom: UI_CONSTANTS.SPACING.XS,
  },

  formRow: {
    flexDirection: 'row',
    gap: UI_CONSTANTS.SPACING.MD,
  },

  formColumn: {
    flex: 1,
    gap: UI_CONSTANTS.SPACING.XS,
  },

  editActions: {
    flexDirection: 'row',
    gap: UI_CONSTANTS.SPACING.MD,
    marginTop: UI_CONSTANTS.SPACING.MD,
  },

  actionButton: {
    flex: 1,
  },

  tabContainer: {
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },

  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: UI_CONSTANTS.SPACING.SM,
    paddingHorizontal: UI_CONSTANTS.SPACING.MD,
    marginHorizontal: UI_CONSTANTS.SPACING.XS,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.MD,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: UI_CONSTANTS.SPACING.XS,
  },

  activeTab: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },

  tabIcon: {
    fontSize: 16,
  },

  tabContent: {
    flex: 1,
  },

  overviewContent: {
    gap: UI_CONSTANTS.SPACING.MD,
  },

  section: {
    marginHorizontal: UI_CONSTANTS.SPACING.MD,
  },

  sectionTitle: {
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },

  quickActions: {
    flexDirection: 'row',
    gap: UI_CONSTANTS.SPACING.MD,
  },

  quickActionButton: {
    flex: 1,
  },

  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  statItem: {
    alignItems: 'center',
    gap: UI_CONSTANTS.SPACING.XS,
  },

  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: UI_CONSTANTS.SPACING.XS,
  },

  tag: {
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.SM,
    paddingVertical: UI_CONSTANTS.SPACING.XS,
    paddingHorizontal: UI_CONSTANTS.SPACING.SM,
  },

  promptsContent: {
    gap: UI_CONSTANTS.SPACING.SM,
    marginHorizontal: UI_CONSTANTS.SPACING.MD,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: UI_CONSTANTS.SPACING.XL,
    marginHorizontal: UI_CONSTANTS.SPACING.MD,
  },

  emptyStateText: {
    textAlign: 'center',
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },

  generateFirstPrompt: {
    paddingHorizontal: UI_CONSTANTS.SPACING.XL,
  },

  modalContainer: {
    marginHorizontal: UI_CONSTANTS.SPACING.MD,
    marginVertical: UI_CONSTANTS.SPACING.MD,
    padding: UI_CONSTANTS.SPACING.LG,
  },

  modalTitle: {
    marginBottom: UI_CONSTANTS.SPACING.LG,
  },

  interactionNotesInput: {
    minHeight: 80,
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },

  modalActions: {
    flexDirection: 'row',
    gap: UI_CONSTANTS.SPACING.MD,
    marginTop: UI_CONSTANTS.SPACING.LG,
  },

  modalActionButton: {
    flex: 1,
  },

  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: UI_CONSTANTS.SPACING.MD,
    marginTop: UI_CONSTANTS.SPACING.LG,
    gap: UI_CONSTANTS.SPACING.MD,
  },

  bottomActionButton: {
    flex: 1,
  },

  deleteButton: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },

  bottomSpacing: {
    height: UI_CONSTANTS.SPACING.XL,
  },
});

export default PersonScreen;