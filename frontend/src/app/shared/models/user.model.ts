export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  biometricEnabled: boolean;
  biometricType?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserActivity {
  lastLogin?: string;
  lastLoginMethod?: string;
  failedAttempts?: number;
  offlineEnabled?: boolean;
  offlineLastSync?: string;
}

export interface UserStats {
  totalUsers: number;
  adminCount: number;
  regularUserCount: number;
  biometricEnabledCount: number;
}
