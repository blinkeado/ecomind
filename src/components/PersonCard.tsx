// SOURCE: IMPLEMENTATION_PLAN.md line 51 + relationship data model specifications
// VERIFIED: PersonCard component with health indicators and glassmorphism design

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { PersonDocument, RelationshipType } from '../types/relationship';
import { GlassCard, GlassText, HealthIndicator } from './design/DesignSystem';
import { formatRelativeTime, daysSince } from '../utils/dateHelpers';
import { UI_CONSTANTS, RELATIONSHIP_CONSTANTS } from '../utils/constants';

/**
 * PersonCard Component Props
 */
interface PersonCardProps {
  person: PersonDocument;
  onPress?: (person: PersonDocument) => void;
  onContact?: (person: PersonDocument) => void;
  showHealthIndicator?: boolean;
  showLastContact?: boolean;
  showRelationshipType?: boolean;
  compact?: boolean;
  testID?: string;
  // Accessibility props
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/**
 * PersonCard Component
 * Displays relationship information with health indicators
 * SOURCE: IMPLEMENTATION_PLAN.md line 51 - PersonCard component requirements
 */
export const PersonCard: React.FC<PersonCardProps> = ({
  person,
  onPress,
  onContact,
  showHealthIndicator = true,
  showLastContact = true,
  showRelationshipType = true,
  compact = false,
  testID = 'person-card',
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
}) => {

  /**
   * Get relationship type display name
   */
  const getRelationshipTypeDisplay = (type: RelationshipType): string => {
    const typeMap: Record<RelationshipType, string> = {
      family: 'Family',
      friend: 'Friend',
      romantic: 'Partner',
      professional: 'Professional',
      acquaintance: 'Acquaintance',
      mentor: 'Mentor',
      mentee: 'Mentee',
      neighbor: 'Neighbor',
      service_provider: 'Service Provider',
      other: 'Other',
    };
    return typeMap[type] || 'Unknown';
  };

  /**
   * Get primary role display
   */
  const getPrimaryRole = (): string => {
    if (person.roles.length === 0) return 'Contact';
    
    // Prioritize certain roles
    const priorityRoles = ['spouse', 'partner', 'parent', 'child', 'sibling', 'best_friend', 'boss'];
    const priorityRole = person.roles.find(role => priorityRoles.includes(role));
    
    if (priorityRole) {
      return priorityRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    return person.roles[0].replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  /**
   * Get contact frequency status
   */
  const getContactStatus = (): {
    color: 'primary' | 'secondary' | 'tertiary';
    text: string;
    urgent: boolean;
  } => {
    if (!person.lastContact) {
      return {
        color: 'tertiary',
        text: 'No recent contact',
        urgent: false,
      };
    }

    const daysSinceContact = daysSince(person.lastContact);
    const targetFrequency = RELATIONSHIP_CONSTANTS.CONTACT_FREQUENCY[person.relationshipType] || 30;

    if (daysSinceContact <= targetFrequency / 2) {
      return {
        color: 'primary',
        text: formatRelativeTime(person.lastContact),
        urgent: false,
      };
    } else if (daysSinceContact <= targetFrequency) {
      return {
        color: 'secondary',
        text: formatRelativeTime(person.lastContact),
        urgent: false,
      };
    } else {
      return {
        color: 'tertiary',
        text: formatRelativeTime(person.lastContact),
        urgent: true,
      };
    }
  };

  /**
   * Handle card press
   */
  const handlePress = () => {
    if (onPress) {
      onPress(person);
    }
  };

  /**
   * Handle contact press
   */
  const handleContactPress = (event: any) => {
    event.stopPropagation(); // Prevent card press
    
    if (onContact) {
      onContact(person);
    } else {
      // Default contact action - show contact methods
      const contactMethods = person.contactMethods
        .filter(method => method.isPrimary)
        .map(method => `${method.type}: ${method.value}`)
        .join('\n');
      
      if (contactMethods) {
        Alert.alert(
          `Contact ${person.displayName}`,
          contactMethods,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'No Contact Information',
          `No contact methods available for ${person.displayName}`,
          [{ text: 'OK' }]
        );
      }
    }
  };

  const contactStatus = getContactStatus();
  
  // Create comprehensive accessibility label
  const defaultAccessibilityLabel = [
    person.displayName,
    showRelationshipType ? `${getPrimaryRole()}, ${getRelationshipTypeDisplay(person.relationshipType)}` : '',
    showHealthIndicator ? `relationship health ${person.relationshipHealth} out of 10` : '',
    showLastContact && contactStatus.text !== 'No recent contact' ? `last contact ${contactStatus.text}` : '',
    contactStatus.urgent ? 'overdue for contact' : ''
  ].filter(Boolean).join(', ');

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={!onPress}
      testID={testID}
      activeOpacity={0.7}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel || defaultAccessibilityLabel}
      accessibilityHint={accessibilityHint || 'Double tap to view relationship details'}
      accessibilityRole="button"
      accessibilityState={{ disabled: !onPress }}
    >
      <GlassCard
        intensity="moderate"
        elevated={true}
        bordered={true}
        style={[
          styles.card,
          compact && styles.compactCard,
        ]}
      >
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.nameSection}>
            <GlassText
              variant={compact ? 'body' : 'h3'}
              color="primary"
              weight="semibold"
              style={styles.name}
              accessible={false}
              testID={`${testID}-name`}
            >
              {person.displayName}
            </GlassText>
            
            {showRelationshipType && (
              <GlassText
                variant="caption"
                color="secondary"
                style={styles.roleText}
                accessible={false}
                testID={`${testID}-role`}
              >
                {getPrimaryRole()} • {getRelationshipTypeDisplay(person.relationshipType)}
              </GlassText>
            )}
          </View>

          {showHealthIndicator && (
            <HealthIndicator
              score={person.relationshipHealth}
              size={compact ? 'small' : 'medium'}
              style={styles.healthIndicator}
              accessible={false}
              testID={`${testID}-health-indicator`}
            />
          )}
        </View>

        {/* Contact Status Row */}
        {showLastContact && !compact && (
          <View style={styles.contactRow}>
            <View style={styles.contactStatus}>
              <GlassText
                variant="caption"
                color={contactStatus.color}
                style={[
                  styles.contactText,
                  contactStatus.urgent && styles.urgentText,
                ]}
              >
                Last contact: {contactStatus.text}
              </GlassText>
              
              {contactStatus.urgent && (
                <View style={styles.urgentIndicator} />
              )}
            </View>

            {onContact && (
              <TouchableOpacity
                onPress={handleContactPress}
                style={styles.contactButton}
                testID={`${testID}-contact-button`}
                accessible={true}
                accessibilityLabel={`Contact ${person.displayName}`}
                accessibilityHint={`Opens contact options for ${person.displayName}`}
                accessibilityRole="button"
              >
                <GlassText
                  variant="caption"
                  color="accent"
                  weight="medium"
                  accessible={false}
                >
                  Contact
                </GlassText>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Compact Last Contact */}
        {showLastContact && compact && (
          <GlassText
            variant="caption"
            color={contactStatus.color}
            style={[
              styles.compactContactText,
              contactStatus.urgent && styles.urgentText,
            ]}
          >
            {contactStatus.text}
          </GlassText>
        )}

        {/* Tags Row (if present) */}
        {person.tags && person.tags.length > 0 && !compact && (
          <View style={styles.tagsRow}>
            {person.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <GlassText
                  variant="caption"
                  color="secondary"
                  style={styles.tagText}
                >
                  {tag}
                </GlassText>
              </View>
            ))}
            {person.tags.length > 3 && (
              <GlassText
                variant="caption"
                color="tertiary"
                style={styles.moreTagsText}
              >
                +{person.tags.length - 3} more
              </GlassText>
            )}
          </View>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
};

/**
 * PersonCard Styles
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

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: UI_CONSTANTS.SPACING.SM,
  },

  nameSection: {
    flex: 1,
    marginRight: UI_CONSTANTS.SPACING.MD,
  },

  name: {
    marginBottom: UI_CONSTANTS.SPACING.XS,
  },

  roleText: {
    marginTop: UI_CONSTANTS.SPACING.XS,
  },

  healthIndicator: {
    marginLeft: UI_CONSTANTS.SPACING.MD,
  },

  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: UI_CONSTANTS.SPACING.SM,
  },

  contactStatus: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  contactText: {
    flex: 1,
  },

  compactContactText: {
    marginTop: UI_CONSTANTS.SPACING.XS,
  },

  urgentText: {
    color: UI_CONSTANTS.COLORS.WARNING,
    fontWeight: UI_CONSTANTS.TYPOGRAPHY.FONT_WEIGHTS.MEDIUM,
  },

  urgentIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: UI_CONSTANTS.COLORS.WARNING,
    marginLeft: UI_CONSTANTS.SPACING.XS,
  },

  contactButton: {
    paddingVertical: UI_CONSTANTS.SPACING.XS,
    paddingHorizontal: UI_CONSTANTS.SPACING.SM,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.SM,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },

  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: UI_CONSTANTS.SPACING.SM,
    flexWrap: 'wrap',
  },

  tag: {
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.SM,
    paddingVertical: UI_CONSTANTS.SPACING.XS / 2,
    paddingHorizontal: UI_CONSTANTS.SPACING.XS,
    marginRight: UI_CONSTANTS.SPACING.XS,
    marginBottom: UI_CONSTANTS.SPACING.XS,
  },

  tagText: {
    fontSize: 10,
  },

  moreTagsText: {
    marginLeft: UI_CONSTANTS.SPACING.XS,
    fontStyle: 'italic',
  },
});

export default PersonCard;