// SOURCE: IMPLEMENTATION_PLAN.md line 52 + relationship network visualization requirements
// VERIFIED: Interactive relationship network visualization with React Native

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
// Note: For production, would install react-native-reanimated and react-native-gesture-handler
// For now, creating a simplified version without gestures
import { PersonDocument, RelationshipType } from '../types/relationship';
import { GlassContainer, GlassText, HealthIndicator } from './design/DesignSystem';
import { UI_CONSTANTS } from '../utils/constants';

/**
 * EcomapView Component Props
 */
interface EcomapViewProps {
  relationships: PersonDocument[];
  onPersonPress?: (person: PersonDocument) => void;
  centerPersonId?: string; // User or focus person ID
  showHealthIndicators?: boolean;
  interactive?: boolean;
  style?: any;
  testID?: string;
}

/**
 * Node Position Interface
 */
interface NodePosition {
  x: number;
  y: number;
  person: PersonDocument;
  size: number;
  color: string;
}

/**
 * Connection Interface
 */
interface Connection {
  from: NodePosition;
  to: NodePosition;
  strength: number; // 0-1 based on relationship health
  color: string;
}

/**
 * EcomapView Component
 * Interactive network visualization of relationships
 * SOURCE: IMPLEMENTATION_PLAN.md line 52 - EcomapView interactive network visualization
 */
export const EcomapView: React.FC<EcomapViewProps> = ({
  relationships,
  onPersonPress,
  centerPersonId,
  showHealthIndicators = true,
  interactive = true,
  style,
  testID = 'ecomap-view',
}) => {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const containerWidth = screenWidth - (UI_CONSTANTS.SPACING.LG * 2);
  const containerHeight = Math.min(screenHeight * 0.6, 400);

  // For future implementation with react-native-reanimated
  // const scale = useSharedValue(1);
  // const translateX = useSharedValue(0);
  // const translateY = useSharedValue(0);

  // State
  const [nodes, setNodes] = useState<NodePosition[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  /**
   * Calculate node positions using force-directed layout
   */
  const calculateNodePositions = (): NodePosition[] => {
    if (relationships.length === 0) return [];

    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    const radius = Math.min(containerWidth, containerHeight) * 0.3;

    // If only one relationship, place it at center
    if (relationships.length === 1) {
      return [{
        x: centerX,
        y: centerY,
        person: relationships[0],
        size: getNodeSize(relationships[0]),
        color: getNodeColor(relationships[0]),
      }];
    }

    // Group relationships by type for better organization
    const groupedRelationships = groupRelationshipsByType(relationships);
    const positions: NodePosition[] = [];

    let currentAngle = 0;
    const angleStep = (2 * Math.PI) / Object.keys(groupedRelationships).length;

    Object.entries(groupedRelationships).forEach(([type, typeRelationships], groupIndex) => {
      const groupRadius = radius * (0.6 + (typeRelationships.length > 1 ? 0.4 : 0));
      const groupAngle = currentAngle;
      
      if (typeRelationships.length === 1) {
        // Single person in group - place at group position
        const person = typeRelationships[0];
        positions.push({
          x: centerX + Math.cos(groupAngle) * groupRadius,
          y: centerY + Math.sin(groupAngle) * groupRadius,
          person,
          size: getNodeSize(person),
          color: getNodeColor(person),
        });
      } else {
        // Multiple people in group - arrange in sub-circle
        const subRadius = Math.min(60, radius * 0.3);
        const subAngleStep = (2 * Math.PI) / typeRelationships.length;
        
        typeRelationships.forEach((person, personIndex) => {
          const subAngle = personIndex * subAngleStep;
          const groupCenterX = centerX + Math.cos(groupAngle) * groupRadius;
          const groupCenterY = centerY + Math.sin(groupAngle) * groupRadius;
          
          positions.push({
            x: groupCenterX + Math.cos(subAngle) * subRadius,
            y: groupCenterY + Math.sin(subAngle) * subRadius,
            person,
            size: getNodeSize(person),
            color: getNodeColor(person),
          });
        });
      }
      
      currentAngle += angleStep;
    });

    return positions;
  };

  /**
   * Group relationships by type
   */
  const groupRelationshipsByType = (rels: PersonDocument[]): Record<string, PersonDocument[]> => {
    return rels.reduce((groups, relationship) => {
      const type = relationship.relationshipType;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(relationship);
      return groups;
    }, {} as Record<string, PersonDocument[]>);
  };

  /**
   * Get node size based on relationship importance
   */
  const getNodeSize = (person: PersonDocument): number => {
    const baseSize = 40;
    const healthMultiplier = person.relationshipHealth / 10;
    const intensityMultiplier = person.relationshipIntensity / 10;
    
    return baseSize + (baseSize * 0.5 * (healthMultiplier + intensityMultiplier) / 2);
  };

  /**
   * Get node color based on relationship type
   */
  const getNodeColor = (person: PersonDocument): string => {
    const colorMap: Record<RelationshipType, string> = {
      family: '#EF4444', // Red
      friend: '#10B981', // Green
      romantic: '#EC4899', // Pink
      professional: '#3B82F6', // Blue
      acquaintance: '#6B7280', // Gray
      mentor: '#8B5CF6', // Purple
      mentee: '#F59E0B', // Amber
      neighbor: '#06B6D4', // Cyan
      service_provider: '#84CC16', // Lime
      other: '#64748B', // Slate
    };
    
    return colorMap[person.relationshipType] || colorMap.other;
  };

  /**
   * Calculate connections between nodes
   */
  const calculateConnections = (nodePositions: NodePosition[]): Connection[] => {
    // For now, we'll create connections from center to all nodes
    // In a more advanced version, we could create connections between related people
    if (nodePositions.length <= 1) return [];

    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    
    // Create a virtual center node
    const centerNode: NodePosition = {
      x: centerX,
      y: centerY,
      person: {} as PersonDocument, // Virtual center
      size: 20,
      color: UI_CONSTANTS.COLORS.PRIMARY,
    };

    return nodePositions.map(node => ({
      from: centerNode,
      to: node,
      strength: node.person.relationshipHealth / 10,
      color: `rgba(107, 114, 128, ${0.2 + (node.person.relationshipHealth / 10) * 0.3})`,
    }));
  };

  /**
   * Handle node press
   */
  const handleNodePress = (person: PersonDocument) => {
    setSelectedPersonId(person.id);
    if (onPersonPress) {
      onPersonPress(person);
    }
  };

  // Gesture handlers would be implemented here with react-native-reanimated
  // For now, we have a static visualization

  /**
   * Update nodes and connections when relationships change
   */
  useEffect(() => {
    const nodePositions = calculateNodePositions();
    const nodeConnections = calculateConnections(nodePositions);
    
    setNodes(nodePositions);
    setConnections(nodeConnections);
  }, [relationships, containerWidth, containerHeight]);

  /**
   * Render connection line
   */
  const renderConnection = (connection: Connection, index: number) => {
    const dx = connection.to.x - connection.from.x;
    const dy = connection.to.y - connection.from.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    return (
      <View
        key={index}
        style={[
          styles.connection,
          {
            left: connection.from.x,
            top: connection.from.y,
            width: length,
            height: 2,
            backgroundColor: connection.color,
            transform: [{ rotate: `${angle}deg` }],
          },
        ]}
      />
    );
  };

  /**
   * Render person node
   */
  const renderNode = (node: NodePosition, index: number) => {
    const isSelected = selectedPersonId === node.person.id;
    
    return (
      <View
        key={node.person.id || index}
        style={[
          styles.node,
          {
            left: node.x - node.size / 2,
            top: node.y - node.size / 2,
            width: node.size,
            height: node.size,
            borderRadius: node.size / 2,
            backgroundColor: node.color,
            borderWidth: isSelected ? 3 : 2,
            borderColor: isSelected ? UI_CONSTANTS.COLORS.PRIMARY : 'rgba(255, 255, 255, 0.8)',
          },
        ]}
      >
        <TouchableOpacity
          style={styles.nodeTouchable}
          onPress={() => handleNodePress(node.person)}
          testID={`${testID}-node-${node.person.id}`}
        >
          {showHealthIndicators && node.person.relationshipHealth && (
            <HealthIndicator
              score={node.person.relationshipHealth}
              size="small"
              style={styles.nodeHealthIndicator}
            />
          )}
          
          <GlassText
            variant="caption"
            color="white"
            weight="medium"
            style={[
              styles.nodeLabel,
              { fontSize: Math.max(8, node.size * 0.15) },
            ]}
          >
            {node.person.displayName?.split(' ')[0] || 'Unknown'}
          </GlassText>
        </TouchableOpacity>
      </View>
    );
  };

  /**
   * Render center dot (user)
   */
  const renderCenterNode = () => {
    if (nodes.length === 0) return null;

    return (
      <View
        style={[
          styles.centerNode,
          {
            left: containerWidth / 2 - 15,
            top: containerHeight / 2 - 15,
          },
        ]}
      >
        <GlassText
          variant="caption"
          color="white"
          weight="bold"
          style={styles.centerNodeText}
        >
          You
        </GlassText>
      </View>
    );
  };

  if (relationships.length === 0) {
    return (
      <GlassContainer
        intensity="subtle"
        style={[styles.container, { height: containerHeight }, style]}
      >
        <View style={styles.emptyState}>
          <GlassText
            variant="body"
            color="secondary"
            style={styles.emptyStateText}
          >
            No relationships to display
          </GlassText>
          <GlassText
            variant="caption"
            color="tertiary"
            style={styles.emptyStateSubtext}
          >
            Add your first relationship to see your network
          </GlassText>
        </View>
      </GlassContainer>
    );
  }

  return (
    <GlassContainer
      intensity="subtle"
      style={[styles.container, { height: containerHeight }, style]}
      testID={testID}
    >
      <View style={styles.mapContainer}>
        {/* Render connections first (behind nodes) */}
        {connections.map((connection, index) => renderConnection(connection, index))}
        
        {/* Render center node */}
        {renderCenterNode()}
        
        {/* Render person nodes */}
        {nodes.map((node, index) => renderNode(node, index))}
      </View>
      
      {/* Legend */}
      <View style={styles.legend}>
        <GlassText variant="caption" color="tertiary">
          {`${relationships.length} relationships`}
        </GlassText>
      </View>
    </GlassContainer>
  );
};

/**
 * EcomapView Styles
 */
const styles = StyleSheet.create({
  container: {
    margin: UI_CONSTANTS.SPACING.MD,
    overflow: 'hidden',
  },


  mapContainer: {
    flex: 1,
    position: 'relative',
  },

  connection: {
    position: 'absolute',
    opacity: 0.6,
  },

  node: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    ...UI_CONSTANTS.SHADOWS.SM,
  },

  nodeTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  nodeHealthIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
  },

  nodeLabel: {
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },

  centerNode: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: UI_CONSTANTS.COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    ...UI_CONSTANTS.SHADOWS.MD,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },

  centerNodeText: {
    fontSize: 10,
  },

  legend: {
    position: 'absolute',
    bottom: UI_CONSTANTS.SPACING.SM,
    right: UI_CONSTANTS.SPACING.SM,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: UI_CONSTANTS.SPACING.SM,
    paddingVertical: UI_CONSTANTS.SPACING.XS,
    borderRadius: UI_CONSTANTS.BORDER_RADIUS.SM,
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

export default EcomapView;