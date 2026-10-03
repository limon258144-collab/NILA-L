import React, { useState } from "react";
import { 
  Check, 
  X, 
  Search, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Ban, 
  CreditCard, 
  DollarSign, 
  Calendar, 
  ShieldAlert,
  Sparkles,
  Copy,
  ExternalLink
} from "lucide-react";
import { PaymentRequestItem, PaymentStatus } from "../../types";

interface AdminPaymentRequestsProps {
  payments: PaymentRequestItem[];
  language: "bn" | "en";
  activeFilter: "all" | "pending" | "approved" | "disabled";
  onFilterChange: (filter: "all" | "pending" | "approved" | "disabled") => void;
  onApprove: (payment: PaymentRequestItem) => void;
  onDisable: (payment: PaymentRequestItem) => void;
  isActionLoading?: boolean;
}

export default function AdminPaymentRequests({
  payments,
  language,
  activeFilter,
  onFilterChange,
  onApprove,
  onDisable,
  isActionLoading,
}: AdminPaymentRequestsProps) {
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Filter payments
  const filteredPayments = payments.filter((p) => {
    if (!p) return false;
    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "pending" && (p.status === "pending" || !p.status)) ||
      (activeFilter === "approved" && p.status === "approved") ||
      (activeFilter === "disabled" && (p.status === "disabled" || p.status === "rejected"));

    if (!matchesFilter) return false;

    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      (p.username && p.username.toLowerCase().includes(q)) ||
      (p.userEmail && p.userEmail.toLowerCase().includes(q)) ||
      (p.userName && p.userName.toLowerCase().includes(q)) ||
      (p.transactionId && p.transactionId.toLowerCase().includes(q)) ||
      (p.senderNumber && p.senderNumber.toLowerCase().includes(q)) ||
      (p.paymentMethod && p.paymentMethod.toLowerCase().includes(q)) ||
      (p.userId && p.userId.toLowerCase().includes(q))
    );
  });

  const pendingCount = payments.filter((p) => p && (p.status === "pending" || !p.status)).length;
  const approvedCount = payments.filter((p) => p && p.status === "approved").length;
  const disabledCount = payments.filter((p) => p && (p.status === "disabled" || p.status === "rejected")).length;

  return (
    <div className="space-y-4">
      {/* Header and Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-sky-400" />
            {language === "bn" ? "পেমেন্ট রিকোয়েস্ট ম্যানেজমেন্ট" : "Payment Requests Management"}
          </h3>
          <p className="text-[11px] text-slate-400">
            {language === "bn"
              ? "ইউজারদের পাঠানো প্রতিটি ট্রানজেকশন রিয়েল-টাইমে এখানে দেখা যাচ্ছে।"
              : "Review real-time payment submissions, verify TrxID, approve PRO or disable accounts."}
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => onFilterChange("all")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
              activeFilter === "all"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ALL ({payments.length})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("pending")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
              activeFilter === "pending"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-amber-400 hover:text-amber-300"
            }`}
          >
            <Clock className="w-3 h-3" />
            PENDING ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("approved")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
              activeFilter === "approved"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-emerald-400 hover:text-emerald-300"
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            APPROVED ({approvedCount})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("disabled")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
              activeFilter === "disabled"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-rose-400 hover:text-rose-300"
            }`}
          >
            <Ban className="w-3 h-3" />
            DISABLED ({disabledCount})
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            language === "bn"
              ? "ট্রানজেকশন ID, ইমেইল, ইউজার বা নম্বর দিয়ে খুঁজুন..."
              : "Search by Transaction ID, Email, User name or Phone..."
          }
          className="w-full bg-[#0c0e14] border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 font-sans"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Payment Requests List */}
      <div className="space-y-3">
        {filteredPayments.length === 0 ? (
          <div className="p-8 text-center bg-[#0c0e14] border border-slate-850 rounded-2xl space-y-2">
            <CreditCard className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400 font-semibold">
              {language === "bn"
                ? "কোনো পেমেন্ট রিকোয়েস্ট পাওয়া যায়নি।"
                : "No payment requests found matching this filter."}
            </p>
          </div>
        ) : (
          filteredPayments.map((p) => {
            const isPending = p.status === "pending" || !p.status;
            const isApproved = p.status === "approved";
            const isDisabled = p.status === "disabled" || p.status === "rejected";

            const dateStr = p.timestamp
              ? new Date(p.timestamp).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : "N/A";

            return (
              <div
                key={p.id}
                className={`p-4 rounded-2xl border transition-all duration-150 ${
                  isPending
                    ? "bg-[#10121a] border-amber-500/30 hover:border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.05)]"
                    : isApproved
                    ? "bg-[#0b1213] border-emerald-500/25 hover:border-emerald-500/40"
                    : "bg-[#140c0f] border-rose-500/20 hover:border-rose-500/30"
                }`}
              >
                {/* Header row: User and Status badge */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-white">
                        {p.userName || (p.username ? p.username.split("@")[0] : "User")}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({p.userEmail || p.username})
                      </span>
                    </div>
                    {p.userId && (
                      <div className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                        <span>UID: {p.userId}</span>
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isPending ? (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-black text-[9px] uppercase tracking-wider flex items-center gap-1 animate-pulse">
                        <Clock className="w-3 h-3" />
                        PENDING
                      </span>
                    ) : isApproved ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-[9px] uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        APPROVED ✦ PRO ACTIVE
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 font-black text-[9px] uppercase tracking-wider flex items-center gap-1">
                        <Ban className="w-3 h-3" />
                        DISABLED ✦ BLOCKED
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">
                      PAYMENT METHOD
                    </span>
                    <p className="font-bold text-slate-200">
                      {p.paymentMethod || "bKash"}
                      {p.network ? ` (${p.network})` : ""}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">
                      AMOUNT
                    </span>
                    <p className="font-black text-emerald-400 text-sm">
                      ${p.amount} <span className="text-[10px] text-slate-400 font-normal">(approx. 2500 tk)</span>
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">
                      TRANSACTION ID (TrxID)
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-bold text-amber-300 text-[11px] select-all">
                        {p.transactionId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(p.transactionId, p.id)}
                        className="p-1 hover:text-white text-slate-500 cursor-pointer"
                        title="Copy TrxID"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      {copiedId === p.id && (
                        <span className="text-[9px] text-emerald-400 font-bold">Copied!</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">
                      SENDER PHONE / WALLET
                    </span>
                    <p className="font-mono text-slate-300 font-semibold text-[11px]">
                      {p.senderNumber || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Timestamp and Submitter Meta */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>Submitted: {dateStr}</span>
                    {p.approvedAt && (
                      <span className="text-emerald-400/90 ml-2">
                        ✦ Verified: {new Date(p.approvedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>

                  {/* Actions for Pending Requests */}
                  {isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => onApprove(p)}
                        className="px-4 py-2 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-[#07090e] font-black text-xs uppercase tracking-wider transition shadow-[0_0_15px_rgba(0,230,118,0.3)] active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        APPROVE
                      </button>

                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => onDisable(p)}
                        className="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/40 text-rose-300 font-bold text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        DISABLE
                      </button>
                    </div>
                  )}

                  {!isPending && (
                    <div className="flex items-center gap-2">
                      {isApproved && (
                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() => onDisable(p)}
                          className="px-3 py-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/30 text-rose-300 text-[10px] font-bold transition cursor-pointer"
                        >
                          Revoke / Disable Account
                        </button>
                      )}
                      {isDisabled && (
                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() => onApprove(p)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold transition cursor-pointer"
                        >
                          Re-Approve & Restore PRO
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
