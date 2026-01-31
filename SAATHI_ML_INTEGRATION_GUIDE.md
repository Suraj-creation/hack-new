# 🤖 SAATHI-ML INTEGRATION GUIDE
## Complete Guide to Integrating ML Models with Conversational AI

**Version:** 2.0  
**Last Updated:** January 31, 2026  
**Models Implemented:** 5/5 ✅

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [Integration Examples](#integration-examples)
5. [API Reference](#api-reference)
6. [Conversational Patterns](#conversational-patterns)
7. [Data Flow](#data-flow)
8. [Best Practices](#best-practices)

---

## 1. Overview

The SAHAYOG ML system now has **complete integration** with the Saathi conversational AI. All 5 ML/DL models are implemented and accessible through simple APIs.

### Implemented Models

| Model | Status | Purpose | Conversational Integration |
|-------|--------|---------|---------------------------|
| **Priority Scoring** | ✅ Complete | Calculate allocation priority | Explains "why not me?" questions |
| **Fraud Detection** | ✅ Complete | Detect fraudulent patterns | Background validation |
| **Fair Allocation** | ✅ Complete | Optimize work distribution | Ensures demographic quotas |
| **NLP Context** | ✅ Complete | Extract conversation data | Real-time data extraction |
| **Predictive Analytics** | ✅ Complete | Forecast trends | Proactive suggestions |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SAATHI CONVERSATIONAL AI                  │
│  (User speaks Hindi/English → Voice/Text input)             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              SAATHI-ML BRIDGE (saathiMLIntegration.ts)      │
│  ├─ processConversation()        - Extract context          │
│  ├─ getWorkAllocationExplanation() - Generate explanations  │
│  ├─ checkFraudRisk()              - Validate user           │
│  ├─ updateUserFromConversation()  - Store extracted data    │
│  └─ getPredictiveInsights()       - Future predictions      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│          ML MODELS (mlModels_comprehensive.ts)              │
│  ├─ PriorityScoringModel          - Priority: 0-100         │
│  ├─ FraudDetectionModel            - Risk: low/high/critical│
│  ├─ FairAllocationOptimizer        - Allocation decisions   │
│  ├─ NLPContextUnderstanding        - Context extraction     │
│  └─ PredictiveAnalytics            - Future trends          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   MONGODB DATABASE                           │
│  ├─ enhanced_ml_users              - User profiles          │
│  ├─ ml_features                    - Feature store          │
│  ├─ ml_predictions                 - Prediction cache       │
│  ├─ conversational_contexts        - Conversation data      │
│  └─ fairness_audits                - Audit logs             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Quick Start

### Step 1: Import the Integration Layer

```typescript
import saathiML, { 
  extractConversationContext,
  explainAllocationDecision,
  isUserSafeForAllocation,
  getUserPriorityScore
} from './services/saathiMLIntegration';
```

### Step 2: Process a Conversation

```typescript
// When user talks to Saathi
const result = await saathiML.processConversation({
  userId: 'user123',
  conversationId: 'conv456',
  conversationText: 'I need work urgently. My husband died 2 months ago and I have 3 children.',
  conversationHindi: 'मुझे तुरंत काम चाहिए। मेरे पति की 2 महीने पहले मृत्यु हो गई और मेरे 3 बच्चे हैं।',
  userQuery: 'I need work',
});

console.log('Urgency:', result.context.extractedData.urgencyLevel); // 'immediate'
console.log('Empathy Score:', result.context.empathyScore); // 85
console.log('Life Events:', result.context.extractedData.lifeEvents); // [{ event: 'Death in family', severity: 'critical' }]
console.log('Urgent Flags:', result.urgentFlags); // ['IMMEDIATE_ALLOCATION_REQUIRED', 'FAMILY_EMERGENCY_DETECTED']
```

### Step 3: Get ML-Powered Explanation

```typescript
// When user asks "Why didn't I get work?"
const explanation = await saathiML.getWorkAllocationExplanation({
  userId: 'user123',
  questionType: 'why_not_me',
});

// Send to user
console.log(explanation.explanation.simpleHindi);
// Output: "आपका वर्तमान प्राथमिकता स्कोर 45/100 है (normal प्राथमिकता)। 
//          मुख्य कारण: 50 दिन से काम नहीं मिला, 3 बच्चों की देखभाल, BPL परिवार।"
```

### Step 4: Check Fraud Risk

```typescript
// Before allocation
const fraudCheck = await saathiML.checkFraudRisk('user123');

if (fraudCheck.shouldBlock) {
  console.log('🚨 Cannot allocate - Critical fraud risk');
  console.log('Warnings:', fraudCheck.warnings);
  // ['Too perfect attendance pattern', 'Multiple bank account changes']
} else {
  // Proceed with allocation
  console.log('✅ User is safe for allocation');
}
```

---

## 4. Integration Examples

### Example 1: Complete Saathi Conversation Flow

```typescript
import { handleSaathiConversation } from './services/database/mlIntegration';

// In your Saathi conversation handler
async function handleUserMessage(userId: string, message: string, messageHindi: string) {
  
  const result = await handleSaathiConversation({
    userId,
    conversationId: generateConversationId(),
    userMessage: message,
    userMessageHindi: messageHindi,
    conversationHistory: getConversationHistory(userId),
  });
  
  // Send response to user
  sendToUser(result.responseHindi); // Hindi response
  
  // Handle urgent alerts
  if (result.urgentAlerts.length > 0) {
    notifyOfficials(result.urgentAlerts);
  }
  
  // Log actions taken
  console.log('Actions:', result.actionsTaken);
  // ['Added to work allocation queue', 'Priority score: 85/100', 'Escalated to priority queue']
}
```

### Example 2: Real-Time Data Extraction

```typescript
import { extractAndStoreConversationalData } from './services/database/mlIntegration';

// After every conversation
const extraction = await extractAndStoreConversationalData({
  userId: 'user123',
  conversationId: 'conv456',
  messages: [
    { speaker: 'saathi', text: 'How many people in your family?', textHindi: 'आपके परिवार में कितने सदस्य हैं?' },
    { speaker: 'user', text: '6 members - me, wife, 3 children, and my mother', textHindi: '6 सदस्य - मैं, पत्नी, 3 बच्चे और मेरी माँ' },
    { speaker: 'saathi', text: 'When did you last work?', textHindi: 'आपने आखिरी बार कब काम किया?' },
    { speaker: 'user', text: '2 months ago, worked for 15 days', textHindi: '2 महीने पहले, 15 दिन काम किया' },
  ],
});

console.log('Extracted:', extraction.extractedData);
// {
//   householdSize: 6,
//   numChildren: 3,
//   daysSinceLastWork: 60,
//   recentLifeEvents: [],
//   workBarriers: []
// }

console.log('Data Quality:', extraction.dataQuality); // 71%
console.log('Missing Fields:', extraction.missingFields); // ['debtAmount']

// Prompt Saathi to ask about missing data
if (extraction.dataQuality < 80) {
  const nextQuestion = getQuestionForMissingField(extraction.missingFields[0]);
  askUser(nextQuestion);
}
```

### Example 3: Proactive Suggestions

```typescript
import { getSuggestedQuestions } from './services/database/mlIntegration';

// Get smart questions for Saathi to ask
const suggestions = await getSuggestedQuestions('user123');

for (const q of suggestions.questions) {
  if (q.priority === 'high') {
    console.log(`Ask: ${q.questionHindi}`);
    console.log(`Reason: ${q.reason}`);
    // Ask: आपके परिवार में कितने सदस्य हैं?
    // Reason: To calculate dependency ratio for priority scoring
  }
}
```

### Example 4: Explain Allocation Decision

```typescript
// Handle different types of questions

// "Why not me?"
const whyNot = await explainAllocationDecision('user123', 'why_not_me');
console.log(whyNot);
// "आपका प्राथमिकता स्कोर 45/100 है। आपसे पहले 120 लोग हैं जिनकी प्राथमिकता अधिक है।"

// "When will I get work?"
const when = await explainAllocationDecision('user123', 'when_will_i_get');
console.log(when);
// "आप कतार में 45 स्थान पर हैं। अनुमानित प्रतीक्षा समय: 9 दिन।"

// "Am I eligible?"
const eligible = await explainAllocationDecision('user123', 'am_i_eligible');
console.log(eligible);
// "हां, आप MGNREGA काम के लिए योग्य हैं। आपका प्राथमिकता स्तर high है।"

// "Is the system fair?"
const fair = await explainAllocationDecision('user123', 'fairness_check');
console.log(fair);
// "प्रणाली 40 कारकों के आधार पर काम आवंटित करती है। गिनी गुणांक 0.25 (निष्पक्ष)।"
```

---

## 5. API Reference

### saathiML.processConversation()

**Purpose:** Extract structured data and context from conversation

```typescript
await saathiML.processConversation({
  userId: string;
  conversationId: string;
  conversationText: string;
  conversationHindi: string;
  userQuery: string;
})

Returns: {
  context: ConversationalContext;
  updates: Partial<EnhancedMLUserDocument>;
  recommendedActions: string[];
  urgentFlags: string[];
}
```

**ConversationalContext includes:**
- `extractedData.urgencyLevel`: 'immediate' | 'high' | 'normal' | 'low'
- `extractedData.emotionalState`: 'desperate' | 'distressed' | 'neutral' | 'calm'
- `extractedData.lifeEvents`: Array of critical life events (death, illness, etc.)
- `extractedData.specificNeeds`: ['food', 'medical', 'education', etc.]
- `extractedData.barriers`: ['childcare', 'health', 'transport', etc.]
- `extractedData.familyCrisis`: { hasEmergency, type, details }
- `sentiment`: { overall, desperation, anger, hope, confusion }
- `intent.primary`: 'request_work' | 'check_status' | 'complain' | 'ask_why'
- `entities`: Extracted names, dates, money amounts, diseases
- `empathyScore`: 0-100 (how much support needed)

### saathiML.getWorkAllocationExplanation()

**Purpose:** Generate human-readable explanations for allocation decisions

```typescript
await saathiML.getWorkAllocationExplanation({
  userId: string;
  questionType: 'why_not_me' | 'when_will_i_get' | 'am_i_eligible' | 'fairness_check';
  conversationalContext?: ConversationalContext;
})

Returns: {
  priorityScore: number; // 0-100
  priorityLevel: 'immediate' | 'high' | 'normal' | 'waitlist';
  explanation: {
    simple: string;
    simpleHindi: string;
    detailed: string;
    detailedHindi: string;
  };
  visualData: any; // For charts/graphs
  estimatedWaitTime?: string;
  actionableSteps: string[];
}
```

### saathiML.checkFraudRisk()

**Purpose:** Validate user before allocation

```typescript
await saathiML.checkFraudRisk(userId: string)

Returns: {
  isSafe: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  warnings: string[];
  warningsHindi: string[];
  shouldBlock: boolean;
}
```

### saathiML.getPredictiveInsights()

**Purpose:** Get future predictions and trends

```typescript
await saathiML.getPredictiveInsights(userId: string)

Returns: {
  dropoutRisk: string;
  dropoutReasons: string[];
  seasonalTrend: string;
  vulnerabilityTrend: string;
  recommendations: string[];
}
```

---

## 6. Conversational Patterns

### Pattern 1: Urgent Request

**User:** "मुझे तुरंत काम चाहिए, बच्चों के लिए खाना नहीं है"  
**Saathi Detects:**
- Urgency: immediate
- Need: food
- Empathy: 90
- Action: Escalate to priority queue

**Saathi Response:** "मैं समझता हूं यह आपातकाल है। आपको उच्च प्राथमिकता दी गई है।"

### Pattern 2: Why Not Me?

**User:** "मुझे 3 महीने से काम नहीं मिला, क्यों?"  
**Saathi Detects:**
- Intent: ask_why
- Days without work: 90
- Sentiment: anger + desperation

**Saathi Response:** "आपका प्राथमिकता स्कोर 55/100 है। मुख्य कारण: आपके गांव में 45 लोग हैं जिनकी प्राथमिकता अधिक है।"

### Pattern 3: Data Collection

**Saathi:** "आपके परिवार में कितने बच्चे हैं?"  
**User:** "3 बच्चे हैं, सबसे छोटा 2 साल का है"  
**Saathi Extracts:**
- numChildren: 3
- youngestChildAge: 2
- Barrier: childcare (inferred)

### Pattern 4: Crisis Detection

**User:** "मेरे पति की मृत्यु हो गई, अब मुझे अकेले बच्चों को पालना है"  
**Saathi Detects:**
- Life Event: Death (critical)
- Vulnerability: widow + single parent
- Empathy: 95
- Action: Immediate referral + pension scheme

**Saathi Response:** "मुझे बहुत दुख है। आपको तत्काल काम दिया जाएगा। विधवा पेंशन के लिए भी referral बना रहा हूं।"

---

## 7. Data Flow

### Conversation → ML Pipeline

```
1. USER SPEAKS
   ↓
2. SPEECH TO TEXT (Hindi/English)
   ↓
3. NLP CONTEXT UNDERSTANDING
   - Extract urgency
   - Detect sentiment
   - Identify intent
   - Extract entities
   - Calculate empathy score
   ↓
4. UPDATE USER PROFILE
   - Store extracted data
   - Update vulnerability indicators
   - Add life events
   ↓
5. ML PREDICTION
   - Calculate priority score
   - Check fraud risk
   - Generate explanation
   ↓
6. GENERATE RESPONSE
   - Select appropriate template
   - Add personalized explanation
   - Include actionable steps
   ↓
7. TEXT TO SPEECH (Hindi/English)
   ↓
8. USER HEARS RESPONSE
```

### Data Extraction Examples

| User Says | Extracted Data |
|-----------|---------------|
| "मेरे 3 बच्चे हैं" | `numChildren: 3` |
| "2 महीने से काम नहीं मिला" | `daysSinceLastWork: 60` |
| "50,000 रुपये का कर्ज है" | `debtAmount: 50000` |
| "पति की मृत्यु हो गई" | `lifeEvent: death`, `isWidow: true` |
| "बच्चे स्कूल छोड़ रहे हैं" | `need: education`, `vulnerability: high` |
| "खाने के लिए पैसे नहीं हैं" | `need: food`, `urgency: immediate` |

---

## 8. Best Practices

### For Conversational AI Integration

1. **Always extract context first**
   ```typescript
   const context = await saathiML.processConversation({...});
   // Then use context for all subsequent operations
   ```

2. **Handle urgent flags immediately**
   ```typescript
   if (result.urgentFlags.includes('IMMEDIATE_ALLOCATION_REQUIRED')) {
     await prioritizeUser(userId);
     await notifyOfficials(userId);
   }
   ```

3. **Update user data after every conversation**
   ```typescript
   await saathiML.updateUserFromConversation(userId, updates, context);
   ```

4. **Check fraud before allocation**
   ```typescript
   const fraudCheck = await saathiML.checkFraudRisk(userId);
   if (fraudCheck.shouldBlock) {
     return 'Manual review required';
   }
   ```

5. **Use Hindi by default for rural users**
   ```typescript
   const response = explanation.explanation.simpleHindi; // Prefer Hindi
   ```

6. **Provide visual explanations when possible**
   ```typescript
   const chartData = explanation.visualData.scoreBreakdown;
   renderPieChart(chartData); // Show visual breakdown
   ```

7. **Log all ML decisions for auditability**
   ```typescript
   await logMLDecision({
     userId,
     prediction,
     explanation,
     timestamp: new Date().toISOString(),
   });
   ```

### For Data Quality

1. **Ask targeted follow-up questions**
   ```typescript
   if (extraction.dataQuality < 80) {
     const nextQ = getSuggestedQuestions(userId);
     askUser(nextQ.questions[0].questionHindi);
   }
   ```

2. **Validate extracted data**
   ```typescript
   if (extractedData.householdSize > 20) {
     // Probably extraction error
     askForConfirmation();
   }
   ```

3. **Handle missing data gracefully**
   ```typescript
   const defaultValues = {
     householdSize: 4, // Average family size
     numChildren: 2,   // Average
     // Use defaults only when critical
   };
   ```

---

## 9. Testing

### Test Conversation Processing

```typescript
import { mlEngine } from './services/database/mlModels_comprehensive';

// Test urgent detection
const context = await mlEngine.nlpModel.analyzeConversation(
  'I need work immediately, my family is starving',
  'मुझे तुरंत काम चाहिए, मेरा परिवार भूखा है',
  'user123',
  'conv456'
);

expect(context.extractedData.urgencyLevel).toBe('immediate');
expect(context.empathyScore).toBeGreaterThan(80);
expect(context.extractedData.specificNeeds).toContain('food');
```

### Test Fraud Detection

```typescript
const fraudPrediction = await mlEngine.fraudModel.predict(mockUser);

expect(fraudPrediction.fraudRiskLevel).toBe('low');
expect(fraudPrediction.detectedSignals.length).toBeLessThan(3);
```

### Test Priority Scoring

```typescript
const priorityPrediction = await mlEngine.priorityModel.predict(mockUser);

expect(priorityPrediction.priorityScore).toBeGreaterThanOrEqual(0);
expect(priorityPrediction.priorityScore).toBeLessThanOrEqual(100);
expect(priorityPrediction.explanation.individual.topReasons.length).toBeGreaterThan(0);
```

---

## 10. Troubleshooting

### Issue: Context not extracting properly

**Solution:**
```typescript
// Check conversation text quality
console.log('Input:', conversationText);
console.log('Length:', conversationText.length);

// Ensure Hindi text is provided
if (!conversationHindi) {
  console.error('Hindi text missing!');
}
```

### Issue: Low priority scores for urgent users

**Solution:**
```typescript
// Check urgency override
if (context.extractedData.urgencyLevel === 'immediate') {
  priorityScore = Math.max(priorityScore, 80); // Override to high priority
}
```

### Issue: Fraud false positives

**Solution:**
```typescript
// Check fraud thresholds
const fraudCheck = await saathiML.checkFraudRisk(userId);
if (fraudCheck.riskLevel === 'medium' && fraudCheck.warnings.length < 3) {
  // Allow with monitoring
  proceed();
}
```

---

## 11. Next Steps

1. **Connect to MongoDB** - Replace mock data with real database queries
2. **Test with real conversations** - Use actual user conversations from field
3. **Fine-tune thresholds** - Adjust priority weights based on outcomes
4. **Train NLP model** - Fine-tune on Hindi MGNREGA conversations
5. **Add voice integration** - Connect to speech-to-text/text-to-speech
6. **Build admin dashboard** - Visualize ML decisions and fairness metrics

---

**Questions? Check:**
- [mlModels_comprehensive.ts](../services/database/mlModels_comprehensive.ts) - All ML model implementations
- [saathiMLIntegration.ts](../services/saathiMLIntegration.ts) - Conversational AI bridge
- [mlIntegration.ts](../services/database/mlIntegration.ts) - Integration examples

**Version History:**
- v2.0 (Jan 31, 2026): Complete implementation with all 5 models + conversational integration
- v1.0 (Jan 30, 2026): Initial implementation with 3 models

---

Made with ❤️ for India's rural workforce
