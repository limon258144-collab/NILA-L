import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config({ override: true });

const app = express();
const PORT = 3000;

const DB_PATH = path.join(process.cwd(), "db_state.json");

interface DbState {
  registeredUsers: Record<string, string>;
  activeSessions: Record<string, number>;
  activeHeartbeats?: Record<string, { lastHeartbeat: number; sessionId?: string; ip?: string }>;
  proUsers: Array<{ username: string; expiresAt: number; verifiedAt: number }>;
  submittedPayments: Array<{
    id: string;
    userId?: string;
    username: string;
    userEmail?: string;
    userName?: string;
    paymentMethod?: string;
    senderNumber?: string;
    transactionId: string;
    amount: number;
    network?: string;
    status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "pending" | "approved" | "rejected" | "disabled";
    timestamp: number;
    reviewedAt?: number;
    reviewedBy?: string;
    approvedAt?: number;
    approvedBy?: string;
    disabledAt?: number;
    disabledBy?: string;
    notes?: string;
  }>;
  supportChats: Record<string, any>;
  analysisLimits: Record<string, any>;
  configs: Record<string, string>;
  deletedPayments?: string[];
  deletedUsers?: string[];
  disabledUsers?: string[];
  registrationTimes?: Record<string, number>;
  userAccounts?: Record<string, {
    uid: string;
    email: string;
    name: string;
    role: "SUPER_ADMIN" | "ADMIN" | "USER";
    status: "active" | "inactive" | "disabled";
    proStatus: "active" | "inactive" | "expired";
    proExpiresAt?: number;
    createdAt: number;
    lastLogin: number;
    lastHeartbeat?: number;
    notes?: string;
  }>;
  adminRoles?: Record<string, {
    email: string;
    name: string;
    role: "SUPER_ADMIN" | "ADMIN";
    status: "active" | "disabled";
    createdAt: number;
    lastLogin: number;
  }>;
  activityLogs?: Array<{
    id: string;
    adminEmail: string;
    adminUid: string;
    action: string;
    targetUser: string;
    timestamp: number;
    details?: string;
  }>;
  trialRecords?: Record<string, {
    trialStartDate: number;
    trialEndDate: number;
    dailyAttempts: Record<string, number>;
    totalAttempts: number;
    history?: Array<{ timestamp: number; dateStr: string; idempotencyKey?: string }>;
  }>;
  signalAttemptsToday?: Record<string, number>;
}

// Business timezone: Asia/Dhaka (+06:00)
const BUSINESS_TIMEZONE = "Asia/Dhaka";
const PRESENCE_WINDOW_MS = 60000; // 60 seconds
const MAX_TRIAL_DAILY_ATTEMPTS = 5;
const TRIAL_DURATION_DAYS = 5;

function getDhakaDateStr(dateOrTs: Date | number = new Date()): string {
  const d = typeof dateOrTs === "number" ? new Date(dateOrTs) : dateOrTs;
  return new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIMEZONE }).format(d);
}

function getDhakaDayStart(dateOrTs: Date | number = new Date()): number {
  const dateStr = getDhakaDateStr(dateOrTs);
  return new Date(`${dateStr}T00:00:00+06:00`).getTime();
}

function getDhakaDayEnd(dateOrTs: Date | number = new Date()): number {
  const dateStr = getDhakaDateStr(dateOrTs);
  return new Date(`${dateStr}T23:59:59.999+06:00`).getTime();
}

// In-memory Promise lock queue for concurrency-safe database mutations
let dbLock = Promise.resolve();
function runWithDbLock<T>(fn: () => Promise<T> | T): Promise<T> {
  const next = dbLock.then(() => fn());
  dbLock = next.then(() => {}, () => {});
  return next;
}

// Generate consistent deterministic UID for each user email
function generateUid(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash << 5) - hash + email.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
  return `UID-FB-${hex}`;
}

function ensureUserAccounts(db: DbState) {
  if (!db.userAccounts) db.userAccounts = {};
  if (!db.disabledUsers) db.disabledUsers = [];
  if (!db.activityLogs) db.activityLogs = [];
  
  // Clean up legacy admin roles and credentials
  if (db.adminRoles) {
    delete db.adminRoles["limon258144@gmail.com"];
    delete db.adminRoles["admin@gmail.com"];
    delete db.adminRoles["admin"];
  }

  if (db.registeredUsers) {
    db.registeredUsers["limon2581444@gmail.com"] = "limonAbc123";
    delete db.registeredUsers["limon258144@gmail.com"];
    delete db.registeredUsers["admin"];
  }

  if (db.userAccounts) {
    delete db.userAccounts["limon258144@gmail.com"];
    delete db.userAccounts["admin"];
  }

  if (!db.adminRoles) {
    db.adminRoles = {};
  }
  
  // Ensure the single authorized Master Super Admin role
  db.adminRoles["limon2581444@gmail.com"] = {
    email: "limon2581444@gmail.com",
    name: "Limon Ahmed (Super Admin)",
    role: "SUPER_ADMIN",
    status: "active",
    createdAt: 1783360000000,
    lastLogin: Date.now(),
  };

  const allEmails = new Set<string>([
    ...Object.keys(db.registeredUsers || {}),
    ...Object.keys(db.registrationTimes || {}),
    ...Object.keys(db.activeSessions || {}),
    ...(db.proUsers || []).map(p => p.username),
    ...(db.submittedPayments || []).map(p => p.username),
  ]);

  for (const rawEmail of allEmails) {
    if (!rawEmail) continue;
    const email = rawEmail.toLowerCase();
    const existing = db.userAccounts[email];
    const uid = existing?.uid || generateUid(email);
    
    // Check if admin - strictly limon2581444@gmail.com (or explicitly assigned in adminRoles)
    const isSuper = email === "limon2581444@gmail.com" || email === "limon2581444@gmail" || db.adminRoles[email]?.role === "SUPER_ADMIN";
    const isAdmin = isSuper || db.adminRoles[email]?.role === "ADMIN";
    const role = isSuper ? "SUPER_ADMIN" : (isAdmin ? "ADMIN" : (existing?.role || "USER"));

    // Check status
    const isDisabled = db.disabledUsers.includes(email);
    const status = isDisabled ? "disabled" : (existing?.status || "active");

    // Check pro status
    const proEntry = (db.proUsers || []).find(p => p && p.username && p.username.toLowerCase() === email);
    const hasPro = !!proEntry && (!proEntry.expiresAt || proEntry.expiresAt > Date.now()) && !isDisabled;
    const isExpiredPro = !!proEntry && !!proEntry.expiresAt && proEntry.expiresAt <= Date.now();
    const proStatus = (isSuper || hasPro) ? "active" : (isExpiredPro ? "expired" : "inactive");
    const proExpiresAt = isSuper ? (Date.now() + 365 * 86400000) : proEntry?.expiresAt;

    const createdAt = db.registrationTimes?.[email] || existing?.createdAt || (Date.now() - 7 * 86400000);
    const lastLogin = db.activeSessions?.[email] || existing?.lastLogin || createdAt;
    const lastHeartbeat = db.activeHeartbeats?.[email]?.lastHeartbeat || existing?.lastHeartbeat;

    const baseName = email.includes("@") ? email.split("@")[0] : email;
    const name = existing?.name || (isSuper ? "Limon Ahmed (Super Admin)" : (baseName.charAt(0).toUpperCase() + baseName.slice(1)));

    db.userAccounts[email] = {
      uid,
      email,
      name,
      role,
      status,
      proStatus,
      proExpiresAt,
      createdAt,
      lastLogin,
      lastHeartbeat,
      notes: existing?.notes || (isSuper ? "Master Super Admin" : ""),
    };
  }
}

function readDb(): DbState {
  try {
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, "utf-8");
      const db = JSON.parse(content) as DbState;
      if (db) {
        if (!db.deletedPayments) db.deletedPayments = [];
        if (!db.deletedUsers) db.deletedUsers = [];
        if (!db.disabledUsers) db.disabledUsers = [];
        if (!db.registrationTimes) db.registrationTimes = {};
        if (!db.activityLogs) db.activityLogs = [];
        if (!db.activeHeartbeats) db.activeHeartbeats = {};
        if (!db.trialRecords) db.trialRecords = {};
        if (!db.signalAttemptsToday) db.signalAttemptsToday = {};
        if (Array.isArray(db.submittedPayments)) {
          db.submittedPayments = db.submittedPayments.filter((p: any) => {
            return p && p.id && p.id.length >= 8;
          });
        }
        ensureUserAccounts(db);
      }
      return db;
    }
  } catch (err) {
    console.error("Error reading db_state.json:", err);
  }
  const defaultDb: DbState = {
    registeredUsers: {
      "limon2581444@gmail.com": "limonAbc123"
    },
    activeSessions: {},
    activeHeartbeats: {},
    proUsers: [],
    submittedPayments: [],
    supportChats: {},
    analysisLimits: {},
    configs: {},
    deletedPayments: [],
    deletedUsers: [],
    disabledUsers: [],
    registrationTimes: {},
    userAccounts: {},
    adminRoles: {},
    activityLogs: [],
    trialRecords: {},
    signalAttemptsToday: {},
  };
  ensureUserAccounts(defaultDb);
  return defaultDb;
}

function writeDb(state: DbState) {
  try {
    ensureUserAccounts(state);
    const tmp = `${DB_PATH}.tmp.${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2), "utf-8");
    fs.renameSync(tmp, DB_PATH);
  } catch (err) {
    console.error("Error writing db_state.json:", err);
  }
}

// Presence evaluation helper
function isUserOnline(db: DbState, email: string): boolean {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  if ((db.disabledUsers || []).includes(lower)) return false;
  if (db.userAccounts?.[lower]?.status === "disabled") return false;

  // Check session revocation
  const revokedBefore = parseInt(db.configs?.["nila_sessions_revoked_before_v1"] || "0", 10);
  const userRevokedAt = parseInt(db.configs?.[`nila_user_revoked_${lower}`] || "0", 10);
  const isMaster = lower === "limon2581444@gmail.com" || lower === "limon2581444@gmail";

  const hb = db.activeHeartbeats?.[lower];
  if (!hb || !hb.lastHeartbeat) return false;

  if (!isMaster && revokedBefore > 0 && hb.lastHeartbeat <= revokedBefore) return false;
  if (!isMaster && userRevokedAt > 0 && hb.lastHeartbeat <= userRevokedAt) return false;

  return (Date.now() - hb.lastHeartbeat) <= PRESENCE_WINDOW_MS;
}

// Concurrency-safe Trial limit engine: 5 attempts per day for 5 days
function evaluateTrial(
  db: DbState,
  rawEmail: string,
  isConsuming: boolean = false,
  idempotencyKey?: string
) {
  const email = (rawEmail || "").toLowerCase().trim();
  const now = Date.now();
  const todayStr = getDhakaDateStr(now);

  if (!db.trialRecords) db.trialRecords = {};
  if (!db.signalAttemptsToday) db.signalAttemptsToday = {};

  // Check VIP entitlement
  const isSuper = email === "limon2581444@gmail.com" || email === "limon2581444@gmail" || db.adminRoles?.[email]?.role === "SUPER_ADMIN";
  const isAdmin = isSuper || db.adminRoles?.[email]?.role === "ADMIN";
  const proEntry = (db.proUsers || []).find(p => p && p.username && p.username.toLowerCase() === email);
  const isPro = !!proEntry && (!proEntry.expiresAt || proEntry.expiresAt > now) && !(db.disabledUsers || []).includes(email);
  const isVip = isSuper || isAdmin || isPro;

  if (isVip) {
    if (isConsuming) {
      db.signalAttemptsToday[todayStr] = (db.signalAttemptsToday[todayStr] || 0) + 1;
    }
    return {
      isVip: true,
      trialStarted: true,
      trialStartDate: 0,
      trialEndDate: now + 365 * 86400000,
      currentDayIndex: 1,
      daysRemaining: 365,
      isExpired: false,
      attemptsUsedToday: 0,
      attemptsRemainingToday: 9999,
      maxDailyAttempts: 9999,
      totalAttemptsUsed: 0,
      canAttempt: true,
      message: "VIP Member: Unlimited Access Granted",
      dateStr: todayStr,
    };
  }

  let record = db.trialRecords[email];

  // First eligible trial attempt starts the user's 5-day trial period
  if (!record || !record.trialStartDate) {
    const start = getDhakaDayStart(now);
    const end = start + (TRIAL_DURATION_DAYS * 86400000) - 1; // End of 5th calendar day in Dhaka timezone

    if (isConsuming) {
      record = {
        trialStartDate: start,
        trialEndDate: end,
        dailyAttempts: { [todayStr]: 1 },
        totalAttempts: 1,
        history: [{ timestamp: now, dateStr: todayStr, idempotencyKey }],
      };
      db.trialRecords[email] = record;
      db.signalAttemptsToday[todayStr] = (db.signalAttemptsToday[todayStr] || 0) + 1;

      return {
        isVip: false,
        trialStarted: true,
        trialStartDate: start,
        trialEndDate: end,
        currentDayIndex: 1,
        daysRemaining: 5,
        isExpired: false,
        attemptsUsedToday: 1,
        attemptsRemainingToday: 4,
        maxDailyAttempts: MAX_TRIAL_DAILY_ATTEMPTS,
        totalAttemptsUsed: 1,
        canAttempt: true,
        message: "Trial Day 1 started: Attempt 1 of 5 used.",
        dateStr: todayStr,
      };
    }

    return {
      isVip: false,
      trialStarted: false,
      trialStartDate: null,
      trialEndDate: null,
      currentDayIndex: 1,
      daysRemaining: 5,
      isExpired: false,
      attemptsUsedToday: 0,
      attemptsRemainingToday: MAX_TRIAL_DAILY_ATTEMPTS,
      maxDailyAttempts: MAX_TRIAL_DAILY_ATTEMPTS,
      totalAttemptsUsed: 0,
      canAttempt: true,
      message: "Trial available: 5 attempts per day for 5 consecutive calendar days.",
      dateStr: todayStr,
    };
  }

  // Check if overall 5-day trial period has expired
  const isExpired = now > record.trialEndDate;
  const dayDiff = Math.max(1, Math.min(5, Math.floor((now - record.trialStartDate) / 86400000) + 1));
  const daysRemaining = isExpired ? 0 : Math.max(0, 5 - dayDiff + 1);

  if (isExpired) {
    return {
      isVip: false,
      trialStarted: true,
      trialStartDate: record.trialStartDate,
      trialEndDate: record.trialEndDate,
      currentDayIndex: 5,
      daysRemaining: 0,
      isExpired: true,
      attemptsUsedToday: record.dailyAttempts[todayStr] || 0,
      attemptsRemainingToday: 0,
      maxDailyAttempts: MAX_TRIAL_DAILY_ATTEMPTS,
      totalAttemptsUsed: record.totalAttempts || 0,
      canAttempt: false,
      message: "Your 5-day trial period has expired. Please activate VIP membership to continue receiving signals.",
      dateStr: todayStr,
    };
  }

  // Idempotency check: prevent duplicate counting if client retries same request
  if (isConsuming && idempotencyKey && record.history) {
    const existingAttempt = record.history.find(h => h.idempotencyKey === idempotencyKey && (now - h.timestamp) < 45000);
    if (existingAttempt) {
      const used = record.dailyAttempts[todayStr] || 0;
      return {
        isVip: false,
        trialStarted: true,
        trialStartDate: record.trialStartDate,
        trialEndDate: record.trialEndDate,
        currentDayIndex: dayDiff,
        daysRemaining,
        isExpired: false,
        attemptsUsedToday: used,
        attemptsRemainingToday: Math.max(0, MAX_TRIAL_DAILY_ATTEMPTS - used),
        maxDailyAttempts: MAX_TRIAL_DAILY_ATTEMPTS,
        totalAttemptsUsed: record.totalAttempts || 0,
        canAttempt: true,
        message: "Idempotent attempt replayed without duplicate counting.",
        dateStr: todayStr,
      };
    }
  }

  const usedToday = record.dailyAttempts[todayStr] || 0;

  // Enforce maximum 5 attempts per calendar day
  if (usedToday >= MAX_TRIAL_DAILY_ATTEMPTS) {
    return {
      isVip: false,
      trialStarted: true,
      trialStartDate: record.trialStartDate,
      trialEndDate: record.trialEndDate,
      currentDayIndex: dayDiff,
      daysRemaining,
      isExpired: false,
      attemptsUsedToday: usedToday,
      attemptsRemainingToday: 0,
      maxDailyAttempts: MAX_TRIAL_DAILY_ATTEMPTS,
      totalAttemptsUsed: record.totalAttempts || 0,
      canAttempt: false,
      message: "Daily trial limit of 5 attempts reached. Please come back tomorrow for your next trial day.",
      dateStr: todayStr,
    };
  }

  if (isConsuming) {
    record.dailyAttempts[todayStr] = usedToday + 1;
    record.totalAttempts = (record.totalAttempts || 0) + 1;
    if (!record.history) record.history = [];
    record.history.push({ timestamp: now, dateStr: todayStr, idempotencyKey });
    db.signalAttemptsToday[todayStr] = (db.signalAttemptsToday[todayStr] || 0) + 1;

    return {
      isVip: false,
      trialStarted: true,
      trialStartDate: record.trialStartDate,
      trialEndDate: record.trialEndDate,
      currentDayIndex: dayDiff,
      daysRemaining,
      isExpired: false,
      attemptsUsedToday: usedToday + 1,
      attemptsRemainingToday: Math.max(0, MAX_TRIAL_DAILY_ATTEMPTS - (usedToday + 1)),
      maxDailyAttempts: MAX_TRIAL_DAILY_ATTEMPTS,
      totalAttemptsUsed: record.totalAttempts,
      canAttempt: true,
      message: `Trial attempt recorded (${usedToday + 1}/5 used today, Day ${dayDiff}/5).`,
      dateStr: todayStr,
    };
  }

  return {
    isVip: false,
    trialStarted: true,
    trialStartDate: record.trialStartDate,
    trialEndDate: record.trialEndDate,
    currentDayIndex: dayDiff,
    daysRemaining,
    isExpired: false,
    attemptsUsedToday: usedToday,
    attemptsRemainingToday: Math.max(0, MAX_TRIAL_DAILY_ATTEMPTS - usedToday),
    maxDailyAttempts: MAX_TRIAL_DAILY_ATTEMPTS,
    totalAttemptsUsed: record.totalAttempts || 0,
    canAttempt: true,
    message: `${Math.max(0, MAX_TRIAL_DAILY_ATTEMPTS - usedToday)} trial attempts remaining today (Day ${dayDiff} of 5).`,
    dateStr: todayStr,
  };
}

// Set up JSON parsing with a higher limit for high-res images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy initializer for Google GenAI client to prevent crashing on startup when key is missing
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is missing. Please set your GEMINI_API_KEY in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API Health check endpoint
app.get("/api/health", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({ status: "ok", geminiKeyConfigured: hasKey });
});

// Real-Time Database Sync Endpoint
app.post("/api/db/sync", (req, res) => {
  try {
    const payload = req.body || {};
    const db = readDb();

    // 0. Merge and keep deletion lists
    const incomingDeletedPayments = payload.deletedPayments && Array.isArray(payload.deletedPayments) ? payload.deletedPayments : [];
    const incomingDeletedUsers = payload.deletedUsers && Array.isArray(payload.deletedUsers) ? payload.deletedUsers : [];

    const existingDeletedPayments = db.deletedPayments || [];
    const existingDeletedUsers = db.deletedUsers || [];

    const mergedDeletedPayments = Array.from(new Set([...existingDeletedPayments, ...incomingDeletedPayments]));
    const mergedDeletedUsers = Array.from(new Set([...existingDeletedUsers, ...incomingDeletedUsers]));

    db.deletedPayments = mergedDeletedPayments;
    db.deletedUsers = mergedDeletedUsers;

    // 1. Merge registeredUsers
    if (payload.registeredUsers) {
      db.registeredUsers = { ...db.registeredUsers, ...payload.registeredUsers };
      // Remove newly registered users from deletedUsers
      for (const un of Object.keys(payload.registeredUsers)) {
        db.deletedUsers = (db.deletedUsers || []).filter(u => u.toLowerCase() !== un.toLowerCase());
      }
    }
    const activeDeletedUsers = (db.deletedUsers || []);
    for (const un of activeDeletedUsers) {
      delete db.registeredUsers[un];
    }

    // 2. Merge activeSessions (strictly respecting revocation timestamp so logged-out sessions cannot resurrect)
    const revokedBefore = parseInt(db.configs?.["nila_sessions_revoked_before_v1"] || "0", 10);
    if (payload.activeSessions) {
      for (const [username, timestamp] of Object.entries(payload.activeSessions)) {
        const lower = username.toLowerCase();
        const isMaster = lower === "limon2581444@gmail.com" || lower === "limon2581444@gmail";
        const userRevokedAt = parseInt(db.configs?.[`nila_user_revoked_${lower}`] || "0", 10);
        
        if (!isMaster && revokedBefore > 0 && (timestamp as number) <= revokedBefore) {
          continue;
        }
        if (!isMaster && userRevokedAt > 0 && (timestamp as number) <= userRevokedAt) {
          continue;
        }

        const existing = db.activeSessions[username];
        if (existing === undefined || (timestamp as number) > existing) {
          db.activeSessions[username] = timestamp as number;
        }
      }
    }
    for (const un of mergedDeletedUsers) {
      delete db.activeSessions[un];
    }
    if (revokedBefore > 0 && db.activeSessions) {
      for (const [username, ts] of Object.entries(db.activeSessions)) {
        const lower = username.toLowerCase();
        const isMaster = lower === "limon2581444@gmail.com" || lower === "limon2581444@gmail";
        if (!isMaster && (ts as number) <= revokedBefore) {
          delete db.activeSessions[username];
        }
      }
    }

    // 3. Merge proUsers
    if (payload.proUsers && Array.isArray(payload.proUsers)) {
      const proMap = new Map<string, any>();
      for (const p of db.proUsers || []) {
        if (p && p.username) {
          proMap.set(p.username.toLowerCase(), p);
        }
      }
      for (const p of payload.proUsers) {
        if (p && p.username) {
          const key = p.username.toLowerCase();
          const existing = proMap.get(key);
          if (!existing || p.expiresAt > existing.expiresAt || p.verifiedAt > existing.verifiedAt) {
            proMap.set(key, p);
          }
        }
      }
      for (const un of mergedDeletedUsers) {
        proMap.delete(un.toLowerCase());
      }
      db.proUsers = Array.from(proMap.values());
    }

    // 4. Merge submittedPayments
    if (payload.submittedPayments && Array.isArray(payload.submittedPayments)) {
      const paymentMap = new Map<string, any>();
      for (const p of db.submittedPayments || []) {
        if (p && p.id) {
          paymentMap.set(p.id, p);
        }
      }
      for (const p of payload.submittedPayments) {
        if (p && p.id) {
          const existing = paymentMap.get(p.id);
          if (!existing) {
            paymentMap.set(p.id, p);
          } else {
            if (existing.status === "pending" && p.status !== "pending") {
              paymentMap.set(p.id, p);
            } else if (p.status === "pending" && existing.status !== "pending") {
              // keep existing
            } else {
              if (p.timestamp > existing.timestamp) {
                paymentMap.set(p.id, p);
              }
            }
          }
        }
      }
      for (const pId of mergedDeletedPayments) {
        paymentMap.delete(pId);
      }
      db.submittedPayments = Array.from(paymentMap.values()).filter((p: any) => {
        return p && p.id && p.id.length >= 8 && !activeDeletedUsers.includes(p.username);
      });
    }

    // 5. Merge supportChats
    if (payload.supportChats) {
      for (const [user, chat] of Object.entries(payload.supportChats)) {
        const existingChat = db.supportChats[user] || { messages: [], unreadCountByUser: 0, unreadCountByAdmin: 0, lastUpdated: 0 };
        const clientChat = chat as any;

        const msgMap = new Map<string, any>();
        for (const m of existingChat.messages || []) {
          if (m && m.id) msgMap.set(m.id, m);
        }
        for (const m of clientChat.messages || []) {
          if (m && m.id) msgMap.set(m.id, m);
        }

        const mergedMessages = Array.from(msgMap.values()).sort((a, b) => a.timestamp - b.timestamp);
        const lastUpdated = Math.max(existingChat.lastUpdated || 0, clientChat.lastUpdated || 0);
        const unreadCountByUser = clientChat.lastUpdated > (existingChat.lastUpdated || 0)
          ? clientChat.unreadCountByUser
          : existingChat.unreadCountByUser;
        const unreadCountByAdmin = clientChat.lastUpdated > (existingChat.lastUpdated || 0)
          ? clientChat.unreadCountByAdmin
          : existingChat.unreadCountByAdmin;

        db.supportChats[user] = {
          messages: mergedMessages,
          unreadCountByUser,
          unreadCountByAdmin,
          lastUpdated,
        };
      }
    }

    // 6. Merge analysisLimits
    if (payload.analysisLimits) {
      db.analysisLimits = { ...db.analysisLimits, ...payload.analysisLimits };
    }

    // 7. Merge configs
    if (payload.configs) {
      db.configs = { ...db.configs, ...payload.configs };
    }

    // 8. Merge registrationTimes
    if (payload.registrationTimes) {
      db.registrationTimes = { ...db.registrationTimes, ...payload.registrationTimes };
    }

    // 9. Merge disabledUsers
    if (payload.disabledUsers && Array.isArray(payload.disabledUsers)) {
      const mergedDisabled = Array.from(new Set([...(db.disabledUsers || []), ...payload.disabledUsers]));
      db.disabledUsers = mergedDisabled;
    }

    // 10. Merge adminRoles
    if (payload.adminRoles && typeof payload.adminRoles === "object") {
      db.adminRoles = { ...(db.adminRoles || {}), ...payload.adminRoles };
    }

    // 11. Merge activityLogs
    if (payload.activityLogs && Array.isArray(payload.activityLogs)) {
      const logMap = new Map<string, any>();
      for (const log of db.activityLogs || []) {
        if (log && log.id) logMap.set(log.id, log);
      }
      for (const log of payload.activityLogs) {
        if (log && log.id) logMap.set(log.id, log);
      }
      db.activityLogs = Array.from(logMap.values())
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, 100); // keep last 100 audit logs
    }

    // 12. Merge userAccounts
    if (payload.userAccounts && typeof payload.userAccounts === "object") {
      db.userAccounts = { ...(db.userAccounts || {}), ...payload.userAccounts };
    }

    ensureUserAccounts(db);
    writeDb(db);

    // Sanitize state before sending to client: Never expose plaintext passwords
    const safeRegisteredUsers: Record<string, string> = {};
    for (const [key] of Object.entries(db.registeredUsers || {})) {
      safeRegisteredUsers[key] = "PROTECTED";
    }

    const safeState = {
      ...db,
      registeredUsers: safeRegisteredUsers,
    };

    res.json({ status: "ok", state: safeState });
  } catch (err: any) {
    console.error("[Sync API Error]:", err);
    res.status(500).json({ error: err.message });
  }
});

// Helper to check admin authorization
function checkAdminAuth(db: DbState, adminEmail: string | undefined): { isAuthorized: boolean; isSuper: boolean; account?: any } {
  if (!adminEmail) return { isAuthorized: false, isSuper: false };
  const lower = adminEmail.toLowerCase().trim();
  const callerAccount = db.userAccounts?.[lower] || db.adminRoles?.[lower];
  const isSuper = lower === "limon2581444@gmail.com" || lower === "limon2581444@gmail" || callerAccount?.role === "SUPER_ADMIN" || db.adminRoles?.[lower]?.role === "SUPER_ADMIN";
  const isAdmin = isSuper || callerAccount?.role === "ADMIN" || db.adminRoles?.[lower]?.role === "ADMIN";
  return { isAuthorized: isAdmin, isSuper, account: callerAccount };
}

// 1. User Registration Endpoint
app.post("/api/auth/register", async (req, res): Promise<any> => {
  return runWithDbLock(async () => {
    try {
      const { email, password, name } = req.body || {};
      const cleanEmail = (email || "").toLowerCase().trim();
      const cleanPass = (password || "").trim();
      const cleanName = (name || "").trim() || (cleanEmail.split("@")[0] || "User");

      if (!cleanEmail || !cleanPass) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      if (!cleanEmail.includes("@gmail.com")) {
        return res.status(400).json({ error: "Only @gmail.com email addresses are allowed" });
      }

      if (cleanPass.length < 4) {
        return res.status(400).json({ error: "Password must be at least 4 characters" });
      }

      const db = readDb();

      // Check duplicate registration
      if (db.registeredUsers && db.registeredUsers[cleanEmail]) {
        return res.status(400).json({ error: "This Gmail is already registered. Please log in." });
      }

      const uid = generateUid(cleanEmail);
      const now = Date.now();

      // Save credentials & user account
      db.registeredUsers[cleanEmail] = cleanPass;
      if (!db.registrationTimes) db.registrationTimes = {};
      db.registrationTimes[cleanEmail] = now;

      // Remove from deleted users if previously deleted
      if (db.deletedUsers) {
        db.deletedUsers = db.deletedUsers.filter(u => u.toLowerCase() !== cleanEmail);
      }

      // Initialize user account
      if (!db.userAccounts) db.userAccounts = {};
      db.userAccounts[cleanEmail] = {
        uid,
        email: cleanEmail,
        name: cleanName,
        role: (cleanEmail === "limon2581444@gmail.com" || cleanEmail === "limon2581444@gmail") ? "SUPER_ADMIN" : "USER",
        status: "active",
        proStatus: "inactive",
        createdAt: now,
        lastLogin: now,
        lastHeartbeat: now,
        notes: "",
      };

      // Set initial heartbeat
      if (!db.activeHeartbeats) db.activeHeartbeats = {};
      db.activeHeartbeats[cleanEmail] = { lastHeartbeat: now, sessionId: `reg_${now}` };

      // Initialize active session
      if (!db.activeSessions) db.activeSessions = {};
      db.activeSessions[cleanEmail] = now;

      // Append audit log
      if (!db.activityLogs) db.activityLogs = [];
      db.activityLogs.unshift({
        id: `act_${now}_${Math.floor(Math.random() * 1000)}`,
        adminEmail: "system",
        adminUid: "SYSTEM",
        action: `New user registration: ${cleanEmail} (${cleanName})`,
        targetUser: cleanEmail,
        timestamp: now,
      });

      writeDb(db);

      const safeAccount = { ...db.userAccounts[cleanEmail], isOnline: true };
      const trial = evaluateTrial(db, cleanEmail, false);

      return res.json({
        status: "ok",
        user: safeAccount,
        trialStatus: trial,
      });
    } catch (err: any) {
      console.error("[Register Error]:", err);
      return res.status(500).json({ error: err.message || "Failed to register account" });
    }
  });
});

// 2. User Login Endpoint
app.post("/api/auth/login", async (req, res): Promise<any> => {
  return runWithDbLock(async () => {
    try {
      const { email, password, sessionId } = req.body || {};
      const cleanEmail = (email || "").toLowerCase().trim();
      const cleanPass = (password || "").trim();

      if (!cleanEmail || !cleanPass) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const db = readDb();

      // Check account existence
      const storedPass = db.registeredUsers?.[cleanEmail];
      if (!storedPass) {
        return res.status(401).json({ error: "No account found with this email. Please register first." });
      }

      // Check password
      if (storedPass !== cleanPass) {
        return res.status(401).json({ error: "Incorrect password. Please verify and try again." });
      }

      // Check if disabled / suspended
      if ((db.disabledUsers || []).includes(cleanEmail) || db.userAccounts?.[cleanEmail]?.status === "disabled") {
        return res.status(403).json({ error: "Your account has been suspended or disabled. Please contact admin." });
      }

      const now = Date.now();
      const user: any = db.userAccounts?.[cleanEmail] || {
        uid: generateUid(cleanEmail),
        email: cleanEmail,
        name: cleanEmail.split("@")[0],
        role: "USER" as const,
        status: "active" as const,
        proStatus: "inactive" as const,
        createdAt: now,
        lastLogin: now,
        lastHeartbeat: now,
      };

      user.lastLogin = now;
      user.lastHeartbeat = now;
      db.userAccounts[cleanEmail] = user;

      // Update active heartbeat
      if (!db.activeHeartbeats) db.activeHeartbeats = {};
      db.activeHeartbeats[cleanEmail] = { lastHeartbeat: now, sessionId: sessionId || `sess_${now}` };

      // Update active sessions
      if (!db.activeSessions) db.activeSessions = {};
      db.activeSessions[cleanEmail] = now;

      writeDb(db);

      const trial = evaluateTrial(db, cleanEmail, false);

      return res.json({
        status: "ok",
        user: { ...user, isOnline: true },
        trialStatus: trial,
      });
    } catch (err: any) {
      console.error("[Login Error]:", err);
      return res.status(500).json({ error: err.message || "Failed to log in" });
    }
  });
});

// 3. User Heartbeat Endpoint (Online presence tracking)
app.post("/api/user/heartbeat", async (req, res): Promise<any> => {
  try {
    const { email, sessionId } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const db = readDb();
    const now = Date.now();

    if (!db.activeHeartbeats) db.activeHeartbeats = {};
    db.activeHeartbeats[cleanEmail] = {
      lastHeartbeat: now,
      sessionId: sessionId || db.activeHeartbeats[cleanEmail]?.sessionId || `sess_${now}`,
      ip: req.ip,
    };

    if (db.userAccounts?.[cleanEmail]) {
      db.userAccounts[cleanEmail].lastLogin = now;
      db.userAccounts[cleanEmail].lastHeartbeat = now;
    }

    // Persist heartbeat timestamp safely
    writeDb(db);

    const online = isUserOnline(db, cleanEmail);
    return res.json({ status: "ok", online, serverTime: now });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. User Leave / Unload Endpoint (Immediate offline marking)
app.post("/api/user/leave", async (req, res): Promise<any> => {
  try {
    const { email } = req.body || {};
    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      const db = readDb();
      if (db.activeHeartbeats?.[cleanEmail]) {
        db.activeHeartbeats[cleanEmail].lastHeartbeat = 0;
        writeDb(db);
      }
    }
    return res.json({ status: "ok" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. User Trial Status Endpoint
app.get("/api/trial/status", (req, res): any => {
  try {
    const email = (req.query.email as string || "").toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }
    const db = readDb();
    const trialStatus = evaluateTrial(db, email, false);
    return res.json({ status: "ok", trialStatus });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 6. User Payment Request Submission Endpoint
app.post("/api/payment/request", async (req, res): Promise<any> => {
  return runWithDbLock(async () => {
    try {
      const { email, paymentMethod, network, amount, transactionId, senderNumber } = req.body || {};
      const cleanEmail = (email || "").toLowerCase().trim();
      const cleanTx = (transactionId || "").trim();
      const cleanSender = (senderNumber || "").trim();
      const numericAmount = parseFloat(amount) || 20.0;

      if (!cleanEmail || !cleanTx || !cleanSender) {
        return res.status(400).json({ error: "Email, Transaction ID (TrxID), and Sender Number are required." });
      }

      const db = readDb();

      // Check if user account is disabled
      if ((db.disabledUsers || []).includes(cleanEmail) || db.userAccounts?.[cleanEmail]?.status === "disabled") {
        return res.status(403).json({ error: "Account is disabled. Cannot submit payment requests." });
      }

      // Check for duplicate transaction reference across existing pending/approved requests
      const existingTx = (db.submittedPayments || []).find(
        p => p && p.transactionId && p.transactionId.toLowerCase() === cleanTx.toLowerCase() && p.status !== "REJECTED" && p.status !== "rejected" && p.status !== "disabled"
      );

      if (existingTx) {
        return res.status(400).json({
          error: "This Transaction ID (TrxID) has already been submitted and is currently being processed or approved. Please verify your TrxID.",
        });
      }

      const userAccount = db.userAccounts?.[cleanEmail];
      const uid = userAccount?.uid || generateUid(cleanEmail);
      const userName = userAccount?.name || (cleanEmail.split("@")[0].charAt(0).toUpperCase() + cleanEmail.split("@")[0].slice(1));
      const now = Date.now();

      const newPayment = {
        id: `pay_${now}_${Math.floor(Math.random() * 10000)}`,
        userId: uid,
        username: cleanEmail,
        userEmail: cleanEmail,
        userName,
        paymentMethod: paymentMethod || "bKash",
        network: network || paymentMethod || "bKash (বিকাশ)",
        amount: numericAmount,
        transactionId: cleanTx,
        senderNumber: cleanSender,
        timestamp: now,
        status: "PENDING" as const,
      };

      if (!db.submittedPayments) db.submittedPayments = [];
      db.submittedPayments.unshift(newPayment);

      // Append to audit log
      if (!db.activityLogs) db.activityLogs = [];
      db.activityLogs.unshift({
        id: `act_${now}_${Math.floor(Math.random() * 1000)}`,
        adminEmail: "user",
        adminUid: uid,
        action: `Payment request submitted: ${newPayment.id} (${cleanTx}) by ${cleanEmail} for $${numericAmount}`,
        targetUser: cleanEmail,
        timestamp: now,
      });

      writeDb(db);

      return res.json({
        status: "ok",
        message: "Payment request submitted successfully. Awaiting administrator review.",
        request: newPayment,
      });
    } catch (err: any) {
      console.error("[Payment Submission Error]:", err);
      return res.status(500).json({ error: err.message || "Failed to submit payment request" });
    }
  });
});

// 7. Admin Dashboard Statistics Endpoint (Server-authoritative, persistent)
app.get("/api/admin/stats", (req, res): any => {
  try {
    const adminEmail = (req.query.adminEmail as string || req.headers["x-admin-email"] as string || "").toLowerCase();
    const db = readDb();

    const auth = checkAdminAuth(db, adminEmail);
    if (!auth.isAuthorized) {
      return res.status(403).json({ error: "Unauthorized. Admin privileges required." });
    }

    const now = Date.now();
    const todayStr = getDhakaDateStr(now);
    const todayStart = getDhakaDayStart(now);
    const sevenDaysAgo = now - 7 * 86400000;

    const allUsers = Object.values(db.userAccounts || {});
    const totalUsers = allUsers.length;

    const newRegistrationsToday = allUsers.filter(u => u.createdAt && u.createdAt >= todayStart).length;
    const newRegistrations7Days = allUsers.filter(u => u.createdAt && u.createdAt >= sevenDaysAgo).length;

    // Online & Offline counts evaluated with 60s presence window
    let onlineUsers = 0;
    for (const u of allUsers) {
      if (isUserOnline(db, u.email)) {
        onlineUsers++;
      }
    }
    const offlineUsers = Math.max(0, totalUsers - onlineUsers);

    // Payment request counts
    const payments = db.submittedPayments || [];
    const totalPendingPayments = payments.filter(p => p.status === "PENDING" || p.status === "pending" || !p.status).length;
    const approvedPayments = payments.filter(p => p.status === "APPROVED" || p.status === "approved").length;
    const rejectedPayments = payments.filter(p => p.status === "REJECTED" || p.status === "rejected" || p.status === "disabled").length;
    const underReviewPayments = payments.filter(p => p.status === "UNDER_REVIEW").length;
    const pendingVipRequests = totalPendingPayments; // VIP activation requests awaiting review

    // VIP subscribers breakdown
    const activeVipSubscribers = allUsers.filter(
      u => u.proStatus === "active" && (!u.proExpiresAt || u.proExpiresAt > now) && u.status !== "disabled"
    ).length;

    const expiredVipSubscriptions = allUsers.filter(
      u => u.proStatus === "expired" || (u.proExpiresAt && u.proExpiresAt <= now && u.role !== "SUPER_ADMIN")
    ).length;

    // Platform signal attempts executed today
    const totalSignalsToday = db.signalAttemptsToday?.[todayStr] || 0;

    return res.json({
      status: "ok",
      stats: {
        totalUsers,
        newRegistrationsToday,
        newRegistrations7Days,
        onlineUsers,
        offlineUsers,
        totalPendingPayments,
        approvedPayments,
        rejectedPayments,
        underReviewPayments,
        pendingVipRequests,
        activeVipSubscribers,
        expiredVipSubscriptions,
        totalSignalsToday,
        serverTime: now,
        timezone: BUSINESS_TIMEZONE,
      },
    });
  } catch (err: any) {
    console.error("[Admin Stats Error]:", err);
    return res.status(500).json({ error: err.message || "Failed to load dashboard statistics" });
  }
});

// 8. Admin Users Management Endpoint (Server pagination, filtering, search)
app.get("/api/admin/users", (req, res): any => {
  try {
    const adminEmail = (req.query.adminEmail as string || req.headers["x-admin-email"] as string || "").toLowerCase();
    const db = readDb();

    const auth = checkAdminAuth(db, adminEmail);
    if (!auth.isAuthorized) {
      return res.status(403).json({ error: "Unauthorized. Admin privileges required." });
    }

    const page = Math.max(1, parseInt(req.query.page as string || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string || "20", 10)));
    const search = (req.query.search as string || "").trim().toLowerCase();
    const filter = (req.query.filter as string || "ALL").toUpperCase();

    const now = Date.now();
    const todayStr = getDhakaDateStr(now);

    let users = Object.values(db.userAccounts || {}).map(u => {
      const email = u.email.toLowerCase();
      const online = isUserOnline(db, email);
      const trialRec = db.trialRecords?.[email];
      const usedToday = trialRec?.dailyAttempts?.[todayStr] || 0;
      const remainingToday = Math.max(0, MAX_TRIAL_DAILY_ATTEMPTS - usedToday);

      return {
        ...u,
        isOnline: online,
        trialAttemptsToday: usedToday,
        trialRemainingToday: remainingToday,
      };
    });

    // Apply Filters
    if (filter === "ONLINE") {
      users = users.filter(u => u.isOnline);
    } else if (filter === "OFFLINE") {
      users = users.filter(u => !u.isOnline);
    } else if (filter === "ACTIVE") {
      users = users.filter(u => u.status === "active");
    } else if (filter === "INACTIVE") {
      users = users.filter(u => u.status === "inactive");
    } else if (filter === "DISABLED") {
      users = users.filter(u => u.status === "disabled");
    } else if (filter === "PRO ACTIVE" || filter === "PRO_ACTIVE") {
      users = users.filter(u => u.proStatus === "active");
    } else if (filter === "EXPIRED VIP" || filter === "EXPIRED_VIP") {
      users = users.filter(u => u.proStatus === "expired" || (u.proExpiresAt && u.proExpiresAt <= now));
    } else if (filter === "PENDING PAYMENT" || filter === "PENDING_PAYMENT") {
      users = users.filter(u => (db.submittedPayments || []).some(p => p.username.toLowerCase() === u.email.toLowerCase() && (p.status === "PENDING" || p.status === "pending")));
    }

    // Apply Search
    if (search) {
      users = users.filter(u => {
        return (
          u.name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          (u.uid && u.uid.toLowerCase().includes(search)) ||
          (db.submittedPayments || []).some(p => p.username.toLowerCase() === u.email.toLowerCase() && p.transactionId.toLowerCase().includes(search))
        );
      });
    }

    // Sort by createdAt descending
    users.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const total = users.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedUsers = users.slice(startIndex, startIndex + limit);

    return res.json({
      status: "ok",
      users: paginatedUsers,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (err: any) {
    console.error("[Admin Users Error]:", err);
    return res.status(500).json({ error: err.message || "Failed to load users list" });
  }
});

// 9. Admin Requests Management Endpoint (Search, status filters, pagination)
app.get("/api/admin/requests", (req, res): any => {
  try {
    const adminEmail = (req.query.adminEmail as string || req.headers["x-admin-email"] as string || "").toLowerCase();
    const db = readDb();

    const auth = checkAdminAuth(db, adminEmail);
    if (!auth.isAuthorized) {
      return res.status(403).json({ error: "Unauthorized. Admin privileges required." });
    }

    const page = Math.max(1, parseInt(req.query.page as string || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string || "20", 10)));
    const search = (req.query.search as string || "").trim().toLowerCase();
    const filter = (req.query.filter as string || "ALL").toUpperCase();

    let requests = [...(db.submittedPayments || [])];

    // Filter by explicit status
    if (filter === "PENDING") {
      requests = requests.filter(p => p.status === "PENDING" || p.status === "pending" || !p.status);
    } else if (filter === "UNDER_REVIEW") {
      requests = requests.filter(p => p.status === "UNDER_REVIEW");
    } else if (filter === "APPROVED") {
      requests = requests.filter(p => p.status === "APPROVED" || p.status === "approved");
    } else if (filter === "REJECTED") {
      requests = requests.filter(p => p.status === "REJECTED" || p.status === "rejected" || p.status === "disabled");
    }

    // Apply Search
    if (search) {
      requests = requests.filter(p => {
        return (
          p.id.toLowerCase().includes(search) ||
          (p.username && p.username.toLowerCase().includes(search)) ||
          (p.userEmail && p.userEmail.toLowerCase().includes(search)) ||
          (p.userName && p.userName.toLowerCase().includes(search)) ||
          (p.transactionId && p.transactionId.toLowerCase().includes(search)) ||
          (p.senderNumber && p.senderNumber.toLowerCase().includes(search)) ||
          (p.paymentMethod && p.paymentMethod.toLowerCase().includes(search)) ||
          (p.userId && p.userId.toLowerCase().includes(search))
        );
      });
    }

    // Sort by timestamp descending
    requests.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    const total = requests.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedRequests = requests.slice(startIndex, startIndex + limit);

    return res.json({
      status: "ok",
      requests: paginatedRequests,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (err: any) {
    console.error("[Admin Requests Error]:", err);
    return res.status(500).json({ error: err.message || "Failed to load requests" });
  }
});

// 10. Admin Request Review Endpoint (APPROVE, REJECT, UNDER_REVIEW)
app.post("/api/admin/requests/:id/review", async (req, res): Promise<any> => {
  return runWithDbLock(async () => {
    try {
      const requestId = req.params.id;
      const { adminEmail, action, notes } = req.body || {};

      const cleanAdmin = (adminEmail || "").toLowerCase().trim();
      const db = readDb();

      const auth = checkAdminAuth(db, cleanAdmin);
      if (!auth.isAuthorized) {
        return res.status(403).json({ error: "Unauthorized. Admin privileges required." });
      }

      if (!["APPROVE", "REJECT", "UNDER_REVIEW"].includes(action)) {
        return res.status(400).json({ error: "Action must be APPROVE, REJECT, or UNDER_REVIEW." });
      }

      const reqIndex = (db.submittedPayments || []).findIndex(p => p.id === requestId);
      if (reqIndex === -1) {
        return res.status(404).json({ error: `Payment request ${requestId} not found.` });
      }

      const payment = db.submittedPayments[reqIndex];
      const now = Date.now();
      const targetUser = payment.username.toLowerCase();

      // Guard: prevent duplicate approval
      if (action === "APPROVE") {
        if (payment.status === "APPROVED" || payment.status === "approved") {
          return res.status(400).json({ error: "This payment request has already been approved." });
        }

        // Set Approved
        payment.status = "APPROVED";
        payment.reviewedAt = now;
        payment.reviewedBy = cleanAdmin;
        payment.approvedAt = now;
        payment.approvedBy = cleanAdmin;
        if (notes) payment.notes = notes;

        // Activate 30 days VIP on user account
        const expiresAt = now + 30 * 24 * 3600 * 1000;
        const proUsers = (db.proUsers || []).filter(p => p.username.toLowerCase() !== targetUser);
        proUsers.push({
          username: targetUser,
          expiresAt,
          verifiedAt: now,
        });
        db.proUsers = proUsers;

        // Ensure user account is active & proStatus is active
        if (db.userAccounts?.[targetUser]) {
          db.userAccounts[targetUser].status = "active";
          db.userAccounts[targetUser].proStatus = "active";
          db.userAccounts[targetUser].proExpiresAt = expiresAt;
        }

        // Remove from disabledUsers if was disabled
        db.disabledUsers = (db.disabledUsers || []).filter(u => u !== targetUser);

        // Append audit log
        if (!db.activityLogs) db.activityLogs = [];
        db.activityLogs.unshift({
          id: `act_${now}_${Math.floor(Math.random() * 1000)}`,
          adminEmail: cleanAdmin,
          adminUid: auth.account?.uid || generateUid(cleanAdmin),
          action: `Approved payment ${payment.id} (TrxID: ${payment.transactionId}) - 30 days VIP activated for ${targetUser}`,
          targetUser,
          timestamp: now,
          details: notes,
        });
      } else if (action === "REJECT") {
        payment.status = "REJECTED";
        payment.reviewedAt = now;
        payment.reviewedBy = cleanAdmin;
        if (notes) payment.notes = notes;

        if (!db.activityLogs) db.activityLogs = [];
        db.activityLogs.unshift({
          id: `act_${now}_${Math.floor(Math.random() * 1000)}`,
          adminEmail: cleanAdmin,
          adminUid: auth.account?.uid || generateUid(cleanAdmin),
          action: `Rejected payment ${payment.id} (TrxID: ${payment.transactionId}) for ${targetUser}`,
          targetUser,
          timestamp: now,
          details: notes,
        });
      } else if (action === "UNDER_REVIEW") {
        payment.status = "UNDER_REVIEW";
        payment.reviewedAt = now;
        payment.reviewedBy = cleanAdmin;
        if (notes) payment.notes = notes;

        if (!db.activityLogs) db.activityLogs = [];
        db.activityLogs.unshift({
          id: `act_${now}_${Math.floor(Math.random() * 1000)}`,
          adminEmail: cleanAdmin,
          adminUid: auth.account?.uid || generateUid(cleanAdmin),
          action: `Marked payment ${payment.id} (TrxID: ${payment.transactionId}) as UNDER REVIEW for ${targetUser}`,
          targetUser,
          timestamp: now,
          details: notes,
        });
      }

      writeDb(db);

      return res.json({
        status: "ok",
        message: `Payment request marked as ${payment.status}.`,
        request: payment,
      });
    } catch (err: any) {
      console.error("[Review Request Error]:", err);
      return res.status(500).json({ error: err.message || "Failed to review request" });
    }
  });
});

// Admin Execute Action Endpoint
app.post("/api/admin/action", async (req, res): Promise<any> => {
  try {
    const { adminEmail, action, targetUser, data } = req.body || {};
    if (!adminEmail || !action) {
      return res.status(400).json({ error: "adminEmail and action are required" });
    }

    const db = readDb();
    ensureUserAccounts(db);

    const callerAccount = db.userAccounts?.[adminEmail.toLowerCase()] || db.adminRoles?.[adminEmail.toLowerCase()];
    const isSuper = adminEmail.toLowerCase() === "limon2581444@gmail.com" || adminEmail.toLowerCase() === "limon2581444@gmail" || callerAccount?.role === "SUPER_ADMIN";
    const isAdmin = isSuper || callerAccount?.role === "ADMIN";

    if (!isAdmin) {
      return res.status(403).json({ error: "Unauthorized. Admin privileges required." });
    }

    const adminUid = (callerAccount && "uid" in callerAccount && callerAccount.uid) ? callerAccount.uid : generateUid(adminEmail);
    const target = targetUser ? targetUser.toLowerCase() : "";
    let logDescription = "";

    switch (action) {
      case "APPROVE_PAYMENT": {
        const paymentId = data?.paymentId;
        if (paymentId) {
          db.submittedPayments = (db.submittedPayments || []).map(p => {
            if (p.id === paymentId) {
              return {
                ...p,
                status: "approved",
                approvedAt: Date.now(),
                approvedBy: adminEmail,
              };
            }
            return p;
          });
        }
        if (target) {
          // Grant 30 days PRO
          const expiresAt = Date.now() + 30 * 24 * 3600 * 1000;
          const proUsers = (db.proUsers || []).filter(p => p.username.toLowerCase() !== target);
          proUsers.push({
            username: target,
            expiresAt,
            verifiedAt: Date.now(),
          });
          db.proUsers = proUsers;

          // Remove from disabledUsers if was disabled
          db.disabledUsers = (db.disabledUsers || []).filter(u => u !== target);

          if (db.userAccounts?.[target]) {
            db.userAccounts[target].status = "active";
            db.userAccounts[target].proStatus = "active";
            db.userAccounts[target].proExpiresAt = expiresAt;
          }
          logDescription = `Approved payment request (${paymentId || "N/A"}) and activated PRO for 30 days`;
        }
        break;
      }

      case "DISABLE_PAYMENT": {
        const paymentId = data?.paymentId;
        if (paymentId) {
          db.submittedPayments = (db.submittedPayments || []).map(p => {
            if (p.id === paymentId) {
              return {
                ...p,
                status: "disabled",
                disabledAt: Date.now(),
                disabledBy: adminEmail,
              };
            }
            return p;
          });
        }
        if (target) {
          // Disable user account and revoke Pro
          if (!db.disabledUsers.includes(target)) {
            db.disabledUsers.push(target);
          }
          db.proUsers = (db.proUsers || []).filter(p => p.username.toLowerCase() !== target);
          if (db.userAccounts?.[target]) {
            db.userAccounts[target].status = "disabled";
            db.userAccounts[target].proStatus = "inactive";
          }
          delete db.activeSessions[target];
          logDescription = `Disabled payment request (${paymentId || "N/A"}) and banned user account`;
        }
        break;
      }

      case "ACTIVATE_USER": {
        if (target) {
          db.disabledUsers = (db.disabledUsers || []).filter(u => u !== target);
          if (db.userAccounts?.[target]) {
            db.userAccounts[target].status = "active";
          }
          logDescription = `Activated user account`;
        }
        break;
      }

      case "DEACTIVATE_USER": {
        if (target) {
          if (db.userAccounts?.[target]) {
            db.userAccounts[target].status = "inactive";
          }
          delete db.activeSessions[target];
          logDescription = `Set user account to inactive`;
        }
        break;
      }

      case "DISABLE_USER": {
        if (target) {
          if (!db.disabledUsers.includes(target)) {
            db.disabledUsers.push(target);
          }
          db.proUsers = (db.proUsers || []).filter(p => p.username.toLowerCase() !== target);
          if (db.userAccounts?.[target]) {
            db.userAccounts[target].status = "disabled";
            db.userAccounts[target].proStatus = "inactive";
          }
          delete db.activeSessions[target];
          logDescription = `Disabled user account`;
        }
        break;
      }

      case "ACTIVATE_PRO": {
        if (target) {
          const days = Number(data?.days) || 30;
          const expiresAt = Date.now() + days * 24 * 3600 * 1000;
          const proUsers = (db.proUsers || []).filter(p => p.username.toLowerCase() !== target);
          proUsers.push({
            username: target,
            expiresAt,
            verifiedAt: Date.now(),
          });
          db.proUsers = proUsers;
          db.disabledUsers = (db.disabledUsers || []).filter(u => u !== target);
          if (db.userAccounts?.[target]) {
            db.userAccounts[target].status = "active";
            db.userAccounts[target].proStatus = "active";
            db.userAccounts[target].proExpiresAt = expiresAt;
          }
          logDescription = `Manually activated PRO for ${days} days`;
        }
        break;
      }

      case "DEACTIVATE_PRO": {
        if (target) {
          db.proUsers = (db.proUsers || []).filter(p => p.username.toLowerCase() !== target);
          if (db.userAccounts?.[target]) {
            db.userAccounts[target].proStatus = "inactive";
            delete db.userAccounts[target].proExpiresAt;
          }
          logDescription = `Deactivated PRO membership`;
        }
        break;
      }

      case "RESET_PASSWORD": {
        const newPassword = data?.newPassword;
        if (target && newPassword) {
          db.registeredUsers[target] = newPassword;
          logDescription = `Reset password for user`;
        }
        break;
      }

      case "ADD_ADMIN": {
        if (!isSuper) {
          return res.status(403).json({ error: "Only Super Admin can manage administrators" });
        }
        const newAdminEmail = data?.email?.toLowerCase();
        const newAdminName = data?.name || newAdminEmail?.split("@")[0];
        const newRole = data?.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN";
        if (newAdminEmail) {
          if (!db.adminRoles) db.adminRoles = {};
          db.adminRoles[newAdminEmail] = {
            email: newAdminEmail,
            name: newAdminName,
            role: newRole,
            status: "active",
            createdAt: Date.now(),
            lastLogin: Date.now(),
          };
          if (!db.registeredUsers[newAdminEmail]) {
            db.registeredUsers[newAdminEmail] = data?.password || "admin123";
          }
          if (db.userAccounts?.[newAdminEmail]) {
            db.userAccounts[newAdminEmail].role = newRole;
          }
          logDescription = `Added ${newRole}: ${newAdminEmail} (${newAdminName})`;
        }
        break;
      }

      case "DISABLE_ADMIN": {
        if (!isSuper) {
          return res.status(403).json({ error: "Only Super Admin can manage administrators" });
        }
        const adminToDisable = target;
        if (adminToDisable === "limon2581444@gmail.com" || adminToDisable === "limon2581444@gmail") {
          return res.status(400).json({ error: "Cannot disable primary Super Admin" });
        }
        if (db.adminRoles?.[adminToDisable]) {
          db.adminRoles[adminToDisable].status = "disabled";
        }
        logDescription = `Disabled administrator account: ${adminToDisable}`;
        break;
      }

      case "REMOVE_ADMIN": {
        if (!isSuper) {
          return res.status(403).json({ error: "Only Super Admin can manage administrators" });
        }
        const adminToRemove = target;
        if (adminToRemove === "limon2581444@gmail.com" || adminToRemove === "limon2581444@gmail") {
          return res.status(400).json({ error: "Cannot remove primary Super Admin" });
        }
        if (db.adminRoles?.[adminToRemove]) {
          delete db.adminRoles[adminToRemove];
        }
        if (db.userAccounts?.[adminToRemove]) {
          db.userAccounts[adminToRemove].role = "USER";
        }
        logDescription = `Removed admin role from: ${adminToRemove}`;
        break;
      }

      case "LOGOUT_ALL_MEMBERS": {
        const now = Date.now();
        const prevCount = Object.keys(db.activeSessions || {}).length;
        const newSessions: Record<string, number> = {};
        if (db.activeSessions) {
          for (const [email, ts] of Object.entries(db.activeSessions)) {
            const lower = email.toLowerCase();
            if (lower === "limon2581444@gmail.com" || lower === "limon2581444@gmail" || lower === adminEmail.toLowerCase()) {
              newSessions[email] = ts;
            }
          }
        }
        db.activeSessions = newSessions;
        if (!db.configs) db.configs = {};
        db.configs["nila_sessions_revoked_before_v1"] = now.toString();
        logDescription = `Logged out all previous member sessions (${prevCount} total sessions revoked)`;
        break;
      }

      case "LOGOUT_USER": {
        if (target) {
          if (db.activeSessions) {
            delete db.activeSessions[target];
          }
          if (!db.configs) db.configs = {};
          db.configs[`nila_user_revoked_${target.toLowerCase()}`] = Date.now().toString();
          logDescription = `Force logged out user session: ${target}`;
        }
        break;
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    // Append to activity log
    if (logDescription) {
      if (!db.activityLogs) db.activityLogs = [];
      db.activityLogs.unshift({
        id: `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        adminEmail,
        adminUid,
        action: logDescription,
        targetUser: target,
        timestamp: Date.now(),
        details: data ? JSON.stringify(data) : undefined,
      });
      db.activityLogs = db.activityLogs.slice(0, 100);
    }

    ensureUserAccounts(db);
    writeDb(db);

    const safeRegisteredUsers: Record<string, string> = {};
    for (const [key] of Object.entries(db.registeredUsers || {})) {
      safeRegisteredUsers[key] = "PROTECTED";
    }

    const safeState = {
      ...db,
      registeredUsers: safeRegisteredUsers,
    };

    res.json({ status: "ok", state: safeState });
  } catch (err: any) {
    console.error("[Admin Action Error]:", err);
    res.status(500).json({ error: err.message });
  }
});

// Primary Endpoint: Trading Chart pattern analyzer
app.post("/api/analyze", async (req, res): Promise<any> => {
  try {
    const { image, precision, userEmail, idempotencyKey } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Image data is required" });
    }

    // Check user trial / VIP entitlement on server BEFORE executing analysis
    if (userEmail) {
      const db = readDb();
      const preCheck = evaluateTrial(db, userEmail, false);
      if (!preCheck.canAttempt) {
        return res.status(403).json({
          error: preCheck.message,
          trialStatus: preCheck,
        });
      }
    }

    let mimeType = "";
    let base64Data = "";

    if (image.startsWith("http://") || image.startsWith("https://")) {
      try {
        const fetchRes = await fetch(image);
        if (!fetchRes.ok) {
          return res.status(400).json({ error: `Failed to fetch image from URL: ${fetchRes.statusText}` });
        }
        const arrayBuffer = await fetchRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        base64Data = buffer.toString("base64");
        
        const contentType = fetchRes.headers.get("content-type");
        mimeType = contentType && contentType.startsWith("image/") ? contentType : "image/jpeg";
      } catch (err: any) {
        return res.status(400).json({ error: `Failed to load image from URL: ${err.message}` });
      }
    } else {
      // Parse data URL to get mimetype and raw base64 data
      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: "Invalid image format. Expected helper Base64 Data URL." });
      }
      mimeType = matches[1];
      base64Data = matches[2];
    }

    const ai = getGenAI();

    // Technical trading detailed prompt with very strict instructions to prevent trading losses and validate if it is a trading chart
    let promptText = `
      CRITICAL VALIDATION STEP:
      First, inspect if the uploaded image is indeed a valid financial trading chart, candlestick chart, market asset graph, or trading platform screenshot (e.g., MetaTrader, IQ Option, TradingView, Pocket Option, Binance, line/bar/candle chart, etc.).
      
      STRICT ANTI-SPOOF / ANTI-SELFIE CONSTRAINTS:
      - If the image contains a photo of a person, a human face, a selfie, a video player with a person in it, animals, household objects, general documents, memes, or scenery, it is NOT a trading chart.
      - If the image is a screenshot of this analysis app itself (containing text like 'PRO FEUCHER ACTIVE KARO', 'SURE SHOT', 'PREDICTION', 'UP / কল ট্রেড', 'DOWN / পুট ট্রেড', 'ক্যান্ডেল ক্লোজিং ট্রেড নির্দেশিকা', or 'Nila' logos), it is NOT a valid trading chart.
      - A valid trading chart MUST have visible candlestick bars (red and green blocks with wicks) or an active financial line/bar graph taking up the main/majority area of the screen.
      
      If the image is NOT a trading chart, you MUST strictly set:
      - 'prediction' to "NOT_A_CHART"
      - 'confidence' to 0
      - 'supportLevels' to ["N/A"]
      - 'resistanceLevels' to ["N/A"]
      - 'patternsIdentified' to ["Invalid Image / Not a Chart"]
      - 'reasoning' to "The uploaded image is not a recognized trading chart or candlestick graph. Please upload a valid trading chart screenshot."
      - 'reasoningBangla' to "আপলোডকৃত ছবিটি কোনো ট্রেডিং চার্ট বা ক্যান্ডেলস্টিক গ্রাফ নয়। অনুগ্রহ করে আপনার পছন্দের ট্রেডিং প্ল্যাটফর্মের সঠিক চার্টের স্ক্রিনশট আপলোড করুন।"
      - 'recommendation' to "NO ENTRY (NOT A TRADING CHART)"
      - 'recommendationBangla' to "কোনো এন্ট্রি নেই (ট্রেডিং চার্ট নয়)। সঠিক ফাইন্যান্সিয়াল চার্ট আপলোড করা হলে এখানে সিগন্যাল সিদ্ধান্ত প্রদর্শিত হবে।"
      - 'riskRewardRatio' to "N/A"
      - 'suggestedStopLoss' to "N/A"
      - 'suggestedTakeProfit' to "N/A"

      Only if the image is a valid trading chart, proceed with the following detailed technical analysis instructions.

      STRICT DIRECTION ACCURACY CONSTRAINT (আপ এবং ডাউন নির্দেশের সতর্কতা):
      - DO NOT confuse or invert the prediction directions.
      - 'Up' means a bullish prediction. Buy/Call signal. Price is expected to go UP. Green candlestick confirmation, support zone bounce, or bullish breakout.
      - 'Down' means a bearish prediction. Sell/Put signal. Price is expected to go DOWN. Red candlestick confirmation, resistance zone rejection, or bearish breakdown.
      - Carefully verify the trend on the right side of the chart (latest candles). If the latest price action is breaking resistance upwards, the prediction is 'Up'. If the latest price action is breaking support downwards, the prediction is 'Down'.
      - Check that all prices align with the prediction direction:
        * For 'Up' predictions, 'priceCloseUpEntry' must be higher than current price, 'suggestedTakeProfit' must be higher than entry, and 'suggestedStopLoss' must be lower than entry.
        * For 'Down' predictions, 'priceCloseDownEntry' must be lower than current price, 'suggestedTakeProfit' must be lower than entry, and 'suggestedStopLoss' must be higher than entry.
    `;

    // ULTRA-PRECISE TECHNICAL ANALYSIS PROMPT WITH STRICT 70% LOSS PROTECTION DIRECTIVE
    promptText += `
      You are an elite, world-class institutional financial analyst, price-action specialist, and algorithmic candlestick pattern recognition engine.
      Analyze the attached trading chart image with extreme precision and mathematical rigor (অনেক নিখুঁতভাবে মার্কেট অ্যানালাইসিস করুন).

      CRITICAL 70% LOSS-PROTECTION RULE (৭০% এর নিচে হলে লস এড়াতে NO TRADE):
      - User safety and capital preservation is the TOP priority.
      - If you judge that the probability of winning the next candle is LESS than 70% (< 70% confidence), OR if the market shows choppiness, uncertainty, wick rejection conflicts, lack of momentum, Doji consolidation, or risk of loss:
        * You MUST set 'prediction' to "Neutral".
        * You MUST set 'confidence' to a number below 70 (e.g. 35 to 65).
        * In 'reasoningBangla' and 'recommendationBangla', you MUST explicitly write:
          "⚠️ NO TRADE - MARKET IS RISKY (মার্কেট বর্তমানে চরম ঝুঁকিপূর্ণ ও অনির্দিষ্ট)। ক্যান্ডেল সফল হওয়ার সম্ভাবনা ৭০% এর নিচে এবং ট্রেড নিলে লস হওয়ার তীব্র ঝুঁকি রয়েছে। তাই নিজের ব্যালেন্স সুরক্ষিত রাখতে এই মুহূর্তে কোনো ট্রেড নিবেন না।"
        * In 'recommendation', write: "NO TRADE - MARKET IS RISKY (High risk of loss, setup confidence is below 70%)."
        * Set 'priceCloseUpEntry' and 'priceCloseDownEntry' to "N/A".

      DECISIVE 70%+ SURE-SHOT RULE (৭০% বা তার বেশি সম্ভাবনা নিশ্চিত হলে তবেই ট্রেড):
      - ONLY if the technical confluence (Support/Resistance bounce, strong momentum breakout, engulfing candle, rejection wick, EMA trend alignment) provides a 70% to 100% winning probability (≥ 70% confidence):
        * If bullish confluence: Predict "Up" (Call / Buy), set confidence between 70 and 99. In 'reasoningBangla' and 'recommendationBangla', explain the exact candlestick reason and write: "🔥 এই সিগন্যালে ৭০%+ শিউর শট নিশ্চয়তা রয়েছে।"
        * If bearish confluence: Predict "Down" (Put / Sell), set confidence between 70 and 99. In 'reasoningBangla' and 'recommendationBangla', explain the exact candlestick reason and write: "🔥 এই সিগন্যালে ৭০%+ শিউর শট নিশ্চয়তা রয়েছে।"
        * Provide specific breakout / breakdown price levels.

      Objectives:
      1. Meticulously inspect the latest 5-10 candlestick micro-structures, wick lengths, and key levels on the right.
      2. Strictly apply the 70% threshold: <70% -> "Neutral" (NO TRADE - MARKET IS RISKY), >=70% -> "Up" or "Down".
      3. If image is not a trading chart, return "NOT_A_CHART".
      4. Translate technical findings into fluent, crystal-clear Bengali (বাংলা) so traders clearly know if they should take a 70%+ sure shot trade or stay away because market is risky.

      Provide your analysis strictly in valid JSON matching the requested response schema format. Do not prepend markdown formatting inside the json fields.
    `;

    // Progressive model fallback list prioritizing reliable high-performance multimodal models
    const candidateModels = [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-3.7-flash",
      "gemini-2.0-flash",
      "gemini-flash-latest",
      "gemini-1.5-flash"
    ];
    let response = null;
    let lastModelError = null;

    for (const modelName of candidateModels) {
      try {
        console.log(`[Server] Attempting technical analysis using model: ${modelName}`);
        
        // Configure thinking level HIGH for complex deep reasoning models
        const modelConfig: any = {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              prediction: {
                type: Type.STRING,
                description: "Predicted direction of the next candle: 'Up' (Bullish/Call), 'Down' (Bearish/Put), 'Neutral' (if <70% confidence / risky market), or 'NOT_A_CHART'."
              },
              priceCloseUpEntry: {
                type: Type.STRING,
                description: "At which closing price or breakout condition should we take an UP trade? Or 'N/A'."
              },
              priceCloseDownEntry: {
                type: Type.STRING,
                description: "At which closing price or breakdown condition should we take a DOWN trade? Or 'N/A'."
              },
              confidence: {
                type: Type.INTEGER,
                description: "Confidence level of this prediction (percentage 0 to 100)."
              },
              supportLevels: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Key support levels identified from the chart."
              },
              resistanceLevels: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Key resistance levels identified from the chart."
              },
              patternsIdentified: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Specific chart pattern, indicator setups, or candlestick formations identified."
              },
              reasoning: {
                type: Type.STRING,
                description: "Detailed professional technical analysis reasoning in English."
              },
              reasoningBangla: {
                type: Type.STRING,
                description: "Complete technical analysis reasoning in highly-clear Bengali language (বাংলা) explaining patterns and price action."
              },
              recommendation: {
                type: Type.STRING,
                description: "Trade execution guidance and warnings in English."
              },
              recommendationBangla: {
                type: Type.STRING,
                description: "Trade execution guidance and warnings in Bengali language (বাংলা)."
              },
              riskRewardRatio: {
                type: Type.STRING,
                description: "Suggested Risk-to-Reward ratio (e.g. '1:2', '1:1.5') or 'N/A'."
              },
              suggestedStopLoss: {
                type: Type.STRING,
                description: "Stop Loss level suggesting where to exit if trade goes wrong, or 'N/A'."
              },
              suggestedTakeProfit: {
                type: Type.STRING,
                description: "Take Profit level suggesting where to secure gains, or 'N/A'."
              }
            },
            required: [
              "prediction", "priceCloseUpEntry", "priceCloseDownEntry", "confidence",
              "supportLevels", "resistanceLevels", "patternsIdentified", "reasoning",
              "reasoningBangla", "recommendation", "recommendationBangla", "riskRewardRatio",
              "suggestedStopLoss", "suggestedTakeProfit"
            ]
          }
        };

        if (modelName === "gemini-3.7-flash") {
          modelConfig.thinkingConfig = {
            thinkingLevel: ThinkingLevel.HIGH,
          };
        }

        response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: promptText,
            },
          ],
          config: modelConfig,
        });

        if (response && response.text) {
          console.log(`[Server] Technical analysis successfully completed using model: ${modelName}`);
          break;
        }
      } catch (err) {
        console.warn(`[Server] Model ${modelName} failed or encountered rate limits. Trying next model. Error details:`, err);
        lastModelError = err;
      }
    }

    if (!response || !response.text) {
      throw lastModelError || new Error("All candidate models failed or returned empty response content.");
    }

    const analysisText = response.text;
    if (!analysisText) {
      throw new Error("Unable to extract response content from Gemini.");
    }

    const tradingAnalysis = JSON.parse(analysisText.trim());

    // Atomically record and increment trial attempt upon confirmed success
    let finalTrialStatus = null;
    if (userEmail) {
      await runWithDbLock(async () => {
        const freshDb = readDb();
        finalTrialStatus = evaluateTrial(freshDb, userEmail, true, idempotencyKey);
        writeDb(freshDb);
      });
    }

    return res.json({
      ...tradingAnalysis,
      trialStatus: finalTrialStatus,
    });

  } catch (error: any) {
    console.error("Analysis API Error:", error);
    let errorMessage = error.message || "An unexpected error occurred during analysis.";
    
    // Check if error is due to rate limits or quotas
    const lowerMessage = errorMessage.toLowerCase();
    if (
      lowerMessage.includes("429") || 
      lowerMessage.includes("quota") || 
      lowerMessage.includes("limit") || 
      lowerMessage.includes("exhausted") ||
      lowerMessage.includes("resource_exhausted")
    ) {
      errorMessage = "Gemini API Quota or Rate Limit exceeded. Please try again in 30 seconds.";
    }

    return res.status(500).json({
      error: errorMessage,
    });
  }
});

// Setup Vite Dev Server / Static files middleware
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error("Error setting up server:", err);
});
