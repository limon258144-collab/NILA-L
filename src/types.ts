export interface TradingAnalysis {
  prediction: "Up" | "Down" | "Neutral" | "NOT_A_CHART";
  priceCloseUpEntry: string;
  priceCloseDownEntry: string;
  confidence: number;
  supportLevels: string[];
  resistanceLevels: string[];
  patternsIdentified: string[];
  reasoning: string;
  reasoningBangla: string;
  recommendation: string;
  recommendationBangla: string;
  riskRewardRatio: string;
  suggestedStopLoss: string;
  suggestedTakeProfit: string;
}

export interface AnalysisHistoryItem {
  id: string;
  timestamp: number;
  imageFileName: string;
  imageDataUrl: string;
  analysis: TradingAnalysis;
}

export type UserAccountStatus = "active" | "inactive" | "disabled";
export type ProAccountStatus = "active" | "inactive" | "expired";
export type UserRole = "SUPER_ADMIN" | "ADMIN" | "USER";

// Explicit request states required by specification
export type PaymentStatus = 
  | "PENDING" 
  | "UNDER_REVIEW" 
  | "APPROVED" 
  | "REJECTED"
  // Legacy backward-compat:
  | "pending" 
  | "approved" 
  | "disabled" 
  | "rejected";

export interface UserAccount {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserAccountStatus;
  proStatus: ProAccountStatus;
  proExpiresAt?: number;
  createdAt: number;
  lastLogin: number;
  lastHeartbeat?: number;
  isOnline?: boolean;
  notes?: string;
  trialAttemptsToday?: number;
  trialRemainingToday?: number;
}

export interface PaymentRequestItem {
  id: string;
  userId?: string;
  username: string;
  userEmail?: string;
  userName?: string;
  paymentMethod: string;
  network?: string;
  amount: number;
  transactionId: string;
  senderNumber?: string;
  timestamp: number;
  status: PaymentStatus;
  reviewedAt?: number;
  reviewedBy?: string;
  approvedAt?: number;
  approvedBy?: string;
  disabledAt?: number;
  disabledBy?: string;
  notes?: string;
}

export interface ActivityLogItem {
  id: string;
  adminEmail: string;
  adminUid: string;
  action: string;
  targetUser: string;
  timestamp: number;
  details?: string;
}

export interface AdminRoleItem {
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "ADMIN";
  status: "active" | "disabled";
  createdAt: number;
  lastLogin: number;
}

export interface TrialStatus {
  isVip: boolean;
  trialStarted: boolean;
  trialStartDate: number | null;
  trialEndDate: number | null;
  currentDayIndex: number; // 1 to 5
  daysRemaining: number;   // 0 to 5
  isExpired: boolean;
  attemptsUsedToday: number;
  attemptsRemainingToday: number;
  maxDailyAttempts: number; // 5
  totalAttemptsUsed: number;
  canAttempt: boolean;
  message: string;
  dateStr: string;
}

export interface AdminDashboardStats {
  totalUsers: number;
  newRegistrationsToday: number;
  newRegistrations7Days: number;
  onlineUsers: number;
  offlineUsers: number;
  totalPendingPayments: number;
  approvedPayments: number;
  rejectedPayments: number;
  underReviewPayments: number;
  pendingVipRequests: number;
  activeVipSubscribers: number;
  expiredVipSubscriptions: number;
  totalSignalsToday: number;
  serverTime: number;
  timezone: string;
}
