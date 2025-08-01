# 01 – Domain Context: Relational Ecosystem Assistant

## 🌐 Domain Name  
**Relational Intelligence & Ecomap-Based Personal Context**

## 🧭 Domain Description

This application lives in the domain of **relational awareness**, **contextual memory**, and **intelligent relationship management**. It combines the logic of social maps, cognitive empathy, and temporal context to help people navigate their complex personal and professional networks in meaningful ways.

Rather than simply storing contacts or reminders, the system functions as a **dynamic, intelligent ecomap**—a live representation of the people, roles, institutions, and events in the user's social universe.

The app provides gentle reminders, visual context, and conversational cues to re-engage with key people at the right time. It avoids rigid scheduling or task-based logic and instead focuses on **relational momentum** and **contextual significance**.

## 🧩 Core Concepts

| Concept        | Description |
|----------------|-------------|
| **Person**     | Any individual the user interacts with: friends, family, doctors, coworkers, clients, etc. |
| **Relationship** | The qualitative link between people, including their role (mentor, friend, cousin), intensity, and history. |
| **Institution** | Organizations the user is involved with (e.g., universities, hospitals, companies). Often associated with one or more people. |
| **Moment**     | Significant events or updates (e.g., a birthday, surgery, job change, last meeting). |
| **Thread**     | A timeline of past and future interactions with a person or group, which feeds into memory and suggestion logic. |
| **Ecomap**     | A visual, interactive representation of people and their relational distance to the user. Inspired by social work, but reimagined with an iOS-style, minimal, glass-effect interface. |
| **Prompt**     | An AI-generated suggestion or reminder based on contextual cues, meant to feel like a caring nudge rather than an alarm. |
| **Memory Node** | A persistent, editable piece of contextual information (e.g. "Carlos has a cat named Simba" or "Ana's mom passed away in 2022"). |

## 🔁 Domain Lifecycle

The app operates in cycles of passive memory collection and proactive relational nudges:

1. **Capture**: The user logs or the AI extracts new moments (from chats, messages, notes).
2. **Contextualization**: These moments are linked to people and relationships.
3. **Visualization**: The ecomap and profile views are updated to reflect current relational status.
4. **Prompting**: The system generates soft reminders and suggestions based on recency, importance, and momentum.
5. **Reflection**: The user sees summaries and logs of who they've connected with, when, and how.
6. **Reinforcement**: The memory graph is updated to refine future nudges and deepen personalization.

## 📱 Example Use Cases

- "Remind me to check in with my friend who's going through chemo every 2 weeks."
- "Let me know when I haven't spoken to someone important for over 3 months."
- "Track which colleagues I've met with since starting this new job."
- "Show me which friends I've lost touch with over the last year."

## 🤝 Domain Boundaries

This app is not:
- A business-focused CRM (Customer Relationship Management tool), but rather a personal relationship assistant designed for empathy, memory, and meaningful connection
- A therapy or health-tracking app
- A traditional calendar or task manager

It is a **relational assistant** focused on **empathy, memory, and connection**—a digital ally for emotional intelligence.

## 📊 Knowledge Graph Variables

Key variables that would be tracked in the knowledge graph:

### Person Variables
- `personId`: Unique identifier
- `displayName`: How they prefer to be called
- `roles[]`: Array of roles (friend, colleague, family)
- `contactMethods[]`: Phone, email, social media handles
- `lastContactDate`: When we last spoke/met
- `relationshipIntensity`: Scale of 1-10 indicating closeness
- `institutionAffiliations[]`: Where they work/study/volunteer

### Relationship Variables
- `relationshipType`: friend, family, professional, mentor, etc.
- `connectionStrength`: How well connected we are
- `communicationFrequency`: How often we typically interact
- `sharedContext[]`: Common experiences, mutual friends, shared interests
- `relationshipHealth`: Current state of the relationship

### Moment Variables
- `momentType`: birthday, meeting, life_event, achievement, crisis
- `timestamp`: When it occurred or will occur
- `significance`: How important this moment is (1-10)
- `context`: Additional details about the moment
- `followUpRequired`: Whether this needs a response/action

### Institution Variables
- `institutionName`: Company, hospital, school, etc.
- `userRole`: How the user relates to this institution
- `associatedPeople[]`: People connected through this institution
- `activeStatus`: Whether user is currently involved

### Thread Variables
- `threadId`: Unique conversation/interaction timeline
- `participants[]`: Who's involved in this thread
- `lastUpdate`: Most recent interaction
- `threadType`: ongoing_conversation, project, life_event, etc.
- `priority`: How urgent/important this thread is

### Prompt Variables
- `promptType`: check_in, birthday_reminder, follow_up, reconnect
- `triggerConditions`: What caused this prompt to be generated
- `urgency`: How time-sensitive the prompt is
- `personalization`: Customized message based on relationship context