import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Users, 
  Trash2, 
  Key, 
  Plus, 
  Settings, 
  Megaphone,
  Radio,
  ExternalLink,
  ArrowLeft,
  Check,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  HelpCircle,
  X
} from "lucide-react";
import { motion } from "motion/react";

interface AdminPanelProps {
  language: "bn" | "en";
  onBackToApp: () => void;
}

export default function AdminPanel({ language, onBackToApp }: AdminPanelProps) {
  const [users, setUsers] = useState<Record<string, string>>({});
  const [activeSessions, setActiveSessions] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  
  // Create User state
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [adminAlertMsg, setAdminAlertMsg] = useState<string | null>(null);

  // App variables/settings form state
  const [adminTelegram, setAdminTelegram] = useState("https://t.me/addmineanlice");
  const [adminOwner1, setAdminOwner1] = useState("nila\\ldp.onar");
  const [adminOwner2, setAdminOwner2] = useState("korim debolopar");
  const [adminWinRate, setAdminWinRate] = useState("98%");
  const [globalAnnouncement, setGlobalAnnouncement] = useState("যেকোনো প্রয়োজনে নিচে দেওয়া টেলিগ্রাম লিংকে মেসেজ করুন");
  const [adminUsdt, setAdminUsdt] = useState("TX2iZJ9Z8p9M6k9y9n9t9Y9R9C9v9x");
  const [adminTrx, setAdminTrx] = useState("TX2iZJ9Z8p9M6k9y9n9t9Y9R9C9v9x");
  const [adminLtc, setAdminLtc] = useState("01700000000");
  const [adminBkashInst, setAdminBkashInst] = useState("* এই বিকাশ পার্সোনাল নাম্বারে সমপরিমাণ টাকা Send Money করুন।");
  const [adminCryptoInst, setAdminCryptoInst] = useState("* Send exactly the payment amount to this receiver wallet.");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [submittedPayments, setSubmittedPayments] = useState<any[]>([]);

  // Load registered users and editable variables
  const loadUsersAndStats = () => {
    try {
      // 1. Get users
      const storedUsers = localStorage.getItem("nila_registered_users_v2");
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      } else {
        // Build with empty list as requested by user
        const defaultList = {};
        setUsers(defaultList);
        localStorage.setItem("nila_registered_users_v2", JSON.stringify(defaultList));
      }

      // 2. Load configurations
      const storedTelegram = localStorage.getItem("nila_custom_telegram_v1");
      if (storedTelegram) setAdminTelegram(storedTelegram);

      const storedOwner1 = localStorage.getItem("nila_custom_owner1_v1");
      if (storedOwner1) setAdminOwner1(storedOwner1);

      const storedOwner2 = localStorage.getItem("nila_custom_owner2_v1");
      if (storedOwner2) setAdminOwner2(storedOwner2);

      const storedWinRate = localStorage.getItem("nila_custom_winrate_v1");
      if (storedWinRate) setAdminWinRate(storedWinRate);

      const storedAnnounce = localStorage.getItem("nila_custom_announcement_v1");
      if (storedAnnounce) setGlobalAnnouncement(storedAnnounce);

      const storedUsdt = localStorage.getItem("nila_custom_usdt_v1");
      if (storedUsdt) setAdminUsdt(storedUsdt);

      const storedTrx = localStorage.getItem("nila_custom_trx_v1");
      if (storedTrx) setAdminTrx(storedTrx);

      const storedLtc = localStorage.getItem("nila_custom_ltc_v1");
      if (storedLtc) setAdminLtc(storedLtc);

      const storedBkashInst = localStorage.getItem("nila_custom_bkash_inst_v1");
      if (storedBkashInst) setAdminBkashInst(storedBkashInst);

      const storedCryptoInst = localStorage.getItem("nila_custom_crypto_inst_v1");
      if (storedCryptoInst) setAdminCryptoInst(storedCryptoInst);

      try {
        const storedPayments = localStorage.getItem("nila_submitted_payments_v1") || "[]";
        setSubmittedPayments(JSON.parse(storedPayments));
      } catch (err) {
        setSubmittedPayments([]);
      }

      // 3. Load active sessions
      const storedSessions = localStorage.getItem("nila_active_sessions_v1");
      if (storedSessions) {
        setActiveSessions(JSON.parse(storedSessions));
      } else {
        const defaultSessions: Record<string, number> = {};
        const loggedInUser = localStorage.getItem("nila_logged_in_user_v1");
        if (loggedInUser) {
          defaultSessions[loggedInUser] = Date.now();
        } else {
          defaultSessions["admin"] = Date.now();
        }
        setActiveSessions(defaultSessions);
        localStorage.setItem("nila_active_sessions_v1", JSON.stringify(defaultSessions));
      }

    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadUsersAndStats();
    
    // Listen for custom event trigger to synchronize inside the SPA instantly
    window.addEventListener("nila_settings_updated", loadUsersAndStats);
    return () => {
      window.removeEventListener("nila_settings_updated", loadUsersAndStats);
    };
  }, []);

  // Handle Save variables
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("nila_custom_telegram_v1", adminTelegram);
      localStorage.setItem("nila_custom_owner1_v1", adminOwner1);
      localStorage.setItem("nila_custom_owner2_v1", adminOwner2);
      localStorage.setItem("nila_custom_winrate_v1", adminWinRate);
      localStorage.setItem("nila_custom_announcement_v1", globalAnnouncement);
      localStorage.setItem("nila_custom_usdt_v1", adminUsdt);
      localStorage.setItem("nila_custom_trx_v1", adminTrx);
      localStorage.setItem("nila_custom_ltc_v1", adminLtc);
      localStorage.setItem("nila_custom_bkash_inst_v1", adminBkashInst);
      localStorage.setItem("nila_custom_crypto_inst_v1", adminCryptoInst);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      
      // Dispatch storage or custom event to reload header/result components across SPA in real-time
      window.dispatchEvent(new Event("nila_settings_updated"));
    } catch (e) {
      console.error("Config save failed", e);
    }
  };

  // Handle Register user from admin panel
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    const cleanUsername = newUsername.trim().toLowerCase();
    if (!cleanUsername || !newPassword) {
      setCreateError(language === "bn" ? "ইউজারনেম এবং পাসওয়ার্ড দুটিই দিন" : "Fill in both fields");
      return;
    }

    if (users[cleanUsername]) {
      setCreateError(language === "bn" ? "এই ইউজারনেম ইতিমধ্যে বিদ্যমান!" : "Username already exists");
      return;
    }

    const updated = { ...users, [cleanUsername]: newPassword };
    localStorage.setItem("nila_registered_users_v2", JSON.stringify(updated));
    setUsers(updated);
    
    setNewUsername("");
    setNewPassword("");
    setCreateSuccess(
      language === "bn"
        ? `ইউজার '${cleanUsername}' সফলভাবে তৈরি হয়েছে!`
        : `User '${cleanUsername}' created successfully!`
    );
    setTimeout(() => setCreateSuccess(null), 3000);
  };

  // Handle Delete User
  const handleDeleteUser = (usernameToDelete: string) => {
    if (usernameToDelete === "admin" || usernameToDelete === "00000000000") {
      setAdminAlertMsg(language === "bn" ? "প্রধান এডমিন অ্যাকাউন্ট ডিলিট করা সম্ভব নয়!" : "Main admin cannot be deleted!");
      return;
    }
    setUserToDelete(usernameToDelete);
  };

  const handleApprovePayment = (payment: any) => {
    try {
      const storedPayments = localStorage.getItem("nila_submitted_payments_v1") || "[]";
      const payments = JSON.parse(storedPayments);
      const updatedPayments = payments.map((p: any) => {
        if (p.id === payment.id) {
          return { ...p, status: "approved" };
        }
        return p;
      });
      localStorage.setItem("nila_submitted_payments_v1", JSON.stringify(updatedPayments));
      setSubmittedPayments(updatedPayments);

      const proUsersStr = localStorage.getItem("nila_pro_users_v1") || "[]";
      const proUsers: string[] = JSON.parse(proUsersStr);
      if (!proUsers.includes(payment.username.toLowerCase())) {
        proUsers.push(payment.username.toLowerCase());
      }
      localStorage.setItem("nila_pro_users_v1", JSON.stringify(proUsers));

      window.dispatchEvent(new Event("nila_settings_updated"));
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectPayment = (payment: any) => {
    try {
      const storedPayments = localStorage.getItem("nila_submitted_payments_v1") || "[]";
      const payments = JSON.parse(storedPayments);
      const updatedPayments = payments.map((p: any) => {
        if (p.id === payment.id) {
          return { ...p, status: "rejected" };
        }
        return p;
      });
      localStorage.setItem("nila_submitted_payments_v1", JSON.stringify(updatedPayments));
      setSubmittedPayments(updatedPayments);

      const proUsersStr = localStorage.getItem("nila_pro_users_v1") || "[]";
      let proUsers: string[] = JSON.parse(proUsersStr);
      proUsers = proUsers.filter(un => un !== payment.username.toLowerCase());
      localStorage.setItem("nila_pro_users_v1", JSON.stringify(proUsers));

      window.dispatchEvent(new Event("nila_settings_updated"));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSubmittedPayment = (paymentId: string) => {
    try {
      const storedPayments = localStorage.getItem("nila_submitted_payments_v1") || "[]";
      const payments = JSON.parse(storedPayments);
      const updated = payments.filter((p: any) => p.id !== paymentId);
      localStorage.setItem("nila_submitted_payments_v1", JSON.stringify(updated));
      setSubmittedPayments(updated);
      window.dispatchEvent(new Event("nila_settings_updated"));
    } catch (e) {
      console.error(e);
    }
  };

  // Filter list of users
  const filteredUsernames = Object.keys(users).filter(un => 
    un.includes(searchQuery.trim().toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 text-left"
    >
      {/* Admin Title badge & Return Action bar */}
      <div className="flex items-center justify-between bg-indigo-950/20 border-2 border-indigo-500/30 rounded-3xl p-4">
        <div className="flex items-center gap-2.5">
          <div>
            <h2 className="text-white font-black text-sm uppercase tracking-wide flex items-center gap-1.5 leading-none">
              {language === "bn" ? "নিয়ন্ত্রণ প্যানেল" : "ADMIN CONTROLS"}
              <span className="text-[8px] bg-red-650 text-white font-mono px-1 py-0.5 rounded shadow">MASTER</span>
            </h2>
            <span className="text-[10px] text-slate-400 font-mono leading-none tracking-tight block mt-1">
              Logged as: 00000000000
            </span>
          </div>
        </div>

        <button 
          onClick={onBackToApp}
          className="bg-indigo-600 hover:bg-indigo-551 text-white text-[11px] font-black py-2 px-3.5 rounded-2xl transition duration-150 active:scale-95 cursor-pointer flex items-center gap-1 shadow-md shadow-indigo-650/10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {language === "bn" ? "চার্ট ড্যাশবোর্ড" : "Trading App"}
        </button>
      </div>

      {/* Grid boxes: Stats & Configurations */}
      <div className="grid grid-cols-2 gap-3.5">
        <div id="logged-in-members-card" className="bg-[#111116] border border-indigo-500/30 rounded-2xl p-3.5 flex flex-col justify-between relative overflow-hidden shadow-lg shadow-indigo-950/20">
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-1.5 py-0.5 animate-pulse">
            <span className="w-1.5 h-1.5 bg-emerald-450 rounded-full" />
            <span className="text-[7px] text-emerald-300 font-bold font-mono uppercase tracking-wider">LIVE</span>
          </div>
          <span className="text-[8.5px] font-mono tracking-wider font-extrabold text-indigo-400 uppercase">বর্তমানে লগইন মেম্বার</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-white font-mono">{Object.keys(activeSessions).length}</span>
            <span className="text-[10px] text-slate-500 font-semibold">অনলাইন</span>
          </div>
          <div className="flex flex-wrap items-center gap-1 mt-2 max-h-[36px] overflow-y-auto pr-0.5 custom-scrollbar">
            {Object.keys(activeSessions).length === 0 ? (
              <span className="text-[9px] text-slate-500 italic">কোনো কানেকশন নেই</span>
            ) : (
              Object.keys(activeSessions).map((sessUser) => (
                <span 
                  key={sessUser} 
                  className="text-[8.5px] font-mono font-black bg-emerald-950/45 text-emerald-400 border border-emerald-800/30 rounded px-1 py-0.2 shrink-0 shadow-sm"
                  title="Active member session"
                >
                  ● {sessUser}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="bg-[#111116] border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
          <span className="text-[8.5px] font-mono tracking-wider font-extrabold text-pink-400 uppercase">মোট নিবন্ধিত ইউজার</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-white">{Object.keys(users).length}</span>
            <span className="text-[10px] text-slate-500 font-semibold font-mono">ACCOUNT</span>
          </div>
          <div className="flex items-center gap-1 text-[9.5px] text-slate-450 mt-1">
            <Users className="w-3 h-3 text-indigo-400 shrink-0" />
            <span>সিস্টেম লাইভ আছে</span>
          </div>
        </div>
      </div>

      {/* Column Left: Live Controls Setup Form */}
      <div className="bg-[#10121d]/85 rounded-3xl border border-indigo-500/10 p-5 space-y-4">
        <h3 className="text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 pb-2.5 border-b border-indigo-950/40">
          <Plus className="w-4 h-4 text-indigo-400" />
          {language === "bn" ? "নতুন ট্রেডার রেজিস্টার করুন" : "Add New VIP Trader"}
        </h3>

        {createError && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-450" />
            <span className="font-semibold">{createError}</span>
          </div>
        )}

        {createSuccess && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center gap-1.5 animate-pulse">
            <Check className="w-3.5 h-3.5 shrink-0 text-emerald-450" />
            <span className="font-semibold">{createSuccess}</span>
          </div>
        )}

        <form onSubmit={handleCreateUser} className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-mono font-bold text-slate-400 tracking-wider">ইউজারনেম দিন</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="যেমন: rifat"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/40 text-slate-100 text-xs rounded-xl py-2 px-3 focus:outline-none"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-mono font-bold text-slate-400 tracking-wider">পাসওয়ার্ড দিন</label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="যেমন: password88"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/40 text-slate-100 text-xs rounded-xl py-2 px-3 focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            className="col-span-2 bg-indigo-600 hover:bg-indigo-551 text-white font-black text-xs py-2.5 rounded-xl transition duration-150 active:scale-95 cursor-pointer mt-1 flex items-center justify-center gap-1 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {language === "bn" ? "নতুন ট্রেডার যুক্ত করুন" : "Add Trader"}
          </button>
        </form>
      </div>

      {/* Manage Variable Constants Dynamic Configurations */}
      <div className="bg-[#111116] border border-slate-800 rounded-3xl p-5 space-y-4">
        <h3 className="text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 pb-2.5 border-b border-slate-805">
          <Settings className="w-4 h-4 text-pink-400" />
          {language === "bn" ? "সিস্টেম ডাইনামিক কনফিগারেশন" : "App Variable Tuning"}
        </h3>

        {saveSuccess && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 shrink-0 text-emerald-450" />
            <span className="font-semibold">{language === "bn" ? "কনফিগারেশন সফলভাবে সেভ হয়েছে!" : "Configuration saved successfully!"}</span>
          </div>
        )}

        <form onSubmit={handleSaveConfig} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[9.5px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <span>টেলিগ্রাম চ্যানেল লিংক</span>
              <span className="text-[8px] px-1 py-0.2 bg-slate-800 text-sky-400 rounded">TG</span>
            </label>
            <input
              type="text"
              value={adminTelegram}
              onChange={(e) => setAdminTelegram(e.target.value)}
              className="w-full bg-slate-950 border border-slate-805 hover:border-slate-800 transition duration-150 focus:border-pink-500/40 text-slate-100 text-xs rounded-xl py-2 px-3 focus:outline-none font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9.5px] font-mono font-bold text-slate-400 uppercase tracking-widest">বামদিকের কপিরাইট টেক্সট</label>
              <input
                type="text"
                value={adminOwner1}
                onChange={(e) => setAdminOwner1(e.target.value)}
                className="w-full bg-slate-950 border border-slate-805 focus:border-indigo-500/40 text-slate-100 text-xs rounded-xl py-2 px-3 focus:outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9.5px] font-mono font-bold text-slate-400 uppercase tracking-widest">ডানদিকের কপিরাইট টেক্সট</label>
              <input
                type="text"
                value={adminOwner2}
                onChange={(e) => setAdminOwner2(e.target.value)}
                className="w-full bg-slate-950 border border-slate-805 focus:border-indigo-500/40 text-slate-100 text-xs rounded-xl py-2 px-3 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9.5px] font-mono font-bold text-slate-400 uppercase tracking-widest">সিগন্যাল সফলতা হার (%)</label>
              <input
                type="text"
                value={adminWinRate}
                onChange={(e) => setAdminWinRate(e.target.value)}
                placeholder="যেমন: 98%"
                className="w-full bg-slate-950 border border-slate-805 focus:border-indigo-500/40 text-slate-200 text-xs rounded-xl py-2 px-3 focus:outline-none font-bold"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9.5px] font-mono font-bold text-slate-400 uppercase tracking-widest">গ্লোবাল এনাউন্সমেন্ট টেক্সট</label>
              <input
                type="text"
                value={globalAnnouncement}
                onChange={(e) => setGlobalAnnouncement(e.target.value)}
                className="w-full bg-slate-950 border border-slate-805 focus:border-indigo-500/40 text-slate-100 text-xs rounded-xl py-2 px-3 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-805/45 pt-3.5 mt-2">
            <h4 className="text-white text-[11px] font-black uppercase tracking-widest text-[#00e676] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] animate-ping" />
              পেমেন্ট বক্স টেক্সট ও নাম্বার ড্যাশবোর্ড
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9.5px] font-mono font-bold text-slate-300 uppercase tracking-widest block">
                  bKash (বিকাশ) Personal Number
                </label>
                <input
                  type="text"
                  value={adminLtc}
                  onChange={(e) => setAdminLtc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-805 focus:border-indigo-500/40 text-slate-100 text-xs rounded-xl py-2 px-3 focus:outline-none font-mono font-bold text-purple-400"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] font-mono font-bold text-slate-300 uppercase tracking-widest block">
                  bKash (বিকাশ) Instruction Text
                </label>
                <input
                  type="text"
                  value={adminBkashInst}
                  onChange={(e) => setAdminBkashInst(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-805 focus:border-indigo-500/40 text-slate-100 text-xs rounded-xl py-2 px-3 focus:outline-none placeholder:text-slate-650"
                  placeholder="বিকাশ বক্সের নিচের ছোট লেখা..."
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9.5px] font-mono font-bold text-slate-300 uppercase tracking-widest block">
                USDT (TRC-20) Wallet Address
              </label>
              <input
                type="text"
                value={adminUsdt}
                onChange={(e) => setAdminUsdt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-805 hover:border-slate-800 transition duration-150 focus:border-pink-500/40 text-slate-100 text-xs rounded-xl py-2 px-3 focus:outline-none font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9.5px] font-mono font-bold text-slate-300 uppercase tracking-widest block">
                  TRX (TRC-20) Address
                </label>
                <input
                  type="text"
                  value={adminTrx}
                  onChange={(e) => setAdminTrx(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-805 focus:border-indigo-500/40 text-slate-100 text-xs rounded-xl py-2 px-3 focus:outline-none font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] font-mono font-bold text-slate-300 uppercase tracking-widest block">
                  Crypto Instruction Text
                </label>
                <input
                  type="text"
                  value={adminCryptoInst}
                  onChange={(e) => setAdminCryptoInst(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-805 focus:border-indigo-500/40 text-slate-100 text-xs rounded-xl py-2 px-3 focus:outline-none placeholder:text-slate-650"
                  placeholder="ক্রিপ্টো বক্সের নিচের ছোট লেখা..."
                  required
                />
              </div>
            </div>

            {/* Live Preview Section inside Admin Panel for instantly checking design */}
            <div className="mt-2.5 p-3.5 rounded-2xl bg-[#0d0f19] border border-indigo-500/10 text-center space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-indigo-400 font-mono tracking-widest uppercase flex items-center gap-1 bg-transparent">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60" />
                  পেমেন্ট বক্স লাইভ প্রিভিউ (বিকাশ ভিউ)
                </span>
                <span className="text-[8px] font-bold text-slate-500 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-900">
                  REAL-TIME PREVIEW
                </span>
              </div>
              
              <div className="bg-[#111116] border border-slate-850 hover:border-slate-800 rounded-xl py-2 px-3 text-[10px] text-slate-300 font-mono select-all break-all cursor-pointer leading-relaxed text-center hover:text-sky-400 transition font-bold shadow-md">
                {adminLtc || "017XXXXXXXX"}
              </div>
              <p className="text-[9px] text-slate-500 mt-1 font-mono leading-relaxed italic block text-center bg-transparent">
                {adminBkashInst}
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-650 to-indigo-650 hover:from-pink-600 hover:to-indigo-600 text-white font-extrabold text-xs py-3 rounded-xl transition duration-155 active:scale-95 cursor-pointer mt-1"
          >
            {language === "bn" ? "ডাইনামিক কনফিগারেশন সেভ করুন" : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Submitted Payments list box */}
      <div id="payment-verification-queue" className="bg-[#111116] border border-indigo-500/15 rounded-3xl p-5 space-y-3.5 shadow-xl">
        <div className="flex flex-col gap-1.5 pb-2.5 border-b border-slate-805 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-pink-400 shrink-0" />
            <span>কনফার্মেশন পেমেন্ট লিস্ট (Verification Queue)</span>
          </h3>
          <span className="text-[9px] font-mono text-slate-400 font-bold bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 max-w-max">
            {submittedPayments.length} Submitted Tx
          </span>
        </div>

        <div className="max-h-[250px] overflow-y-auto custom-scrollbar space-y-2.5 pr-0.5">
          {submittedPayments.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8 font-semibold italic">
              কোনো নতুন পেমেন্ট রিকোয়েস্ট জমা পরেনি।
            </p>
          ) : (
            [...submittedPayments].reverse().map((payment: any, index: number) => {
              return (
                <div 
                  key={payment.id || index}
                  className="p-3 rounded-2xl bg-slate-950/75 border border-slate-850 hover:border-slate-800 space-y-2 text-xs text-left"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-white text-xs font-mono">{payment.username}</span>
                        <span className="text-[8px] bg-slate-800 text-amber-300 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                          {payment.network}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {new Date(payment.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div>
                      {payment.status === "pending" ? (
                        <span className="text-[9px] px-2 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-black rounded-full uppercase tracking-wider animate-pulse">
                          Pending
                        </span>
                      ) : payment.status === "approved" ? (
                        <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black rounded-full uppercase tracking-wider">
                          Approved
                        </span>
                      ) : (
                        <span className="text-[9px] px-2 py-0.5 bg-rose-500/10 text-rose-450 border border-rose-500/20 font-black rounded-full uppercase tracking-wider">
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-905 p-2 rounded-xl text-[11px] font-mono text-slate-350">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Amount Paid</span>
                      <span className="font-extrabold text-[#00e676]">${payment.amount}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Tx Hash / ID</span>
                      <span className="font-bold text-slate-300 select-all break-all">{payment.transactionId}</span>
                    </div>
                  </div>

                  {payment.status === "pending" && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleApprovePayment(payment)}
                        className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-550 text-white font-black text-[10px] rounded-lg transition duration-150 active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Approve & Enable PRO
                      </button>
                      <button
                        onClick={() => handleRejectPayment(payment)}
                        className="flex-1 py-1.5 px-3 bg-rose-650 hover:bg-rose-600 text-white font-black text-[10px] rounded-lg transition duration-150 active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                      >
                        <X className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  )}

                  {payment.status !== "pending" && (
                    <button
                      onClick={() => handleDeleteSubmittedPayment(payment.id)}
                      className="w-full text-center text-slate-500 hover:text-rose-400 text-[10px] font-bold py-1 bg-slate-900/40 hover:bg-rose-950/20 rounded-lg transition cursor-pointer"
                    >
                      Delete Log Record
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Registered Users List Controller box */}
      <div className="bg-[#111116] border border-slate-800 rounded-3xl p-5 space-y-3.5">
        <div className="flex flex-col gap-1.5 pb-2.5 border-b border-slate-805 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-sky-400 shrink-0" />
            {language === "bn" ? "নিবন্ধিত ট্রেডার তালিকা" : "Registered Trader Directory"}
          </h3>
          <span className="text-[9px] font-mono text-slate-400 font-bold bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 max-w-max">
            {filteredUsernames.length} Accounts Found
          </span>
        </div>

        {/* User list search input */}
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={language === "bn" ? "ইউজারনেম দিয়ে খুঁজুন..." : "Search users..."}
          className="w-full bg-slate-950 border border-slate-805 hover:border-slate-800 text-slate-200 text-xs rounded-xl py-2 px-3 placeholder-slate-650 focus:outline-none focus:border-sky-500/40"
        />

        {/* User item table scrollable container */}
        <div className="max-h-[220px] overflow-y-auto custom-scrollbar space-y-2.5 pr-0.5">
          {filteredUsernames.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6 font-bold leading-relaxed">
              {language === "bn" ? "কোনো ইউজার ম্যাচ করেনি।" : "No matches found."}
            </p>
          ) : (
            filteredUsernames.map((un) => {
              const pass = users[un];
              const isMaster = un === "00000000000" || un === "admin";
              return (
                <div 
                  key={un}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-850 hover:border-slate-800"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-200 font-extrabold font-mono truncate max-w-[130px]">
                        {un}
                      </span>
                      {isMaster && (
                        <span className="text-[8px] bg-indigo-600/20 text-indigo-400 font-black px-1.5 py-0.3 rounded border border-indigo-500/20 uppercase shrink-0">
                          Master
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-450 font-mono mt-0.5">
                      <Key className="w-2.5 h-2.5 shrink-0 text-slate-500" />
                      <span>Pass: {pass}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteUser(un)}
                    disabled={isMaster}
                    className={`p-2.5 rounded-xl transition ${
                      isMaster 
                        ? "text-slate-650 cursor-not-allowed bg-slate-900/10" 
                        : "text-slate-500 hover:text-rose-450 hover:bg-rose-950/25 active:scale-95 cursor-pointer"
                    }`}
                    title={language === "bn" ? "ইউজার অ্যাকাউন্ট ডিলিট করুন" : "Delete User"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#111116] border-2 border-indigo-500/30 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-white font-extrabold text-sm uppercase">
                {language === "bn" ? "ইউজার মুছে ফেলতে চান?" : "Delete User Account?"}
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                {language === "bn"
                  ? `আপনি কি সত্যিই '${userToDelete}' ট্রেডার অ্যাকাউন্টটি মুছে ফেলতে চান?`
                  : `Are you sure you want to completely delete '${userToDelete}'?`}
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-350 text-xs font-bold py-2.5 rounded-xl transition duration-150 active:scale-95 cursor-pointer"
              >
                {language === "bn" ? "বাতিল করুন" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = { ...users };
                  delete updated[userToDelete];
                  localStorage.setItem("nila_registered_users_v2", JSON.stringify(updated));
                  setUsers(updated);
                  setUserToDelete(null);
                  window.dispatchEvent(new Event("nila_settings_updated"));
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2.5 rounded-xl transition duration-150 active:scale-95 cursor-pointer"
              >
                {language === "bn" ? "মুছে ফেলুন" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {adminAlertMsg && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#111116] border-2 border-indigo-500/30 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-slate-200 text-xs leading-relaxed font-semibold">
                {adminAlertMsg}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAdminAlertMsg(null)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black py-2.5 rounded-xl transition duration-150 active:scale-95 cursor-pointer"
            >
              {language === "bn" ? "ঠিক আছে" : "OK"}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
