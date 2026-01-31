/**
 * SAHAYOG Scheme & Job Management Service
 * Handles MGNREGA and other scheme operations with real database updates
 */

import { mongoService, dbConfig } from './database';
import { MLUserDocument, MGNREGAWorkRecord, PaymentTransaction } from './database/mlSchemas';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface MGNREGAJobPosting {
  id: string;
  title: string;
  titleHindi: string;
  description: string;
  descriptionHindi: string;
  workType: 'earth_work' | 'water_conservation' | 'road_construction' | 'plantation' | 'building_construction' | 'irrigation' | 'other';
  location: {
    village: string;
    gramPanchayat: string;
    block: string;
    district: string;
    state: string;
    coordinates?: { lat: number; lng: number };
  };
  wagePerDay: number;
  totalSlots: number;
  filledSlots: number;
  availableSlots: number;
  requiredSkills: string[];
  startDate: string;
  endDate: string;
  workDays: number;
  status: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  applicants: JobApplicant[];
  priorityCategories: ('SC' | 'ST' | 'OBC' | 'disabled' | 'widow' | 'elderly')[];
  supervisorName?: string;
  supervisorPhone?: string;
  materialProvided: boolean;
  toolsProvided: boolean;
}

export interface JobApplicant {
  userId: string;
  name: string;
  jobCardNumber: string;
  appliedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'allocated' | 'completed';
  allocatedDays?: number;
  startDate?: string;
  completedDays?: number;
  wagesEarned?: number;
  wageStatus?: 'pending' | 'processing' | 'paid';
}

export interface SchemeEnrollmentRequest {
  userId: string;
  schemeId: string;
  schemeName: string;
  appliedAt: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'enrolled';
  documents: { type: string; uploaded: boolean; verified: boolean }[];
  remarks?: string;
  processedBy?: string;
  processedAt?: string;
}

export interface AdminJobCreationRequest {
  title: string;
  titleHindi: string;
  description: string;
  descriptionHindi: string;
  workType: MGNREGAJobPosting['workType'];
  village: string;
  gramPanchayat: string;
  block: string;
  district: string;
  state: string;
  wagePerDay: number;
  totalSlots: number;
  requiredSkills: string[];
  startDate: string;
  endDate: string;
  priorityCategories: MGNREGAJobPosting['priorityCategories'];
  supervisorName?: string;
  supervisorPhone?: string;
  materialProvided: boolean;
  toolsProvided: boolean;
}

// ============================================
// MGNREGA SCHEME DETAILS
// ============================================

export const MGNREGA_INFO = {
  fullName: 'Mahatma Gandhi National Rural Employment Guarantee Act',
  fullNameHindi: 'महात्मा गांधी राष्ट्रीय ग्रामीण रोजगार गारंटी अधिनियम',
  guaranteedDays: 100,
  wageRate: {
    min: 243,
    max: 333,
    average: 288
  },
  eligibility: {
    minAge: 18,
    mustBeRural: true,
    requiresJobCard: true,
    householdBased: true
  },
  workTypes: [
    { id: 'water_conservation', name: 'Water Conservation', nameHindi: 'जल संरक्षण', icon: '💧' },
    { id: 'road_construction', name: 'Road Construction', nameHindi: 'सड़क निर्माण', icon: '🛣️' },
    { id: 'earth_work', name: 'Earth Work', nameHindi: 'मिट्टी का काम', icon: '⛏️' },
    { id: 'plantation', name: 'Plantation', nameHindi: 'वृक्षारोपण', icon: '🌳' },
    { id: 'irrigation', name: 'Irrigation', nameHindi: 'सिंचाई', icon: '🚰' },
    { id: 'building_construction', name: 'Building Construction', nameHindi: 'भवन निर्माण', icon: '🏗️' },
  ],
  documents: [
    { type: 'job_card', name: 'Job Card', nameHindi: 'जॉब कार्ड', required: true },
    { type: 'aadhaar', name: 'Aadhaar Card', nameHindi: 'आधार कार्ड', required: true },
    { type: 'bank_passbook', name: 'Bank Passbook', nameHindi: 'बैंक पासबुक', required: true },
    { type: 'photo', name: 'Passport Photo', nameHindi: 'पासपोर्ट फोटो', required: false },
  ],
  benefits: [
    { text: '100 days guaranteed employment per year', textHindi: 'प्रति वर्ष 100 दिन का गारंटीशुदा रोजगार' },
    { text: 'Minimum wage as per state', textHindi: 'राज्य के अनुसार न्यूनतम मजदूरी' },
    { text: 'Work within 5 km of residence', textHindi: 'निवास से 5 किमी के भीतर काम' },
    { text: 'Payment within 15 days', textHindi: '15 दिनों के भीतर भुगतान' },
    { text: 'Unemployment allowance if work not provided', textHindi: 'काम न मिलने पर बेरोजगारी भत्ता' },
  ]
};

// ============================================
// OTHER SCHEMES
// ============================================

export const ALL_SCHEMES = [
  {
    id: 'mgnrega',
    name: 'MGNREGA',
    nameHindi: 'मनरेगा',
    category: 'employment',
    description: 'Guaranteed 100 days of wage employment',
    descriptionHindi: '100 दिनों की गारंटीशुदा मजदूरी रोजगार',
    icon: '👷',
    isActive: true,
    canCreateJobs: true
  },
  {
    id: 'pmay',
    name: 'Pradhan Mantri Awas Yojana',
    nameHindi: 'प्रधानमंत्री आवास योजना',
    category: 'housing',
    description: 'Affordable housing for rural poor',
    descriptionHindi: 'ग्रामीण गरीबों के लिए किफायती आवास',
    icon: '🏠',
    isActive: true,
    canCreateJobs: false
  },
  {
    id: 'pmkvy',
    name: 'Pradhan Mantri Kaushal Vikas Yojana',
    nameHindi: 'प्रधानमंत्री कौशल विकास योजना',
    category: 'skills',
    description: 'Free skill training with certification',
    descriptionHindi: 'प्रमाणन के साथ मुफ्त कौशल प्रशिक्षण',
    icon: '📚',
    isActive: true,
    canCreateJobs: true
  },
  {
    id: 'pmjdy',
    name: 'Pradhan Mantri Jan Dhan Yojana',
    nameHindi: 'प्रधानमंत्री जन धन योजना',
    category: 'finance',
    description: 'Zero balance bank account with insurance',
    descriptionHindi: 'बीमा के साथ जीरो बैलेंस बैंक खाता',
    icon: '🏦',
    isActive: true,
    canCreateJobs: false
  },
  {
    id: 'pmsby',
    name: 'Pradhan Mantri Suraksha Bima Yojana',
    nameHindi: 'प्रधानमंत्री सुरक्षा बीमा योजना',
    category: 'insurance',
    description: 'Accident insurance at ₹12/year',
    descriptionHindi: '₹12/वर्ष में दुर्घटना बीमा',
    icon: '🛡️',
    isActive: true,
    canCreateJobs: false
  },
  {
    id: 'pmjjby',
    name: 'Pradhan Mantri Jeevan Jyoti Bima Yojana',
    nameHindi: 'प्रधानमंत्री जीवन ज्योति बीमा योजना',
    category: 'insurance',
    description: 'Life insurance at ₹330/year',
    descriptionHindi: '₹330/वर्ष में जीवन बीमा',
    icon: '💚',
    isActive: true,
    canCreateJobs: false
  },
  {
    id: 'nrlm',
    name: 'National Rural Livelihood Mission',
    nameHindi: 'राष्ट्रीय ग्रामीण आजीविका मिशन',
    category: 'livelihood',
    description: 'Self-employment and skill training',
    descriptionHindi: 'स्वरोजगार और कौशल प्रशिक्षण',
    icon: '🌾',
    isActive: true,
    canCreateJobs: true
  },
  {
    id: 'widow_pension',
    name: 'Widow Pension Scheme',
    nameHindi: 'विधवा पेंशन योजना',
    category: 'pension',
    description: 'Monthly pension for widows',
    descriptionHindi: 'विधवाओं के लिए मासिक पेंशन',
    icon: '👵',
    isActive: true,
    canCreateJobs: false
  },
  {
    id: 'old_age_pension',
    name: 'Old Age Pension',
    nameHindi: 'वृद्धावस्था पेंशन',
    category: 'pension',
    description: 'Monthly pension for elderly',
    descriptionHindi: 'वृद्धों के लिए मासिक पेंशन',
    icon: '🧓',
    isActive: true,
    canCreateJobs: false
  },
  {
    id: 'disability_pension',
    name: 'Disability Pension',
    nameHindi: 'विकलांगता पेंशन',
    category: 'pension',
    description: 'Monthly pension for disabled persons',
    descriptionHindi: 'विकलांग व्यक्तियों के लिए मासिक पेंशन',
    icon: '♿',
    isActive: true,
    canCreateJobs: false
  }
];

// ============================================
// STORAGE KEYS
// ============================================

const JOBS_STORAGE_KEY = 'sahayog_mgnrega_jobs';
const ENROLLMENTS_STORAGE_KEY = 'sahayog_scheme_enrollments';
const APPLICATIONS_STORAGE_KEY = 'sahayog_job_applications';

// ============================================
// SCHEME MANAGEMENT SERVICE
// ============================================

class SchemeManagementService {
  private jobs: MGNREGAJobPosting[] = [];
  private enrollments: SchemeEnrollmentRequest[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const jobsData = localStorage.getItem(JOBS_STORAGE_KEY);
      if (jobsData) {
        this.jobs = JSON.parse(jobsData);
      }

      const enrollmentsData = localStorage.getItem(ENROLLMENTS_STORAGE_KEY);
      if (enrollmentsData) {
        this.enrollments = JSON.parse(enrollmentsData);
      }

      console.log('[SchemeService] Loaded', this.jobs.length, 'jobs and', this.enrollments.length, 'enrollments');
    } catch (error) {
      console.error('[SchemeService] Failed to load from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(this.jobs));
      localStorage.setItem(ENROLLMENTS_STORAGE_KEY, JSON.stringify(this.enrollments));
    } catch (error) {
      console.error('[SchemeService] Failed to save to storage:', error);
    }
  }

  // ============================================
  // JOB MANAGEMENT (Admin)
  // ============================================

  /**
   * Create a new MGNREGA job posting (Admin only)
   */
  createJob(request: AdminJobCreationRequest, createdBy: string): MGNREGAJobPosting {
    const jobId = `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);
    const workDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const job: MGNREGAJobPosting = {
      id: jobId,
      title: request.title,
      titleHindi: request.titleHindi,
      description: request.description,
      descriptionHindi: request.descriptionHindi,
      workType: request.workType,
      location: {
        village: request.village,
        gramPanchayat: request.gramPanchayat,
        block: request.block,
        district: request.district,
        state: request.state
      },
      wagePerDay: request.wagePerDay,
      totalSlots: request.totalSlots,
      filledSlots: 0,
      availableSlots: request.totalSlots,
      requiredSkills: request.requiredSkills,
      startDate: request.startDate,
      endDate: request.endDate,
      workDays,
      status: 'published',
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      applicants: [],
      priorityCategories: request.priorityCategories,
      supervisorName: request.supervisorName,
      supervisorPhone: request.supervisorPhone,
      materialProvided: request.materialProvided,
      toolsProvided: request.toolsProvided
    };

    this.jobs.push(job);
    this.saveToStorage();

    console.log('[SchemeService] ✅ Created job:', jobId);
    return job;
  }

  /**
   * Update a job posting
   */
  updateJob(jobId: string, updates: Partial<MGNREGAJobPosting>): MGNREGAJobPosting | null {
    const index = this.jobs.findIndex(j => j.id === jobId);
    if (index === -1) return null;

    this.jobs[index] = {
      ...this.jobs[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveToStorage();
    return this.jobs[index];
  }

  /**
   * Delete a job posting
   */
  deleteJob(jobId: string): boolean {
    const index = this.jobs.findIndex(j => j.id === jobId);
    if (index === -1) return false;

    this.jobs.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  /**
   * Get all jobs
   */
  getAllJobs(): MGNREGAJobPosting[] {
    return [...this.jobs];
  }

  /**
   * Get published jobs (for users)
   */
  getPublishedJobs(): MGNREGAJobPosting[] {
    return this.jobs.filter(j => j.status === 'published' || j.status === 'in_progress');
  }

  /**
   * Get jobs by location
   */
  getJobsByLocation(block: string, district: string): MGNREGAJobPosting[] {
    return this.getPublishedJobs().filter(j => 
      j.location.block === block || j.location.district === district
    );
  }

  /**
   * Get job by ID
   */
  getJobById(jobId: string): MGNREGAJobPosting | null {
    return this.jobs.find(j => j.id === jobId) || null;
  }

  // ============================================
  // JOB APPLICATION (Users)
  // ============================================

  /**
   * Apply for a job
   */
  applyForJob(jobId: string, userId: string, name: string, jobCardNumber: string): { success: boolean; message: string } {
    const job = this.getJobById(jobId);
    if (!job) {
      return { success: false, message: 'Job not found' };
    }

    if (job.availableSlots <= 0) {
      return { success: false, message: 'No slots available' };
    }

    // Check if already applied
    if (job.applicants.some(a => a.userId === userId)) {
      return { success: false, message: 'Already applied for this job' };
    }

    const applicant: JobApplicant = {
      userId,
      name,
      jobCardNumber,
      appliedAt: new Date().toISOString(),
      status: 'pending'
    };

    job.applicants.push(applicant);
    this.saveToStorage();

    console.log('[SchemeService] ✅ Application submitted:', userId, 'for job', jobId);
    return { success: true, message: 'Application submitted successfully' };
  }

  /**
   * Approve job application (Admin)
   */
  approveApplication(jobId: string, userId: string, allocatedDays: number): { success: boolean; message: string } {
    const job = this.getJobById(jobId);
    if (!job) {
      return { success: false, message: 'Job not found' };
    }

    const applicant = job.applicants.find(a => a.userId === userId);
    if (!applicant) {
      return { success: false, message: 'Application not found' };
    }

    if (job.availableSlots <= 0) {
      return { success: false, message: 'No slots available' };
    }

    applicant.status = 'allocated';
    applicant.allocatedDays = allocatedDays;
    applicant.startDate = job.startDate;
    job.filledSlots++;
    job.availableSlots--;

    this.saveToStorage();

    // Update user's MGNREGA data
    this.updateUserMGNREGA(userId, allocatedDays, job.wagePerDay);

    console.log('[SchemeService] ✅ Application approved:', userId);
    return { success: true, message: 'Application approved' };
  }

  /**
   * Reject job application (Admin)
   */
  rejectApplication(jobId: string, userId: string, reason: string): { success: boolean; message: string } {
    const job = this.getJobById(jobId);
    if (!job) {
      return { success: false, message: 'Job not found' };
    }

    const applicant = job.applicants.find(a => a.userId === userId);
    if (!applicant) {
      return { success: false, message: 'Application not found' };
    }

    applicant.status = 'rejected';
    this.saveToStorage();

    console.log('[SchemeService] Application rejected:', userId);
    return { success: true, message: 'Application rejected' };
  }

  /**
   * Get user's applications
   */
  getUserApplications(userId: string): { job: MGNREGAJobPosting; application: JobApplicant }[] {
    const results: { job: MGNREGAJobPosting; application: JobApplicant }[] = [];

    for (const job of this.jobs) {
      const application = job.applicants.find(a => a.userId === userId);
      if (application) {
        results.push({ job, application });
      }
    }

    return results;
  }

  // ============================================
  // SCHEME ENROLLMENT
  // ============================================

  /**
   * Get scheme by ID
   */
  getSchemeById(schemeId: string): typeof ALL_SCHEMES[0] | undefined {
    return ALL_SCHEMES.find(s => s.id === schemeId);
  }

  /**
   * Enroll user in a scheme
   */
  enrollInScheme(userId: string, schemeId: string, schemeName: string): SchemeEnrollmentRequest {
    const scheme = ALL_SCHEMES.find(s => s.id === schemeId);
    const documents = schemeId === 'mgnrega' 
      ? MGNREGA_INFO.documents.map(d => ({ type: d.type, uploaded: false, verified: false }))
      : [{ type: 'aadhaar', uploaded: false, verified: false }];

    const enrollment: SchemeEnrollmentRequest = {
      userId,
      schemeId,
      schemeName,
      appliedAt: new Date().toISOString(),
      status: 'pending',
      documents
    };

    // Check if already enrolled
    const existing = this.enrollments.find(e => e.userId === userId && e.schemeId === schemeId);
    if (existing) {
      return existing;
    }

    this.enrollments.push(enrollment);
    this.saveToStorage();

    console.log('[SchemeService] ✅ Enrolled user', userId, 'in scheme', schemeId);
    return enrollment;
  }

  /**
   * Get user's enrollments
   */
  getUserEnrollments(userId: string): SchemeEnrollmentRequest[] {
    return this.enrollments.filter(e => e.userId === userId);
  }

  /**
   * Get all enrollments (Admin)
   */
  getAllEnrollments(): SchemeEnrollmentRequest[] {
    return [...this.enrollments];
  }

  /**
   * Update enrollment status (Admin)
   */
  updateEnrollmentStatus(
    userId: string, 
    schemeId: string, 
    status: SchemeEnrollmentRequest['status'],
    processedBy: string,
    remarks?: string
  ): boolean {
    const enrollment = this.enrollments.find(e => e.userId === userId && e.schemeId === schemeId);
    if (!enrollment) return false;

    enrollment.status = status;
    enrollment.processedBy = processedBy;
    enrollment.processedAt = new Date().toISOString();
    if (remarks) enrollment.remarks = remarks;

    this.saveToStorage();
    return true;
  }

  // ============================================
  // USER DATA UPDATES
  // ============================================

  /**
   * Update user's MGNREGA data after job allocation
   */
  private async updateUserMGNREGA(userId: string, daysAllocated: number, wagePerDay: number): Promise<void> {
    try {
      const userResult = await mongoService.findOne<MLUserDocument>(
        dbConfig.collections.users,
        { userId }
      );

      if (userResult.data) {
        const user = userResult.data;
        const updatedMGNREGA = {
          ...user.mgnrega,
          currentYearDaysWorked: (user.mgnrega?.currentYearDaysWorked || 0) + daysAllocated,
          currentYearDaysRemaining: Math.max(0, (user.mgnrega?.currentYearDaysRemaining || 100) - daysAllocated),
          pendingWages: (user.mgnrega?.pendingWages || 0) + (daysAllocated * wagePerDay),
          lastWorkDate: new Date().toISOString()
        };

        await mongoService.updateOne(
          dbConfig.collections.users,
          { userId },
          { mgnrega: updatedMGNREGA }
        );

        console.log('[SchemeService] ✅ Updated MGNREGA data for user:', userId);
      }
    } catch (error) {
      console.error('[SchemeService] Failed to update user MGNREGA data:', error);
    }
  }

  /**
   * Create work record for allocated job
   */
  async createWorkRecord(
    userId: string,
    jobId: string,
    date: string,
    hoursWorked: number,
    wage: number
  ): Promise<void> {
    try {
      const job = this.getJobById(jobId);
      if (!job) return;

      const workRecord: Partial<MGNREGAWorkRecord> = {
        recordId: `WR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        userId,
        date,
        hoursWorked,
        calculatedWage: wage,
        actualWageEarned: wage,
        worksite: {
          name: job.title,
          location: {
            lat: job.location.coordinates?.lat || 0,
            lng: job.location.coordinates?.lng || 0
          },
          gramPanchayat: job.location.gramPanchayat,
          block: job.location.block,
          district: job.location.district,
          state: job.location.state,
          distanceFromVillageKm: 2 // Assume 2km
        },
        checkInTime: '08:00',
        checkOutTime: '16:00',
        checkInMethod: 'manual',
        verifiedBy: job.supervisorName || 'Supervisor',
        paymentStatus: 'pending'
      };

      await mongoService.insertOne(dbConfig.collections.workRecords || 'work_records', workRecord);
      console.log('[SchemeService] ✅ Created work record for user:', userId);
    } catch (error) {
      console.error('[SchemeService] Failed to create work record:', error);
    }
  }

  // ============================================
  // INITIALIZATION WITH SAMPLE DATA
  // ============================================

  /**
   * Initialize with sample jobs if none exist
   */
  initializeSampleJobs(): void {
    if (this.jobs.length > 0) return;

    const sampleJobs: AdminJobCreationRequest[] = [
      {
        title: 'Pond Deepening Work',
        titleHindi: 'तालाब गहरीकरण कार्य',
        description: 'Deepening and cleaning of village pond for water conservation',
        descriptionHindi: 'जल संरक्षण के लिए गांव के तालाब की गहराई और सफाई',
        workType: 'water_conservation',
        village: 'Rampur',
        gramPanchayat: 'Rampur GP',
        block: 'Sadar',
        district: 'Varanasi',
        state: 'Uttar Pradesh',
        wagePerDay: 288,
        totalSlots: 25,
        requiredSkills: ['Manual Labor', 'Earth Work'],
        startDate: '2024-02-01',
        endDate: '2024-02-28',
        priorityCategories: ['SC', 'ST', 'disabled'],
        supervisorName: 'Rajesh Kumar',
        supervisorPhone: '9876543210',
        materialProvided: true,
        toolsProvided: true
      },
      {
        title: 'Village Road Repair',
        titleHindi: 'ग्राम सड़क मरम्मत',
        description: 'Repair and maintenance of internal village roads',
        descriptionHindi: 'आंतरिक ग्राम सड़कों की मरम्मत और रखरखाव',
        workType: 'road_construction',
        village: 'Rampur',
        gramPanchayat: 'Rampur GP',
        block: 'Sadar',
        district: 'Varanasi',
        state: 'Uttar Pradesh',
        wagePerDay: 288,
        totalSlots: 30,
        requiredSkills: ['Road Work', 'Manual Labor'],
        startDate: '2024-02-05',
        endDate: '2024-03-05',
        priorityCategories: ['SC', 'ST', 'OBC'],
        supervisorName: 'Suresh Yadav',
        supervisorPhone: '9876543211',
        materialProvided: true,
        toolsProvided: true
      },
      {
        title: 'Tree Plantation Drive',
        titleHindi: 'वृक्षारोपण अभियान',
        description: 'Planting and nurturing trees along roadside and common lands',
        descriptionHindi: 'सड़क किनारे और सामुदायिक भूमि पर पेड़ लगाना और पालना',
        workType: 'plantation',
        village: 'Sundarpur',
        gramPanchayat: 'Sundarpur GP',
        block: 'Sadar',
        district: 'Varanasi',
        state: 'Uttar Pradesh',
        wagePerDay: 288,
        totalSlots: 20,
        requiredSkills: ['Plantation', 'Manual Labor'],
        startDate: '2024-02-10',
        endDate: '2024-02-25',
        priorityCategories: ['widow', 'elderly'],
        supervisorName: 'Anita Devi',
        supervisorPhone: '9876543212',
        materialProvided: true,
        toolsProvided: true
      },
      {
        title: 'Check Dam Construction',
        titleHindi: 'चेक डैम निर्माण',
        description: 'Construction of check dam for water harvesting',
        descriptionHindi: 'जल संचयन के लिए चेक डैम का निर्माण',
        workType: 'irrigation',
        village: 'Rampur',
        gramPanchayat: 'Rampur GP',
        block: 'Sadar',
        district: 'Varanasi',
        state: 'Uttar Pradesh',
        wagePerDay: 300,
        totalSlots: 15,
        requiredSkills: ['Construction', 'Masonry', 'Manual Labor'],
        startDate: '2024-02-15',
        endDate: '2024-03-15',
        priorityCategories: ['SC', 'ST'],
        supervisorName: 'Mohan Lal',
        supervisorPhone: '9876543213',
        materialProvided: true,
        toolsProvided: true
      }
    ];

    for (const job of sampleJobs) {
      this.createJob(job, 'admin');
    }

    console.log('[SchemeService] ✅ Initialized with', sampleJobs.length, 'sample jobs');
  }
}

export const schemeService = new SchemeManagementService();

// Initialize sample jobs
schemeService.initializeSampleJobs();

export default schemeService;
