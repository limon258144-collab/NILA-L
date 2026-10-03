import React from "react";
import { BarChart2, TrendingUp, DollarSign, Users, Sparkles, CheckCircle2, Ban, Clock } from "lucide-react";
import { UserAccount, PaymentRequestItem } from "../../types";

interface AdminAnalyticsProps {
  users: UserAccount[];
  payments: PaymentRequestItem[];
  language: "bn" | "en";
}

export default function AdminAnalytics({ users, payments, language }: AdminAnalyticsProps) {
  const totalUsers = users.length;
  const activeCount = users.filter((u) => u && u.status === "active").length;
  const inactiveCount = users.filter((u) => u && u.status === "inactive").length;
  const disabledCount = users.filter((u) => u && u.status === "disabled").length;
  const proCount = users.filter((u) => u && u.proStatus === "active").length;
  const nonProCount = Math.max(0, totalUsers - proCount);

  const approvedPayments = payments.filter((p) => p && p.status === "approved");
  const pendingPayments = payments.filter((p) => p && (p.status === "pending" || !p.status));
  const disabledPayments = payments.filter((p) => p && (p.status === "disabled" || p.status === "rejected"));

  const totalRevenue = approvedPayments.reduce((acc, p) => acc + (Number(p.amount) || 20), 0);
  const pendingRevenue = pendingPayments.reduce((acc, p) => acc + (Number(p.amount) || 20), 0);

  const bkashPayments = payments.filter(
    (p) => p && p.paymentMethod && p.paymentMethod.toLowerCase().includes("bkash")
  ).length;
  const cryptoPayments = payments.length - bkashPayments;

  const proPercent = totalUsers > 0 ? Math.round((proCount / totalUsers) * 100) : 0;
  const activePercent = totalUsers > 0 ? Math.round((activeCount / totalUsers) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800">
        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-emerald-400" />
          {language === "bn" ? "রিয়েল-টাইম ডাটাবেজ অ্যানালিটিক্স" : "Real-time Database Analytics"}
        </h3>
        <p className="text-[11px] text-slate-400">
          {language === "bn"
            ? "ব্যবহারকারী প্রবৃদ্ধি, সক্রিয়তা, প্রো কনভার্সন এবং রাজস্ব আয়ের লাইভ পরিসংখ্যান।"
            : "Live data metrics derived from real database accounts and transaction records."}
        </p>
      </div>

      {/* Top 3 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-[#0c0e14] border border-emerald-500/25 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>TOTAL VERIFIED REVENUE</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">${totalRevenue}</div>
          <p className="text-[10px] text-slate-500 font-mono">
            From {approvedPayments.length} approved payments
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c0e14] border border-purple-500/25 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>PRO CONVERSION RATE</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300">{proPercent}%</div>
          <p className="text-[10px] text-slate-500 font-mono">
            {proCount} Pro subscribers / {totalUsers} total
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c0e14] border border-amber-500/25 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>PENDING PIPELINE</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">${pendingRevenue}</div>
          <p className="text-[10px] text-slate-500 font-mono">
            {pendingPayments.length} transactions awaiting review
          </p>
        </div>
      </div>

      {/* Distribution Progress Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* User Status Breakdown */}
        <div className="p-4 rounded-2xl bg-[#0c0e14] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span>Account Status Distribution</span>
            <span className="text-[10px] font-mono text-slate-400">{activePercent}% Active</span>
          </div>

          <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${totalUsers > 0 ? (activeCount / totalUsers) * 100 : 0}%` }}
              className="bg-emerald-500 h-full"
              title={`Active: ${activeCount}`}
            />
            <div
              style={{ width: `${totalUsers > 0 ? (inactiveCount / totalUsers) * 100 : 0}%` }}
              className="bg-slate-600 h-full"
              title={`Inactive: ${inactiveCount}`}
            />
            <div
              style={{ width: `${totalUsers > 0 ? (disabledCount / totalUsers) * 100 : 0}%` }}
              className="bg-rose-500 h-full"
              title={`Disabled: ${disabledCount}`}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Active ({activeCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span>Inactive ({inactiveCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Disabled ({disabledCount})</span>
            </div>
          </div>
        </div>

        {/* Payment Methods Split */}
        <div className="p-4 rounded-2xl bg-[#0c0e14] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span>Payment Channels Breakdown</span>
            <span className="text-[10px] font-mono text-slate-400">{payments.length} Total</span>
          </div>

          <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex">
            <div
              style={{
                width: `${payments.length > 0 ? (bkashPayments / payments.length) * 100 : 50}%`,
              }}
              className="bg-pink-500 h-full"
              title={`bKash: ${bkashPayments}`}
            />
            <div
              style={{
                width: `${payments.length > 0 ? (cryptoPayments / payments.length) * 100 : 50}%`,
              }}
              className="bg-sky-500 h-full"
              title={`Crypto/USDT: ${cryptoPayments}`}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-pink-500" />
              <span>bKash ({bkashPayments})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span>Crypto / USDT / TRX ({cryptoPayments})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
