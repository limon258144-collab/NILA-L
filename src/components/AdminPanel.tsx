import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Users, 
  CreditCard, 
  Settings, 
  ArrowLeft, 
  Sparkles, 
  Sliders, 
  MessageSquare, 
  Activity, 
  BarChart2, 
  Shield, 
  Send,
  MessageCircle,
  RefreshCw,
  LogOut
} from "lucide-react";
import { 
  syncWithServer, 
  executeAdminAction,
  fetchAdminStats,
  fetchAdminUsers,
  fetchAdminRequests,
  reviewPaymentRequest
} from "../sync";
import { UserAccount, PaymentRequestItem, ActivityLogItem, AdminRoleItem, AdminDashboardStats } from "../types";
import AdminStatsOverview from "./admin/AdminStatsOverview";
import AdminPaymentRequests from "./admin/AdminPaymentRequests";
import AdminUsersManagement from "./admin/AdminUsersManagement";
import AdminRoleManagement from "./admin/AdminRoleManagement";
import AdminAnalytics from "./admin/AdminAnalytics";
import AdminActivityLogs from "./admin/AdminActivityLogs";

interface AdminPanelProps {
  language: "bn" | "en";
  onBackToApp: () => void;
  currentUser?: string | null;
  onLogout?: () => void;
}

export default function AdminPanel({ language, onBackToApp, currentUser, onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "payments" | "users" | "admins" | "analytics" | "activity" | "support" | "settings">("overview");
  const [userFilter, setUserFilter] = useState<string>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "pending" | "under_review" | "approved" | "rejected" | "disabled">("all");
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Server stats state
  const [adminStats, setAdminStats] = useState<AdminDashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Database state
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
  const [submittedPayments, setSubmittedPayments] = useState<PaymentRequestItem[]>([]);
  const [adminRoles, setAdminRoles] = useState<Record<string, AdminRoleItem>>({});
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [supportChats, setSupportChats] = useState<Record<string, any>>({});
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState("");

  // App settings state
  const [adminTelegram, setAdminTelegram] = useState("https://t.me/qtx8881");
  const [globalAnnouncement, setGlobalAnnouncement] = useState("যেকোনো প্রয়োজনে নিচে দেওয়া টেলিগ্রাম লিংকে মেসেজ করুন");
  const [adminUsdt, setAdminUsdt] = useState("TX2iZJ9Z8p9M6k9y9n9t9Y9R9C9v9x");
  const [adminTrx, setAdminTrx] = useState("TX2iZJ9Z8p9M6k9y9n9t9Y9R9C9v9x");
  const [adminLtc, setAdminLtc] = useState("ইনবক্সে যোগাযোগ করুন");
  const [adminBkashInst, setAdminBkashInst] = useState("* পেমেন্ট নম্বর পেতে ইনবক্সে যোগাযোগ করুন এবং লেনদেন সম্পন্ন করুন।");

  const adminEmail = (currentUser || "limon2581444@gmail.com").toLowerCase();
  const isSuperAdmin = adminEmail === "limon2581444@gmail.com" || adminEmail === "limon2581444@gmail" || adminRoles[adminEmail]?.role === "SUPER_ADMIN";

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadLocalState = () => {
    try {
      const accountsObj = JSON.parse(localStorage.getItem("nila_user_accounts_v1") || "{}");
      const accountsArr: UserAccount[] = Object.values(accountsObj);
      setUserAccounts(accountsArr);

      const payments: PaymentRequestItem[] = JSON.parse(localStorage.getItem("nila_submitted_payments_v1") || "[]");
      setSubmittedPayments(payments.filter((p) => p && p.id && p.id.length >= 6));

      const roles = JSON.parse(localStorage.getItem("nila_admin_roles_v1") || "{}");
      setAdminRoles(roles);

      const logs = JSON.parse(localStorage.getItem("nila_activity_logs_v1") || "[]");
      setActivityLogs(logs);

      const chats = JSON.parse(localStorage.getItem("nila_support_chats_v2") || "{}");
      setSupportChats(chats);

      let storedTg = localStorage.getItem("nila_custom_telegram_v1");
      if (storedTg === "https://t.me/addmineanlice" || storedTg === "https://t.me/korimtrader_vip" || storedTg === "https://t.me/jayedbhai_12" || storedTg === "https://t.me/TIN_KOMASTER" || !storedTg) {
        storedTg = "https://t.me/qtx8881";
        localStorage.setItem("nila_custom_telegram_v1", "https://t.me/qtx8881");
      }
      if (storedTg) setAdminTelegram(storedTg);
      const storedAnn = localStorage.getItem("nila_custom_announcement_v1");
      if (storedAnn) setGlobalAnnouncement(storedAnn);
      const storedUsdt = localStorage.getItem("nila_custom_usdt_v1");
      if (storedUsdt) setAdminUsdt(storedUsdt);
      const storedTrx = localStorage.getItem("nila_custom_trx_v1");
      if (storedTrx) setAdminTrx(storedTrx);
      const storedLtc = localStorage.getItem("nila_custom_ltc_v1");
      if (storedLtc && storedLtc !== "01767093032" && storedLtc !== "01700000000" && storedLtc !== "01568760651") {
        setAdminLtc(storedLtc);
      } else {
        setAdminLtc("ইনবক্সে যোগাযোগ করুন");
        localStorage.setItem("nila_custom_ltc_v1", "ইনবক্সে যোগাযোগ করুন");
      }
      const storedBkashInst = localStorage.getItem("nila_custom_bkash_inst_v1");
      if (storedBkashInst) setAdminBkashInst(storedBkashInst);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchServerData = async () => {
    setStatsLoading(true);
    try {
      const [statsRes, usersRes, reqsRes] = await Promise.all([
        fetchAdminStats(adminEmail),
        fetchAdminUsers(adminEmail, { limit: 100 }),
        fetchAdminRequests(adminEmail, { limit: 100 }),
      ]);

      if (statsRes.success && statsRes.stats) {
        setAdminStats(statsRes.stats);
        setStatsError(null);
      } else if (statsRes.error) {
        setStatsError(statsRes.error);
      }

      if (usersRes.success && usersRes.users) {
        setUserAccounts(usersRes.users);
      }

      if (reqsRes.success && reqsRes.requests) {
        setSubmittedPayments(reqsRes.requests);
      }
    } catch (err: any) {
      setStatsError(err.message || "Failed to load server data");
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadLocalState();
    fetchServerData();
    syncWithServer();

    // Auto-refresh stats every 5 seconds
    const interval = setInterval(() => {
      fetchServerData();
      syncWithServer().then(() => loadLocalState());
    }, 5000);

    const handleUpdate = () => {
      loadLocalState();
      fetchServerData();
    };

    window.addEventListener("nila_settings_updated", handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener("nila_settings_updated", handleUpdate);
    };
  }, [adminEmail]);

  // Card click filter routing
  const handleFilterCardClick = (target: string) => {
    switch (target) {
      case "all-users":
        setUserFilter("ALL");
        setActiveTab("users");
        break;
      case "online-users":
        setUserFilter("ONLINE");
        setActiveTab("users");
        break;
      case "offline-users":
        setUserFilter("OFFLINE");
        setActiveTab("users");
        break;
      case "pending-payments":
        setPaymentFilter("pending");
        setActiveTab("payments");
        break;
      case "under-review-payments":
        setPaymentFilter("under_review");
        setActiveTab("payments");
        break;
      case "approved-payments":
        setPaymentFilter("approved");
        setActiveTab("payments");
        break;
      case "rejected-payments":
        setPaymentFilter("rejected");
        setActiveTab("payments");
        break;
      case "active-vip":
        setUserFilter("PRO ACTIVE");
        setActiveTab("users");
        break;
      case "expired-vip":
        setUserFilter("EXPIRED VIP");
        setActiveTab("users");
        break;
      case "signals-today":
        setActiveTab("overview");
        break;
      default:
        setActiveTab("overview");
        break;
    }
  };

  // Action Handlers
  const handleApprovePayment = async (p: PaymentRequestItem) => {
    setIsSyncing(true);
    const res = await reviewPaymentRequest(adminEmail, p.id, "APPROVE");
    setIsSyncing(false);
    if (res.success) {
      showToast(`Payment approved! VIP activated for ${p.username}`);
      fetchServerData();
      loadLocalState();
    } else {
      showToast(`Failed: ${res.error}`);
    }
  };

  const handleUnderReviewPayment = async (p: PaymentRequestItem) => {
    setIsSyncing(true);
    const res = await reviewPaymentRequest(adminEmail, p.id, "UNDER_REVIEW");
    setIsSyncing(false);
    if (res.success) {
      showToast(`Request marked as Under Review.`);
      fetchServerData();
      loadLocalState();
    } else {
      showToast(`Failed: ${res.error}`);
    }
  };

  const handleRejectPayment = async (p: PaymentRequestItem) => {
    setIsSyncing(true);
    const res = await reviewPaymentRequest(adminEmail, p.id, "REJECT");
    setIsSyncing(false);
    if (res.success) {
      showToast(`Payment rejected for ${p.username}`);
      fetchServerData();
      loadLocalState();
    } else {
      showToast(`Failed: ${res.error}`);
    }
  };

  const handleDisablePayment = async (p: PaymentRequestItem) => {
    return handleRejectPayment(p);
  };

  const handleActivateUser = async (email: string) => {
    const res = await executeAdminAction(adminEmail, "ACTIVATE_USER", email);
    if (res.success) {
      showToast(`Account activated for ${email}`);
      loadLocalState();
    }
  };

  const handleDeactivateUser = async (email: string) => {
    const res = await executeAdminAction(adminEmail, "DEACTIVATE_USER", email);
    if (res.success) {
      showToast(`Account deactivated for ${email}`);
      loadLocalState();
    }
  };

  const handleDisableUser = async (email: string) => {
    const res = await executeAdminAction(adminEmail, "DISABLE_USER", email);
    if (res.success) {
      showToast(`Account disabled and access blocked for ${email}`);
      loadLocalState();
    }
  };

  const handleActivatePro = async (email: string) => {
    const res = await executeAdminAction(adminEmail, "ACTIVATE_PRO", email, { days: 30 });
    if (res.success) {
      showToast(`PRO membership activated for 30 days for ${email}`);
      loadLocalState();
    }
  };

  const handleDeactivatePro = async (email: string) => {
    const res = await executeAdminAction(adminEmail, "DEACTIVATE_PRO", email);
    if (res.success) {
      showToast(`PRO membership removed for ${email}`);
      loadLocalState();
    }
  };

  const handleResetPassword = async (email: string, newPass: string) => {
    const res = await executeAdminAction(adminEmail, "RESET_PASSWORD", email, { newPassword: newPass });
    if (res.success) {
      showToast(`Password successfully reset for ${email}!`);
      loadLocalState();
    }
  };

  const handleLogoutAllMembers = async () => {
    setIsSyncing(true);
    const res = await executeAdminAction(adminEmail, "LOGOUT_ALL_MEMBERS", "ALL_MEMBERS");
    setIsSyncing(false);
    if (res.success) {
      showToast(
        language === "bn"
          ? "পূর্বের সকল মেম্বারকে সফলভাবে লগআউট করা হয়েছে!"
          : "All previous member sessions have been successfully logged out!"
      );
      loadLocalState();
    } else {
      showToast(`Failed: ${res.error}`);
    }
  };

  const handleLogoutUser = async (email: string) => {
    setIsSyncing(true);
    const res = await executeAdminAction(adminEmail, "LOGOUT_USER", email);
    setIsSyncing(false);
    if (res.success) {
      showToast(
        language === "bn"
          ? `${email} মেম্বারকে সফলভাবে লগআউট করা হয়েছে!`
          : `User ${email} logged out successfully!`
      );
      loadLocalState();
    } else {
      showToast(`Failed: ${res.error}`);
    }
  };

  const handleAddAdmin = async (admEmail: string, name: string, role: "SUPER_ADMIN" | "ADMIN") => {
    const res = await executeAdminAction(adminEmail, "ADD_ADMIN", admEmail, { email: admEmail, name, role });
    if (res.success) {
      showToast(`Added ${role}: ${admEmail}`);
      loadLocalState();
    }
  };

  const handleDisableAdmin = async (admEmail: string) => {
    const res = await executeAdminAction(adminEmail, "DISABLE_ADMIN", admEmail);
    if (res.success) {
      showToast(`Disabled admin account: ${admEmail}`);
      loadLocalState();
    }
  };

  const handleRemoveAdmin = async (admEmail: string) => {
    const res = await executeAdminAction(adminEmail, "REMOVE_ADMIN", admEmail);
    if (res.success) {
      showToast(`Removed admin role: ${admEmail}`);
      loadLocalState();
    }
  };

  const handleSaveConfig = (key: string, val: string, label: string) => {
    localStorage.setItem(key, val);
    window.dispatchEvent(new Event("nila_settings_updated"));
    syncWithServer();
    showToast(`${label} saved successfully!`);
  };

  const handleAdminSendMessage = () => {
    if (!adminReplyText.trim() || !selectedChatUser) return;
    try {
      const chats = JSON.parse(localStorage.getItem("nila_support_chats_v2") || "{}");
      const userChat = chats[selectedChatUser] || { messages: [], unreadCountByAdmin: 0, unreadCountByUser: 0 };
      const newMsg = {
        id: "msg_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        sender: "admin",
        text: adminReplyText.trim(),
        timestamp: Date.now()
      };
      if (!userChat.messages) userChat.messages = [];
      userChat.messages.push(newMsg);
      userChat.unreadCountByUser = (userChat.unreadCountByUser || 0) + 1;
      userChat.unreadCountByAdmin = 0;
      userChat.lastUpdated = Date.now();
      chats[selectedChatUser] = userChat;
      localStorage.setItem("nila_support_chats_v2", JSON.stringify(chats));
      setAdminReplyText("");
      setSupportChats(chats);
      window.dispatchEvent(new Event("nila_settings_updated"));
      syncWithServer();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in text-left">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] px-4 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-xs shadow-2xl animate-bounce flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-300" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Panel Header */}
      <div className="p-3.5 rounded-2xl bg-[#0f1118] border border-indigo-500/20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBackToApp}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-white transition active:scale-90 cursor-pointer"
            title="Back to App"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                SUPER ADMIN PANEL
              </h2>
              {isSuperAdmin && (
                <span className="px-1.5 py-0.2 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[8.5px] font-black uppercase font-mono">
                  FULL PRIVILEGES
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Logged in: <span className="text-indigo-300 font-bold">{adminEmail}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsSyncing(true);
              syncWithServer().then(() => {
                loadLocalState();
                setIsSyncing(false);
                showToast("Database synchronized!");
              });
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer active:scale-95"
            title="Force Sync Database"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-indigo-400" : ""}`} />
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="px-2.5 py-1.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 hover:bg-rose-900/70 hover:text-white transition cursor-pointer active:scale-95 flex items-center gap-1.5 text-xs font-bold shadow-md shadow-rose-950/40"
              title={language === "bn" ? "লগ আউট" : "Log Out"}
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-[11px] font-extrabold">{language === "bn" ? "লগআউট" : "Logout"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === "overview"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === "payments"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Payments</span>
          {(adminStats?.totalPendingPayments ?? submittedPayments.filter(p => p.status === "PENDING" || p.status === "pending").length) > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-black flex items-center justify-center animate-pulse">
              {adminStats?.totalPendingPayments ?? submittedPayments.filter(p => p.status === "PENDING" || p.status === "pending").length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === "users"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Users</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("admins")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === "admins"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Admins</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === "analytics"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Analytics</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("activity")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === "activity"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Logs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("support")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === "support"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Support</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === "settings"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "overview" && (
        <AdminStatsOverview
          stats={adminStats}
          language={language}
          onFilterCardClick={handleFilterCardClick}
          isSyncing={isSyncing}
          isLoading={statsLoading}
          errorMessage={statsError}
          onRefresh={fetchServerData}
        />
      )}

      {activeTab === "payments" && (
        <AdminPaymentRequests
          payments={submittedPayments}
          language={language}
          activeFilter={paymentFilter}
          onFilterChange={setPaymentFilter}
          onApprove={handleApprovePayment}
          onDisable={handleDisablePayment}
          onUnderReview={handleUnderReviewPayment}
          onReject={handleRejectPayment}
          isActionLoading={isSyncing}
        />
      )}

      {activeTab === "users" && (
        <AdminUsersManagement
          users={userAccounts}
          payments={submittedPayments}
          language={language}
          activeFilter={userFilter}
          onFilterChange={setUserFilter}
          onActivateUser={handleActivateUser}
          onDeactivateUser={handleDeactivateUser}
          onDisableUser={handleDisableUser}
          onActivatePro={handleActivatePro}
          onDeactivatePro={handleDeactivatePro}
          onResetPassword={handleResetPassword}
          onLogoutAllMembers={handleLogoutAllMembers}
          onLogoutUser={handleLogoutUser}
          onAddUser={async (email, pass, name) => {
            const usersObj = JSON.parse(localStorage.getItem("nila_registered_users_v2") || "{}");
            usersObj[email] = pass;
            localStorage.setItem("nila_registered_users_v2", JSON.stringify(usersObj));
            await executeAdminAction(adminEmail, "ACTIVATE_USER", email, { name });
            showToast(`User ${email} created!`);
            loadLocalState();
          }}
        />
      )}

      {activeTab === "admins" && (
        <AdminRoleManagement
          adminRoles={adminRoles}
          currentAdminEmail={adminEmail}
          isSuperAdmin={isSuperAdmin}
          language={language}
          onAddAdmin={handleAddAdmin}
          onDisableAdmin={handleDisableAdmin}
          onRemoveAdmin={handleRemoveAdmin}
        />
      )}

      {activeTab === "analytics" && (
        <AdminAnalytics
          users={userAccounts}
          payments={submittedPayments}
          language={language}
        />
      )}

      {activeTab === "activity" && (
        <AdminActivityLogs
          logs={activityLogs}
          language={language}
        />
      )}

      {activeTab === "support" && (
        <div className="space-y-4">
          <div className="pb-2 border-b border-slate-800">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              Live User Support Hub
            </h3>
            <p className="text-[11px] text-slate-400">Direct message interface with app users.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* User list */}
            <div className="p-2 rounded-2xl bg-[#0c0e14] border border-slate-800 space-y-1.5 max-h-80 overflow-y-auto custom-scrollbar">
              {Object.keys(supportChats).length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 text-center">No active chats.</p>
              ) : (
                Object.entries(supportChats).map(([user, chat]: [string, any], idx) => (
                  <button
                    key={`support_chat_${user}_${idx}`}
                    type="button"
                    onClick={() => setSelectedChatUser(user)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition cursor-pointer ${
                      selectedChatUser === user
                        ? "bg-indigo-950/40 border-indigo-500/50 text-white"
                        : "bg-slate-900/60 border-slate-800 text-slate-300 hover:text-white"
                    }`}
                  >
                    <div className="font-bold truncate">{user}</div>
                    <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                      <span>{chat.messages?.length || 0} messages</span>
                      {chat.unreadCountByAdmin > 0 && (
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Chat Box */}
            <div className="sm:col-span-2 p-3 rounded-2xl bg-[#0c0e14] border border-slate-800 flex flex-col justify-between h-80">
              {selectedChatUser ? (
                <>
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 mb-2">
                    {(supportChats[selectedChatUser]?.messages || []).map((m: any) => (
                      <div
                        key={m.id}
                        className={`p-2 rounded-xl text-xs max-w-[80%] ${
                          m.sender === "admin"
                            ? "bg-indigo-600 text-white ml-auto"
                            : "bg-slate-800 text-slate-200"
                        }`}
                      >
                        <p>{m.text}</p>
                        <span className="text-[8px] opacity-70 block text-right mt-0.5">
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAdminSendMessage();
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={adminReplyText}
                      onChange={(e) => setAdminReplyText(e.target.value)}
                      placeholder="Type reply..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-slate-500">
                  Select a user chat from the left to reply
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-4">
          <div className="pb-2 border-b border-slate-800">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              App Configurations & Wallets
            </h3>
            <p className="text-[11px] text-slate-400">Configure global receiver wallets, telegram links, and notice texts.</p>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-[#0c0e14] border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Telegram Group / Admin Contact Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={adminTelegram}
                  onChange={(e) => setAdminTelegram(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => handleSaveConfig("nila_custom_telegram_v1", adminTelegram, "Telegram Link")}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#0c0e14] border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300 block">bKash Personal Receiver Number</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={adminLtc}
                  onChange={(e) => setAdminLtc(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => handleSaveConfig("nila_custom_ltc_v1", adminLtc, "bKash Number")}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#0c0e14] border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300 block">USDT (TRC-20) Receiver Wallet Address</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={adminUsdt}
                  onChange={(e) => setAdminUsdt(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => handleSaveConfig("nila_custom_usdt_v1", adminUsdt, "USDT Address")}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#0c0e14] border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Global Broadcast Announcement</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={globalAnnouncement}
                  onChange={(e) => setGlobalAnnouncement(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => handleSaveConfig("nila_custom_announcement_v1", globalAnnouncement, "Announcement")}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
