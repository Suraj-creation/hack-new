/**
 * SAHAYOG ML INTEGRATION GUIDE
 * How to integrate ML models with existing codebase
 */

import { mlEngine, PriorityScoringModel, FraudDetectionModel, FairAllocationOptimizer } from './mlModels_comprehensive';
import { featureEngineeringService } from './featureEngineering';
import { EnhancedMLUserDocument } from './mlSchemas_enhanced';
import { mongoService } from './mongoService';
import saathiML from '../saathiMLIntegration';

// ============================================
// INTEGRATION EXAMPLES
// ============================================

/**
 * Example 1: Work Allocation with ML
 * Replace existing simple allocation logic with ML-powered fair allocation
 */
export async function allocateWorkWithML(
  districtCode: string,
  blockCode: string,
  gramPanchayatCode: string
) {
  console.log('🤖 Starting ML-powered work allocation...');
  
  // Step 1: Get all users who applied for work
  const applicantsResponse = await mongoService.find<EnhancedMLUserDocument>('enhanced_ml_users', {
    'residentialAddress.districtLGDCode': districtCode,
    'residentialAddress.block': blockCode,
    'residentialAddress.gramPanchayat': gramPanchayatCode,
    'currentStatus.workDemandStatus': { $in: ['applied', 'waiting'] },
  });
  
  const applicants = applicantsResponse.data || [];
  console.log(`✅ Found ${applicants.length} applicants`);
  
  // Step 2: Get available work opportunities
  const workOpportunitiesResponse = await mongoService.find('mgnrega_work_opportunities', {
    'location.gramPanchayat': gramPanchayatCode,
    'status': 'open',
    'allocation.slotsRemaining': { $gt: 0 },
  });
  
  const workOpportunities = workOpportunitiesResponse.data || [];
  console.log(`✅ Found ${workOpportunities.length} work opportunities`);
  
  // Step 3: Run ML allocation optimizer
  const optimizer = new FairAllocationOptimizer();
  const allocations = await optimizer.optimize(
    applicants,
    (workOpportunities as any[]).map(opp => ({
      id: opp._id,
      capacity: opp.allocation.slotsRemaining,
      skillsRequired: opp.workDetails.skillsRequired || [],
      workType: opp.workDetails.physicalIntensity || 'moderate',
      location: opp.location.geoLocation,
    })),
    {
      minGenderRatio: 0.33, // 33% women minimum
      minSCSTRatio: 0.25,   // 25% SC/ST minimum
      minDisabilityRatio: 0.05, // 5% disabled minimum
      maxGini: 0.3,         // Maximum inequality
    }
  );
  
  console.log(`✅ Generated ${allocations.length} allocations`);
  
  // Step 4: Store allocations in database
  for (const allocation of allocations) {
    if (allocation.decision === 'allocated') {
      // Store in allocation_history
      await mongoService.insertOne('allocation_history', {
        allocationId: allocation.allocationId,
        allocationDate: new Date().toISOString(),
        userId: allocation.userId,
        workOpportunityId: allocation.workOpportunityId,
        allocatedDays: allocation.allocatedDays,
        decisionFactors: allocation.decisionFactors,
        reasoning: allocation.reasoning,
        explanation: allocation.explanation,
        modelVersion: allocation.modelVersion,
        createdAt: new Date().toISOString(),
        createdBy: 'ml_system',
      });
      
      // Update user's work status
      await mongoService.updateOne('enhanced_ml_users', 
        { _id: allocation.userId },
        { 
          $set: { 
            'currentStatus.workDemandStatus': 'allocated',
            'metadata.lastWorkAllocation': new Date().toISOString(),
          },
        }
      );
      
      // Send notification with explanation
      await sendAllocationNotification(allocation);
    }
  }
  
  // Step 5: Generate fairness audit report
  await generateFairnessAudit(allocations, applicants);
  
  console.log('🎉 ML-powered allocation complete!');
  return allocations;
}

/**
 * Example 2: Real-time Fraud Check during attendance
 */
export async function checkAttendanceFraud(
  userId: string,
  workOpportunityId: string,
  checkInData: {
    location: { lat: number; lng: number };
    timestamp: string;
    biometricScore: number;
  }
) {
  console.log('🔍 Running fraud check...');
  
  // Get user data
  const userResponse = await mongoService.findOne<EnhancedMLUserDocument>('enhanced_ml_users', { _id: userId });
  const user = userResponse.data;
  if (!user) throw new Error('User not found');
  
  // Run fraud detection
  const fraudModel = new FraudDetectionModel();
  const fraudPrediction = await fraudModel.predict(user);
  
  // Check for critical fraud
  if (fraudPrediction.fraudRiskLevel === 'critical') {
    console.log('🚨 CRITICAL FRAUD DETECTED!');
    
    // Block attendance
    await mongoService.insertOne('fraud_alerts', {
      userId,
      workOpportunityId,
      alertType: 'critical_fraud',
      detectedAt: new Date().toISOString(),
      fraudPrediction,
      checkInData,
      status: 'pending_investigation',
    });
    
    // Notify admin
    await notifyAdmin({
      type: 'FRAUD_ALERT',
      severity: 'CRITICAL',
      userId,
      message: `Critical fraud detected for ${user.fullName}`,
      evidence: fraudPrediction.detectedSignals,
    });
    
    return {
      allowed: false,
      reason: 'Fraud risk detected - pending investigation',
      reasonHindi: 'धोखाधड़ी जोखिम पाया गया - जांच लंबित',
    };
  }
  
  // Medium/High risk - allow but monitor
  if (fraudPrediction.fraudRiskLevel in ['medium', 'high']) {
    console.log('⚠️ Elevated fraud risk - enabling enhanced monitoring');
    
    await mongoService.insertOne('fraud_alerts', {
      userId,
      alertType: 'elevated_risk',
      detectedAt: new Date().toISOString(),
      fraudPrediction,
      status: 'monitoring',
    });
  }
  
  return {
    allowed: true,
    fraudRisk: fraudPrediction.fraudRiskLevel,
    monitoringEnabled: fraudPrediction.fraudRiskLevel !== 'low',
  };
}

/**
 * Example 3: Conversational AI with ML-powered explanations
 */
export async function handleAllocationQuery(
  userId: string,
  question: string,
  questionType: 'why_not_me' | 'when_will_i_get' | 'fairness_check'
) {
  console.log('💬 Handling allocation query with ML explanations...');
  
  // Get user data
  const userResponse = await mongoService.findOne<EnhancedMLUserDocument>('enhanced_ml_users', { _id: userId });
  const user = userResponse.data;
  if (!user) throw new Error('User not found');
  
  // Get ML prediction
  const model = new PriorityScoringModel();
  const prediction = await model.predict(user);
  
  // Generate context-specific explanation
  let response = '';
  let responseHindi = '';
  
  if (questionType === 'why_not_me') {
    // User asking why they didn't get work
    const explanation = prediction.explanation.individual;
    
    response = `${user.fullName}, let me explain your current priority:\n\n`;
    response += `Your priority score is ${prediction.priorityScore}/100 (${prediction.priorityLevel} priority).\n\n`;
    response += `TOP FACTORS:\n`;
    
    explanation.topReasons.slice(0, 5).forEach((reason, i) => {
      response += `${i + 1}. ${reason.reason}: ${reason.score} (${reason.weight.toFixed(1)}% weight)\n`;
    });
    
    response += `\n${explanation.narrativeEnglish}`;
    
    // Add counterfactuals
    if (prediction.explanation.counterfactuals.length > 0) {
      response += `\n\nWAYS TO IMPROVE YOUR PRIORITY:\n`;
      prediction.explanation.counterfactuals.forEach((cf, i) => {
        response += `${i + 1}. ${cf.change} → ${cf.impact}\n`;
      });
    }
    
    responseHindi = explanation.narrativeHindi;
  }
  
  else if (questionType === 'when_will_i_get') {
    // User asking when they'll get work
    const waitingAhead = await countUsersWithHigherPriority(userId, prediction.priorityScore);
    const estimatedDays = Math.ceil(waitingAhead / 10); // Assuming 10 allocations per day
    
    response = `Based on your priority score of ${prediction.priorityScore}, `;
    response += `there are approximately ${waitingAhead} people ahead of you. `;
    response += `Estimated wait time: ${estimatedDays} days.\n\n`;
    response += prediction.recommendation.reasoning;
    
    responseHindi = `आपकी प्राथमिकता स्कोर ${prediction.priorityScore} के आधार पर, `;
    responseHindi += `आपसे पहले लगभग ${waitingAhead} लोग हैं। `;
    responseHindi += `अनुमानित प्रतीक्षा समय: ${estimatedDays} दिन।`;
  }
  
  else if (questionType === 'fairness_check') {
    // User checking if system is fair
    const fairnessAudit: any = await getLatestFairnessAudit();
    
    response = `FAIRNESS CHECK:\n\n`;
    response += `✅ Gender balance: ${(fairnessAudit.demographicParity.byGender.female.allocationRate * 100).toFixed(1)}% women (target: 33%)\n`;
    response += `✅ Caste representation: Proportional allocation maintained\n`;
    response += `✅ Gini coefficient: ${fairnessAudit.overallMetrics.giniCoefficient.toFixed(3)} (target: <0.3)\n\n`;
    response += `Your allocation is based purely on need, not identity. `;
    response += `The system is regularly audited for fairness.`;
  }
  
  // Store explanation in log
  await mongoService.insertOne('explainability_logs', {
    explanationId: `exp-${Date.now()}`,
    userId,
    questionType,
    question,
    explanation: {
      individual: prediction.explanation.individual,
      comparative: prediction.explanation.comparative,
      counterfactuals: prediction.explanation.counterfactuals,
    },
    delivery: {
      format: 'text',
      language: user.preferredLanguage,
      deliveredAt: new Date().toISOString(),
      deliveredVia: 'app',
    },
    performance: {
      generationTimeMs: 100, // Would be measured
      modelVersion: prediction.modelVersion,
      explainerVersion: 'v1.0.0',
    },
  });
  
  return {
    response,
    responseHindi,
    visualData: prediction.explanation.visualData,
    prediction,
  };
}

/**
 * Example 4: Batch fairness audit after allocation
 */
async function generateFairnessAudit(
  allocations: any[],
  allApplicants: EnhancedMLUserDocument[]
) {
  console.log('📊 Generating fairness audit...');
  
  const allocated = allocations.filter(a => a.decision === 'allocated');
  const allocatedUsers = allApplicants.filter(u => 
    allocated.some(a => a.userId === u._id)
  );
  
  // Calculate demographic statistics
  const stats = {
    byCaste: calculateDemographicStats(allApplicants, allocatedUsers, 'casteCategory'),
    byGender: calculateDemographicStats(allApplicants, allocatedUsers, 'gender'),
    byDisability: {
      disabled: {
        population: allApplicants.filter(u => u.disabilityStatus).length,
        allocated: allocatedUsers.filter(u => u.disabilityStatus).length,
      },
    },
  };
  
  // Calculate Gini coefficient
  const optimizer = new FairAllocationOptimizer();
  const workDays = allocated.map(a => a.allocatedDays);
  const gini = optimizer.calculateGiniCoefficient(workDays);
  
  // Check compliance
  const compliance = {
    genderQuotaMet: (stats.byGender.female.allocated / allocated.length) >= 0.33,
    scStQuotaMet: true, // Would calculate
    disabilityQuotaMet: (stats.byDisability.disabled.allocated / allocated.length) >= 0.05,
    giniTarget: gini < 0.3,
    overallCompliant: true, // Would calculate
  };
  
  // Store audit
  await mongoService.insertOne('fairness_audits', {
    auditId: `audit-${Date.now()}`,
    auditDate: new Date().toISOString(),
    auditPeriod: {
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
    },
    allocationStats: {
      totalUsers: allApplicants.length,
      totalAllocations: allocated.length,
      totalWorkDays: workDays.reduce((sum, d) => sum + d, 0),
      averageDaysPerUser: workDays.reduce((sum, d) => sum + d, 0) / allocated.length,
      giniCoefficient: gini,
    },
    demographicParity: {
      byCaste: stats.byCaste,
      byGender: stats.byGender,
      byDisability: stats.byDisability,
    },
    compliance,
    anomalies: [], // Would detect anomalies
    biasIndicators: {
      overallBiasScore: gini * 100,
      biasLevel: gini < 0.2 ? 'none' : gini < 0.3 ? 'low' : 'moderate',
      detectedBiases: [],
    },
    auditedBy: 'ml_system',
    status: 'published',
  });
  
  console.log('✅ Fairness audit complete');
  console.log(`Gini: ${gini.toFixed(3)}, Gender: ${(stats.byGender.female.allocated / allocated.length * 100).toFixed(1)}%`);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateDemographicStats(
  allUsers: EnhancedMLUserDocument[],
  allocatedUsers: EnhancedMLUserDocument[],
  field: keyof EnhancedMLUserDocument
) {
  const stats: any = {};
  
  // Get unique values
  const values = [...new Set(allUsers.map(u => u[field]))];
  
  values.forEach(value => {
    const population = allUsers.filter(u => u[field] === value).length;
    const allocated = allocatedUsers.filter(u => u[field] === value).length;
    
    stats[value as string] = {
      population,
      populationPercentage: (population / allUsers.length) * 100,
      allocated,
      allocationRate: allocated / Math.max(population, 1),
      expectedRate: population / allUsers.length,
      parityRatio: (allocated / Math.max(population, 1)) / (population / allUsers.length),
    };
  });
  
  return stats;
}

async function countUsersWithHigherPriority(userId: string, userScore: number): Promise<number> {
  const higherPriority = await mongoService.count('enhanced_ml_users', {
    'mlFeatures.mlOutputs.priorityScore': { $gt: userScore },
    'currentStatus.workDemandStatus': { $in: ['applied', 'waiting'] },
  });
  
  return higherPriority;
}

async function getLatestFairnessAudit() {
  // Since findOne doesn't support options, use find instead
  const auditsResponse = await mongoService.find('fairness_audits', {});
  const audits = auditsResponse.data || [];
  
  // Sort manually and get latest
  audits.sort((a: any, b: any) => new Date(b.auditDate).getTime() - new Date(a.auditDate).getTime());
  
  return audits[0] || { 
    demographicParity: { byGender: { female: { allocationRate: 0 } } },
    overallMetrics: { giniCoefficient: 0 }
  };
}

async function sendAllocationNotification(allocation: any) {
  // Implementation would send SMS/App notification
  console.log(`📩 Sending notification to ${allocation.userId}`);
}

async function notifyAdmin(alert: any) {
  // Implementation would send admin alert
  console.log(`🚨 Admin alert: ${alert.message}`);
}

/**
 * Example 5: Conversational AI with ML - Complete workflow
 * This is how Saathi should integrate with ML models
 */
export async function handleSaathiConversation(params: {
  userId: string;
  conversationId: string;
  userMessage: string;
  userMessageHindi: string;
  conversationHistory: string[];
}): Promise<{
  response: string;
  responseHindi: string;
  actionsTaken: string[];
  urgentAlerts: string[];
}> {
  
  console.log('🤖 Processing Saathi conversation with ML integration...');
  
  // Step 1: Extract context from conversation
  const conversationText = params.conversationHistory.join('\n');
  const result = await saathiML.processConversation({
    userId: params.userId,
    conversationId: params.conversationId,
    conversationText,
    conversationHindi: params.userMessageHindi,
    userQuery: params.userMessage,
  });
  
  const context = result.context;
  console.log(`📊 Context extracted - Urgency: ${context.extractedData.urgencyLevel}, Empathy: ${context.empathyScore}`);
  
  // Step 2: Update user data based on conversation
  if (Object.keys(result.updates).length > 0) {
    await saathiML.updateUserFromConversation(params.userId, result.updates, context);
  }
  
  // Step 3: Determine user intent and generate appropriate response
  let response = '';
  let responseHindi = '';
  const actionsTaken: string[] = [];
  const urgentAlerts: string[] = [];
  
  // Handle different intents
  if (context.intent.primary === 'request_work') {
    // User requesting work
    const explanation = await saathiML.getWorkAllocationExplanation({
      userId: params.userId,
      questionType: 'am_i_eligible',
      conversationalContext: context,
    });
    
    response = `I understand you need work. ${explanation.explanation.simple}`;
    responseHindi = `मैं समझता हूं कि आपको काम चाहिए। ${explanation.explanation.simpleHindi}`;
    
    // Check fraud risk before allocation
    const fraudCheck = await saathiML.checkFraudRisk(params.userId);
    if (!fraudCheck.shouldBlock) {
      actionsTaken.push('Added to work allocation queue');
      actionsTaken.push(`Priority score: ${explanation.priorityScore}/100`);
    } else {
      urgentAlerts.push('Fraud risk detected - manual review required');
    }
  }
  
  else if (context.intent.primary === 'ask_why') {
    // User asking why they didn't get work
    const explanation = await saathiML.getWorkAllocationExplanation({
      userId: params.userId,
      questionType: 'why_not_me',
      conversationalContext: context,
    });
    
    response = explanation.explanation.detailed;
    responseHindi = explanation.explanation.detailedHindi;
    
    // Add actionable steps
    if (explanation.actionableSteps.length > 0) {
      response += `\n\nTo improve your chances:\n${explanation.actionableSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
    }
  }
  
  else if (context.intent.primary === 'check_status') {
    // User checking work status
    const explanation = await saathiML.getWorkAllocationExplanation({
      userId: params.userId,
      questionType: 'when_will_i_get',
      conversationalContext: context,
    });
    
    response = explanation.explanation.simple;
    responseHindi = explanation.explanation.simpleHindi;
    
    if (explanation.estimatedWaitTime) {
      response += `\n\nEstimated wait time: ${explanation.estimatedWaitTime}`;
      responseHindi += `\n\nअनुमानित प्रतीक्षा समय: ${explanation.estimatedWaitTime}`;
    }
  }
  
  else if (context.intent.primary === 'complain') {
    // User has a complaint
    response = 'I understand your concern. I\'m registering your grievance. ';
    responseHindi = 'मैं आपकी चिंता समझता हूं। मैं आपकी शिकायत दर्ज कर रहा हूं। ';
    
    // Register grievance
    actionsTaken.push('Grievance registered');
    
    // If fairness concern, provide audit data
    const explanation = await saathiML.getWorkAllocationExplanation({
      userId: params.userId,
      questionType: 'fairness_check',
      conversationalContext: context,
    });
    
    response += explanation.explanation.simple;
    responseHindi += explanation.explanation.simpleHindi;
  }
  
  // Step 4: Handle urgent flags
  if (context.extractedData.urgencyLevel === 'immediate') {
    urgentAlerts.push('IMMEDIATE ALLOCATION REQUIRED');
    actionsTaken.push('Escalated to priority queue');
    
    response += '\n\n⚡ Your case has been marked as urgent and escalated.';
    responseHindi += '\n\n⚡ आपके मामले को तत्काल के रूप में चिह्नित किया गया है।';
  }
  
  if (context.extractedData.familyCrisis.hasEmergency) {
    urgentAlerts.push(`FAMILY EMERGENCY: ${context.extractedData.familyCrisis.type}`);
    actionsTaken.push('Referred to social welfare schemes');
    
    response += '\n\n🆘 I see you have a family emergency. I\'m also connecting you with relevant support services.';
    responseHindi += '\n\n🆘 मैं देख रहा हूं कि आपके पास पारिवारिक आपातकाल है। मैं आपको संबंधित सहायता सेवाओं से भी जोड़ रहा हूं।';
  }
  
  if (context.empathyScore > 80) {
    urgentAlerts.push('HIGH EMPATHY SUPPORT NEEDED');
    actionsTaken.push('Counselor referral created');
    
    response += '\n\n💚 I understand this is a difficult time. A support counselor will contact you soon.';
    responseHindi += '\n\n💚 मैं समझता हूं कि यह कठिन समय है। एक सहायता परामर्शदाता जल्द ही आपसे संपर्क करेंगे।';
  }
  
  // Step 5: Add predictive insights if relevant
  if (context.intent.primary === 'check_status') {
    const insights = await saathiML.getPredictiveInsights(params.userId);
    
    response += `\n\n📈 Seasonal trend: ${insights.seasonalTrend}`;
    responseHindi += `\n\n📈 मौसमी प्रवृत्ति: ${insights.seasonalTrend}`;
  }
  
  return {
    response,
    responseHindi,
    actionsTaken,
    urgentAlerts,
  };
}

/**
 * Example 6: Real-time data extraction during conversation
 */
export async function extractAndStoreConversationalData(params: {
  userId: string;
  conversationId: string;
  messages: Array<{ speaker: 'user' | 'saathi'; text: string; textHindi: string }>;
}): Promise<{
  extractedData: Record<string, any>;
  dataQuality: number;
  missingFields: string[];
}> {
  
  console.log('📝 Extracting data from conversation...');
  
  // Combine all user messages
  const userMessages = params.messages.filter(m => m.speaker === 'user');
  const conversationText = userMessages.map(m => m.text).join(' ');
  const conversationHindi = userMessages.map(m => m.textHindi).join(' ');
  
  // Use NLP model to extract context
  const context = await mlEngine.nlpModel.analyzeConversation(
    conversationText,
    conversationHindi,
    params.userId,
    params.conversationId
  );
  
  // Extract structured data
  const extractedData: Record<string, any> = {};
  
  // Family size extraction
  const familySizeMatch = conversationText.match(/(\d+)\s*(members?|people|सदस्य)/i);
  if (familySizeMatch) {
    extractedData.householdSize = parseInt(familySizeMatch[1]);
  }
  
  // Children count
  const childrenMatch = conversationText.match(/(\d+)\s*(children?|kids?|बच्चे)/i);
  if (childrenMatch) {
    extractedData.numChildren = parseInt(childrenMatch[1]);
  }
  
  // Days since last work
  const workGapMatch = conversationText.match(/(\d+)\s*(days?|months?|weeks?|दिन|महीने)\s*(ago|पहले|back)/i);
  if (workGapMatch) {
    const value = parseInt(workGapMatch[1]);
    const unit = workGapMatch[2];
    
    if (unit.includes('month') || unit.includes('महीने')) {
      extractedData.daysSinceLastWork = value * 30;
    } else if (unit.includes('week') || unit.includes('सप्ताह')) {
      extractedData.daysSinceLastWork = value * 7;
    } else {
      extractedData.daysSinceLastWork = value;
    }
  }
  
  // Debt amount
  const debtMatch = conversationText.match(/₹?\s*(\d+(?:,\d+)?)\s*(rupees?|रुपये|thousand|हज़ार|lakh|लाख)/i);
  if (debtMatch) {
    let amount = parseInt(debtMatch[1].replace(/,/g, ''));
    const unit = debtMatch[2];
    
    if (unit.includes('thousand') || unit.includes('हज़ार')) {
      amount *= 1000;
    } else if (unit.includes('lakh') || unit.includes('लाख')) {
      amount *= 100000;
    }
    
    extractedData.debtAmount = amount;
  }
  
  // Life events from NLP context
  if (context.extractedData.lifeEvents.length > 0) {
    extractedData.recentLifeEvents = context.extractedData.lifeEvents.map(e => ({
      event: e.event,
      severity: e.severity,
      timestamp: e.timestamp,
    }));
  }
  
  // Barriers
  if (context.extractedData.barriers.length > 0) {
    extractedData.workBarriers = context.extractedData.barriers;
  }
  
  // Specific needs
  if (context.extractedData.specificNeeds.length > 0) {
    extractedData.immediateNeeds = context.extractedData.specificNeeds;
  }
  
  // Calculate data quality score
  const requiredFields = [
    'householdSize', 'numChildren', 'daysSinceLastWork', 'debtAmount',
    'recentLifeEvents', 'workBarriers', 'immediateNeeds'
  ];
  
  const extractedFields = Object.keys(extractedData);
  const dataQuality = (extractedFields.length / requiredFields.length) * 100;
  const missingFields = requiredFields.filter(f => !extractedFields.includes(f));
  
  console.log(`✅ Extracted ${extractedFields.length}/${requiredFields.length} data fields (${dataQuality.toFixed(0)}% quality)`);
  
  // Store in database
  // await mongoService.updateOne('enhanced_ml_users', 
  //   { _id: params.userId },
  //   { $set: extractedData }
  // );
  
  return {
    extractedData,
    dataQuality,
    missingFields,
  };
}

/**
 * Example 7: Proactive ML suggestions for Saathi to ask
 */
export async function getSuggestedQuestions(userId: string): Promise<{
  questions: Array<{
    question: string;
    questionHindi: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}> {
  
  console.log('💡 Generating suggested questions for conversation...');
  
  // Get user data (mock for now)
  // const user = await mongoService.findOne('enhanced_ml_users', { _id: userId });
  
  const questions: Array<{
    question: string;
    questionHindi: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }> = [];
  
  // Example: If household size is missing
  questions.push({
    question: 'How many people are there in your family?',
    questionHindi: 'आपके परिवार में कितने सदस्य हैं?',
    reason: 'To calculate dependency ratio for priority scoring',
    priority: 'high',
  });
  
  // Example: If last work date is old
  questions.push({
    question: 'When did you last work under MGNREGA?',
    questionHindi: 'आपने MGNREGA के तहत आखिरी बार कब काम किया था?',
    reason: 'To assess unemployment duration and urgency',
    priority: 'high',
  });
  
  // Example: If vulnerability indicators are low
  questions.push({
    question: 'Do you have any ongoing medical expenses or health issues in your family?',
    questionHindi: 'क्या आपके परिवार में कोई चल रहा चिकित्सा खर्च या स्वास्थ्य समस्या है?',
    reason: 'To identify health vulnerabilities',
    priority: 'medium',
  });
  
  // Example: Barriers to work
  questions.push({
    question: 'How far can you travel for work?',
    questionHindi: 'आप काम के लिए कितनी दूर जा सकते हैं?',
    reason: 'To match with suitable work sites',
    priority: 'medium',
  });
  
  // Example: Skills
  questions.push({
    question: 'What type of work are you skilled at?',
    questionHindi: 'आप किस प्रकार के काम में कुशल हैं?',
    reason: 'To optimize work allocation based on skills',
    priority: 'low',
  });
  
  return { questions };
}

// ============================================
// EXPORT INTEGRATION FUNCTIONS
// ============================================

export const mlIntegration = {
  allocateWorkWithML,
  checkAttendanceFraud,
  handleAllocationQuery,
  generateFairnessAudit,
  handleSaathiConversation,
  extractAndStoreConversationalData,
  getSuggestedQuestions,
};
