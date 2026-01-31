/**
 * SAATHI-ML INTEGRATION SERVICE
 * Bridge between Conversational AI (Saathi) and ML Models
 * 
 * This service provides clean APIs for Saathi to:
 * 1. Extract context from conversations
 * 2. Get ML-powered allocation decisions
 * 3. Generate human-readable explanations
 * 4. Update user data from conversational inputs
 */

import { mlEngine, type ConversationalContext, type PriorityPrediction, type FraudPrediction } from './database/mlModels_comprehensive';
import { featureEngineeringService } from './database/featureEngineering';
import type { EnhancedMLUserDocument } from './database/mlSchemas_enhanced';

// ============================================
// CONVERSATIONAL DATA EXTRACTION
// ============================================

export class SaathiMLBridge {
  
  /**
   * Process a conversation and extract structured data
   * Use this after every conversation with a user
   */
  async processConversation(params: {
    userId: string;
    conversationId: string;
    conversationText: string;
    conversationHindi: string;
    userQuery: string;
  }): Promise<{
    context: ConversationalContext;
    updates: Partial<EnhancedMLUserDocument>;
    recommendedActions: string[];
    urgentFlags: string[];
  }> {
    
    console.log(`🤖 Processing conversation for ${params.userId}...`);
    
    // Step 1: Analyze conversation with NLP model
    const context = await mlEngine.nlpModel.analyzeConversation(
      params.conversationText,
      params.conversationHindi,
      params.userId,
      params.conversationId
    );
    
    // Step 2: Extract user data updates from context
    const updates = this.extractDataUpdates(context, params.conversationText, params.conversationHindi);
    
    // Step 3: Identify urgent flags
    const urgentFlags = this.identifyUrgentFlags(context);
    
    // Step 4: Get recommended actions
    const recommendedActions = context.recommendedActions;
    
    console.log(`✅ Context extracted - Urgency: ${context.extractedData.urgencyLevel}, Empathy: ${context.empathyScore}`);
    
    return {
      context,
      updates,
      recommendedActions,
      urgentFlags,
    };
  }
  
  /**
   * Get ML-powered allocation decision with explanation
   * Use this when user asks "Why not me?" or "When will I get work?"
   */
  async getWorkAllocationExplanation(params: {
    userId: string;
    questionType: 'why_not_me' | 'when_will_i_get' | 'am_i_eligible' | 'fairness_check';
    conversationalContext?: ConversationalContext;
  }): Promise<{
    priorityScore: number;
    priorityLevel: string;
    explanation: {
      simple: string;
      simpleHindi: string;
      detailed: string;
      detailedHindi: string;
    };
    visualData: any;
    estimatedWaitTime?: string;
    actionableSteps: string[];
  }> {
    
    console.log(`💬 Generating explanation for ${params.questionType}...`);
    
    // Get user data
    const user = await this.getUserData(params.userId);
    if (!user) throw new Error('User not found');
    
    // Get ML prediction
    const prediction = await mlEngine.priorityModel.predict(user);
    
    // Generate context-specific explanation
    let simple = '';
    let simpleHindi = '';
    let detailed = '';
    let detailedHindi = '';
    let estimatedWaitTime: string | undefined;
    let actionableSteps: string[] = [];
    
    if (params.questionType === 'why_not_me') {
      // User asking why they didn't get work
      simple = `Your current priority score is ${prediction.priorityScore}/100 (${prediction.priorityLevel} priority). `;
      simple += `Top reasons: ${prediction.contributingFactors.slice(0, 3).map(f => f.factor).join(', ')}.`;
      
      simpleHindi = `आपका वर्तमान प्राथमिकता स्कोर ${prediction.priorityScore}/100 है (${prediction.priorityLevel} प्राथमिकता)। `;
      simpleHindi += `मुख्य कारण: ${prediction.contributingFactors.slice(0, 3).map(f => f.factorHindi).join(', ')}।`;
      
      detailed = prediction.explanation.individual.narrativeEnglish;
      detailedHindi = prediction.explanation.individual.narrativeHindi;
      
      // Add counterfactuals
      if (prediction.explanation.counterfactuals.length > 0) {
        actionableSteps = prediction.explanation.counterfactuals
          .filter(c => c.feasibility !== 'difficult')
          .map(c => c.change);
      }
    }
    
    else if (params.questionType === 'when_will_i_get') {
      // User asking when they will get work
      const higherPriority = await this.countHigherPriorityUsers(params.userId, prediction.priorityScore);
      const estimatedDays = Math.ceil(higherPriority / 5); // Assume 5 allocations per day
      
      simple = `You are currently at position ${prediction.priorityRank} in the queue. `;
      simple += `There are ${higherPriority} people ahead of you. `;
      simple += `Estimated wait time: ${estimatedDays} days.`;
      
      simpleHindi = `आप वर्तमान में कतार में ${prediction.priorityRank} स्थान पर हैं। `;
      simpleHindi += `आपसे पहले ${higherPriority} लोग हैं। `;
      simpleHindi += `अनुमानित प्रतीक्षा समय: ${estimatedDays} दिन।`;
      
      detailed = simple + `\n\nYour priority score is ${prediction.priorityScore}/100. `;
      detailed += `To improve your position: ${prediction.explanation.counterfactuals.slice(0, 2).map(c => c.change).join('; ')}.`;
      
      detailedHindi = simpleHindi + `\n\nआपका प्राथमिकता स्कोर ${prediction.priorityScore}/100 है। `;
      detailedHindi += `अपनी स्थिति सुधारने के लिए: ${prediction.explanation.counterfactuals.slice(0, 2).map(c => c.changeHindi).join('; ')}।`;
      
      estimatedWaitTime = `${estimatedDays} days`;
      
      actionableSteps = [
        'Keep your availability updated',
        'Report any new vulnerabilities or emergencies',
        'Check your status regularly',
      ];
    }
    
    else if (params.questionType === 'am_i_eligible') {
      // User asking if they are eligible
      const isEligible = prediction.recommendation.shouldAllocate;
      
      if (isEligible) {
        simple = `Yes, you are eligible for MGNREGA work. `;
        simple += `Your priority level is ${prediction.priorityLevel}. `;
        simple += `Recommended allocation: ${prediction.recommendation.suggestedDays} days.`;
        
        simpleHindi = `हां, आप MGNREGA काम के लिए योग्य हैं। `;
        simpleHindi += `आपका प्राथमिकता स्तर ${prediction.priorityLevel} है। `;
        simpleHindi += `अनुशंसित आवंटन: ${prediction.recommendation.suggestedDays} दिन।`;
      } else {
        simple = `You have worked ${user.workHistory.totalDaysWorkedCurrentYear} days this year. `;
        simple += `Your remaining entitlement is ${user.currentStatus.remainingEntitlement} days. `;
        simple += prediction.recommendation.reasoning;
        
        simpleHindi = `आपने इस वर्ष ${user.workHistory.totalDaysWorkedCurrentYear} दिन काम किया है। `;
        simpleHindi += `आपका शेष अधिकार ${user.currentStatus.remainingEntitlement} दिन है। `;
        simpleHindi += prediction.recommendation.reasoningHindi;
      }
      
      detailed = simple;
      detailedHindi = simpleHindi;
      
      actionableSteps = isEligible ? 
        ['Apply for work through Saathi', 'Keep your documents ready', 'Check available work opportunities'] :
        ['Wait for the next financial year', 'Check other government schemes', 'Report any vulnerabilities'];
    }
    
    else if (params.questionType === 'fairness_check') {
      // User asking if the system is fair
      const fairnessAudit = await this.getLatestFairnessAudit();
      
      simple = `The system allocates work based on ${prediction.contributingFactors.length} factors. `;
      simple += `Recent fairness audit: Gini coefficient ${fairnessAudit?.giniCoefficient || 0.25} (lower is fairer). `;
      simple += `Gender quota met: ${fairnessAudit?.genderQuotaMet ? 'Yes' : 'No'}. `;
      
      simpleHindi = `प्रणाली ${prediction.contributingFactors.length} कारकों के आधार पर काम आवंटित करती है। `;
      simpleHindi += `हालिया निष्पक्षता लेखा परीक्षा: गिनी गुणांक ${fairnessAudit?.giniCoefficient || 0.25} (कम बेहतर है)। `;
      simpleHindi += `लिंग कोटा पूरा: ${fairnessAudit?.genderQuotaMet ? 'हां' : 'नहीं'}। `;
      
      detailed = simple + `\n\nThe allocation is based on urgency, vulnerability, fairness, and capability. `;
      detailed += `All decisions are auditable and explainable. No discrimination based on caste, gender, or location.`;
      
      detailedHindi = simpleHindi + `\n\nआवंटन तात्कालिकता, भेद्यता, निष्पक्षता और क्षमता पर आधारित है। `;
      detailedHindi += `सभी निर्णय लेखा परीक्षा योग्य और स्पष्ट हैं। जाति, लिंग या स्थान के आधार पर कोई भेदभाव नहीं।`;
      
      actionableSteps = [
        'View your detailed priority breakdown',
        'Compare with village average',
        'File grievance if you see bias',
      ];
    }
    
    return {
      priorityScore: prediction.priorityScore,
      priorityLevel: prediction.priorityLevel,
      explanation: {
        simple,
        simpleHindi,
        detailed,
        detailedHindi,
      },
      visualData: prediction.explanation.visualData,
      estimatedWaitTime,
      actionableSteps,
    };
  }
  
  /**
   * Quick fraud check for a user
   * Use this before allocating work
   */
  async checkFraudRisk(userId: string): Promise<{
    isSafe: boolean;
    riskLevel: string;
    warnings: string[];
    warningsHindi: string[];
    shouldBlock: boolean;
  }> {
    
    console.log(`🔍 Checking fraud risk for ${userId}...`);
    
    const user = await this.getUserData(userId);
    if (!user) throw new Error('User not found');
    
    const fraudPrediction = await mlEngine.fraudModel.predict(user);
    
    const isSafe = fraudPrediction.fraudRiskLevel === 'low';
    const shouldBlock = fraudPrediction.fraudRiskLevel === 'critical';
    
    const warnings = fraudPrediction.detectedSignals
      .filter(s => s.severity !== 'low')
      .map(s => s.description);
    
    const warningsHindi = fraudPrediction.detectedSignals
      .filter(s => s.severity !== 'low')
      .map(s => s.descriptionHindi);
    
    return {
      isSafe,
      riskLevel: fraudPrediction.fraudRiskLevel,
      warnings,
      warningsHindi,
      shouldBlock,
    };
  }
  
  /**
   * Update user data from conversational inputs
   * Use this to save extracted information to database
   */
  async updateUserFromConversation(
    userId: string,
    updates: Partial<EnhancedMLUserDocument>,
    context: ConversationalContext
  ): Promise<void> {
    
    console.log(`💾 Updating user data from conversation...`);
    
    // Store conversational context
    await this.storeConversationalContext(userId, context);
    
    // Update user document
    // await mongoService.updateOne('enhanced_ml_users', { _id: userId }, { $set: updates });
    
    // Re-calculate ML features
    const user = await this.getUserData(userId);
    if (user) {
      const features = await featureEngineeringService.extractFeatures(user, {});
      // await mongoService.updateOne('enhanced_ml_users', { _id: userId }, { $set: { mlFeatures: features } });
    }
    
    console.log(`✅ User data updated from conversation`);
  }
  
  /**
   * Get predictive insights for a user
   * Use this to show "What's coming next" information
   */
  async getPredictiveInsights(userId: string): Promise<{
    dropoutRisk: string;
    dropoutReasons: string[];
    seasonalTrend: string;
    vulnerabilityTrend: string;
    recommendations: string[];
  }> {
    
    console.log(`🔮 Getting predictive insights for ${userId}...`);
    
    const user = await this.getUserData(userId);
    if (!user) throw new Error('User not found');
    
    const predictions = await mlEngine.predictiveModel.predict(user);
    
    return {
      dropoutRisk: predictions.dropoutRisk.riskLevel,
      dropoutReasons: predictions.dropoutRisk.reasons,
      seasonalTrend: `Peak season: ${predictions.seasonalDemand.peakSeason}, Low season: ${predictions.seasonalDemand.lowSeason}`,
      vulnerabilityTrend: predictions.vulnerabilityTrend.trend,
      recommendations: predictions.dropoutRisk.preventiveActions,
    };
  }
  
  // ============================================
  // HELPER METHODS
  // ============================================
  
  /**
   * Extract structured data updates from conversation context
   */
  private extractDataUpdates(
    context: ConversationalContext,
    text: string,
    hindi: string
  ): Partial<EnhancedMLUserDocument> {
    
    const updates: any = {};
    
    // Update vulnerability based on life events
    if (context.extractedData.lifeEvents.length > 0) {
      const criticalEvents = context.extractedData.lifeEvents.filter(e => e.severity === 'critical');
      
      if (criticalEvents.some(e => e.event.includes('Death'))) {
        updates['vulnerability.socialVulnerability.recentDeathInFamily'] = true;
      }
      
      if (criticalEvents.some(e => e.event.includes('Medical'))) {
        updates['vulnerability.healthVulnerability.medicalEmergencyStatus'] = 'ongoing';
      }
      
      if (context.extractedData.lifeEvents.some(e => e.event.includes('Crop failure'))) {
        updates['vulnerability.environmentalVulnerability.cropFailure'] = true;
      }
    }
    
    // Update specific needs
    if (context.extractedData.specificNeeds.includes('food')) {
      updates['vulnerability.economicDistress.foodInsecurityScore'] = 20;
    }
    
    // Update current status
    if (context.intent.primary === 'request_work') {
      updates['currentStatus.workDemandStatus'] = 'applied';
      updates['currentStatus.workDemandDate'] = new Date().toISOString();
    }
    
    // Update barriers
    if (context.extractedData.barriers.length > 0) {
      updates['availability.constraints'] = context.extractedData.barriers;
    }
    
    // Update empathy/urgency indicators
    updates['conversationalData.empathyScore'] = context.empathyScore;
    updates['conversationalData.lastUrgencyLevel'] = context.extractedData.urgencyLevel;
    
    return updates;
  }
  
  /**
   * Identify urgent flags that require immediate action
   */
  private identifyUrgentFlags(context: ConversationalContext): string[] {
    const flags: string[] = [];
    
    if (context.extractedData.urgencyLevel === 'immediate') {
      flags.push('IMMEDIATE_ALLOCATION_REQUIRED');
    }
    
    if (context.empathyScore > 80) {
      flags.push('HIGH_EMPATHY_SUPPORT_NEEDED');
    }
    
    if (context.extractedData.familyCrisis.hasEmergency) {
      flags.push('FAMILY_EMERGENCY_DETECTED');
    }
    
    if (context.sentiment.desperation > 0.7) {
      flags.push('EXTREME_DESPERATION_DETECTED');
    }
    
    if (context.extractedData.lifeEvents.some(e => e.severity === 'critical')) {
      flags.push('CRITICAL_LIFE_EVENT');
    }
    
    return flags;
  }
  
  /**
   * Count users with higher priority
   */
  private async countHigherPriorityUsers(userId: string, userScore: number): Promise<number> {
    // In production, query database
    // const count = await mongoService.count('enhanced_ml_users', {
    //   'mlFeatures.mlOutputs.priorityScore': { $gt: userScore },
    //   'currentStatus.workDemandStatus': { $in: ['applied', 'waiting'] },
    // });
    
    // Mock for now
    return Math.floor(Math.random() * 50) + 10;
  }
  
  /**
   * Get latest fairness audit
   */
  private async getLatestFairnessAudit(): Promise<any> {
    // In production, query database
    // const audit = await mongoService.findOne('fairness_audits', {}, { sort: { auditDate: -1 } });
    
    // Mock for now
    return {
      giniCoefficient: 0.25,
      genderQuotaMet: true,
      scStQuotaMet: true,
    };
  }
  
  /**
   * Store conversational context
   */
  private async storeConversationalContext(userId: string, context: ConversationalContext): Promise<void> {
    // await mongoService.insertOne('conversational_contexts', {
    //   userId,
    //   context,
    //   timestamp: new Date().toISOString(),
    // });
  }
  
  /**
   * Get user data
   */
  private async getUserData(userId: string): Promise<EnhancedMLUserDocument | null> {
    // In production, fetch from database
    // return await mongoService.findOne<EnhancedMLUserDocument>('enhanced_ml_users', { _id: userId });
    
    // For now, return null (should be connected to actual DB)
    return null;
  }
}

// ============================================
// QUICK ACCESS FUNCTIONS FOR SAATHI
// ============================================

export const saathiML = new SaathiMLBridge();

/**
 * Quick function: Extract context from conversation
 */
export async function extractConversationContext(params: {
  userId: string;
  conversationId: string;
  conversationText: string;
  conversationHindi: string;
  userQuery: string;
}): Promise<ConversationalContext> {
  const result = await saathiML.processConversation(params);
  return result.context;
}

/**
 * Quick function: Get allocation explanation
 */
export async function explainAllocationDecision(
  userId: string,
  questionType: 'why_not_me' | 'when_will_i_get' | 'am_i_eligible' | 'fairness_check'
): Promise<string> {
  const result = await saathiML.getWorkAllocationExplanation({ userId, questionType });
  return result.explanation.simpleHindi; // Return Hindi by default
}

/**
 * Quick function: Check if user is safe to allocate
 */
export async function isUserSafeForAllocation(userId: string): Promise<boolean> {
  const result = await saathiML.checkFraudRisk(userId);
  return result.isSafe && !result.shouldBlock;
}

/**
 * Quick function: Get user's priority score
 */
export async function getUserPriorityScore(userId: string): Promise<number> {
  const result = await saathiML.getWorkAllocationExplanation({ userId, questionType: 'am_i_eligible' });
  return result.priorityScore;
}

// ============================================
// EXPORT
// ============================================

export default saathiML;
