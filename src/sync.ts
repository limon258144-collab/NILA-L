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
];

export async function syncWithServer() {
  try {
    const registeredUsers = JSON.parse(localStorage.getItem("nila_registered_users_v2") || "{}");
    const submittedPayments = JSON.parse(localStorage.getItem("nila_submitted_payments_v1") || "[]");
    const activeSessions = JSON.parse(localStorage.getItem("nila_active_sessions_v1") || "{}");
    const supportChats = JSON.parse(localStorage.getItem("nila_support_chats_v2") || "{}");
    const analysisLimits = JSON.parse(localStorage.getItem("nila_analysis_limits_v1") || "{}");
    const proUsers = JSON.parse(localStorage.getItem("nila_pro_users_v1") || "[]");
    const deletedPayments = JSON.parse(localStorage.getItem("nila_deleted_payments_v1") || "[]");
    const deletedUsers = JSON.parse(localStorage.getItem("nila_deleted_users_v1") || "[]");
    const registrationTimes = JSON.parse(localStorage.getItem("nila_registration_times_v1") || "{}");

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
        registrationTimes,
      }),
    });

    if (!response.ok) {
      throw new Error(`Sync API failed: ${response.status}`);
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

    // 3. Merge active sessions safely
    const filteredActiveSessions = { ...(state.activeSessions || {}), ...freshLocalSessions };
    serverDeletedUsers.forEach(un => {
      delete filteredActiveSessions[un];
    });

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

    if (state.configs) {
      for (const [key, val] of Object.entries(state.configs)) {
        localStorage.setItem(key, val as string);
      }
    }

    window.dispatchEvent(new Event("nila_settings_updated"));
  } catch (error) {
    console.error("[Sync with Server Error]:", error);
  }
}
