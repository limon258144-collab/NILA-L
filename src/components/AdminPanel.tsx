import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Users, 
  Trash2, 
  Plus, 
  Settings, 
  Megaphone,
  ArrowLeft,
  Check,
  AlertCircle,
  TrendingUp,
  X,
  Search,
  BookOpen,
  UserCheck,
  ShieldAlert,
  Sparkles,
  Sliders,
  Wifi,
  MessageSquare,
  Send,
  MessageCircle
} from "lucide-react";
import { syncWithServer } from "../sync";
interface AdminPanelProps {
  language: "bn" | "en";
  onBackToApp: () => void;
}

export default function AdminPanel({ language, onBackToApp }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"payments" | "support" | "users">("users");
  const [userSubFilter, setUserSubFilter] = useState<"all" | "verified" | "pending" | "expired" | "unverified">("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // App variables/settings form state
  const [adminTelegram, setAdminTelegram] = useState("https://t.me/jayedbhai_12");
  const [adminOwner1, setAdminOwner1] = useState("nila\\ldp.onar");
  const [adminOwner2, setAdminOwner2] = useState("korim debolopar");
  const [adminWinRate, setAdminWinRate] = useState("98%");
  const [globalAnnouncement, setGlobalAnnouncement] = useState("যেকোনো প্রয়োজনে নিচে দেওয়া টেলিগ্রাম লিংকে মেসেজ করুন");
  const [adminUsdt, setAdminUsdt] = useState("TX2iZJ9Z8p9M6k9y9n9t9Y9R9C9v9x");
  const [adminTrx, setAdminTrx] = useState("TX2iZJ9Z8p9M6k9y9n9t9Y9R9C9v9x");
  const [adminLtc, setAdminLtc] = useState("01568760651");
  const [adminBkashInst, setAdminBkashInst] = useState("* এই বিকাশ পার্সোনাল নাম্বারে সমপরিমাণ টাকা Send Money করুন।");
  const [adminCryptoInst, setAdminCryptoInst] = useState("* Send exactly the payment amount to this receiver wallet.");
  
  const [users, setUsers] = useState<Record<string, string>>({});
  const [activeSessions, setActiveSessions] = useState<Record<string, number>>({});
  const [submittedPayments, setSubmittedPayments] = useState<any[]>([]);
  const [analysisLimits, setAnalysisLimits] = useState<Record<string, number[]>>({});
  const [adminAlertMsg, setAdminAlertMsg] = useState<string | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Pagination for Payments Table
  const [paymentPage, setPaymentPage] = useState(1);
  const paymentsPerPage = 10;

  // Selected payment rows for bulk actions
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>([]);

  // Support Chats state
  const [supportChats, setSupportChats] = useState<Record<string, {
    messages: { id: string; sender: "user" | "admin"; text: string; timestamp: number }[];
    unreadCountByAdmin: number;
    unreadCountByUser: number;
    lastUpdated?: number;
  }>>({});
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState("");

  // Sound effect synthesizer (Low-latency Web Audio chirp)
  const playChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch (e) {}
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    playChime();
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Clean up and initialize registered users from localStorage
  const runDataSeeding = () => {
    let storedUsers = localStorage.getItem("nila_registered_users_v2");
    let usersList = storedUsers ? JSON.parse(storedUsers) : {};
    
    // Detect if the previous dummy mock seed exists, and clean it up to only keep real registered users
    const hasOldSeed = usersList["rifat_trader"] !== undefined || usersList["limon"] === "google-oauth" || usersList["limon44@gmail.com"] === "limon1234";
    
    if (hasOldSeed || Object.keys(usersList).length === 0) {
      // Keep only real default logins (such as the admin accounts) and clear the artificial mock accounts
      usersList = {
        "limon258144@gmail.com": "limon000",
        "admin@gmail.com": "admin123"
      };
      localStorage.setItem("nila_registered_users_v2", JSON.stringify(usersList));
      
      // Clean up mock pro users list
      const start1 = Date.now();
      const newProUsers = [
        { username: "limon258144@gmail.com", expiresAt: start1 + 30 * 24 * 3600 * 1000, verifiedAt: start1 },
        { username: "admin@gmail.com", expiresAt: start1 + 100 * 24 * 3600 * 1000, verifiedAt: start1 }
      ];
      localStorage.setItem("nila_pro_users_v1", JSON.stringify(newProUsers));
      
      // Clean up active sessions
      localStorage.setItem("nila_active_sessions_v1", JSON.stringify({
        "limon258144@gmail.com": Date.now(),
        "admin@gmail.com": Date.now()
      }));
      
      // Clear mock limits and submitted payments
      localStorage.setItem("nila_analysis_limits_v1", JSON.stringify({}));
      localStorage.setItem("nila_submitted_payments_v1", JSON.stringify([]));
    }
  };

  const loadData = () => {
    runDataSeeding();
    try {
      setUsers(JSON.parse(localStorage.getItem("nila_registered_users_v2") || "{}"));
      setSubmittedPayments(JSON.parse(localStorage.getItem("nila_submitted_payments_v1") || "[]"));
      setActiveSessions(JSON.parse(localStorage.getItem("nila_active_sessions_v1") || "{}"));
      setSupportChats(JSON.parse(localStorage.getItem("nila_support_chats_v2") || "{}"));
      setAnalysisLimits(JSON.parse(localStorage.getItem("nila_analysis_limits_v1") || "{}"));

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
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("nila_settings_updated", loadData);
    return () => window.removeEventListener("nila_settings_updated", loadData);
  }, []);

  const checkUserProStatus = (un: string): boolean => {
    const lower = un.toLowerCase();
    if (lower === "admin" || lower === "00000000000" || lower === "limon258144@gmail.com") return true;
    try {
      const proUsers: any[] = JSON.parse(localStorage.getItem("nila_pro_users_v1") || "[]");
      return proUsers.some((e: any) => {
        const entryName = typeof e === "string" ? e : e.username;
        if (entryName.toLowerCase() === lower) {
          if (e.expiresAt && e.expiresAt < Date.now()) return false;
          return true;
        }
        return false;
      });
    } catch (e) {
      return false;
    }
  };

  const handleSaveConfigValue = (key: string, value: string, label: string) => {
    localStorage.setItem(key, value);
    window.dispatchEvent(new Event("nila_settings_updated"));
    syncWithServer();
    showToast(`${label} সফলভাবে সেভ করা হয়েছে!`);
  };

  const handleVerifyUser = (username: string) => {
    try {
      const proUsers: any[] = JSON.parse(localStorage.getItem("nila_pro_users_v1") || "[]");
      const filtered = proUsers.filter((e: any) => {
        const name = typeof e === "string" ? e : e.username;
        return name.toLowerCase() !== username.toLowerCase();
      });
      filtered.push({
        username: username.toLowerCase(),
        expiresAt: Date.now() + 30 * 24 * 3600 * 1000,
        verifiedAt: Date.now()
      });
      localStorage.setItem("nila_pro_users_v1", JSON.stringify(filtered));
      window.dispatchEvent(new Event("nila_settings_updated"));
      syncWithServer();
      showToast(`${username} প্রো অ্যাক্টিভেট সফল!`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnverifyUser = (username: string) => {
    try {
      const proUsers: any[] = JSON.parse(localStorage.getItem("nila_pro_users_v1") || "[]");
      const filtered = proUsers.filter((e: any) => {
        const name = typeof e === "string" ? e : e.username;
        return name.toLowerCase() !== username.toLowerCase();
      });
      localStorage.setItem("nila_pro_users_v1", JSON.stringify(filtered));
      window.dispatchEvent(new Event("nila_settings_updated"));
      syncWithServer();
      showToast(`${username} ডি-অ্যাক্টিভেট করা হয়েছে।`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkUnverify = () => {
    try {
      const proUsers: any[] = JSON.parse(localStorage.getItem("nila_pro_users_v1") || "[]");
      const kept = proUsers.filter((e: any) => {
        const name = (typeof e === "string" ? e : e.username).toLowerCase();
        return name === "admin" || name === "00000000000" || name === "limon258144@gmail.com";
      });
      localStorage.setItem("nila_pro_users_v1", JSON.stringify(kept));
      window.dispatchEvent(new Event("nila_settings_updated"));
      syncWithServer();
      setAdminAlertMsg(null);
      showToast("সকল সাধারণ ইউজার আনভেরিফাইড করা হয়েছে!");
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprovePayment = (pay: any) => {
    const updated = submittedPayments.map(p => p.id === pay.id ? { ...p, status: "approved" } : p);
    localStorage.setItem("nila_submitted_payments_v1", JSON.stringify(updated));
    handleVerifyUser(pay.username);
  };

  const handleRejectPayment = (pay: any) => {
    const updated = submittedPayments.map(p => p.id === pay.id ? { ...p, status: "rejected" } : p);
    localStorage.setItem("nila_submitted_payments_v1", JSON.stringify(updated));
    window.dispatchEvent(new Event("nila_settings_updated"));
    syncWithServer();
    showToast("ট্রানজেকশন বাতিল করা হয়েছে।");
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
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePayment = (payId: string) => {
    const pay = submittedPayments.find(p => p.id === payId);
    if (pay) {
      const username = pay.username;
      if (username && username !== "admin" && username !== "00000000000" && username !== "limon258144@gmail.com") {
        try {
          // Delete from registered users list
          const storedUsers = JSON.parse(localStorage.getItem("nila_registered_users_v2") || "{}");
          if (storedUsers[username]) {
            delete storedUsers[username];
            localStorage.setItem("nila_registered_users_v2", JSON.stringify(storedUsers));
          }
          
          // Delete from pro/verified list
          const proUsers: any[] = JSON.parse(localStorage.getItem("nila_pro_users_v1") || "[]");
          const filteredPro = proUsers.filter((e: any) => {
            const name = typeof e === "string" ? e : e.username;
            return name.toLowerCase() !== username.toLowerCase();
          });
          localStorage.setItem("nila_pro_users_v1", JSON.stringify(filteredPro));

          // Delete from active sessions list
          const sessions = JSON.parse(localStorage.getItem("nila_active_sessions_v1") || "{}");
          if (sessions[username] !== undefined) {
            delete sessions[username];
            localStorage.setItem("nila_active_sessions_v1", JSON.stringify(sessions));
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    const updated = submittedPayments.filter(p => p.id !== payId);
    localStorage.setItem("nila_submitted_payments_v1", JSON.stringify(updated));
    window.dispatchEvent(new Event("nila_settings_updated"));
    showToast("রেকর্ড এবং ইউজার অ্যাকাউন্ট সম্পূর্ণ মুছে ফেলা হয়েছে।");
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    const cleanUsername = newUsername.trim();
    const updated = { ...users, [cleanUsername]: newPassword || "123456" };
    localStorage.setItem("nila_registered_users_v2", JSON.stringify(updated));
    window.dispatchEvent(new Event("nila_settings_updated"));
    setShowAddUserModal(false);
    setNewUsername("");
    setNewPassword("");
    showToast(`নতুন ইউজার ${cleanUsername} তৈরি হয়েছে!`);
  };

  const handleDeleteUser = (username: string) => {
    const updated = { ...users };
    delete updated[username];
    localStorage.setItem("nila_registered_users_v2", JSON.stringify(updated));
    handleUnverifyUser(username);
  };

  // Date converters to Bengali
  const getBngNum = (num: number | string) => {
    const bngNumbers = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return num.toString().split("").map(ch => {
      const idx = parseInt(ch, 10);
      return !isNaN(idx) ? bngNumbers[idx] : ch;
    }).join("");
  };

  const getBngDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    return `${getBngNum(date.getDate())} ${months[date.getMonth()]}, ${getBngNum(date.getFullYear())}`;
  };

  const getBngTime = (timestamp: number) => {
    const date = new Date(timestamp);
    let h = date.getHours();
    const m = date.getMinutes().toString().padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${getBngNum(h)}:${getBngNum(m)} ${ampm}`;
  };

  // Calculations for Counters & Statuses
  const totalUsersCount = Object.keys(users).length;
  const verifiedList = Object.keys(users).filter(u => checkUserProStatus(u));
  const verifiedCount = verifiedList.length;
  const expiredTrialList = Object.keys(users).filter(un => {
    const limitArr = analysisLimits[un] || [];
    return !checkUserProStatus(un) && limitArr.length >= 3;
  });
  const expiredCount = expiredTrialList.length;
  const unverifiedCount = Math.max(0, totalUsersCount - verifiedCount - expiredCount);

  const getDaysUsedForUser = (un: string): number => {
    if (un === "limon") return 49;
    if (un === "limon44@gmail.com") return 4;
    if (un === "lxjayed52@gmail.com") return 3;
    return (un.length * 7) % 45 + 1;
  };

  // Dynamic UID Generator
  const getUserUID = (un: string) => {
    if (un === "limon") return "WiI0u8Eo7ScpttdQd9dF99PJNoq2";
    if (un === "limon44@gmail.com") return "Ob6AKT4DgQDPS0L9uFM60GE8r3y1";
    if (un === "lxjayed52@gmail.com") return "okP1eJrqGrfXVBkVn1IPao9RxuS2";
    let hash = 0;
    for (let i = 0; i < un.length; i++) {
      hash = un.charCodeAt(i) + ((hash << 5) - hash);
    }
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let uid = "UID_";
    for (let i = 0; i < 20; i++) {
      uid += chars[Math.abs((hash + i) * (i + 7)) % chars.length];
    }
    return uid;
  };

  // Deterministic user stats
  const getUserStats = (un: string) => {
    if (un === "limon") return { reg: "১৬ মে, ২০২৬", last: "৫ জুলাই, ২০২৬ ১২:৫৭ AM" };
    if (un === "limon44@gmail.com") return { reg: "৩০ জুন, ২০২৬", last: "৫ জুলাই, ২০২৬ ১২:২৩ AM" };
    if (un === "lxjayed52@gmail.com") return { reg: "১ জুলাই, ২০২৬", last: "৪ জুলাই, ২০২৬ ০২:০০ PM" };
    
    // Deterministic dates based on username length
    const day = (un.length * 3) % 28 + 1;
    const hour = (un.length * 5) % 12 || 1;
    const min = (un.length * 9) % 60;
    const regDate = `${getBngNum(day)} জুন, ২০২৬`;
    const lastLogin = `৫ জুলাই, ২০২৬ ${getBngNum(hour)}:${getBngNum(min.toString().padStart(2, "0"))} AM`;
    return { reg: regDate, last: lastLogin };
  };

  // Dynamic queries filtering
  const filteredUsers = Object.keys(users).filter(un => {
    const matchesSearch = un.toLowerCase().includes(searchQuery.trim().toLowerCase());
    if (!matchesSearch) return false;

    if (userSubFilter === "verified") return checkUserProStatus(un);
    if (userSubFilter === "unverified") {
      const limitArr = analysisLimits[un] || [];
      return !checkUserProStatus(un) && limitArr.length < 3;
    }
    if (userSubFilter === "pending") {
      return submittedPayments.some(p => p.username === un && p.status === "pending");
    }
    if (userSubFilter === "expired") {
      const limitArr = analysisLimits[un] || [];
      return !checkUserProStatus(un) && limitArr.length >= 3;
    }
    return true;
  });

  // Submitted Payments search & filter
  const filteredPayments = submittedPayments.filter(p => {
    const query = searchQuery.trim().toLowerCase();
    return p.senderNumber.includes(query) || p.transactionId.toLowerCase().includes(query) || p.username.toLowerCase().includes(query);
  });

  // Pagination slicing
  const paymentTotalPages = Math.ceil(filteredPayments.length / paymentsPerPage) || 1;
  const slicedPayments = filteredPayments.slice((paymentPage - 1) * paymentsPerPage, paymentPage * paymentsPerPage);

  const handleToggleSelectPayment = (payId: string) => {
    setSelectedPaymentIds(prev => {
      if (prev.includes(payId)) {
        return prev.filter(id => id !== payId);
      } else {
        return [...prev, payId];
      }
    });
  };

  const visiblePaymentIds = slicedPayments.map(p => p.id);
  const isAllVisibleSelected = visiblePaymentIds.length > 0 && visiblePaymentIds.every(id => selectedPaymentIds.includes(id));

  const handleToggleSelectAllVisible = () => {
    if (isAllVisibleSelected) {
      setSelectedPaymentIds(prev => prev.filter(id => !visiblePaymentIds.includes(id)));
    } else {
      setSelectedPaymentIds(prev => {
        const union = new Set([...prev, ...visiblePaymentIds]);
        return Array.from(union);
      });
    }
  };

  const handleBulkDeletePayments = () => {
    if (selectedPaymentIds.length === 0) return;
    
    const usernamesToDelete = submittedPayments
      .filter(p => selectedPaymentIds.includes(p.id))
      .map(p => p.username)
      .filter(un => un && un !== "admin" && un !== "00000000000" && un !== "limon258144@gmail.com");

    try {
      // 1. Delete from registered users list
      const storedUsers = JSON.parse(localStorage.getItem("nila_registered_users_v2") || "{}");
      usernamesToDelete.forEach(username => {
        if (storedUsers[username]) {
          delete storedUsers[username];
        }
      });
      localStorage.setItem("nila_registered_users_v2", JSON.stringify(storedUsers));
      
      // 2. Delete from pro/verified list
      const proUsers: any[] = JSON.parse(localStorage.getItem("nila_pro_users_v1") || "[]");
      const filteredPro = proUsers.filter((e: any) => {
        const name = typeof e === "string" ? e : e.username;
        return !usernamesToDelete.some(un => un.toLowerCase() === name.toLowerCase());
      });
      localStorage.setItem("nila_pro_users_v1", JSON.stringify(filteredPro));

      // 3. Delete from active sessions list
      const sessions = JSON.parse(localStorage.getItem("nila_active_sessions_v1") || "{}");
      usernamesToDelete.forEach(username => {
        if (sessions[username] !== undefined) {
          delete sessions[username];
        }
      });
      localStorage.setItem("nila_active_sessions_v1", JSON.stringify(sessions));
    } catch (e) {
      console.error(e);
    }

    // 4. Update submitted payments list
    const updated = submittedPayments.filter(p => !selectedPaymentIds.includes(p.id));
    localStorage.setItem("nila_submitted_payments_v1", JSON.stringify(updated));
    setSelectedPaymentIds([]);
    window.dispatchEvent(new Event("nila_settings_updated"));
    showToast("রেকর্ড এবং ইউজার অ্যাকাউন্টসমূহ সম্পূর্ণ মুছে ফেলা হয়েছে।");
  };

  return (
    <div className="space-y-5 animate-fade-in text-left text-slate-100 select-none pb-8 relative">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-600 to-indigo-600 border border-emerald-400 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-2xl z-[9999] flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-300" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Panel branding block matching system design */}
      <div className="bg-[#0e0e15] border-2 border-indigo-500/10 rounded-3xl p-5 flex flex-col gap-4 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-emerald-400 font-black italic text-xl tracking-tight leading-tight uppercase flex items-center gap-1">
                SYSTEM CONTROL CENTER
              </h2>
              <p className="text-slate-400 font-mono text-[9px] font-bold tracking-widest uppercase">
                PAYMENT VERIFICATION SYSTEM V2.5
              </p>
            </div>
          </div>

          {/* Menu selection buttons row */}
          <div className="flex flex-wrap gap-1.5 bg-slate-950/40 p-1 rounded-xl border border-slate-900/60 self-start sm:self-center">
            <button
              onClick={() => { setActiveTab("payments"); setSearchQuery(""); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all duration-150 cursor-pointer ${
                activeTab === "payments"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              PAYMENTS
            </button>
            <button
              onClick={() => { setActiveTab("support"); setSearchQuery(""); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all duration-150 cursor-pointer ${
                activeTab === "support"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              SUPPORT
            </button>
            <button
              onClick={() => { setActiveTab("users"); setSearchQuery(""); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all duration-150 cursor-pointer ${
                activeTab === "users"
                  ? "bg-[#f59e0b] text-black shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              USERS ({totalUsersCount})
            </button>
          </div>
        </div>

        {/* Search input inside header bar next to exit */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-900">
          <button
            onClick={onBackToApp}
            className="border-2 border-rose-500/30 hover:bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-wider py-1.5 px-3.5 rounded-xl transition duration-150 active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            EXIT PANEL
          </button>

          <div className="relative flex-1 max-w-xs">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="w-3.5 h-3.5 text-slate-500" />
            </span>
            <input
              type="text"
              placeholder={activeTab === "users" ? "ইউজার বা UID খুঁজুন..." : "Search Number/TrxID..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl py-1.5 pl-9 pr-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500/40 font-bold"
            />
          </div>
        </div>
      </div>



      {/* RENDER SCREENS DEPENDING ON SELECTED TAB */}

      {activeTab === "users" && (
        <div className="space-y-5">
          
          {/* Counters Row Card block exactly matching screenshot */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Card 1: প্রো একটিভ মেম্বার */}
            <div 
              onClick={() => {
                setUserSubFilter("verified");
                playChime();
              }}
              className={`border rounded-2xl p-3 flex items-center justify-between shadow transition duration-150 cursor-pointer hover:scale-[1.02] active:scale-95 ${
                userSubFilter === "verified"
                  ? "bg-emerald-950/20 border-emerald-500/60 shadow-emerald-900/10"
                  : "bg-[#111116] border-emerald-500/20 hover:border-emerald-500/40"
              }`}
            >
              <div className="text-left bg-transparent">
                <span className="text-[10px] font-bold text-slate-400 block bg-transparent">১. প্রো একটিভ মেম্বার</span>
                <span className="text-base sm:text-lg font-black text-emerald-400 block mt-0.5 bg-transparent">{getBngNum(verifiedCount)} জন</span>
              </div>
              <div className="bg-emerald-500/10 p-1.5 rounded-xl text-emerald-400 shrink-0">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
            </div>

            {/* Card 2: সর্বমোট রেজিস্টার্ড মেম্বার */}
            <div 
              onClick={() => {
                setUserSubFilter("all");
                playChime();
              }}
              className={`border rounded-2xl p-3 flex items-center justify-between shadow transition duration-150 cursor-pointer hover:scale-[1.02] active:scale-95 ${
                userSubFilter === "all"
                  ? "bg-blue-950/20 border-blue-500/60 shadow-blue-900/10"
                  : "bg-[#111116] border-blue-500/20 hover:border-blue-500/40"
              }`}
            >
              <div className="text-left bg-transparent">
                <span className="text-[10px] font-bold text-slate-400 block bg-transparent">২. সর্বমোট রেজিস্টার্ড</span>
                <span className="text-base sm:text-lg font-black text-white block mt-0.5 bg-transparent">{getBngNum(totalUsersCount)} জন</span>
              </div>
              <div className="bg-blue-500/10 p-1.5 rounded-xl text-blue-400 shrink-0">
                <Users className="w-4.5 h-4.5" />
              </div>
            </div>

            {/* Card 3: ফ্রি ট্রায়াল শেষ মেম্বার */}
            <div 
              onClick={() => {
                setUserSubFilter("expired");
                playChime();
              }}
              className={`border rounded-2xl p-3 flex items-center justify-between shadow transition duration-150 cursor-pointer hover:scale-[1.02] active:scale-95 ${
                userSubFilter === "expired"
                  ? "bg-rose-950/20 border-rose-500/60 shadow-rose-900/10"
                  : "bg-[#111116] border-rose-500/20 hover:border-rose-500/40"
              }`}
            >
              <div className="text-left bg-transparent">
                <span className="text-[10px] font-bold text-slate-400 block bg-transparent">৩. ফ্রি ট্রায়াল শেষ</span>
                <span className="text-base sm:text-lg font-black text-rose-400 block mt-0.5 bg-transparent">{getBngNum(expiredCount)} জন</span>
              </div>
              <div className="bg-rose-500/10 p-1.5 rounded-xl text-rose-400 shrink-0">
                <ShieldAlert className="w-4.5 h-4.5" />
              </div>
            </div>
          </div>

          {/* Bulk Action warning alert box */}
          <div className="bg-rose-950/15 border border-rose-500/20 rounded-3xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-3 items-start text-left">
              <div className="p-2 rounded-2xl bg-rose-500/10 text-rose-400 shrink-0 border border-rose-500/20">
                <ShieldAlert className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h4 className="text-white font-extrabold text-xs uppercase tracking-wide">
                  বাল্ক ইউজার আনভেরিফিকেশন অ্যাকশন
                </h4>
                <p className="text-slate-400 text-[10.5px] leading-relaxed mt-1">
                  অ্যাডমিন চাইলে সকল সাধারণ ভেরিফাইড এবং পেন্ডিং ইউজারকে এক ক্লিকে আনভেরিফাইড (ফ্রি) করুন।
                </p>
              </div>
            </div>
            <button
              onClick={() => setAdminAlertMsg("bulk_unverify")}
              className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs py-2.5 px-4 rounded-2xl transition duration-150 active:scale-95 cursor-pointer flex items-center gap-1 self-start md:self-center shrink-0 shadow-lg shadow-rose-650/20"
            >
              সকল সাধারণ ইউজার আনভেরিফাইড করুন ⚠️
            </button>
          </div>

          {/* Interactive filter list bar */}
          <div className="bg-[#111116] border border-slate-900 rounded-3xl p-3 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-950 pb-2">
              <div className="flex flex-wrap gap-1">
                {[
                  { id: "all", label: `সবাই (${totalUsersCount})` },
                  { id: "verified", label: `ভেরিফাইড (${verifiedCount})` },
                  { id: "pending", label: `পেন্ডিং (${submittedPayments.filter(p => p.status === "pending").length})` },
                  { id: "expired", label: `ট্রায়াল শেষ (${expiredCount})` },
                  { id: "unverified", label: `ফ্রি/সক্রিয় (${unverifiedCount})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setUserSubFilter(tab.id as any)}
                    className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                      userSubFilter === tab.id
                        ? "bg-slate-900 text-[#f59e0b] border border-[#f59e0b]/40 font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl flex items-center gap-1 active:scale-95 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  নতুন ইউজার বানান
                </button>
                <span className="text-[10px] text-slate-500 font-mono font-bold">
                  ফলাফল: {getBngNum(filteredUsers.length)} জন পাওয়া গেছে
                </span>
              </div>
            </div>

            {/* Registered Users List Table View matches exactly screenshot layout */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-950 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-950/20">
                    <th className="py-2.5 px-3">ইউজার প্রোফাইল</th>
                    <th className="py-2.5 px-2">রেজিস্ট্রেশন</th>
                    <th className="py-2.5 px-2">সর্বশেষ লগইন</th>
                    <th className="py-2.5 px-2">ভেরিফিকেশন স্ট্যাটাস ও সময়</th>
                    <th className="py-2.5 px-3 text-right">ম্যানেজ অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-950">
                  {filteredUsers.map(un => {
                    const isPro = checkUserProStatus(un);
                    const uid = getUserUID(un);
                    const isOnline = activeSessions[un] !== undefined;
                    const stats = getUserStats(un);

                    return (
                      <tr key={un} className="hover:bg-slate-950/30 transition duration-150">
                        
                        {/* Column 1: User Profile */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="relative">
                              <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-xs text-indigo-400 uppercase">
                                {un.charAt(0)}
                              </div>
                              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#111116] ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`} />
                            </div>
                            <div className="text-left leading-tight">
                              <span className="font-extrabold text-white text-xs block">{un}</span>
                              <span className="text-slate-500 text-[9.5px] font-mono block mt-0.5 max-w-[120px] truncate">{uid}</span>
                            </div>
                          </div>
                        </td>

                        {/* Column 2: Registration */}
                        <td className="py-3 px-2">
                          <span className="text-slate-400 font-bold text-[11px] block">{stats.reg}</span>
                          <span className="text-[#3b82f6] text-[9.5px] font-black block mt-0.5 select-none bg-blue-500/5 border border-blue-500/10 px-1 py-0.5 rounded-md inline-block">
                            {getBngNum(getDaysUsedForUser(un))} দিন ব্যবহৃত
                          </span>
                        </td>

                        {/* Column 3: Last Login */}
                        <td className="py-3 px-2 text-slate-400 font-bold text-[11px]">
                          {stats.last}
                        </td>

                        {/* Column 4: Verification Status & Time */}
                        <td className="py-3 px-2">
                          {isPro ? (
                            <div className="text-left space-y-0.5">
                              <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9.5px] font-black px-2 py-0.5 rounded-md uppercase">
                                <ShieldCheck className="w-3 h-3" /> VERIFIED (PRO)
                              </span>
                              <span className="text-slate-500 text-[9.5px] font-bold block">সক্রিয় সাবস্ক্রিপশন সচল</span>
                              <span className="text-slate-500 text-[9px] block italic">(ভেরিফাইড মেম্বার)</span>
                            </div>
                          ) : (
                            (() => {
                              const trialCount = (analysisLimits[un] || []).length;
                              const isExpired = trialCount >= 3;
                              return (
                                <div className="text-left space-y-0.5">
                                  <span className={`inline-flex items-center gap-1 border text-[9.5px] font-black px-2 py-0.5 rounded-md uppercase ${
                                    isExpired 
                                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
                                      : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                  }`}>
                                    {isExpired ? "TRIAL EXPIRED ⚠️" : "FREE TRIAL ACTIVE"}
                                  </span>
                                  <span className="text-slate-500 text-[9.5px] font-bold block">
                                    ব্যবহৃত ট্রায়াল: {getBngNum(trialCount)} / ৩ টি
                                  </span>
                                  <span className="text-amber-500 text-[9px] block italic">ভেরিফাই করুন ⚡</span>
                                </div>
                              );
                            })()
                          )}
                        </td>

                        {/* Column 5: Manage Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPro ? (
                              <button
                                onClick={() => handleUnverifyUser(un)}
                                className="border border-rose-500/30 hover:bg-rose-500/10 text-rose-400 font-extrabold text-[10px] px-2.5 py-1 rounded-lg cursor-pointer transition"
                              >
                                আনভেরিফাইড
                              </button>
                            ) : (
                              <button
                                onClick={() => handleVerifyUser(un)}
                                className="border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 font-extrabold text-[10px] px-2.5 py-1 rounded-lg cursor-pointer transition"
                              >
                                ভেরিফাই করুন
                              </button>
                            )}
                            
                            {/* Avoid deleting critical accounts */}
                            {un !== "admin" && un !== "00000000000" && (
                              <button
                                onClick={() => handleDeleteUser(un)}
                                className="text-slate-600 hover:text-rose-400 p-1 transition cursor-pointer"
                                title="ইউজার মুছুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "payments" && (
        <div className="space-y-5">
          
          {/* Dynamic Configuration fields block matching screenshot exactly */}
          <div className="bg-[#111116] border border-slate-900 rounded-3xl p-4 space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-wider border-b border-slate-950 pb-2">
              DYNAMIC PAYMENT GATEWAYS & WALLETS
            </h3>

            {/* Field 1: BINANCE TRC20 ADDRESS */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-900">
              <div className="text-left flex-1">
                <span className="text-xs font-black text-white block uppercase tracking-wide">
                  BINANCE TRC20 WALLET ADDRESS
                </span>
                <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                  This address is dynamically displayed on the user's payment screen.
                </span>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  value={adminUsdt}
                  onChange={(e) => setAdminUsdt(e.target.value)}
                  className="flex-1 md:w-80 bg-slate-950 border border-slate-850 text-slate-100 text-xs rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-500/40 font-mono font-semibold"
                />
                <button
                  onClick={() => handleSaveConfigValue("nila_custom_usdt_v1", adminUsdt, "USDT Address")}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] px-4 py-2 rounded-xl transition duration-150 active:scale-95 cursor-pointer shrink-0"
                >
                  SAVE ADDRESS
                </button>
              </div>
            </div>

            {/* Field 2: bKash PERSONAL NUMBER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-900">
              <div className="text-left flex-1">
                <span className="text-xs font-black text-white block uppercase tracking-wide">
                  BKASH PERSONAL NUMBER
                </span>
                <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                  This number is dynamically displayed on the user's payment screen.
                </span>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  value={adminLtc}
                  onChange={(e) => setAdminLtc(e.target.value)}
                  className="flex-1 md:w-80 bg-slate-950 border border-slate-850 text-slate-100 text-xs rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-500/40 font-mono font-semibold"
                />
                <button
                  onClick={() => handleSaveConfigValue("nila_custom_ltc_v1", adminLtc, "bKash Number")}
                  className="bg-rose-500 hover:bg-rose-450 text-white font-black text-[10px] px-4 py-2 rounded-xl transition duration-150 active:scale-95 cursor-pointer shrink-0"
                >
                  SAVE NUMBER
                </button>
              </div>
            </div>
          </div>

          {/* Submitted payments transaction queue exactly matching screenshot */}
          <div className="bg-[#111116] border border-slate-900 rounded-3xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-950 pb-2.5">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                SUBMITTED TRANSACTIONS QUEUE
              </h3>
              {selectedPaymentIds.length > 0 && (
                <div className="flex items-center gap-2 animate-fade-in">
                  <span className="text-[10px] text-amber-500 font-bold">
                    {getBngNum(selectedPaymentIds.length)} টি ট্রানজেকশন সিলেক্ট করা হয়েছে
                  </span>
                  <button
                    onClick={handleBulkDeletePayments}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] py-1.5 px-3 rounded-xl transition duration-150 active:scale-95 cursor-pointer flex items-center gap-1.5 shadow animate-pulse"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    সব একসাথে মুছুন ও অ্যাকাউন্ট ডিলিট করুন ⚠️
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-950 text-slate-500 text-[10px] font-black uppercase tracking-wider bg-slate-950/20">
                    <th className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={handleToggleSelectAllVisible}
                          className="w-4 h-4 rounded border-2 border-indigo-500/40 bg-transparent flex items-center justify-center cursor-pointer"
                          title="সব সিলেক্ট করুন"
                        >
                          {isAllVisibleSelected && <div className="w-2 h-2 bg-indigo-500 rounded-sm" />}
                        </button>
                        <span>CHECK</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-2">TIMESTAMP</th>
                    <th className="py-2.5 px-2">SENDER NUMBER</th>
                    <th className="py-2.5 px-2">TRANSACTION ID</th>
                    <th className="py-2.5 px-2">STATUS</th>
                    <th className="py-2.5 px-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-950">
                  {slicedPayments.map(pay => (
                    <tr key={pay.id} className="hover:bg-slate-950/30 transition duration-150">
                      
                      {/* Check Column */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleToggleSelectPayment(pay.id)}
                          className="w-4 h-4 rounded border-2 border-indigo-500/40 bg-transparent flex items-center justify-center cursor-pointer"
                        >
                          {selectedPaymentIds.includes(pay.id) && <div className="w-2 h-2 bg-indigo-500 rounded-sm" />}
                        </button>
                      </td>

                      {/* Timestamp Column */}
                      <td className="py-3 px-2 text-slate-400 font-mono text-[10.5px]">
                        <div className="leading-tight">
                          <span className="block font-bold">{getBngDate(pay.timestamp)}</span>
                          <span className="text-[9px] opacity-80 block">{getBngTime(pay.timestamp)}</span>
                        </div>
                      </td>

                      {/* Sender Number */}
                      <td className="py-3 px-2 text-white font-extrabold font-mono text-[11px]">
                        {pay.senderNumber}
                      </td>

                      {/* Transaction ID in bright gold */}
                      <td className="py-3 px-2 text-amber-400 font-black font-mono text-[11px] tracking-wide">
                        {pay.transactionId}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-2">
                        {pay.status === "approved" ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black px-2 py-0.5 rounded-md uppercase">
                            VERIFIED
                          </span>
                        ) : pay.status === "rejected" ? (
                          <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-black px-2 py-0.5 rounded-md uppercase">
                            REJECTED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black px-2 py-0.5 rounded-md uppercase animate-pulse">
                            PENDING
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {pay.status === "pending" ? (
                            <>
                              <button
                                onClick={() => handleApprovePayment(pay)}
                                className="bg-emerald-650 hover:bg-emerald-600 text-white font-extrabold text-[10px] px-2 py-1 rounded cursor-pointer transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectPayment(pay)}
                                className="bg-rose-900 hover:bg-rose-800 text-white font-extrabold text-[10px] px-2 py-1 rounded cursor-pointer transition"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleDeletePayment(pay.id)}
                              className="text-slate-500 hover:text-rose-455 p-1 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls bar exactly matching Image 2 */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-950 text-[10.5px] text-slate-500 font-bold font-mono">
              <span>
                SHOWING {filteredPayments.length === 0 ? 0 : (paymentPage - 1) * paymentsPerPage + 1}-{Math.min(paymentPage * paymentsPerPage, filteredPayments.length)} OF {filteredPayments.length} ELEMENTS
              </span>

              <div className="flex items-center gap-1">
                <button
                  disabled={paymentPage === 1}
                  onClick={() => setPaymentPage(p => Math.max(1, p - 1))}
                  className="bg-slate-950 border border-slate-850 px-2 py-1 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  PREV
                </button>
                {Array.from({ length: paymentTotalPages }, (_, idx) => idx + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPaymentPage(p)}
                    className={`px-2 py-1 rounded border transition cursor-pointer ${
                      paymentPage === p
                        ? "bg-indigo-600 border-indigo-400 text-white font-extrabold"
                        : "bg-slate-950 border-slate-850 text-slate-400 hover:text-white"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={paymentPage === paymentTotalPages}
                  onClick={() => setPaymentPage(p => Math.min(paymentTotalPages, p + 1))}
                  className="bg-slate-950 border border-slate-850 px-2 py-1 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  NEXT
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {activeTab === "support" && (
        <div className="space-y-5 animate-fade-in">
          
          {/* General system configuration panel */}
          <div className="bg-[#111116] border border-slate-900 rounded-3xl p-4 space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-wider border-b border-slate-950 pb-2">
              SYSTEM UTILITY CONFIGURATION
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Telegram Channel Link */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono block">
                  TELEGRAM SUPPORT CHANNEL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={adminTelegram}
                    onChange={(e) => setAdminTelegram(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-850 text-slate-100 text-xs rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-500/40 font-mono"
                  />
                  <button
                    onClick={() => handleSaveConfigValue("nila_custom_telegram_v1", adminTelegram, "Telegram link")}
                    className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-[10px] px-3 py-2 rounded-xl transition cursor-pointer"
                  >
                    SAVE
                  </button>
                </div>
              </div>

              {/* Broadcast Announcement */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono block">
                  BROADCAST NOTIFICATION MESSAGE
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={globalAnnouncement}
                    onChange={(e) => setGlobalAnnouncement(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-850 text-slate-100 text-xs rounded-xl py-2 px-3 focus:outline-none"
                  />
                  <button
                    onClick={() => handleSaveConfigValue("nila_custom_announcement_v1", globalAnnouncement, "Notification Announcement")}
                    className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-[10px] px-3 py-2 rounded-xl transition cursor-pointer"
                  >
                    SAVE
                  </button>
                </div>
              </div>

              {/* Win rate */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono block">
                  TRADING SIGNALS WIN-RATE INDICATOR
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={adminWinRate}
                    onChange={(e) => setAdminWinRate(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-850 text-slate-100 text-xs rounded-xl py-2 px-3 focus:outline-none"
                  />
                  <button
                    onClick={() => handleSaveConfigValue("nila_custom_winrate_v1", adminWinRate, "Winrate percentage")}
                    className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-[10px] px-3 py-2 rounded-xl transition cursor-pointer"
                  >
                    SAVE
                  </button>
                </div>
              </div>

              {/* Trademark & Copyright Owner info */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono block">
                  TRADEMARK / OWNER BRAND NAME
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={adminOwner1}
                    onChange={(e) => setAdminOwner1(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-850 text-slate-100 text-xs rounded-xl py-2 px-3 focus:outline-none"
                  />
                  <button
                    onClick={() => handleSaveConfigValue("nila_custom_owner1_v1", adminOwner1, "Owner trademark")}
                    className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-[10px] px-3 py-2 rounded-xl transition cursor-pointer"
                  >
                    SAVE
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 💬 LIVE SUPPORT HUB & REAL-TIME CHAT */}
          <div className="bg-[#111116] border border-slate-900 rounded-3xl p-4 space-y-4">
            <div className="border-b border-slate-950 pb-3 flex items-center justify-between flex-wrap gap-2 text-left">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4.5 h-4.5 text-indigo-400" />
                💬 ৪. Support Tab (লাইভ সাপোর্ট ও গ্রাহক সেবা)
              </h3>
              <span className="text-[10px] font-black bg-indigo-950 text-indigo-400 border border-indigo-500/25 px-2.5 py-0.5 rounded-lg select-none">
                {Object.keys(supportChats).length} টি চ্যাট সক্রিয়
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* Left Sidebar Pane: Active support inquiries */}
              <div className="md:col-span-5 space-y-2.5 border-r border-slate-900 pr-0 md:pr-4">
                <div className="bg-slate-950/55 rounded-xl p-2 px-3 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider select-none text-left">
                  সাপোর্ট ইনকোয়ারি সাইডবার
                </div>
                
                <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar">
                  {Object.keys(supportChats).length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-xs font-semibold italic">
                      কোনো সাপোর্ট ইনকোয়ারি নেই
                    </div>
                  ) : (
                    Object.keys(supportChats).map((username) => {
                      const chat = supportChats[username];
                      const lastMsg = chat.messages?.[chat.messages.length - 1];
                      const unread = chat.unreadCountByAdmin || 0;
                      const isSelected = selectedChatUser === username;
                      const isOnline = activeSessions[username] !== undefined;

                      return (
                        <div
                          key={username}
                          onClick={() => {
                            setSelectedChatUser(username);
                            // Mark read by admin
                            try {
                              const chats = JSON.parse(localStorage.getItem("nila_support_chats_v2") || "{}");
                              if (chats[username]) {
                                chats[username].unreadCountByAdmin = 0;
                                localStorage.setItem("nila_support_chats_v2", JSON.stringify(chats));
                                setSupportChats(chats);
                                window.dispatchEvent(new Event("nila_settings_updated"));
                              }
                            } catch (e) {}
                            playChime();
                          }}
                          className={`p-3 rounded-2xl border transition duration-150 cursor-pointer flex items-center justify-between text-left ${
                            isSelected
                              ? "bg-indigo-950/20 border-indigo-500/65"
                              : "bg-slate-950/60 border-slate-900 hover:border-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 bg-transparent">
                            {/* Avatar */}
                            <div className="relative shrink-0 bg-transparent">
                              <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] text-white flex items-center justify-center font-black text-xs select-none">
                                {username.charAt(0).toUpperCase()}
                              </div>
                              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-950 ${isOnline ? "bg-emerald-400" : "bg-slate-650"}`} />
                            </div>

                            <div className="min-w-0 bg-transparent">
                              <span className="text-[11px] text-white font-extrabold truncate block font-mono bg-transparent">
                                {username}
                              </span>
                              <span className="text-[10px] text-slate-400 truncate block mt-0.5 max-w-[120px] bg-transparent">
                                {lastMsg ? lastMsg.text : "কোনো মেসেজ নেই"}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end shrink-0 gap-1 bg-transparent">
                            {lastMsg && (
                              <span className="text-[8px] font-mono font-bold text-slate-550 bg-transparent">
                                {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                            {unread > 0 && (
                              <span className="bg-rose-600 text-white font-black font-mono text-[9px] px-1.5 py-0.5 rounded-full animate-bounce">
                                {unread}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Main Pane: Real-time active chat conversation window */}
              <div className="md:col-span-7 flex flex-col justify-between min-h-[350px]">
                {!selectedChatUser ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 bg-slate-950/30 rounded-2xl border border-slate-900">
                    <MessageCircle className="w-10 h-10 text-slate-700 animate-pulse mb-3" />
                    <p className="text-xs font-bold leading-relaxed max-w-xs">
                      সাপোর্ট ইনকোয়ারি সাইডবার থেকে যেকোনো ইউজারের চ্যাট সিলেক্ট করে রিয়েল-টাইমে চ্যাট করুন।
                    </p>
                  </div>
                ) : (
                  (() => {
                    const activeChat = supportChats[selectedChatUser] || { messages: [] };
                    const isOnline = activeSessions[selectedChatUser] !== undefined;

                    return (
                      <div className="flex-1 flex flex-col justify-between bg-slate-950/40 rounded-2xl border border-slate-900 overflow-hidden">
                        
                        {/* Chat Header */}
                        <div className="bg-slate-950 px-3.5 py-2.5 border-b border-slate-900 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`} />
                            </span>
                            <div className="text-left bg-transparent">
                              <span className="text-xs font-black text-white font-mono block bg-transparent">
                                {selectedChatUser}
                              </span>
                              <span className="text-[8.5px] font-black uppercase text-indigo-400 font-mono tracking-wider block bg-transparent">
                                {isOnline ? "🟢 ACTIVE TRADER" : "⚪ OFFLINE"}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              try {
                                const chats = JSON.parse(localStorage.getItem("nila_support_chats_v2") || "{}");
                                delete chats[selectedChatUser];
                                localStorage.setItem("nila_support_chats_v2", JSON.stringify(chats));
                                setSupportChats(chats);
                                setSelectedChatUser(null);
                                window.dispatchEvent(new Event("nila_settings_updated"));
                                showToast("চ্যাট ডাটা সম্পূর্ণ ডিলিট করা হয়েছে");
                              } catch (e) {}
                            }}
                            className="bg-rose-950/30 hover:bg-rose-900/30 text-rose-400 font-bold text-[9px] px-2 py-1 rounded-lg border border-rose-500/25 cursor-pointer transition"
                          >
                            ডিলিট চ্যাট
                          </button>
                        </div>

                        {/* Messages Box */}
                        <div className="flex-1 p-3 space-y-2.5 max-h-[250px] overflow-y-auto custom-scrollbar flex flex-col">
                          {(activeChat.messages || []).length === 0 ? (
                            <div className="text-center py-6 text-slate-600 text-xs italic font-medium my-auto">
                              মেসেজ দিয়ে কথা বলা শুরু করুন
                            </div>
                          ) : (
                            activeChat.messages.map((m) => {
                              const isAdmin = m.sender === "admin";
                              return (
                                <div
                                  key={m.id}
                                  className={`flex flex-col max-w-[82%] ${
                                    isAdmin ? "self-end items-end" : "self-start items-start"
                                  }`}
                                >
                                  <div
                                    className={`px-3 py-2 rounded-2xl text-xs font-medium leading-relaxed break-words text-left ${
                                      isAdmin
                                        ? "bg-indigo-600 text-white rounded-tr-none shadow-md"
                                        : "bg-slate-900 border border-slate-805 text-slate-100 rounded-tl-none"
                                    }`}
                                  >
                                    {m.text}
                                  </div>
                                  <span className="text-[7.5px] font-mono font-bold text-slate-550 mt-1 select-none block px-1 bg-transparent">
                                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Input Row Form */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleAdminSendMessage();
                          }}
                          className="p-2 border-t border-slate-900 bg-slate-950 flex items-center gap-2"
                        >
                          <input
                            type="text"
                            value={adminReplyText}
                            onChange={(e) => setAdminReplyText(e.target.value)}
                            placeholder="মেসেজ টাইপ করুন..."
                            className="flex-1 bg-[#09090c] border border-slate-850 hover:border-slate-800 text-slate-200 text-xs rounded-xl py-2 px-3 placeholder-slate-600 focus:outline-none focus:border-indigo-500/30"
                          />
                          <button
                            type="submit"
                            className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition cursor-pointer active:scale-95"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </form>

                      </div>
                    );
                  })()
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG MODAL FOR BULK UNVERIFICATION */}
      {adminAlertMsg === "bulk_unverify" && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#111116] border-2 border-rose-500/30 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-3xl text-center select-none animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-white font-black text-sm uppercase tracking-wide">
                নিশ্চিত বালক ডি-অ্যাক্টিভেশন?
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed font-bold">
                আপনি কি আসলেই সকল সাধারণ ভেরিফাইড ইউজারকে আনভেরিফাইড (ফ্রি) মোডে পরিবর্তন করতে চান? এটি রিভার্স করা যাবে না!
              </p>
            </div>
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => setAdminAlertMsg(null)}
                className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs font-bold py-2.5 rounded-xl transition cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                onClick={handleBulkUnverify}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2.5 rounded-xl transition cursor-pointer"
              >
                হ্যাঁ, নিশ্চিত
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC NEW USER CREATION DIALOG MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <form onSubmit={handleCreateUserSubmit} className="bg-[#111116] border-2 border-indigo-500/30 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-3xl select-none animate-fade-in">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-900">
              <h4 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-400" />
                নতুন ট্রেডার তৈরি করুন
              </h4>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="p-1 text-slate-500 hover:text-white transition cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-left">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                  ইউজারনেম / ইমেইল
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. limon_trader"
                  className="w-full bg-slate-950 border border-slate-805 text-slate-100 text-xs rounded-xl py-2.5 px-3 focus:outline-none focus:border-indigo-500/40 font-mono font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                  পাসওয়ার্ড
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Default: 123456"
                  className="w-full bg-slate-950 border border-slate-805 text-slate-100 text-xs rounded-xl py-2.5 px-3 focus:outline-none focus:border-indigo-500/40 font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs font-bold py-2.5 rounded-xl transition cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black py-2.5 rounded-xl transition cursor-pointer"
              >
                তৈরি করুন
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
