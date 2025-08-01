# 05 – Knowledge Graph: Dynamic Relationship Memory Structure

## 🕸️ Graph Architecture Overview

The **Ecomap Knowledge Graph** represents the user's relational world as a **living, interconnected network** of people, institutions, events, and contextual information. Unlike static contact lists, this graph evolves continuously, capturing relationship dynamics, temporal patterns, and contextual significance.

## 🎯 Core Graph Entities

### **1. Person Nodes**
**The primary entities representing individuals in the user's network.**

```typescript
interface PersonNode {
  // Identity
  personId: string;
  displayName: string;
  aliases: string[]; // Nicknames, maiden names, professional names
  
  // Contact Information
  contactMethods: {
    phone?: string[];
    email?: string[];
    social?: SocialHandle[];
    address?: Address[];
  };
  
  // Relationship Context
  roles: RelationshipRole[]; // friend, colleague, family, mentor, etc.
  relationshipIntensity: number; // 1-10 scale of closeness
  relationshipHistory: {
    metAt: Date;
    context: string; // "college roommates", "introduced by Sarah"
    relationship Evolution: RelationshipChange[];
  };
  
  // Personal Context
  personalDetails: {
    birthday?: Date;
    interests: string[];
    personality Traits: string[];
    currentSituation: LifeContext[];
  };
  
  // Professional Context
  professionalInfo: {
    currentRole?: string;
    company?: string;
    industry?: string;
    careerHistory: ProfessionalEvent[];
  };
  
  // Communication Preferences
  preferredCommunication: CommunicationType;
  responsePatterns: {
    averageResponseTime: number;
    preferredContactTimes: TimeWindow[];
    communicationStyle: 'formal' | 'casual' | 'emotive' | 'factual';
  };
  
  // Temporal Data
  lastContact: {
    date: Date;
    method: CommunicationType;
    context: string;
    quality: 'brief' | 'meaningful' | 'deep';
  };
  
  // Graph Metadata
  createdAt: Date;
  lastUpdated: Date;
  dataQuality: number; // Confidence in the information accuracy
  privacyLevel: PrivacyLevel;
}
```

### **2. Institution Nodes**
**Organizations that provide relationship context and connection opportunities.**

```typescript
interface InstitutionNode {
  institutionId: string;
  name: string;
  type: 'company' | 'school' | 'hospital' | 'club' | 'place_of_worship' | 'gym' | 'other';
  
  // Relationship to User
  userAffiliation: {
    role: string; // employee, alumni, member, patient, etc.
    startDate: Date;
    endDate?: Date;
    status: 'current' | 'former' | 'prospective';
  };
  
  // Connected People
  associatedPeople: {
    personId: string;
    relationship: string; // colleague, classmate, fellow member
    connectionContext: string;
  }[];
  
  // Institutional Context
  location?: Address;
  size?: 'small' | 'medium' | 'large' | 'enterprise';
  culture?: string[]; // tags describing institutional culture
  
  // Events and Memories
  sharedExperiences: Event[];
  importantDates: ImportantDate[];
}
```

### **3. Event Nodes**
**Significant moments that create relationship context and memory anchors.**

```typescript
interface EventNode {
  eventId: string;
  title: string;
  type: 'birthday' | 'wedding' | 'graduation' | 'job_change' | 'health_event' | 
        'celebration' | 'crisis' | 'travel' | 'meeting' | 'social_gathering';
  
  // Temporal Context
  date: Date;
  duration?: number; // minutes
  recurrence?: RecurrencePattern;
  
  // Participants
  primaryPerson?: string; // whose birthday, wedding, etc.
  participants: string[]; // personIds of attendees/involved people
  
  // Event Context
  description: string;
  location?: Address | string;
  significance: number; // 1-10 importance scale
  emotionalTone: 'positive' | 'negative' | 'neutral' | 'mixed';
  
  // Relationship Impact
  relationshipChanges: {
    personId: string;
    impactType: 'strengthened' | 'weakened' | 'new_connection' | 'context_shift';
    details: string;
  }[];
  
  // Follow-up Context
  requiresFollowUp: boolean;
  followUpActions: FollowUpAction[];
  relatedEvents: string[]; // eventIds of connected events
}
```

### **4. Thread Nodes**
**Ongoing conversation and interaction timelines that span multiple touchpoints.**

```typescript
interface ThreadNode {
  threadId: string;
  title: string; // "Sarah's job search", "Planning Jake's birthday"
  type: 'ongoing_conversation' | 'project_collaboration' | 'life_situation' | 
        'shared_interest' | 'support_thread';
  
  // Participants
  primaryParticipants: string[]; // main people involved
  secondaryParticipants: string[]; // occasionally involved
  
  // Thread Timeline
  startDate: Date;
  lastActivity: Date;
  expectedDuration?: number; // days
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  
  // Content and Context
  summary: string;
  keyTopics: string[];
  importantDetails: string[];
  decisions: Decision[];
  
  // Interactions within Thread
  interactions: {
    date: Date;
    method: CommunicationType;
    participants: string[];
    summary: string;
    emotionalContext: string;
    actionItems: ActionItem[];
  }[];
  
  // Future Context
  nextSteps: string[];
  upcomingMilestones: Milestone[];
  requiredFollowUp: FollowUpAction[];
}
```

## 🔗 Relationship Edges

### **Person-to-Person Relationships**
```typescript
interface RelationshipEdge {
  fromPersonId: string;
  toPersonId: string;
  
  // Relationship Characteristics
  relationshipType: 'family' | 'friend' | 'romantic' | 'professional' | 'mentor' | 'acquaintance';
  intensity: number; // 1-10 closeness scale
  direction: 'bidirectional' | 'one_way_strong' | 'one_way_weak';
  
  // Relationship History
  connectionDate: Date;
  connectionContext: string;
  relationshipMilestones: RelationshipMilestone[];
  
  // Interaction Patterns
  communicationFrequency: {
    averageDaysBetweenContact: number;
    lastContact: Date;
    contactMethods: CommunicationType[];
    initiationPattern: 'user_initiates' | 'other_initiates' | 'balanced';
  };
  
  // Mutual Context
  sharedExperiences: string[]; // eventIds
  mutualConnections: string[]; // other personIds both know
  sharedInstitutions: string[]; // institutionIds
  sharedInterests: string[];
  
  // Relationship Health
  healthScore: number; // 1-10 relationship satisfaction
  lastHealthCheck: Date;
  concernFlags: string[]; // "communication_gap", "conflict", "life_transition"
  
  // Privacy and Boundaries
  publicVisibility: boolean;
  shareLevel: 'open' | 'selective' | 'private';
  boundaries: string[]; // topics to avoid, communication preferences
}
```

### **Person-to-Institution Connections**
```typescript
interface InstitutionConnection {
  personId: string;
  institutionId: string;
  
  role: string;
  startDate: Date;
  endDate?: Date;
  status: 'current' | 'former' | 'prospective';
  
  significance: number; // How important this connection is
  context: string; // Additional details about the connection
  
  // Relationship Context through Institution
  connectionsMade: string[]; // personIds met through this institution
  opportunitiesCreated: string[]; // eventIds or threadIds that emerged
}
```

## 📊 Dynamic Graph Properties

### **Temporal Decay and Refresh**
```typescript
interface TemporalProperties {
  // Information Freshness
  lastVerified: Date;
  verificationMethod: 'user_confirmed' | 'interaction_based' | 'external_update';
  confidence: number; // 0-1 scale of information accuracy
  
  // Relationship Momentum
  interactionTrend: 'increasing' | 'stable' | 'decreasing' | 'stagnant';
  lastMomentumChange: Date;
  
  // Predictive Context
  nextExpectedContact: Date;
  contactProbability: number; // likelihood of contact in next 30 days
  relationshipTrajectory: 'strengthening' | 'maintaining' | 'weakening' | 'uncertain';
}
```

### **Graph Analytics and Insights**
```typescript
interface GraphAnalytics {
  // Network Statistics
  totalConnections: number;
  activeConnections: number; // contacted in last 90 days
  strongConnections: number; // intensity > 7
  professionalConnections: number;
  personalConnections: number;
  
  // Relationship Distribution
  connectionsByCategory: Record<RelationshipType, number>;
  connectionsByInstitution: Record<string, number>;
  geographicDistribution: Record<string, number>;
  
  // Communication Patterns
  averageContactFrequency: number;
  preferredCommunicationMethods: Record<CommunicationType, number>;
  initiationBalance: number; // -1 (always others initiate) to 1 (always user initiates)
  
  // Relationship Health
  overallNetworkHealth: number; // 1-10 scale
  relationshipsNeedingAttention: string[]; // personIds
  strongSupportNetwork: string[]; // personIds of closest connections
  
  // Temporal Insights
  relationshipGrowthRate: number; // new connections per month
  relationshipRetentionRate: number; // percentage maintained over time
  seasonalPatterns: SeasonalPattern[];
}
```

## 🎯 Graph Operations and Queries

### **Common Query Patterns**
```typescript
// Relationship Discovery
findMutualConnections(personId1: string, personId2: string): Person[]
findPeopleByInstitution(institutionId: string): Person[]
findPeopleByInterest(interest: string): Person[]

// Temporal Queries
getPeopleNotContactedSince(date: Date): Person[]
getUpcomingBirthdays(days: number): Person[]
getRecentlyUpdatedProfiles(hours: number): Person[]

// Relationship Health
getRelationshipsNeedingAttention(): RelationshipEdge[]
getStrongestConnections(limit: number): Person[]
getDecayingRelationships(): RelationshipEdge[]

// Context Queries
getActiveThreads(): Thread[]
getPeopleInLifeTransition(): Person[]
getSharedExperiences(personId: string): Event[]

// Predictive Queries
suggestReconnections(): Person[]
predictRelationshipChanges(): RelationshipPrediction[]
recommendNewConnections(): ConnectionSuggestion[]
```

### **Graph Maintenance Operations**
```typescript
// Data Quality
validateNodeConsistency(): ValidationReport
reconcileConflictingData(): DataReconciliation
updateConfidenceScores(): void
pruneStaleInformation(): void

// Relationship Evolution
detectRelationshipChanges(): RelationshipChange[]
updateRelationshipIntensity(): void
trackCommunicationPatterns(): void
identifyEmergingThreads(): Thread[]

// Privacy and Security
anonymizeForAI(): AnonymizedGraph
applyPrivacySettings(): void
auditDataAccess(): AccessAuditLog
exportUserData(): UserDataExport
```

## 🔮 AI-Enhanced Graph Features

### **Intelligent Pattern Recognition**
- **Relationship Strength Prediction**: ML models that predict relationship trajectory based on communication patterns
- **Context Extraction**: AI that automatically identifies important relationship context from conversations
- **Event Significance Detection**: Systems that recognize when casual mentions indicate important life events
- **Network Effect Analysis**: Understanding how relationships influence each other within the graph

### **Proactive Relationship Insights**
- **Optimal Contact Timing**: AI-suggested best times to reach out to specific people
- **Conversation Starters**: Context-aware suggestions based on recent developments
- **Relationship Investment Strategy**: Recommendations for maintaining relationship balance
- **Network Growth Opportunities**: Suggestions for valuable new connections based on existing network

This knowledge graph structure creates a **living, intelligent map** of the user's relational world that grows more valuable and accurate over time, enabling truly personalized relationship assistance.