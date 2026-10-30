import React from "react";
import { 
  Users, 
  Clock, 
  UserCheck, 
  UserX, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  CreditCard,
  Wifi,
  Database,
  ShieldCheck,
  TrendingUp,
  Calendar,
  Activity,
  RefreshCw,
  AlertCircle,
  Radio,
  FileQuestion,
  Hourglass
} from "lucide-react";
import { AdminDashboardStats } from "../../types";

interface AdminStatsOverviewProps {
  stats: AdminDashboardStats | null;
  language: "bn" | "en";
  onFilterCardClick: (target: string) => void;
  isSyncing?: boolean;
  isLoading?: boolean;
  errorMessage?: string | null;
  onRefresh?: () => void;
}

export default function AdminStatsOverview({ 
  stats, 
  language, 
  onFilterCardClick, 
  isSyncing,
  isLoading,
  errorMessage,
  onRefresh
}: AdminStatsOverviewProps) {
  // If stats is null and loading, display a sleek animated skeleton
  if (isLoading && !stats) {
    return (
      <div className="p-8 text-center bg-[#0c0e14] border border-slate-800 rounded-3xl space-y-3">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-300">
          {language === "bn" ? "সার্ভার থেকে লাইভ পরিসংখ্যান লোড হচ্ছে..." : "Loading live dashboard statistics from server..."}
        </p>
      </div>
    );
  }

  // If error occurred and no stats available
  if (errorMessage && !stats) {
    return (
      <div className="p-6 bg-rose-950/25 border-2 border-rose-500/30 rounded-3xl space-y-3 text-left">
        <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{language === "bn" ? "পরিসংখ্যান লোড করতে ত্রুটি হয়েছে" : "Failed to load dashboard statistics"}</span>
        </div>
        <p className="text-xs text-rose-200/90 leading-relaxed font-mono">
          {errorMessage}
        </p>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition active:scale-95 shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{language === "bn" ? "পুনরায় চেষ্টা করুন" : "Retry Loading"}</span>
          </button>
        )}
      </div>
    );
  }

  const s = stats || {
    totalUsers: 0,
    newRegistrationsToday: 0,
    newRegistrations7Days: 0,
    onlineUsers: 0,
    offlineUsers: 0,
    totalPendingPayments: 0,
    approvedPayments: 0,
    rejectedPayments: 0,
    underReviewPayments: 0,
    pendingVipRequests: 0,
    activeVipSubscribers: 0,
    expiredVipSubscriptions: 0,
    totalSignalsToday: 0,
    serverTime: Date.now(),
    timezone: "Asia/Dhaka",
  };

  const cards = [
    {
      id: "all-users",
      title: language === "bn" ? "মোট ইউজার" : "TOTAL USERS",
      count: s.totalUsers,
      sub: language === "bn" ? "নিবন্ধিত অ্যাকাউন্ট" : "Registered Accounts",
      icon: Users,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/25 hover:border-indigo-500/60",
    },
    {
      id: "online-users",
      title: language === "bn" ? "অনলাইন ইউজার" : "CURRENTLY ONLINE",
      count: s.onlineUsers,
      sub: language === "bn" ? "৬০ সেকেন্ড হার্টবিট সক্রিয়" : "Active heartbeat within 60s",
      icon: Radio,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30 hover:border-emerald-500/70 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
      badge: "LIVE",
    },
    {
      id: "offline-users",
      title: language === "bn" ? "অফলাইন ইউজার" : "CURRENTLY OFFLINE",
      count: s.offlineUsers,
      sub: language === "bn" ? "নিষ্ক্রিয় বা সাইন আউট" : "Inactive or signed out",
      icon: UserX,
      color: "text-slate-400",
      bg: "bg-slate-500/10",
      border: "border-slate-500/25 hover:border-slate-500/60",
    },
    {
      id: "pending-payments",
      title: language === "bn" ? "পেন্ডিং পেমেন্ট রিকোয়েস্ট" : "PENDING PAYMENTS",
      count: s.totalPendingPayments,
      sub: language === "bn" ? "অপেক্ষমান পেমেন্ট যাচাই" : "Awaiting Admin Review",
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/25 hover:border-amber-500/60",
      badge: s.totalPendingPayments > 0 ? "ACTION NEEDED" : undefined,
    },
    {
      id: "under-review-payments",
      title: language === "bn" ? "পর্যালোচনাধীন পেমেন্ট" : "UNDER REVIEW",
      count: s.underReviewPayments,
      sub: language === "bn" ? "যাচাই চলমান রিকোয়েস্ট" : "In-process Verification",
      icon: Hourglass,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/25 hover:border-blue-500/60",
    },
    {
      id: "approved-payments",
      title: language === "bn" ? "অ্যাপ্রুভড পেমেন্ট" : "APPROVED PAYMENTS",
      count: s.approvedPayments,
      sub: language === "bn" ? "অনুমোদিত লেনদেন" : "Verified Transactions",
      icon: CheckCircle2,
      color: "text-teal-400",
      bg: "bg-teal-500/10",
      border: "border-teal-500/25 hover:border-teal-500/60",
    },
    {
      id: "rejected-payments",
      title: language === "bn" ? "প্রত্যাখ্যাত পেমেন্ট" : "REJECTED PAYMENTS",
      count: s.rejectedPayments,
      sub: language === "bn" ? "বাতিলকৃত ট্রানজেকশন" : "Declined Requests",
      icon: ShieldAlert,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/25 hover:border-rose-500/60",
    },
    {
      id: "active-vip",
      title: language === "bn" ? "অ্যাক্টিভ VIP সদস্য" : "ACTIVE VIP USERS",
      count: s.activeVipSubscribers,
      sub: language === "bn" ? "সক্রিয় প্রিমিয়াম সাবস্ক্রিপশন" : "Active VIP Subscriptions",
      icon: Sparkles,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/25 hover:border-purple-500/60",
    },
    {
      id: "expired-vip",
      title: language === "bn" ? "মেয়াদোত্তীর্ণ VIP" : "EXPIRED VIP",
      count: s.expiredVipSubscriptions,
      sub: language === "bn" ? "মেয়াদ শেষ হয়েছে" : "Subscription Ended",
      icon: Clock,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/25 hover:border-orange-500/60",
    },
    {
      id: "signals-today",
      title: language === "bn" ? "আজকের সিগন্যাল রিকোয়েস্ট" : "SIGNALS TODAY",
      count: s.totalSignalsToday,
      sub: language === "bn" ? "আজকের মোট সিগন্যাল জেনারেশন" : "Platform analyses today",
      icon: Activity,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/25 hover:border-cyan-500/60",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Header Controls: Timezone, Status, Manual Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-[#0a0c12] border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <span className="font-extrabold text-white uppercase tracking-wider text-[11px]">
            {language === "bn" ? "লাইভ সার্ভার পরিসংখ্যান" : "LIVE SERVER METRICS"}
          </span>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            ({s.timezone})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-750 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
              title={language === "bn" ? "পরিসংখ্যান রিফ্রেশ করুন" : "Refresh Statistics"}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isLoading ? "animate-spin" : ""}`} />
              <span>{language === "bn" ? "রিফ্রেশ" : "Refresh"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary 10 Live Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onFilterCardClick(c.id)}
              className={`p-3 rounded-2xl bg-[#0f1118] border ${c.border} text-left transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-sm relative group`}
            >
              {c.badge && (
                <span className={`absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                  c.badge === "LIVE" ? "bg-emerald-500 text-black animate-pulse" : "bg-amber-500 text-black animate-pulse"
                }`}>
                  {c.badge}
                </span>
              )}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  {c.title}
                </span>
                <div className={`p-1.5 rounded-lg ${c.bg} ${c.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {c.count}
              </div>
              <p className="text-[9px] text-slate-500 font-medium truncate mt-0.5">
                {c.sub}
              </p>
              <div className="text-[8px] font-mono text-indigo-400/70 mt-1 flex items-center gap-1 group-hover:text-indigo-300">
                <span>{language === "bn" ? "তালিকা দেখুন" : "View filtered"}</span>
                <span>→</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Secondary Velocity & Distribution Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-[#0c0e14] border border-slate-800 text-xs">
        {/* User Registration Velocity */}
        <div className="space-y-1 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10px]">
            <Calendar className="w-3 h-3 text-indigo-400" />
            <span>{language === "bn" ? "নতুন রেজিস্ট্রেশন গতিবিধি" : "Registration Velocity"}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-white">{s.newRegistrationsToday}</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {language === "bn" ? "আজ (Today)" : "Today"}
            </span>
          </div>
          <div className="text-[9px] text-slate-500 font-mono">
            {language === "bn" ? "গত ৭ দিনে:" : "Last 7 Days:"} <span className="text-slate-300 font-bold">{s.newRegistrations7Days}</span>
          </div>
        </div>

        {/* Live Presence Ratio */}
        <div className="space-y-1 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10px]">
            <Radio className="w-3 h-3 text-emerald-400" />
            <span>{language === "bn" ? "অনলাইন বনাম অফলাইন অনুপাত" : "Presence Ratio"}</span>
          </div>
          <div className="text-lg font-black text-emerald-400">
            {s.onlineUsers} <span className="text-xs text-slate-400 font-normal">/ {s.offlineUsers} Offline</span>
          </div>
          <div className="text-[9px] text-slate-500 font-mono">
            {s.totalUsers > 0 ? Math.round((s.onlineUsers / s.totalUsers) * 100) : 0}% Active Online
          </div>
        </div>

        {/* VIP Conversion & Expiry Ratio */}
        <div className="space-y-1 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10px]">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>{language === "bn" ? "VIP সাবস্ক্রিপশন স্বাস্থ্য" : "VIP Subscription Health"}</span>
          </div>
          <div className="text-lg font-black text-purple-400">
            {s.activeVipSubscribers} <span className="text-xs text-slate-400 font-normal">Active</span>
          </div>
          <div className="text-[9px] text-slate-500 font-mono">
            Expired: <span className="text-orange-300 font-bold">{s.expiredVipSubscriptions}</span> | Pending: <span className="text-amber-300 font-bold">{s.totalPendingPayments}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
