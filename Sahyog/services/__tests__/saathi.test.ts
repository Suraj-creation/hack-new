/**
 * SAATHI Conversational AI Test Suite
 * 
 * Run these tests to verify all components are working properly.
 * Open browser console (F12) and call: window.runSaathiTests()
 */

import { saathiCore, EmotionalState, ConnectionStatus, SaathiCore } from '../saathiCore';
import { UIMode } from '../../types';

export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
  details?: any;
}

export interface TestSuiteResult {
  totalTests: number;
  passed: number;
  failed: number;
  results: TestResult[];
  totalDuration: number;
}

// ============================================
// TEST HELPERS
// ============================================

async function runTest(
  name: string, 
  testFn: () => Promise<{ success: boolean; message: string; details?: any }>
): Promise<TestResult> {
  const start = performance.now();
  try {
    const result = await testFn();
    return {
      name,
      passed: result.success,
      message: result.message,
      duration: performance.now() - start,
      details: result.details
    };
  } catch (error: any) {
    return {
      name,
      passed: false,
      message: `Exception: ${error.message}`,
      duration: performance.now() - start,
      details: { error }
    };
  }
}

// ============================================
// INDIVIDUAL TESTS
// ============================================

/**
 * Test 1: API Key Configuration
 */
async function testApiKeyConfiguration(): Promise<{ success: boolean; message: string; details?: any }> {
  const result = SaathiCore.testApiKey();
  return {
    success: result.success,
    message: result.message,
    details: { keyPreview: result.keyPreview }
  };
}

/**
 * Test 2: AudioContext Support
 */
async function testAudioContextSupport(): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) {
      return { success: false, message: 'AudioContext not supported' };
    }
    const ctx = new AudioContext();
    ctx.close();
    return { success: true, message: 'AudioContext supported' };
  } catch (error: any) {
    return { success: false, message: `AudioContext error: ${error.message}` };
  }
}

/**
 * Test 3: Microphone Permission
 */
async function testMicrophonePermission(): Promise<{ success: boolean; message: string; details?: any }> {
  const result = await SaathiCore.testMicrophone();
  return {
    success: result.success,
    message: result.message
  };
}

/**
 * Test 4: SaathiCore Initialization
 */
async function testSaathiCoreInit(): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    // Set a mock user
    saathiCore.setUser({
      id: 'test-user',
      name: 'Test User',
      village: 'Test Village',
      block: 'Test Block',
      district: 'Sehore',
      state: 'Madhya Pradesh',
      preferredLanguage: 'hi-IN',
      uiMode: UIMode.STANDARD,
      daysWorked: 10,
      onboardingLevel: 3,
      aadhaarLinked: true,
      phoneNumber: '9876543210',
      isLiterate: true,
      bankAccountLinked: true,
      registeredSchemes: [],
      pendingPayments: 0,
      lastActiveDate: new Date().toISOString()
    });
    
    saathiCore.setCurrentScreen('home');
    
    const status = saathiCore.getConnectionStatus();
    const apiConfigured = saathiCore.isApiKeyConfigured();
    
    return {
      success: true,
      message: 'SaathiCore initialized successfully',
      details: {
        connectionStatus: status,
        apiKeyConfigured: apiConfigured
      }
    };
  } catch (error: any) {
    return {
      success: false,
      message: `SaathiCore init failed: ${error.message}`
    };
  }
}

/**
 * Test 5: Full Connection Prerequisites
 */
async function testFullConnectionPrerequisites(): Promise<{ success: boolean; message: string; details?: any }> {
  const result = await saathiCore.testConnection();
  return {
    success: result.success,
    message: result.message,
    details: { steps: result.details }
  };
}

// ============================================
// MAIN TEST RUNNER
// ============================================

export async function runAllTests(): Promise<TestSuiteResult> {
  console.log('🧪 Starting SAATHI Test Suite...\n');
  
  const tests: Array<{ name: string; fn: () => Promise<{ success: boolean; message: string; details?: any }> }> = [
    { name: '1. API Key Configuration', fn: testApiKeyConfiguration },
    { name: '2. AudioContext Support', fn: testAudioContextSupport },
    { name: '3. Microphone Permission', fn: testMicrophonePermission },
    { name: '4. SaathiCore Initialization', fn: testSaathiCoreInit },
    { name: '5. Full Connection Prerequisites', fn: testFullConnectionPrerequisites },
  ];
  
  const results: TestResult[] = [];
  const suiteStart = performance.now();
  
  for (const test of tests) {
    console.log(`Running: ${test.name}...`);
    const result = await runTest(test.name, test.fn);
    results.push(result);
    console.log(`  ${result.passed ? '✅' : '❌'} ${result.message} (${result.duration.toFixed(0)}ms)`);
    if (result.details && !result.passed) {
      console.log('  Details:', result.details);
    }
  }
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalDuration = performance.now() - suiteStart;
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passed}/${results.length} passed`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ⏱️ Duration: ${totalDuration.toFixed(0)}ms`);
  console.log('='.repeat(50));
  
  return {
    totalTests: results.length,
    passed,
    failed,
    results,
    totalDuration
  };
}

// Export for browser console access
if (typeof window !== 'undefined') {
  (window as any).runSaathiTests = runAllTests;
  (window as any).saathiCore = saathiCore;
  console.log('🧪 SAATHI Tests loaded! Run: window.runSaathiTests()');
}

export default {
  runAllTests,
  testApiKeyConfiguration,
  testAudioContextSupport,
  testMicrophonePermission,
  testSaathiCoreInit,
  testFullConnectionPrerequisites
};
