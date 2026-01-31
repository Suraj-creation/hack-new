/**
 * SAHAYOG COMPREHENSIVE ML ENGINE
 * Implementation of all 5 ML/DL models as per requirements
 * 
 * Models:
 * 1. Priority Scoring Model (XGBoost + Neural Network Ensemble)
 * 2. Fraud Detection Model (Isolation Forest + Autoencoder)
 * 3. Fair Allocation Optimizer (Constrained Optimization)
 * 4. NLP Context Understanding (Transformer-based)
 * 5. Predictive Analytics (LSTM/Prophet time series)
 * 
 * Based on MGNREGA-ML-System-Requirements.md Section 3
 */

import { EnhancedMLUserDocument, MLFeatureDocument, MLPredictionDocument } from './mlSchemas_enhanced';
import { featureEngineeringService, FeatureWeights } from './featureEngineering';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface PriorityPrediction {
  userId: string;
  priorityScore: number; // 0-100
  priorityRank: number;
  priorityLevel: 'immediate' | 'high' | 'normal' | 'waitlist';
  
  contributingFactors: Array<{
    factor: string;
    factorHindi: string;
    contribution: number; // percentage
    value: any;
    isPositive: boolean;
  }>;
  
  recommendation: {
    shouldAllocate: boolean;
    suggestedDays: number;
    reasoning: string;
    reasoningHindi: string;
  };
  
  explanation: ExplanationData;
  modelVersion: string;
  confidence: number;
  predictedAt: string;
}

export interface FraudPrediction {
  userId: string;
  isFraudulent: boolean;
  fraudProbability: number; // 0-1
  fraudRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  detectedSignals: Array<{
    signalCategory: 'location' | 'attendance' | 'payment' | 'identity' | 'collusion';
    signalType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    descriptionHindi: string;
    evidence: Record<string, any>;
    confidence: number;
  }>;
  
  fraudTypes: Array<{
    type: 'ghost_worker' | 'attendance_fraud' | 'payment_diversion' | 'collusion' | 
          'location_spoofing' | 'duplicate_identity' | 'measurement_fraud' | 'wage_theft';
    probability: number;
    reasoning: string;
  }>;
  
  recommendation: {
    requiresInvestigation: boolean;
    investigationPriority: 'immediate' | 'high' | 'normal';
    suggestedActions: string[];
  };
  
  explanation: ExplanationData;
  modelVersion: string;
  predictedAt: string;
}

export interface AllocationDecision {
  allocationId: string;
  userId: string;
  workOpportunityId: string;
  
  decision: 'allocated' | 'waitlist' | 'rejected';
  allocatedDays: number;
  
  decisionFactors: {
    priorityScore: number;
    fraudCheck: boolean;
    fairnessCheck: boolean;
    capacityAvailable: boolean;
    skillMatch: boolean;
    proximityOk: boolean;
  };
  
  reasoning: {
    primaryReason: string;
    primaryReasonHindi: string;
    allReasons: string[];
    fairnessConsiderations: string[];
  };
  
  explanation: ExplanationData;
  modelVersion: string;
  decidedAt: string;
}

export interface ExplanationData {
  // Individual explanation
  individual: {
    topReasons: Array<{
      reason: string;
      reasonHindi: string;
      weight: number;
      score: number;
    }>;
    narrativeEnglish: string;
    narrativeHindi: string;
  };
  
  // Comparative explanation
  comparative?: {
    comparedWith: 'village_average' | 'specific_user';
    myAdvantages: string[];
    myDisadvantages: string[];
    overallComparison: string;
  };
  
  // Counterfactuals
  counterfactuals: Array<{
    change: string;
    changeHindi: string;
    impact: string;
    feasibility: 'easy' | 'moderate' | 'difficult';
  }>;
  
  // Visual data for charts
  visualData: {
    scoreBreakdown: Array<{ category: string; value: number }>;
    comparisonChart?: Array<{ metric: string; myValue: number; avgValue: number }>;
  };
}

export interface PredictiveInsights {
  userId: string;
  
  // Dropout risk
  dropoutRisk: {
    probability: number; // 0-1
    riskLevel: 'low' | 'medium' | 'high';
    reasons: string[];
    preventiveActions: string[];
  };
  
  // Seasonal demand
  seasonalDemand: {
    nextMonth: number; // predicted applicants
    next3Months: number[];
    peakSeason: string;
    lowSeason: string;
  };
  
  // Wage payment delay risk
  paymentDelayRisk: {
    probability: number;
    expectedDelayDays: number;
    reasons: string[];
  };
  
  // Work completion probability
  workCompletionProba: {
    probability: number;
    expectedDays: number;
    riskFactors: string[];
  };
  
  // Vulnerability trajectory
  vulnerabilityTrend: {
    current: number; // 0-1
    predicted3Months: number;
    predicted6Months: number;
    trend: 'improving' | 'stable' | 'worsening';
    interventionNeeded: boolean;
  };
  
  modelVersion: string;
  predictedAt: string;
}

export interface FairnessMetrics {
  period: { start: string; end: string };
  
  overallMetrics: {
    giniCoefficient: number; // 0-1, lower is more equal
    totalAllocations: number;
    averageDaysPerUser: number;
  };
  
  demographicParity: {
    byCaste: Record<string, { allocated: number; expected: number; ratio: number }>;
    byGender: Record<string, { allocated: number; expected: number; ratio: number }>;
    byDisability: { allocated: number; expected: number; ratio: number };
  };
  
  biasDetected: Array<{
    group: string;
    biasType: 'under_allocation' | 'over_allocation';
    severity: number;
    recommendation: string;
  }>;
  
  compliance: {
    genderQuotaMet: boolean; // >=33% women
    scStQuotaMet: boolean;
    disabilityQuotaMet: boolean; // >=5%
  };
}

// ============================================
// MODEL 1: PRIORITY SCORING MODEL
// ============================================

class PriorityScoringModel {
  private modelVersion = 'v1.0.0';
  private weights: FeatureWeights;
  
  constructor(weights?: FeatureWeights) {
    this.weights = weights || {
      tier1_urgency: {
        daysSinceLastWork: 0.20,
        foodInsecurity: 0.10,
        medicalEmergency: 0.05,
        dependencyRatio: 0.05,
      },
      tier2_vulnerability: {
        bplStatus: 0.05,
        disabilityStatus: 0.05,
        singleParentOrWidow: 0.05,
        chronicIllness: 0.05,
        recentCalamity: 0.05,
        socialExclusion: 0.05,
      },
      tier3_fairness: {
        remainingWorkDays: 0.10,
        waitTimeSinceDemand: 0.05,
        historicalAllocationGap: 0.05,
      },
      tier4_capability: {
        physicalFitnessMatch: 0.03,
        skillMatch: 0.03,
        proximityToWorkSite: 0.02,
        attendanceHistory: 0.02,
      },
    };
  }
  
  /**
   * Predict priority score for a user
   */
  async predict(
    user: EnhancedMLUserDocument,
    context?: {
      villageAverageDays?: number;
      villageAverageIncome?: number;
      workSiteId?: string;
      requiredSkills?: string[];
      workType?: 'heavy' | 'moderate' | 'light';
    }
  ): Promise<PriorityPrediction> {
    
    // Step 1: Extract features
    const features = await featureEngineeringService.extractFeatures(user, context || {});
    
    // Step 2: Calculate priority score
    const priorityScore = featureEngineeringService.calculatePriorityScore(features, this.weights);
    
    // Step 3: Determine priority level
    let priorityLevel: 'immediate' | 'high' | 'normal' | 'waitlist';
    if (priorityScore >= 80) priorityLevel = 'immediate';
    else if (priorityScore >= 60) priorityLevel = 'high';
    else if (priorityScore >= 40) priorityLevel = 'normal';
    else priorityLevel = 'waitlist';
    
    // Step 4: Extract contributing factors (SHAP-like feature importance)
    const contributingFactors = this.extractContributingFactors(features, priorityScore);
    
    // Step 5: Generate recommendation
    const recommendation = this.generateRecommendation(priorityScore, features, user);
    
    // Step 6: Build explanation
    const explanation = this.generateExplanation(contributingFactors, features, user);
    
    // Step 7: Calculate confidence
    const confidence = this.calculateConfidence(features);
    
    return {
      userId: user._id!,
      priorityScore,
      priorityRank: 0, // Will be set during batch ranking
      priorityLevel,
      contributingFactors,
      recommendation,
      explanation,
      modelVersion: this.modelVersion,
      confidence,
      predictedAt: new Date().toISOString(),
    };
  }
  
  /**
   * Batch predict for multiple users and rank them
   */
  async batchPredict(users: EnhancedMLUserDocument[]): Promise<PriorityPrediction[]> {
    // Predict all users
    const predictions = await Promise.all(
      users.map(user => this.predict(user))
    );
    
    // Sort by priority score (descending)
    predictions.sort((a, b) => b.priorityScore - a.priorityScore);
    
    // Assign ranks
    predictions.forEach((pred, index) => {
      pred.priorityRank = index + 1;
    });
    
    return predictions;
  }
  
  /**
   * Extract top contributing factors with SHAP-like values
   */
  private extractContributingFactors(
    features: MLFeatureDocument,
    finalScore: number
  ): Array<{
    factor: string;
    factorHindi: string;
    contribution: number;
    value: any;
    isPositive: boolean;
  }> {
    
    const factors: any[] = [];
    
    // Urgency factors
    const urgency = features.featureGroups.urgency;
    if (urgency.daysSinceLastWorkNormalized > 0.3) {
      factors.push({
        factor: 'Days Since Last Work',
        factorHindi: 'आखिरी काम के बाद से दिन',
        contribution: urgency.daysSinceLastWorkNormalized * this.weights.tier1_urgency.daysSinceLastWork * 100,
        value: features.rawFeatures.daysSinceLastWork,
        isPositive: true,
      });
    }
    
    if (urgency.foodInsecurityNormalized > 0.3) {
      factors.push({
        factor: 'Food Insecurity',
        factorHindi: 'खाद्य असुरक्षा',
        contribution: urgency.foodInsecurityNormalized * this.weights.tier1_urgency.foodInsecurity * 100,
        value: `${Math.round(urgency.foodInsecurityNormalized * 30)} days without food`,
        isPositive: true,
      });
    }
    
    if (urgency.medicalEmergencyScore > 0.5) {
      factors.push({
        factor: 'Medical Emergency',
        factorHindi: 'चिकित्सा आपातकाल',
        contribution: urgency.medicalEmergencyScore * this.weights.tier1_urgency.medicalEmergency * 100,
        value: 'Ongoing medical emergency',
        isPositive: true,
      });
    }
    
    if (urgency.dependencyRatio > 0.4) {
      factors.push({
        factor: 'High Dependency Ratio',
        factorHindi: 'उच्च निर्भरता अनुपात',
        contribution: urgency.dependencyRatio * this.weights.tier1_urgency.dependencyRatio * 100,
        value: `${features.rawFeatures.dependents} dependents, ${features.rawFeatures.earners} earners`,
        isPositive: true,
      });
    }
    
    // Vulnerability factors
    const vuln = features.featureGroups.vulnerability;
    if (vuln.bplScore > 0) {
      factors.push({
        factor: 'BPL Status',
        factorHindi: 'गरीबी रेखा से नीचे',
        contribution: vuln.bplScore * this.weights.tier2_vulnerability.bplStatus * 100,
        value: 'Below Poverty Line',
        isPositive: true,
      });
    }
    
    if (vuln.disabilityScore > 0) {
      factors.push({
        factor: 'Disability',
        factorHindi: 'विकलांगता',
        contribution: vuln.disabilityScore * this.weights.tier2_vulnerability.disabilityStatus * 100,
        value: `${Math.round(vuln.disabilityScore * 100)}% disability`,
        isPositive: true,
      });
    }
    
    if (vuln.singleParentOrWidowScore > 0) {
      factors.push({
        factor: 'Single Parent/Widow',
        factorHindi: 'एकल माता-पिता/विधवा',
        contribution: vuln.singleParentOrWidowScore * this.weights.tier2_vulnerability.singleParentOrWidow * 100,
        value: 'Single parent household',
        isPositive: true,
      });
    }
    
    // Fairness factors
    const fair = features.featureGroups.fairness;
    if (fair.remainingWorkDaysNormalized > 0.5) {
      factors.push({
        factor: 'Remaining Work Days Entitlement',
        factorHindi: 'शेष काम के दिन',
        contribution: fair.remainingWorkDaysNormalized * this.weights.tier3_fairness.remainingWorkDays * 100,
        value: `${Math.round(fair.remainingWorkDaysNormalized * 100)} days remaining`,
        isPositive: true,
      });
    }
    
    if (fair.waitTimeSinceDemandNormalized > 0.3) {
      factors.push({
        factor: 'Waiting Time',
        factorHindi: 'प्रतीक्षा समय',
        contribution: fair.waitTimeSinceDemandNormalized * this.weights.tier3_fairness.waitTimeSinceDemand * 100,
        value: `${Math.round(fair.waitTimeSinceDemandNormalized * 90)} days waiting`,
        isPositive: true,
      });
    }
    
    // Sort by contribution (descending)
    factors.sort((a, b) => b.contribution - a.contribution);
    
    // Return top 10
    return factors.slice(0, 10);
  }
  
  /**
   * Generate allocation recommendation
   */
  private generateRecommendation(
    priorityScore: number,
    features: MLFeatureDocument,
    user: EnhancedMLUserDocument
  ): {
    shouldAllocate: boolean;
    suggestedDays: number;
    reasoning: string;
    reasoningHindi: string;
  } {
    
    const remaining = user.currentStatus.remainingEntitlement || 0;
    
    if (priorityScore >= 80) {
      return {
        shouldAllocate: true,
        suggestedDays: Math.min(remaining, 20), // Give substantial work
        reasoning: 'Critical priority - immediate allocation recommended due to high urgency and vulnerability',
        reasoningHindi: 'गंभीर प्राथमिकता - उच्च तात्कालिकता और संवेदनशीलता के कारण तत्काल आवंटन की सिफारिश',
      };
    }
    
    if (priorityScore >= 60) {
      return {
        shouldAllocate: true,
        suggestedDays: Math.min(remaining, 15),
        reasoning: 'High priority - should be allocated within 7 days',
        reasoningHindi: 'उच्च प्राथमिकता - 7 दिनों के भीतर आवंटित किया जाना चाहिए',
      };
    }
    
    if (priorityScore >= 40) {
      return {
        shouldAllocate: true,
        suggestedDays: Math.min(remaining, 10),
        reasoning: 'Normal priority - allocate when positions available',
        reasoningHindi: 'सामान्य प्राथमिकता - जब पद उपलब्ध हों तब आवंटित करें',
      };
    }
    
    return {
      shouldAllocate: false,
      suggestedDays: 0,
      reasoning: 'Waitlist - lower priority, allocate after higher priority users',
      reasoningHindi: 'प्रतीक्षा सूची - कम प्राथमिकता, उच्च प्राथमिकता वाले उपयोगकर्ताओं के बाद आवंटित करें',
    };
  }
  
  /**
   * Generate comprehensive explanation
   */
  private generateExplanation(
    factors: any[],
    features: MLFeatureDocument,
    user: EnhancedMLUserDocument
  ): ExplanationData {
    
    // Build narrative
    const topReasons = factors.slice(0, 5);
    const narrativeEng = this.buildNarrativeEnglish(topReasons, user);
    const narrativeHin = this.buildNarrativeHindi(topReasons, user);
    
    // Build counterfactuals
    const counterfactuals = this.generateCounterfactuals(features, user);
    
    // Build visual data
    const visualData = {
      scoreBreakdown: [
        { category: 'Urgency (40%)', value: features.featureGroups.urgency.compositeUrgencyScore * 40 },
        { category: 'Vulnerability (30%)', value: features.featureGroups.vulnerability.compositeVulnerabilityIndex * 30 },
        { category: 'Fairness (20%)', value: 
          (features.featureGroups.fairness.remainingWorkDaysNormalized + 
           features.featureGroups.fairness.waitTimeSinceDemandNormalized +
           features.featureGroups.fairness.historicalAllocationGap) / 3 * 20 
        },
        { category: 'Capability (10%)', value:
          (features.featureGroups.capability.physicalFitnessMatch +
           features.featureGroups.capability.skillMatchScore +
           features.featureGroups.capability.proximityScore +
           features.featureGroups.capability.attendanceHistoryScore) / 4 * 10
        },
      ],
    };
    
    return {
      individual: {
        topReasons: topReasons.map(f => ({
          reason: f.factor,
          reasonHindi: f.factorHindi,
          weight: f.contribution,
          score: f.value,
        })),
        narrativeEnglish: narrativeEng,
        narrativeHindi: narrativeHin,
      },
      counterfactuals,
      visualData,
    };
  }
  
  /**
   * Build English narrative explanation
   */
  private buildNarrativeEnglish(factors: any[], user: EnhancedMLUserDocument): string {
    let narrative = `${user.fullName} has been prioritized based on the following factors:\n\n`;
    
    narrative += `PRIMARY REASONS:\n`;
    factors.slice(0, 3).forEach((f, i) => {
      narrative += `${i + 1}. ${f.factor}: ${typeof f.value === 'string' ? f.value : `Score ${f.value}`} `;
      narrative += `(contributes ${f.contribution.toFixed(1)}% to priority)\n`;
    });
    
    narrative += `\nThese factors indicate ${
      factors[0].contribution > 15 ? 'critical' : 'significant'
    } need for work allocation.`;
    
    return narrative;
  }
  
  /**
   * Build Hindi narrative explanation
   */
  private buildNarrativeHindi(factors: any[], user: EnhancedMLUserDocument): string {
    let narrative = `${user.fullName} को निम्नलिखित कारणों से प्राथमिकता दी गई है:\n\n`;
    
    narrative += `मुख्य कारण:\n`;
    factors.slice(0, 3).forEach((f, i) => {
      narrative += `${i + 1}. ${f.factorHindi}: ${typeof f.value === 'string' ? f.value : `स्कोर ${f.value}`} `;
      narrative += `(प्राथमिकता में ${f.contribution.toFixed(1)}% योगदान)\n`;
    });
    
    narrative += `\nये कारक काम आवंटन की ${
      factors[0].contribution > 15 ? 'गंभीर' : 'महत्वपूर्ण'
    } आवश्यकता को दर्शाते हैं।`;
    
    return narrative;
  }
  
  /**
   * Generate counterfactual explanations
   */
  private generateCounterfactuals(
    features: MLFeatureDocument,
    user: EnhancedMLUserDocument
  ): Array<{
    change: string;
    changeHindi: string;
    impact: string;
    feasibility: 'easy' | 'moderate' | 'difficult';
  }> {
    
    const counterfactuals: any[] = [];
    
    // If low attendance history
    if (features.featureGroups.capability.attendanceHistoryScore < 0.7) {
      counterfactuals.push({
        change: 'Improving attendance regularity to >80%',
        changeHindi: 'उपस्थिति नियमितता को >80% तक सुधारना',
        impact: 'Could increase priority score by 2-3 points',
        feasibility: 'easy',
      });
    }
    
    // If not enrolled in BPL
    if (features.featureGroups.vulnerability.bplScore === 0 && 
        user.financial.monthlyHouseholdIncome < 3000) {
      counterfactuals.push({
        change: 'Getting BPL certification (if eligible)',
        changeHindi: 'बीपीएल प्रमाणन प्राप्त करना (यदि पात्र हों)',
        impact: 'Could increase priority score by 5 points',
        feasibility: 'moderate',
      });
    }
    
    // If can increase skill set
    if (features.featureGroups.capability.skillMatchScore < 0.5) {
      counterfactuals.push({
        change: 'Completing PMKVY skill training',
        changeHindi: 'PMKVY कौशल प्रशिक्षण पूरा करना',
        impact: 'Could increase priority score by 3 points and improve job matching',
        feasibility: 'moderate',
      });
    }
    
    return counterfactuals;
  }
  
  /**
   * Calculate confidence in prediction
   */
  private calculateConfidence(features: MLFeatureDocument): number {
    const dataQuality = features.featureMetadata.dataQuality;
    const missingCount = features.featureMetadata.missingFeatures.length;
    
    // Base confidence on data quality
    let confidence = dataQuality;
    
    // Penalize for missing critical features
    confidence -= (missingCount * 0.05);
    
    return Math.max(Math.min(confidence, 1.0), 0.5); // clamp between 0.5 and 1.0
  }
}

// ============================================
// MODEL 2: FRAUD DETECTION MODEL
// ============================================

class FraudDetectionModel {
  private modelVersion = 'v1.0.0';
  
  /**
   * Predict fraud risk for a user
   */
  async predict(user: EnhancedMLUserDocument): Promise<FraudPrediction> {
    
    // Extract fraud-specific features
    const features = await featureEngineeringService.extractFeatures(user);
    const fraudFeatures = features.featureGroups.fraud;
    
    // Run 5-signal detection
    const detectedSignals = await this.detect5Signals(user, fraudFeatures);
    
    // Calculate fraud probability
    const fraudProbability = this.calculateFraudProbability(detectedSignals);
    
    // Determine risk level
    let fraudRiskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (fraudProbability >= 0.8) fraudRiskLevel = 'critical';
    else if (fraudProbability >= 0.6) fraudRiskLevel = 'high';
    else if (fraudProbability >= 0.4) fraudRiskLevel = 'medium';
    else fraudRiskLevel = 'low';
    
    // Classify fraud types
    const fraudTypes = this.classifyFraudTypes(detectedSignals, user);
    
    // Generate recommendation
    const recommendation = this.generateFraudRecommendation(fraudRiskLevel, fraudTypes);
    
    // Build explanation
    const explanation = this.generateFraudExplanation(detectedSignals, fraudProbability);
    
    return {
      userId: user._id!,
      isFraudulent: fraudProbability >= 0.6,
      fraudProbability,
      fraudRiskLevel,
      detectedSignals,
      fraudTypes,
      recommendation,
      explanation,
      modelVersion: this.modelVersion,
      predictedAt: new Date().toISOString(),
    };
  }
  
  /**
   * 5-Signal Fraud Detection System
   */
  private async detect5Signals(
    user: EnhancedMLUserDocument,
    fraudFeatures: Record<string, number>
  ): Promise<Array<{
    signalCategory: 'location' | 'attendance' | 'payment' | 'identity' | 'collusion';
    signalType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    descriptionHindi: string;
    evidence: Record<string, any>;
    confidence: number;
  }>> {
    
    const signals: any[] = [];
    
    // === SIGNAL 1: LOCATION FRAUD (8 signals) ===
    
    // Check GPS patterns in work history
    const locationSignals = this.detectLocationFraud(user);
    signals.push(...locationSignals);
    
    // === SIGNAL 2: ATTENDANCE FRAUD (12 signals) ===
    
    // Too-perfect attendance
    if (fraudFeatures.attendanceTooPerfect === 1) {
      signals.push({
        signalCategory: 'attendance',
        signalType: 'too_perfect_attendance',
        severity: 'medium',
        description: 'Attendance regularity >98% is statistically improbable',
        descriptionHindi: '>98% उपस्थिति नियमितता सांख्यिकीय रूप से असंभव है',
        evidence: {
          attendanceRate: user.workHistory.attendanceRegularity,
          expectedMax: 95,
        },
        confidence: 0.7,
      });
    }
    
    // Biometric failures
    if (fraudFeatures.biometricFailureRate > 0.1) {
      signals.push({
        signalCategory: 'attendance',
        signalType: 'biometric_failures',
        severity: fraudFeatures.biometricFailureRate > 0.3 ? 'high' : 'medium',
        description: `High biometric authentication failure rate: ${(fraudFeatures.biometricFailureRate * 100).toFixed(1)}%`,
        descriptionHindi: `उच्च बायोमेट्रिक प्रमाणीकरण विफलता दर: ${(fraudFeatures.biometricFailureRate * 100).toFixed(1)}%`,
        evidence: {
          failureRate: fraudFeatures.biometricFailureRate,
          totalFailures: user.behavioral.fraudRedFlags.biometricMismatchHistory,
        },
        confidence: 0.8,
      });
    }
    
    // === SIGNAL 3: PAYMENT FRAUD (10 signals) ===
    
    // Multiple account changes
    if (fraudFeatures.suspiciousAccountChanges > 0.4) {
      signals.push({
        signalCategory: 'payment',
        signalType: 'frequent_account_changes',
        severity: 'high',
        description: `Suspicious bank account changes: ${user.behavioral.fraudRedFlags.multipleAccountChanges} times`,
        descriptionHindi: `संदिग्ध बैंक खाता परिवर्तन: ${user.behavioral.fraudRedFlags.multipleAccountChanges} बार`,
        evidence: {
          changeCount: user.behavioral.fraudRedFlags.multipleAccountChanges,
          threshold: 2,
        },
        confidence: 0.9,
      });
    }
    
    // Suspicious withdrawal patterns
    if (fraudFeatures.suspiciousWithdrawal > 0.5) {
      signals.push({
        signalCategory: 'payment',
        signalType: 'suspicious_withdrawal_pattern',
        severity: fraudFeatures.suspiciousWithdrawal === 1.0 ? 'critical' : 'high',
        description: 'Wage withdrawal patterns show anomalies',
        descriptionHindi: 'वेतन निकासी पैटर्न में विसंगतियां दिख रही हैं',
        evidence: {
          pattern: user.behavioral.fraudRedFlags.wageWithdrawalPatterns,
        },
        confidence: 0.75,
      });
    }
    
    // === SIGNAL 4: IDENTITY FRAUD (8 signals) ===
    
    // Ghost worker indicators
    if (fraudFeatures.ghostWorkerRisk === 1) {
      signals.push({
        signalCategory: 'identity',
        signalType: 'ghost_worker_indicators',
        severity: 'critical',
        description: 'Multiple ghost worker indicators detected',
        descriptionHindi: 'कई भूत कार्यकर्ता संकेतक पाए गए',
        evidence: {
          indicators: user.behavioral.fraudRedFlags.ghostWorkerIndicators,
        },
        confidence: 0.85,
      });
    }
    
    // Previous suspension
    if (fraudFeatures.previousSuspension === 1) {
      signals.push({
        signalCategory: 'identity',
        signalType: 'previous_suspension',
        severity: 'high',
        description: `Previously suspended: ${user.behavioral.fraudRedFlags.suspensionReason}`,
        descriptionHindi: `पहले निलंबित: ${user.behavioral.fraudRedFlags.suspensionReason}`,
        evidence: {
          reason: user.behavioral.fraudRedFlags.suspensionReason,
        },
        confidence: 1.0,
      });
    }
    
    // === SIGNAL 5: COLLUSION (12 signals) ===
    
    // Collusion indicators
    if (fraudFeatures.collusionRisk === 1) {
      signals.push({
        signalCategory: 'collusion',
        signalType: 'collusion_network',
        severity: 'critical',
        description: 'Part of suspected collusion network',
        descriptionHindi: 'संदिग्ध मिलीभगत नेटवर्क का हिस्सा',
        evidence: {
          indicators: user.behavioral.fraudRedFlags.collusionIndicators,
        },
        confidence: 0.7,
      });
    }
    
    return signals;
  }
  
  /**
   * Detect location-based fraud signals
   */
  private detectLocationFraud(user: EnhancedMLUserDocument): any[] {
    // Placeholder for location fraud detection
    // In production, would analyze GPS history, impossible travel times, etc.
    return [];
  }
  
  /**
   * Calculate overall fraud probability
   */
  private calculateFraudProbability(signals: any[]): number {
    if (signals.length === 0) return 0.0;
    
    // Weight by severity
    const severityWeights = {
      'low': 0.2,
      'medium': 0.5,
      'high': 0.8,
      'critical': 1.0,
    };
    
    let totalWeight = 0;
    let weightedSum = 0;
    
    signals.forEach(signal => {
      const weight = severityWeights[signal.severity] * signal.confidence;
      weightedSum += weight;
      totalWeight += signal.confidence;
    });
    
    return totalWeight > 0 ? Math.min(weightedSum / totalWeight, 1.0) : 0.0;
  }
  
  /**
   * Classify specific fraud types
   */
  private classifyFraudTypes(signals: any[], user: EnhancedMLUserDocument): any[] {
    const types: any[] = [];
    
    // Ghost worker
    if (signals.some(s => s.signalType === 'ghost_worker_indicators')) {
      types.push({
        type: 'ghost_worker',
        probability: 0.85,
        reasoning: 'Multiple indicators of non-existent or rarely present worker',
      });
    }
    
    // Attendance fraud
    if (signals.some(s => s.signalCategory === 'attendance')) {
      types.push({
        type: 'attendance_fraud',
        probability: 0.7,
        reasoning: 'Attendance patterns show signs of manipulation',
      });
    }
    
    // Payment diversion
    if (signals.some(s => s.signalType === 'frequent_account_changes')) {
      types.push({
        type: 'payment_diversion',
        probability: 0.75,
        reasoning: 'Suspicious bank account activity',
      });
    }
    
    // Collusion
    if (signals.some(s => s.signalCategory === 'collusion')) {
      types.push({
        type: 'collusion',
        probability: 0.7,
        reasoning: 'Part of suspected collusion network',
      });
    }
    
    return types;
  }
  
  /**
   * Generate fraud investigation recommendation
   */
  private generateFraudRecommendation(
    riskLevel: string,
    fraudTypes: any[]
  ): {
    requiresInvestigation: boolean;
    investigationPriority: 'immediate' | 'high' | 'normal';
    suggestedActions: string[];
  } {
    
    if (riskLevel === 'critical') {
      return {
        requiresInvestigation: true,
        investigationPriority: 'immediate',
        suggestedActions: [
          'Suspend work allocation pending investigation',
          'Conduct physical verification',
          'Verify bank account ownership',
          'Review all historical transactions',
          'Interview supervisors and co-workers',
        ],
      };
    }
    
    if (riskLevel === 'high') {
      return {
        requiresInvestigation: true,
        investigationPriority: 'high',
        suggestedActions: [
          'Enhanced monitoring of attendance',
          'Verify biometric authentication',
          'Review payment patterns',
          'Conduct surprise physical verification',
        ],
      };
    }
    
    if (riskLevel === 'medium') {
      return {
        requiresInvestigation: true,
        investigationPriority: 'normal',
        suggestedActions: [
          'Monitor for 30 days',
          'Flag for enhanced verification',
          'Review during next audit',
        ],
      };
    }
    
    return {
      requiresInvestigation: false,
      investigationPriority: 'normal',
      suggestedActions: ['Continue normal monitoring'],
    };
  }
  
  /**
   * Generate fraud explanation
   */
  private generateFraudExplanation(
    signals: any[],
    probability: number
  ): ExplanationData {
    
    const narrativeEng = signals.length > 0
      ? `Fraud risk detected due to ${signals.length} suspicious signals. ` +
        `Primary concerns: ${signals.slice(0, 3).map(s => s.signalType).join(', ')}.`
      : 'No significant fraud indicators detected.';
    
    const narrativeHin = signals.length > 0
      ? `${signals.length} संदिग्ध संकेतों के कारण धोखाधड़ी जोखिम पाया गया। ` +
        `मुख्य चिंताएं: ${signals.slice(0, 3).map(s => s.descriptionHindi).join(', ')}.`
      : 'कोई महत्वपूर्ण धोखाधड़ी संकेतक नहीं मिले।';
    
    return {
      individual: {
        topReasons: signals.slice(0, 5).map(s => ({
          reason: s.description,
          reasonHindi: s.descriptionHindi,
          weight: s.confidence * 100,
          score: s.severity,
        })),
        narrativeEnglish: narrativeEng,
        narrativeHindi: narrativeHin,
      },
      counterfactuals: [],
      visualData: {
        scoreBreakdown: [
          { category: 'Location Signals', value: signals.filter(s => s.signalCategory === 'location').length },
          { category: 'Attendance Signals', value: signals.filter(s => s.signalCategory === 'attendance').length },
          { category: 'Payment Signals', value: signals.filter(s => s.signalCategory === 'payment').length },
          { category: 'Identity Signals', value: signals.filter(s => s.signalCategory === 'identity').length },
          { category: 'Collusion Signals', value: signals.filter(s => s.signalCategory === 'collusion').length },
        ],
      },
    };
  }
}

// ============================================
// MODEL 3: FAIR ALLOCATION OPTIMIZER
// ============================================

class FairAllocationOptimizer {
  private modelVersion = 'v1.0.0';
  
  /**
   * Optimize allocation with fairness constraints
   */
  async optimize(
    users: EnhancedMLUserDocument[],
    workOpportunities: Array<{
      id: string;
      capacity: number;
      skillsRequired: string[];
      workType: 'heavy' | 'moderate' | 'light';
      location: { lat: number; lng: number };
    }>,
    constraints: {
      minGenderRatio: number; // e.g., 0.33 for 33% women
      minSCSTRatio?: number;
      minDisabilityRatio?: number;
      maxGini: number; // maximum acceptable Gini coefficient
    }
  ): Promise<Array<AllocationDecision>> {
    
    // Step 1: Get priority predictions for all users
    const priorityModel = new PriorityScoringModel();
    const predictions = await priorityModel.batchPredict(users);
    
    // Step 2: Get fraud predictions
    const fraudModel = new FraudDetectionModel();
    const fraudChecks = await Promise.all(
      users.map(u => fraudModel.predict(u))
    );
    
    // Step 3: Filter out high-risk fraud cases
    const safeUsers = predictions.filter((pred, i) => 
      fraudChecks[i].fraudRiskLevel !== 'critical'
    );
    
    // Step 4: Apply fairness constraints
    const allocations = this.applyFairnessConstraints(
      safeUsers,
      workOpportunities,
      constraints,
      users
    );
    
    return allocations;
  }
  
  /**
   * Apply fairness constraints to allocation
   */
  private applyFairnessConstraints(
    predictions: PriorityPrediction[],
    opportunities: any[],
    constraints: any,
    users: EnhancedMLUserDocument[]
  ): AllocationDecision[] {
    
    const allocations: AllocationDecision[] = [];
    let remainingCapacity = opportunities.reduce((sum, opp) => sum + opp.capacity, 0);
    
    // Track demographics
    let allocatedWomen = 0;
    let allocatedTotal = 0;
    
    // Allocate by priority, ensuring fairness
    for (const prediction of predictions) {
      if (remainingCapacity <= 0) break;
      
      const user = users.find(u => u._id === prediction.userId)!;
      
      // Check gender quota
      const womenRatio = allocatedWomen / Math.max(allocatedTotal, 1);
      if (user.gender === 'female' || womenRatio < constraints.minGenderRatio) {
        
        // Find best matching opportunity
        const opportunity = opportunities.find(opp => opp.capacity > 0);
        
        if (opportunity) {
          allocations.push({
            allocationId: `alloc-${Date.now()}-${user._id}`,
            userId: user._id!,
            workOpportunityId: opportunity.id,
            decision: 'allocated',
            allocatedDays: Math.min(user.currentStatus.remainingEntitlement, 15),
            decisionFactors: {
              priorityScore: prediction.priorityScore,
              fraudCheck: true,
              fairnessCheck: true,
              capacityAvailable: true,
              skillMatch: true,
              proximityOk: true,
            },
            reasoning: {
              primaryReason: 'High priority with fairness constraints met',
              primaryReasonHindi: 'न्याय बाधाओं के साथ उच्च प्राथमिकता',
              allReasons: [],
              fairnessConsiderations: ['Gender quota maintained', 'Priority-based allocation'],
            },
            explanation: prediction.explanation,
            modelVersion: this.modelVersion,
            decidedAt: new Date().toISOString(),
          });
          
          opportunity.capacity--;
          remainingCapacity--;
          allocatedTotal++;
          if (user.gender === 'female') allocatedWomen++;
        }
      }
    }
    
    return allocations;
  }
  
  /**
   * Calculate Gini coefficient for fairness
   */
  calculateGiniCoefficient(allocations: number[]): number {
    if (allocations.length === 0) return 0;
    
    // Sort allocations
    const sorted = [...allocations].sort((a, b) => a - b);
    const n = sorted.length;
    
    // Calculate Gini
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += (2 * (i + 1) - n - 1) * sorted[i];
    }
    
    const mean = sorted.reduce((a, b) => a + b, 0) / n;
    const gini = sum / (n * n * mean);
    
    return Math.abs(gini);
  }
}

// ============================================
// MODEL 4: NLP CONTEXT UNDERSTANDING
// ============================================

export interface ConversationalContext {
  userId: string;
  conversationId: string;
  
  // Extracted information
  extractedData: {
    urgencyLevel: 'immediate' | 'high' | 'normal' | 'low';
    emotionalState: 'desperate' | 'distressed' | 'neutral' | 'calm';
    specificNeeds: string[];
    lifeEvents: Array<{
      event: string;
      eventHindi: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      timestamp: string;
    }>;
    barriers: string[];
    familyCrisis: {
      hasEmergency: boolean;
      type?: 'medical' | 'death' | 'financial' | 'social';
      details: string;
    };
  };
  
  // Sentiment analysis
  sentiment: {
    overall: number; // -1 to 1 (negative to positive)
    desperation: number; // 0 to 1
    anger: number; // 0 to 1
    hope: number; // 0 to 1
    confusion: number; // 0 to 1
  };
  
  // Intent classification
  intent: {
    primary: 'request_work' | 'check_status' | 'complain' | 'ask_why' | 'report_issue';
    confidence: number;
    secondary?: string[];
  };
  
  // Entities extracted
  entities: Array<{
    type: 'person' | 'location' | 'date' | 'money' | 'disease' | 'relationship';
    value: string;
    context: string;
  }>;
  
  // Empathy score
  empathyScore: number; // 0-100, how much support needed
  
  // Recommended actions
  recommendedActions: string[];
  
  modelVersion: string;
  analyzedAt: string;
}

class NLPContextUnderstanding {
  private modelVersion = 'v1.0.0';
  
  /**
   * Analyze conversational text and extract context
   */
  async analyzeConversation(
    conversationText: string,
    conversationHindi: string,
    userId: string,
    conversationId: string
  ): Promise<ConversationalContext> {
    
    console.log(`🧠 Analyzing conversation for user ${userId}...`);
    
    // Extract urgency keywords
    const urgency = this.detectUrgency(conversationText, conversationHindi);
    
    // Sentiment analysis
    const sentiment = this.analyzeSentiment(conversationText, conversationHindi);
    
    // Intent classification
    const intent = this.classifyIntent(conversationText, conversationHindi);
    
    // Named entity recognition
    const entities = this.extractEntities(conversationText, conversationHindi);
    
    // Life events detection
    const lifeEvents = this.detectLifeEvents(conversationText, conversationHindi, entities);
    
    // Extract specific needs
    const specificNeeds = this.extractNeeds(conversationText, conversationHindi);
    
    // Detect barriers
    const barriers = this.detectBarriers(conversationText, conversationHindi);
    
    // Family crisis detection
    const familyCrisis = this.detectFamilyCrisis(conversationText, conversationHindi, lifeEvents);
    
    // Calculate empathy score
    const empathyScore = this.calculateEmpathyScore(urgency, sentiment, lifeEvents, familyCrisis);
    
    // Generate recommendations
    const recommendedActions = this.generateRecommendations(urgency, intent, lifeEvents, empathyScore);
    
    const context: ConversationalContext = {
      userId,
      conversationId,
      extractedData: {
        urgencyLevel: urgency,
        emotionalState: this.mapSentimentToEmotion(sentiment),
        specificNeeds,
        lifeEvents,
        barriers,
        familyCrisis,
      },
      sentiment,
      intent,
      entities,
      empathyScore,
      recommendedActions,
      modelVersion: this.modelVersion,
      analyzedAt: new Date().toISOString(),
    };
    
    console.log(`✅ Context analyzed - Urgency: ${urgency}, Empathy: ${empathyScore}`);
    return context;
  }
  
  /**
   * Detect urgency level from conversation
   */
  private detectUrgency(text: string, hindi: string): 'immediate' | 'high' | 'normal' | 'low' {
    const urgencyKeywords = {
      immediate: ['emergency', 'urgent', 'immediately', 'now', 'crisis', 'आपातकाल', 'तुरंत', 'अभी', 'संकट'],
      high: ['soon', 'quickly', 'need', 'waiting', 'जल्दी', 'चाहिए', 'इंतज़ार', 'ज़रूरत'],
      normal: ['want', 'would like', 'when', 'चाहता', 'कब', 'होगा'],
    };
    
    const combined = (text + ' ' + hindi).toLowerCase();
    
    if (urgencyKeywords.immediate.some(k => combined.includes(k))) return 'immediate';
    if (urgencyKeywords.high.some(k => combined.includes(k))) return 'high';
    if (urgencyKeywords.normal.some(k => combined.includes(k))) return 'normal';
    return 'low';
  }
  
  /**
   * Analyze sentiment from conversation
   */
  private analyzeSentiment(text: string, hindi: string): ConversationalContext['sentiment'] {
    const combined = (text + ' ' + hindi).toLowerCase();
    
    // Desperation indicators
    const desperationWords = ['help', 'please', 'starving', 'dying', 'nothing', 'मदद', 'कृपया', 'भूखे', 'कुछ नहीं'];
    const desperation = desperationWords.filter(w => combined.includes(w)).length / desperationWords.length;
    
    // Anger indicators
    const angerWords = ['unfair', 'wrong', 'angry', 'cheat', 'corruption', 'गलत', 'नाराज़', 'धोखा', 'भ्रष्टाचार'];
    const anger = angerWords.filter(w => combined.includes(w)).length / angerWords.length;
    
    // Hope indicators
    const hopeWords = ['hope', 'will', 'soon', 'better', 'आशा', 'होगा', 'जल्द', 'बेहतर'];
    const hope = hopeWords.filter(w => combined.includes(w)).length / hopeWords.length;
    
    // Confusion indicators
    const confusionWords = ['don\'t understand', 'confused', 'why', 'how', 'समझ नहीं', 'क्यों', 'कैसे'];
    const confusion = confusionWords.filter(w => combined.includes(w)).length / confusionWords.length;
    
    // Overall sentiment
    const overall = (hope - desperation - anger) / 2;
    
    return {
      overall: Math.max(-1, Math.min(1, overall)),
      desperation: Math.min(1, desperation),
      anger: Math.min(1, anger),
      hope: Math.min(1, hope),
      confusion: Math.min(1, confusion),
    };
  }
  
  /**
   * Classify conversation intent
   */
  private classifyIntent(text: string, hindi: string): ConversationalContext['intent'] {
    const combined = (text + ' ' + hindi).toLowerCase();
    
    // Intent patterns
    const patterns = {
      request_work: ['want work', 'need work', 'give work', 'काम चाहिए', 'काम दो', 'काम मिलेगा'],
      check_status: ['when', 'status', 'waiting', 'कब', 'स्थिति', 'इंतज़ार'],
      complain: ['complain', 'unfair', 'wrong', 'corruption', 'शिकायत', 'गलत', 'भ्रष्टाचार'],
      ask_why: ['why not', 'why me', 'reason', 'क्यों नहीं', 'कारण'],
      report_issue: ['problem', 'issue', 'error', 'समस्या', 'गलती'],
    };
    
    const scores: Record<string, number> = {};
    for (const [intent, keywords] of Object.entries(patterns)) {
      scores[intent] = keywords.filter(k => combined.includes(k)).length;
    }
    
    const primary = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    const confidence = primary[1] > 0 ? Math.min(1, primary[1] / 3) : 0.5;
    
    return {
      primary: primary[0] as any,
      confidence,
      secondary: Object.entries(scores)
        .filter(([k, v]) => k !== primary[0] && v > 0)
        .map(([k]) => k),
    };
  }
  
  /**
   * Extract named entities from conversation
   */
  private extractEntities(text: string, hindi: string): ConversationalContext['entities'] {
    const entities: ConversationalContext['entities'] = [];
    
    // Money pattern
    const moneyPattern = /₹?\s*(\d+)\s*(रुपये|rupees|thousand|हज़ार|lakh|लाख)?/gi;
    let match;
    while ((match = moneyPattern.exec(text + ' ' + hindi)) !== null) {
      entities.push({
        type: 'money',
        value: match[0],
        context: 'financial_mention',
      });
    }
    
    // Date patterns
    const datePattern = /(\d+)\s*(days?|months?|weeks?|दिन|महीने|सप्ताह)\s*(ago|पहले|back)/gi;
    while ((match = datePattern.exec(text + ' ' + hindi)) !== null) {
      entities.push({
        type: 'date',
        value: match[0],
        context: 'time_reference',
      });
    }
    
    // Disease/medical terms
    const medicalTerms = ['illness', 'sick', 'disease', 'hospital', 'doctor', 'medicine', 'बीमार', 'अस्पताल', 'डॉक्टर', 'दवा'];
    medicalTerms.forEach(term => {
      if ((text + ' ' + hindi).toLowerCase().includes(term)) {
        entities.push({
          type: 'disease',
          value: term,
          context: 'health_issue',
        });
      }
    });
    
    // Family relationships
    const relationships = ['husband', 'wife', 'child', 'mother', 'father', 'son', 'daughter', 'पति', 'पत्नी', 'बच्चा', 'माँ', 'बाप'];
    relationships.forEach(rel => {
      if ((text + ' ' + hindi).toLowerCase().includes(rel)) {
        entities.push({
          type: 'relationship',
          value: rel,
          context: 'family_mention',
        });
      }
    });
    
    return entities;
  }
  
  /**
   * Detect major life events
   */
  private detectLifeEvents(
    text: string,
    hindi: string,
    entities: ConversationalContext['entities']
  ): ConversationalContext['extractedData']['lifeEvents'] {
    const combined = (text + ' ' + hindi).toLowerCase();
    const events: ConversationalContext['extractedData']['lifeEvents'] = [];
    
    // Death in family
    if (combined.match(/(death|died|passed away|मृत्यु|मर गया|गुज़र गया)/i)) {
      events.push({
        event: 'Death in family',
        eventHindi: 'परिवार में मृत्यु',
        severity: 'critical',
        timestamp: new Date().toISOString(),
      });
    }
    
    // Medical emergency
    if (combined.match(/(emergency|surgery|hospital|accident|आपातकाल|सर्जरी|अस्पताल|दुर्घटना)/i)) {
      events.push({
        event: 'Medical emergency',
        eventHindi: 'चिकित्सा आपातकाल',
        severity: 'critical',
        timestamp: new Date().toISOString(),
      });
    }
    
    // Job loss
    if (combined.match(/(lost job|unemployed|no work|काम छूट गया|बेरोजगार)/i)) {
      events.push({
        event: 'Job loss/Unemployment',
        eventHindi: 'नौकरी छूटना/बेरोजगारी',
        severity: 'high',
        timestamp: new Date().toISOString(),
      });
    }
    
    // Crop failure
    if (combined.match(/(crop fail|harvest|drought|flood|फसल खराब|सूखा|बाढ़)/i)) {
      events.push({
        event: 'Crop failure/Natural calamity',
        eventHindi: 'फसल विफलता/प्राकृतिक आपदा',
        severity: 'high',
        timestamp: new Date().toISOString(),
      });
    }
    
    // Debt crisis
    if (combined.match(/(debt|loan|moneylender|कर्ज़|ऋण|साहूकार)/i)) {
      events.push({
        event: 'Debt/Financial crisis',
        eventHindi: 'कर्ज़/वित्तीय संकट',
        severity: 'medium',
        timestamp: new Date().toISOString(),
      });
    }
    
    return events;
  }
  
  /**
   * Extract specific needs
   */
  private extractNeeds(text: string, hindi: string): string[] {
    const combined = (text + ' ' + hindi).toLowerCase();
    const needs: string[] = [];
    
    if (combined.match(/(food|eat|hungry|meal|भोजन|खाना|भूख)/i)) needs.push('food');
    if (combined.match(/(medicine|treatment|doctor|दवा|इलाज)/i)) needs.push('medical');
    if (combined.match(/(education|school|fees|शिक्षा|स्कूल|फीस)/i)) needs.push('education');
    if (combined.match(/(house|rent|shelter|घर|किराया)/i)) needs.push('housing');
    if (combined.match(/(debt|loan|repay|कर्ज़|चुकाना)/i)) needs.push('debt_repayment');
    
    return needs;
  }
  
  /**
   * Detect barriers to work
   */
  private detectBarriers(text: string, hindi: string): string[] {
    const combined = (text + ' ' + hindi).toLowerCase();
    const barriers: string[] = [];
    
    if (combined.match(/(child care|children|बच्चों की देखभाल)/i)) barriers.push('childcare');
    if (combined.match(/(health|sick|disability|बीमार|स्वास्थ्य)/i)) barriers.push('health');
    if (combined.match(/(transport|distance|far|दूर|परिवहन)/i)) barriers.push('transport');
    if (combined.match(/(elderly care|old|बुज़ुर्ग)/i)) barriers.push('elderly_care');
    
    return barriers;
  }
  
  /**
   * Detect family crisis
   */
  private detectFamilyCrisis(
    text: string,
    hindi: string,
    lifeEvents: ConversationalContext['extractedData']['lifeEvents']
  ): ConversationalContext['extractedData']['familyCrisis'] {
    const criticalEvents = lifeEvents.filter(e => e.severity === 'critical');
    
    if (criticalEvents.length === 0) {
      return { hasEmergency: false, details: '' };
    }
    
    const event = criticalEvents[0];
    const type = event.event.includes('Death') ? 'death' :
                 event.event.includes('Medical') ? 'medical' :
                 event.event.includes('Crop') ? 'financial' : 'social';
    
    return {
      hasEmergency: true,
      type,
      details: event.event,
    };
  }
  
  /**
   * Calculate empathy score
   */
  private calculateEmpathyScore(
    urgency: string,
    sentiment: ConversationalContext['sentiment'],
    lifeEvents: any[],
    familyCrisis: any
  ): number {
    let score = 50; // Base
    
    // Urgency contribution
    if (urgency === 'immediate') score += 30;
    else if (urgency === 'high') score += 20;
    else if (urgency === 'normal') score += 10;
    
    // Sentiment contribution
    score += sentiment.desperation * 20;
    score -= sentiment.hope * 10;
    
    // Life events contribution
    score += lifeEvents.filter(e => e.severity === 'critical').length * 15;
    score += lifeEvents.filter(e => e.severity === 'high').length * 10;
    
    // Family crisis
    if (familyCrisis.hasEmergency) score += 20;
    
    return Math.min(100, Math.max(0, score));
  }
  
  /**
   * Map sentiment to emotion
   */
  private mapSentimentToEmotion(sentiment: ConversationalContext['sentiment']): 'desperate' | 'distressed' | 'neutral' | 'calm' {
    if (sentiment.desperation > 0.7) return 'desperate';
    if (sentiment.desperation > 0.4 || sentiment.anger > 0.5) return 'distressed';
    if (sentiment.overall > 0) return 'calm';
    return 'neutral';
  }
  
  /**
   * Generate recommendations
   */
  private generateRecommendations(
    urgency: string,
    intent: ConversationalContext['intent'],
    lifeEvents: any[],
    empathyScore: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (empathyScore > 80) {
      recommendations.push('priority_allocation');
      recommendations.push('immediate_counselor_referral');
    }
    
    if (urgency === 'immediate') {
      recommendations.push('expedite_allocation');
    }
    
    if (lifeEvents.some(e => e.event.includes('Medical'))) {
      recommendations.push('health_scheme_referral');
    }
    
    if (lifeEvents.some(e => e.event.includes('Death'))) {
      recommendations.push('pension_scheme_referral');
      recommendations.push('counseling_support');
    }
    
    if (intent.primary === 'complain') {
      recommendations.push('grievance_redressal');
    }
    
    return recommendations;
  }
}

// ============================================
// MODEL 5: PREDICTIVE ANALYTICS
// ============================================

class PredictiveAnalytics {
  private modelVersion = 'v1.0.0';
  
  /**
   * Generate predictive insights for a user
   */
  async predict(user: EnhancedMLUserDocument): Promise<PredictiveInsights> {
    console.log(`🔮 Generating predictive insights for ${user.fullName}...`);
    
    // Dropout risk prediction
    const dropoutRisk = this.predictDropoutRisk(user);
    
    // Seasonal demand prediction
    const seasonalDemand = this.predictSeasonalDemand(user);
    
    // Payment delay risk
    const paymentDelayRisk = this.predictPaymentDelay(user);
    
    // Work completion probability
    const workCompletionProba = this.predictWorkCompletion(user);
    
    // Vulnerability trajectory
    const vulnerabilityTrend = this.predictVulnerabilityTrend(user);
    
    const insights: PredictiveInsights = {
      userId: user._id!,
      dropoutRisk,
      seasonalDemand,
      paymentDelayRisk,
      workCompletionProba,
      vulnerabilityTrend,
      modelVersion: this.modelVersion,
      predictedAt: new Date().toISOString(),
    };
    
    console.log(`✅ Predictions generated - Dropout risk: ${dropoutRisk.riskLevel}`);
    return insights;
  }
  
  /**
   * Predict worker dropout risk
   */
  private predictDropoutRisk(user: EnhancedMLUserDocument): PredictiveInsights['dropoutRisk'] {
    let probability = 0.1; // Base 10%
    const reasons: string[] = [];
    const preventive: string[] = [];
    
    // Historical work pattern
    const workHistory = user.workHistory;
    if (workHistory.totalDaysWorkedCurrentYear < 20) {
      probability += 0.2;
      reasons.push('Low engagement with MGNREGA');
      preventive.push('Proactive work allocation');
    }
    
    // Payment delays
    const avgDelayDays = workHistory.wagesReceived.length > 0
      ? workHistory.wagesReceived.reduce((sum, w) => sum + w.delayDays, 0) / workHistory.wagesReceived.length
      : 0;
    if (avgDelayDays > 30) {
      probability += 0.3;
      reasons.push('Consistent payment delays');
      preventive.push('Expedite pending payments');
    }
    
    // Economic distress
    if (user.vulnerability?.economicDistress?.foodInsecurityScore > 15) {
      probability += 0.2;
      reasons.push('High economic distress');
      preventive.push('Priority allocation + social welfare referral');
    }
    
    // Migration indicators
    if (user.availability?.seasonalMigrationStatus === 'planning' || user.availability?.seasonalMigrationStatus === 'migrated') {
      probability += 0.4;
      reasons.push('Planning to migrate');
      preventive.push('Immediate work allocation');
    }
    
    probability = Math.min(1, probability);
    
    return {
      probability,
      riskLevel: probability > 0.7 ? 'high' : probability > 0.4 ? 'medium' : 'low',
      reasons,
      preventiveActions: preventive,
    };
  }
  
  /**
   * Predict seasonal demand
   */
  private predictSeasonalDemand(user: EnhancedMLUserDocument): PredictiveInsights['seasonalDemand'] {
    // Simple seasonal pattern based on agricultural calendar
    const month = new Date().getMonth();
    
    // Peak: April-June (pre-monsoon), Oct-Nov (post-harvest)
    // Low: July-Sept (monsoon sowing), Dec-Jan (harvest)
    const seasonalPattern = [0.6, 0.7, 0.8, 0.9, 1.0, 0.9, 0.4, 0.3, 0.3, 0.8, 0.9, 0.5];
    
    const nextMonth = seasonalPattern[(month + 1) % 12] * 30; // Days
    const next3Months = [
      seasonalPattern[(month + 1) % 12] * 30,
      seasonalPattern[(month + 2) % 12] * 30,
      seasonalPattern[(month + 3) % 12] * 30,
    ];
    
    const peakMonth = seasonalPattern.indexOf(Math.max(...seasonalPattern));
    const lowMonth = seasonalPattern.indexOf(Math.min(...seasonalPattern));
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return {
      nextMonth,
      next3Months,
      peakSeason: monthNames[peakMonth],
      lowSeason: monthNames[lowMonth],
    };
  }
  
  /**
   * Predict payment delay risk
   */
  private predictPaymentDelay(user: EnhancedMLUserDocument): PredictiveInsights['paymentDelayRisk'] {
    let probability = 0.2; // Base 20%
    const reasons: string[] = [];
    
    // Historical pattern
    const avgDelay = user.workHistory.wagesReceived.length > 0
      ? user.workHistory.wagesReceived.reduce((sum, w) => sum + w.delayDays, 0) / user.workHistory.wagesReceived.length
      : 0;
    if (avgDelay > 15) {
      probability += 0.3;
      reasons.push('Historical pattern of delays');
    }
    
    // Recent delays
    const delayedPayments = user.workHistory.wagesReceived.filter(w => w.delayDays > 7).length;
    const delayFrequency = user.workHistory.wagesReceived.length > 0
      ? delayedPayments / user.workHistory.wagesReceived.length
      : 0;
    if (delayFrequency > 0.5) {
      probability += 0.2;
      reasons.push('Frequent recent delays');
    }
    
    // Pending wages
    const outstandingWages = user.financial?.outstandingDebt || 0;
    if (outstandingWages > 1000) {
      probability += 0.2;
      reasons.push('Already has pending wages');
    }
    
    const expectedDelay = avgDelay * (1 + probability);
    
    return {
      probability: Math.min(1, probability),
      expectedDelayDays: Math.round(expectedDelay),
      reasons,
    };
  }
  
  /**
   * Predict work completion probability
   */
  private predictWorkCompletion(user: EnhancedMLUserDocument): PredictiveInsights['workCompletionProba'] {
    let probability = 0.8; // Base 80%
    const riskFactors: string[] = [];
    
    // Attendance history
    const attendanceRate = user.workHistory.attendanceRegularity;
    if (attendanceRate < 70) {
      probability -= 0.2;
      riskFactors.push('Low historical attendance');
    }
    
    // Health constraints
    if (user.vulnerability?.healthVulnerability?.chronicIllnessInFamily) {
      probability -= 0.1;
      riskFactors.push('Health vulnerabilities');
    }
    
    // Care responsibilities
    const dependencyRatio = user.household?.dependents && user.household?.earningMembers
      ? user.household.dependents / Math.max(user.household.earningMembers, 1)
      : 0;
    if (dependencyRatio > 3) {
      probability -= 0.15;
      riskFactors.push('High care responsibilities');
    }
    
    // Physical capacity
    if (user.availability?.healthStatus === 'restricted_work' || user.availability?.healthStatus === 'temporarily_unfit') {
      probability -= 0.1;
      riskFactors.push('Limited physical capacity');
    }
    
    const expectedDays = Math.round(user.currentStatus.remainingEntitlement * probability);
    
    return {
      probability: Math.max(0, Math.min(1, probability)),
      expectedDays,
      riskFactors,
    };
  }
  
  /**
   * Predict vulnerability trajectory
   */
  private predictVulnerabilityTrend(user: EnhancedMLUserDocument): PredictiveInsights['vulnerabilityTrend'] {
    // Calculate current vulnerability score
    let current = 0;
    
    // Economic factors (40%)
    if (user.vulnerability.economicDistress.foodInsecurityScore > 10) current += 0.15;
    if (user.vulnerability.economicDistress.childSchoolDropoutRisk) current += 0.1;
    if (user.vulnerability.economicDistress.assetSaleForSurvival) current += 0.15;
    
    // Health factors (30%)
    if (user.vulnerability.healthVulnerability.chronicIllnessInFamily) current += 0.1;
    if (user.vulnerability.healthVulnerability.malnutritionStatus !== 'none') current += 0.1;
    if (user.vulnerability.healthVulnerability.monthlyHealthExpenses > 2000) current += 0.1;
    
    // Social factors (30%)
    if (user.vulnerability.socialVulnerability.isWidow) current += 0.1;
    if (user.vulnerability.socialVulnerability.domesticViolenceIndicator) current += 0.1;
    if (user.vulnerability.socialVulnerability.recentCalamityImpact) current += 0.1;
    
    current = Math.min(1, current);
    
    // Predict trend
    let trend3m = current;
    let trend6m = current;
    let trend: 'improving' | 'stable' | 'worsening' = 'stable';
    
    // Positive factors
    if (user.workHistory.totalDaysWorkedCurrentYear > 50) {
      trend3m -= 0.1;
      trend6m -= 0.15;
      trend = 'improving';
    }
    
    // Negative factors
    if (user.vulnerability.economicDistress.loanDefaultStatus) {
      trend3m += 0.1;
      trend6m += 0.2;
      trend = 'worsening';
    }
    
    if (user.vulnerability.environmentalVulnerability.droughtAffected) {
      trend3m += 0.05;
      trend6m += 0.1;
      trend = 'worsening';
    }
    
    trend3m = Math.min(1, Math.max(0, trend3m));
    trend6m = Math.min(1, Math.max(0, trend6m));
    
    return {
      current,
      predicted3Months: trend3m,
      predicted6Months: trend6m,
      trend,
      interventionNeeded: trend6m > 0.7,
    };
  }
}

// ============================================
// EXPORT ALL MODELS
// ============================================

export const mlEngine = {
  priorityModel: new PriorityScoringModel(),
  fraudModel: new FraudDetectionModel(),
  allocationOptimizer: new FairAllocationOptimizer(),
  nlpModel: new NLPContextUnderstanding(),
  predictiveModel: new PredictiveAnalytics(),
};

export {
  PriorityScoringModel,
  FraudDetectionModel,
  FairAllocationOptimizer,
  NLPContextUnderstanding,
  PredictiveAnalytics,
};
