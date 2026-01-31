/**
 * SAHAYOG ENHANCED ML/DL SCHEMAS
 * Complete MongoDB schemas for ML/DL system as per requirements
 * 
 * Based on:
 * - MGNREGA-ML-System-Requirements.md
 * - MGNREGA-ML-Requirements.md
 * - unified_solution.md
 */

// ============================================
// ENHANCED USER SCHEMA WITH ALL 138 DATA POINTS
// ============================================

export interface EnhancedMLUserDocument {
  _id?: string;
  
  // ===== SECTION 1: CORE IDENTITY (from requirements 2.1) =====
  aadhaarNumber: string; // encrypted
  jobCardNumber?: string;
  fullName: string;
  dateOfBirth: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  casteCategory: 'SC' | 'ST' | 'OBC' | 'General';
  disabilityStatus: boolean;
  disabilityType?: string;
  disabilityPercentage?: number;
  maritalStatus?: 'married' | 'unmarried' | 'widowed' | 'divorced' | 'abandoned';
  educationLevel: 'illiterate' | 'primary' | 'secondary' | 'higher';
  
  // ===== SECTION 2: CONTACT & LOCATION (2.1) =====
  phoneNumber: string;
  alternateMobile?: string;
  residentialAddress: {
    village: string;
    villageLGDCode: string;
    ward?: string;
    gramPanchayat: string;
    block: string;
    district: string;
    districtLGDCode: string;
    state: string;
    pincode?: string;
  };
  gpsCoordinates: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    lastUpdated: string;
  };
  preferredLanguage: string; // One of 22 Indian languages
  
  // ===== SECTION 3: FAMILY & HOUSEHOLD (2.2) =====
  household: {
    totalMembers: number;
    dependents: number; // children + elderly + disabled
    earningMembers: number;
    childrenUnder5: number;
    schoolGoingChildren: number;
    elderlyOver60: number;
    pregnantOrLactating: boolean;
    singleParentStatus: boolean;
    elderlyCareResponsibility: boolean;
  };
  
  // ===== SECTION 4: SOCIOECONOMIC INDICATORS (2.2) =====
  socioeconomic: {
    bplStatus: boolean;
    aplStatus: boolean;
    rationCardType: 'Antyodaya' | 'Priority' | 'Non-priority' | 'None';
    landOwnership: 'landless' | 'marginal' | 'small' | 'medium' | 'large';
    landHectares: number;
    livestock: {
      count: number;
      types: string[]; // ['cow', 'buffalo', 'goat', etc.]
    };
    housingType: 'kuccha' | 'semi-pucca' | 'pucca';
    hasToilet: boolean;
    drinkingWaterDistance: number; // meters
    hasElectricity: boolean;
  };
  
  // ===== SECTION 5: FINANCIAL STATUS (2.2) =====
  financial: {
    bankAccountNumber: string; // encrypted
    ifscCode: string;
    bankName: string;
    outstandingDebt: number;
    debtSources: Array<{
      source: 'moneylender' | 'bank' | 'shu_group' | 'relative' | 'other';
      amount: number;
      interestRate: number; // annual percentage
      isPredatory: boolean; // >36% interest
    }>;
    monthlyHouseholdIncome: number; // estimated
    governmentBenefits: Array<{
      scheme: string; // PM-KISAN, pension, etc.
      amount: number;
      lastReceived: string;
    }>;
  };
  
  // ===== SECTION 6: WORK HISTORY (2.3) =====
  workHistory: {
    totalDaysWorkedCurrentYear: number;
    totalDaysWorkedLastYear: number;
    totalDaysWorked3YearAvg: number;
    workStartDates: string[]; // array of all work period starts
    workEndDates: string[]; // array of all work period ends
    workTypesPerformed: string[]; // skill mapping
    workSitesAttended: string[]; // location history
    wagesReceived: Array<{
      amount: number;
      date: string;
      delayDays: number;
    }>;
    workQualityRatings: Array<{
      date: string;
      rating: number; // 1-5
      supervisor: string;
    }>;
    attendanceRegularity: number; // percentage 0-100
  };
  
  // ===== SECTION 7: CURRENT STATUS (2.3) =====
  currentStatus: {
    daysSinceLastWork: number; // CRITICAL URGENCY INDICATOR
    consecutiveDaysWithoutWork: number; // hardship measure
    daysWorkedThisYear: number;
    remainingEntitlement: number; // 100 - daysWorkedThisYear
    workDemandStatus: 'not_applied' | 'applied' | 'waiting' | 'allocated' | 'working';
    workDemandDate?: string; // when user requested work
    waitTimeSinceDemand: number; // days waiting
  };
  
  // ===== SECTION 8: AVAILABILITY & CONSTRAINTS (2.3) =====
  availability: {
    availableStartDate?: string;
    preferredWorkSites: string[]; // proximity ranking
    maxCommuteDistanceKm: number;
    healthStatus: 'fit' | 'temporarily_unfit' | 'restricted_work';
    healthRestrictions?: string[]; // 'no_heavy_lifting', 'outdoor_only', etc.
    currentEmploymentStatus: 'unemployed' | 'part_time' | 'seasonal' | 'other';
    seasonalMigrationStatus: 'not_migrated' | 'planning' | 'migrated';
    agriculturalConstraints: {
      sowingSeason: boolean; // busy with own farming
      harvestingSeason: boolean;
    };
  };
  
  // ===== SECTION 9: VULNERABILITY INDICATORS (2.4) =====
  vulnerability: {
    // Health & Medical
    healthVulnerability: {
      chronicIllnessInFamily: boolean;
      illnessTypes: string[]; // ['TB', 'Cancer', 'Kidney', 'Heart', etc.]
      medicalEmergencyStatus: 'none' | 'recent' | 'ongoing';
      monthlyHealthExpenses: number;
      malnutritionStatus: 'none' | 'mild' | 'moderate' | 'severe';
    };
    
    // Social Vulnerabilities
    socialVulnerability: {
      isWidow: boolean;
      isWidower: boolean;
      isAbandonedSpouse: boolean;
      domesticViolenceIndicator: boolean;
      recentDeathInFamily: boolean; // within 6 months
      deathDate?: string;
      recentCalamityImpact: {
        affected: boolean;
        type?: 'flood' | 'drought' | 'fire' | 'earthquake' | 'other';
        severity?: 'low' | 'medium' | 'high';
        date?: string;
      };
      evictionOrLandDispute: boolean;
      socialExclusionIndicators: string[]; // manual scavenging, etc.
    };
    
    // Economic Distress
    economicDistress: {
      foodInsecurityScore: number; // 0-30 (days without adequate food/month)
      childSchoolDropoutRisk: boolean;
      loanDefaultStatus: boolean;
      assetSaleForSurvival: boolean; // sold livestock/jewelry
      assetsSold?: string[];
      migrationDueToDistress: boolean;
    };
    
    // Environmental Vulnerabilities
    environmentalVulnerability: {
      droughtAffected: boolean;
      droughtSeverity?: 'mild' | 'moderate' | 'severe';
      floodAffected: boolean;
      floodImpact?: string;
      cropFailure: boolean;
      cropFailureSeasons?: string[];
      climateVulnerabilityIndex: number; // 0-10
    };
  };
  
  // ===== SECTION 10: SKILLS & CAPABILITY (2.5) =====
  skillsAndCapability: {
    physicalFitnessLevel: 'heavy' | 'moderate' | 'light';
    skillsAcquired: string[]; // masonry, plumbing, plantation, etc.
    trainingCompleted: Array<{
      name: string;
      provider: string; // MGNREGA, PMKVY, etc.
      completionDate: string;
      certificate?: string; // URL or ID
    }>;
    literacyLevel: 'cannot_read_write' | 'can_read' | 'can_write' | 'fully_literate';
    technicalSkills: {
      canUsePhone: boolean;
      digitalLiteracy: 'none' | 'basic' | 'intermediate' | 'advanced';
    };
    languageProficiency: string[]; // languages understood for instructions
    previousWorkExperience: string[]; // outside MGNREGA
    willingForSkillTraining: boolean;
  };
  
  // ===== SECTION 11: BEHAVIORAL & ENGAGEMENT (2.6) =====
  behavioral: {
    // Positive Indicators
    positiveIndicators: {
      workCompletionRate: number; // percentage 0-100
      qualityOfWorkScore: number; // 0-5 from supervisors
      attendancePunctuality: number; // on-time arrival %
      safetyCompliance: number; // 0-5
      communityParticipation: number; // gram sabha attendance %
      grievanceCooperation: number; // rating 1-5
    };
    
    // Red Flags for Fraud Detection
    fraudRedFlags: {
      duplicateJobCardAttempts: number;
      ghostWorkerIndicators: string[]; // rare attendance, proxy attempts
      wageWithdrawalPatterns: 'normal' | 'suspicious' | 'highly_suspicious';
      multipleAccountChanges: number;
      collusionIndicators: string[];
      biometricMismatchHistory: number; // failed authentications
      complaintHistory: Array<{
        type: 'filed_by' | 'filed_against';
        date: string;
        status: string;
      }>;
      suspendedPreviously: boolean;
      suspensionReason?: string;
    };
  };
  
  // ===== SECTION 12: GEOSPATIAL CONTEXT (2.7) =====
  geospatialContext: {
    distanceToWorkSites: Record<string, number>; // {workSiteId: distance_km}
    transportAvailability: 'none' | 'public' | 'private' | 'own_vehicle';
    roadConnectivity: 'paved' | 'unpaved' | 'seasonal';
    workSiteSuitability: Record<string, boolean>; // {workSiteId: suitable}
    localEmploymentOpportunities: string[]; // harvest season, construction boom
    villageMigrationPattern: 'low' | 'medium' | 'high';
  };
  
  // ===== SECTION 13: CONVERSATIONAL AI DATA (2.8) =====
  conversationalData: {
    // Real-time Extraction
    currentSituation: {
      description: string; // free text from conversation
      urgencyLevel: 'low' | 'medium' | 'high' | 'critical'; // AI-inferred
      specificNeeds: string[]; // food, medicine, child education, debt repayment
      emotionalState: 'calm' | 'worried' | 'desperate' | 'angry'; // sentiment
      familyCrisisDetails?: string;
      recentLifeEvents: string[];
      barriersToWork: string[]; // childcare issues, health, transport
      preferenceChanges?: string; // willing to travel further if urgent
    };
    
    // Conversational Patterns
    conversationPatterns: {
      inquiryFrequency: number; // how often checking for work
      communicationStyle: 'assertive' | 'hesitant' | 'confused' | 'confident';
      informationCompleteness: 'complete' | 'incomplete' | 'contradictory';
      followUpBehavior: 'persistent' | 'drops_off';
      inferredEducationLevel: 'low' | 'medium' | 'high';
      lastConversationDate: string;
      totalConversations: number;
    };
  };
  
  // ===== SECTION 14: ML COMPUTED FEATURES (derived) =====
  mlFeatures: {
    // Tier 1: Critical Urgency (40% weight)
    urgencyFeatures: {
      daysSinceLastWorkNormalized: number; // 0-1
      foodInsecurityNormalized: number; // 0-1
      medicalEmergencyScore: number; // 0-1
      dependencyRatio: number; // (children + elderly) / earners
    };
    
    // Tier 2: Vulnerability Index (30% weight)
    vulnerabilityFeatures: {
      bplScore: number; // 0-1
      disabilityScore: number; // 0-1
      singleParentOrWidowScore: number; // 0-1
      chronicIllnessScore: number; // 0-1
      calamityImpactScore: number; // 0-1
      socialExclusionScore: number; // 0-1
      compositeVulnerabilityIndex: number; // 0-1 weighted sum
    };
    
    // Tier 3: Entitlement & Fairness (20% weight)
    fairnessFeatures: {
      remainingWorkDaysNormalized: number; // 0-1
      waitTimeSinceDemandNormalized: number; // 0-1
      historicalAllocationGap: number; // 0-1 (how much less than average)
    };
    
    // Tier 4: Capability & Suitability (10% weight)
    capabilityFeatures: {
      physicalFitnessMatch: number; // 0-1
      skillMatchScore: number; // 0-1
      proximityScore: number; // 0-1 (closer is better)
      attendanceHistoryScore: number; // 0-1
    };
    
    // Derived Composite Features
    derivedFeatures: {
      workGapSeverity: number; // days_since_last / village_average
      desperationIndex: number; // (debt/income) × (dependents/earners) × days_without_work
      entitlementUtilization: number; // days_worked / days_demanded
      seasonalAdjustment: number; // agricultural calendar impact
      communityBaseline: number; // deviation from village average
    };
    
    // Final ML Outputs
    mlOutputs: {
      priorityScore: number; // 0-100 from ML model
      fraudRiskScore: number; // 0-100
      allocationRecommendation: 'immediate' | 'high' | 'normal' | 'waitlist';
      predictedDropoutRisk: number; // 0-1
      vulnerabilityTrajectory: 'improving' | 'stable' | 'worsening';
    };
    
    lastComputedAt: string;
    modelVersion: string;
  };
  
  // ===== TIMESTAMPS & METADATA =====
  metadata: {
    createdAt: string;
    updatedAt: string;
    lastWorkAllocation?: string;
    lastDataSync: string;
    dataQualityScore: number; // 0-100 based on completeness
    verificationStatus: 'unverified' | 'partially_verified' | 'fully_verified';
  };
}

// ============================================
// ML FEATURE STORE COLLECTION
// ============================================

export interface MLFeatureDocument {
  _id?: string;
  userId: string;
  featureVersion: string; // for versioning feature definitions
  
  // Raw Features (as collected)
  rawFeatures: Record<string, any>;
  
  // Engineered Features (derived)
  engineeredFeatures: Record<string, number>;
  
  // Feature Groups
  featureGroups: {
    urgency: Record<string, number>;
    vulnerability: Record<string, number>;
    fairness: Record<string, number>;
    capability: Record<string, number>;
    fraud: Record<string, number>;
  };
  
  // Feature Metadata
  featureMetadata: {
    totalFeatures: number;
    missingFeatures: string[];
    dataQuality: number; // 0-1
    lastUpdated: string;
  };
  
  // For training data
  labels?: {
    actualWorkReceived: boolean;
    daysAllocated?: number;
    fraudDetected?: boolean;
    userSatisfaction?: number;
  };
  
  computedAt: string;
}

// ============================================
// ML MODEL REGISTRY
// ============================================

export interface MLModelDocument {
  _id?: string;
  modelId: string;
  modelName: string;
  modelType: 'priority_scoring' | 'fraud_detection' | 'allocation_optimizer' | 'nlp_context' | 'predictive';
  version: string;
  
  // Model Artifacts
  modelPath?: string; // S3 or file path
  modelConfig: Record<string, any>;
  
  // Training Information
  trainingInfo: {
    trainedAt: string;
    trainingDataSize: number;
    validationDataSize: number;
    testDataSize: number;
    trainingDuration: number; // seconds
    hyperparameters: Record<string, any>;
  };
  
  // Performance Metrics
  performance: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    auc?: number;
    giniCoefficient?: number; // for fairness
    demographicParity?: Record<string, number>; // by group
    customMetrics: Record<string, number>;
  };
  
  // Fairness Metrics
  fairnessMetrics: {
    overallBiasScore: number; // 0-100, lower is better
    biasLevel: 'none' | 'low' | 'moderate' | 'high' | 'severe';
    groupMetrics: Array<{
      group: string; // SC, ST, OBC, General, Male, Female
      allocationRate: number;
      expectedRate: number;
      disparity: number; // allocationRate / expectedRate
    }>;
  };
  
  // Deployment Information
  deployment: {
    isActive: boolean;
    deployedAt?: string;
    deployedBy: string;
    environment: 'development' | 'staging' | 'production';
    rolloutPercentage: number; // for A/B testing
  };
  
  // Model Monitoring
  monitoring: {
    totalPredictions: number;
    avgPredictionTime: number; // milliseconds
    errorRate: number;
    driftDetected: boolean;
    lastMonitoredAt: string;
  };
  
  createdAt: string;
  updatedBy: string;
}

// ============================================
// ML TRAINING LOGS
// ============================================

export interface MLTrainingLogDocument {
  _id?: string;
  trainingId: string;
  modelId: string;
  modelType: string;
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  
  // Training Configuration
  config: {
    algorithm: string;
    framework: 'tensorflow' | 'pytorch' | 'sklearn' | 'xgboost' | 'lightgbm';
    hyperparameters: Record<string, any>;
    datasetSize: number;
    features: string[];
    targetVariable: string;
  };
  
  // Progress Tracking
  progress: {
    currentEpoch?: number;
    totalEpochs?: number;
    currentLoss?: number;
    validationLoss?: number;
    metrics: Record<string, number>;
  };
  
  // Results
  results?: {
    finalMetrics: Record<string, number>;
    bestEpoch: number;
    modelPath: string;
    confusionMatrix?: number[][];
    featureImportance?: Array<{
      feature: string;
      importance: number;
    }>;
  };
  
  // Error Information
  error?: {
    message: string;
    stackTrace: string;
    failedAt: string;
  };
  
  // Resource Usage
  resources: {
    cpuUsage?: number;
    memoryUsage?: number;
    gpuUsage?: number;
    duration: number; // seconds
  };
  
  triggeredBy: string; // user or 'automated'
  notes?: string;
}

// ============================================
// ML PREDICTIONS CACHE & AUDIT
// ============================================

export interface MLPredictionDocument {
  _id?: string;
  predictionId: string;
  userId: string;
  modelId: string;
  modelVersion: string;
  predictionType: 'priority_score' | 'fraud_risk' | 'allocation' | 'dropout_risk' | 'other';
  
  // Input Features
  inputFeatures: Record<string, any>;
  
  // Prediction Results
  prediction: {
    primaryScore: number; // main output (priority score, fraud probability, etc.)
    secondaryOutputs?: Record<string, any>;
    confidence: number; // 0-1
    predictionClass?: string; // for classification tasks
    predictionProba?: Record<string, number>; // class probabilities
  };
  
  // Explainability
  explanation: {
    topFeatures: Array<{
      feature: string;
      featureDisplayName: string;
      featureDisplayNameHindi: string;
      contribution: number; // SHAP value
      value: any; // actual feature value
    }>;
    narrativeEnglish: string;
    narrativeHindi: string;
    counterfactuals?: Array<{
      feature: string;
      currentValue: any;
      suggestedValue: any;
      expectedScoreChange: number;
    }>;
  };
  
  // Audit Trail
  audit: {
    predictedAt: string;
    predictedBy: string; // 'system', 'manual_request', 'api_call'
    usedInDecision: boolean;
    decisionId?: string; // link to allocation/grievance decision
    userFeedback?: {
      helpful: boolean;
      comments?: string;
      rating?: number;
    };
  };
  
  // Cache Control
  cache: {
    expiresAt: string;
    isCached: boolean;
    cacheHit: boolean;
  };
}

// ============================================
// FAIRNESS AUDIT TRAIL
// ============================================

export interface FairnessAuditDocument {
  _id?: string;
  auditId: string;
  auditDate: string;
  auditPeriod: {
    startDate: string;
    endDate: string;
  };
  
  // Allocation Statistics
  allocationStats: {
    totalUsers: number;
    totalAllocations: number;
    totalWorkDays: number;
    averageDaysPerUser: number;
    giniCoefficient: number; // 0-1, 0 = perfect equality
  };
  
  // Demographic Parity Analysis
  demographicParity: {
    byCaste: Array<{
      category: 'SC' | 'ST' | 'OBC' | 'General';
      population: number; // count
      populationPercentage: number;
      allocations: number;
      allocationRate: number; // allocations / population
      expectedRate: number; // if perfectly fair
      parityRatio: number; // allocationRate / expectedRate (should be ~1.0)
      disparity: 'none' | 'low' | 'moderate' | 'high' | 'severe';
    }>;
    
    byGender: Array<{
      gender: 'male' | 'female' | 'other';
      population: number;
      populationPercentage: number;
      allocations: number;
      allocationRate: number;
      expectedRate: number;
      parityRatio: number;
      disparity: 'none' | 'low' | 'moderate' | 'high' | 'severe';
    }>;
    
    byDisability: {
      disabled: { population: number; allocations: number; rate: number; };
      notDisabled: { population: number; allocations: number; rate: number; };
      parityRatio: number;
    };
    
    byLocation: Array<{
      block: string;
      population: number;
      allocations: number;
      allocationRate: number;
      disparity: string;
    }>;
  };
  
  // Statistical Anomalies
  anomalies: Array<{
    type: 'under_allocation' | 'over_allocation' | 'bias_detected' | 'systematic_exclusion';
    affectedGroup: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    descriptionHindi: string;
    evidence: Record<string, any>;
    detectedAt: string;
  }>;
  
  // Bias Indicators
  biasIndicators: {
    overallBiasScore: number; // 0-100
    biasLevel: 'none' | 'low' | 'moderate' | 'high' | 'severe';
    detectedBiases: string[];
  };
  
  // Recommendations
  recommendations: Array<{
    priority: 'immediate' | 'high' | 'medium' | 'low';
    action: string;
    actionHindi: string;
    targetGroup: string;
    expectedImpact: string;
  }>;
  
  // Compliance
  compliance: {
    genderQuotaMet: boolean; // ≥33% women
    scStQuotaMet: boolean;
    disabilityQuotaMet: boolean; // ≥5%
    giniTarget: boolean; // <0.3
    overallCompliant: boolean;
  };
  
  auditedBy: string;
  approvedBy?: string;
  status: 'draft' | 'published' | 'action_required';
  notes?: string;
}

// ============================================
// EXPLAINABILITY LOGS
// ============================================

export interface ExplainabilityLogDocument {
  _id?: string;
  explanationId: string;
  userId: string;
  questionType: 'why_me' | 'why_not_me' | 'when_will_i_get' | 'comparison' | 'fairness_check';
  question: string;
  questionHindi: string;
  
  // Context
  context: {
    userState: Record<string, any>; // relevant user features at time of query
    allocationContext: Record<string, any>; // available work, competition, etc.
    timestamp: string;
  };
  
  // Explanation Generated
  explanation: {
    type: 'individual' | 'comparative' | 'system_wide';
    
    // Individual Explanation
    individualExplanation?: {
      primaryReasons: Array<{
        reason: string;
        reasonHindi: string;
        weight: number; // percentage contribution
        score: number;
        maxScore: number;
        isPositive: boolean; // helps or hurts allocation
      }>;
      secondaryReasons: Array<{
        reason: string;
        reasonHindi: string;
        weight: number;
        score: number;
      }>;
      suitabilityFactors: Array<{
        factor: string;
        factorHindi: string;
        status: 'good' | 'acceptable' | 'poor';
        details: string;
      }>;
      fairnessConsiderations: string[];
    };
    
    // Comparative Explanation (me vs others)
    comparativeExplanation?: {
      comparedWith: string; // userId or "average user"
      comparisonFactors: Array<{
        factor: string;
        factorHindi: string;
        myValue: any;
        theirValue: any;
        advantage: 'me' | 'them' | 'equal';
        reason: string;
        reasonHindi: string;
      }>;
      fairnessCheck: string;
    };
    
    // System-wide Explanation
    systemExplanation?: {
      totalDemand: number;
      totalCapacity: number;
      allocationMethodology: string[];
      fairnessMetrics: Record<string, number>;
      unmetDemand: number;
      nextSteps: string[];
    };
    
    // Counterfactuals ("What if...")
    counterfactuals?: Array<{
      changeDescription: string;
      changeDescriptionHindi: string;
      currentValue: any;
      requiredValue: any;
      estimatedScoreChange: number;
      feasibility: 'easy' | 'moderate' | 'difficult' | 'impossible';
    }>;
    
    // Visual Explanation Data (for charts)
    visualData?: {
      priorityBreakdown: Array<{ category: string; value: number; }>;
      comparisonChart: Array<{ metric: string; myValue: number; avgValue: number; }>;
      fairnessIndicators: Record<string, number>;
    };
  };
  
  // Delivery
  delivery: {
    format: 'text' | 'voice' | 'visual' | 'multimodal';
    language: string;
    deliveredAt: string;
    deliveredVia: 'app' | 'ivr' | 'whatsapp' | 'sms';
  };
  
  // User Feedback
  feedback?: {
    understood: boolean;
    helpful: boolean;
    rating: number; // 1-5
    comments?: string;
    followUpQuestions?: string[];
  };
  
  // Performance
  performance: {
    generationTimeMs: number;
    modelVersion: string;
    explainerVersion: string;
  };
}

// ============================================
// BIAS INCIDENT TRACKING
// ============================================

export interface BiasIncidentDocument {
  _id?: string;
  incidentId: string;
  detectedAt: string;
  
  // Incident Details
  incidentType: 'allocation_bias' | 'systematic_exclusion' | 'unfair_treatment' | 'discrimination' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  // Affected Parties
  affected: {
    userIds?: string[];
    group?: string; // 'SC', 'ST', 'Women', 'Disabled', etc.
    affectedCount: number;
  };
  
  // Bias Description
  description: {
    summary: string;
    detailedDescription: string;
    detectionMethod: 'automated_audit' | 'user_complaint' | 'manual_review';
    evidence: Record<string, any>;
    statisticalSignificance: number; // p-value
  };
  
  // Impact Assessment
  impact: {
    workDaysLost: number;
    wagesLost: number;
    usersAffected: number;
    reputationRisk: 'low' | 'medium' | 'high';
  };
  
  // Root Cause Analysis
  rootCause: {
    identified: boolean;
    cause?: string;
    relatedModels?: string[]; // model IDs that contributed
    relatedDecisions?: string[]; // decision IDs
    isSystematic: boolean;
  };
  
  // Remediation
  remediation: {
    status: 'pending' | 'in_progress' | 'completed' | 'escalated';
    actions: Array<{
      action: string;
      assignedTo: string;
      dueDate: string;
      completedAt?: string;
      status: 'pending' | 'completed';
    }>;
    compensationProvided: boolean;
    compensationDetails?: string;
  };
  
  // Follow-up
  followUp: {
    auditScheduled: boolean;
    auditDate?: string;
    preventiveMeasures: string[];
    policyChanges?: string[];
  };
  
  reportedBy: string;
  assignedTo: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  resolution?: string;
  closedAt?: string;
}

// ============================================
// ALLOCATION HISTORY (Full Audit Trail)
// ============================================

export interface AllocationHistoryDocument {
  _id?: string;
  allocationId: string;
  allocationDate: string;
  
  // Allocation Batch Info
  batchInfo: {
    batchId: string;
    district: string;
    block: string;
    gramPanchayat: string;
    totalPositions: number;
    totalApplicants: number;
    allocationMethod: 'ml_optimized' | 'manual' | 'first_come_first_served' | 'lottery';
  };
  
  // Individual Allocation
  userId: string;
  workOpportunityId: string;
  workDetails: {
    workType: string;
    workSite: string;
    startDate: string;
    endDate: string;
    allocatedDays: number;
    expectedWage: number;
  };
  
  // Decision Factors
  decisionFactors: {
    priorityScore: number;
    rank: number; // among all applicants
    modelVersion: string;
    topReasons: Array<{
      reason: string;
      weight: number;
    }>;
    fraudCheckPassed: boolean;
    fairnessCheckPassed: boolean;
  };
  
  // Fairness Metadata
  fairnessMetadata: {
    casteQuota: boolean; // was caste quota applied?
    genderQuota: boolean;
    disabilityQuota: boolean;
    demographicGroup: string;
    allocationWithinQuota: boolean;
  };
  
  // Outcome Tracking
  outcome?: {
    attended: boolean;
    daysWorked: number;
    workCompleted: boolean;
    qualityRating?: number;
    wagePaid: number;
    wageDelayDays: number;
    userSatisfaction?: number;
  };
  
  // Appeal/Complaint
  appeal?: {
    filed: boolean;
    filedAt?: string;
    reason?: string;
    status?: 'pending' | 'accepted' | 'rejected';
    outcome?: string;
  };
  
  createdAt: string;
  createdBy: string;
  lastUpdated: string;
}

// ============================================
// INDEXES FOR OPTIMIZED QUERIES
// ============================================

export const ML_SCHEMA_INDEXES = {
  enhanced_ml_users: [
    { key: { aadhaarNumber: 1 }, unique: true },
    { key: { jobCardNumber: 1 }, sparse: true },
    { key: { phoneNumber: 1 } },
    { key: { 'residentialAddress.villageLGDCode': 1, 'currentStatus.workDemandStatus': 1 } },
    { key: { 'currentStatus.daysSinceLastWork': -1 } }, // descending for priority
    { key: { 'mlFeatures.mlOutputs.priorityScore': -1 } },
    { key: { 'mlFeatures.mlOutputs.fraudRiskScore': -1 } },
    { key: { 'gpsCoordinates': '2dsphere' } }, // geospatial
  ],
  
  ml_features: [
    { key: { userId: 1, featureVersion: 1 } },
    { key: { computedAt: -1 } },
    { key: { 'labels.fraudDetected': 1 }, sparse: true },
  ],
  
  ml_models: [
    { key: { modelId: 1, version: 1 }, unique: true },
    { key: { modelType: 1, 'deployment.isActive': 1 } },
    { key: { 'deployment.deployedAt': -1 } },
  ],
  
  ml_predictions: [
    { key: { userId: 1, predictionType: 1, 'audit.predictedAt': -1 } },
    { key: { modelId: 1, modelVersion: 1 } },
    { key: { 'cache.expiresAt': 1 }, expireAfterSeconds: 0 }, // TTL index
  ],
  
  fairness_audits: [
    { key: { auditDate: -1 } },
    { key: { 'auditPeriod.startDate': 1, 'auditPeriod.endDate': 1 } },
    { key: { 'compliance.overallCompliant': 1 } },
  ],
  
  bias_incidents: [
    { key: { status: 1, severity: -1 } },
    { key: { detectedAt: -1 } },
    { key: { 'affected.group': 1, status: 1 } },
  ],
  
  allocation_history: [
    { key: { userId: 1, allocationDate: -1 } },
    { key: { workOpportunityId: 1 } },
    { key: { 'batchInfo.batchId': 1 } },
    { key: { allocationDate: -1 } },
  ],
};

// ============================================
// EXPORT ALL SCHEMAS
// ============================================

export {
  // Re-export existing schemas if needed
};
