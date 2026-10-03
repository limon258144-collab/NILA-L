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
  imageDataUrl: string; // so the user can see their analyzed chart thumbnail
  analysis: TradingAnalysis;
}

export type UserAccountStatus = "active" | "inactive" | "disabled";
export type ProAccountStatus = "active" | "inactive";
export type UserRole = "SUPER_ADMIN" | "ADMIN" | "USER";
export type PaymentStatus = "pending" | "approved" | "disabled" | "rejected";

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
  notes?: string;
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
  approvedAt?: number;
  approvedBy?: string;
  disabledAt?: number;
  disabledBy?: string;
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
