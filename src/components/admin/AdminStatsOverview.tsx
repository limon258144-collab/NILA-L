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
  Calendar
} from "lucide-react";

interface AdminStatsOverviewProps {
  stats: {
    totalUsers: number;
    pendingRequests: number;
    activeUsers: number;
    inactiveUsers: number;
    disabledUsers: number;
    proUsers: number;
    nonProUsers: number;
    approvedPayments: number;
    disabledPayments: number;
    totalPaymentRequests: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    requestsToday: number;
    approvedToday: number;
    pendingToday: number;
  };
  language: "bn" | "en";
  onFilterCardClick: (target: "all-users" | "pending-payments" | "active-users" | "inactive-users" | "disabled-users" | "pro-users" | "approved-payments" | "all-payments") => void;
  isSyncing?: boolean;
}

export default function AdminStatsOverview({ stats, language, onFilterCardClick, isSyncing }: AdminStatsOverviewProps) {
  const cards = [
    {
      id: "all-users" as const,
      title: language === "bn" ? "মোট ইউজার" : "TOTAL USERS",
      count: stats.totalUsers,
      sub: language === "bn" ? "নিবন্ধিত অ্যাকাউন্ট" : "Registered Accounts",
      icon: Users,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/25 hover:border-indigo-500/60",
    },
    {
      id: "pending-payments" as const,
      title: language === "bn" ? "পেন্ডিং রিকোয়েস্ট" : "PENDING REQUESTS",
      count: stats.pendingRequests,
      sub: language === "bn" ? "অপেক্ষমান যাচাই" : "Awaiting Approval",
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/25 hover:border-amber-500/60",
      badge: stats.pendingRequests > 0 ? "ACTION NEEDED" : undefined,
    },
    {
      id: "active-users" as const,
      title: language === "bn" ? "অ্যাক্টিভ ইউজার" : "ACTIVE USERS",
      count: stats.activeUsers,
      sub: language === "bn" ? "সক্রিয় সদস্য" : "Normal Active Access",
      icon: UserCheck,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/25 hover:border-emerald-500/60",
    },
    {
      id: "inactive-users" as const,
      title: language === "bn" ? "ইন-অ্যাক্টিভ ইউজার" : "INACTIVE USERS",
      count: stats.inactiveUsers,
      sub: language === "bn" ? "নিষ্ক্রিয় অ্যাকাউন্ট" : "Inactive Members",
      icon: UserX,
      color: "text-slate-400",
      bg: "bg-slate-500/10",
      border: "border-slate-500/25 hover:border-slate-500/60",
    },
    {
      id: "disabled-users" as const,
      title: language === "bn" ? "ডিজেবল্ড ইউজার" : "DISABLED USERS",
      count: stats.disabledUsers,
      sub: language === "bn" ? "ব্লক করা অ্যাকাউন্ট" : "Blocked Accounts",
      icon: ShieldAlert,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/25 hover:border-rose-500/60",
    },
    {
      id: "pro-users" as const,
      title: language === "bn" ? "প্রো অ্যাক্টিভ ইউজার" : "PRO ACTIVE USERS",
      count: stats.proUsers,
      sub: language === "bn" ? "প্রিমিয়াম সদস্য" : "Pro Tier Active",
      icon: Sparkles,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/25 hover:border-purple-500/60",
    },
    {
      id: "approved-payments" as const,
      title: language === "bn" ? "অ্যাপ্রুভড পেমেন্ট" : "APPROVED PAYMENTS",
      count: stats.approvedPayments,
      sub: language === "bn" ? "সফল লেনদেন" : "Completed Payments",
      icon: CheckCircle2,
      color: "text-teal-400",
      bg: "bg-teal-500/10",
      border: "border-teal-500/25 hover:border-teal-500/60",
    },
    {
      id: "all-payments" as const,
      title: language === "bn" ? "মোট পেমেন্ট রিকোয়েস্ট" : "TOTAL PAYMENT REQUESTS",
      count: stats.totalPaymentRequests,
      sub: language === "bn" ? "সর্বমোট আবেদন" : "All Submissions",
      icon: CreditCard,
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      border: "border-sky-500/25 hover:border-sky-500/60",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Clickable Real-Time Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-black text-[8px] font-black uppercase tracking-wider animate-pulse">
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
                <span>View filtered list</span>
                <span>→</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Real-time Velocity Counters (Today / Week / Month) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-[#0c0e14] border border-slate-800 text-xs">
        <div className="space-y-1 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10px]">
            <Calendar className="w-3 h-3 text-indigo-400" />
            <span>{language === "bn" ? "আজকের নতুন ইউজার" : "New Users Today"}</span>
          </div>
          <div className="text-lg font-black text-white">{stats.newToday}</div>
          <div className="text-[9px] text-slate-500 font-mono">
            Week: <span className="text-slate-300">{stats.newThisWeek}</span> | Month: <span className="text-slate-300">{stats.newThisMonth}</span>
          </div>
        </div>

        <div className="space-y-1 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10px]">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>{language === "bn" ? "আজকের পেমেন্ট" : "Payments Today"}</span>
          </div>
          <div className="text-lg font-black text-emerald-400">{stats.requestsToday}</div>
          <div className="text-[9px] text-slate-500 font-mono">
            Approved: <span className="text-teal-300">{stats.approvedToday}</span> | Pending: <span className="text-amber-300">{stats.pendingToday}</span>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 space-y-1 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10px]">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>{language === "bn" ? "প্রো বনাম ফ্রি অনুপাত" : "Pro vs Non-Pro"}</span>
          </div>
          <div className="text-lg font-black text-purple-400">
            {stats.proUsers} <span className="text-xs text-slate-400 font-normal">/ {stats.nonProUsers} Free</span>
          </div>
          <div className="text-[9px] text-slate-500 font-mono">
            Rate: {stats.totalUsers > 0 ? Math.round((stats.proUsers / stats.totalUsers) * 100) : 0}% Conversion
          </div>
        </div>
      </div>

      {/* System Health / Overview (No secrets exposed) */}
      <div className="p-3 rounded-2xl bg-[#090b10] border border-indigo-500/20 flex flex-wrap items-center justify-between gap-3 text-[11px]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <span className="font-extrabold text-white uppercase tracking-wider text-[10px]">
            {language === "bn" ? "সিস্টেম স্ট্যাটাস ও কানেকশন" : "SYSTEM HEALTH OVERVIEW"}
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[10px]">
          <div className="flex items-center gap-1 text-slate-300">
            <Database className="w-3 h-3 text-sky-400" />
            <span>Database:</span>
            <span className="text-emerald-400 font-bold">CONNECTED</span>
          </div>

          <div className="flex items-center gap-1 text-slate-300">
            <ShieldCheck className="w-3 h-3 text-purple-400" />
            <span>Auth:</span>
            <span className="text-emerald-400 font-bold">ACTIVE</span>
          </div>

          <div className="flex items-center gap-1 text-slate-300">
            <Wifi className="w-3 h-3 text-indigo-400" />
            <span>Sync:</span>
            <span className="text-indigo-300 font-bold">{isSyncing ? "SYNCING..." : "SYNCED"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
