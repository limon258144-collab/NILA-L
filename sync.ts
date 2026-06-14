export async function syncWithServer(updatePayload?: any) {
  try {
    let regUsers = {};
    try {
      const stored = localStorage.getItem("nila_registered_users_v2");
      if (stored) regUsers = JSON.parse(stored);
    } catch (err) {}

    let sessions = {};
    try {
      const stored = localStorage.getItem("nila_active_sessions_v1");
      if (stored) sessions = JSON.parse(stored);
    } catch (err) {}

    let proUsersList = [];
    try {
      const stored = localStorage.getItem("nila_pro_users_v1");
      if (stored) proUsersList = JSON.parse(stored);
    } catch (err) {}

    let paymentsList = [];
    try {
      const stored = localStorage.getItem("nila_submitted_payments_v1");
      if (stored) paymentsList = JSON.parse(stored);
    } catch (err) {}

    const configs: Record<string, string> = {};
    const configKeys = [
      "nila_custom_telegram_v1",
      "nila_custom_owner1_v1",
      "nila_custom_owner2_v1",
      "nila_custom_winrate_v1",
      "nila_custom_announcement_v1",
      "nila_custom_usdt_v1",
      "nila_custom_trx_v1",
      "nila_custom_ltc_v1",
      "nila_custom_bkash_inst_v1",
      "nila_custom_crypto_inst_v1"
    ];
    configKeys.forEach(key => {
      const val = localStorage.getItem(key);
      if (val) configs[key] = val;
    });

    const fullPayload = {
      registeredUsers: regUsers,
      activeSessions: sessions,
      proUsers: proUsersList,
      submittedPayments: paymentsList,
      customConfigs: configs,
      ...updatePayload
    };

    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullPayload)
    });

    if (res.ok) {
      const data = await res.json();
      const state = data.state || data;

      let changed = false;

      const safeStore = (key: string, newValueStr: string) => {
        const current = localStorage.getItem(key);
        if (current !== newValueStr) {
          localStorage.setItem(key, newValueStr);
          changed = true;
        }
      };

      if (state.registeredUsers) {
        safeStore("nila_registered_users_v2", JSON.stringify(state.registeredUsers));
      }
      if (state.activeSessions) {
        safeStore("nila_active_sessions_v1", JSON.stringify(state.activeSessions));
      }
      if (state.proUsers) {
        safeStore("nila_pro_users_v1", JSON.stringify(state.proUsers));
      }
      if (state.submittedPayments) {
        safeStore("nila_submitted_payments_v1", JSON.stringify(state.submittedPayments));
      }
      if (state.customConfigs) {
        Object.entries(state.customConfigs).forEach(([key, val]) => {
          safeStore(key, String(val));
        });
      }

      if (changed || updatePayload) {
        window.dispatchEvent(new Event("nila_settings_updated"));
      }

      return state;
    }
  } catch (error) {
    console.error("[Sync Util] Error syncing with server:", error);
  }
  return null;
}

export async function submitPaymentDirectly(payment: any) {
  try {
    const res = await fetch("/api/payment/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment })
    });
    if (res.ok) {
      const data = await res.json();
      const state = data.state || data;
      if (state.submittedPayments) {
        localStorage.setItem("nila_submitted_payments_v1", JSON.stringify(state.submittedPayments));
        window.dispatchEvent(new Event("nila_settings_updated"));
      }
      return state;
    }
  } catch (error) {
    console.error("[Submit Direct Error]:", error);
  }
  return null;
}

export async function verifyPaymentDirectly(id: string, status: "approved" | "rejected") {
  try {
    const res = await fetch("/api/payment/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    if (res.ok) {
      const data = await res.json();
      const state = data.state || data;
      if (state.submittedPayments) {
        localStorage.setItem("nila_submitted_payments_v1", JSON.stringify(state.submittedPayments));
      }
      if (state.proUsers) {
        localStorage.setItem("nila_pro_users_v1", JSON.stringify(state.proUsers));
      }
      window.dispatchEvent(new Event("nila_settings_updated"));
      return state;
    }
  } catch (error) {
    console.error("[Verify Direct Error]:", error);
  }
  return null;
}

export async function deletePaymentDirectly(id: string) {
  try {
    const res = await fetch("/api/payment/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    if (res.ok) {
      const data = await res.json();
      const state = data.state || data;
      if (state.submittedPayments) {
        localStorage.setItem("nila_submitted_payments_v1", JSON.stringify(state.submittedPayments));
        window.dispatchEvent(new Event("nila_settings_updated"));
      }
      return state;
    }
  } catch (error) {
    console.error("[Delete Direct Error]:", error);
  }
  return null;
}
