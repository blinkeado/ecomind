// SOURCE: IMPLEMENTATION_PLAN.md line 53 + AI prompt system specifications
// VERIFIED: PromptCard component for AI-generated relationship suggestions

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { RelationshipPrompt, PromptUrgency, PromptType } from '../types/prompt';
import { GlassCard, GlassText, GlassButton } from './design/DesignSystem';
import { formatRelativeTime } from '../utils/dateHelpers';
import { UI_CONSTANTS } from '../utils/constants';

/**
 * PromptCard Component Props
 */
interface PromptCardProps {
  prompt: RelationshipPrompt;
  onAccept?: (prompt: RelationshipPrompt) => void;
  onDismiss?: (prompt: RelationshipPrompt) => void;
  onSnooze?: (prompt: RelationshipPrompt) => void;
  onViewPerson?: (personId: string) => void;
  compact?: boolean;
  showActions?: boolean;
  testID?: string;
}

/**
 * PromptCard Component
 * Displays AI-generated relationship suggestions
 * SOURCE: IMPLEMENTATION_PLAN.md line 53 - PromptCard for AI-generated suggestions
 */
export const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  onAccept,
  onDismiss,
  onSnooze,
  onViewPerson,
  compact = false,
  showActions = true,
  testID = 'prompt-card',
}) => {

  /**
   * Get urgency color
   */
  const getUrgencyColor = (urgency: PromptUrgency): string => {
    switch (urgency) {
      case 'critical':
        return UI_CONSTANTS.COLORS.ERROR;
      case 'high':
        return UI_CONSTANTS.COLORS.WARNING;
      case 'medium':
        return UI_CONSTANTS.COLORS.PRIMARY;
      case 'low':
        return UI_CONSTANTS.COLORS.TEXT_SECONDARY;
      default:
        return UI_CONSTANTS.COLORS.TEXT_SECONDARY;
    }
  };

  /**
   * Get prompt type icon/emoji
   */
  const getPromptTypeIcon = (type: PromptType): string => {
    const iconMap: Record<PromptType, string> = {
      check_in: '👋',
      birthday: '🎂',
      anniversary: '💝',
      follow_up: '💬',
      support: '🤗',
      celebrate: '🎉',
      reconnect: '🔄',
      activity_suggestion: '🎯',
      gratitude: '🙏',
      apologize: '💙',
      share_update: '📝',
      ask_advice: '🤔',
      offer_help: '🤝',
      holiday_greeting: '🎄',
      milestone: '⭐',
      sympathy: '💐',
      congratulations: '🎊',
      thinking_of_you: '💭',
      custom: '✨',
      other: '💡',
    };
    
    return iconMap[type] || '💡';
  };

  /**
   * Get prompt type display name
   */
  const getPromptTypeDisplay = (type: PromptType): string => {
    const typeMap: Record<PromptType, string> = {
      check_in: 'Check In',
      birthday: 'Birthday',
      anniversary: 'Anniversary',
      follow_up: 'Follow Up',
      support: 'Support',
      celebrate: 'Celebrate',
      reconnect: 'Reconnect',
      activity_suggestion: 'Activity',
      gratitude: 'Gratitude',
      apologize: 'Apologize',
      share_update: 'Share Update',
      ask_advice: 'Ask Advice',
      offer_help: 'Offer Help',
      holiday_greeting: 'Holiday',
      milestone: 'Milestone',
      sympathy: 'Sympathy',
      congratulations: 'Congratulations',
      thinking_of_you: 'Thinking of You',
      custom: 'Custom',
      other: 'Other',
    };
    
    return typeMap[type] || 'Suggestion';
  };

  /**
   * Get urgency display text
   */
  const getUrgencyDisplay = (urgency: PromptUrgency): string => {
    switch (urgency) {
      case 'critical':
        return 'URGENT';
      case 'high':
        return 'High Priority';
      case 'medium':
        return 'Medium Priority';
      case 'low':
        return 'Low Priority';
      default:
        return '';
    }
  };

  /**
   * Handle accept action
   */
  const handleAccept = () => {
    if (onAccept) {
      onAccept(prompt);
    } else {
      // Default action - show success message
      Alert.alert(
        'Action Taken',
        'Great! This suggestion has been marked as completed.',
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Handle dismiss action
   */
  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss(prompt);
    } else {
      // Default action - confirm dismissal
      Alert.alert(
        'Dismiss Suggestion',
        'Are you sure you want to dismiss this suggestion?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Dismiss', style: 'destructive', onPress: () => {
            // Would update prompt status to dismissed
            console.log('Prompt dismissed:', prompt.id);
          }},
        ]
      );
    }
  };

  /**
   * Handle snooze action
   */
  const handleSnooze = () => {
    if (onSnooze) {
      onSnooze(prompt);
    } else {
      // Default action - show snooze options
      Alert.alert(
        'Snooze Suggestion',
        'When would you like to be reminded again?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: '1 Hour', onPress: () => console.log('Snoozed for 1 hour') },
          { text: '1 Day', onPress: () => console.log('Snoozed for 1 day') },
          { text: '1 Week', onPress: () => console.log('Snoozed for 1 week') },
        ]
      );
    }
  };

  /**
   * Handle view person action
   */
  const handleViewPerson = () => {
    if (onViewPerson) {
      onViewPerson(prompt.personId);
    }
  };

  /**
   * Check if prompt is expired
   */
  const isExpired = prompt.expiresAt && new Date() > prompt.expiresAt;

  /**
   * Check if prompt is high priority
   */
  const isHighPriority = prompt.urgency === 'critical' || prompt.urgency === 'high';

  return (
    <TouchableOpacity
      onPress={handleViewPerson}
      disabled={!onViewPerson}
      testID={testID}
      activeOpacity={0.7}
    >
      <GlassCard
        intensity={isHighPriority ? 'intense' : 'moderate'}
        elevated={true}
        bordered={true}
        style={[
          styles.card,
          compact && styles.compactCard,
          isExpired && styles.expiredCard,
          isHighPriority && styles.highPriorityCard,
        ]}
      >
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.typeSection}>
            <View style={styles.typeIndicator}>
              <GlassText
                variant="body"
                style={styles.typeIcon}
              >
                {getPromptTypeIcon(prompt.type)}
              </GlassText>
              
              <View style={styles.typeInfo}>
                <GlassText
                  variant={compact ? 'caption' : 'label'}
                  color="secondary"
                  weight="medium"
                >
                  {getPromptTypeDisplay(prompt.type)}
                </GlassText>
                
                {prompt.urgency !== 'low' && (
                  <GlassText
                    variant="caption"
                    style={[
                      styles.urgencyText,
                      { color: getUrgencyColor(prompt.urgency) },
                    ]}
                  >
                    {getUrgencyDisplay(prompt.urgency)}
                  </GlassText>
                )}
              </View>
            </View>
          </View>

          <View style={styles.metaSection}>
            <GlassText
              variant="caption"
              color="tertiary"
              style={styles.timeText}
            >
              {formatRelativeTime(prompt.createdAt)}
            </GlassText>
            
            {prompt.confidence && (
              <View style={styles.confidenceIndicator}>
                <GlassText
                  variant="caption"
                  color="tertiary"
                  style={styles.confidenceText}
                >
                  {Math.round(prompt.confidence * 100)}% confident
                </GlassText>
              </View>
            )}
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          <GlassText
            variant={compact ? 'body' : 'h3'}
            color="primary"
            weight="medium"
            style={styles.title}
          >
            {prompt.title}
          </GlassText>
          
          {!compact && prompt.description && (
            <GlassText
              variant="body"
              color="secondary"
              style={styles.description}
            >
              {prompt.description}
            </GlassText>
          )}

          <GlassText
            variant="body"
            color="primary"
            style={styles.suggestion}
          >
            {prompt.suggestion}
          </GlassText>

          {prompt.reasoning && !compact && (
            <GlassText
              variant="caption"
              color="tertiary"
              style={styles.reasoning}
            >
              💡 {prompt.reasoning}
            </GlassText>
          )}
        </View>

        {/* Actions Section */}
        {showActions && !compact && (
          <View style={styles.actionsSection}>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={handleAccept}
                style={[styles.actionButton, styles.acceptButton]}
                testID={`${testID}-accept-button`}
              >
                <GlassText
                  variant="caption"
                  color="white"
                  weight="medium"
                >
                  ✓ Do It
                </GlassText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSnooze}
                style={[styles.actionButton, styles.snoozeButton]}
                testID={`${testID}-snooze-button`}
              >
                <GlassText
                  variant="caption"
                  color="secondary"
                  weight="medium"
                >
                  ⏰ Later
                </GlassText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDismiss}
                style={[styles.actionButton, styles.dismissButton]}
                testID={`${testID}-dismiss-button`}
              >
                <GlassText
                  variant="caption"
                  color="tertiary"
                  weight="medium"
                >
                  ✕ Dismiss
                </GlassText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Expiry Warning */}
        {isExpired && (
          <View style={styles.expiredBanner}>
            <GlassText
              variant="caption"
              color="tertiary"
              style={styles.expiredText}
            >
              ⚠️ This suggestion has expired
            </GlassText>
          </View>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
};

/**
 * PromptCard Styles
 */
const styles = StyleSheet.create({
  card: {
    marginHorizontal: UI_CONSTANTS.SPACING.MD,
    marginVertical: UI_CONSTANTS.SPACING.SM,
  },

  compactCard: {
    paddingVertical: UI_CONSTANTS.SPACING.MD,
    marginVertical: UI_CONSTANTS.SPACING.XS,
  },

  expiredCard: {
    opacity: 0.7,
    borderColor: 'rgba(107, 114, 128, 0.3)',
  },

  highPriorityCard: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 2,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },

  typeSection: {
    flex: 1,
    marginRight: UI_CONSTANTS.SPACING.MD,
  },

  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  typeIcon: {
    fontSize: 20,
    marginRight: UI_CONSTANTS.SPACING.SM,
  },

  typeInfo: {
    flex: 1,
  },

  urgencyText: {
    marginTop: UI_CONSTANTS.SPACING.XS / 2,
    fontWeight: UI_CONSTANTS.TYPOGRAPHY.FONT_WEIGHTS.SEMIBOLD,
  },

  metaSection: {
    alignItems: 'flex-end',
  },

  timeText: {
    marginBottom: UI_CONSTANTS.SPACING.XS / 2,
  },

  confidenceIndicator: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.SM,
    paddingHorizontal: UI_CONSTANTS.SPACING.XS,
    paddingVertical: UI_CONSTANTS.SPACING.XS / 2,
  },

  confidenceText: {
    fontSize: 10,
  },

  contentSection: {
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },

  title: {
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },

  description: {
    marginBottom: UI_CONSTANTS.SPACING.SM,
    lineHeight: 20,
  },

  suggestion: {
    marginBottom: UI_CONSTANTS.SPACING.SM,
    lineHeight: 22,
    fontStyle: 'italic',
  },

  reasoning: {
    marginTop: UI_CONSTANTS.SPACING.SM,
    lineHeight: 16,
    fontStyle: 'italic',
  },

  actionsSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: UI_CONSTANTS.SPACING.MD,
  },

  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  actionButton: {
    flex: 1,
    paddingVertical: UI_CONSTANTS.SPACING.SM,
    paddingHorizontal: UI_CONSTANTS.SPACING.MD,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.SM,
    alignItems: 'center',
    marginHorizontal: UI_CONSTANTS.SPACING.XS,
    borderWidth: 1,
  },

  acceptButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },

  snoozeButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },

  dismissButton: {
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderColor: 'rgba(107, 114, 128, 0.2)',
  },

  expiredBanner: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(107, 114, 128, 0.8)',
    paddingHorizontal: UI_CONSTANTS.SPACING.SM,
    paddingVertical: UI_CONSTANTS.SPACING.XS,
    borderBottomLeftRadius: UI_CONSTANTS.BORDER_RADIUS.SM,
  },

  expiredText: {
    fontSize: 10,
  },
});

export default PromptCard;