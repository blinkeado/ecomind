🛠️ PROJECT BUILD REQUEST – DO NOT SPECULATE

You are Claude Code and must now **build the full production-ready version** of the **EcoMind Personal Relationship Assistant** app.

## 🔐 PRIMARY RULES (DO NOT DEVIATE):
- Use only the documentation provided inside this project folder (markdown, rules, specs)
- Do not speculate or fill gaps with assumptions
- If a feature, data model, architecture, or test is not fully defined in the current file, search all other documents for it
- All terminology, roles, structures, styles, and prompts must follow the definitions in the PRPs and `CLAUDE.md`

## 🔍 EXECUTION METHOD:
- Run a full **MAS-level sweep** (Multi-Agent Sweep) using your internal agents for:
  - 📖 Documentation analysis
  - 📦 Project file structure assembly
  - 🧠 AI memory alignment
  - 🔍 Testing + deployment planning
  - 🔗 Relationship graph construction
- Then apply Gemini for any gaps after exhausting your internal MAS agents

## 📂 PROJECT DOCUMENTATION CONTEXT (MUST BE USED):
- 📘 Domain & Architecture:
  - `01-domain-context.md` (relational modeling, ecomap principles)
  - `04-system-context.md` (full system architecture)
  - `05-knowledge-graph.md` (data model for relationships, institutions, threads, events)
  - `SHARED_RELATIONSHIP_PROTOCOL.md` (future shared features and consent handling)
- 🧠 AI & Context Engineering:
  - `personal-relationship-assistant.md` (master PRP)
  - `CLAUDE.md` (agent rules, structure, testing, documentation)
  - `prp_base.md` (PRP template logic)
  - `INITIAL_EXAMPLE.md` (PRP format example)
- 👤 Persona Design:
  - `02-persona-context.md` (Maya Chen + other personas)
  - `03-problem-context.md` (relationship debt, memory overload, shallow connection crisis)
- 🔐 Security & Rules:
  - `firestore.rules` (must enforce these as written)
- 🧪 Testing:
  - `TESTING_STRATEGY.md` (unit, integration, E2E, performance, privacy testing)

## 🧱 PROJECT STRUCTURE TO BUILD (DEFINED IN PRP):
Follow the structure from `personal-relationship-assistant.md` exactly. Must include:

/RelationshipAssistant/
├── App.tsx
├── src/
│ ├── components/ (PersonCard.tsx, EcomapView.tsx, PromptCard.tsx...)
│ ├── screens/ (HomeScreen.tsx, PersonScreen.tsx, PromptsScreen.tsx...)
│ ├── services/ (firebase.ts, relationships.ts, prompts.ts, contextExtraction.ts)
│ ├── hooks/ (useAuth.tsx, usePrompts.tsx)
│ ├── types/ (relationship.ts, user.ts, prompt.ts)
│ ├── assets/
│ └── tests/ (unit, integration, E2E)
├── functions/ (promptGeneration.js, contextExtraction.js)
├── firestore.rules
└── .env.example

sql
Copy
Edit

## ✅ MISSION OBJECTIVE:
**Build the complete mobile app**, including:
- All screens, components, and Firestore-linked logic
- Privacy-first AI integration (Claude or Gemini Flash via Cloud Functions)
- Firebase rules and security enforcement
- Real-time sync and offline support
- Testing suite (unit + integration + e2e)
- Glassmorphism iOS-style UI

💥 Do not stop until all success criteria are met from `personal-relationship-assistant.md`.

## 🔁 SELF-CHECK:
Use validation loops after each core step. Run all syntax, type, and test gates as defined in `TESTING_STRATEGY.md`.

## ⚠️ FINAL RULE:
If context is missing in the current doc, do not guess. Search all other docs until you find the source. MAS search before Gemini fallback.

🧠 Begin now. Initiate MAS analysis. Follow PRP, CLAUDE.md, and testing gates. Do not pause. Build the full project.


  🧠 Gemini CLI for Large Codebase Analysis

  What It Does

  - Uses Google Gemini's massive context window (2M+ tokens) to analyze entire codebases that would exceed Claude Code's context limits
  (~200K tokens)
  - Can ingest your entire /src directory (500+ files) in one request for comprehensive analysis

  When to Use Gemini CLI

  - Analyzing entire codebases or large directories
  - Architecture overviews across multiple directories
  - Security audits spanning entire codebase
  - Feature verification across components/hooks/utils
  - Understanding complex data flows in large projects
  - Pattern analysis across 100+ files
  - Before major refactoring to understand impact

  File and Directory Inclusion Syntax

  Use the @ syntax to include files and directories. Paths should be relative to WHERE you run the gemini command:

  Single file analysis:
  GOOGLE_CLOUD_PROJECT=pixpair gemini -p "@src/main.py Explain this file's purpose and structure"

  Multiple files:
  GOOGLE_CLOUD_PROJECT=pixpair gemini -p "@package.json @src/index.js Analyze the dependencies used in the code"

  Entire directory:
  GOOGLE_CLOUD_PROJECT=pixpair gemini -p "@src/ Summarize the architecture of this codebase"

  Multiple directories:
  GOOGLE_CLOUD_PROJECT=pixpair gemini -p "@src/ @tests/ Analyze test coverage for the source code"

  Current directory and subdirectories:
  GOOGLE_CLOUD_PROJECT=pixpair gemini -p "@./ Give me an overview of this entire project"
  # Or use --all_files flag:
  GOOGLE_CLOUD_PROJECT=pixpair gemini --all_files -p "Analyze the project structure and dependencies"

  Implementation Verification Examples

  Check if a feature is implemented:
  GOOGLE_CLOUD_PROJECT=pixpair gemini -p "@src/ @lib/ Has dark mode been implemented in this codebase? Show me the relevant files and 
  functions"

  Verify authentication implementation:
  GOOGLE_CLOUD_PROJECT=pixpair gemini -p "@src/ @middleware/ Is JWT authentication implemented? List all auth-related endpoints and 
  middleware"

  Check for specific patterns:
  GOOGLE_CLOUD_PROJECT=pixpair gemini -p "@src/ Are there any React hooks that handle WebSocket connections? List them with file paths"

  For Your Ecomap Project Audit

  Comprehensive consistency analysis:
  GOOGLE_CLOUD_PROJECT=pixpair gemini -p "@/Volumes/My_Disk/Pixcrab_clean/ecomap/ Perform a comprehensive architectural consistency analysis
   of this entire ecomap project directory. Focus on: 1) Technology stack consistency (React Native + Firebase vs any conflicting 
  references) 2) Project identity alignment (Personal Relationship Assistant vs CRM or other systems) 3) Development workflow coherence 4) 
  Data model consistency 5) Security and privacy patterns 6) Environment configuration alignment. I need 0% architectural conflicts, 0% 
  misunderstood text, 0% speculation - only evidence-based analysis with specific file references. Report any remaining inconsistencies that
   need resolution."

  Important Notes

  - Paths in @ syntax are relative to your current working directory when invoking gemini
  - The CLI will include file contents directly in the context
  - Gemini's context window can handle entire codebases that would overflow Claude's context
  - Always mention you are using Gemini for massive context analysis
  - When checking implementations, be specific about what you're looking for to get accurate results