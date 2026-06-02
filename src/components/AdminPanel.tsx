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
  HelpCircle
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

  // App variables/settings form state
  const [adminTelegram, setAdminTelegram] = useState("https://t.me/poketbrokar");
  const [adminOwner1, setAdminOwner1] = useState("nila\\ldp.onar");
  const [adminOwner2, setAdminOwner2] = useState("korim debolopar");
  const [adminWinRate, setAdminWinRate] = useState("98%");
  const [globalAnnouncement, setGlobalAnnouncement] = useState("যেকোনো প্রয়োজনে নিচে দেওয়া টেলিগ্রাম লিংকে মেসেজ করুন");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load registered users and editable variables
  const loadUsersAndStats = () => {
    try {
      // 1. Get users
      const storedUsers = localStorage.getItem("nila_registered_users_v1");
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      } else {
        // fallbacks
        const defaultList = { "admin": "123", "limon": "nila2026", "korim": "nila2026" };
        setUsers(defaultList);
        localStorage.setItem("nila_registered_users_v1", JSON.stringify(defaultList));
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
    localStorage.setItem("nila_registered_users_v1", JSON.stringify(updated));
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
      alert(language === "bn" ? "প্রধান এডমিন অ্যাকাউন্ট ডিলিট করা সম্ভব নয়!" : "Main admin cannot be deleted!");
      return;
    }

    const msg = language === "bn" 
      ? `আপনি কি '${usernameToDelete}' ইউজারটি মুছে ফেলতে চান?` 
      : `Are you sure you want to delete user '${usernameToDelete}'?`;

    if (confirm(msg)) {
      const updated = { ...users };
      delete updated[usernameToDelete];
      localStorage.setItem("nila_registered_users_v1", JSON.stringify(updated));
      setUsers(updated);
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
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
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

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-650 to-indigo-650 hover:from-pink-600 hover:to-indigo-600 text-white font-extrabold text-xs py-3 rounded-xl transition duration-155 active:scale-95 cursor-pointer mt-1"
          >
            {language === "bn" ? "ডাইনামিক কনফিগারেশন সেভ করুন" : "Save Changes"}
          </button>
        </form>
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
    </motion.div>
  );
}
