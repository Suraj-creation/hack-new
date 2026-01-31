
import { Grievance, GrievanceCategory, GrievanceStatus, GrievanceTimelineEvent } from '../types';

// 5-Day Promise Grievance System from unified.md Module 5
export class GrievanceService {
  private grievances: Grievance[] = [];

  // Category labels for display
  private categoryLabels: Record<GrievanceCategory, { en: string; hi: string }> = {
    payment_delay: { en: 'Payment Delay', hi: 'भुगतान में देरी' },
    job_card_issue: { en: 'Job Card Issue', hi: 'जॉब कार्ड समस्या' },
    work_not_available: { en: 'Work Not Available', hi: 'काम उपलब्ध नहीं' },
    wage_dispute: { en: 'Wage Dispute', hi: 'मजदूरी विवाद' },
    work_quality: { en: 'Work Quality Issue', hi: 'काम की गुणवत्ता' },
    corruption: { en: 'Corruption Report', hi: 'भ्रष्टाचार रिपोर्ट' },
    discrimination: { en: 'Discrimination', hi: 'भेदभाव' },
    other: { en: 'Other', hi: 'अन्य' }
  };

  private statusLabels: Record<GrievanceStatus, { en: string; hi: string }> = {
    registered: { en: 'Registered', hi: 'दर्ज' },
    assigned: { en: 'Assigned', hi: 'सौंपा गया' },
    investigating: { en: 'Investigating', hi: 'जांच जारी' },
    action_taken: { en: 'Action Taken', hi: 'कार्रवाई की गई' },
    resolved: { en: 'Resolved', hi: 'हल किया गया' },
    escalated: { en: 'Escalated', hi: 'ऊपर भेजा गया' },
    auto_escalated: { en: 'Auto-Escalated (5-Day)', hi: 'स्वतः ऊपर भेजा (5 दिन)' }
  };

  // Generate unique ticket number
  private generateTicketNo(): string {
    const prefix = 'SAH';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  // Register new grievance (voice or written)
  async registerGrievance(
    category: GrievanceCategory,
    description: string,
    voiceRecordingUrl?: string
  ): Promise<Grievance> {
    const now = new Date();
    const deadline = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days

    const grievance: Grievance = {
      id: `grv-${Date.now()}`,
      ticketNo: this.generateTicketNo(),
      category,
      categoryLabel: this.categoryLabels[category].hi,
      status: 'registered',
      statusLabel: this.statusLabels['registered'].hi,
      date: now.toISOString(),
      description,
      voiceRecordingUrl,
      daysSinceRegistration: 0,
      deadline: deadline.toISOString(),
      isOverdue: false,
      escalationLevel: 0,
      timeline: [
        {
          date: now.toISOString(),
          event: 'Grievance registered successfully',
          eventHindi: 'शिकायत सफलतापूर्वक दर्ज हुई',
          notes: `Ticket: ${this.generateTicketNo()}`
        }
      ]
    };

    this.grievances.push(grievance);
    
    // Simulate SMS notification
    console.log(`SMS sent: आपकी शिकायत ${grievance.ticketNo} दर्ज हो गई। 5 दिनों में जवाब मिलेगा।`);
    
    return grievance;
  }

  // Update grievance status
  updateStatus(grievanceId: string, newStatus: GrievanceStatus, notes?: string): Grievance | null {
    const grievance = this.grievances.find(g => g.id === grievanceId);
    if (!grievance) return null;

    grievance.status = newStatus;
    grievance.statusLabel = this.statusLabels[newStatus].hi;
    grievance.timeline.push({
      date: new Date().toISOString(),
      event: `Status updated to: ${this.statusLabels[newStatus].en}`,
      eventHindi: `स्थिति बदली: ${this.statusLabels[newStatus].hi}`,
      notes
    });

    return grievance;
  }

  // Check and auto-escalate overdue grievances (5-Day Promise)
  checkAndEscalate(): Grievance[] {
    const now = new Date();
    const escalated: Grievance[] = [];

    this.grievances.forEach(g => {
      if (g.status !== 'resolved' && !g.isOverdue) {
        const deadlineDate = new Date(g.deadline);
        const daysElapsed = Math.floor((now.getTime() - new Date(g.date).getTime()) / (24 * 60 * 60 * 1000));
        
        g.daysSinceRegistration = daysElapsed;

        if (now > deadlineDate) {
          g.isOverdue = true;
          g.status = 'auto_escalated';
          g.statusLabel = this.statusLabels['auto_escalated'].hi;
          g.escalationLevel = 2; // District Collector level
          g.timeline.push({
            date: now.toISOString(),
            event: '5-Day deadline exceeded. Auto-escalated to District Collector.',
            eventHindi: '5 दिन की सीमा पार। जिला कलेक्टर को स्वतः भेजा गया।',
            actor: 'System'
          });
          escalated.push(g);
          
          // Simulate escalation notification
          console.log(`ALERT: Grievance ${g.ticketNo} auto-escalated to District Collector`);
        }
      }
    });

    return escalated;
  }

  // Get all grievances for user
  getUserGrievances(): Grievance[] {
    return this.grievances.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  // Get all grievances (for admin panel)
  getAllGrievances(): Grievance[] {
    return this.grievances.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  // Get grievance by ticket number
  getByTicketNo(ticketNo: string): Grievance | undefined {
    return this.grievances.find(g => g.ticketNo === ticketNo);
  }

  // Get grievance by ID
  getById(id: string): Grievance | undefined {
    return this.grievances.find(g => g.id === id);
  }

  // Get grievance statistics
  getStats() {
    const total = this.grievances.length;
    const pending = this.grievances.filter(g => 
      !['resolved'].includes(g.status)
    ).length;
    const resolved = this.grievances.filter(g => g.status === 'resolved').length;
    const overdue = this.grievances.filter(g => g.isOverdue).length;
    const avgResolutionDays = resolved > 0 
      ? this.grievances
          .filter(g => g.status === 'resolved' && g.resolutionDate)
          .reduce((sum, g) => {
            const days = Math.floor(
              (new Date(g.resolutionDate!).getTime() - new Date(g.date).getTime()) / (24 * 60 * 60 * 1000)
            );
            return sum + days;
          }, 0) / resolved
      : 0;

    return { total, pending, resolved, overdue, avgResolutionDays };
  }

  // Load mock data
  loadMockData() {
    const mockGrievances: Grievance[] = [
      {
        id: 'grv-1',
        ticketNo: 'SAH-9210-ABCD',
        category: 'payment_delay',
        categoryLabel: 'भुगतान में देरी',
        status: 'assigned',
        statusLabel: 'सौंपा गया',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'पिछले 20 दिनों से मेरा पैसा नहीं आया है।',
        daysSinceRegistration: 2,
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        isOverdue: false,
        assignedOfficer: 'श्री विजय कुमार',
        officerPhone: '+91 9876543213',
        escalationLevel: 1,
        timeline: [
          {
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            event: 'Grievance registered',
            eventHindi: 'शिकायत दर्ज',
          },
          {
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            event: 'Assigned to Block Officer',
            eventHindi: 'ब्लॉक अधिकारी को सौंपा गया',
            actor: 'श्री विजय कुमार'
          }
        ]
      },
      {
        id: 'grv-2',
        ticketNo: 'SAH-8105-EFGH',
        category: 'work_not_available',
        categoryLabel: 'काम उपलब्ध नहीं',
        status: 'resolved',
        statusLabel: 'हल किया गया',
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'गाँव में कोई काम नहीं मिल रहा है।',
        daysSinceRegistration: 10,
        deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        isOverdue: false,
        resolution: 'नया काम आवंटित किया गया - तालाब खुदाई',
        resolutionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        satisfactionRating: 5,
        escalationLevel: 0,
        timeline: [
          {
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            event: 'Grievance registered',
            eventHindi: 'शिकायत दर्ज',
          },
          {
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            event: 'Resolved - New work allocated',
            eventHindi: 'हल - नया काम आवंटित',
          }
        ]
      }
    ];

    this.grievances = mockGrievances;
  }
}

export const grievanceService = new GrievanceService();
