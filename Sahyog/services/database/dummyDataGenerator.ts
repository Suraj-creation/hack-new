/**
 * SAHAYOG Dummy Data Generator
 * Creates realistic synthetic data for 50 users across all schemes
 * For ML/DL model training and testing
 */

import {
  MLUserDocument,
  MGNREGAWorkRecord,
  SchemeEnrollment,
  PMKisanRecord,
  PMFBYRecord,
  PensionRecord,
  SkillTrainingRecord,
  PaymentTransaction,
  GrievanceRecord,
  ConversationRecord,
  MLFeatureRecord
} from './mlSchemas';

// ============================================
// CONFIGURATION
// ============================================

const TOTAL_USERS = 50;

// MP Districts for realistic data
const MP_DISTRICTS = [
  { district: 'Sehore', blocks: ['Ashta', 'Budhni', 'Ichhawar', 'Nasrullaganj', 'Sehore'], code: 'MP23' },
  { district: 'Bhopal', blocks: ['Berasia', 'Huzur', 'Phanda'], code: 'MP22' },
  { district: 'Raisen', blocks: ['Bareli', 'Begamganj', 'Gairatganj', 'Raisen', 'Silwani'], code: 'MP24' },
  { district: 'Vidisha', blocks: ['Basoda', 'Gyaraspur', 'Kurwai', 'Lateri', 'Nateran', 'Vidisha'], code: 'MP26' },
  { district: 'Hoshangabad', blocks: ['Babai', 'Bankhedi', 'Hoshangabad', 'Kesla', 'Pipariya', 'Sohagpur'], code: 'MP27' }
];

const VILLAGES = [
  'Piparia', 'Rampur', 'Singpur', 'Khandwa', 'Mohgaon', 'Bareli', 'Khiriya', 'Silwani',
  'Rahatgarh', 'Ganj Basoda', 'Udaipura', 'Bhojpur', 'Sultanpur', 'Fatehpur', 'Chandpur',
  'Shivpur', 'Rajpur', 'Nayagaon', 'Purani Basti', 'Chakla', 'Dhamni', 'Khurai', 'Mandi'
];

const FIRST_NAMES_MALE = [
  'Ramesh', 'Suresh', 'Mahesh', 'Rajesh', 'Dinesh', 'Mukesh', 'Rakesh', 'Naresh',
  'Santosh', 'Ashok', 'Vijay', 'Ajay', 'Sanjay', 'Raju', 'Kalu', 'Bholu', 'Chhotu',
  'Ramprasad', 'Shivprasad', 'Gopal', 'Mohan', 'Sohan', 'Rohan', 'Lakhan', 'Kishan'
];

const FIRST_NAMES_FEMALE = [
  'Sunita', 'Anita', 'Geeta', 'Sita', 'Radha', 'Kamla', 'Parvati', 'Lakshmi',
  'Savitri', 'Sarita', 'Meena', 'Reena', 'Sheela', 'Munni', 'Guddi', 'Chameli',
  'Phoolmati', 'Ramkali', 'Shantidevi', 'Rukmini', 'Durga', 'Kaushalya', 'Tulsi'
];

const LAST_NAMES = [
  'Singh', 'Sharma', 'Verma', 'Yadav', 'Patel', 'Rajput', 'Kushwaha', 'Lodhi',
  'Sahu', 'Prajapati', 'Ahirwar', 'Malviya', 'Tiwari', 'Dwivedi', 'Jatav', 'Kori',
  'Gond', 'Bhil', 'Meena', 'Baiga', 'Sahariya', 'Korku', 'Thakur', 'Chouhan'
];

const WORK_TYPES = [
  { type: 'earthwork', name: 'तालाब खुदाई', rate: 250 },
  { type: 'road', name: 'सड़क निर्माण', rate: 230 },
  { type: 'irrigation', name: 'नहर सफाई', rate: 240 },
  { type: 'plantation', name: 'वृक्षारोपण', rate: 220 },
  { type: 'water_conservation', name: 'जल संरक्षण', rate: 260 },
  { type: 'land_development', name: 'भूमि समतलीकरण', rate: 250 },
  { type: 'construction', name: 'भवन निर्माण', rate: 280 }
];

const SCHEMES = [
  { id: 'mgnrega', name: 'MGNREGA', category: 'employment' },
  { id: 'pm_kisan', name: 'PM-KISAN', category: 'agriculture' },
  { id: 'pmfby', name: 'PMFBY', category: 'insurance' },
  { id: 'pm_awas', name: 'PM Awas Yojana', category: 'housing' },
  { id: 'widow_pension', name: 'Widow Pension', category: 'pension' },
  { id: 'old_age_pension', name: 'Old Age Pension', category: 'pension' },
  { id: 'disability_pension', name: 'Disability Pension', category: 'pension' },
  { id: 'ladli_laxmi', name: 'Ladli Laxmi', category: 'education' },
  { id: 'pm_sym', name: 'PM-SYM', category: 'pension' },
  { id: 'pmjdy', name: 'PM Jan Dhan Yojana', category: 'financial' }
];

const GRIEVANCE_CATEGORIES = [
  'payment_delay', 'job_card', 'work_demand', 'wage_dispute',
  'corruption', 'discrimination', 'worksite_facilities', 'scheme_issue'
];

const SKILLS = [
  'Masonry', 'Carpentry', 'Plumbing', 'Electrician', 'Welding',
  'Tailoring', 'Agriculture', 'Dairy Farming', 'Poultry', 'Fishery',
  'Cooking', 'Beautician', 'Computer Basics', 'Mobile Repair', 'Driving'
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomChoices<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, arr.length));
}

function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString();
}

function randomPastDate(daysBack: number): string {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(1, daysBack));
  return date.toISOString();
}

function generatePhone(): string {
  const prefixes = ['98', '97', '96', '95', '94', '93', '91', '90', '89', '88', '87', '86', '85', '84', '83', '82', '81', '80', '79', '78', '77', '76', '75', '74', '73', '72', '71', '70'];
  return randomChoice(prefixes) + String(randomInt(10000000, 99999999));
}

function generateAadhaar(): string {
  return `XXXX-XXXX-${randomInt(1000, 9999)}`;
}

function generateJobCard(districtCode: string, block: string): string {
  return `${districtCode}-${block.substring(0, 3).toUpperCase()}-${randomInt(100000, 999999)}`;
}

function generateTicketNumber(): string {
  const prefix = 'SAH';
  const timestamp = Date.now().toString(36).toUpperCase().substring(0, 6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// ============================================
// DATA GENERATORS
// ============================================

export function generateUsers(): MLUserDocument[] {
  const users: MLUserDocument[] = [];
  
  for (let i = 0; i < TOTAL_USERS; i++) {
    const gender = Math.random() > 0.48 ? 'female' : 'male';
    const firstName = gender === 'male' 
      ? randomChoice(FIRST_NAMES_MALE) 
      : randomChoice(FIRST_NAMES_FEMALE);
    const lastName = randomChoice(LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    
    const age = randomInt(18, 70);
    const districtInfo = randomChoice(MP_DISTRICTS);
    const block = randomChoice(districtInfo.blocks);
    const village = randomChoice(VILLAGES);
    
    const category = randomChoice(['SC', 'ST', 'OBC', 'General'] as const);
    const isDisabled = Math.random() < 0.08;
    const isLiterate = Math.random() > 0.35;
    const hasSmartphone = Math.random() > 0.55;
    
    const landOwned = category === 'General' 
      ? randomFloat(0.5, 5, 2) 
      : randomFloat(0, 2, 2);
    
    const familyMembers = randomInt(2, 8);
    const daysWorkedThisYear = randomInt(0, 100);
    
    // Introduce some anomalies for fraud detection (10% of users)
    const isAnomalous = Math.random() < 0.10;
    
    const user: MLUserDocument = {
      userId: `USR-${String(i + 1).padStart(4, '0')}`,
      aadhaarNumber: generateAadhaar(),
      jobCardNumber: generateJobCard(districtInfo.code, block),
      name,
      fatherOrHusbandName: `${randomChoice(FIRST_NAMES_MALE)} ${lastName}`,
      gender,
      dateOfBirth: new Date(new Date().getFullYear() - age, randomInt(0, 11), randomInt(1, 28)).toISOString(),
      age,
      maritalStatus: age > 25 ? (Math.random() > 0.15 ? 'married' : randomChoice(['single', 'widowed'])) : 'single',
      category,
      isDisabled,
      disabilityType: isDisabled ? randomChoice(['visual', 'hearing', 'locomotor', 'mental']) : undefined,
      disabilityPercentage: isDisabled ? randomInt(40, 100) : undefined,
      isLiterate,
      educationLevel: isLiterate 
        ? randomChoice(['primary', 'middle', 'secondary', 'higher_secondary']) 
        : 'none',
      canSignName: isLiterate || Math.random() > 0.3,
      digitalLiteracy: hasSmartphone 
        ? randomChoice(['basic', 'intermediate']) 
        : 'none',
      phoneNumber: generatePhone(),
      alternatePhone: Math.random() > 0.7 ? generatePhone() : undefined,
      hasSmartphone,
      hasFeaturePhone: !hasSmartphone && Math.random() > 0.2,
      preferredLanguage: 'hi-IN',
      dialectSpoken: randomChoice(['Bundelkhandi', 'Malwi', 'Nimadi', 'Bagheli']),
      location: {
        state: 'Madhya Pradesh',
        stateCode: 'MP',
        district: districtInfo.district,
        districtCode: districtInfo.code,
        block,
        blockCode: `${districtInfo.code}-${block.substring(0, 3).toUpperCase()}`,
        gramPanchayat: `${village} GP`,
        gpCode: `GP-${randomInt(1000, 9999)}`,
        village,
        villageCode: `VIL-${randomInt(10000, 99999)}`,
        pincode: `46${randomInt(1000, 9999)}`,
        coordinates: {
          lat: 23.0 + randomFloat(-1, 1, 4),
          lng: 77.0 + randomFloat(-1, 1, 4)
        },
        isUrban: Math.random() < 0.1,
        isTribalArea: category === 'ST' && Math.random() > 0.3,
        isAspiratinalDistrict: Math.random() < 0.25
      },
      isHouseholdHead: gender === 'male' ? Math.random() > 0.2 : Math.random() < 0.15,
      householdId: `HH-${districtInfo.code}-${randomInt(100000, 999999)}`,
      familyMembers,
      dependents: randomInt(1, Math.min(4, familyMembers - 1)),
      adultEarningMembers: randomInt(1, 3),
      childrenUnder18: randomInt(0, 3),
      elderlyAbove60: Math.random() > 0.7 ? randomInt(1, 2) : 0,
      womenInHousehold: randomInt(1, Math.ceil(familyMembers / 2)),
      familyIncome: randomInt(3000, 15000),
      incomeCategory: randomChoice(['BPL', 'APL', 'AAY', 'PHH']),
      landOwned,
      landType: landOwned > 0 ? randomChoice(['irrigated', 'rainfed', 'mixed']) : undefined,
      isFarmer: landOwned > 0.5,
      farmingType: landOwned > 0 
        ? randomChoice(['owner', 'tenant', 'sharecropper', 'agricultural_laborer']) 
        : undefined,
      majorCrops: landOwned > 0 
        ? randomChoices(['Wheat', 'Soybean', 'Gram', 'Maize', 'Rice', 'Mustard'], randomInt(1, 3)) 
        : undefined,
      hasLivestock: Math.random() > 0.4,
      livestockCount: Math.random() > 0.4 ? randomInt(1, 10) : 0,
      houseType: randomChoice(['kutcha', 'semi_pucca', 'pucca']),
      hasElectricity: Math.random() > 0.15,
      hasToilet: Math.random() > 0.3,
      hasDrinkingWater: Math.random() > 0.2,
      hasLPGConnection: Math.random() > 0.5,
      bankAccountLinked: Math.random() > 0.1,
      bankName: randomChoice(['SBI', 'PNB', 'BOI', 'Canara Bank', 'HDFC', 'Central Bank']),
      bankAccountType: randomChoice(['savings', 'jan_dhan']),
      hasATMCard: Math.random() > 0.5,
      hasUPI: hasSmartphone && Math.random() > 0.4,
      primaryOccupation: randomChoice(['Agricultural Labor', 'Daily Wage Labor', 'Farming', 'Livestock Rearing', 'Small Business']),
      secondaryOccupation: Math.random() > 0.5 
        ? randomChoice(['MGNREGA Work', 'Construction', 'Domestic Work', 'Seasonal Migration']) 
        : undefined,
      skills: randomChoices(SKILLS, randomInt(0, 3)),
      skillCertifications: Math.random() > 0.85 
        ? [randomChoice(['ITI Certificate', 'PMKVY Certificate', 'NSDC Skill Certificate'])] 
        : [],
      employmentType: randomChoice(['casual_labor', 'self_employed', 'unemployed']),
      willingToMigrate: Math.random() > 0.6,
      migrationHistory: Math.random() > 0.5 ? {
        hasMigrated: true,
        destinations: randomChoices(['Gujarat', 'Maharashtra', 'Delhi', 'Rajasthan', 'Punjab'], randomInt(1, 2)),
        frequency: randomChoice(['seasonal', 'occasional']),
        lastMigration: randomPastDate(365)
      } : undefined,
      registeredSchemes: randomChoices(SCHEMES.map(s => s.id), randomInt(2, 5)),
      eligibleSchemes: SCHEMES.map(s => s.id),
      appliedSchemes: randomChoices(SCHEMES.map(s => s.id), randomInt(1, 3)),
      rejectedSchemes: Math.random() > 0.7 ? [randomChoice(SCHEMES).id] : [],
      pendingApplications: Math.random() > 0.6 ? [randomChoice(SCHEMES).id] : [],
      mgnrega: {
        isRegistered: true,
        jobCardIssueDate: randomDate(new Date(2015, 0, 1), new Date(2024, 0, 1)),
        jobCardStatus: Math.random() > 0.05 ? 'active' : 'suspended',
        householdMembers: randomInt(1, Math.min(3, familyMembers)),
        totalDaysWorked: randomInt(50, 800),
        currentYearDaysWorked: daysWorkedThisYear,
        currentYearDaysRemaining: 100 - daysWorkedThisYear,
        lastWorkDate: randomPastDate(60),
        pendingWages: isAnomalous ? randomInt(5000, 25000) : randomInt(0, 5000),
        totalWagesEarned: randomInt(10000, 150000),
        averageWagePerDay: randomInt(200, 280),
        workPreference: randomChoices(['earthwork', 'road', 'irrigation', 'plantation'], randomInt(1, 3)),
        demandRegistered: Math.random() > 0.3,
        lastDemandDate: randomPastDate(30)
      },
      consents: {
        dataCollection: true,
        voiceRecording: Math.random() > 0.2,
        locationTracking: Math.random() > 0.3,
        biometricUse: Math.random() > 0.4,
        dataSharing: Math.random() > 0.5,
        marketingCommunication: Math.random() > 0.7,
        consentTimestamp: randomPastDate(180),
        consentMethod: randomChoice(['voice', 'tap', 'otp'])
      },
      onboardingLevel: randomChoice([1, 2, 3]) as 1 | 2 | 3,
      registrationDate: randomDate(new Date(2020, 0, 1), new Date(2025, 11, 31)),
      lastActiveDate: randomPastDate(30),
      totalSessions: randomInt(5, 100),
      preferredAccessMethod: hasSmartphone 
        ? 'app' 
        : randomChoice(['ivr', 'csc', 'ussd']),
      uiMode: isLiterate ? 'simple_text' : 'voice_picture',
      wellbeing: Math.random() > 0.7 ? {
        lastMoodCheck: randomPastDate(14),
        currentMood: randomChoice(['happy', 'okay', 'stressed', 'worried']),
        stressLevel: randomChoice(['low', 'medium', 'high']),
        needsCounseling: Math.random() < 0.1,
        counselingHistory: Math.random() > 0.9 ? randomInt(1, 3) : 0
      } : undefined,
      createdAt: randomDate(new Date(2020, 0, 1), new Date(2024, 11, 31)),
      updatedAt: randomPastDate(7),
      lastVerifiedAt: randomPastDate(90),
      mlFlags: {
        isAnomaly: isAnomalous,
        riskScore: isAnomalous ? randomInt(60, 95) : randomInt(5, 40),
        fraudProbability: isAnomalous ? randomFloat(0.6, 0.95) : randomFloat(0.01, 0.25),
        lastMLScan: randomPastDate(1)
      }
    };
    
    users.push(user);
  }
  
  return users;
}

export function generateWorkRecords(users: MLUserDocument[]): MGNREGAWorkRecord[] {
  const records: MGNREGAWorkRecord[] = [];
  
  for (const user of users) {
    if (!user.mgnrega.isRegistered) continue;
    
    const daysToGenerate = randomInt(10, 50);
    const isAnomalous = user.mlFlags?.isAnomaly || false;
    
    for (let d = 0; d < daysToGenerate; d++) {
      const workType = randomChoice(WORK_TYPES);
      const date = randomPastDate(180);
      const dayOfWeek = new Date(date).getDay();
      const isWeekend = dayOfWeek === 0;
      
      // Normal check-in between 6-9 AM
      const checkInHour = isAnomalous && Math.random() > 0.7 
        ? randomInt(2, 5) // Anomalous early check-in
        : randomInt(6, 9);
      
      const hoursWorked = isAnomalous && Math.random() > 0.7 
        ? randomInt(12, 18) // Anomalous excessive hours
        : randomInt(6, 8);
      
      const checkOutHour = checkInHour + hoursWorked;
      
      // Location variance
      const baseLat = user.location.coordinates?.lat || 23.0;
      const baseLng = user.location.coordinates?.lng || 77.0;
      const locationMismatch = isAnomalous && Math.random() > 0.6;
      const checkInLat = locationMismatch 
        ? baseLat + randomFloat(-0.1, 0.1) 
        : baseLat + randomFloat(-0.01, 0.01);
      const checkInLng = locationMismatch 
        ? baseLng + randomFloat(-0.1, 0.1) 
        : baseLng + randomFloat(-0.01, 0.01);
      
      const wageRate = workType.rate;
      const actualWage = isAnomalous && Math.random() > 0.5 
        ? wageRate * randomFloat(0.5, 0.9) // Payment mismatch
        : wageRate;
      
      const record: MGNREGAWorkRecord = {
        recordId: `WRK-${user.userId}-${d + 1}`,
        userId: user.userId,
        jobCardNumber: user.jobCardNumber || '',
        workerName: user.name,
        householdId: user.householdId || '',
        workId: `WORK-${user.location.blockCode}-${randomInt(1000, 9999)}`,
        workName: workType.name,
        workType: workType.type as MGNREGAWorkRecord['workType'],
        workCategory: randomChoice(['individual', 'community', 'NRM', 'agriculture']),
        sanctionedAmount: randomInt(50000, 500000),
        estimatedDays: randomInt(30, 90),
        worksite: {
          name: `${workType.name} - ${user.location.village}`,
          location: { lat: baseLat, lng: baseLng },
          gramPanchayat: user.location.gramPanchayat,
          block: user.location.block,
          district: user.location.district,
          state: 'Madhya Pradesh',
          distanceFromVillageKm: randomFloat(0.5, 5)
        },
        date,
        dayOfWeek,
        isWeekend,
        isHoliday: Math.random() < 0.02,
        checkInTime: `${String(checkInHour).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}`,
        checkOutTime: `${String(Math.min(checkOutHour, 23)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}`,
        checkInLocation: { lat: checkInLat, lng: checkInLng },
        checkOutLocation: { lat: checkInLat + randomFloat(-0.001, 0.001), lng: checkInLng + randomFloat(-0.001, 0.001) },
        checkInMethod: randomChoice(['gps', 'biometric', 'manual']),
        checkOutMethod: randomChoice(['gps', 'biometric', 'manual']),
        hoursWorked,
        attendanceStatus: 'present',
        workDone: randomInt(80, 100),
        verifiedBy: `MATE-${randomInt(100, 999)}`,
        verifierRole: randomChoice(['mate', 'rojgar_sevak', 'gram_panchayat']),
        verificationMethod: randomChoice(['physical', 'photo', 'gps']),
        verificationTimestamp: date,
        measurementDone: Math.random() > 0.2,
        measurementDate: Math.random() > 0.2 ? randomPastDate(30) : undefined,
        quantityDone: randomFloat(0.5, 2),
        unit: 'cubic_meter',
        wageRate,
        calculatedWage: wageRate,
        actualWageEarned: actualWage,
        deductions: actualWage < wageRate ? wageRate - actualWage : 0,
        deductionReason: actualWage < wageRate ? 'Incomplete work' : undefined,
        paymentStatus: randomChoice(['pending', 'processed', 'paid']),
        paymentDate: Math.random() > 0.3 ? randomPastDate(30) : undefined,
        paymentMethod: 'bank_transfer',
        transactionId: Math.random() > 0.3 ? `TXN${randomInt(100000000, 999999999)}` : undefined,
        paymentDelayDays: randomInt(0, 45),
        weather: randomChoice(['sunny', 'cloudy', 'rainy']),
        workConditions: randomChoice(['normal', 'difficult']),
        toolsProvided: Math.random() > 0.3,
        safetyGearProvided: Math.random() > 0.5,
        drinkingWaterAvailable: Math.random() > 0.2,
        shadeAvailable: Math.random() > 0.4,
        crecheAvailable: Math.random() > 0.7,
        supervisor: {
          name: `${randomChoice(FIRST_NAMES_MALE)} ${randomChoice(LAST_NAMES)}`,
          phone: generatePhone(),
          role: 'Mate'
        },
        anomalyFlags: {
          locationMismatch,
          timingAnomaly: checkInHour < 5 || checkOutHour > 22,
          excessiveHours: hoursWorked > 12,
          duplicateEntry: false,
          measurementMismatch: Math.random() < 0.05,
          paymentMismatch: actualWage < wageRate * 0.9,
          suspiciousPattern: isAnomalous && Math.random() > 0.5,
          flagDetails: []
        },
        riskScore: isAnomalous ? randomInt(50, 95) : randomInt(0, 30),
        mlPrediction: {
          isFraudulent: isAnomalous && Math.random() > 0.5,
          confidence: randomFloat(0.6, 0.95),
          modelVersion: 'v1.2.0',
          predictionDate: new Date().toISOString()
        },
        createdAt: date,
        updatedAt: randomPastDate(1)
      };
      
      records.push(record);
    }
  }
  
  return records;
}

export function generatePayments(users: MLUserDocument[], workRecords: MGNREGAWorkRecord[]): PaymentTransaction[] {
  const payments: PaymentTransaction[] = [];
  
  // Group work records by user
  const userWorkMap = new Map<string, MGNREGAWorkRecord[]>();
  for (const record of workRecords) {
    const existing = userWorkMap.get(record.userId) || [];
    existing.push(record);
    userWorkMap.set(record.userId, existing);
  }
  
  for (const [userId, records] of userWorkMap) {
    const user = users.find(u => u.userId === userId);
    if (!user) continue;
    
    // Batch payments (every 10-15 days)
    const batches = Math.ceil(records.length / randomInt(10, 15));
    
    for (let b = 0; b < batches; b++) {
      const batchRecords = records.slice(b * 15, (b + 1) * 15);
      const totalAmount = batchRecords.reduce((sum, r) => sum + r.actualWageEarned, 0);
      
      const isAnomalous = user.mlFlags?.isAnomaly || false;
      const expectedDate = randomPastDate(60);
      const delayDays = isAnomalous && Math.random() > 0.5 
        ? randomInt(15, 45) 
        : randomInt(0, 14);
      
      const payment: PaymentTransaction = {
        transactionId: `TXN-${userId}-${b + 1}`,
        userId,
        type: 'wage',
        source: 'MGNREGA',
        sourceId: batchRecords[0]?.recordId || '',
        amount: totalAmount,
        currency: 'INR',
        recipientName: user.name,
        recipientAccount: `XXXX${randomInt(1000, 9999)}`,
        bankName: user.bankName || 'SBI',
        ifsc: `${user.bankName?.substring(0, 4).toUpperCase() || 'SBIN'}0${randomInt(100000, 999999)}`,
        status: randomChoice(['success', 'success', 'success', 'processing', 'failed'] as const),
        initiatedAt: expectedDate,
        processedAt: randomPastDate(30),
        completedAt: Math.random() > 0.2 ? randomPastDate(7) : undefined,
        failureReason: Math.random() < 0.05 ? randomChoice(['Invalid account', 'Bank server error', 'Insufficient funds in treasury']) : undefined,
        expectedDate,
        actualDate: randomPastDate(delayDays),
        delayDays,
        isFlagged: isAnomalous && Math.random() > 0.5,
        flagReason: isAnomalous ? randomChoice(['Excessive delay', 'Amount mismatch', 'Duplicate payment']) : undefined,
        riskScore: isAnomalous ? randomInt(50, 90) : randomInt(0, 25),
        reviewStatus: isAnomalous ? 'pending' : undefined,
        createdAt: expectedDate,
        updatedAt: randomPastDate(1)
      };
      
      payments.push(payment);
    }
  }
  
  return payments;
}

export function generateGrievances(users: MLUserDocument[]): GrievanceRecord[] {
  const grievances: GrievanceRecord[] = [];
  
  // 30% of users have filed grievances
  const usersWithGrievances = users.filter(() => Math.random() < 0.3);
  
  for (const user of usersWithGrievances) {
    const grievanceCount = randomInt(1, 3);
    
    for (let g = 0; g < grievanceCount; g++) {
      const category = randomChoice(GRIEVANCE_CATEGORIES) as GrievanceRecord['category'];
      const registeredAt = randomPastDate(90);
      const deadline = new Date(new Date(registeredAt).getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();
      const daysSince = Math.floor((Date.now() - new Date(registeredAt).getTime()) / (1000 * 60 * 60 * 24));
      const isOverdue = daysSince > 5;
      const status = randomChoice(['registered', 'assigned', 'investigating', 'action_taken', 'resolved', 'escalated'] as const);
      
      const grievance: GrievanceRecord = {
        ticketNumber: generateTicketNumber(),
        userId: user.userId,
        category,
        subCategory: undefined,
        description: `Grievance related to ${category.replace('_', ' ')} for user ${user.name}`,
        voiceRecordingUrl: Math.random() > 0.5 ? `audio://${user.userId}-grievance-${g}` : undefined,
        relatedLocation: {
          village: user.location.village,
          gramPanchayat: user.location.gramPanchayat,
          block: user.location.block,
          district: user.location.district
        },
        relatedScheme: category.includes('payment') ? 'MGNREGA' : undefined,
        registeredAt,
        deadline,
        daysSinceRegistration: daysSince,
        isOverdue,
        slaBreached: isOverdue && status !== 'resolved',
        status,
        priority: isOverdue ? 'high' : randomChoice(['normal', 'high']),
        escalationLevel: isOverdue ? randomInt(1, 3) as 1 | 2 | 3 : 0,
        autoEscalated: isOverdue && Math.random() > 0.3,
        escalationHistory: isOverdue ? [{
          level: 1,
          date: new Date(new Date(registeredAt).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
          reason: 'SLA breach - auto-escalated',
          escalatedTo: 'Block Development Officer'
        }] : [],
        assignedTo: status !== 'registered' ? `OFFICER-${randomInt(100, 999)}` : undefined,
        assignedRole: status !== 'registered' ? randomChoice(['Rozgar Sevak', 'Block Officer', 'District Officer']) : undefined,
        assignedAt: status !== 'registered' ? randomPastDate(daysSince - 1) : undefined,
        resolution: status === 'resolved' ? 'Issue resolved after investigation and corrective action' : undefined,
        resolutionDate: status === 'resolved' ? randomPastDate(Math.max(1, daysSince - 2)) : undefined,
        actionTaken: status === 'resolved' ? randomChoice(['Payment released', 'Work allocated', 'Complaint verified and closed']) : undefined,
        satisfactionRating: status === 'resolved' ? randomInt(1, 5) as 1 | 2 | 3 | 4 | 5 : undefined,
        wasHelpful: status === 'resolved' ? Math.random() > 0.2 : undefined,
        communications: [
          {
            date: registeredAt,
            type: 'voice_message',
            direction: 'incoming',
            summary: 'Grievance registered via voice',
            by: user.name
          }
        ],
        createdAt: registeredAt,
        updatedAt: randomPastDate(1)
      };
      
      grievances.push(grievance);
    }
  }
  
  return grievances;
}

export function generateSchemeEnrollments(users: MLUserDocument[]): SchemeEnrollment[] {
  const enrollments: SchemeEnrollment[] = [];
  
  for (const user of users) {
    for (const schemeId of user.registeredSchemes) {
      const scheme = SCHEMES.find(s => s.id === schemeId);
      if (!scheme) continue;
      
      const enrollment: SchemeEnrollment = {
        enrollmentId: `ENR-${user.userId}-${schemeId}`,
        userId: user.userId,
        schemeId,
        schemeName: scheme.name,
        schemeCategory: scheme.category as SchemeEnrollment['schemeCategory'],
        schemeLevel: schemeId.startsWith('pm') ? 'central' : 'state',
        applicationDate: randomDate(new Date(2020, 0, 1), new Date(2025, 6, 1)),
        applicationNumber: `APP-${schemeId.toUpperCase()}-${randomInt(100000, 999999)}`,
        applicationMode: randomChoice(['online', 'offline', 'csc', 'mobile_app']),
        status: user.appliedSchemes.includes(schemeId) 
          ? randomChoice(['submitted', 'under_review', 'approved']) 
          : 'approved',
        statusHistory: [{
          status: 'submitted',
          date: randomPastDate(180),
          reason: 'Application submitted'
        }],
        eligibilityScore: randomInt(70, 100),
        eligibilityCriteria: [
          { criterion: 'Income below threshold', met: true, value: user.familyIncome },
          { criterion: 'Age requirement', met: true, value: user.age },
          { criterion: 'Residency', met: true, value: user.location.state }
        ],
        documentsSubmitted: ['Aadhaar', 'Address Proof', 'Bank Passbook'],
        documentsPending: [],
        documentsVerified: ['Aadhaar'],
        benefitType: scheme.category === 'pension' ? 'cash' : randomChoice(['cash', 'in_kind', 'service']),
        benefitAmount: scheme.category === 'pension' ? 1500 : randomInt(2000, 50000),
        benefitFrequency: scheme.category === 'pension' ? 'monthly' : randomChoice(['one_time', 'quarterly', 'annually']),
        totalBenefitsReceived: randomInt(5000, 100000),
        lastBenefitDate: randomPastDate(60),
        nextBenefitDue: randomDate(new Date(), new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)),
        createdAt: randomPastDate(365),
        updatedAt: randomPastDate(7)
      };
      
      enrollments.push(enrollment);
    }
  }
  
  return enrollments;
}

export function generateMLFeatures(users: MLUserDocument[], workRecords: MGNREGAWorkRecord[]): MLFeatureRecord[] {
  const features: MLFeatureRecord[] = [];
  
  for (const user of users) {
    const userRecords = workRecords.filter(r => r.userId === user.userId);
    const isAnomalous = user.mlFlags?.isAnomaly || false;
    
    const totalHours = userRecords.reduce((sum, r) => sum + r.hoursWorked, 0);
    const totalWages = userRecords.reduce((sum, r) => sum + r.actualWageEarned, 0);
    
    const feature: MLFeatureRecord = {
      recordId: `ML-${user.userId}`,
      recordType: 'user',
      userFeatures: {
        age: user.age || 30,
        gender: user.gender,
        category: user.category,
        isLiterate: user.isLiterate,
        educationLevel: ['none', 'primary', 'middle', 'secondary', 'higher_secondary', 'graduate', 'post_graduate'].indexOf(user.educationLevel),
        familyMembers: user.familyMembers,
        landOwned: user.landOwned,
        incomeCategory: ['BPL', 'APL', 'AAY', 'PHH'].indexOf(user.incomeCategory),
        isDisabled: user.isDisabled,
        registrationDays: Math.floor((Date.now() - new Date(user.registrationDate).getTime()) / (1000 * 60 * 60 * 24)),
        totalSchemes: user.registeredSchemes.length,
        activeSchemes: user.registeredSchemes.length - user.rejectedSchemes.length
      },
      workFeatures: {
        totalDaysWorked: userRecords.length,
        avgHoursPerDay: userRecords.length > 0 ? totalHours / userRecords.length : 0,
        avgWagePerDay: userRecords.length > 0 ? totalWages / userRecords.length : 0,
        workConsistency: randomFloat(0.5, 1),
        attendanceRate: randomFloat(0.7, 1),
        locationVariance: isAnomalous ? randomFloat(0.1, 0.5) : randomFloat(0, 0.1),
        timePatternScore: isAnomalous ? randomFloat(0.3, 0.6) : randomFloat(0.7, 1),
        weekendWorkRatio: randomFloat(0, 0.1),
        supervisorCount: randomInt(1, 5),
        siteCount: randomInt(1, 8)
      },
      paymentFeatures: {
        avgPaymentDelay: isAnomalous ? randomInt(15, 45) : randomInt(2, 14),
        paymentSuccessRate: randomFloat(0.85, 1),
        totalPayments: Math.ceil(userRecords.length / 15),
        avgPaymentAmount: totalWages / Math.max(1, Math.ceil(userRecords.length / 15)),
        paymentFrequency: randomFloat(0.5, 2),
        disputeRate: isAnomalous ? randomFloat(0.1, 0.3) : randomFloat(0, 0.05),
        bankChangeCount: randomInt(0, 2)
      },
      networkFeatures: {
        sharedBankAccounts: isAnomalous ? randomInt(1, 5) : 0,
        sharedPhoneNumbers: isAnomalous ? randomInt(1, 3) : 0,
        sharedAddresses: randomInt(0, 2),
        sameHouseholdWorkers: randomInt(0, 3),
        commonSupervisors: randomInt(1, 4),
        clusterScore: isAnomalous ? randomFloat(0.6, 0.9) : randomFloat(0, 0.3)
      },
      labels: {
        isFraudulent: isAnomalous,
        fraudType: isAnomalous ? randomChoice(['ghost_worker', 'payment_fraud', 'attendance_fraud', 'collusion']) : undefined,
        fairnessScore: randomFloat(0.5, 1),
        riskLevel: isAnomalous ? 'high' : (Math.random() > 0.7 ? 'medium' : 'low'),
        anomalyScore: isAnomalous ? randomFloat(0.6, 0.95) : randomFloat(0.01, 0.3)
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    features.push(feature);
  }
  
  return features;
}

// ============================================
// MAIN GENERATOR FUNCTION
// ============================================

export interface GeneratedData {
  users: MLUserDocument[];
  workRecords: MGNREGAWorkRecord[];
  payments: PaymentTransaction[];
  grievances: GrievanceRecord[];
  schemeEnrollments: SchemeEnrollment[];
  mlFeatures: MLFeatureRecord[];
  metadata: {
    generatedAt: string;
    totalUsers: number;
    totalWorkRecords: number;
    totalPayments: number;
    totalGrievances: number;
    totalEnrollments: number;
    anomalousUsers: number;
  };
}

export function generateAllData(): GeneratedData {
  console.log('[DummyDataGenerator] 🚀 Starting data generation...');
  
  const users = generateUsers();
  console.log(`[DummyDataGenerator] ✅ Generated ${users.length} users`);
  
  const workRecords = generateWorkRecords(users);
  console.log(`[DummyDataGenerator] ✅ Generated ${workRecords.length} work records`);
  
  const payments = generatePayments(users, workRecords);
  console.log(`[DummyDataGenerator] ✅ Generated ${payments.length} payments`);
  
  const grievances = generateGrievances(users);
  console.log(`[DummyDataGenerator] ✅ Generated ${grievances.length} grievances`);
  
  const schemeEnrollments = generateSchemeEnrollments(users);
  console.log(`[DummyDataGenerator] ✅ Generated ${schemeEnrollments.length} scheme enrollments`);
  
  const mlFeatures = generateMLFeatures(users, workRecords);
  console.log(`[DummyDataGenerator] ✅ Generated ${mlFeatures.length} ML feature records`);
  
  const anomalousUsers = users.filter(u => u.mlFlags?.isAnomaly).length;
  
  return {
    users,
    workRecords,
    payments,
    grievances,
    schemeEnrollments,
    mlFeatures,
    metadata: {
      generatedAt: new Date().toISOString(),
      totalUsers: users.length,
      totalWorkRecords: workRecords.length,
      totalPayments: payments.length,
      totalGrievances: grievances.length,
      totalEnrollments: schemeEnrollments.length,
      anomalousUsers
    }
  };
}

// Export for browser console access
if (typeof window !== 'undefined') {
  (window as any).generateAllData = generateAllData;
  (window as any).generateUsers = generateUsers;
  console.log('📊 Dummy Data Generator loaded! Run: window.generateAllData()');
}

export default {
  generateAllData,
  generateUsers,
  generateWorkRecords,
  generatePayments,
  generateGrievances,
  generateSchemeEnrollments,
  generateMLFeatures
};
