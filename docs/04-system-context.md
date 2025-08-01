# 04 – System Context: Intelligent Relationship Memory Architecture

## 🏗️ System Overview

The **Ecomap Relationship Assistant** functions as an **intelligent, contextual memory system** that captures, processes, and surfaces relationship information to help users maintain meaningful connections. The system operates on **React Native** with **Firebase backend** and optional **AI integration** for contextual intelligence.

## 📡 Input Sources & Data Capture

### **Primary Input Channels**

#### 1. **Manual Entry Interface**
- **Natural language note-taking**: "Had coffee with Sarah, she mentioned her mom's surgery next week"
- **Quick interaction logging**: Simple swipe/tap interfaces for "just talked to X"
- **Voice-to-text capture**: Hands-free logging while commuting or walking
- **Structured forms**: For important moments like birthdays, job changes, health updates

#### 2. **Communication Platform Integration**
- **Text message parsing**: Extract context from iMessage, WhatsApp, SMS
- **Email analysis**: Important personal and professional correspondence
- **Calendar integration**: Meeting participants, event context, recurring celebrations
- **Social media monitoring**: LinkedIn updates, Facebook events, Instagram stories

#### 3. **AI-Assisted Context Extraction**
- **Conversation summarization**: Using Gemini Flash or Claude to extract key relationship insights
- **Sentiment analysis**: Understanding emotional context of interactions
- **Entity recognition**: Automatically identifying people, places, events, and relationships
- **Pattern recognition**: Detecting relationship health and communication frequency changes

#### 4. **Passive Behavioral Signals**
- **Contact frequency analysis**: How often users interact with different people
- **Communication channel preferences**: Text vs. email vs. calls for different relationships
- **Response time patterns**: Understanding relationship priorities through behavior
- **Location-based context**: If permission granted, associating places with relationship contexts

## 🧠 Contextual Intelligence Engine

### **Real-Time Processing Pipeline**

#### **Stage 1: Data Ingestion**
```typescript
interface IncomingData {
  source: 'manual' | 'communication' | 'calendar' | 'social' | 'passive';
  rawContent: string;
  timestamp: Date;
  userId: string;
  metadata: {
    platform?: string;
    participants?: string[];
    location?: Coordinates;
    communicationType?: 'call' | 'text' | 'email' | 'meeting' | 'social';
  };
}
```

#### **Stage 2: AI Context Extraction**
- **Entity Detection**: People, organizations, events, dates, locations
- **Relationship Mapping**: Who is connected to whom and how
- **Emotional Context**: Sentiment, urgency, importance indicators
- **Temporal Context**: Past references, future plans, deadlines

#### **Stage 3: Knowledge Graph Integration**
- **Node Creation/Updates**: Person profiles, relationship edges, event nodes
- **Pattern Recognition**: Communication frequency, relationship strength changes
- **Conflict Resolution**: Handling contradictory or outdated information
- **Privacy Filtering**: Ensuring sensitive information is appropriately protected

### **Memory Architecture**

#### **Hierarchical Context Storage**
```typescript
interface PersonNode {
  personId: string;
  profile: {
    displayName: string;
    aliases: string[];
    roles: RelationshipRole[];
    contactMethods: ContactMethod[];
    preferredCommunication: CommunicationType;
  };
  relationships: {
    toUser: RelationshipEdge;
    toOthers: RelationshipEdge[];
  };
  timeline: {
    interactions: Interaction[];
    lifeEvents: LifeEvent[];
    importantDates: ImportantDate[];
  };
  context: {
    interests: string[];
    currentSituation: ContextNode[];
    conversationThreads: Thread[];
    sharedExperiences: Experience[];
  };
  metadata: {
    lastContact: Date;
    relationshipHealth: number; // 1-10 scale
    priority: 'high' | 'medium' | 'low';
    privacyLevel: PrivacyLevel;
  };
}
```

## 🔄 Contextual Triggers & Prompting System

### **Trigger Categories**

#### **1. Temporal Triggers**
- **Birthday/Anniversary Reminders**: 1 week, 3 days, day-of notifications
- **Follow-up Prompts**: "It's been 2 weeks since Sarah's surgery, might be good to check in"
- **Stale Relationship Alerts**: "You haven't connected with Marcus in 3 months"
- **Seasonal Prompts**: Holiday check-ins, back-to-school connections, vacation follow-ups

#### **2. Contextual Event Triggers**
- **Life Event Responses**: Job changes, moves, health issues, family events
- **Conversation Thread Continuity**: Remembering to follow up on mentioned plans or concerns
- **Mutual Connection Triggers**: When friends interact with each other
- **Location-Based Prompts**: "You're near David's office, want to grab coffee?"

#### **3. Emotional Intelligence Triggers**
- **Support Opportunity Detection**: When someone needs extra attention during difficult times
- **Celebration Amplification**: Ensuring important achievements get acknowledged
- **Relationship Balance Monitoring**: Detecting one-sided communication patterns
- **Stress Response Triggers**: Providing gentle prompts during user's busy periods

### **Prompt Generation System**

#### **Intelligent Nudge Creation**
```typescript
interface RelationshipPrompt {
  promptId: string;
  personId: string;
  type: 'check_in' | 'birthday' | 'follow_up' | 'support' | 'celebrate' | 'reconnect';
  urgency: 'low' | 'medium' | 'high';
  context: {
    reason: string; // Why this prompt was generated
    lastInteraction: Date;
    relevantEvents: LifeEvent[];
    suggestedApproach: CommunicationType;
    conversationStarters: string[];
  };
  timing: {
    createdAt: Date;
    optimalTime: Date; // When to surface this prompt
    expiresAt: Date; // When this prompt becomes irrelevant
  };
  personalization: {
    relationshipContext: string;
    sharedMemories: string[];
    currentTopics: string[];
    communicationStyle: string;
  };
}
```

## 📱 Firebase Integration Architecture

### **Authentication & User Management**
- **Firebase Auth**: Email/password, Google, Apple Sign-In integration
- **User Profile Management**: Preferences, notification settings, privacy controls
- **Multi-device Synchronization**: Seamless experience across phone, tablet, web

### **Real-time Database Structure**
```
users/
  {userId}/
    profile/
      displayName: string
      preferences: UserPreferences
      createdAt: timestamp
    
    relationships/
      {personId}/
        profile: PersonProfile
        interactions: Interaction[]
        context: ContextNode[]
        metadata: RelationshipMetadata
    
    prompts/
      active/
        {promptId}: RelationshipPrompt
      dismissed/
        {promptId}: DismissedPrompt
      completed/
        {promptId}: CompletedPrompt
    
    timeline/
      {eventId}: TimelineEvent
    
    settings/
      notifications: NotificationSettings
      privacy: PrivacySettings
      ai: AISettings
```

### **Cloud Functions for Server-Side Intelligence**
- **Prompt Generation**: Scheduled functions that analyze relationship data and create prompts
- **AI Integration**: Secure handling of sensitive relationship data with external AI services
- **Data Processing**: Background processing of communication data for context extraction
- **Notification Delivery**: Intelligent batching and timing of push notifications

## 🔐 Privacy & Security Architecture

### **Data Protection Principles**
- **User Data Ownership**: Users control all their relationship data completely
- **Granular Privacy Controls**: Different privacy levels for different relationships
- **Local Processing First**: AI analysis happens locally when possible
- **Encrypted Storage**: All sensitive relationship data encrypted at rest
- **Minimal Data Sharing**: External AI services only receive anonymized, necessary context

### **Privacy Implementation**
```typescript
interface PrivacyLevel {
  level: 'public' | 'friends' | 'close_friends' | 'private' | 'confidential';
  permissions: {
    canViewProfile: boolean;
    canSeeInteractions: boolean;
    canReceivePrompts: boolean;
    canShareWithAI: boolean;
    canExportData: boolean;
  };
}
```

## 🎯 Success Metrics & Analytics

### **Relationship Health Indicators**
- **Contact Frequency**: Tracking communication patterns over time
- **Response Rates**: How often relationship prompts lead to actual interactions
- **Context Accuracy**: User validation of AI-extracted context and suggestions
- **Relationship Satisfaction**: Periodic user surveys about relationship quality

### **System Performance Metrics**
- **Prompt Relevance**: Percentage of prompts marked as helpful vs. dismissed
- **Context Extraction Accuracy**: How often AI correctly identifies important relationship information
- **User Engagement**: Daily/weekly app usage patterns and feature adoption
- **Privacy Compliance**: Zero incidents of unauthorized data access or sharing

This system architecture creates a **privacy-focused, intelligent relationship memory** that enhances human connection without feeling invasive or transactional.