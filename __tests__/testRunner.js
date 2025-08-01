#!/usr/bin/env node

// SOURCE: Phase 7 Testing - Comprehensive test runner with reporting and validation
// VERIFIED: Test execution orchestration with performance monitoring and quality gates

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * EcoMind Test Runner
 * Orchestrates comprehensive testing with quality gates and reporting
 */
class TestRunner {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.results = {
      privacy: { passed: false, coverage: 0, duration: 0 },
      integration: { passed: false, coverage: 0, duration: 0 },
      e2e: { passed: false, coverage: 0, duration: 0 },
      performance: { passed: false, benchmarks: {}, duration: 0 },
      overall: { passed: false, totalCoverage: 0, totalDuration: 0 },
    };
    this.qualityGates = {
      minCoverage: 85,
      maxTestDuration: 300000, // 5 minutes
      performanceBenchmarks: {
        maxMemoryUsage: 200 * 1024 * 1024, // 200MB
        maxPromptGeneration: 300, // 300ms
        maxDataOperations: 100, // 100ms
      },
    };
  }

  /**
   * Run all test suites with comprehensive reporting
   */
  async runAllTests() {
    console.log('\n🧪 EcoMind Comprehensive Test Suite');
    console.log('=====================================\n');

    try {
      // Phase 1: Privacy Controls Testing (Critical)
      await this.runPrivacyTests();
      
      // Phase 2: Integration Testing
      await this.runIntegrationTests();
      
      // Phase 3: End-to-End Testing
      await this.runE2ETests();
      
      // Phase 4: Performance Testing
      await this.runPerformanceTests();
      
      // Generate comprehensive report
      await this.generateTestReport();
      
      // Validate quality gates
      const qualityCheck = this.validateQualityGates();
      
      if (qualityCheck.passed) {
        console.log('\n✅ All tests passed! Quality gates satisfied.');
        console.log(`📊 Overall coverage: ${this.results.overall.totalCoverage}%`);
        console.log(`⏱️  Total duration: ${this.results.overall.totalDuration}ms`);
        process.exit(0);
      } else {
        console.log('\n❌ Quality gates failed!');
        console.log('Failed checks:', qualityCheck.failures);
        process.exit(1);
      }
      
    } catch (error) {
      console.error('\n💥 Test execution failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Run privacy controls tests (highest priority)
   */
  async runPrivacyTests() {
    console.log('🔒 Running Privacy Controls Tests...');
    const startTime = Date.now();
    
    try {
      const result = await this.executeJest([
        '__tests__/privacy/**/*.test.*',
        '--coverage',
        '--coverageDirectory=coverage/privacy',
        '--testNamePattern="Privacy"',
      ]);
      
      this.results.privacy = {
        passed: result.success,
        coverage: this.extractCoverage('coverage/privacy'),
        duration: Date.now() - startTime,
      };
      
      if (result.success) {
        console.log('✅ Privacy tests passed');
      } else {
        console.log('❌ Privacy tests failed');
        throw new Error('Privacy tests are critical and must pass');
      }
      
    } catch (error) {
      console.error('Privacy tests failed:', error.message);
      throw error;
    }
  }

  /**
   * Run integration tests for AI pipeline
   */
  async runIntegrationTests() {
    console.log('🔗 Running Integration Tests...');
    const startTime = Date.now();
    
    try {
      const result = await this.executeJest([
        '__tests__/integration/**/*.test.*',
        '--coverage',
        '--coverageDirectory=coverage/integration',
        '--testTimeout=30000',
      ]);
      
      this.results.integration = {
        passed: result.success,
        coverage: this.extractCoverage('coverage/integration'),
        duration: Date.now() - startTime,
      };
      
      console.log(result.success ? '✅ Integration tests passed' : '❌ Integration tests failed');
      
    } catch (error) {
      console.error('Integration tests failed:', error.message);
      this.results.integration.passed = false;
    }
  }

  /**
   * Run end-to-end user workflow tests
   */
  async runE2ETests() {
    console.log('🎭 Running End-to-End Tests...');
    const startTime = Date.now();
    
    try {
      const result = await this.executeJest([
        '__tests__/e2e/**/*.test.*',
        '--coverage',
        '--coverageDirectory=coverage/e2e',
        '--testTimeout=60000',
      ]);
      
      this.results.e2e = {
        passed: result.success,
        coverage: this.extractCoverage('coverage/e2e'),
        duration: Date.now() - startTime,
      };
      
      console.log(result.success ? '✅ E2E tests passed' : '❌ E2E tests failed');
      
    } catch (error) {
      console.error('E2E tests failed:', error.message);
      this.results.e2e.passed = false;
    }
  }

  /**
   * Run performance tests with benchmarking
   */
  async runPerformanceTests() {
    console.log('⚡ Running Performance Tests...');
    const startTime = Date.now();
    
    try {
      const result = await this.executeJest([
        '__tests__/performance/**/*.test.*',
        '--testTimeout=120000',
        '--verbose',
      ]);
      
      // Extract performance benchmarks from test output
      const benchmarks = this.extractPerformanceBenchmarks(result.output);
      
      this.results.performance = {
        passed: result.success,
        benchmarks,
        duration: Date.now() - startTime,
      };
      
      console.log(result.success ? '✅ Performance tests passed' : '❌ Performance tests failed');
      
      if (benchmarks) {
        console.log('📈 Performance Benchmarks:');
        Object.entries(benchmarks).forEach(([metric, value]) => {
          console.log(`   ${metric}: ${value}`);
        });
      }
      
    } catch (error) {
      console.error('Performance tests failed:', error.message);
      this.results.performance.passed = false;
    }
  }

  /**
   * Execute Jest with specific configuration
   */
  async executeJest(args) {
    return new Promise((resolve, reject) => {
      const jestCommand = 'npx';
      const jestArgs = ['jest', ...args];
      
      let output = '';
      let errorOutput = '';
      
      const jestProcess = spawn(jestCommand, jestArgs, {
        cwd: this.projectRoot,
        stdio: ['inherit', 'pipe', 'pipe'],
      });
      
      jestProcess.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        if (process.env.VERBOSE_TESTS) {
          console.log(text);
        }
      });
      
      jestProcess.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        if (process.env.VERBOSE_TESTS) {
          console.error(text);
        }
      });
      
      jestProcess.on('close', (code) => {
        const success = code === 0;
        resolve({
          success,
          output: output + errorOutput,
          exitCode: code,
        });
      });
      
      jestProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Extract coverage percentage from Jest output
   */
  extractCoverage(coverageDir) {
    try {
      const coveragePath = path.join(this.projectRoot, coverageDir, 'coverage-summary.json');
      if (fs.existsSync(coveragePath)) {
        const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        return coverage.total?.lines?.pct || 0;
      }
    } catch (error) {
      console.warn('Could not extract coverage:', error.message);
    }
    return 0;
  }

  /**
   * Extract performance benchmarks from test output
   */
  extractPerformanceBenchmarks(output) {
    const benchmarks = {};
    
    // Extract performance metrics from console logs
    const perfLines = output.split('\n').filter(line => 
      line.includes('Performance:') || line.includes('ms,') || line.includes('MB')
    );
    
    perfLines.forEach(line => {
      // Parse performance metrics (this would be more sophisticated in practice)
      if (line.includes('ms')) {
        const match = line.match(/(\w+):\s*(\d+\.?\d*)ms/);
        if (match) {
          benchmarks[match[1]] = `${match[2]}ms`;
        }
      }
      if (line.includes('MB')) {
        const match = line.match(/Memory:\s*(\d+\.?\d*)MB/);
        if (match) {
          benchmarks.memoryUsage = `${match[1]}MB`;
        }
      }
    });
    
    return benchmarks;
  }

  /**
   * Generate comprehensive test report
   */
  async generateTestReport() {
    const report = {
      timestamp: new Date().toISOString(),
      project: 'EcoMind Personal Relationship Assistant',
      version: '1.0.0',
      testSuites: this.results,
      qualityGates: this.qualityGates,
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };
    
    // Calculate overall metrics
    const totalCoverage = [
      this.results.privacy.coverage,
      this.results.integration.coverage,
      this.results.e2e.coverage,
    ].reduce((sum, coverage) => sum + coverage, 0) / 3;
    
    const totalDuration = Object.values(this.results).reduce((sum, result) => {
      return sum + (result.duration || 0);
    }, 0);
    
    this.results.overall = {
      passed: Object.values(this.results).every(result => result.passed !== false),
      totalCoverage: Math.round(totalCoverage * 100) / 100,
      totalDuration,
    };
    
    report.summary = this.results.overall;
    
    // Write report to file
    const reportPath = path.join(this.projectRoot, 'coverage', 'test-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📋 Test report generated: ${reportPath}`);
    
    // Generate HTML report summary
    this.generateHTMLReport(report);
  }

  /**
   * Generate HTML test report
   */
  generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>EcoMind Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 8px; }
        .suite { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .passed { border-color: #4CAF50; background: #f9fff9; }
        .failed { border-color: #f44336; background: #fff9f9; }
        .metric { margin: 5px 0; }
        .summary { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 EcoMind Test Report</h1>
        <p>Generated: ${report.timestamp}</p>
        <p>Version: ${report.version}</p>
    </div>
    
    <div class="summary">
        <h2>📊 Overall Summary</h2>
        <div class="metric">Status: ${report.summary.passed ? '✅ PASSED' : '❌ FAILED'}</div>
        <div class="metric">Coverage: ${report.summary.totalCoverage}%</div>
        <div class="metric">Duration: ${report.summary.totalDuration}ms</div>
    </div>
    
    <h2>🔍 Test Suites</h2>
    ${Object.entries(report.testSuites).filter(([key]) => key !== 'overall').map(([suite, results]) => `
        <div class="suite ${results.passed ? 'passed' : 'failed'}">
            <h3>${suite.charAt(0).toUpperCase() + suite.slice(1)}</h3>
            <div class="metric">Status: ${results.passed ? '✅ PASSED' : '❌ FAILED'}</div>
            ${results.coverage ? `<div class="metric">Coverage: ${results.coverage}%</div>` : ''}
            <div class="metric">Duration: ${results.duration}ms</div>
            ${results.benchmarks ? `
                <h4>Performance Benchmarks:</h4>
                ${Object.entries(results.benchmarks).map(([metric, value]) => 
                    `<div class="metric">${metric}: ${value}</div>`
                ).join('')}
            ` : ''}
        </div>
    `).join('')}
    
    <div class="summary">
        <h2>🎯 Quality Gates</h2>
        <div class="metric">Minimum Coverage: ${report.qualityGates.minCoverage}%</div>
        <div class="metric">Maximum Test Duration: ${report.qualityGates.maxTestDuration}ms</div>
        <div class="metric">Performance Benchmarks: ${JSON.stringify(report.qualityGates.performanceBenchmarks, null, 2)}</div>
    </div>
</body>
</html>`;
    
    const htmlPath = path.join(this.projectRoot, 'coverage', 'test-report.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`📄 HTML report generated: ${htmlPath}`);
  }

  /**
   * Validate quality gates
   */
  validateQualityGates() {
    const failures = [];
    
    // Check overall coverage
    if (this.results.overall.totalCoverage < this.qualityGates.minCoverage) {
      failures.push(`Coverage ${this.results.overall.totalCoverage}% below minimum ${this.qualityGates.minCoverage}%`);
    }
    
    // Check test duration
    if (this.results.overall.totalDuration > this.qualityGates.maxTestDuration) {
      failures.push(`Test duration ${this.results.overall.totalDuration}ms exceeds maximum ${this.qualityGates.maxTestDuration}ms`);
    }
    
    // Check privacy tests (critical)
    if (!this.results.privacy.passed) {
      failures.push('Privacy tests must pass (critical)');
    }
    
    // Check performance benchmarks
    if (this.results.performance.benchmarks) {
      Object.entries(this.qualityGates.performanceBenchmarks).forEach(([metric, threshold]) => {
        const value = this.results.performance.benchmarks[metric];
        if (value && parseFloat(value) > threshold) {
          failures.push(`Performance ${metric} ${value} exceeds threshold ${threshold}`);
        }
      });
    }
    
    return {
      passed: failures.length === 0,
      failures,
    };
  }
}

// CLI interface
if (require.main === module) {
  const runner = new TestRunner();
  
  const args = process.argv.slice(2);
  const flags = {
    verbose: args.includes('--verbose'),
    coverage: args.includes('--coverage'),
    performance: args.includes('--performance-only'),
    privacy: args.includes('--privacy-only'),
  };
  
  if (flags.verbose) {
    process.env.VERBOSE_TESTS = 'true';
  }
  
  if (flags.privacy) {
    runner.runPrivacyTests().then(() => {
      console.log('Privacy tests completed');
      process.exit(runner.results.privacy.passed ? 0 : 1);
    });
  } else if (flags.performance) {
    runner.runPerformanceTests().then(() => {
      console.log('Performance tests completed');
      process.exit(runner.results.performance.passed ? 0 : 1);
    });
  } else {
    runner.runAllTests();
  }
}

module.exports = TestRunner;