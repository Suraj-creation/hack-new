/**
 * SAHAYOG FEATURE ENGINEERING SERVICE
 * Comprehensive feature extraction and engineering for ML models
 * 
 * Implements all 50+ features from MGNREGA-ML-Requirements.md
 * Sections 4.1, 4.2, 4.3, 4.4
 */

import { EnhancedMLUserDocument, MLFeatureDocument } from './mlSchemas_enhanced';

// ============================================
// FEATURE ENGINEERING CONFIGURATION
// ============================================

export interface FeatureWeights {
  // Tier 1: Critical Urgency (40% total weight)
  tier1_urgency: {
    daysSinceLastWork: number;      // 20%
    foodInsecurity: number;          // 10%
    medicalEmergency: number;        // 5%
    dependencyRatio: number;         // 5%
  };
  
  // Tier 2: Vulnerability Index (30% total weight)
  tier2_vulnerability: {
    bplStatus: number;               // 5%
    disabilityStatus: number;        // 5%
    singleParentOrWidow: number;     // 5%
    chronicIllness: number;          // 5%
    recentCalamity: number;          // 5%
    socialExclusion: number;         // 5%
  };
  
  // Tier 3: Entitlement & Fairness (20% total weight)
  tier3_fairness: {
    remainingWorkDays: number;       // 10%
    waitTimeSinceDemand: number;     // 5%
    historicalAllocationGap: number; // 5%
  };
  
  // Tier 4: Capability & Suitability (10% total weight)
  tier4_capability: {
    physicalFitnessMatch: number;    // 3%
    skillMatch: number;              // 3%
    proximityToWorkSite: number;     // 2%
    attendanceHistory: number;       // 2%
  };
}

export const DEFAULT_FEATURE_WEIGHTS: FeatureWeights = {
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

// ============================================
// FEATURE ENGINEERING SERVICE
// ============================================

export class FeatureEngineeringService {
  
  // ====== TIER 1: CRITICAL URGENCY FEATURES ======
  
  /**
   * Calculate days since last work (normalized 0-1)
   * Critical urgency indicator - longer without work = higher priority
   */
  private calculateDaysSinceLastWorkScore(user: EnhancedMLUserDocument): number {
    const daysSince = user.currentStatus.daysSinceLastWork || 0;
    // Normalize: 0 days = 0, 365+ days = 1.0
    return Math.min(daysSince / 365.0, 1.0);
  }
  
  /**
   * Calculate food insecurity score (0-1)
   * Based on days without adequate food per month
   */
  private calculateFoodInsecurityScore(user: EnhancedMLUserDocument): number {
    const daysWithoutFood = user.vulnerability.economicDistress.foodInsecurityScore || 0;
    // Normalize: 0 days = 0, 30 days = 1.0
    return Math.min(daysWithoutFood / 30.0, 1.0);
  }
  
  /**
   * Calculate medical emergency score (0-1)
   */
  private calculateMedicalEmergencyScore(user: EnhancedMLUserDocument): number {
    const health = user.vulnerability.healthVulnerability;
    let score = 0.0;
    
    if (health.medicalEmergencyStatus === 'ongoing') score += 1.0;
    else if (health.medicalEmergencyStatus === 'recent') score += 0.7;
    
    // Add chronic illness impact
    if (health.chronicIllnessInFamily) {
      const criticalIllnesses = ['Cancer', 'Kidney', 'Heart', 'TB'];
      const hasCritical = health.illnessTypes.some(i => criticalIllnesses.includes(i));
      if (hasCritical) score += 0.5;
      else score += 0.3;
    }
    
    // Add high health expense burden
    if (health.monthlyHealthExpenses > 5000) score += 0.3;
    else if (health.monthlyHealthExpenses > 2000) score += 0.1;
    
    return Math.min(score, 1.0);
  }
  
  /**
   * Calculate dependency ratio
   * (children + elderly + disabled) / earning members
   * Higher ratio = more burden = higher priority
   */
  private calculateDependencyRatio(user: EnhancedMLUserDocument): number {
    const household = user.household;
    const dependents = household.dependents || 0;
    const earners = Math.max(household.earningMembers || 1, 1); // avoid divide by zero
    
    const ratio = dependents / earners;
    
    // Normalize: 0 dependents = 0, 5+ dependents per earner = 1.0
    return Math.min(ratio / 5.0, 1.0);
  }
  
  // ====== TIER 2: VULNERABILITY FEATURES ======
  
  /**
   * Calculate BPL status score
   */
  private calculateBPLScore(user: EnhancedMLUserDocument): number {
    if (user.socioeconomic.bplStatus) return 1.0;
    if (user.socioeconomic.rationCardType === 'Antyodaya') return 1.0;
    if (user.socioeconomic.rationCardType === 'Priority') return 0.7;
    return 0.0;
  }
  
  /**
   * Calculate disability score
   */
  private calculateDisabilityScore(user: EnhancedMLUserDocument): number {
    if (!user.disabilityStatus) return 0.0;
    
    const percentage = user.disabilityPercentage || 40;
    // Higher percentage = higher score
    return Math.min(percentage / 100.0, 1.0);
  }
  
  /**
   * Calculate single parent/widow score
   */
  private calculateSingleParentOrWidowScore(user: EnhancedMLUserDocument): number {
    const social = user.vulnerability.socialVulnerability;
    
    if (social.isWidow || social.isWidower) return 1.0;
    if (social.isAbandonedSpouse) return 0.9;
    if (user.household.singleParentStatus) return 0.8;
    
    return 0.0;
  }
  
  /**
   * Calculate chronic illness impact score
   */
  private calculateChronicIllnessScore(user: EnhancedMLUserDocument): number {
    const health = user.vulnerability.healthVulnerability;
    
    if (!health.chronicIllnessInFamily) return 0.0;
    
    // Critical illnesses have higher weight
    const criticalIllnesses = ['Cancer', 'Kidney', 'Heart', 'TB'];
    const hasCritical = health.illnessTypes.some(i => criticalIllnesses.includes(i));
    
    if (hasCritical) return 1.0;
    if (health.illnessTypes.length >= 2) return 0.7;
    return 0.5;
  }
  
  /**
   * Calculate recent calamity impact score
   */
  private calculateRecentCalamityScore(user: EnhancedMLUserDocument): number {
    const calamity = user.vulnerability.socialVulnerability.recentCalamityImpact;
    
    if (!calamity.affected) return 0.0;
    
    switch (calamity.severity) {
      case 'high': return 1.0;
      case 'medium': return 0.6;
      case 'low': return 0.3;
      default: return 0.0;
    }
  }
  
  /**
   * Calculate social exclusion score
   */
  private calculateSocialExclusionScore(user: EnhancedMLUserDocument): number {
    const indicators = user.vulnerability.socialVulnerability.socialExclusionIndicators;
    
    if (!indicators || indicators.length === 0) return 0.0;
    
    // Severe indicators
    const severeIndicators = ['manual_scavenging', 'bonded_labor', 'trafficking'];
    const hasSevere = indicators.some(i => severeIndicators.includes(i));
    
    if (hasSevere) return 1.0;
    if (indicators.length >= 2) return 0.7;
    return 0.4;
  }
  
  /**
   * Calculate composite vulnerability index
   * Weighted sum of all vulnerability factors
   */
  private calculateCompositeVulnerabilityIndex(user: EnhancedMLUserDocument): number {
    const weights = DEFAULT_FEATURE_WEIGHTS.tier2_vulnerability;
    
    const scores = {
      bpl: this.calculateBPLScore(user),
      disability: this.calculateDisabilityScore(user),
      singleParent: this.calculateSingleParentOrWidowScore(user),
      illness: this.calculateChronicIllnessScore(user),
      calamity: this.calculateRecentCalamityScore(user),
      exclusion: this.calculateSocialExclusionScore(user),
    };
    
    const composite = 
      scores.bpl * (weights.bplStatus / 0.30) +
      scores.disability * (weights.disabilityStatus / 0.30) +
      scores.singleParent * (weights.singleParentOrWidow / 0.30) +
      scores.illness * (weights.chronicIllness / 0.30) +
      scores.calamity * (weights.recentCalamity / 0.30) +
      scores.exclusion * (weights.socialExclusion / 0.30);
    
    return Math.min(composite, 1.0);
  }
  
  // ====== TIER 3: FAIRNESS FEATURES ======
  
  /**
   * Calculate remaining work days score
   * Users who worked less should get priority
   */
  private calculateRemainingWorkDaysScore(user: EnhancedMLUserDocument): number {
    const remaining = user.currentStatus.remainingEntitlement || 0;
    // Normalize: 0 days remaining = 0, 100 days remaining = 1.0
    return remaining / 100.0;
  }
  
  /**
   * Calculate wait time since demand score
   */
  private calculateWaitTimeScore(user: EnhancedMLUserDocument): number {
    const waitDays = user.currentStatus.waitTimeSinceDemand || 0;
    // Normalize: 0 days = 0, 90+ days = 1.0
    return Math.min(waitDays / 90.0, 1.0);
  }
  
  /**
   * Calculate historical allocation gap
   * How much less work did user get compared to village average
   */
  private calculateHistoricalAllocationGap(
    user: EnhancedMLUserDocument,
    villageAverage: number = 50
  ): number {
    const userDays = user.workHistory.totalDaysWorked3YearAvg || 0;
    const gap = Math.max(0, villageAverage - userDays);
    
    // Normalize: 0 gap = 0, 50+ days gap = 1.0
    return Math.min(gap / 50.0, 1.0);
  }
  
  // ====== TIER 4: CAPABILITY FEATURES ======
  
  /**
   * Calculate physical fitness match for work type
   */
  private calculatePhysicalFitnessMatch(
    user: EnhancedMLUserDocument,
    workType: 'heavy' | 'moderate' | 'light' = 'moderate'
  ): number {
    const userFitness = user.skillsAndCapability.physicalFitnessLevel;
    
    // Perfect match
    if (userFitness === workType) return 1.0;
    
    // Partial match
    if (userFitness === 'heavy' && workType === 'moderate') return 0.9;
    if (userFitness === 'moderate' && workType === 'light') return 0.9;
    if (userFitness === 'heavy' && workType === 'light') return 0.8;
    
    // Mismatch
    if (userFitness === 'light' && workType === 'heavy') return 0.3;
    if (userFitness === 'moderate' && workType === 'heavy') return 0.6;
    
    return 0.5; // default
  }
  
  /**
   * Calculate skill match score
   */
  private calculateSkillMatchScore(
    user: EnhancedMLUserDocument,
    requiredSkills: string[] = []
  ): number {
    if (requiredSkills.length === 0) return 1.0; // no skill requirement
    
    const userSkills = user.skillsAndCapability.skillsAcquired || [];
    if (userSkills.length === 0) return 0.5; // unskilled but can learn
    
    const matchCount = requiredSkills.filter(req => 
      userSkills.some(skill => skill.toLowerCase().includes(req.toLowerCase()))
    ).length;
    
    return matchCount / requiredSkills.length;
  }
  
  /**
   * Calculate proximity score to work site
   */
  private calculateProximityScore(
    user: EnhancedMLUserDocument,
    workSiteId: string
  ): number {
    const distances = user.geospatialContext.distanceToWorkSites;
    const distance = distances[workSiteId] || Infinity;
    
    const maxCommute = user.availability.maxCommuteDistanceKm || 5;
    
    // Within max commute = 1.0, beyond = decreasing
    if (distance <= maxCommute) return 1.0;
    
    // Penalty for distance beyond max commute
    const penalty = (distance - maxCommute) / 10.0; // 10 km beyond = 0 score
    return Math.max(0, 1.0 - penalty);
  }
  
  /**
   * Calculate attendance history score
   */
  private calculateAttendanceHistoryScore(user: EnhancedMLUserDocument): number {
    const regularity = user.workHistory.attendanceRegularity || 0;
    
    // Convert percentage to 0-1 score
    // But penalize too-perfect attendance (potential fraud)
    if (regularity > 98) return 0.7; // suspicious
    if (regularity < 50) return 0.3; // unreliable
    
    return regularity / 100.0;
  }
  
  // ====== DERIVED COMPOSITE FEATURES ======
  
  /**
   * Work Gap Severity
   * How severe is the work gap compared to community
   */
  private calculateWorkGapSeverity(
    user: EnhancedMLUserDocument,
    villageAverageDays: number = 50
  ): number {
    const daysSince = user.currentStatus.daysSinceLastWork || 0;
    const villageAvgGap = 365 / (villageAverageDays / 7); // average days between work
    
    if (villageAvgGap === 0) return 0;
    
    const severity = daysSince / villageAvgGap;
    return Math.min(severity, 2.0); // cap at 2x severity
  }
  
  /**
   * Desperation Index
   * Multi-factor desperation measure
   * (debt/income) × (dependents/earners) × (days_without_work/365)
   */
  private calculateDesperationIndex(user: EnhancedMLUserDocument): number {
    const debt = user.financial.outstandingDebt || 0;
    const income = Math.max(user.financial.monthlyHouseholdIncome || 1, 1);
    const debtRatio = Math.min(debt / (income * 12), 5.0); // cap at 5x annual income
    
    const dependents = user.household.dependents || 0;
    const earners = Math.max(user.household.earningMembers || 1, 1);
    const dependencyRatio = dependents / earners;
    
    const daysSince = user.currentStatus.daysSinceLastWork || 0;
    const timeRatio = daysSince / 365.0;
    
    const desperation = debtRatio * dependencyRatio * timeRatio;
    
    // Normalize to 0-1 (assumes max desperation = 20)
    return Math.min(desperation / 20.0, 1.0);
  }
  
  /**
   * Entitlement Utilization
   * How much of entitled work days have been used
   */
  private calculateEntitlementUtilization(user: EnhancedMLUserDocument): number {
    const daysWorked = user.currentStatus.daysWorkedThisYear || 0;
    return daysWorked / 100.0; // 100 days is full entitlement
  }
  
  /**
   * Seasonal Adjustment Factor
   * Adjust priority based on agricultural calendar
   */
  private calculateSeasonalAdjustment(
    user: EnhancedMLUserDocument,
    currentMonth: number
  ): number {
    const constraints = user.availability.agriculturalConstraints;
    
    // Sowing season (June-July) - farmers busy
    if ([5, 6].includes(currentMonth) && constraints.sowingSeason) return 0.7;
    
    // Harvesting season (Oct-Nov) - farmers busy
    if ([9, 10].includes(currentMonth) && constraints.harvestingSeason) return 0.7;
    
    // Off-season - higher need for MGNREGA work
    if ([11, 0, 1, 2, 3, 4].includes(currentMonth)) return 1.3;
    
    return 1.0; // normal
  }
  
  /**
   * Community Baseline Deviation
   * How much does user deviate from village average
   */
  private calculateCommunityBaseline(
    user: EnhancedMLUserDocument,
    villageStats: { avgDays: number; avgIncome: number }
  ): number {
    const userDays = user.workHistory.totalDaysWorkedCurrentYear || 0;
    const userIncome = user.financial.monthlyHouseholdIncome || 0;
    
    const daysDeviation = (villageStats.avgDays - userDays) / villageStats.avgDays;
    const incomeDeviation = (villageStats.avgIncome - userIncome) / villageStats.avgIncome;
    
    // Average deviation (higher deviation = more priority)
    const avgDeviation = (daysDeviation + incomeDeviation) / 2;
    
    return Math.max(0, avgDeviation); // only positive deviation counts
  }
  
  // ====== FRAUD RISK FEATURES ======
  
  /**
   * Calculate fraud risk features
   */
  private calculateFraudRiskFeatures(user: EnhancedMLUserDocument): Record<string, number> {
    const flags = user.behavioral.fraudRedFlags;
    
    return {
      // Attendance anomalies
      attendanceTooPerfect: user.workHistory.attendanceRegularity > 98 ? 1 : 0,
      
      // Biometric issues
      biometricFailureRate: flags.biometricMismatchHistory / 
        Math.max(user.workHistory.totalDaysWorkedCurrentYear, 1),
      
      // Account changes
      suspiciousAccountChanges: Math.min(flags.multipleAccountChanges / 5.0, 1.0),
      
      // Collusion indicators
      collusionRisk: flags.collusionIndicators.length > 0 ? 1 : 0,
      
      // Ghost worker indicators
      ghostWorkerRisk: flags.ghostWorkerIndicators.length > 0 ? 1 : 0,
      
      // Previous suspension
      previousSuspension: flags.suspendedPreviously ? 1 : 0,
      
      // Wage withdrawal patterns
      suspiciousWithdrawal: flags.wageWithdrawalPatterns === 'highly_suspicious' ? 1.0 :
                            flags.wageWithdrawalPatterns === 'suspicious' ? 0.6 : 0.0,
    };
  }
  
  // ====== MAIN FEATURE EXTRACTION METHOD ======
  
  /**
   * Extract all features for a user
   * Returns comprehensive feature set for ML models
   */
  public async extractFeatures(
    user: EnhancedMLUserDocument,
    context: {
      villageAverageDays?: number;
      villageAverageIncome?: number;
      workSiteId?: string;
      requiredSkills?: string[];
      workType?: 'heavy' | 'moderate' | 'light';
      currentMonth?: number;
    } = {}
  ): Promise<MLFeatureDocument> {
    
    const villageAvgDays = context.villageAverageDays || 50;
    const villageAvgIncome = context.villageAverageIncome || 5000;
    const currentMonth = context.currentMonth || new Date().getMonth();
    
    // ===== TIER 1: URGENCY FEATURES =====
    const urgencyFeatures = {
      daysSinceLastWorkNormalized: this.calculateDaysSinceLastWorkScore(user),
      foodInsecurityNormalized: this.calculateFoodInsecurityScore(user),
      medicalEmergencyScore: this.calculateMedicalEmergencyScore(user),
      dependencyRatio: this.calculateDependencyRatio(user),
      
      // Composite urgency score
      compositeUrgencyScore: 
        this.calculateDaysSinceLastWorkScore(user) * 0.50 +
        this.calculateFoodInsecurityScore(user) * 0.25 +
        this.calculateMedicalEmergencyScore(user) * 0.125 +
        this.calculateDependencyRatio(user) * 0.125,
    };
    
    // ===== TIER 2: VULNERABILITY FEATURES =====
    const vulnerabilityFeatures = {
      bplScore: this.calculateBPLScore(user),
      disabilityScore: this.calculateDisabilityScore(user),
      singleParentOrWidowScore: this.calculateSingleParentOrWidowScore(user),
      chronicIllnessScore: this.calculateChronicIllnessScore(user),
      calamityImpactScore: this.calculateRecentCalamityScore(user),
      socialExclusionScore: this.calculateSocialExclusionScore(user),
      compositeVulnerabilityIndex: this.calculateCompositeVulnerabilityIndex(user),
    };
    
    // ===== TIER 3: FAIRNESS FEATURES =====
    const fairnessFeatures = {
      remainingWorkDaysNormalized: this.calculateRemainingWorkDaysScore(user),
      waitTimeSinceDemandNormalized: this.calculateWaitTimeScore(user),
      historicalAllocationGap: this.calculateHistoricalAllocationGap(user, villageAvgDays),
    };
    
    // ===== TIER 4: CAPABILITY FEATURES =====
    const capabilityFeatures = {
      physicalFitnessMatch: this.calculatePhysicalFitnessMatch(user, context.workType),
      skillMatchScore: this.calculateSkillMatchScore(user, context.requiredSkills),
      proximityScore: context.workSiteId ? 
        this.calculateProximityScore(user, context.workSiteId) : 1.0,
      attendanceHistoryScore: this.calculateAttendanceHistoryScore(user),
    };
    
    // ===== DERIVED FEATURES =====
    const derivedFeatures = {
      workGapSeverity: this.calculateWorkGapSeverity(user, villageAvgDays),
      desperationIndex: this.calculateDesperationIndex(user),
      entitlementUtilization: this.calculateEntitlementUtilization(user),
      seasonalAdjustment: this.calculateSeasonalAdjustment(user, currentMonth),
      communityBaseline: this.calculateCommunityBaseline(user, {
        avgDays: villageAvgDays,
        avgIncome: villageAvgIncome,
      }),
    };
    
    // ===== FRAUD FEATURES =====
    const fraudFeatures = this.calculateFraudRiskFeatures(user);
    
    // ===== DEMOGRAPHIC FEATURES (for fairness) =====
    const demographicFeatures = {
      isSC: user.casteCategory === 'SC' ? 1 : 0,
      isST: user.casteCategory === 'ST' ? 1 : 0,
      isOBC: user.casteCategory === 'OBC' ? 1 : 0,
      isGeneral: user.casteCategory === 'General' ? 1 : 0,
      isFemale: user.gender === 'female' ? 1 : 0,
      isMale: user.gender === 'male' ? 1 : 0,
      hasDisability: user.disabilityStatus ? 1 : 0,
      isYouth: (user.age >= 18 && user.age <= 35) ? 1 : 0,
      isElderly: user.age >= 55 ? 1 : 0,
    };
    
    // ===== COMBINE ALL FEATURES =====
    const engineeredFeatures = {
      ...urgencyFeatures,
      ...vulnerabilityFeatures,
      ...fairnessFeatures,
      ...capabilityFeatures,
      ...derivedFeatures,
      ...fraudFeatures,
      ...demographicFeatures,
    };
    
    // ===== BUILD FEATURE DOCUMENT =====
    const featureDocument: MLFeatureDocument = {
      userId: user._id!,
      featureVersion: 'v1.0.0',
      
      rawFeatures: {
        // Store raw user data for reference
        daysSinceLastWork: user.currentStatus.daysSinceLastWork,
        daysWorked: user.currentStatus.daysWorkedThisYear,
        dependents: user.household.dependents,
        earners: user.household.earningMembers,
        // ... more raw features
      },
      
      engineeredFeatures,
      
      featureGroups: {
        urgency: urgencyFeatures,
        vulnerability: vulnerabilityFeatures,
        fairness: fairnessFeatures,
        capability: capabilityFeatures,
        fraud: fraudFeatures,
      },
      
      featureMetadata: {
        totalFeatures: Object.keys(engineeredFeatures).length,
        missingFeatures: this.detectMissingFeatures(user),
        dataQuality: this.calculateDataQuality(user),
        lastUpdated: new Date().toISOString(),
      },
      
      computedAt: new Date().toISOString(),
    };
    
    return featureDocument;
  }
  
  // ====== HELPER METHODS ======
  
  /**
   * Detect missing or incomplete features
   */
  private detectMissingFeatures(user: EnhancedMLUserDocument): string[] {
    const missing: string[] = [];
    
    if (!user.currentStatus.daysSinceLastWork) missing.push('daysSinceLastWork');
    if (!user.financial.monthlyHouseholdIncome) missing.push('monthlyHouseholdIncome');
    if (!user.household.dependents) missing.push('dependents');
    if (!user.availability.maxCommuteDistanceKm) missing.push('maxCommuteDistanceKm');
    // ... check more critical features
    
    return missing;
  }
  
  /**
   * Calculate overall data quality score
   */
  private calculateDataQuality(user: EnhancedMLUserDocument): number {
    const criticalFields = [
      user.currentStatus.daysSinceLastWork,
      user.currentStatus.daysWorkedThisYear,
      user.household.dependents,
      user.household.earningMembers,
      user.financial.monthlyHouseholdIncome,
      user.availability.maxCommuteDistanceKm,
      user.skillsAndCapability.physicalFitnessLevel,
    ];
    
    const filledFields = criticalFields.filter(f => f !== undefined && f !== null).length;
    const quality = filledFields / criticalFields.length;
    
    return quality;
  }
  
  /**
   * Calculate final priority score using weighted features
   */
  public calculatePriorityScore(
    features: MLFeatureDocument,
    weights: FeatureWeights = DEFAULT_FEATURE_WEIGHTS
  ): number {
    const f = features.featureGroups;
    
    // Tier 1: Urgency (40%)
    const urgencyScore = 
      f.urgency.daysSinceLastWorkNormalized * weights.tier1_urgency.daysSinceLastWork +
      f.urgency.foodInsecurityNormalized * weights.tier1_urgency.foodInsecurity +
      f.urgency.medicalEmergencyScore * weights.tier1_urgency.medicalEmergency +
      f.urgency.dependencyRatio * weights.tier1_urgency.dependencyRatio;
    
    // Tier 2: Vulnerability (30%)
    const vulnerabilityScore =
      f.vulnerability.bplScore * weights.tier2_vulnerability.bplStatus +
      f.vulnerability.disabilityScore * weights.tier2_vulnerability.disabilityStatus +
      f.vulnerability.singleParentOrWidowScore * weights.tier2_vulnerability.singleParentOrWidow +
      f.vulnerability.chronicIllnessScore * weights.tier2_vulnerability.chronicIllness +
      f.vulnerability.calamityImpactScore * weights.tier2_vulnerability.recentCalamity +
      f.vulnerability.socialExclusionScore * weights.tier2_vulnerability.socialExclusion;
    
    // Tier 3: Fairness (20%)
    const fairnessScore =
      f.fairness.remainingWorkDaysNormalized * weights.tier3_fairness.remainingWorkDays +
      f.fairness.waitTimeSinceDemandNormalized * weights.tier3_fairness.waitTimeSinceDemand +
      f.fairness.historicalAllocationGap * weights.tier3_fairness.historicalAllocationGap;
    
    // Tier 4: Capability (10%)
    const capabilityScore =
      f.capability.physicalFitnessMatch * weights.tier4_capability.physicalFitnessMatch +
      f.capability.skillMatchScore * weights.tier4_capability.skillMatch +
      f.capability.proximityScore * weights.tier4_capability.proximityToWorkSite +
      f.capability.attendanceHistoryScore * weights.tier4_capability.attendanceHistory;
    
    // Total score (0-1)
    const totalScore = urgencyScore + vulnerabilityScore + fairnessScore + capabilityScore;
    
    // Convert to 0-100 scale
    return Math.round(totalScore * 100);
  }
}

// ====== SINGLETON EXPORT ======

export const featureEngineeringService = new FeatureEngineeringService();
