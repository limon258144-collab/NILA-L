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

    // Filter state items using the merged deleted lists
    const filteredRegisteredUsers = { ...(state.registeredUsers || {}) };
    serverDeletedUsers.forEach(un => {
      delete filteredRegisteredUsers[un];
    });

    const filteredActiveSessions = { ...(state.activeSessions || {}) };
    serverDeletedUsers.forEach(un => {
      delete filteredActiveSessions[un];
    });

    const filteredProUsers = (state.proUsers || []).filter((e: any) => {
      const name = typeof e === "string" ? e : e?.username;
      return name && !serverDeletedUsers.includes(name);
    });

    const filteredSubmittedPayments = (state.submittedPayments || []).filter((p: any) => {
      return p && p.id && !serverDeletedPayments.includes(p.id) && !serverDeletedUsers.includes(p.username);
    });

    // Save back to local storage
    localStorage.setItem("nila_deleted_payments_v1", JSON.stringify(serverDeletedPayments));
    localStorage.setItem("nila_deleted_users_v1", JSON.stringify(serverDeletedUsers));

    localStorage.setItem("nila_registered_users_v2", JSON.stringify(filteredRegisteredUsers));
    localStorage.setItem("nila_submitted_payments_v1", JSON.stringify(filteredSubmittedPayments));
    localStorage.setItem("nila_active_sessions_v1", JSON.stringify(filteredActiveSessions));
    localStorage.setItem("nila_support_chats_v2", JSON.stringify(state.supportChats || {}));
    localStorage.setItem("nila_analysis_limits_v1", JSON.stringify(state.analysisLimits || {}));
    localStorage.setItem("nila_pro_users_v1", JSON.stringify(filteredProUsers));

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
