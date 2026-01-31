/**
 * SAHAYOG Authentication Service
 * Handles admin and user authentication
 */

export interface AdminCredentials {
  username: string;
  password: string;
  role: 'super_admin' | 'block_admin' | 'district_admin' | 'state_admin';
  permissions: string[];
}

export interface UserSession {
  userId: string;
  name: string;
  role: 'user' | 'admin';
  isAuthenticated: boolean;
  loginTime: string;
  expiresAt: string;
  permissions: string[];
}

export interface AuthResult {
  success: boolean;
  session?: UserSession;
  error?: string;
}

// ============================================
// ADMIN CREDENTIALS (Demo)
// ============================================

/**
 * ADMIN LOGIN CREDENTIALS:
 * 
 * Super Admin:
 *   Username: admin
 *   Password: sahayog@2024
 * 
 * Block Admin:
 *   Username: block_admin
 *   Password: block@123
 * 
 * District Admin:
 *   Username: district_admin
 *   Password: district@123
 */

const ADMIN_ACCOUNTS: Record<string, AdminCredentials> = {
  'admin': {
    username: 'admin',
    password: 'sahayog@2024',
    role: 'super_admin',
    permissions: [
      'manage_users', 'manage_schemes', 'manage_jobs', 'manage_grievances',
      'view_analytics', 'export_data', 'manage_admins', 'system_settings',
      'fraud_detection', 'bias_analysis', 'ml_training'
    ]
  },
  'block_admin': {
    username: 'block_admin',
    password: 'block@123',
    role: 'block_admin',
    permissions: [
      'manage_users', 'manage_jobs', 'manage_grievances', 'view_analytics'
    ]
  },
  'district_admin': {
    username: 'district_admin',
    password: 'district@123',
    role: 'district_admin',
    permissions: [
      'manage_users', 'manage_schemes', 'manage_jobs', 'manage_grievances',
      'view_analytics', 'export_data'
    ]
  }
};

// Session storage key
const SESSION_KEY = 'sahayog_session';
const ADMIN_SESSION_KEY = 'sahayog_admin_session';

class AuthService {
  private currentSession: UserSession | null = null;
  private adminSession: UserSession | null = null;

  constructor() {
    // Restore sessions from localStorage
    this.restoreSessions();
  }

  private restoreSessions(): void {
    try {
      const userSession = localStorage.getItem(SESSION_KEY);
      if (userSession) {
        const session = JSON.parse(userSession) as UserSession;
        if (new Date(session.expiresAt) > new Date()) {
          this.currentSession = session;
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      }

      const adminSession = localStorage.getItem(ADMIN_SESSION_KEY);
      if (adminSession) {
        const session = JSON.parse(adminSession) as UserSession;
        if (new Date(session.expiresAt) > new Date()) {
          this.adminSession = session;
        } else {
          localStorage.removeItem(ADMIN_SESSION_KEY);
        }
      }
    } catch (error) {
      console.error('[AuthService] Failed to restore sessions:', error);
    }
  }

  /**
   * Admin login
   */
  loginAdmin(username: string, password: string): AuthResult {
    const admin = ADMIN_ACCOUNTS[username.toLowerCase()];
    
    if (!admin) {
      return { success: false, error: 'Invalid username' };
    }

    if (admin.password !== password) {
      return { success: false, error: 'Invalid password' };
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const session: UserSession = {
      userId: `admin_${username}`,
      name: username === 'admin' ? 'Super Administrator' : `${admin.role.replace('_', ' ')}`,
      role: 'admin',
      isAuthenticated: true,
      loginTime: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      permissions: admin.permissions
    };

    this.adminSession = session;
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));

    console.log('[AuthService] ✅ Admin logged in:', username);
    return { success: true, session };
  }

  /**
   * User login (for enrolled users like Ramesh Singh)
   */
  loginUser(userId: string, name: string): AuthResult {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session: UserSession = {
      userId,
      name,
      role: 'user',
      isAuthenticated: true,
      loginTime: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      permissions: ['view_jobs', 'apply_jobs', 'file_grievance', 'view_schemes', 'enroll_schemes']
    };

    this.currentSession = session;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    console.log('[AuthService] ✅ User logged in:', name);
    return { success: true, session };
  }

  /**
   * Logout admin
   */
  logoutAdmin(): void {
    this.adminSession = null;
    localStorage.removeItem(ADMIN_SESSION_KEY);
    console.log('[AuthService] Admin logged out');
  }

  /**
   * Logout user
   */
  logoutUser(): void {
    this.currentSession = null;
    localStorage.removeItem(SESSION_KEY);
    console.log('[AuthService] User logged out');
  }

  /**
   * Get current admin session
   */
  getAdminSession(): UserSession | null {
    if (this.adminSession && new Date(this.adminSession.expiresAt) > new Date()) {
      return this.adminSession;
    }
    this.logoutAdmin();
    return null;
  }

  /**
   * Get current user session
   */
  getUserSession(): UserSession | null {
    if (this.currentSession && new Date(this.currentSession.expiresAt) > new Date()) {
      return this.currentSession;
    }
    this.logoutUser();
    return null;
  }

  /**
   * Check if admin is logged in
   */
  isAdminLoggedIn(): boolean {
    return this.getAdminSession() !== null;
  }

  /**
   * Check if user is logged in
   */
  isUserLoggedIn(): boolean {
    return this.getUserSession() !== null;
  }

  /**
   * Check admin permission
   */
  hasPermission(permission: string): boolean {
    const session = this.getAdminSession();
    if (!session) return false;
    return session.permissions.includes(permission);
  }

  /**
   * General logout (admin)
   */
  logout(): void {
    this.logoutAdmin();
  }

  /**
   * Get all admin credentials for display (demo only)
   */
  getAdminCredentials(): { username: string; password: string; role: string }[] {
    return Object.values(ADMIN_ACCOUNTS).map(acc => ({
      username: acc.username,
      password: acc.password,
      role: acc.role
    }));
  }
}

// Type alias for AdminSession (same as UserSession for admin role)
export type AdminSession = UserSession;

export const authService = new AuthService();
export default authService;
