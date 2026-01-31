
export enum UIMode {
  STANDARD = 'standard',
  PICTURE = 'picture',
  HIGH_CONTRAST = 'high_contrast'
}

// Active Tab / Screen Types
export type ActiveTab = 'home' | 'work' | 'schemes' | 'grievance' | 'skills' | 'wellbeing' | 'admin';

export type OnboardingLevel = 0 | 1 | 2 | 3 | 'verified';

// ============================================
// USER & PROFILE TYPES
// ============================================

export interface UserProfile {
  id: string;
  name: string;
  village: string;
  block: string;
  district: string;
  state: string;
  preferredLanguage: string;
  uiMode: UIMode;
  daysWorked: number;
  // Enhanced fields from unified.md
  aadhaarLinked: boolean;
  jobCardNumber?: string;
  phoneNumber: string;
  category?: 'SC' | 'ST' | 'OBC' | 'General';
  gender?: 'male' | 'female' | 'other';
  age?: number;
  isLiterate: boolean;
  bankAccountLinked: boolean;
  familyMembers?: number;
  landOwned?: number; // in acres
  onboardingLevel: 0 | 1 | 2 | 3;
  registeredSchemes: string[];
  pendingPayments: number;
  lastActiveDate: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  village: string;
  gramPanchayat: string;
  block: string;
  district: string;
  state: string;
  pincode: string;
}

// ============================================
// JOB & WORK TYPES
// ============================================

export interface JobOpportunity {
  id: string;
  title: string;
  titleHindi: string;
  location: string;
  wage: number;
  type: 'manual' | 'skilled' | 'agriculture' | 'construction';
  icon: string;
  distance: string;
  distanceKm: number;
  availableSlots: number;
  startDate: string;
  endDate?: string;
  workDays: number;
  description: string;
  descriptionHindi: string;
  requirements?: string[];
  // Fairness Engine fields
  fairnessScore: number;
  allocationReason?: string;
  priorityGroups: string[];
  applicants: number;
}

export interface WorkHistory {
  id: string;
  jobId: string;
  jobTitle: string;
  daysWorked: number;
  totalEarnings: number;
  startDate: string;
  endDate: string;
  paymentStatus: 'pending' | 'processing' | 'paid';
  paymentDate?: string;
  workSite: string;
  supervisorName?: string;
  rating?: number;
}

// ============================================
// GRIEVANCE TYPES (5-Day Promise System)
// ============================================

export type GrievanceStatus = 
  | 'registered' 
  | 'assigned' 
  | 'investigating' 
  | 'action_taken' 
  | 'resolved' 
  | 'escalated' 
  | 'auto_escalated';

export type GrievanceCategory = 
  | 'payment_delay'
  | 'job_card_issue'
  | 'work_not_available'
  | 'wage_dispute'
  | 'work_quality'
  | 'corruption'
  | 'discrimination'
  | 'other';

export interface Grievance {
  id: string;
  ticketNo: string;
  category: GrievanceCategory;
  categoryLabel: string;
  status: GrievanceStatus;
  statusLabel: string;
  date: string;
  description: string;
  voiceRecordingUrl?: string;
  // 5-Day Promise tracking
  daysSinceRegistration: number;
  deadline: string;
  isOverdue: boolean;
  assignedOfficer?: string;
  officerPhone?: string;
  resolution?: string;
  resolutionDate?: string;
  satisfactionRating?: number;
  escalationLevel: number;
  timeline: GrievanceTimelineEvent[];
}

export interface GrievanceTimelineEvent {
  date: string;
  event: string;
  eventHindi: string;
  actor?: string;
  notes?: string;
}

// ============================================
// SCHEME TYPES
// ============================================

export interface Scheme {
  id: string;
  name: string;
  nameHindi: string;
  description: string;
  descriptionHindi: string;
  benefit: string;
  benefitType: 'employment' | 'housing' | 'healthcare' | 'pension' | 'education' | 'agriculture' | 'financial';
  eligibility: string[];
  matchScore: number;
  isApplied: boolean;
  applicationStatus?: 'not_applied' | 'pending' | 'approved' | 'rejected';
  documents: string[];
  lastDate?: string;
  helplineNumber?: string;
  applicantsFromVillage: number;
}

// ============================================
// SKILL DEVELOPMENT TYPES
// ============================================

export interface SkillCourse {
  id: string;
  title: string;
  titleHindi: string;
  category: 'construction' | 'agriculture' | 'digital' | 'finance' | 'healthcare' | 'manufacturing';
  level: 'beginner' | 'intermediate' | 'advanced';
  durationMinutes: number;
  modules: SkillModule[];
  totalVideos: number;
  earnPotential: string;
  earnPotentialMin: number;
  earnPotentialMax: number;
  linkedJobs: number;
  thumbnail: string;
  language: string;
  availableLanguages: string[];
  completionPercentage: number;
  earnedBadges: string[];
  nextBadge?: string;
  videosToNextBadge?: number;
}

export interface SkillModule {
  id: string;
  title: string;
  titleHindi: string;
  videos: SkillVideo[];
  badge: string;
  isCompleted: boolean;
}

export interface SkillVideo {
  id: string;
  title: string;
  titleHindi: string;
  durationSeconds: number;
  thumbnailUrl: string;
  videoUrl: string;
  isWatched: boolean;
  isDownloaded: boolean;
  keyPoints: string[];
}

// ============================================
// WELLBEING TYPES
// ============================================

export type MoodType = 'happy' | 'okay' | 'stressed' | 'worried' | 'sad' | 'angry';

export interface WellbeingCheckIn {
  date: string;
  mood: MoodType;
  notes?: string;
  followUpRequired: boolean;
}

export interface CounselorInfo {
  name: string;
  phone: string;
  language: string[];
  available: boolean;
  specialization: string;
}

export interface SuccessStory {
  id: string;
  userName: string;
  userVillage: string;
  story: string;
  storyHindi: string;
  category: 'payment' | 'job' | 'skill' | 'grievance';
  date: string;
  avatar: string;
}

// ============================================
// FAIRNESS ENGINE TYPES
// ============================================

export interface FairnessReport {
  userId: string;
  period: string;
  totalJobsAvailable: number;
  jobsAllocated: number;
  waitingPosition?: number;
  priorityScore: number;
  priorityFactors: PriorityFactor[];
  comparisonWithVillage: {
    averageDaysWorked: number;
    userDaysWorked: number;
    percentile: number;
  };
  transparencyDetails: string[];
}

export interface PriorityFactor {
  factor: string;
  factorHindi: string;
  score: number;
  maxScore: number;
  explanation: string;
  explanationHindi: string;
}

// ============================================
// VOICE ASSISTANT (SAHAYAK) TYPES
// ============================================

export interface SahayakCommand {
  intent: 'navigate' | 'query' | 'complaint' | 'apply' | 'help' | 'explain' | 'unknown';
  entity?: string;
  confidence: number;
  rawText: string;
}

export interface SathiAction {
  type: 'highlight' | 'navigate' | 'fill_form' | 'speak' | 'show_modal' | 'play_video' | 'call';
  payload: any;
}

export interface SathiResponse {
  spokenResponse: string;
  spokenResponseHindi: string;
  intent: string;
  emotion: 'neutral' | 'empathetic' | 'encouraging' | 'urgent' | 'celebratory';
  actions: SathiAction[];
  followUpQuestions?: string[];
}

// ============================================
// NOTIFICATION & ALERT TYPES
// ============================================

export interface Alert {
  id: string;
  type: 'payment' | 'work' | 'weather' | 'scheme' | 'grievance' | 'reminder';
  title: string;
  titleHindi: string;
  message: string;
  messageHindi: string;
  date: string;
  isRead: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

// ============================================
// FRAUD DETECTION TYPES
// ============================================

export interface FraudAlert {
  id: string;
  type: 'duplicate_payment' | 'ghost_worker' | 'work_mismatch' | 'unusual_pattern';
  description: string;
  severity: 'low' | 'medium' | 'high';
  reportedDate: string;
  status: 'investigating' | 'confirmed' | 'dismissed';
}

