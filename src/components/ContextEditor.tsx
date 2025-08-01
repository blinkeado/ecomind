// SOURCE: IMPLEMENTATION_PLAN.md line 55 + context editing requirements
// VERIFIED: ContextEditor component for memory and note editing with glassmorphism

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Keyboard } from 'react-native';
import { GlassCard, GlassText, GlassInput, GlassButton } from './design/DesignSystem';
import { UI_CONSTANTS } from '../utils/constants';

/**
 * Context Editor Component Props
 */
interface ContextEditorProps {
  initialContent?: string;
  placeholder?: string;
  title?: string;
  maxLength?: number;
  onSave?: (content: string) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  multiline?: boolean;
  showCharacterCount?: boolean;
  saveable?: boolean;
  style?: any;
  testID?: string;
}

/**
 * ContextEditor Component
 * Editable text input for memories and notes
 * SOURCE: IMPLEMENTATION_PLAN.md line 55 - ContextEditor for memory and note editing
 */
export const ContextEditor: React.FC<ContextEditorProps> = ({
  initialContent = '',
  placeholder = 'Add your thoughts, memories, or notes...',
  title = 'Edit Context',
  maxLength = 2000,
  onSave,
  onCancel,
  autoFocus = false,
  multiline = true,
  showCharacterCount = true,
  saveable = true,
  style,
  testID = 'context-editor',
}) => {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  /**
   * Track changes
   */
  useEffect(() => {
    setHasChanges(content !== initialContent);
  }, [content, initialContent]);

  /**
   * Handle save action
   */
  const handleSave = async () => {
    if (!hasChanges) {
      if (onCancel) onCancel();
      return;
    }

    if (content.trim().length === 0) {
      Alert.alert(
        'Empty Content',
        'Please add some content before saving.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsSaving(true);
    Keyboard.dismiss();

    try {
      if (onSave) {
        await onSave(content.trim());
      }
      
      // Success feedback
      Alert.alert(
        'Saved',
        'Your changes have been saved successfully.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Context Editor Save Error:', error);
      Alert.alert(
        'Save Failed',
        'Unable to save your changes. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle cancel action
   */
  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => {
              setContent(initialContent);
              if (onCancel) onCancel();
            }
          },
        ]
      );
    } else {
      if (onCancel) onCancel();
    }
  };

  /**
   * Handle content change
   */
  const handleContentChange = (newContent: string) => {
    if (newContent.length <= maxLength) {
      setContent(newContent);
    }
  };

  /**
   * Get character count color
   */
  const getCharacterCountColor = (): 'primary' | 'secondary' | 'tertiary' => {
    const percentage = content.length / maxLength;
    if (percentage >= 0.9) return 'primary'; // Red warning
    if (percentage >= 0.75) return 'secondary'; // Yellow warning
    return 'tertiary'; // Normal gray
  };

  /**
   * Get save button variant
   */
  const getSaveButtonVariant = (): 'primary' | 'secondary' => {
    return hasChanges ? 'primary' : 'secondary';
  };

  return (
    <GlassCard
      intensity="moderate"
      elevated={true}
      bordered={true}
      style={[styles.container, style]}
    >
      {/* Header */}
      <View style={styles.header}>
        <GlassText
          variant="h3"
          color="primary"
          weight="semibold"
          style={styles.title}
        >
          {title}
        </GlassText>

        {showCharacterCount && (
          <GlassText
            variant="caption"
            color={getCharacterCountColor()}
            style={styles.characterCount}
          >
            {content.length}/{maxLength}
          </GlassText>
        )}
      </View>

      {/* Content Input */}
      <View style={styles.inputContainer}>
        <GlassInput
          placeholder={placeholder}
          value={content}
          onChangeText={handleContentChange}
          multiline={multiline}
          style={[
            styles.textInput,
            multiline && styles.multilineInput,
          ]}
          // autoFocus={autoFocus} // Commented out to prevent issues
          testID={`${testID}-input`}
        />
      </View>

      {/* Helper Text */}
      <View style={styles.helperContainer}>
        <GlassText
          variant="caption"
          color="tertiary"
          style={styles.helperText}
        >
          💡 Add memories, important details, or notes about your relationship
        </GlassText>
      </View>

      {/* Action Buttons */}
      {saveable && (
        <View style={styles.actionsContainer}>
          <View style={styles.actionButtons}>
            {onCancel && (
              <GlassButton
                variant="secondary"
                onPress={handleCancel}
                style={styles.actionButton}
                testID={`${testID}-cancel-button`}
              >
                <GlassText
                  variant="body"
                  color="secondary"
                  weight="medium"
                >
                  Cancel
                </GlassText>
              </GlassButton>
            )}

            <GlassButton
              variant={getSaveButtonVariant()}
              onPress={handleSave}
              disabled={isSaving}
              style={[
                styles.actionButton,
                styles.saveButton,
              ]}
              testID={`${testID}-save-button`}
            >
              <GlassText
                variant="body"
                color={hasChanges ? "white" : "secondary"}
                weight="medium"
              >
                {isSaving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
              </GlassText>
            </GlassButton>
          </View>
        </View>
      )}

      {/* Changes Indicator */}
      {hasChanges && (
        <View style={styles.changesIndicator}>
          <View style={styles.changesDot} />
          <GlassText
            variant="caption"
            color="accent"
            style={styles.changesText}
          >
            Unsaved changes
          </GlassText>
        </View>
      )}
    </GlassCard>
  );
};

/**
 * Compact Context Editor
 * Smaller version for inline editing
 */
interface CompactContextEditorProps extends Omit<ContextEditorProps, 'title' | 'saveable'> {
  onBlur?: () => void;
}

export const CompactContextEditor: React.FC<CompactContextEditorProps> = ({
  initialContent = '',
  placeholder = 'Add a note...',
  maxLength = 500,
  onSave,
  onBlur,
  multiline = false,
  showCharacterCount = false,
  style,
  testID = 'compact-context-editor',
  ...props
}) => {
  const [content, setContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);

  /**
   * Handle focus
   */
  const handleFocus = () => {
    setIsEditing(true);
  };

  /**
   * Handle blur with auto-save
   */
  const handleBlur = () => {
    setIsEditing(false);
    
    if (content !== initialContent && onSave) {
      onSave(content.trim());
    }
    
    if (onBlur) {
      onBlur();
    }
  };

  /**
   * Handle content change
   */
  const handleContentChange = (newContent: string) => {
    if (newContent.length <= maxLength) {
      setContent(newContent);
    }
  };

  return (
    <View style={[styles.compactContainer, style]}>
      <GlassInput
        placeholder={placeholder}
        value={content}
        onChangeText={handleContentChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        multiline={multiline}
        style={[
          styles.compactInput,
          isEditing && styles.compactInputFocused,
        ]}
        testID={`${testID}-input`}
        {...props}
      />

      {showCharacterCount && isEditing && (
        <GlassText
          variant="caption"
          color="tertiary"
          style={styles.compactCharacterCount}
        >
          {content.length}/{maxLength}
        </GlassText>
      )}
    </View>
  );
};

/**
 * ContextEditor Styles
 */
const styles = StyleSheet.create({
  container: {
    margin: UI_CONSTANTS.SPACING.MD,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },

  title: {
    flex: 1,
  },

  characterCount: {
    marginLeft: UI_CONSTANTS.SPACING.MD,
  },

  inputContainer: {
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },

  textInput: {
    minHeight: 44,
  },

  multilineInput: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: UI_CONSTANTS.SPACING.MD,
  },

  helperContainer: {
    marginBottom: UI_CONSTANTS.SPACING.MD,
  },

  helperText: {
    lineHeight: 16,
    fontStyle: 'italic',
  },

  actionsContainer: {
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
    marginHorizontal: UI_CONSTANTS.SPACING.XS,
  },

  saveButton: {
    marginLeft: UI_CONSTANTS.SPACING.SM,
  },

  changesIndicator: {
    position: 'absolute',
    top: UI_CONSTANTS.SPACING.SM,
    right: UI_CONSTANTS.SPACING.SM,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.SM,
    paddingHorizontal: UI_CONSTANTS.SPACING.SM,
    paddingVertical: UI_CONSTANTS.SPACING.XS,
  },

  changesDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    marginRight: UI_CONSTANTS.SPACING.XS,
  },

  changesText: {
    fontSize: 10,
  },

  // Compact Editor Styles
  compactContainer: {
    position: 'relative',
  },

  compactInput: {
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.SM,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  compactInputFocused: {
    borderColor: UI_CONSTANTS.COLORS.PRIMARY,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },

  compactCharacterCount: {
    position: 'absolute',
    bottom: UI_CONSTANTS.SPACING.XS,
    right: UI_CONSTANTS.SPACING.SM,
    fontSize: 10,
  },
});

export default ContextEditor;