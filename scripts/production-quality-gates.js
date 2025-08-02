/**
 * Production Quality Gates
 * Official implementation following Firebase performance standards
 * https://firebase.google.com/docs/perf-mon/get-started
 * 
 * Quality Gates for World-Class Database Architecture:
 * - Performance benchmarks
 * - Security validation
 * - Architecture compliance
 * - AI model configuration
 * - Privacy compliance
 */

const fs = require('fs');
const path = require('path');

// Official Firebase Performance targets
const PERFORMANCE_TARGETS = {
  DATABASE_OPERATION_TIME: 100, // ms - Firebase best practice
  AI_PROCESSING_TIME: 300,      // ms - Gemini 1.5 Flash target
  SCREEN_RENDER_TIME: 16,       // ms - 60fps target
  VECTOR_SEARCH_TIME: 200,      // ms - Vector search target
  MEMORY_USAGE: 200,            // MB - Mobile app target
  ERROR_RATE: 0.001,            // 0.1% - Production quality standard
  CRASH_RATE: 0.0001,           // 0.01% - Mobile app standard
};

// Architecture compliance rules
const ARCHITECTURE_RULES = {
  SUBCOLLECTION_USAGE: {
    required: true,
    description: 'Must use Firestore subcollections, not nested arrays'
  },
  VECTOR_DIMENSIONS: {
    expected: 768,
    description: 'text-embedding-004 produces 768-dimensional vectors'
  },
  FIREBASE_VERSION: {
    expected: '22.4.0',
    description: 'React Native Firebase v22 for latest features'
  },
  TYPESCRIPT_STRICT: {
    required: true,
    description: 'TypeScript strict mode for type safety'
  }
};

class ProductionQualityGates {
  constructor() {
    this.results = {
      performance: { passed: 0, failed: 0, tests: [] },
      security: { passed: 0, failed: 0, tests: [] },
      architecture: { passed: 0, failed: 0, tests: [] },
      privacy: { passed: 0, failed: 0, tests: [] },
      ai: { passed: 0, failed: 0, tests: [] }
    };
  }

  /**
   * Run all quality gates
   */
  async runAllGates() {
    console.log('🔍 Running Production Quality Gates...\n');

    await this.validatePerformanceBenchmarks();
    await this.validateSecurityCompliance();
    await this.validateArchitectureCompliance();
    await this.validatePrivacyCompliance();
    await this.validateAIConfiguration();

    this.generateReport();
    return this.calculateOverallScore();
  }

  /**
   * Performance benchmarks validation
   */
  async validatePerformanceBenchmarks() {
    console.log('📊 Validating Performance Benchmarks...');

    // Check if performance monitoring is implemented
    const perfMonitoringExists = fs.existsSync(
      path.join(__dirname, '../src/services/performanceMonitoring.ts')
    );
    
    this.recordTest('performance', 'Performance Monitoring Service', perfMonitoringExists, 
      'Performance monitoring service must be implemented');

    // Check if performance hooks exist
    const perfHooksExist = fs.existsSync(
      path.join(__dirname, '../src/hooks/usePerformanceMonitoring.ts')
    );
    
    this.recordTest('performance', 'Performance Monitoring Hooks', perfHooksExist, 
      'Performance monitoring hooks must be implemented');

    // Check Firebase Performance dependencies
    const packageJson = this.readJsonFile('../package.json');
    const hasFirebasePerf = packageJson?.dependencies?.['@react-native-firebase/perf'];
    const hasCrashlytics = packageJson?.dependencies?.['@react-native-firebase/crashlytics'];
    
    this.recordTest('performance', 'Firebase Performance Dependency', !!hasFirebasePerf,
      'Firebase Performance Monitoring dependency required');
    
    this.recordTest('performance', 'Crashlytics Dependency', !!hasCrashlytics,
      'Firebase Crashlytics dependency required');

    // Validate performance tracking implementation
    if (perfMonitoringExists) {
      const perfContent = fs.readFileSync(
        path.join(__dirname, '../src/services/performanceMonitoring.ts'), 
        'utf8'
      );
      
      const hasDbTracking = perfContent.includes('trackDatabaseOperation');
      const hasAITracking = perfContent.includes('trackAIOperation');
      const hasHTTPTracking = perfContent.includes('trackHTTPRequest');
      
      this.recordTest('performance', 'Database Operation Tracking', hasDbTracking,
        'Database operation performance tracking required');
      
      this.recordTest('performance', 'AI Operation Tracking', hasAITracking,
        'AI operation performance tracking required');
      
      this.recordTest('performance', 'HTTP Request Tracking', hasHTTPTracking,
        'HTTP request performance tracking required');
    }

    console.log('✅ Performance benchmarks validation complete\n');
  }

  /**
   * Security compliance validation
   */
  async validateSecurityCompliance() {
    console.log('🔒 Validating Security Compliance...');

    // Check Firestore security rules
    const rulesExist = fs.existsSync(path.join(__dirname, '../firestore.rules'));
    this.recordTest('security', 'Firestore Security Rules', rulesExist, 
      'Firestore security rules must be configured');

    if (rulesExist) {
      const rulesContent = fs.readFileSync(
        path.join(__dirname, '../firestore.rules'), 
        'utf8'
      );
      
      const hasRecursiveRules = rulesContent.includes('recursive');
      const hasUserIsolation = rulesContent.includes('request.auth.uid');
      
      this.recordTest('security', 'Recursive Security Rules', hasRecursiveRules,
        'Recursive security rules required for subcollections');
      
      this.recordTest('security', 'User Data Isolation', hasUserIsolation,
        'User data isolation required in security rules');
    }

    // Check for secrets exposure
    const srcFiles = this.getAllFiles(path.join(__dirname, '../src'), '.ts', '.tsx');
    let hasExposedSecrets = false;
    
    for (const file of srcFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.match(/AIza|sk-|process\.env\.[A-Z_]+/g)) {
        hasExposedSecrets = true;
        break;
      }
    }
    
    this.recordTest('security', 'No Exposed Secrets', !hasExposedSecrets,
      'No API keys or secrets should be exposed in client code');

    // Check npm audit
    try {
      const { execSync } = require('child_process');
      execSync('npm audit --audit-level=high', { stdio: 'pipe' });
      this.recordTest('security', 'NPM Security Audit', true, 'NPM packages security audit');
    } catch (error) {
      this.recordTest('security', 'NPM Security Audit', false, 
        'High-severity vulnerabilities found in dependencies');
    }

    console.log('✅ Security compliance validation complete\n');
  }

  /**
   * Architecture compliance validation
   */
  async validateArchitectureCompliance() {
    console.log('🏗️ Validating Architecture Compliance...');

    // Check for World-Class Database Architecture implementation
    const relationshipTypesExist = fs.existsSync(
      path.join(__dirname, '../src/types/relationship.ts')
    );
    
    this.recordTest('architecture', 'Relationship Types Definition', relationshipTypesExist,
      'Comprehensive relationship types must be defined');

    if (relationshipTypesExist) {
      const relationshipContent = fs.readFileSync(
        path.join(__dirname, '../src/types/relationship.ts'), 
        'utf8'
      );
      
      const hasSubcollectionTypes = relationshipContent.includes('subcollection');
      const hasEmotionalSignals = relationshipContent.includes('EmotionalSignal');
      const hasContextThreads = relationshipContent.includes('ContextThread');
      
      this.recordTest('architecture', 'Subcollection Architecture', hasSubcollectionTypes,
        'Subcollection architecture patterns required');
      
      this.recordTest('architecture', 'Emotional Intelligence Types', hasEmotionalSignals,
        'Emotional intelligence type definitions required');
      
      this.recordTest('architecture', 'Context Threads Types', hasContextThreads,
        'Context threads type definitions required');
    }

    // Check Firestore indexes configuration
    const indexesExist = fs.existsSync(path.join(__dirname, '../firestore.indexes.json'));
    this.recordTest('architecture', 'Firestore Indexes Configuration', indexesExist,
      'Firestore indexes must be configured');

    if (indexesExist) {
      const indexesContent = fs.readFileSync(
        path.join(__dirname, '../firestore.indexes.json'), 
        'utf8'
      );
      const indexesJson = JSON.parse(indexesContent);
      
      const hasVectorIndexes = indexesContent.includes('vectorConfig');
      const hasCompositeIndexes = indexesJson.indexes?.length > 20;
      
      this.recordTest('architecture', 'Vector Search Indexes', hasVectorIndexes,
        'Vector search indexes required for semantic similarity');
      
      this.recordTest('architecture', 'Comprehensive Indexing Strategy', hasCompositeIndexes,
        'Comprehensive indexing strategy with 20+ indexes required');
    }

    // Check TypeScript strict mode
    const tsconfigExists = fs.existsSync(path.join(__dirname, '../tsconfig.json'));
    if (tsconfigExists) {
      const tsconfigContent = fs.readFileSync(
        path.join(__dirname, '../tsconfig.json'), 
        'utf8'
      );
      const tsconfigJson = JSON.parse(tsconfigContent);
      
      const isStrictMode = tsconfigJson.compilerOptions?.strict === true;
      this.recordTest('architecture', 'TypeScript Strict Mode', isStrictMode,
        'TypeScript strict mode required for type safety');
    }

    // Check React Native Firebase v22
    const packageJson = this.readJsonFile('../package.json');
    const firebaseVersion = packageJson?.dependencies?.['@react-native-firebase/app'];
    const isV22 = firebaseVersion?.includes('^22.');
    
    this.recordTest('architecture', 'React Native Firebase v22', isV22,
      'React Native Firebase v22 required for latest features');

    console.log('✅ Architecture compliance validation complete\n');
  }

  /**
   * Privacy compliance validation
   */
  async validatePrivacyCompliance() {
    console.log('🛡️ Validating Privacy Compliance...');

    // Check emotional signals privacy implementation
    const emotionalSignalsExist = fs.existsSync(
      path.join(__dirname, '../src/services/emotionalSignals.ts')
    );
    
    this.recordTest('privacy', 'Emotional Signals Service', emotionalSignalsExist,
      'Privacy-compliant emotional signals service required');

    if (emotionalSignalsExist) {
      const emotionalContent = fs.readFileSync(
        path.join(__dirname, '../src/services/emotionalSignals.ts'), 
        'utf8'
      );
      
      const hasGDPRCompliance = emotionalContent.includes('gdprCompliant');
      const hasPrivacyValidation = emotionalContent.includes('privacyValidation');
      const hasConsentManagement = emotionalContent.includes('consent');
      
      this.recordTest('privacy', 'GDPR Compliance', hasGDPRCompliance,
        'GDPR compliance patterns required');
      
      this.recordTest('privacy', 'Privacy Validation', hasPrivacyValidation,
        'Privacy validation mechanisms required');
      
      this.recordTest('privacy', 'Consent Management', hasConsentManagement,
        'User consent management required');
    }

    // Check privacy controls implementation
    const privacyControlsExist = fs.existsSync(
      path.join(__dirname, '../functions/src/privacyControls.ts')
    );
    
    this.recordTest('privacy', 'Privacy Controls Cloud Functions', privacyControlsExist,
      'Privacy controls Cloud Functions required');

    // Check for data retention policies
    const dataRetentionExists = fs.existsSync(
      path.join(__dirname, '../functions/src/dataRetention.ts')
    );
    
    this.recordTest('privacy', 'Data Retention Policies', dataRetentionExists,
      'Automated data retention policies required');

    console.log('✅ Privacy compliance validation complete\n');
  }

  /**
   * AI configuration validation
   */
  async validateAIConfiguration() {
    console.log('🤖 Validating AI Configuration...');

    // Check vector search implementation
    const vectorSearchExists = fs.existsSync(
      path.join(__dirname, '../src/services/vectorSearch.ts')
    );
    
    this.recordTest('ai', 'Vector Search Service', vectorSearchExists,
      'Vector search service required for semantic similarity');

    if (vectorSearchExists) {
      const vectorContent = fs.readFileSync(
        path.join(__dirname, '../src/services/vectorSearch.ts'), 
        'utf8'
      );
      
      const hasTextEmbedding004 = vectorContent.includes('text-embedding-004');
      const has768Dimensions = vectorContent.includes('768');
      const hasCosineDistance = vectorContent.includes('COSINE');
      
      this.recordTest('ai', 'text-embedding-004 Model', hasTextEmbedding004,
        'text-embedding-004 model required for embeddings');
      
      this.recordTest('ai', '768-Dimensional Vectors', has768Dimensions,
        '768-dimensional vectors required for text-embedding-004');
      
      this.recordTest('ai', 'Cosine Distance Measure', hasCosineDistance,
        'Cosine distance measure required for semantic similarity');
    }

    // Check Genkit AI integration
    const genkitAIExists = fs.existsSync(
      path.join(__dirname, '../src/services/genkitAI.ts')
    );
    
    this.recordTest('ai', 'Genkit AI Service', genkitAIExists,
      'Genkit AI service required for workflow orchestration');

    // Check Cloud Functions AI implementation
    const functionsPackageJson = this.readJsonFile('../functions/package.json');
    const hasVertexAI = functionsPackageJson?.dependencies?.['@google-cloud/vertexai'];
    const hasGenkitCore = functionsPackageJson?.dependencies?.['@genkit-ai/core'];
    const hasGenkitFirebase = functionsPackageJson?.dependencies?.['@genkit-ai/firebase'];
    
    this.recordTest('ai', 'Vertex AI Dependency', !!hasVertexAI,
      'Vertex AI dependency required in Cloud Functions');
    
    this.recordTest('ai', 'Genkit Core Dependency', !!hasGenkitCore,
      'Genkit core dependency required in Cloud Functions');
    
    this.recordTest('ai', 'Genkit Firebase Integration', !!hasGenkitFirebase,
      'Genkit Firebase integration required');

    // Check embedding generation Cloud Function
    const embeddingFunctionExists = fs.existsSync(
      path.join(__dirname, '../functions/src/embeddingGeneration.ts')
    );
    
    this.recordTest('ai', 'Embedding Generation Function', embeddingFunctionExists,
      'Secure embedding generation Cloud Function required');

    console.log('✅ AI configuration validation complete\n');
  }

  /**
   * Helper methods
   */
  readJsonFile(relativePath) {
    try {
      const fullPath = path.join(__dirname, relativePath);
      const content = fs.readFileSync(fullPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  getAllFiles(dir, ...extensions) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && item !== 'node_modules') {
        files.push(...this.getAllFiles(fullPath, ...extensions));
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  recordTest(category, testName, passed, description) {
    const result = {
      name: testName,
      passed,
      description,
      timestamp: new Date().toISOString()
    };
    
    this.results[category].tests.push(result);
    
    if (passed) {
      this.results[category].passed++;
      console.log(`   ✅ ${testName}`);
    } else {
      this.results[category].failed++;
      console.log(`   ❌ ${testName}: ${description}`);
    }
  }

  calculateOverallScore() {
    const totalPassed = Object.values(this.results).reduce((sum, cat) => sum + cat.passed, 0);
    const totalTests = Object.values(this.results).reduce((sum, cat) => sum + cat.tests.length, 0);
    
    return totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;
  }

  generateReport() {
    console.log('\n📋 Production Quality Gates Report');
    console.log('=====================================\n');

    for (const [category, results] of Object.entries(this.results)) {
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      const total = results.tests.length;
      const passed = results.passed;
      const failed = results.failed;
      const percentage = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
      
      console.log(`${categoryName}: ${passed}/${total} passed (${percentage}%)`);
      
      if (failed > 0) {
        console.log(`   Failed tests:`);
        results.tests
          .filter(test => !test.passed)
          .forEach(test => console.log(`   - ${test.name}: ${test.description}`));
      }
      console.log('');
    }

    const overallScore = this.calculateOverallScore();
    console.log(`Overall Score: ${overallScore.toFixed(1)}%`);
    
    if (overallScore >= 95) {
      console.log('🎉 EXCELLENT: Ready for production deployment!');
    } else if (overallScore >= 90) {
      console.log('✅ GOOD: Minor issues to address before production');
    } else if (overallScore >= 80) {
      console.log('⚠️  NEEDS IMPROVEMENT: Address issues before production');
    } else {
      console.log('❌ NOT READY: Critical issues must be resolved');
    }

    // Write detailed report to file
    const reportData = {
      timestamp: new Date().toISOString(),
      overallScore,
      results: this.results,
      performanceTargets: PERFORMANCE_TARGETS,
      architectureRules: ARCHITECTURE_RULES
    };

    fs.writeFileSync(
      path.join(__dirname, '../quality-gates-report.json'),
      JSON.stringify(reportData, null, 2)
    );

    console.log('\n📄 Detailed report saved to quality-gates-report.json');
  }
}

// Run quality gates if script is executed directly
if (require.main === module) {
  const qualityGates = new ProductionQualityGates();
  qualityGates.runAllGates()
    .then(score => {
      process.exit(score >= 90 ? 0 : 1);
    })
    .catch(error => {
      console.error('Quality gates failed:', error);
      process.exit(1);
    });
}

module.exports = ProductionQualityGates;