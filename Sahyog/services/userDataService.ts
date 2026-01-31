/**
 * SAHAYOG User Data Service
 * Manages the current user (Ramesh Singh) and auto-updates from conversational AI
 */

import { mongoService, dbConfig } from './database';

// ============================================
// SAHAYOG USER DOCUMENT (Extended for App Use)
// ============================================

export interface SahayogUserDocument {
  userId: string;
  aadhaarNumber?: string;
  jobCardNumber?: string;
  name: string;
  fatherOrHusbandName?: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  age?: number;
  maritalStatus?: string;
  category: 'SC' | 'ST' | 'OBC' | 'General';
  isDisabled: boolean;
  isLiterate: boolean;
  educationLevel: string;
  canSignName: boolean;
  digitalLiteracy: 'none' | 'basic' | 'intermediate' | 'advanced';
  hasSmartphone: boolean;
  preferredLanguage: string;
  phoneNumber: string;
  alternatePhone?: string;
  
  location: {
    state: string;
    stateCode?: string;
    district: string;
    districtCode?: string;
    block: string;
    blockCode?: string;
    gramPanchayat: string;
    gpCode?: string;
    village: string;
    villageCode?: string;
    pincode: string;
    coordinates?: { lat: number; lng: number };
    isTribalArea: boolean;
    isUrban?: boolean;
  };
  
  bankAccountLinked: boolean;
  bankName?: string;
  ifscCode?: string;
  
  landOwned: number;
  landType?: string;
  isHouseholdHead: boolean;
  familyMembers: number;
  dependents: number;
  incomeCategory: 'BPL' | 'APL' | 'AAY' | 'PHH';
  familyIncome?: number;
  
  houseType: 'kutcha' | 'semi_pucca' | 'pucca';
  hasToilet: boolean;
  hasElectricity: boolean;
  hasDrinkingWater: boolean;
  hasLPGConnection: boolean;
  
  mgnrega: {
    isRegistered: boolean;
    jobCardIssueDate?: string;
    jobCardStatus: 'active' | 'suspended' | 'cancelled' | 'not_issued';
    householdMembers?: number;
    totalDaysWorked: number;
    currentYearDaysWorked: number;
    currentYearDaysRemaining: number;
    lastWorkDate?: string;
    pendingWages: number;
    totalWagesEarned: number;
    averageWagePerDay: number;
    workPreference?: string[];
    demandRegistered?: boolean;
    lastDemandDate?: string;
  };
  
  enrolledSchemes: Array<{
    schemeId: string;
    enrolledDate: string;
    status: string;
  }>;
  
  skills: Array<{
    name: string;
    level: string;
    certified: boolean;
  }>;
  
  primaryOccupation?: string;
  employmentType?: string;
  
  grievancesFiled: number;
  grievancesResolved: number;
  
  onboardingLevel: 0 | 1 | 2 | 3;
  lastActiveDate: string;
  createdAt: string;
  updatedAt: string;
  
  mlFlags?: {
    isAnomaly: boolean;
    riskScore: number;
    fraudProbability: number;
    lastMLScan?: string;
  };
}

// ============================================
// RAMESH SINGH - THE DEMO USER
// ============================================

export const RAMESH_SINGH: SahayogUserDocument = {
  userId: 'USR-0001',
  aadhaarNumber: 'XXXX-XXXX-4521',
  jobCardNumber: 'MP23-SEH-234567',
  name: 'Ramesh Singh',
  fatherOrHusbandName: 'Shivprasad Singh',
  gender: 'male',
  dateOfBirth: '1985-03-15T00:00:00.000Z',
  age: 39,
  maritalStatus: 'married',
  category: 'OBC',
  isDisabled: false,
  isLiterate: true,
  educationLevel: 'secondary',
  canSignName: true,
  digitalLiteracy: 'intermediate',
  hasSmartphone: true,
  preferredLanguage: 'hindi',
  phoneNumber: '9876543210',
  alternatePhone: '9876543211',
  
  location: {
    state: 'Madhya Pradesh',
    stateCode: 'MP',
    district: 'Sehore',
    districtCode: 'SEH',
    block: 'Ashta',
    blockCode: 'AST',
    gramPanchayat: 'Rampur GP',
    gpCode: 'RMP',
    village: 'Rampur',
    villageCode: 'RMP01',
    pincode: '466116',
    coordinates: { lat: 23.0145, lng: 76.7200 },
    isTribalArea: false,
    isUrban: false
  },
  
  bankAccountLinked: true,
  bankName: 'State Bank of India',
  ifscCode: 'SBIN0004567',
  
  landOwned: 1.5,
  landType: 'irrigated',
  isHouseholdHead: true,
  familyMembers: 5,
  dependents: 3,
  incomeCategory: 'BPL',
  familyIncome: 8500,
  
  houseType: 'pucca',
  hasToilet: true,
  hasElectricity: true,
  hasDrinkingWater: true,
  hasLPGConnection: true,
  
  mgnrega: {
    isRegistered: true,
    jobCardIssueDate: '2019-04-15T00:00:00.000Z',
    jobCardStatus: 'active',
    householdMembers: 3,
    totalDaysWorked: 342,
    currentYearDaysWorked: 45,
    currentYearDaysRemaining: 55,
    lastWorkDate: '2024-01-15T00:00:00.000Z',
    pendingWages: 2880,
    totalWagesEarned: 98496,
    averageWagePerDay: 288,
    workPreference: ['road', 'water_conservation', 'construction'],
    demandRegistered: true
  },
  
  enrolledSchemes: [
    { schemeId: 'mgnrega', enrolledDate: '2019-04-15', status: 'active' },
    { schemeId: 'pmjdy', enrolledDate: '2020-01-10', status: 'active' },
    { schemeId: 'pmsby', enrolledDate: '2020-06-15', status: 'active' }
  ],
  
  skills: [
    { name: 'Masonry', level: 'intermediate', certified: false },
    { name: 'Agriculture', level: 'advanced', certified: false },
    { name: 'Manual Labor', level: 'advanced', certified: false }
  ],
  
  primaryOccupation: 'Agricultural Labor',
  employmentType: 'casual_labor',
  
  grievancesFiled: 2,
  grievancesResolved: 1,
  
  onboardingLevel: 3,
  lastActiveDate: new Date().toISOString(),
  createdAt: '2019-04-15T00:00:00.000Z',
  updatedAt: new Date().toISOString(),
  
  mlFlags: {
    isAnomaly: false,
    riskScore: 15,
    fraudProbability: 0.05
  }
};

// Storage key for user data
const USER_DATA_KEY = 'sahayog_current_user';

// ============================================
// USER DATA SERVICE
// ============================================

class UserDataService {
  private currentUser: SahayogUserDocument;

  constructor() {
    this.currentUser = this.loadUserData();
  }

  private loadUserData(): SahayogUserDocument {
    try {
      const stored = localStorage.getItem(USER_DATA_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('[UserDataService] Failed to load user data:', error);
    }
    
    // Return Ramesh Singh as default
    this.saveUserData(RAMESH_SINGH);
    return RAMESH_SINGH;
  }

  private saveUserData(user: SahayogUserDocument): void {
    try {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('[UserDataService] Failed to save user data:', error);
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): SahayogUserDocument {
    return this.currentUser;
  }

  /**
   * Update user data (called by conversational AI)
   */
  updateUser(updates: Partial<SahayogUserDocument>): SahayogUserDocument {
    this.currentUser = {
      ...this.currentUser,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveUserData(this.currentUser);
    
    console.log('[UserDataService] ✅ User data updated:', Object.keys(updates));
    return this.currentUser;
  }

  /**
   * Update specific field (for conversational AI extraction)
   */
  updateField(field: string, value: any): void {
    const updates: Partial<SahayogUserDocument> = {};
    
    // Handle nested fields
    const parts = field.split('.');
    if (parts.length === 1) {
      (updates as any)[field] = value;
    } else if (parts.length === 2) {
      const [parent, child] = parts;
      (updates as any)[parent] = {
        ...(this.currentUser as any)[parent],
        [child]: value
      };
    }
    
    this.updateUser(updates);
  }

  /**
   * Update MGNREGA data
   */
  updateMGNREGA(updates: Partial<SahayogUserDocument['mgnrega']>): void {
    const mgnrega = {
      ...this.currentUser.mgnrega,
      ...updates
    };
    this.updateUser({ mgnrega });
  }

  /**
   * Add enrolled scheme
   */
  addEnrolledScheme(schemeId: string, status: string = 'active'): void {
    const existing = this.currentUser.enrolledSchemes.find(s => s.schemeId === schemeId);
    if (existing) {
      existing.status = status;
    } else {
      this.currentUser.enrolledSchemes.push({
        schemeId,
        enrolledDate: new Date().toISOString(),
        status
      });
    }
    this.saveUserData(this.currentUser);
  }

  /**
   * Add skill
   */
  addSkill(name: string, level: string = 'beginner', certified: boolean = false): void {
    const existing = this.currentUser.skills?.find(s => s.name === name);
    if (!existing) {
      this.currentUser.skills = [
        ...(this.currentUser.skills || []),
        { name, level, certified }
      ];
      this.saveUserData(this.currentUser);
    }
  }

  /**
   * Increment grievances filed
   */
  incrementGrievances(): void {
    this.updateUser({
      grievancesFiled: (this.currentUser.grievancesFiled || 0) + 1
    });
  }

  /**
   * Update work days
   */
  addWorkDays(days: number, earnings: number): void {
    const mgnrega = this.currentUser.mgnrega;
    this.updateMGNREGA({
      currentYearDaysWorked: (mgnrega.currentYearDaysWorked || 0) + days,
      currentYearDaysRemaining: Math.max(0, (mgnrega.currentYearDaysRemaining || 100) - days),
      totalDaysWorked: (mgnrega.totalDaysWorked || 0) + days,
      totalWagesEarned: (mgnrega.totalWagesEarned || 0) + earnings,
      lastWorkDate: new Date().toISOString()
    });
  }

  /**
   * Record payment received
   */
  recordPayment(amount: number): void {
    const mgnrega = this.currentUser.mgnrega;
    this.updateMGNREGA({
      pendingWages: Math.max(0, (mgnrega.pendingWages || 0) - amount)
    });
  }

  /**
   * Get user for UserProfile conversion
   */
  getUserProfile(): {
    id: string;
    name: string;
    village: string;
    block: string;
    district: string;
    state: string;
    preferredLanguage: string;
    daysWorked: number;
    aadhaarLinked: boolean;
    jobCardNumber: string;
    phoneNumber: string;
    category: 'SC' | 'ST' | 'OBC' | 'General';
    gender: 'male' | 'female' | 'other';
    age: number;
    isLiterate: boolean;
    bankAccountLinked: boolean;
    familyMembers: number;
    landOwned: number;
    onboardingLevel: 0 | 1 | 2 | 3;
    registeredSchemes: string[];
    pendingPayments: number;
    lastActiveDate: string;
  } {
    const user = this.currentUser;
    return {
      id: user.userId,
      name: user.name,
      village: user.location.village,
      block: user.location.block,
      district: user.location.district,
      state: user.location.state,
      preferredLanguage: user.preferredLanguage || 'hindi',
      daysWorked: user.mgnrega.currentYearDaysWorked || 0,
      aadhaarLinked: user.bankAccountLinked || false,
      jobCardNumber: user.jobCardNumber || '',
      phoneNumber: user.phoneNumber || '',
      category: user.category || 'General',
      gender: user.gender || 'male',
      age: user.age || 30,
      isLiterate: user.isLiterate || false,
      bankAccountLinked: user.bankAccountLinked || false,
      familyMembers: user.familyMembers || 1,
      landOwned: user.landOwned || 0,
      onboardingLevel: user.onboardingLevel || 3,
      registeredSchemes: user.enrolledSchemes.map(s => s.schemeId),
      pendingPayments: user.mgnrega.pendingWages || 0,
      lastActiveDate: user.lastActiveDate || new Date().toISOString()
    };
  }

  /**
   * Sync with database
   */
  async syncToDatabase(): Promise<void> {
    try {
      const existingResult = await mongoService.findOne<SahayogUserDocument>(
        dbConfig.collections.users,
        { userId: this.currentUser.userId }
      );

      if (existingResult.data) {
        await mongoService.updateOne(
          dbConfig.collections.users,
          { userId: this.currentUser.userId },
          this.currentUser
        );
      } else {
        await mongoService.insertOne(
          dbConfig.collections.users,
          this.currentUser
        );
      }
      
      console.log('[UserDataService] ✅ Synced to database');
    } catch (error) {
      console.error('[UserDataService] Failed to sync to database:', error);
    }
  }
}

export const userDataService = new UserDataService();
export default userDataService;
