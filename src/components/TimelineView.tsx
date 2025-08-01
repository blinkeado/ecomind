// SOURCE: IMPLEMENTATION_PLAN.md line 54 + relationship timeline requirements
// VERIFIED: TimelineView component for relationship history visualization

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { InteractionRecord, LifeEvent, EmotionalTone, InteractionType } from '../types/relationship';
import { GlassContainer, GlassText, GlassCard } from './design/DesignSystem';
import { formatDate, formatRelativeTime, isToday, isYesterday, isThisWeek } from '../utils/dateHelpers';
import { UI_CONSTANTS } from '../utils/constants';

/**
 * Timeline Item Interface
 */
interface TimelineItem {
  id: string;
  type: 'interaction' | 'life_event';
  date: Date;
  title: string;
  description?: string;
  emotionalTone?: EmotionalTone;
  interactionType?: InteractionType;
  importance?: number;
  data: InteractionRecord | LifeEvent;
}

/**
 * TimelineView Component Props
 */
interface TimelineViewProps {
  interactions: InteractionRecord[];
  lifeEvents: LifeEvent[];
  onItemPress?: (item: TimelineItem) => void;
  showEmotionalTone?: boolean;
  showInteractionTypes?: boolean;
  groupByDate?: boolean;
  maxItems?: number;
  style?: any;
  testID?: string;
}

/**
 * TimelineView Component
 * Displays chronological relationship history
 * SOURCE: IMPLEMENTATION_PLAN.md line 54 - TimelineView for relationship history
 */
export const TimelineView: React.FC<TimelineViewProps> = ({
  interactions,
  lifeEvents,
  onItemPress,
  showEmotionalTone = true,
  showInteractionTypes = true,
  groupByDate = true,
  maxItems,
  style,
  testID = 'timeline-view',
}) => {

  /**
   * Convert data to timeline items and sort chronologically
   */
  const timelineItems = useMemo((): TimelineItem[] => {
    const items: TimelineItem[] = [];

    // Add interactions
    interactions.forEach(interaction => {
      items.push({
        id: interaction.id,
        type: 'interaction',
        date: interaction.timestamp,
        title: getInteractionTitle(interaction),
        description: interaction.notes,
        emotionalTone: interaction.emotionalTone,
        interactionType: interaction.type,
        data: interaction,
      });
    });

    // Add life events
    lifeEvents.forEach(event => {
      items.push({
        id: event.id,
        type: 'life_event',
        date: event.date,
        title: event.title,
        description: event.description,
        importance: event.importance,
        data: event,
      });
    });

    // Sort by date (most recent first)
    items.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Apply max items limit
    return maxItems ? items.slice(0, maxItems) : items;
  }, [interactions, lifeEvents, maxItems]);

  /**
   * Group timeline items by date periods
   */
  const groupedItems = useMemo(() => {
    if (!groupByDate) return { 'All Items': timelineItems };

    const groups: Record<string, TimelineItem[]> = {};
    
    timelineItems.forEach(item => {
      let groupKey: string;
      
      if (isToday(item.date)) {
        groupKey = 'Today';
      } else if (isYesterday(item.date)) {
        groupKey = 'Yesterday';
      } else if (isThisWeek(item.date)) {
        groupKey = 'This Week';
      } else {
        // Group by month for older items
        groupKey = formatDate(item.date, { 
          includeYear: true, 
          includeTime: false,
          short: true 
        }).replace(/\d+,/, ''); // Remove day number, keep month/year
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });

    return groups;
  }, [timelineItems, groupByDate]);

  /**
   * Get interaction title based on type
   */
  const getInteractionTitle = (interaction: InteractionRecord): string => {
    const typeMap: Record<InteractionType, string> = {
      conversation: 'Had a conversation',
      phone_call: 'Phone call',
      video_call: 'Video call',
      text_message: 'Text conversation',
      email: 'Email exchange',
      social_media: 'Social media interaction',
      meeting: 'Met in person',
      meal: 'Shared a meal',
      activity: 'Did an activity together',
      event: 'Attended event together',
      help: 'Helped each other',
      conflict: 'Had a disagreement',
      celebration: 'Celebrated together',
      support: 'Provided support',
      other: 'Interacted',
    };
    
    return typeMap[interaction.type] || 'Interacted';
  };

  /**
   * Get emotional tone color
   */
  const getEmotionalToneColor = (tone: EmotionalTone): string => {
    const colorMap: Record<EmotionalTone, string> = {
      very_positive: '#10B981', // Green
      positive: '#34D399', // Light Green
      neutral: '#6B7280', // Gray
      negative: '#F97316', // Orange
      very_negative: '#EF4444', // Red
      mixed: '#8B5CF6', // Purple
      unknown: '#9CA3AF', // Light Gray
    };
    
    return colorMap[tone] || colorMap.unknown;
  };

  /**
   * Get emotional tone emoji
   */
  const getEmotionalToneEmoji = (tone: EmotionalTone): string => {
    const emojiMap: Record<EmotionalTone, string> = {
      very_positive: '😊',
      positive: '🙂',
      neutral: '😐',
      negative: '😟',
      very_negative: '😞',
      mixed: '😕',
      unknown: '❓',
    };
    
    return emojiMap[tone] || emojiMap.unknown;
  };

  /**
   * Get interaction type icon
   */
  const getInteractionTypeIcon = (type: InteractionType): string => {
    const iconMap: Record<InteractionType, string> = {
      conversation: '💬',
      phone_call: '📞',
      video_call: '📹',
      text_message: '💬',
      email: '📧',
      social_media: '📱',
      meeting: '🤝',
      meal: '🍽️',
      activity: '🎯',
      event: '🎉',
      help: '🤲',
      conflict: '⚡',
      celebration: '🎊',
      support: '🤗',
      other: '💫',
    };
    
    return iconMap[type] || '💫';
  };

  /**
   * Get life event icon
   */
  const getLifeEventIcon = (event: LifeEvent): string => {
    const iconMap = {
      birthday: '🎂',
      anniversary: '💝',
      wedding: '💒',
      graduation: '🎓',
      job_change: '💼',
      promotion: '📈',
      relocation: '🏠',
      birth: '👶',
      death: '🕊️',
      illness: '🏥',
      recovery: '💪',
      achievement: '🏆',
      milestone: '⭐',
      travel: '✈️',
      hobby_start: '🎨',
      relationship_start: '💕',
      relationship_end: '💔',
      other: '📅',
    };
    
    return iconMap[event.type as keyof typeof iconMap] || '📅';
  };

  /**
   * Handle item press
   */
  const handleItemPress = (item: TimelineItem) => {
    if (onItemPress) {
      onItemPress(item);
    }
  };

  /**
   * Render timeline item
   */
  const renderTimelineItem = (item: TimelineItem, index: number) => {
    const isLifeEvent = item.type === 'life_event';
    const isImportant = isLifeEvent && (item.data as LifeEvent).importance >= 8;

    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => handleItemPress(item)}
        disabled={!onItemPress}
        testID={`${testID}-item-${index}`}
        activeOpacity={0.7}
      >
        <View style={styles.timelineItem}>
          {/* Timeline Connector */}
          <View style={styles.timelineConnector}>
            <View
              style={[
                styles.timelineDot,
                isLifeEvent && styles.lifeEventDot,
                isImportant && styles.importantEventDot,
              ]}
            />
            {index < timelineItems.length - 1 && <View style={styles.timelineLine} />}
          </View>

          {/* Content */}
          <GlassCard
            intensity="subtle"
            style={[
              styles.itemCard,
              isImportant && styles.importantItemCard,
            ]}
          >
            {/* Header */}
            <View style={styles.itemHeader}>
              <View style={styles.itemTitleSection}>
                <View style={styles.itemIconTitle}>
                  <GlassText variant="body" style={styles.itemIcon}>
                    {isLifeEvent 
                      ? getLifeEventIcon(item.data as LifeEvent)
                      : showInteractionTypes 
                        ? getInteractionTypeIcon(item.interactionType!)
                        : '💬'
                    }
                  </GlassText>
                  
                  <GlassText
                    variant="body"
                    color="primary"
                    weight="medium"
                    style={styles.itemTitle}
                  >
                    {item.title}
                  </GlassText>
                </View>

                {showEmotionalTone && item.emotionalTone && !isLifeEvent && (
                  <View
                    style={[
                      styles.emotionalToneIndicator,
                      { backgroundColor: getEmotionalToneColor(item.emotionalTone) },
                    ]}
                  >
                    <GlassText variant="caption" style={styles.emotionalToneEmoji}>
                      {getEmotionalToneEmoji(item.emotionalTone)}
                    </GlassText>
                  </View>
                )}
              </View>

              <GlassText
                variant="caption"
                color="tertiary"
                style={styles.itemTime}
              >
                {formatDate(item.date, { 
                  includeTime: true, 
                  includeYear: false,
                  relative: false 
                })}
              </GlassText>
            </View>

            {/* Description */}
            {item.description && (
              <GlassText
                variant="body"
                color="secondary"
                style={styles.itemDescription}
              >
                {item.description}
              </GlassText>
            )}

            {/* Importance Indicator for Life Events */}
            {isLifeEvent && item.importance && item.importance >= 7 && (
              <View style={styles.importanceRow}>
                <GlassText
                  variant="caption"
                  color="accent"
                  weight="medium"
                >
                  {'⭐'.repeat(Math.min(3, Math.floor(item.importance / 3)))} Important
                </GlassText>
              </View>
            )}
          </GlassCard>
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Render group header
   */
  const renderGroupHeader = (groupKey: string) => (
    <View key={`header-${groupKey}`} style={styles.groupHeader}>
      <GlassText
        variant="h3"
        color="primary"
        weight="semibold"
        style={styles.groupTitle}
      >
        {groupKey}
      </GlassText>
    </View>
  );

  if (timelineItems.length === 0) {
    return (
      <GlassContainer
        intensity="subtle"
        style={[styles.container, style]}
      >
        <View style={styles.emptyState}>
          <GlassText
            variant="body"
            color="secondary"
            style={styles.emptyStateText}
          >
            No timeline data available
          </GlassText>
          <GlassText
            variant="caption"
            color="tertiary"
            style={styles.emptyStateSubtext}
          >
            Interactions and life events will appear here
          </GlassText>
        </View>
      </GlassContainer>
    );
  }

  return (
    <GlassContainer
      intensity="subtle"
      style={[styles.container, style]}
      testID={testID}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {Object.entries(groupedItems).map(([groupKey, items]) => (
          <View key={groupKey}>
            {groupByDate && renderGroupHeader(groupKey)}
            {items.map((item, index) => renderTimelineItem(item, index))}
          </View>
        ))}
      </ScrollView>
    </GlassContainer>
  );
};

/**
 * TimelineView Styles
 */
const styles = StyleSheet.create({
  container: {
    margin: UI_CONSTANTS.SPACING.MD,
    maxHeight: 500,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingVertical: UI_CONSTANTS.SPACING.MD,
  },

  groupHeader: {
    marginBottom: UI_CONSTANTS.SPACING.MD,
    marginTop: UI_CONSTANTS.SPACING.LG,
  },

  groupTitle: {
    textAlign: 'center',
  },

  timelineItem: {
    flexDirection: 'row',
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },

  timelineConnector: {
    alignItems: 'center',
    marginRight: UI_CONSTANTS.SPACING.MD,
  },

  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    borderWidth: 2,
    borderColor: UI_CONSTANTS.COLORS.BACKGROUND_PRIMARY,
    zIndex: 1,
  },

  lifeEventDot: {
    backgroundColor: UI_CONSTANTS.COLORS.WARNING,
    width: 16,
    height: 16,
    borderRadius: 8,
  },

  importantEventDot: {
    backgroundColor: UI_CONSTANTS.COLORS.SUCCESS,
    width: 18,
    height: 18,
    borderRadius: 9,
  },

  timelineLine: {
    width: 2,
    height: 40,
    backgroundColor: 'rgba(107, 114, 128, 0.3)',
    marginTop: 4,
  },

  itemCard: {
    flex: 1,
    marginBottom: 0,
    marginTop: 0,
    marginHorizontal: 0,
  },

  importantItemCard: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
  },

  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },

  itemTitleSection: {
    flex: 1,
    marginRight: UI_CONSTANTS.SPACING.MD,
  },

  itemIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: UI_CONSTANTS.SPACING.XS,
  },

  itemIcon: {
    fontSize: 16,
    marginRight: UI_CONSTANTS.SPACING.SM,
  },

  itemTitle: {
    flex: 1,
  },

  emotionalToneIndicator: {
    alignSelf: 'flex-start',
    paddingHorizontal: UI_CONSTANTS.SPACING.XS,
    paddingVertical: UI_CONSTANTS.SPACING.XS / 2,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.SM,
    marginTop: UI_CONSTANTS.SPACING.XS,
  },

  emotionalToneEmoji: {
    fontSize: 12,
    color: 'white',
  },

  itemTime: {
    textAlign: 'right',
  },

  itemDescription: {
    lineHeight: 20,
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },

  importanceRow: {
    marginTop: UI_CONSTANTS.SPACING.SM,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: UI_CONSTANTS.SPACING.SM,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: UI_CONSTANTS.SPACING.XL,
  },

  emptyStateText: {
    textAlign: 'center',
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },

  emptyStateSubtext: {
    textAlign: 'center',
  },
});

export default TimelineView;