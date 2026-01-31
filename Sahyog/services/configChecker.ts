/**
 * API Configuration Checker
 * Helps diagnose connection issues
 */

export const checkConfiguration = () => {
  const checks = {
    apiKey: false,
    apiKeyValid: false,
    microphone: false,
    browser: false,
    audioContext: false
  };

  // Check API key
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  checks.apiKey = apiKey.length > 0;
  checks.apiKeyValid = apiKey.length > 20; // Basic validation

  // Check microphone support
  checks.microphone = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  // Check browser support
  const userAgent = navigator.userAgent.toLowerCase();
  checks.browser = userAgent.includes('chrome') || 
                   userAgent.includes('edge') || 
                   userAgent.includes('safari');

  // Check AudioContext support
  checks.audioContext = !!(window.AudioContext || (window as any).webkitAudioContext);

  return checks;
};

export const getSetupInstructions = () => {
  const checks = checkConfiguration();
  const issues: string[] = [];
  const solutions: string[] = [];

  if (!checks.apiKey) {
    issues.push('❌ Gemini API key not configured');
    solutions.push('1. Get API key from: https://aistudio.google.com/app/apikey\n2. Create .env.local file in Sahyog folder\n3. Add: VITE_GEMINI_API_KEY=your_key\n4. Restart server: npm run dev');
  } else if (!checks.apiKeyValid) {
    issues.push('⚠️ API key looks invalid (too short)');
    solutions.push('Check that you copied the full API key from Google AI Studio');
  }

  if (!checks.microphone) {
    issues.push('❌ Microphone API not supported');
    solutions.push('Use Chrome, Edge, or Safari browser');
  }

  if (!checks.browser) {
    issues.push('⚠️ Browser may not be fully supported');
    solutions.push('For best experience, use Chrome or Edge');
  }

  if (!checks.audioContext) {
    issues.push('❌ Audio API not supported');
    solutions.push('Update your browser to the latest version');
  }

  return {
    allGood: issues.length === 0,
    issues,
    solutions,
    checks
  };
};

export const logSetupStatus = () => {
  console.log('='.repeat(60));
  console.log('SAHAYOG SAATHI - Configuration Status');
  console.log('='.repeat(60));
  
  const status = getSetupInstructions();
  const checks = status.checks;

  console.log('✓ Configuration Checks:');
  console.log(`  ${checks.apiKey ? '✅' : '❌'} API Key Present`);
  console.log(`  ${checks.apiKeyValid ? '✅' : '⚠️'} API Key Valid Format`);
  console.log(`  ${checks.microphone ? '✅' : '❌'} Microphone Support`);
  console.log(`  ${checks.browser ? '✅' : '⚠️'} Browser Support`);
  console.log(`  ${checks.audioContext ? '✅' : '❌'} Audio Context Support`);
  
  if (!status.allGood) {
    console.log('\n⚠️ Issues Found:');
    status.issues.forEach(issue => console.log(`  ${issue}`));
    
    console.log('\n💡 Solutions:');
    status.solutions.forEach(solution => console.log(`  ${solution}\n`));
  } else {
    console.log('\n✅ All systems ready!');
  }
  
  console.log('='.repeat(60));
};
