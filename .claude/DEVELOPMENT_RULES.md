# 🔒 EVIDENCE-BASED DEVELOPMENT RULES

## ⚠️ CRITICAL MANDATE: NO SPECULATIVE CODE

**ALL CODE EDITS AND ADDITIONS MUST BE JUSTIFIED BY ONE OF:**

### ✅ **Acceptable Evidence Sources:**
1. **Official Documentation**
   - React Native official docs
   - Firebase official documentation
   - TypeScript official documentation
   - Platform-specific docs (iOS/Android)

2. **MCP (Managed Component Platform) Verified**
   - MCP-validated best practices
   - Verified component patterns
   - Established architecture patterns

3. **CLI Output Evidence**
   - `npx` command results
   - `firebase` CLI guidance
   - `npm`/`yarn` package information
   - `pod` installation requirements
   - Build tool outputs

4. **Gemini CLI Analysis**
   - Results from project documentation analysis
   - System context analysis
   - Implementation plan guidance

### ❌ **PROHIBITED:**
- Speculation about APIs or functionality
- Assumptions about library behavior
- "Best practice" without documentation source
- Personal coding preferences without evidence
- Unverified patterns or architectures

## 📋 **Implementation Validation Process:**

### Before Every Code Change:
1. ✅ **Source Check**: Identify specific documentation or evidence
2. ✅ **Verification**: Confirm pattern matches official guidance
3. ✅ **Documentation**: Record evidence source in code comments
4. ✅ **Testing**: Verify functionality works as documented

### Code Comment Requirements:
```typescript
// SOURCE: Firebase Auth Docs - Google Sign-In implementation
// URL: https://firebase.google.com/docs/auth/web/google-signin
// VERIFIED: MCP validation 2025-08-01
const signInWithGoogle = async () => {
  // Implementation based on official Firebase documentation
};
```

## 🎯 **Project-Specific Evidence Sources:**

### Primary Documentation:
- `/IMPLEMENTATION_PLAN.md` - Project architecture and file structure
- `/PRPs/personal-relationship-assistant.md` - Feature requirements
- `/04-system-context.md` - System architecture specifications
- `/05-knowledge-graph.md` - Data model specifications
- `/TESTING_STRATEGY.md` - Testing requirements
- `/firestore.rules` - Security implementation

### Secondary Sources:
- React Native 0.79.5 documentation
- Firebase SDK version 22.4.0 documentation
- TypeScript 5.0.4 documentation
- Platform-specific implementation guides

## 🚫 **Enforcement:**
- Any code without evidence source will be rejected
- All implementations must reference official documentation
- Speculative features are prohibited
- Evidence must be current and version-specific

**Last Updated**: August 1, 2025  
**Project**: EcoMind Personal Relationship Assistant  
**Enforcement Level**: CRITICAL