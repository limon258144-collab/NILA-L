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
      }),
    });

    if (!response.ok) {
      throw new Error(`Sync API failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data || !data.state) return;

    const state = data.state;

    localStorage.setItem("nila_registered_users_v2", JSON.stringify(state.registeredUsers || {}));
    localStorage.setItem("nila_submitted_payments_v1", JSON.stringify(state.submittedPayments || []));
    localStorage.setItem("nila_active_sessions_v1", JSON.stringify(state.activeSessions || {}));
    localStorage.setItem("nila_support_chats_v2", JSON.stringify(state.supportChats || {}));
    localStorage.setItem("nila_analysis_limits_v1", JSON.stringify(state.analysisLimits || {}));
    localStorage.setItem("nila_pro_users_v1", JSON.stringify(state.proUsers || []));

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
