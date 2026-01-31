/**
 * SAHAYOG ML/DL Database Schemas
 * Comprehensive data structures for fraud detection, fairness analysis, and scheme management
 * 
 * Based on:
 * - unified.md: Module 7 (Fairness Engine), Module 11 (Fraud Detection)
 * - comprehensive_rural_employment_analysis.md: Data infrastructure requirements
 */

// ============================================
// CORE USER SCHEMA (Golden Record)
// ============================================

export interface MLUserDocument {
  _id?: string;
  
  // ===== IDENTITY (Verified) =====
  userId: string;
  aadhaarNumber?: string; // Encrypted, last 4 digits visible
  jobCardNumber?: string; // MGNREGA Job Card
  rationCardNumber?: string;
  voterIdNumber?: string;
  
  // ===== PERSONAL INFORMATION =====
  name: string;
  fatherOrHusbandName?: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  age?: number;
  maritalStatus?: 'single' | 'married' | 'widowed' | 'divorced' | 'separated';
  category: 'SC' | 'ST' | 'OBC' | 'General';
  religion?: string;
  isDisabled: boolean;
  disabilityType?: string;
  disabilityPercentage?: number;
  
  // ===== EDUCATION & LITERACY =====
  isLiterate: boolean;
  educationLevel: 'none' | 'primary' | 'middle' | 'secondary' | 'higher_secondary' | 'graduate' | 'post_graduate';
  canSignName: boolean;
  digitalLiteracy: 'none' | 'basic' | 'intermediate' | 'advanced';
  
  // ===== CONTACT INFORMATION =====
  phoneNumber: string;
  alternatePhone?: string;
  hasSmartphone: boolean;
  hasFeaturePhone: boolean;
  preferredLanguage: string;
  dialectSpoken?: string;
  
  // ===== LOCATION (Multi-level) =====
  location: {
    state: string;
    stateCode: string;
    district: string;
    districtCode: string;
    block: string;
    blockCode: string;
    gramPanchayat: string;
    gpCode: string;
    village: string;
    villageCode: string;
    pincode: string;
    coordinates?: { lat: number; lng: number };
    isUrban: boolean;
    isTribalArea: boolean;
    isAspiratinalDistrict: boolean;
  };
  
  // ===== FAMILY INFORMATION =====
  isHouseholdHead: boolean;
  householdId?: string;
  familyMembers: number;
  dependents: number;
  adultEarningMembers: number;
  childrenUnder18: number;
  elderlyAbove60: number;
  womenInHousehold: number;
  familyIncome?: number; // Monthly in INR
  incomeCategory: 'BPL' | 'APL' | 'AAY' | 'PHH';
  
  // ===== LAND & AGRICULTURE =====
  landOwned: number; // In acres
  landType?: 'irrigated' | 'rainfed' | 'barren' | 'mixed';
  isFarmer: boolean;
  farmingType?: 'owner' | 'tenant' | 'sharecropper' | 'agricultural_laborer';
  majorCrops?: string[];
  hasLivestock: boolean;
  livestockCount?: number;
  
  // ===== HOUSING =====
  houseType: 'kutcha' | 'semi_pucca' | 'pucca';
  hasElectricity: boolean;
  hasToilet: boolean;
  hasDrinkingWater: boolean;
  hasLPGConnection: boolean;
  
  // ===== FINANCIAL INFORMATION =====
  bankAccountLinked: boolean;
  bankName?: string;
  bankAccountType?: 'savings' | 'jan_dhan' | 'current';
  ifscCode?: string;
  hasATMCard: boolean;
  hasUPI: boolean;
  upiId?: string;
  
  // ===== SKILLS & EMPLOYMENT =====
  primaryOccupation: string;
  secondaryOccupation?: string;
  skills: string[];
  skillCertifications: string[];
  employmentType: 'unemployed' | 'self_employed' | 'casual_labor' | 'regular_wage' | 'salaried';
  willingToMigrate: boolean;
  migrationHistory?: {
    hasMigrated: boolean;
    destinations?: string[];
    frequency?: 'seasonal' | 'occasional' | 'regular';
    lastMigration?: string;
  };
  
  // ===== SCHEME ENROLLMENTS =====
  registeredSchemes: string[];
  eligibleSchemes: string[];
  appliedSchemes: string[];
  rejectedSchemes: string[];
  pendingApplications: string[];
  
  // ===== MGNREGA SPECIFIC =====
  mgnrega: {
    isRegistered: boolean;
    jobCardIssueDate?: string;
    jobCardStatus: 'active' | 'suspended' | 'cancelled' | 'not_issued';
    householdMembers: number; // Members on job card
    totalDaysWorked: number; // Lifetime
    currentYearDaysWorked: number;
    currentYearDaysRemaining: number; // Out of 100
    lastWorkDate?: string;
    pendingWages: number;
    totalWagesEarned: number;
    averageWagePerDay: number;
    workPreference: string[];
    demandRegistered: boolean;
    lastDemandDate?: string;
  };
  
  // ===== CONSENT MANAGEMENT =====
  consents: {
    dataCollection: boolean;
    voiceRecording: boolean;
    locationTracking: boolean;
    biometricUse: boolean;
    dataSharing: boolean;
    marketingCommunication: boolean;
    consentTimestamp: string;
    consentMethod: 'voice' | 'tap' | 'otp' | 'biometric';
  };
  
  // ===== ONBOARDING & ENGAGEMENT =====
  onboardingLevel: 0 | 1 | 2 | 3;
  registrationDate: string;
  lastActiveDate: string;
  totalSessions: number;
  preferredAccessMethod: 'app' | 'ivr' | 'whatsapp' | 'csc' | 'ussd';
  uiMode: 'voice_picture' | 'simple_text' | 'full_feature';
  
  // ===== WELLBEING INDICATORS =====
  wellbeing?: {
    lastMoodCheck?: string;
    currentMood?: string;
    stressLevel?: 'low' | 'medium' | 'high';
    needsCounseling?: boolean;
    counselingHistory?: number;
  };
  
  // ===== TIMESTAMPS =====
  createdAt: string;
  updatedAt: string;
  lastVerifiedAt?: string;
  
  // ===== ML FEATURE FLAGS =====
  mlFlags?: {
    isAnomaly: boolean;
    riskScore: number;
    fraudProbability: number;
    lastMLScan: string;
  };
}

// ============================================
// MGNREGA WORK RECORDS (For Attendance & Fraud Detection)
// ============================================

export interface MGNREGAWorkRecord {
  _id?: string;
  
  // ===== IDENTIFIERS =====
  recordId: string;
  userId: string;
  jobCardNumber: string;
  workerName: string;
  householdId: string;
  
  // ===== WORK DETAILS =====
  workId: string;
  workName: string;
  workType: 'earthwork' | 'irrigation' | 'road' | 'plantation' | 'water_conservation' | 'land_development' | 'construction' | 'other';
  workCategory: 'individual' | 'community' | 'NRM' | 'agriculture' | 'livestock' | 'fisheries';
  sanctionedAmount: number;
  estimatedDays: number;
  
  // ===== WORKSITE DETAILS =====
  worksite: {
    name: string;
    location: { lat: number; lng: number };
    gramPanchayat: string;
    block: string;
    district: string;
    state: string;
    distanceFromVillageKm: number;
  };
  
  // ===== ATTENDANCE DATA =====
  date: string;
  dayOfWeek: number; // 0-6
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  
  checkInTime?: string;
  checkOutTime?: string;
  checkInLocation?: { lat: number; lng: number };
  checkOutLocation?: { lat: number; lng: number };
  checkInMethod: 'gps' | 'biometric' | 'manual' | 'photo' | 'nfc' | 'none';
  checkOutMethod: 'gps' | 'biometric' | 'manual' | 'photo' | 'nfc' | 'none';
  
  hoursWorked: number;
  attendanceStatus: 'present' | 'absent' | 'half_day' | 'leave' | 'holiday';
  workDone: number; // Percentage of daily task completed
  
  // ===== VERIFICATION =====
  verifiedBy: string;
  verifierRole: 'mate' | 'rojgar_sevak' | 'gram_panchayat' | 'bdo' | 'system';
  verificationMethod: 'physical' | 'photo' | 'gps' | 'biometric' | 'community';
  verificationTimestamp: string;
  photoEvidence?: string[];
  
  // ===== MEASUREMENT & WAGES =====
  measurementDone: boolean;
  measurementDate?: string;
  quantityDone?: number;
  unit?: string;
  wageRate: number;
  calculatedWage: number;
  actualWageEarned: number;
  deductions?: number;
  deductionReason?: string;
  
  // ===== PAYMENT STATUS =====
  paymentStatus: 'pending' | 'processed' | 'paid' | 'failed' | 'disputed';
  paymentDate?: string;
  paymentMethod?: 'bank_transfer' | 'cash' | 'upi';
  transactionId?: string;
  paymentDelayDays: number;
  
  // ===== WEATHER & CONDITIONS =====
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'extreme_heat' | 'cold';
  workConditions?: 'normal' | 'difficult' | 'hazardous';
  toolsProvided: boolean;
  safetyGearProvided: boolean;
  drinkingWaterAvailable: boolean;
  shadeAvailable: boolean;
  crecheAvailable: boolean;
  
  // ===== SUPERVISOR DETAILS =====
  supervisor: {
    name: string;
    phone: string;
    role: string;
    userId?: string;
  };
  
  // ===== ANOMALY DETECTION (ML/DL) =====
  anomalyFlags: {
    locationMismatch: boolean;
    timingAnomaly: boolean;
    excessiveHours: boolean;
    duplicateEntry: boolean;
    measurementMismatch: boolean;
    paymentMismatch: boolean;
    suspiciousPattern: boolean;
    flagDetails?: string[];
  };
  riskScore: number; // 0-100
  mlPrediction?: {
    isFraudulent: boolean;
    confidence: number;
    modelVersion: string;
    predictionDate: string;
  };
  
  // ===== TIMESTAMPS =====
  createdAt: string;
  updatedAt: string;
}

// ============================================
// SCHEME ENROLLMENTS (Universal Schema)
// ============================================

export interface SchemeEnrollment {
  _id?: string;
  
  // ===== IDENTIFIERS =====
  enrollmentId: string;
  userId: string;
  schemeId: string;
  schemeName: string;
  schemeCategory: 'employment' | 'pension' | 'housing' | 'agriculture' | 'health' | 'education' | 'financial' | 'insurance' | 'skill' | 'other';
  schemeLevel: 'central' | 'state' | 'district' | 'local';
  
  // ===== APPLICATION DETAILS =====
  applicationDate: string;
  applicationNumber?: string;
  applicationMode: 'online' | 'offline' | 'csc' | 'camp' | 'mobile_app';
  assistedBy?: string;
  
  // ===== STATUS TRACKING =====
  status: 'draft' | 'submitted' | 'under_review' | 'document_pending' | 'approved' | 'rejected' | 'suspended' | 'closed';
  statusHistory: {
    status: string;
    date: string;
    reason?: string;
    updatedBy?: string;
  }[];
  
  // ===== ELIGIBILITY =====
  eligibilityScore: number;
  eligibilityCriteria: {
    criterion: string;
    met: boolean;
    value?: any;
  }[];
  rejectionReason?: string;
  
  // ===== DOCUMENTS =====
  documentsSubmitted: string[];
  documentsPending: string[];
  documentsVerified: string[];
  
  // ===== BENEFITS =====
  benefitType: 'cash' | 'in_kind' | 'service' | 'subsidy' | 'loan' | 'mixed';
  benefitAmount?: number;
  benefitFrequency?: 'one_time' | 'monthly' | 'quarterly' | 'annually' | 'as_needed';
  totalBenefitsReceived: number;
  lastBenefitDate?: string;
  nextBenefitDue?: string;
  
  // ===== SCHEME-SPECIFIC DATA =====
  schemeData?: Record<string, any>;
  
  // ===== TIMESTAMPS =====
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  closedAt?: string;
}

// ============================================
// SCHEME-SPECIFIC: PM-KISAN
// ============================================

export interface PMKisanRecord {
  _id?: string;
  userId: string;
  beneficiaryId: string;
  registrationNumber: string;
  
  // ===== LAND DETAILS =====
  landRecords: {
    khasraNumber: string;
    area: number;
    unit: 'hectare' | 'acre' | 'bigha';
    landType: 'irrigated' | 'non_irrigated';
    ownershipType: 'individual' | 'joint';
  }[];
  totalLandArea: number;
  
  // ===== PAYMENT INSTALLMENTS =====
  installments: {
    installmentNumber: number;
    amount: number;
    dueDate: string;
    status: 'pending' | 'processed' | 'credited' | 'failed' | 'returned';
    creditDate?: string;
    transactionId?: string;
    failureReason?: string;
  }[];
  totalReceived: number;
  totalPending: number;
  
  // ===== VERIFICATION =====
  eKYCStatus: 'pending' | 'completed' | 'failed' | 'expired';
  eKYCDate?: string;
  landVerificationStatus: 'pending' | 'verified' | 'rejected';
  
  createdAt: string;
  updatedAt: string;
}

// ============================================
// SCHEME-SPECIFIC: PMFBY (Crop Insurance)
// ============================================

export interface PMFBYRecord {
  _id?: string;
  userId: string;
  policyNumber: string;
  season: 'kharif' | 'rabi' | 'summer';
  year: number;
  
  // ===== CROP DETAILS =====
  crops: {
    cropName: string;
    cropCode: string;
    area: number;
    sumInsured: number;
    premiumPaid: number;
    subsidyAmount: number;
    farmerShare: number;
  }[];
  
  // ===== CLAIM DETAILS =====
  claims: {
    claimId: string;
    claimType: 'localized' | 'mid_season' | 'post_harvest' | 'prevented_sowing';
    dateReported: string;
    areaClaimed: number;
    estimatedLoss: number;
    assessedLoss?: number;
    claimStatus: 'filed' | 'under_assessment' | 'approved' | 'rejected' | 'paid';
    sanctionedAmount?: number;
    paidAmount?: number;
    paidDate?: string;
  }[];
  
  createdAt: string;
  updatedAt: string;
}

// ============================================
// SCHEME-SPECIFIC: PENSION SCHEMES
// ============================================

export interface PensionRecord {
  _id?: string;
  userId: string;
  schemeType: 'widow' | 'old_age' | 'disability' | 'PM_SYM' | 'APY';
  pensionerId: string;
  
  // ===== PENSION DETAILS =====
  monthlyAmount: number;
  startDate: string;
  lastPaymentDate?: string;
  nextPaymentDue?: string;
  
  // ===== PAYMENT HISTORY =====
  payments: {
    month: string;
    amount: number;
    status: 'pending' | 'credited' | 'failed';
    creditDate?: string;
    transactionId?: string;
  }[];
  
  // ===== VERIFICATION =====
  lifeVerificationDate?: string;
  nextVerificationDue?: string;
  verificationStatus: 'active' | 'pending_verification' | 'suspended';
  
  createdAt: string;
  updatedAt: string;
}

// ============================================
// SKILL TRAINING RECORDS
// ============================================

export interface SkillTrainingRecord {
  _id?: string;
  userId: string;
  
  // ===== TRAINING DETAILS =====
  trainings: {
    trainingId: string;
    courseName: string;
    category: string;
    provider: string;
    startDate: string;
    endDate?: string;
    status: 'enrolled' | 'ongoing' | 'completed' | 'dropped' | 'certified';
    completionPercentage: number;
    certificateId?: string;
    certificateUrl?: string;
    score?: number;
    grade?: string;
  }[];
  
  // ===== EMPLOYMENT OUTCOMES =====
  placementStatus: 'not_applicable' | 'seeking' | 'placed' | 'self_employed';
  employerName?: string;
  monthlySalary?: number;
  placementDate?: string;
  
  // ===== SKILL PROGRESSION =====
  currentSkillLevel: 'unskilled' | 'semi_skilled' | 'skilled' | 'highly_skilled';
  targetSkillLevel?: string;
  skillGap?: string[];
  
  createdAt: string;
  updatedAt: string;
}

// ============================================
// PAYMENT TRANSACTIONS (Universal)
// ============================================

export interface PaymentTransaction {
  _id?: string;
  
  transactionId: string;
  userId: string;
  
  // ===== TRANSACTION DETAILS =====
  type: 'wage' | 'pension' | 'subsidy' | 'scheme_benefit' | 'reimbursement' | 'loan_disbursement';
  source: string; // Scheme or program name
  sourceId: string; // Reference to source record
  
  amount: number;
  currency: 'INR';
  
  // ===== RECIPIENT =====
  recipientName: string;
  recipientAccount: string; // Last 4 digits
  bankName: string;
  ifsc: string;
  
  // ===== STATUS =====
  status: 'initiated' | 'processing' | 'success' | 'failed' | 'reversed' | 'disputed';
  initiatedAt: string;
  processedAt?: string;
  completedAt?: string;
  failureReason?: string;
  
  // ===== DELAYS =====
  expectedDate: string;
  actualDate?: string;
  delayDays: number;
  
  // ===== FRAUD DETECTION =====
  isFlagged: boolean;
  flagReason?: string;
  riskScore: number;
  reviewStatus?: 'pending' | 'cleared' | 'confirmed_fraud';
  
  createdAt: string;
  updatedAt: string;
}

// ============================================
// GRIEVANCE RECORDS (5-Day Promise)
// ============================================

export interface GrievanceRecord {
  _id?: string;
  
  ticketNumber: string;
  userId: string;
  
  // ===== GRIEVANCE DETAILS =====
  category: 'payment_delay' | 'job_card' | 'work_demand' | 'wage_dispute' | 'corruption' | 'discrimination' | 'worksite_facilities' | 'scheme_issue' | 'other';
  subCategory?: string;
  description: string;
  voiceRecordingUrl?: string;
  attachments?: string[];
  
  // ===== LOCATION =====
  relatedLocation: {
    village: string;
    gramPanchayat: string;
    block: string;
    district: string;
  };
  relatedScheme?: string;
  relatedWorkId?: string;
  
  // ===== 5-DAY PROMISE TRACKING =====
  registeredAt: string;
  deadline: string; // 5 days from registration
  daysSinceRegistration: number;
  isOverdue: boolean;
  slaBreached: boolean;
  
  // ===== STATUS =====
  status: 'registered' | 'assigned' | 'investigating' | 'action_taken' | 'resolved' | 'escalated' | 'closed' | 'reopened';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // ===== ESCALATION =====
  escalationLevel: 0 | 1 | 2 | 3; // 0=GP, 1=Block, 2=District, 3=State
  autoEscalated: boolean;
  escalationHistory: {
    level: number;
    date: string;
    reason: string;
    escalatedTo: string;
  }[];
  
  // ===== ASSIGNMENT =====
  assignedTo?: string;
  assignedRole?: string;
  assignedAt?: string;
  
  // ===== RESOLUTION =====
  resolution?: string;
  resolutionDate?: string;
  actionTaken?: string;
  
  // ===== FEEDBACK =====
  satisfactionRating?: 1 | 2 | 3 | 4 | 5;
  feedbackNotes?: string;
  wasHelpful?: boolean;
  
  // ===== COMMUNICATION LOG =====
  communications: {
    date: string;
    type: 'call' | 'sms' | 'voice_message' | 'in_person' | 'app';
    direction: 'incoming' | 'outgoing';
    summary: string;
    by: string;
  }[];
  
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CONVERSATION DATA (For NLP/AI Training)
// ============================================

export interface ConversationRecord {
  _id?: string;
  
  sessionId: string;
  userId?: string;
  
  // ===== SESSION INFO =====
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  accessMethod: 'app' | 'ivr' | 'whatsapp' | 'ussd';
  language: string;
  dialect?: string;
  
  // ===== CONVERSATION TURNS =====
  turns: {
    turnId: string;
    timestamp: string;
    speaker: 'user' | 'saathi';
    text: string;
    audioUrl?: string;
    intent?: string;
    entities?: { type: string; value: string; confidence: number }[];
    emotion?: string;
    confidence?: number;
  }[];
  
  // ===== EXTRACTED DATA =====
  extractedData: {
    field: string;
    value: any;
    confidence: number;
    source: 'voice' | 'inferred' | 'confirmed';
    consentGiven: boolean;
    turnId: string;
  }[];
  
  // ===== OUTCOMES =====
  outcome: 'completed' | 'abandoned' | 'transferred' | 'error';
  tasksCompleted: string[];
  navigationPath: string[];
  
  // ===== QUALITY METRICS =====
  userSatisfaction?: number;
  taskCompletionRate: number;
  errorCount: number;
  
  createdAt: string;
}

// ============================================
// ML FEATURE DATASET (For Model Training)
// ============================================

export interface MLFeatureRecord {
  _id?: string;
  
  recordId: string;
  recordType: 'work' | 'payment' | 'grievance' | 'user';
  
  // ===== USER FEATURES =====
  userFeatures: {
    age: number;
    gender: string;
    category: string;
    isLiterate: boolean;
    educationLevel: number; // Encoded
    familyMembers: number;
    landOwned: number;
    incomeCategory: number; // Encoded
    isDisabled: boolean;
    registrationDays: number; // Days since registration
    totalSchemes: number;
    activeSchemes: number;
  };
  
  // ===== WORK FEATURES =====
  workFeatures?: {
    totalDaysWorked: number;
    avgHoursPerDay: number;
    avgWagePerDay: number;
    workConsistency: number; // 0-1
    attendanceRate: number; // 0-1
    locationVariance: number;
    timePatternScore: number;
    weekendWorkRatio: number;
    supervisorCount: number;
    siteCount: number;
  };
  
  // ===== PAYMENT FEATURES =====
  paymentFeatures?: {
    avgPaymentDelay: number;
    paymentSuccessRate: number;
    totalPayments: number;
    avgPaymentAmount: number;
    paymentFrequency: number;
    disputeRate: number;
    bankChangeCount: number;
  };
  
  // ===== GRIEVANCE FEATURES =====
  grievanceFeatures?: {
    totalGrievances: number;
    resolvedGrievances: number;
    avgResolutionDays: number;
    escalationRate: number;
    satisfactionAvg: number;
    repeatGrievanceRate: number;
  };
  
  // ===== NETWORK FEATURES (Fraud Detection) =====
  networkFeatures?: {
    sharedBankAccounts: number;
    sharedPhoneNumbers: number;
    sharedAddresses: number;
    sameHouseholdWorkers: number;
    commonSupervisors: number;
    clusterScore: number; // Anomaly clustering
  };
  
  // ===== LABELS =====
  labels: {
    isFraudulent?: boolean;
    fraudType?: string;
    fairnessScore?: number;
    riskLevel?: 'low' | 'medium' | 'high';
    anomalyScore?: number;
  };
  
  createdAt: string;
  updatedAt: string;
}

// ============================================
// ADMIN ANALYTICS AGGREGATIONS
// ============================================

export interface AnalyticsAggregation {
  _id?: string;
  
  aggregationType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  period: string;
  
  // ===== SCOPE =====
  scope: {
    level: 'national' | 'state' | 'district' | 'block' | 'gp' | 'village';
    value: string;
  };
  
  // ===== USER METRICS =====
  users: {
    totalRegistered: number;
    activeUsers: number;
    newRegistrations: number;
    byCategory: Record<string, number>;
    byGender: Record<string, number>;
    byAgeGroup: Record<string, number>;
    avgOnboardingLevel: number;
  };
  
  // ===== WORK METRICS =====
  work: {
    totalWorksites: number;
    activeWorksites: number;
    totalPersonDays: number;
    avgDaysPerWorker: number;
    totalWagesGenerated: number;
    avgWagePerDay: number;
    completionRate: number;
  };
  
  // ===== PAYMENT METRICS =====
  payments: {
    totalTransactions: number;
    totalAmount: number;
    avgPaymentDelay: number;
    onTimeRate: number;
    failureRate: number;
  };
  
  // ===== GRIEVANCE METRICS =====
  grievances: {
    totalFiled: number;
    resolved: number;
    pending: number;
    escalated: number;
    avgResolutionDays: number;
    slaComplianceRate: number;
    satisfactionAvg: number;
  };
  
  // ===== FRAUD METRICS =====
  fraud: {
    alertsGenerated: number;
    confirmedFrauds: number;
    amountSaved: number;
    falsePositiveRate: number;
  };
  
  // ===== FAIRNESS METRICS =====
  fairness: {
    giniCoefficient: number;
    categoryDistribution: Record<string, number>;
    genderParity: number;
    vulnerableGroupCoverage: number;
  };
  
  createdAt: string;
}

export default {
  MLUserDocument: {} as MLUserDocument,
  MGNREGAWorkRecord: {} as MGNREGAWorkRecord,
  SchemeEnrollment: {} as SchemeEnrollment,
  PMKisanRecord: {} as PMKisanRecord,
  PMFBYRecord: {} as PMFBYRecord,
  PensionRecord: {} as PensionRecord,
  SkillTrainingRecord: {} as SkillTrainingRecord,
  PaymentTransaction: {} as PaymentTransaction,
  GrievanceRecord: {} as GrievanceRecord,
  ConversationRecord: {} as ConversationRecord,
  MLFeatureRecord: {} as MLFeatureRecord,
  AnalyticsAggregation: {} as AnalyticsAggregation
};
