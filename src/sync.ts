const CONFIG_KEYS = [
  "nila_custom_telegram_v1",
  "nila_custom_owner1_v1",
  "nila_custom_owner2_v1",
  "nila_custom_winrate_v1",
  "nila_custom_announcement_v1",
  "nila_custom_usdt_v1",
  "nila_custom_trx_v1",
  "nila_custom_ltc_v1",
  "nila_custom_bkash_inst_v1",
  "nila_custom_crypto_inst_v1",
  "nila_sessions_revoked_before_v1",
];

let isSyncing = false;

export async function syncWithServer() {
  if (isSyncing) return;
  isSyncing = true;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const registeredUsers = JSON.parse(localStorage.getItem("nila_registered_users_v2") || "{}");
    const submittedPayments = JSON.parse(localStorage.getItem("nila_submitted_payments_v1") || "[]");
    const activeSessions = JSON.parse(localStorage.getItem("nila_active_sessions_v1") || "{}");
    const supportChats = JSON.parse(localStorage.getItem("nila_support_chats_v2") || "{}");
    const analysisLimits = JSON.parse(localStorage.getItem("nila_analysis_limits_v1") || "{}");
    const proUsers = JSON.parse(localStorage.getItem("nila_pro_users_v1") || "[]");
    const deletedPayments = JSON.parse(localStorage.getItem("nila_deleted_payments_v1") || "[]");
    const deletedUsers = JSON.parse(localStorage.getItem("nila_deleted_users_v1") || "[]");
    const disabledUsers = JSON.parse(localStorage.getItem("nila_disabled_users_v1") || "[]");
    const registrationTimes = JSON.parse(localStorage.getItem("nila_registration_times_v1") || "{}");
    const userAccounts = JSON.parse(localStorage.getItem("nila_user_accounts_v1") || "{}");
    const adminRoles = JSON.parse(localStorage.getItem("nila_admin_roles_v1") || "{}");
    const activityLogs = JSON.parse(localStorage.getItem("nila_activity_logs_v1") || "[]");

    const configs: Record<string, string> = {};
    for (const key of CONFIG_KEYS) {
      const val = localStorage.getItem(key);
      if (val !== null) {
        configs[key] = val;
      }
    }

    const response = await fetch("/api/db/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        registeredUsers,
        submittedPayments,
        activeSessions,
        supportChats,
        analysisLimits,
        proUsers,
        configs,
        deletedPayments,
        deletedUsers,
        disabledUsers,
        registrationTimes,
        userAccounts,
        adminRoles,
        activityLogs,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return;
    }

    const data = await response.json();
    if (!data || !data.state) return;

    const state = data.state;

    const serverDeletedPayments: string[] = state.deletedPayments || [];
    const serverDeletedUsers: string[] = state.deletedUsers || [];

    // Re-read local storage right now to prevent race conditions (items added while fetch was in flight)
    const freshLocalPayments = JSON.parse(localStorage.getItem("nila_submitted_payments_v1") || "[]");
    const freshLocalUsers = JSON.parse(localStorage.getItem("nila_registered_users_v2") || "{}");
    const freshLocalSessions = JSON.parse(localStorage.getItem("nila_active_sessions_v1") || "{}");
    const freshLocalPro = JSON.parse(localStorage.getItem("nila_pro_users_v1") || "[]");
    const freshLocalChats = JSON.parse(localStorage.getItem("nila_support_chats_v2") || "{}");
    const freshLocalLimits = JSON.parse(localStorage.getItem("nila_analysis_limits_v1") || "{}");
    const freshLocalTimes = JSON.parse(localStorage.getItem("nila_registration_times_v1") || "{}");

    // 1. Merge submitted payments safely
    const paymentsMap = new Map<string, any>();
    for (const p of (state.submittedPayments || [])) {
      if (p && p.id && !serverDeletedPayments.includes(p.id) && !serverDeletedUsers.includes(p.username)) {
        paymentsMap.set(p.id, p);
      }
    }
    for (const p of freshLocalPayments) {
      if (p && p.id && !serverDeletedPayments.includes(p.id) && !serverDeletedUsers.includes(p.username)) {
        const existing = paymentsMap.get(p.id);
        if (!existing) {
          paymentsMap.set(p.id, p);
        } else {
          if (existing.status === "pending" && p.status !== "pending") {
            paymentsMap.set(p.id, p);
          }
        }
      }
    }
    const filteredSubmittedPayments = Array.from(paymentsMap.values());

    // 2. Merge registered users safely
    const filteredRegisteredUsers = { ...(state.registeredUsers || {}), ...freshLocalUsers };
    serverDeletedUsers.forEach(un => {
      delete filteredRegisteredUsers[un];
    });

    // 3. Merge active sessions safely (strictly respecting revocation timestamp)
    const sessionsRevokedBefore = parseInt(state.configs?.["nila_sessions_revoked_before_v1"] || "0", 10);
    const filteredActiveSessions: Record<string, number> = {};

    // First populate from server state
    for (const [user, ts] of Object.entries(state.activeSessions || {})) {
      const lower = user.toLowerCase();
      const isMaster = lower === "limon2581444@gmail.com" || lower === "limon2581444@gmail";
      const userRevokedAt = parseInt(state.configs?.[`nila_user_revoked_${lower}`] || "0", 10);
      if (!isMaster && sessionsRevokedBefore > 0 && (ts as number) <= sessionsRevokedBefore) continue;
      if (!isMaster && userRevokedAt > 0 && (ts as number) <= userRevokedAt) continue;
      if (!serverDeletedUsers.includes(user)) {
        filteredActiveSessions[user] = ts as number;
      }
    }

    // Merge fresh local sessions only if not revoked
    for (const [user, ts] of Object.entries(freshLocalSessions)) {
      const lower = user.toLowerCase();
      const isMaster = lower === "limon2581444@gmail.com" || lower === "limon2581444@gmail";
      const userRevokedAt = parseInt(state.configs?.[`nila_user_revoked_${lower}`] || "0", 10);
      if (!isMaster && sessionsRevokedBefore > 0 && (ts as number) <= sessionsRevokedBefore) continue;
      if (!isMaster && userRevokedAt > 0 && (ts as number) <= userRevokedAt) continue;
      if (!serverDeletedUsers.includes(user)) {
        if (!filteredActiveSessions[user] || (ts as number) > filteredActiveSessions[user]) {
          filteredActiveSessions[user] = ts as number;
        }
      }
    }
    serverDeletedUsers.forEach(un => {
      delete filteredActiveSessions[un];
    });

    // Check if current user on this client device must be force logged out
    const loggedInUser = localStorage.getItem("nila_logged_in_user_v1");
    if (loggedInUser) {
      const lower = loggedInUser.toLowerCase();
      const isMaster = lower === "limon2581444@gmail.com" || lower === "limon2581444@gmail";
      if (!isMaster) {
        const sessionStart = parseInt(localStorage.getItem("nila_session_start_v1") || "0", 10);
        const userRevokedAt = parseInt(state.configs?.[`nila_user_revoked_${lower}`] || "0", 10);
        const isDisabled = (state.disabledUsers || []).includes(lower) || state.userAccounts?.[lower]?.status === "disabled";
        
        const isSessionRevoked = (sessionsRevokedBefore > 0 && sessionStart <= sessionsRevokedBefore) ||
                                (userRevokedAt > 0 && sessionStart <= userRevokedAt);

        if (isSessionRevoked || isDisabled) {
          localStorage.removeItem("nila_logged_in_user_v1");
          localStorage.removeItem("nila_session_start_v1");
          delete filteredActiveSessions[loggedInUser];
          window.dispatchEvent(new CustomEvent("nila_force_logout", {
            detail: { reason: isDisabled ? "disabled" : "revoked" }
          }));
        }
      }
    }

    // 4. Merge pro users safely
    const proMap = new Map<string, any>();
    for (const e of (state.proUsers || [])) {
      const name = typeof e === "string" ? e : e?.username;
      if (name && !serverDeletedUsers.includes(name)) {
        proMap.set(name.toLowerCase(), e);
      }
    }
    for (const e of freshLocalPro) {
      const name = typeof e === "string" ? e : e?.username;
      if (name && !serverDeletedUsers.includes(name)) {
        const existing = proMap.get(name.toLowerCase());
        if (!existing) {
          proMap.set(name.toLowerCase(), e);
        } else {
          const expNew = typeof e === "object" && e.expiresAt ? e.expiresAt : 0;
          const expOld = typeof existing === "object" && existing.expiresAt ? existing.expiresAt : 0;
          if (expNew > expOld) {
            proMap.set(name.toLowerCase(), e);
          }
        }
      }
    }
    const filteredProUsers = Array.from(proMap.values());

    // 5. Merge support chats safely
    const filteredSupportChats = { ...(state.supportChats || {}) };
    for (const [user, chat] of Object.entries(freshLocalChats)) {
      if (!filteredSupportChats[user]) {
        filteredSupportChats[user] = chat;
      } else {
        const serverChat = filteredSupportChats[user];
        const clientChat = chat as any;
        const msgMap = new Map<string, any>();
        for (const m of (serverChat.messages || [])) if (m && m.id) msgMap.set(m.id, m);
        for (const m of (clientChat.messages || [])) if (m && m.id) msgMap.set(m.id, m);
        filteredSupportChats[user] = {
          messages: Array.from(msgMap.values()).sort((a, b) => a.timestamp - b.timestamp),
          unreadCountByUser: Math.max(serverChat.unreadCountByUser || 0, clientChat.unreadCountByUser || 0),
          unreadCountByAdmin: Math.max(serverChat.unreadCountByAdmin || 0, clientChat.unreadCountByAdmin || 0),
          lastUpdated: Math.max(serverChat.lastUpdated || 0, clientChat.lastUpdated || 0),
        };
      }
    }

    const filteredAnalysisLimits = { ...(state.analysisLimits || {}), ...freshLocalLimits };
    const filteredRegistrationTimes = { ...(state.registrationTimes || {}), ...freshLocalTimes };

    // Save back to local storage
    localStorage.setItem("nila_deleted_payments_v1", JSON.stringify(serverDeletedPayments));
    localStorage.setItem("nila_deleted_users_v1", JSON.stringify(serverDeletedUsers));

    localStorage.setItem("nila_registered_users_v2", JSON.stringify(filteredRegisteredUsers));
    localStorage.setItem("nila_submitted_payments_v1", JSON.stringify(filteredSubmittedPayments));
    localStorage.setItem("nila_active_sessions_v1", JSON.stringify(filteredActiveSessions));
    localStorage.setItem("nila_support_chats_v2", JSON.stringify(filteredSupportChats));
    localStorage.setItem("nila_analysis_limits_v1", JSON.stringify(filteredAnalysisLimits));
    localStorage.setItem("nila_pro_users_v1", JSON.stringify(filteredProUsers));
    localStorage.setItem("nila_registration_times_v1", JSON.stringify(filteredRegistrationTimes));

    if (state.disabledUsers) {
      localStorage.setItem("nila_disabled_users_v1", JSON.stringify(state.disabledUsers));
    }
    if (state.userAccounts) {
      localStorage.setItem("nila_user_accounts_v1", JSON.stringify(state.userAccounts));
    }
    if (state.adminRoles) {
      localStorage.setItem("nila_admin_roles_v1", JSON.stringify(state.adminRoles));
    }
    if (state.activityLogs) {
      localStorage.setItem("nila_activity_logs_v1", JSON.stringify(state.activityLogs));
    }

    if (state.configs) {
      for (const [key, val] of Object.entries(state.configs)) {
        localStorage.setItem(key, val as string);
      }
    }

    window.dispatchEvent(new Event("nila_settings_updated"));
  } catch (error) {
    // Graceful offline/network fallback without throwing noisy console errors
  } finally {
    isSyncing = false;
  }
}

export async function executeAdminAction(
  adminEmail: string,
  action: string,
  targetUser: string,
  data?: any
): Promise<{ success: boolean; state?: any; error?: string }> {
  try {
    const res = await fetch("/api/admin/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminEmail,
        action,
        targetUser,
        data,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || "Failed to execute action" };
    }

    const json = await res.json();
    if (json && json.state) {
      const state = json.state;
      if (state.submittedPayments) localStorage.setItem("nila_submitted_payments_v1", JSON.stringify(state.submittedPayments));
      if (state.proUsers) localStorage.setItem("nila_pro_users_v1", JSON.stringify(state.proUsers));
      if (state.disabledUsers) localStorage.setItem("nila_disabled_users_v1", JSON.stringify(state.disabledUsers));
      if (state.userAccounts) localStorage.setItem("nila_user_accounts_v1", JSON.stringify(state.userAccounts));
      if (state.adminRoles) localStorage.setItem("nila_admin_roles_v1", JSON.stringify(state.adminRoles));
      if (state.activityLogs) localStorage.setItem("nila_activity_logs_v1", JSON.stringify(state.activityLogs));
      if (state.activeSessions) localStorage.setItem("nila_active_sessions_v1", JSON.stringify(state.activeSessions));
      window.dispatchEvent(new Event("nila_settings_updated"));
      return { success: true, state };
    }
    return { success: true };
  } catch (err: any) {
    console.error("executeAdminAction error:", err);
    return { success: false, error: err.message };
  }
}

// Admin API client helpers
export async function fetchAdminStats(adminEmail: string): Promise<{ success: boolean; stats?: any; error?: string }> {
  try {
    const res = await fetch(`/api/admin/stats?adminEmail=${encodeURIComponent(adminEmail)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || `HTTP ${res.status}: Failed to fetch stats` };
    }
    const data = await res.json();
    return { success: true, stats: data.stats };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error loading stats" };
  }
}

export async function fetchAdminUsers(
  adminEmail: string,
  params: { page?: number; limit?: number; search?: string; filter?: string } = {}
): Promise<{ success: boolean; users?: any[]; total?: number; page?: number; totalPages?: number; error?: string }> {
  try {
    const query = new URLSearchParams({
      adminEmail,
      page: (params.page || 1).toString(),
      limit: (params.limit || 20).toString(),
      search: params.search || "",
      filter: params.filter || "ALL",
    });
    const res = await fetch(`/api/admin/users?${query.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || `HTTP ${res.status}: Failed to fetch users` };
    }
    const data = await res.json();
    return {
      success: true,
      users: data.users || [],
      total: data.total || 0,
      page: data.page || 1,
      totalPages: data.totalPages || 1,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error loading users" };
  }
}

export async function fetchAdminRequests(
  adminEmail: string,
  params: { page?: number; limit?: number; search?: string; filter?: string } = {}
): Promise<{ success: boolean; requests?: any[]; total?: number; page?: number; totalPages?: number; error?: string }> {
  try {
    const query = new URLSearchParams({
      adminEmail,
      page: (params.page || 1).toString(),
      limit: (params.limit || 20).toString(),
      search: params.search || "",
      filter: params.filter || "ALL",
    });
    const res = await fetch(`/api/admin/requests?${query.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || `HTTP ${res.status}: Failed to fetch requests` };
    }
    const data = await res.json();
    return {
      success: true,
      requests: data.requests || [],
      total: data.total || 0,
      page: data.page || 1,
      totalPages: data.totalPages || 1,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error loading requests" };
  }
}

export async function reviewPaymentRequest(
  adminEmail: string,
  requestId: string,
  action: "APPROVE" | "REJECT" | "UNDER_REVIEW",
  notes?: string
): Promise<{ success: boolean; request?: any; error?: string }> {
  try {
    const res = await fetch(`/api/admin/requests/${encodeURIComponent(requestId)}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminEmail, action, notes }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || `Failed to ${action} request` };
    }
    const data = await res.json();
    // Trigger sync to refresh local states
    syncWithServer();
    return { success: true, request: data.request };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error reviewing request" };
  }
}

// User Trial API
export async function fetchTrialStatus(email: string): Promise<{ success: boolean; trialStatus?: any; error?: string }> {
  try {
    const res = await fetch(`/api/trial/status?email=${encodeURIComponent(email)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || "Failed to fetch trial status" };
    }
    const data = await res.json();
    return { success: true, trialStatus: data.trialStatus };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error fetching trial status" };
  }
}

// Heartbeat & Presence API
export async function sendUserHeartbeat(email: string, sessionId?: string): Promise<{ online: boolean }> {
  try {
    const res = await fetch("/api/user/heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, sessionId }),
    });
    if (!res.ok) return { online: false };
    const data = await res.json();
    return { online: !!data.online };
  } catch {
    return { online: false };
  }
}

export function sendUserLeave(email: string) {
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify({ email })], { type: "application/json" });
      navigator.sendBeacon("/api/user/leave", blob);
    } else {
      fetch("/api/user/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {}
}

// User Payment Request Submission
export async function submitPaymentRequest(payload: {
  email: string;
  paymentMethod: string;
  network?: string;
  amount: number;
  transactionId: string;
  senderNumber: string;
}): Promise<{ success: boolean; request?: any; error?: string }> {
  try {
    const res = await fetch("/api/payment/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || "Failed to submit payment request" };
    }
    const data = await res.json();
    syncWithServer();
    return { success: true, request: data.request };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error submitting payment" };
  }
}

// Auth APIs
export async function registerUser(payload: {
  email: string;
  password: string;
  name?: string;
}): Promise<{ success: boolean; user?: any; trialStatus?: any; error?: string }> {
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || "Registration failed" };
    }
    const data = await res.json();
    syncWithServer();
    return { success: true, user: data.user, trialStatus: data.trialStatus };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error registering" };
  }
}

export async function loginUser(payload: {
  email: string;
  password: string;
  sessionId?: string;
}): Promise<{ success: boolean; user?: any; trialStatus?: any; error?: string }> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || "Login failed" };
    }
    const data = await res.json();
    syncWithServer();
    return { success: true, user: data.user, trialStatus: data.trialStatus };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error logging in" };
  }
}

