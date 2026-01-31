/**
 * SAHAYOG ML/DL Engine
 * Comprehensive Machine Learning for Fraud Detection, Fair Allocation, and Bias Removal
 * 
 * Based on unified.md Module 7 (Fairness Engine) & Module 11 (Fraud Detection)
 * Designed for conversational AI integration with explainable reasoning
 */

import { 
  MLUserDocument, 
  MGNREGAWorkRecord, 
  PaymentTransaction, 
  MLFeatureRecord,
  SchemeEnrollment 
} from './database/mlSchemas';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface FraudPrediction {
  userId: string;
  isFraudulent: boolean;
  fraudType?: FraudType;
  confidence: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  anomalies: AnomalyDetail[];
  explanation: ExplainableReasoning;
  modelVersion: string;
  predictedAt: string;
}

export interface AnomalyDetail {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  descriptionHindi: string;
  evidence: Record<string, any>;
  weight: number;
}

export type FraudType = 
  | 'ghost_worker'           // Non-existent worker
  | 'attendance_fraud'       // Fake attendance
  | 'payment_diversion'      // Wages going to wrong account
  | 'collusion'              // Worker-official collusion
  | 'location_spoofing'      // Fake GPS location
  | 'duplicate_identity'     // Same person multiple identities
  | 'measurement_fraud'      // Work measurement manipulation
  | 'wage_theft';            // Intermediary siphoning

export interface FairAllocationScore {
  userId: string;
  allocationScore: number;        // 0-100, higher = more deserving
  priorityRank: number;           // Rank among all users
  eligibilityFactors: EligibilityFactor[];
  needScore: number;              // Economic need assessment
  waitingDays: number;            // Days since last work
  historicalAccess: number;       // Previous access to schemes (lower = more deserving)
  recommendation: AllocationRecommendation;
  explanation: ExplainableReasoning;
}

export interface EligibilityFactor {
  factor: string;
  factorHindi: string;
  weight: number;
  score: number;
  maxScore: number;
  isPositive: boolean;
  description: string;
  descriptionHindi: string;
}

export interface AllocationRecommendation {
  shouldAllocate: boolean;
  priority: 'immediate' | 'high' | 'normal' | 'waitlist';
  daysToWork: number;
  reasonCode: string;
  reasonEnglish: string;
  reasonHindi: string;
}

export interface BiasAnalysis {
  overallBiasScore: number;       // 0-100, lower = fairer
  biasLevel: 'none' | 'low' | 'moderate' | 'high' | 'severe';
  demographicParity: DemographicParityCheck[];
  statisticalAnomalies: StatisticalAnomaly[];
  recommendations: BiasRemediation[];
  explanation: ExplainableReasoning;
}

export interface DemographicParityCheck {
  dimension: 'caste' | 'gender' | 'age' | 'disability' | 'location' | 'income';
  groups: { 
    name: string; 
    population: number; 
    allocated: number; 
    expectedRate: number; 
    actualRate: number; 
    parity: number; // 1.0 = perfect parity
  }[];
  isBalanced: boolean;
  deviation: number;
}

export interface StatisticalAnomaly {
  type: string;
  description: string;
  descriptionHindi: string;
  affectedGroup: string;
  severity: 'low' | 'medium' | 'high';
  evidence: Record<string, number>;
}

export interface BiasRemediation {
  action: string;
  actionHindi: string;
  priority: 'immediate' | 'short_term' | 'long_term';
  expectedImpact: string;
}

export interface ExplainableReasoning {
  summary: string;
  summaryHindi: string;
  factors: {
    name: string;
    nameHindi: string;
    value: string | number;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
    explanation: string;
    explanationHindi: string;
  }[];
  confidence: number;
  dataQuality: 'high' | 'medium' | 'low';
  humanReadable: string;
  humanReadableHindi: string;
  conversationalResponse: string;
  conversationalResponseHindi: string;
}

export interface AllocationQuery {
  userId: string;
  question: string;
  questionType: 'why_not_allocated' | 'when_will_get_work' | 'allocation_status' | 'fairness_check';
}

export interface AllocationQueryResponse {
  query: AllocationQuery;
  answer: string;
  answerHindi: string;
  reasoning: ExplainableReasoning;
  nextSteps: string[];
  nextStepsHindi: string[];
  relatedSchemes?: string[];
  appealProcess?: string;
}

// ============================================
// ML MODEL CONFIGURATIONS
// ============================================

interface ModelWeights {
  fraud: FraudModelWeights;
  allocation: AllocationModelWeights;
  bias: BiasModelWeights;
}

interface FraudModelWeights {
  locationMismatch: number;
  timingAnomaly: number;
  excessiveHours: number;
  paymentMismatch: number;
  attendancePattern: number;
  networkAnalysis: number;
  velocityChecks: number;
  identityVerification: number;
}

interface AllocationModelWeights {
  economicNeed: number;
  waitingPeriod: number;
  historicalAccess: number;
  categoryPriority: number;
  vulnerabilityScore: number;
  familyDependents: number;
  landlessness: number;
  skillMatch: number;
}

interface BiasModelWeights {
  demographicParity: number;
  equalOpportunity: number;
  equalizedOdds: number;
  calibration: number;
}

const MODEL_WEIGHTS: ModelWeights = {
  fraud: {
    locationMismatch: 0.20,
    timingAnomaly: 0.10,
    excessiveHours: 0.15,
    paymentMismatch: 0.15,
    attendancePattern: 0.15,
    networkAnalysis: 0.10,
    velocityChecks: 0.10,
    identityVerification: 0.05
  },
  allocation: {
    economicNeed: 0.25,
    waitingPeriod: 0.20,
    historicalAccess: 0.15,
    categoryPriority: 0.15,
    vulnerabilityScore: 0.10,
    familyDependents: 0.05,
    landlessness: 0.05,
    skillMatch: 0.05
  },
  bias: {
    demographicParity: 0.30,
    equalOpportunity: 0.25,
    equalizedOdds: 0.25,
    calibration: 0.20
  }
};

// Category priority multipliers (based on government guidelines)
const CATEGORY_PRIORITY: Record<string, number> = {
  'ST': 1.3,           // Scheduled Tribes
  'SC': 1.25,          // Scheduled Castes
  'OBC': 1.1,          // Other Backward Classes
  'General': 1.0,
  'disabled': 1.4,     // Persons with Disabilities
  'widow': 1.35,       // Widows
  'single_woman': 1.3, // Single Women
  'elderly': 1.2,      // 60+ years
  'landless': 1.25     // Landless laborers
};

// ============================================
// FRAUD DETECTION MODEL
// ============================================

export class FraudDetectionModel {
  private modelVersion = 'v2.0.0-sahayog';

  /**
   * Main fraud prediction using ensemble of rules + statistical analysis
   */
  predict(user: MLUserDocument, workRecords: MGNREGAWorkRecord[], payments: PaymentTransaction[]): FraudPrediction {
    const anomalies: AnomalyDetail[] = [];
    let totalRiskScore = 0;
    let maxSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // 1. Location Mismatch Detection
    const locationAnomaly = this.detectLocationMismatch(user, workRecords);
    if (locationAnomaly) {
      anomalies.push(locationAnomaly);
      totalRiskScore += locationAnomaly.weight;
      if (this.severityToNumber(locationAnomaly.severity) > this.severityToNumber(maxSeverity)) {
        maxSeverity = locationAnomaly.severity;
      }
    }

    // 2. Timing Anomaly Detection
    const timingAnomalies = this.detectTimingAnomalies(workRecords);
    anomalies.push(...timingAnomalies);
    totalRiskScore += timingAnomalies.reduce((sum, a) => sum + a.weight, 0);

    // 3. Excessive Hours Detection
    const hoursAnomaly = this.detectExcessiveHours(workRecords);
    if (hoursAnomaly) {
      anomalies.push(hoursAnomaly);
      totalRiskScore += hoursAnomaly.weight;
    }

    // 4. Payment Pattern Analysis
    const paymentAnomalies = this.analyzePaymentPatterns(user, payments);
    anomalies.push(...paymentAnomalies);
    totalRiskScore += paymentAnomalies.reduce((sum, a) => sum + a.weight, 0);

    // 5. Attendance Pattern Analysis
    const attendanceAnomaly = this.analyzeAttendancePatterns(workRecords);
    if (attendanceAnomaly) {
      anomalies.push(attendanceAnomaly);
      totalRiskScore += attendanceAnomaly.weight;
    }

    // 6. Network Analysis (shared accounts, phones, addresses)
    const networkAnomalies = this.analyzeNetworkPatterns(user);
    anomalies.push(...networkAnomalies);
    totalRiskScore += networkAnomalies.reduce((sum, a) => sum + a.weight, 0);

    // 7. Velocity Checks (impossible activities)
    const velocityAnomaly = this.performVelocityChecks(workRecords);
    if (velocityAnomaly) {
      anomalies.push(velocityAnomaly);
      totalRiskScore += velocityAnomaly.weight;
    }

    // Normalize risk score to 0-100
    const normalizedRiskScore = Math.min(100, totalRiskScore);
    const riskLevel = this.getRiskLevel(normalizedRiskScore);
    const isFraudulent = normalizedRiskScore >= 60;
    const fraudType = isFraudulent ? this.determineFraudType(anomalies) : undefined;
    const confidence = this.calculateConfidence(anomalies, workRecords.length);

    // Generate explainable reasoning
    const explanation = this.generateFraudExplanation(
      user, anomalies, normalizedRiskScore, isFraudulent, fraudType
    );

    return {
      userId: user.userId,
      isFraudulent,
      fraudType,
      confidence,
      riskScore: normalizedRiskScore,
      riskLevel,
      anomalies,
      explanation,
      modelVersion: this.modelVersion,
      predictedAt: new Date().toISOString()
    };
  }

  private detectLocationMismatch(user: MLUserDocument, workRecords: MGNREGAWorkRecord[]): AnomalyDetail | null {
    const locationMismatches = workRecords.filter(r => r.anomalyFlags?.locationMismatch);
    const mismatchRate = locationMismatches.length / Math.max(1, workRecords.length);

    if (mismatchRate > 0.3) {
      return {
        type: 'location_mismatch',
        severity: mismatchRate > 0.6 ? 'critical' : 'high',
        description: `${(mismatchRate * 100).toFixed(0)}% of check-ins show location mismatch with worksite`,
        descriptionHindi: `${(mismatchRate * 100).toFixed(0)}% चेक-इन में स्थान मेल नहीं खाता`,
        evidence: { mismatchRate, totalRecords: workRecords.length, mismatches: locationMismatches.length },
        weight: mismatchRate * 30
      };
    }
    return null;
  }

  private detectTimingAnomalies(workRecords: MGNREGAWorkRecord[]): AnomalyDetail[] {
    const anomalies: AnomalyDetail[] = [];
    
    const unusualTiming = workRecords.filter(r => r.anomalyFlags?.timingAnomaly);
    if (unusualTiming.length > 3) {
      anomalies.push({
        type: 'timing_anomaly',
        severity: unusualTiming.length > 10 ? 'high' : 'medium',
        description: `${unusualTiming.length} records with unusual check-in/out times`,
        descriptionHindi: `${unusualTiming.length} रिकॉर्ड में असामान्य समय`,
        evidence: { count: unusualTiming.length },
        weight: Math.min(15, unusualTiming.length * 1.5)
      });
    }

    return anomalies;
  }

  private detectExcessiveHours(workRecords: MGNREGAWorkRecord[]): AnomalyDetail | null {
    const excessiveRecords = workRecords.filter(r => r.hoursWorked > 12);
    if (excessiveRecords.length > 0) {
      const avgExcessiveHours = excessiveRecords.reduce((sum, r) => sum + r.hoursWorked, 0) / excessiveRecords.length;
      return {
        type: 'excessive_hours',
        severity: avgExcessiveHours > 16 ? 'critical' : 'high',
        description: `${excessiveRecords.length} records show more than 12 hours worked (avg: ${avgExcessiveHours.toFixed(1)}h)`,
        descriptionHindi: `${excessiveRecords.length} रिकॉर्ड में 12 घंटे से ज्यादा काम (औसत: ${avgExcessiveHours.toFixed(1)} घंटे)`,
        evidence: { count: excessiveRecords.length, avgHours: avgExcessiveHours },
        weight: Math.min(20, excessiveRecords.length * 3)
      };
    }
    return null;
  }

  private analyzePaymentPatterns(user: MLUserDocument, payments: PaymentTransaction[]): AnomalyDetail[] {
    const anomalies: AnomalyDetail[] = [];

    // Check for excessive delays
    const avgDelay = payments.reduce((sum, p) => sum + p.delayDays, 0) / Math.max(1, payments.length);
    if (avgDelay > 30) {
      anomalies.push({
        type: 'payment_delay_pattern',
        severity: avgDelay > 45 ? 'high' : 'medium',
        description: `Average payment delay of ${avgDelay.toFixed(0)} days indicates potential diversion`,
        descriptionHindi: `औसत भुगतान देरी ${avgDelay.toFixed(0)} दिन - संभावित धोखाधड़ी`,
        evidence: { avgDelay, paymentCount: payments.length },
        weight: Math.min(15, avgDelay / 3)
      });
    }

    // Check for flagged payments
    const flaggedPayments = payments.filter(p => p.isFlagged);
    if (flaggedPayments.length > 2) {
      anomalies.push({
        type: 'flagged_payments',
        severity: 'high',
        description: `${flaggedPayments.length} payments flagged for review`,
        descriptionHindi: `${flaggedPayments.length} भुगतान समीक्षा के लिए चिह्नित`,
        evidence: { flaggedCount: flaggedPayments.length },
        weight: flaggedPayments.length * 5
      });
    }

    return anomalies;
  }

  private analyzeAttendancePatterns(workRecords: MGNREGAWorkRecord[]): AnomalyDetail | null {
    if (workRecords.length < 10) return null;

    // Check for suspicious patterns (e.g., always exactly 8 hours)
    const hours = workRecords.map(r => r.hoursWorked);
    const uniqueHours = new Set(hours);
    
    if (uniqueHours.size === 1 && hours.length > 20) {
      return {
        type: 'suspicious_consistency',
        severity: 'medium',
        description: `All ${hours.length} records show exactly ${hours[0]} hours - suspiciously consistent`,
        descriptionHindi: `सभी ${hours.length} रिकॉर्ड में ठीक ${hours[0]} घंटे - संदिग्ध एकरूपता`,
        evidence: { hoursValue: hours[0], recordCount: hours.length },
        weight: 10
      };
    }

    return null;
  }

  private analyzeNetworkPatterns(user: MLUserDocument): AnomalyDetail[] {
    const anomalies: AnomalyDetail[] = [];

    // Check if mlFlags indicates shared resources (populated from network analysis)
    if (user.mlFlags?.fraudProbability && user.mlFlags.fraudProbability > 0.5) {
      anomalies.push({
        type: 'network_flag',
        severity: user.mlFlags.fraudProbability > 0.8 ? 'critical' : 'high',
        description: 'User flagged by network analysis for suspicious patterns',
        descriptionHindi: 'नेटवर्क विश्लेषण में संदिग्ध पैटर्न',
        evidence: { fraudProbability: user.mlFlags.fraudProbability },
        weight: user.mlFlags.fraudProbability * 25
      });
    }

    return anomalies;
  }

  private performVelocityChecks(workRecords: MGNREGAWorkRecord[]): AnomalyDetail | null {
    // Sort records by date
    const sorted = [...workRecords].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Check for impossible scenarios
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      
      if (prev.worksite?.location && curr.worksite?.location) {
        const distance = this.calculateDistance(
          prev.worksite.location.lat, prev.worksite.location.lng,
          curr.worksite.location.lat, curr.worksite.location.lng
        );
        
        const timeDiff = new Date(curr.date).getTime() - new Date(prev.date).getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        // If locations are >100km apart on same day, impossible
        if (hoursDiff < 24 && distance > 100) {
          return {
            type: 'velocity_violation',
            severity: 'critical',
            description: `Impossible travel: ${distance.toFixed(0)}km between worksites in ${hoursDiff.toFixed(0)} hours`,
            descriptionHindi: `असंभव यात्रा: ${hoursDiff.toFixed(0)} घंटे में ${distance.toFixed(0)} किमी`,
            evidence: { distance, hoursDiff },
            weight: 30
          };
        }
      }
    }

    return null;
  }

  private severityToNumber(severity: 'low' | 'medium' | 'high' | 'critical'): number {
    const map = { low: 1, medium: 2, high: 3, critical: 4 };
    return map[severity];
  }

  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 25) return 'low';
    if (score < 50) return 'medium';
    if (score < 75) return 'high';
    return 'critical';
  }

  private determineFraudType(anomalies: AnomalyDetail[]): FraudType {
    const typeCount: Record<string, number> = {};
    
    for (const a of anomalies) {
      if (a.type.includes('location')) typeCount['location_spoofing'] = (typeCount['location_spoofing'] || 0) + a.weight;
      if (a.type.includes('payment')) typeCount['payment_diversion'] = (typeCount['payment_diversion'] || 0) + a.weight;
      if (a.type.includes('hours') || a.type.includes('attendance')) typeCount['attendance_fraud'] = (typeCount['attendance_fraud'] || 0) + a.weight;
      if (a.type.includes('network')) typeCount['collusion'] = (typeCount['collusion'] || 0) + a.weight;
      if (a.type.includes('velocity')) typeCount['ghost_worker'] = (typeCount['ghost_worker'] || 0) + a.weight;
    }

    let maxType: FraudType = 'attendance_fraud';
    let maxWeight = 0;
    for (const [type, weight] of Object.entries(typeCount)) {
      if (weight > maxWeight) {
        maxWeight = weight;
        maxType = type as FraudType;
      }
    }

    return maxType;
  }

  private calculateConfidence(anomalies: AnomalyDetail[], recordCount: number): number {
    // More records = higher confidence
    const dataFactor = Math.min(1, recordCount / 30);
    // More anomalies detected = higher confidence in fraud prediction
    const anomalyFactor = anomalies.length > 0 ? Math.min(1, anomalies.length / 5) : 0.5;
    // Average severity impacts confidence
    const avgSeverity = anomalies.length > 0
      ? anomalies.reduce((sum, a) => sum + this.severityToNumber(a.severity), 0) / anomalies.length / 4
      : 0.25;

    return Math.min(0.99, (dataFactor * 0.4 + anomalyFactor * 0.3 + avgSeverity * 0.3));
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private generateFraudExplanation(
    user: MLUserDocument,
    anomalies: AnomalyDetail[],
    riskScore: number,
    isFraudulent: boolean,
    fraudType?: FraudType
  ): ExplainableReasoning {
    const factors = anomalies.map(a => ({
      name: a.type,
      nameHindi: a.type.replace(/_/g, ' '),
      value: a.severity,
      impact: 'negative' as const,
      weight: a.weight,
      explanation: a.description,
      explanationHindi: a.descriptionHindi
    }));

    const summary = isFraudulent
      ? `High risk of ${fraudType?.replace(/_/g, ' ')} detected with ${riskScore}% confidence`
      : `No significant fraud indicators detected. Risk score: ${riskScore}%`;

    const summaryHindi = isFraudulent
      ? `${fraudType?.replace(/_/g, ' ')} का उच्च जोखिम - ${riskScore}% विश्वास`
      : `कोई महत्वपूर्ण धोखाधड़ी संकेत नहीं। जोखिम स्कोर: ${riskScore}%`;

    const conversational = isFraudulent
      ? `Our system has detected potential irregularities in the work records. Specifically, ${anomalies.slice(0, 2).map(a => a.description).join(' and ')}. This is being flagged for review by authorities.`
      : `The work records appear to be in order. No unusual patterns detected.`;

    const conversationalHindi = isFraudulent
      ? `हमारे सिस्टम ने कार्य रिकॉर्ड में संभावित अनियमितताएं पाई हैं। ${anomalies.slice(0, 2).map(a => a.descriptionHindi).join(' और ')}। इसे अधिकारियों द्वारा समीक्षा के लिए भेजा जा रहा है।`
      : `कार्य रिकॉर्ड ठीक लग रहे हैं। कोई असामान्य पैटर्न नहीं मिला।`;

    return {
      summary,
      summaryHindi,
      factors,
      confidence: this.calculateConfidence(anomalies, 1),
      dataQuality: anomalies.length > 0 ? 'high' : 'medium',
      humanReadable: summary,
      humanReadableHindi: summaryHindi,
      conversationalResponse: conversational,
      conversationalResponseHindi: conversationalHindi
    };
  }
}

// ============================================
// FAIR ALLOCATION MODEL
// ============================================

export class FairAllocationModel {
  private modelVersion = 'v2.0.0-sahayog';

  /**
   * Calculate fair allocation score for a user
   * Higher score = more deserving of work allocation
   */
  calculateAllocationScore(
    user: MLUserDocument,
    allUsers: MLUserDocument[],
    workRecords: MGNREGAWorkRecord[]
  ): FairAllocationScore {
    const eligibilityFactors: EligibilityFactor[] = [];
    let totalScore = 0;

    // 1. Economic Need Score (25%)
    const needScore = this.calculateNeedScore(user);
    eligibilityFactors.push({
      factor: 'Economic Need',
      factorHindi: 'आर्थिक आवश्यकता',
      weight: MODEL_WEIGHTS.allocation.economicNeed,
      score: needScore,
      maxScore: 100,
      isPositive: needScore > 50,
      description: `Based on income category (${user.incomeCategory}), land owned (${user.landOwned} acres)`,
      descriptionHindi: `आय श्रेणी (${user.incomeCategory}), जमीन (${user.landOwned} एकड़) के आधार पर`
    });
    totalScore += needScore * MODEL_WEIGHTS.allocation.economicNeed;

    // 2. Waiting Period Score (20%)
    const waitingScore = this.calculateWaitingScore(user, workRecords);
    eligibilityFactors.push({
      factor: 'Waiting Period',
      factorHindi: 'प्रतीक्षा अवधि',
      weight: MODEL_WEIGHTS.allocation.waitingPeriod,
      score: waitingScore.score,
      maxScore: 100,
      isPositive: waitingScore.days > 7,
      description: `${waitingScore.days} days since last work allocation`,
      descriptionHindi: `पिछले काम के बाद ${waitingScore.days} दिन हो गए`
    });
    totalScore += waitingScore.score * MODEL_WEIGHTS.allocation.waitingPeriod;

    // 3. Historical Access Score (15%) - Lower access = higher priority
    const historicalScore = this.calculateHistoricalAccessScore(user);
    eligibilityFactors.push({
      factor: 'Historical Access',
      factorHindi: 'पिछली पहुँच',
      weight: MODEL_WEIGHTS.allocation.historicalAccess,
      score: historicalScore,
      maxScore: 100,
      isPositive: historicalScore > 50,
      description: `${user.mgnrega.currentYearDaysWorked} days worked this year out of 100`,
      descriptionHindi: `इस वर्ष 100 में से ${user.mgnrega.currentYearDaysWorked} दिन काम किया`
    });
    totalScore += historicalScore * MODEL_WEIGHTS.allocation.historicalAccess;

    // 4. Category Priority (15%)
    const categoryScore = this.calculateCategoryPriority(user);
    eligibilityFactors.push({
      factor: 'Category Priority',
      factorHindi: 'श्रेणी प्राथमिकता',
      weight: MODEL_WEIGHTS.allocation.categoryPriority,
      score: categoryScore.score,
      maxScore: 100,
      isPositive: categoryScore.multiplier > 1,
      description: `${user.category} category with ${categoryScore.multiplier}x priority multiplier`,
      descriptionHindi: `${user.category} श्रेणी - ${categoryScore.multiplier}x प्राथमिकता`
    });
    totalScore += categoryScore.score * MODEL_WEIGHTS.allocation.categoryPriority;

    // 5. Vulnerability Score (10%)
    const vulnerabilityScore = this.calculateVulnerabilityScore(user);
    eligibilityFactors.push({
      factor: 'Vulnerability',
      factorHindi: 'कमज़ोरी',
      weight: MODEL_WEIGHTS.allocation.vulnerabilityScore,
      score: vulnerabilityScore,
      maxScore: 100,
      isPositive: vulnerabilityScore > 30,
      description: this.getVulnerabilityDescription(user),
      descriptionHindi: this.getVulnerabilityDescriptionHindi(user)
    });
    totalScore += vulnerabilityScore * MODEL_WEIGHTS.allocation.vulnerabilityScore;

    // 6. Family Dependents (5%)
    const dependentsScore = Math.min(100, (user.dependents || 0) * 25);
    eligibilityFactors.push({
      factor: 'Family Dependents',
      factorHindi: 'आश्रित',
      weight: MODEL_WEIGHTS.allocation.familyDependents,
      score: dependentsScore,
      maxScore: 100,
      isPositive: dependentsScore > 25,
      description: `${user.dependents || 0} dependents in household`,
      descriptionHindi: `परिवार में ${user.dependents || 0} आश्रित`
    });
    totalScore += dependentsScore * MODEL_WEIGHTS.allocation.familyDependents;

    // 7. Landlessness (5%)
    const landlessScore = user.landOwned < 0.5 ? 100 : Math.max(0, 100 - user.landOwned * 20);
    eligibilityFactors.push({
      factor: 'Land Ownership',
      factorHindi: 'भूमि स्वामित्व',
      weight: MODEL_WEIGHTS.allocation.landlessness,
      score: landlessScore,
      maxScore: 100,
      isPositive: landlessScore > 50,
      description: user.landOwned < 0.5 ? 'Landless - priority allocation' : `Owns ${user.landOwned} acres`,
      descriptionHindi: user.landOwned < 0.5 ? 'भूमिहीन - प्राथमिकता' : `${user.landOwned} एकड़ जमीन`
    });
    totalScore += landlessScore * MODEL_WEIGHTS.allocation.landlessness;

    // 8. Skill Match (5%)
    const skillScore = (user.skills?.length || 0) > 0 ? 75 : 50;
    eligibilityFactors.push({
      factor: 'Skill Match',
      factorHindi: 'कौशल मिलान',
      weight: MODEL_WEIGHTS.allocation.skillMatch,
      score: skillScore,
      maxScore: 100,
      isPositive: skillScore > 50,
      description: `${user.skills?.length || 0} relevant skills`,
      descriptionHindi: `${user.skills?.length || 0} प्रासंगिक कौशल`
    });
    totalScore += skillScore * MODEL_WEIGHTS.allocation.skillMatch;

    // Calculate priority rank among all users
    const allScores = allUsers.map(u => this.calculateRawScore(u, workRecords));
    const myScore = totalScore;
    const rank = allScores.filter(s => s > myScore).length + 1;

    // Generate recommendation
    const recommendation = this.generateRecommendation(user, totalScore, rank, allUsers.length);
    const explanation = this.generateAllocationExplanation(user, eligibilityFactors, totalScore, recommendation);

    return {
      userId: user.userId,
      allocationScore: totalScore,
      priorityRank: rank,
      eligibilityFactors,
      needScore: needScore,
      waitingDays: waitingScore.days,
      historicalAccess: user.mgnrega.currentYearDaysWorked,
      recommendation,
      explanation
    };
  }

  private calculateNeedScore(user: MLUserDocument): number {
    let score = 50; // Base score

    // Income category adjustment
    const incomeCategoryScores: Record<string, number> = {
      'AAY': 40, // Antyodaya - most needy
      'BPL': 30,
      'PHH': 20,
      'APL': 0
    };
    score += incomeCategoryScores[user.incomeCategory] || 0;

    // Land ownership adjustment (less land = higher need)
    score += Math.max(0, 20 - user.landOwned * 5);

    // Family income adjustment
    if (user.familyIncome < 5000) score += 15;
    else if (user.familyIncome < 10000) score += 10;
    else if (user.familyIncome < 15000) score += 5;

    return Math.min(100, score);
  }

  private calculateWaitingScore(user: MLUserDocument, workRecords: MGNREGAWorkRecord[]): { score: number; days: number } {
    const userRecords = workRecords.filter(r => r.userId === user.userId);
    if (userRecords.length === 0) {
      return { score: 100, days: 365 }; // Never worked - highest priority
    }

    const lastWorkDate = new Date(Math.max(...userRecords.map(r => new Date(r.date).getTime())));
    const daysSince = Math.floor((Date.now() - lastWorkDate.getTime()) / (1000 * 60 * 60 * 24));

    // Score increases with waiting days (capped at 30 days = max score)
    const score = Math.min(100, daysSince * 3.33);
    return { score, days: daysSince };
  }

  private calculateHistoricalAccessScore(user: MLUserDocument): number {
    // Lower days worked = higher priority for new allocation
    const daysWorked = user.mgnrega.currentYearDaysWorked;
    const daysRemaining = user.mgnrega.currentYearDaysRemaining;
    
    // If they've worked less, they deserve more
    return Math.min(100, (daysRemaining / 100) * 100);
  }

  private calculateCategoryPriority(user: MLUserDocument): { score: number; multiplier: number } {
    let multiplier = CATEGORY_PRIORITY[user.category] || 1.0;
    
    // Additional multipliers for special categories
    if (user.isDisabled) multiplier = Math.max(multiplier, CATEGORY_PRIORITY['disabled']);
    if (user.maritalStatus === 'widowed') multiplier = Math.max(multiplier, CATEGORY_PRIORITY['widow']);
    if (user.age && user.age >= 60) multiplier = Math.max(multiplier, CATEGORY_PRIORITY['elderly']);
    if (user.landOwned < 0.5) multiplier = Math.max(multiplier, CATEGORY_PRIORITY['landless']);

    const score = (multiplier - 1) * 100 + 50; // Convert multiplier to score
    return { score: Math.min(100, score), multiplier };
  }

  private calculateVulnerabilityScore(user: MLUserDocument): number {
    let score = 0;

    if (user.isDisabled) score += 30;
    if (user.maritalStatus === 'widowed') score += 25;
    if (user.gender === 'female' && user.isHouseholdHead) score += 20;
    if ((user.age || 0) >= 60) score += 15;
    if (user.incomeCategory === 'AAY') score += 20;
    if (!user.isLiterate) score += 10;
    if (user.location.isTribalArea) score += 15;

    return Math.min(100, score);
  }

  private getVulnerabilityDescription(user: MLUserDocument): string {
    const factors: string[] = [];
    if (user.isDisabled) factors.push('person with disability');
    if (user.maritalStatus === 'widowed') factors.push('widow');
    if (user.gender === 'female' && user.isHouseholdHead) factors.push('female-headed household');
    if ((user.age || 0) >= 60) factors.push('elderly');
    if (user.location.isTribalArea) factors.push('tribal area resident');
    
    return factors.length > 0 ? factors.join(', ') : 'No special vulnerability factors';
  }

  private getVulnerabilityDescriptionHindi(user: MLUserDocument): string {
    const factors: string[] = [];
    if (user.isDisabled) factors.push('विकलांग');
    if (user.maritalStatus === 'widowed') factors.push('विधवा');
    if (user.gender === 'female' && user.isHouseholdHead) factors.push('महिला मुखिया');
    if ((user.age || 0) >= 60) factors.push('वृद्ध');
    if (user.location.isTribalArea) factors.push('आदिवासी क्षेत्र');
    
    return factors.length > 0 ? factors.join(', ') : 'कोई विशेष कमज़ोरी कारक नहीं';
  }

  private calculateRawScore(user: MLUserDocument, workRecords: MGNREGAWorkRecord[]): number {
    // Simplified scoring for ranking
    let score = 0;
    score += this.calculateNeedScore(user) * MODEL_WEIGHTS.allocation.economicNeed;
    score += this.calculateWaitingScore(user, workRecords).score * MODEL_WEIGHTS.allocation.waitingPeriod;
    score += this.calculateHistoricalAccessScore(user) * MODEL_WEIGHTS.allocation.historicalAccess;
    score += this.calculateCategoryPriority(user).score * MODEL_WEIGHTS.allocation.categoryPriority;
    score += this.calculateVulnerabilityScore(user) * MODEL_WEIGHTS.allocation.vulnerabilityScore;
    return score;
  }

  private generateRecommendation(
    user: MLUserDocument,
    score: number,
    rank: number,
    totalUsers: number
  ): AllocationRecommendation {
    const percentile = (1 - rank / totalUsers) * 100;
    const daysRemaining = user.mgnrega.currentYearDaysRemaining;

    if (daysRemaining === 0) {
      return {
        shouldAllocate: false,
        priority: 'waitlist',
        daysToWork: 0,
        reasonCode: 'QUOTA_EXHAUSTED',
        reasonEnglish: 'Annual 100-day quota already utilized. Eligible for next financial year.',
        reasonHindi: 'वार्षिक 100 दिन का कोटा पूरा हो गया। अगले वित्तीय वर्ष में पात्र।'
      };
    }

    if (percentile >= 80) {
      return {
        shouldAllocate: true,
        priority: 'immediate',
        daysToWork: Math.min(15, daysRemaining),
        reasonCode: 'HIGH_PRIORITY',
        reasonEnglish: `Top ${(100 - percentile).toFixed(0)}% priority. Immediate allocation recommended.`,
        reasonHindi: `शीर्ष ${(100 - percentile).toFixed(0)}% प्राथमिकता। तत्काल आवंटन की सिफारिश।`
      };
    }

    if (percentile >= 50) {
      return {
        shouldAllocate: true,
        priority: 'high',
        daysToWork: Math.min(10, daysRemaining),
        reasonCode: 'MEDIUM_PRIORITY',
        reasonEnglish: `Above average priority (rank ${rank}/${totalUsers}). Allocation within 7 days.`,
        reasonHindi: `औसत से ऊपर प्राथमिकता (क्रम ${rank}/${totalUsers})। 7 दिनों में आवंटन।`
      };
    }

    if (percentile >= 25) {
      return {
        shouldAllocate: true,
        priority: 'normal',
        daysToWork: Math.min(5, daysRemaining),
        reasonCode: 'NORMAL_PRIORITY',
        reasonEnglish: `Normal priority queue. Expected allocation within 14 days.`,
        reasonHindi: `सामान्य प्राथमिकता कतार। 14 दिनों में अपेक्षित आवंटन।`
      };
    }

    return {
      shouldAllocate: true,
      priority: 'waitlist',
      daysToWork: Math.min(3, daysRemaining),
      reasonCode: 'LOW_PRIORITY',
      reasonEnglish: `On waitlist. Others with higher need will be allocated first.`,
      reasonHindi: `प्रतीक्षा सूची में। पहले अधिक जरूरतमंदों को आवंटित किया जाएगा।`
    };
  }

  private generateAllocationExplanation(
    user: MLUserDocument,
    factors: EligibilityFactor[],
    score: number,
    recommendation: AllocationRecommendation
  ): ExplainableReasoning {
    const topFactors = factors
      .sort((a, b) => (b.score * b.weight) - (a.score * a.weight))
      .slice(0, 3);

    const factorsFormatted = factors.map(f => ({
      name: f.factor,
      nameHindi: f.factorHindi,
      value: f.score,
      impact: f.isPositive ? 'positive' as const : 'neutral' as const,
      weight: f.weight,
      explanation: f.description,
      explanationHindi: f.descriptionHindi
    }));

    const topPositives = topFactors.filter(f => f.isPositive).map(f => f.description).join('; ');
    const summary = `Allocation Score: ${score.toFixed(0)}/100. ${recommendation.reasonEnglish}`;
    const summaryHindi = `आवंटन स्कोर: ${score.toFixed(0)}/100। ${recommendation.reasonHindi}`;

    const conversational = recommendation.shouldAllocate
      ? `Based on our fair allocation system, you are eligible for work allocation. Your priority is "${recommendation.priority}" because: ${topPositives}. You can expect ${recommendation.daysToWork} days of work.`
      : `Currently, you are on the waitlist. ${recommendation.reasonEnglish} We are working to ensure fair distribution.`;

    const conversationalHindi = recommendation.shouldAllocate
      ? `हमारी उचित आवंटन प्रणाली के अनुसार, आप काम आवंटन के पात्र हैं। आपकी प्राथमिकता "${recommendation.priority}" है क्योंकि: ${factors.filter(f => f.isPositive).map(f => f.descriptionHindi).slice(0, 2).join('; ')}। आप ${recommendation.daysToWork} दिनों के काम की उम्मीद कर सकते हैं।`
      : `वर्तमान में, आप प्रतीक्षा सूची में हैं। ${recommendation.reasonHindi} हम उचित वितरण सुनिश्चित करने के लिए काम कर रहे हैं।`;

    return {
      summary,
      summaryHindi,
      factors: factorsFormatted,
      confidence: 0.85,
      dataQuality: 'high',
      humanReadable: summary,
      humanReadableHindi: summaryHindi,
      conversationalResponse: conversational,
      conversationalResponseHindi: conversationalHindi
    };
  }
}

// ============================================
// BIAS DETECTION & REMOVAL MODEL
// ============================================

export class BiasDetectionModel {
  private modelVersion = 'v2.0.0-sahayog';

  /**
   * Analyze allocation data for demographic biases
   */
  analyzeAllocations(
    users: MLUserDocument[],
    workRecords: MGNREGAWorkRecord[]
  ): BiasAnalysis {
    const demographicChecks: DemographicParityCheck[] = [];
    const anomalies: StatisticalAnomaly[] = [];
    let totalBiasScore = 0;

    // 1. Caste-based parity check
    const casteCheck = this.checkCasteParity(users, workRecords);
    demographicChecks.push(casteCheck);
    if (!casteCheck.isBalanced) totalBiasScore += 25;

    // 2. Gender parity check
    const genderCheck = this.checkGenderParity(users, workRecords);
    demographicChecks.push(genderCheck);
    if (!genderCheck.isBalanced) totalBiasScore += 25;

    // 3. Age group parity check
    const ageCheck = this.checkAgeParity(users, workRecords);
    demographicChecks.push(ageCheck);
    if (!ageCheck.isBalanced) totalBiasScore += 15;

    // 4. Disability parity check
    const disabilityCheck = this.checkDisabilityParity(users, workRecords);
    demographicChecks.push(disabilityCheck);
    if (!disabilityCheck.isBalanced) totalBiasScore += 20;

    // 5. Location-based parity check
    const locationCheck = this.checkLocationParity(users, workRecords);
    demographicChecks.push(locationCheck);
    if (!locationCheck.isBalanced) totalBiasScore += 15;

    // Generate statistical anomalies
    anomalies.push(...this.detectStatisticalAnomalies(demographicChecks));

    // Generate recommendations
    const recommendations = this.generateBiasRemediation(demographicChecks, anomalies);

    // Determine bias level
    const biasLevel = this.getBiasLevel(totalBiasScore);

    // Generate explanation
    const explanation = this.generateBiasExplanation(demographicChecks, totalBiasScore, biasLevel);

    return {
      overallBiasScore: totalBiasScore,
      biasLevel,
      demographicParity: demographicChecks,
      statisticalAnomalies: anomalies,
      recommendations,
      explanation
    };
  }

  private checkCasteParity(users: MLUserDocument[], workRecords: MGNREGAWorkRecord[]): DemographicParityCheck {
    const categories = ['SC', 'ST', 'OBC', 'General'];
    const usersByCategory = new Map<string, MLUserDocument[]>();
    const workByCategory = new Map<string, number>();

    // Group users by category
    for (const cat of categories) {
      usersByCategory.set(cat, users.filter(u => u.category === cat));
      workByCategory.set(cat, 0);
    }

    // Count work days by category
    for (const record of workRecords) {
      const user = users.find(u => u.userId === record.userId);
      if (user) {
        const current = workByCategory.get(user.category) || 0;
        workByCategory.set(user.category, current + 1);
      }
    }

    const totalUsers = users.length;
    const totalWork = workRecords.length;

    const groups = categories.map(cat => {
      const population = usersByCategory.get(cat)?.length || 0;
      const allocated = workByCategory.get(cat) || 0;
      const expectedRate = population / totalUsers;
      const actualRate = totalWork > 0 ? allocated / totalWork : 0;
      const parity = expectedRate > 0 ? actualRate / expectedRate : 1;

      return { name: cat, population, allocated, expectedRate, actualRate, parity };
    });

    const avgDeviation = groups.reduce((sum, g) => sum + Math.abs(1 - g.parity), 0) / groups.length;
    const isBalanced = avgDeviation < 0.2; // Within 20% is considered balanced

    return {
      dimension: 'caste',
      groups,
      isBalanced,
      deviation: avgDeviation
    };
  }

  private checkGenderParity(users: MLUserDocument[], workRecords: MGNREGAWorkRecord[]): DemographicParityCheck {
    const genders = ['male', 'female'];
    const usersByGender = new Map<string, MLUserDocument[]>();
    const workByGender = new Map<string, number>();

    for (const gender of genders) {
      usersByGender.set(gender, users.filter(u => u.gender === gender));
      workByGender.set(gender, 0);
    }

    for (const record of workRecords) {
      const user = users.find(u => u.userId === record.userId);
      if (user) {
        const current = workByGender.get(user.gender) || 0;
        workByGender.set(user.gender, current + 1);
      }
    }

    const totalUsers = users.length;
    const totalWork = workRecords.length;

    const groups = genders.map(gender => {
      const population = usersByGender.get(gender)?.length || 0;
      const allocated = workByGender.get(gender) || 0;
      const expectedRate = population / totalUsers;
      const actualRate = totalWork > 0 ? allocated / totalWork : 0;
      const parity = expectedRate > 0 ? actualRate / expectedRate : 1;

      return { name: gender, population, allocated, expectedRate, actualRate, parity };
    });

    const avgDeviation = groups.reduce((sum, g) => sum + Math.abs(1 - g.parity), 0) / groups.length;
    const isBalanced = avgDeviation < 0.15;

    return {
      dimension: 'gender',
      groups,
      isBalanced,
      deviation: avgDeviation
    };
  }

  private checkAgeParity(users: MLUserDocument[], workRecords: MGNREGAWorkRecord[]): DemographicParityCheck {
    const ageGroups = [
      { name: '18-30', min: 18, max: 30 },
      { name: '31-45', min: 31, max: 45 },
      { name: '46-60', min: 46, max: 60 },
      { name: '60+', min: 61, max: 100 }
    ];

    const usersByAge = new Map<string, MLUserDocument[]>();
    const workByAge = new Map<string, number>();

    for (const group of ageGroups) {
      usersByAge.set(group.name, users.filter(u => (u.age || 0) >= group.min && (u.age || 0) <= group.max));
      workByAge.set(group.name, 0);
    }

    for (const record of workRecords) {
      const user = users.find(u => u.userId === record.userId);
      if (user) {
        const age = user.age || 30;
        const group = ageGroups.find(g => age >= g.min && age <= g.max);
        if (group) {
          const current = workByAge.get(group.name) || 0;
          workByAge.set(group.name, current + 1);
        }
      }
    }

    const totalUsers = users.length;
    const totalWork = workRecords.length;

    const groups = ageGroups.map(group => {
      const population = usersByAge.get(group.name)?.length || 0;
      const allocated = workByAge.get(group.name) || 0;
      const expectedRate = population / totalUsers;
      const actualRate = totalWork > 0 ? allocated / totalWork : 0;
      const parity = expectedRate > 0 ? actualRate / expectedRate : 1;

      return { name: group.name, population, allocated, expectedRate, actualRate, parity };
    });

    const avgDeviation = groups.reduce((sum, g) => sum + Math.abs(1 - g.parity), 0) / groups.length;
    const isBalanced = avgDeviation < 0.25;

    return {
      dimension: 'age',
      groups,
      isBalanced,
      deviation: avgDeviation
    };
  }

  private checkDisabilityParity(users: MLUserDocument[], workRecords: MGNREGAWorkRecord[]): DemographicParityCheck {
    const disabledUsers = users.filter(u => u.isDisabled);
    const nonDisabledUsers = users.filter(u => !u.isDisabled);

    let disabledWork = 0;
    let nonDisabledWork = 0;

    for (const record of workRecords) {
      const user = users.find(u => u.userId === record.userId);
      if (user?.isDisabled) {
        disabledWork++;
      } else {
        nonDisabledWork++;
      }
    }

    const totalUsers = users.length;
    const totalWork = workRecords.length;

    const groups = [
      {
        name: 'Disabled',
        population: disabledUsers.length,
        allocated: disabledWork,
        expectedRate: disabledUsers.length / totalUsers,
        actualRate: totalWork > 0 ? disabledWork / totalWork : 0,
        parity: 0
      },
      {
        name: 'Non-Disabled',
        population: nonDisabledUsers.length,
        allocated: nonDisabledWork,
        expectedRate: nonDisabledUsers.length / totalUsers,
        actualRate: totalWork > 0 ? nonDisabledWork / totalWork : 0,
        parity: 0
      }
    ];

    groups.forEach(g => {
      g.parity = g.expectedRate > 0 ? g.actualRate / g.expectedRate : 1;
    });

    // Disabled should have at least proportional representation (ideally higher due to priority)
    const disabledParity = groups[0].parity;
    const isBalanced = disabledParity >= 0.8; // At least 80% of expected

    return {
      dimension: 'disability',
      groups,
      isBalanced,
      deviation: Math.abs(1 - disabledParity)
    };
  }

  private checkLocationParity(users: MLUserDocument[], workRecords: MGNREGAWorkRecord[]): DemographicParityCheck {
    // Group by block
    const blocks = [...new Set(users.map(u => u.location.block))];
    const usersByBlock = new Map<string, MLUserDocument[]>();
    const workByBlock = new Map<string, number>();

    for (const block of blocks) {
      usersByBlock.set(block, users.filter(u => u.location.block === block));
      workByBlock.set(block, 0);
    }

    for (const record of workRecords) {
      const user = users.find(u => u.userId === record.userId);
      if (user) {
        const current = workByBlock.get(user.location.block) || 0;
        workByBlock.set(user.location.block, current + 1);
      }
    }

    const totalUsers = users.length;
    const totalWork = workRecords.length;

    const groups = blocks.map(block => {
      const population = usersByBlock.get(block)?.length || 0;
      const allocated = workByBlock.get(block) || 0;
      const expectedRate = population / totalUsers;
      const actualRate = totalWork > 0 ? allocated / totalWork : 0;
      const parity = expectedRate > 0 ? actualRate / expectedRate : 1;

      return { name: block, population, allocated, expectedRate, actualRate, parity };
    });

    const avgDeviation = groups.reduce((sum, g) => sum + Math.abs(1 - g.parity), 0) / groups.length;
    const isBalanced = avgDeviation < 0.3;

    return {
      dimension: 'location',
      groups,
      isBalanced,
      deviation: avgDeviation
    };
  }

  private detectStatisticalAnomalies(checks: DemographicParityCheck[]): StatisticalAnomaly[] {
    const anomalies: StatisticalAnomaly[] = [];

    for (const check of checks) {
      for (const group of check.groups) {
        if (group.parity < 0.5) {
          anomalies.push({
            type: 'under_representation',
            description: `${group.name} group is significantly under-represented in work allocation (${(group.parity * 100).toFixed(0)}% of expected)`,
            descriptionHindi: `${group.name} समूह कार्य आवंटन में काफी कम प्रतिनिधित्व है (अपेक्षित का ${(group.parity * 100).toFixed(0)}%)`,
            affectedGroup: group.name,
            severity: group.parity < 0.3 ? 'high' : 'medium',
            evidence: { parity: group.parity, expectedRate: group.expectedRate, actualRate: group.actualRate }
          });
        } else if (group.parity > 2) {
          anomalies.push({
            type: 'over_representation',
            description: `${group.name} group is over-represented in work allocation (${(group.parity * 100).toFixed(0)}% of expected)`,
            descriptionHindi: `${group.name} समूह कार्य आवंटन में अधिक प्रतिनिधित्व है (अपेक्षित का ${(group.parity * 100).toFixed(0)}%)`,
            affectedGroup: group.name,
            severity: 'medium',
            evidence: { parity: group.parity, expectedRate: group.expectedRate, actualRate: group.actualRate }
          });
        }
      }
    }

    return anomalies;
  }

  private generateBiasRemediation(
    checks: DemographicParityCheck[],
    anomalies: StatisticalAnomaly[]
  ): BiasRemediation[] {
    const recommendations: BiasRemediation[] = [];

    for (const anomaly of anomalies) {
      if (anomaly.type === 'under_representation') {
        recommendations.push({
          action: `Increase allocation priority for ${anomaly.affectedGroup} group until parity is achieved`,
          actionHindi: `समानता प्राप्त होने तक ${anomaly.affectedGroup} समूह के लिए आवंटन प्राथमिकता बढ़ाएं`,
          priority: anomaly.severity === 'high' ? 'immediate' : 'short_term',
          expectedImpact: 'Improve demographic representation within 30 days'
        });
      }
    }

    // General recommendations
    if (checks.some(c => !c.isBalanced)) {
      recommendations.push({
        action: 'Implement automatic fairness constraints in allocation algorithm',
        actionHindi: 'आवंटन एल्गोरिथम में स्वचालित निष्पक्षता बाधाएं लागू करें',
        priority: 'short_term',
        expectedImpact: 'Systematic bias reduction'
      });

      recommendations.push({
        action: 'Conduct monthly bias audits with community participation',
        actionHindi: 'सामुदायिक भागीदारी के साथ मासिक पक्षपात ऑडिट करें',
        priority: 'long_term',
        expectedImpact: 'Sustainable fairness monitoring'
      });
    }

    return recommendations;
  }

  private getBiasLevel(score: number): 'none' | 'low' | 'moderate' | 'high' | 'severe' {
    if (score < 10) return 'none';
    if (score < 25) return 'low';
    if (score < 50) return 'moderate';
    if (score < 75) return 'high';
    return 'severe';
  }

  private generateBiasExplanation(
    checks: DemographicParityCheck[],
    score: number,
    level: string
  ): ExplainableReasoning {
    const unbalanced = checks.filter(c => !c.isBalanced);
    const balanced = checks.filter(c => c.isBalanced);

    const summary = unbalanced.length > 0
      ? `Bias detected in ${unbalanced.map(c => c.dimension).join(', ')} dimensions. Overall bias score: ${score}/100`
      : `No significant bias detected. System is operating fairly across all dimensions.`;

    const summaryHindi = unbalanced.length > 0
      ? `${unbalanced.map(c => c.dimension).join(', ')} आयामों में पक्षपात पाया गया। कुल पक्षपात स्कोर: ${score}/100`
      : `कोई महत्वपूर्ण पक्षपात नहीं पाया गया। प्रणाली सभी आयामों में निष्पक्ष रूप से काम कर रही है।`;

    const factors = checks.map(c => ({
      name: c.dimension,
      nameHindi: c.dimension,
      value: c.isBalanced ? 'Balanced' : 'Unbalanced',
      impact: c.isBalanced ? 'positive' as const : 'negative' as const,
      weight: 1 / checks.length,
      explanation: c.isBalanced 
        ? `${c.dimension} allocation is proportional to population`
        : `${c.dimension} shows ${(c.deviation * 100).toFixed(0)}% deviation from fair allocation`,
      explanationHindi: c.isBalanced
        ? `${c.dimension} आवंटन जनसंख्या के अनुपात में है`
        : `${c.dimension} में उचित आवंटन से ${(c.deviation * 100).toFixed(0)}% विचलन`
    }));

    const conversational = unbalanced.length > 0
      ? `Our fairness analysis has detected some imbalances in work allocation. Specifically, we found issues with ${unbalanced.map(c => c.dimension).join(' and ')}. We are taking corrective action to ensure everyone gets fair access to work opportunities.`
      : `Our system is distributing work fairly across all groups. We continuously monitor for any biases and take immediate action if needed.`;

    const conversationalHindi = unbalanced.length > 0
      ? `हमारे निष्पक्षता विश्लेषण ने कार्य आवंटन में कुछ असंतुलन पाया है। विशेष रूप से, ${unbalanced.map(c => c.dimension).join(' और ')} में समस्याएं मिलीं। हम सुधारात्मक कार्रवाई कर रहे हैं।`
      : `हमारी प्रणाली सभी समूहों में समान रूप से काम वितरित कर रही है। हम लगातार किसी भी पक्षपात की निगरानी करते हैं।`;

    return {
      summary,
      summaryHindi,
      factors,
      confidence: 0.9,
      dataQuality: 'high',
      humanReadable: summary,
      humanReadableHindi: summaryHindi,
      conversationalResponse: conversational,
      conversationalResponseHindi: conversationalHindi
    };
  }
}

// ============================================
// CONVERSATIONAL AI QUERY HANDLER
// ============================================

export class AllocationQueryHandler {
  private fraudModel: FraudDetectionModel;
  private allocationModel: FairAllocationModel;
  private biasModel: BiasDetectionModel;

  constructor() {
    this.fraudModel = new FraudDetectionModel();
    this.allocationModel = new FairAllocationModel();
    this.biasModel = new BiasDetectionModel();
  }

  /**
   * Handle user queries about allocation with explainable responses
   */
  handleQuery(
    query: AllocationQuery,
    user: MLUserDocument,
    allUsers: MLUserDocument[],
    workRecords: MGNREGAWorkRecord[],
    payments: PaymentTransaction[]
  ): AllocationQueryResponse {
    switch (query.questionType) {
      case 'why_not_allocated':
        return this.explainNoAllocation(user, allUsers, workRecords);
      
      case 'when_will_get_work':
        return this.estimateWorkTimeline(user, allUsers, workRecords);
      
      case 'allocation_status':
        return this.getAllocationStatus(user, allUsers, workRecords);
      
      case 'fairness_check':
        return this.checkFairness(user, allUsers, workRecords);
      
      default:
        return this.getGeneralResponse(query, user);
    }
  }

  private explainNoAllocation(
    user: MLUserDocument,
    allUsers: MLUserDocument[],
    workRecords: MGNREGAWorkRecord[]
  ): AllocationQueryResponse {
    const allocation = this.allocationModel.calculateAllocationScore(user, allUsers, workRecords);
    const totalUsersAhead = allocation.priorityRank - 1;

    const factors = allocation.eligibilityFactors
      .filter(f => !f.isPositive)
      .map(f => f.description);

    const positiveFactors = allocation.eligibilityFactors
      .filter(f => f.isPositive)
      .map(f => f.description);

    let answer = '';
    let answerHindi = '';

    if (user.mgnrega.currentYearDaysRemaining === 0) {
      answer = `You have already completed your 100 days of MGNREGA work for this financial year. You will become eligible again from April 1st of the next financial year.`;
      answerHindi = `आपने इस वित्तीय वर्ष के लिए अपने 100 दिन का मनरेगा कार्य पूरा कर लिया है। आप अगले वित्तीय वर्ष की 1 अप्रैल से फिर से पात्र होंगे।`;
    } else if (allocation.priorityRank > 10) {
      answer = `Your current priority rank is ${allocation.priorityRank} out of ${allUsers.length} workers. There are ${totalUsersAhead} workers with higher priority scores ahead of you. ` +
        `Your score is ${allocation.allocationScore.toFixed(0)}/100. ` +
        (factors.length > 0 ? `Factors that could improve your ranking: ${factors.join('; ')}. ` : '') +
        (positiveFactors.length > 0 ? `However, you have these advantages: ${positiveFactors.slice(0, 2).join('; ')}.` : '');
      
      answerHindi = `आपकी वर्तमान प्राथमिकता क्रम ${allUsers.length} श्रमिकों में से ${allocation.priorityRank} है। आपसे ${totalUsersAhead} श्रमिक आगे हैं। ` +
        `आपका स्कोर ${allocation.allocationScore.toFixed(0)}/100 है। ` +
        (factors.length > 0 ? `आपकी रैंकिंग में सुधार कर सकने वाले कारक: ${allocation.eligibilityFactors.filter(f => !f.isPositive).map(f => f.descriptionHindi).join('; ')}। ` : '') +
        (positiveFactors.length > 0 ? `हालांकि, आपके पास ये फायदे हैं: ${allocation.eligibilityFactors.filter(f => f.isPositive).slice(0, 2).map(f => f.descriptionHindi).join('; ')}।` : '');
    } else {
      answer = `You are in the top priority group with rank ${allocation.priorityRank}. Work allocation should happen within ${allocation.recommendation.priority === 'immediate' ? '3' : '7'} days. ` +
        `${allocation.recommendation.reasonEnglish}`;
      answerHindi = `आप शीर्ष प्राथमिकता समूह में हैं, क्रम ${allocation.priorityRank}। ${allocation.recommendation.priority === 'immediate' ? '3' : '7'} दिनों में कार्य आवंटन होना चाहिए। ` +
        allocation.recommendation.reasonHindi;
    }

    return {
      query: { userId: user.userId, question: 'Why am I not getting work?', questionType: 'why_not_allocated' },
      answer,
      answerHindi,
      reasoning: allocation.explanation,
      nextSteps: [
        'Ensure your job card is active and up to date',
        'Register demand for work at Gram Panchayat',
        'Check if any skill training can improve your priority'
      ],
      nextStepsHindi: [
        'सुनिश्चित करें कि आपका जॉब कार्ड सक्रिय और अपडेट है',
        'ग्राम पंचायत में काम की मांग दर्ज करें',
        'जांचें कि क्या कोई कौशल प्रशिक्षण आपकी प्राथमिकता में सुधार कर सकता है'
      ],
      relatedSchemes: ['PMKVY (Skill Training)', 'DAY-NRLM (Self Employment)']
    };
  }

  private estimateWorkTimeline(
    user: MLUserDocument,
    allUsers: MLUserDocument[],
    workRecords: MGNREGAWorkRecord[]
  ): AllocationQueryResponse {
    const allocation = this.allocationModel.calculateAllocationScore(user, allUsers, workRecords);
    
    let estimatedDays: number;
    let confidence: string;

    switch (allocation.recommendation.priority) {
      case 'immediate':
        estimatedDays = 3;
        confidence = 'high';
        break;
      case 'high':
        estimatedDays = 7;
        confidence = 'high';
        break;
      case 'normal':
        estimatedDays = 14;
        confidence = 'medium';
        break;
      default:
        estimatedDays = 21;
        confidence = 'low';
    }

    const answer = `Based on your current priority (rank ${allocation.priorityRank}), you can expect work allocation within approximately ${estimatedDays} days. ` +
      `This estimate has ${confidence} confidence. ${allocation.recommendation.reasonEnglish}`;

    const answerHindi = `आपकी वर्तमान प्राथमिकता (क्रम ${allocation.priorityRank}) के आधार पर, आप लगभग ${estimatedDays} दिनों में कार्य आवंटन की उम्मीद कर सकते हैं। ` +
      `यह अनुमान ${confidence === 'high' ? 'उच्च' : confidence === 'medium' ? 'मध्यम' : 'कम'} विश्वसनीयता का है। ${allocation.recommendation.reasonHindi}`;

    return {
      query: { userId: user.userId, question: 'When will I get work?', questionType: 'when_will_get_work' },
      answer,
      answerHindi,
      reasoning: allocation.explanation,
      nextSteps: [
        `Check back in ${Math.ceil(estimatedDays / 2)} days for updated status`,
        'Register work demand if not already done',
        'Keep your phone active for work allocation SMS'
      ],
      nextStepsHindi: [
        `अपडेट स्थिति के लिए ${Math.ceil(estimatedDays / 2)} दिनों में फिर से जांचें`,
        'यदि पहले से नहीं किया है तो काम की मांग दर्ज करें',
        'काम आवंटन SMS के लिए अपना फोन सक्रिय रखें'
      ]
    };
  }

  private getAllocationStatus(
    user: MLUserDocument,
    allUsers: MLUserDocument[],
    workRecords: MGNREGAWorkRecord[]
  ): AllocationQueryResponse {
    const allocation = this.allocationModel.calculateAllocationScore(user, allUsers, workRecords);
    const userRecords = workRecords.filter(r => r.userId === user.userId);
    const recentWork = userRecords.filter(r => {
      const daysSince = (Date.now() - new Date(r.date).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    });

    const answer = `**Your MGNREGA Status:**\n` +
      `- Days worked this year: ${user.mgnrega.currentYearDaysWorked}/100\n` +
      `- Days remaining: ${user.mgnrega.currentYearDaysRemaining}\n` +
      `- Pending wages: ₹${user.mgnrega.pendingWages}\n` +
      `- Priority rank: ${allocation.priorityRank}/${allUsers.length}\n` +
      `- Recent work (30 days): ${recentWork.length} days\n\n` +
      `${allocation.recommendation.reasonEnglish}`;

    const answerHindi = `**आपकी मनरेगा स्थिति:**\n` +
      `- इस वर्ष काम किए दिन: ${user.mgnrega.currentYearDaysWorked}/100\n` +
      `- शेष दिन: ${user.mgnrega.currentYearDaysRemaining}\n` +
      `- बकाया मजदूरी: ₹${user.mgnrega.pendingWages}\n` +
      `- प्राथमिकता क्रम: ${allocation.priorityRank}/${allUsers.length}\n` +
      `- हाल का काम (30 दिन): ${recentWork.length} दिन\n\n` +
      allocation.recommendation.reasonHindi;

    return {
      query: { userId: user.userId, question: 'What is my allocation status?', questionType: 'allocation_status' },
      answer,
      answerHindi,
      reasoning: allocation.explanation,
      nextSteps: [
        user.mgnrega.pendingWages > 0 ? 'Follow up on pending wage payment' : '',
        user.mgnrega.currentYearDaysRemaining > 50 ? 'Register for more work days' : '',
        'Update your skills profile for better work matching'
      ].filter(s => s !== ''),
      nextStepsHindi: [
        user.mgnrega.pendingWages > 0 ? 'बकाया मजदूरी भुगतान के लिए फॉलो अप करें' : '',
        user.mgnrega.currentYearDaysRemaining > 50 ? 'अधिक कार्य दिवसों के लिए पंजीकरण करें' : '',
        'बेहतर कार्य मिलान के लिए अपना कौशल प्रोफ़ाइल अपडेट करें'
      ].filter(s => s !== '')
    };
  }

  private checkFairness(
    user: MLUserDocument,
    allUsers: MLUserDocument[],
    workRecords: MGNREGAWorkRecord[]
  ): AllocationQueryResponse {
    const bias = this.biasModel.analyzeAllocations(allUsers, workRecords);
    
    // Find user's category performance
    const userCategory = user.category;
    const casteCheck = bias.demographicParity.find(d => d.dimension === 'caste');
    const userCategoryParity = casteCheck?.groups.find(g => g.name === userCategory);

    let answer = '';
    let answerHindi = '';

    if (bias.biasLevel === 'none' || bias.biasLevel === 'low') {
      answer = `Our fairness analysis shows the work allocation system is operating fairly. ` +
        `Your category (${userCategory}) has ${((userCategoryParity?.parity || 1) * 100).toFixed(0)}% parity in allocations. ` +
        `This means ${userCategory} workers are receiving a proportional share of work opportunities.`;
      
      answerHindi = `हमारा निष्पक्षता विश्लेषण दर्शाता है कि कार्य आवंटन प्रणाली निष्पक्ष रूप से काम कर रही है। ` +
        `आपकी श्रेणी (${userCategory}) में ${((userCategoryParity?.parity || 1) * 100).toFixed(0)}% समानता है। ` +
        `इसका मतलब ${userCategory} श्रमिकों को कार्य अवसरों का आनुपातिक हिस्सा मिल रहा है।`;
    } else {
      answer = `Our fairness analysis has detected ${bias.biasLevel} level bias in the system. ` +
        `${bias.statisticalAnomalies.slice(0, 2).map(a => a.description).join(' ')} ` +
        `We are taking corrective action: ${bias.recommendations[0]?.action || 'Increasing monitoring'}`;
      
      answerHindi = `हमारे निष्पक्षता विश्लेषण ने प्रणाली में ${bias.biasLevel} स्तर का पक्षपात पाया है। ` +
        `${bias.statisticalAnomalies.slice(0, 2).map(a => a.descriptionHindi).join(' ')} ` +
        `हम सुधारात्मक कार्रवाई कर रहे हैं: ${bias.recommendations[0]?.actionHindi || 'निगरानी बढ़ा रहे हैं'}`;
    }

    return {
      query: { userId: user.userId, question: 'Is the system fair?', questionType: 'fairness_check' },
      answer,
      answerHindi,
      reasoning: bias.explanation,
      nextSteps: [
        'If you believe you are being treated unfairly, file a grievance',
        'Attend Gram Sabha meetings for transparent allocation discussions',
        'Report any corruption through our anonymous complaint system'
      ],
      nextStepsHindi: [
        'यदि आपको लगता है कि आपके साथ अनुचित व्यवहार हो रहा है, शिकायत दर्ज करें',
        'पारदर्शी आवंटन चर्चा के लिए ग्राम सभा बैठकों में भाग लें',
        'हमारी गुमनाम शिकायत प्रणाली के माध्यम से किसी भी भ्रष्टाचार की रिपोर्ट करें'
      ],
      appealProcess: 'File grievance through SAHAYOG app or call 1800-XXX-XXXX for immediate assistance'
    };
  }

  private getGeneralResponse(query: AllocationQuery, user: MLUserDocument): AllocationQueryResponse {
    return {
      query,
      answer: `I understand you have a question about work allocation. Please specify: Are you asking about why you haven't been allocated work, when you might get work, your current status, or if the system is fair?`,
      answerHindi: `मैं समझता हूं कि आपका कार्य आवंटन के बारे में प्रश्न है। कृपया बताएं: क्या आप पूछ रहे हैं कि आपको काम क्यों नहीं मिला, कब काम मिलेगा, आपकी वर्तमान स्थिति, या सिस्टम निष्पक्ष है या नहीं?`,
      reasoning: {
        summary: 'Query type unclear - requesting clarification',
        summaryHindi: 'प्रश्न प्रकार स्पष्ट नहीं - स्पष्टीकरण का अनुरोध',
        factors: [],
        confidence: 0.5,
        dataQuality: 'low',
        humanReadable: 'Please provide more specific question',
        humanReadableHindi: 'कृपया अधिक विशिष्ट प्रश्न प्रदान करें',
        conversationalResponse: 'I need more details to help you. What specifically would you like to know?',
        conversationalResponseHindi: 'आपकी मदद के लिए मुझे अधिक जानकारी चाहिए। आप विशेष रूप से क्या जानना चाहते हैं?'
      },
      nextSteps: ['Specify your question type'],
      nextStepsHindi: ['अपने प्रश्न का प्रकार बताएं']
    };
  }

  /**
   * Generate natural language response for conversational AI
   */
  generateConversationalResponse(
    queryResponse: AllocationQueryResponse,
    language: 'en' | 'hi' = 'hi'
  ): string {
    if (language === 'hi') {
      return queryResponse.reasoning.conversationalResponseHindi + '\n\n' +
        (queryResponse.nextStepsHindi.length > 0 
          ? 'आगे के कदम: ' + queryResponse.nextStepsHindi.join(', ') 
          : '');
    }
    
    return queryResponse.reasoning.conversationalResponse + '\n\n' +
      (queryResponse.nextSteps.length > 0 
        ? 'Next steps: ' + queryResponse.nextSteps.join(', ') 
        : '');
  }
}

// ============================================
// MAIN ML ENGINE CLASS
// ============================================

export class SAHAYOGMLEngine {
  public fraudModel: FraudDetectionModel;
  public allocationModel: FairAllocationModel;
  public biasModel: BiasDetectionModel;
  public queryHandler: AllocationQueryHandler;

  constructor() {
    this.fraudModel = new FraudDetectionModel();
    this.allocationModel = new FairAllocationModel();
    this.biasModel = new BiasDetectionModel();
    this.queryHandler = new AllocationQueryHandler();
    
    console.log('[SAHAYOGMLEngine] 🤖 ML/DL Engine initialized');
  }

  /**
   * Run comprehensive analysis for a user
   */
  analyzeUser(
    user: MLUserDocument,
    allUsers: MLUserDocument[],
    workRecords: MGNREGAWorkRecord[],
    payments: PaymentTransaction[]
  ): {
    fraud: FraudPrediction;
    allocation: FairAllocationScore;
    bias: BiasAnalysis;
  } {
    const userWorkRecords = workRecords.filter(r => r.userId === user.userId);
    const userPayments = payments.filter(p => p.userId === user.userId);

    return {
      fraud: this.fraudModel.predict(user, userWorkRecords, userPayments),
      allocation: this.allocationModel.calculateAllocationScore(user, allUsers, workRecords),
      bias: this.biasModel.analyzeAllocations(allUsers, workRecords)
    };
  }

  /**
   * Handle conversational query about allocations
   */
  handleAllocationQuery(
    query: AllocationQuery,
    user: MLUserDocument,
    allUsers: MLUserDocument[],
    workRecords: MGNREGAWorkRecord[],
    payments: PaymentTransaction[]
  ): AllocationQueryResponse {
    return this.queryHandler.handleQuery(query, user, allUsers, workRecords, payments);
  }

  /**
   * Get system-wide fairness report
   */
  getSystemFairnessReport(
    users: MLUserDocument[],
    workRecords: MGNREGAWorkRecord[]
  ): BiasAnalysis {
    return this.biasModel.analyzeAllocations(users, workRecords);
  }
}

// Export singleton instance
export const mlEngine = new SAHAYOGMLEngine();
export default mlEngine;
