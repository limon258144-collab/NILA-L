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
  ExternalLink,
  Hourglass,
  Eye,
  UserCheck
} from "lucide-react";
import { PaymentRequestItem, PaymentStatus } from "../../types";

interface AdminPaymentRequestsProps {
  payments: PaymentRequestItem[];
  language: "bn" | "en";
  activeFilter: "all" | "pending" | "under_review" | "approved" | "rejected" | "disabled";
  onFilterChange: (filter: "all" | "pending" | "under_review" | "approved" | "rejected" | "disabled") => void;
  onApprove: (payment: PaymentRequestItem) => void;
  onUnderReview?: (payment: PaymentRequestItem) => void;
  onReject?: (payment: PaymentRequestItem) => void;
  onDisable?: (payment: PaymentRequestItem) => void;
  isActionLoading?: boolean;
}

export default function AdminPaymentRequests({
  payments,
  language,
  activeFilter,
  onFilterChange,
  onApprove,
  onUnderReview,
  onReject,
  onDisable,
  isActionLoading,
}: AdminPaymentRequestsProps) {
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequestItem | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    type: "APPROVE" | "REJECT" | "UNDER_REVIEW";
    payment: PaymentRequestItem;
  } | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Helper to normalize status comparison
  const normalizeStatus = (status: PaymentStatus | string | undefined): "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" => {
    if (!status) return "PENDING";
    const upper = status.toUpperCase();
    if (upper === "APPROVED") return "APPROVED";
    if (upper === "REJECTED" || upper === "DISABLED") return "REJECTED";
    if (upper === "UNDER_REVIEW") return "UNDER_REVIEW";
    return "PENDING";
  };

  // Filter payments
  const filteredPayments = payments.filter((p) => {
    if (!p) return false;
    const norm = normalizeStatus(p.status);

    if (activeFilter === "pending" && norm !== "PENDING") return false;
    if (activeFilter === "under_review" && norm !== "UNDER_REVIEW") return false;
    if (activeFilter === "approved" && norm !== "APPROVED") return false;
    if (activeFilter === "rejected" && norm !== "REJECTED") return false;
    if (activeFilter === "disabled" && norm !== "REJECTED") return false;

    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      (p.id && p.id.toLowerCase().includes(q)) ||
      (p.username && p.username.toLowerCase().includes(q)) ||
      (p.userEmail && p.userEmail.toLowerCase().includes(q)) ||
      (p.userName && p.userName.toLowerCase().includes(q)) ||
      (p.transactionId && p.transactionId.toLowerCase().includes(q)) ||
      (p.senderNumber && p.senderNumber.toLowerCase().includes(q)) ||
      (p.paymentMethod && p.paymentMethod.toLowerCase().includes(q)) ||
      (p.userId && p.userId.toLowerCase().includes(q))
    );
  });

  const pendingCount = payments.filter((p) => normalizeStatus(p.status) === "PENDING").length;
  const underReviewCount = payments.filter((p) => normalizeStatus(p.status) === "UNDER_REVIEW").length;
  const approvedCount = payments.filter((p) => normalizeStatus(p.status) === "APPROVED").length;
  const rejectedCount = payments.filter((p) => normalizeStatus(p.status) === "REJECTED").length;

  // Pagination calculation
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * itemsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + itemsPerPage);

  const handleConfirmAction = () => {
    if (!confirmModal) return;
    const { type, payment } = confirmModal;
    if (type === "APPROVE") {
      onApprove(payment);
    } else if (type === "REJECT") {
      if (onReject) onReject(payment);
      else if (onDisable) onDisable(payment);
    } else if (type === "UNDER_REVIEW" && onUnderReview) {
      onUnderReview(payment);
    }
    setConfirmModal(null);
    setReviewNote("");
  };

  return (
    <div className="space-y-4">
      {/* Header and Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-sky-400" />
            {language === "bn" ? "পেমেন্ট গেটওয়ে এক্টিভেশন রিকোয়েস্ট" : "Payment Gateway Requests Management"}
          </h3>
          <p className="text-[11px] text-slate-400">
            {language === "bn"
              ? "সরাসরি ডাটাবেজ থেকে প্রতিটি পেমেন্ট রিকোয়েস্ট যাচাই এবং ভিআইপি এক্টিভেশন।"
              : "Review real-time payment submissions, verify TrxID, approve 30-day VIP or reject."}
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto overflow-x-auto custom-scrollbar">
          <button
            type="button"
            onClick={() => { onFilterChange("all"); setCurrentPage(1); }}
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
            onClick={() => { onFilterChange("pending"); setCurrentPage(1); }}
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
            onClick={() => { onFilterChange("under_review"); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
              activeFilter === "under_review"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-blue-400 hover:text-blue-300"
            }`}
          >
            <Hourglass className="w-3 h-3" />
            UNDER REVIEW ({underReviewCount})
          </button>
          <button
            type="button"
            onClick={() => { onFilterChange("approved"); setCurrentPage(1); }}
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
            onClick={() => { onFilterChange("rejected"); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
              activeFilter === "rejected" || activeFilter === "disabled"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-rose-400 hover:text-rose-300"
            }`}
          >
            <Ban className="w-3 h-3" />
            REJECTED ({rejectedCount})
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          placeholder={
            language === "bn"
              ? "ট্রানজেকশন ID (TrxID), ইমেইল, রিকোয়েস্ট ID বা প্রেরক নম্বর দিয়ে খুঁজুন..."
              : "Search by Transaction ID (TrxID), Email, Request ID, or Sender Phone..."
          }
          className="w-full bg-[#0c0e14] border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 font-sans"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs cursor-pointer"
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
          paginatedPayments.map((p) => {
            const normStatus = normalizeStatus(p.status);
            const isPending = normStatus === "PENDING";
            const isUnderReview = normStatus === "UNDER_REVIEW";
            const isApproved = normStatus === "APPROVED";
            const isRejected = normStatus === "REJECTED";

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
                    : isUnderReview
                    ? "bg-[#0b1018] border-blue-500/25 hover:border-blue-500/40"
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
                    <div className="text-[9px] text-slate-500 font-mono flex flex-wrap items-center gap-2">
                      <span 
                        onClick={() => handleCopy(p.id, p.id)}
                        className="hover:text-indigo-300 cursor-pointer flex items-center gap-1"
                        title="Click to copy Request ID"
                      >
                        Req ID: {p.id}
                        {copiedId === p.id ? <span className="text-emerald-400">✓</span> : null}
                      </span>
                      {p.userId && <span>• UID: {p.userId}</span>}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isPending ? (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-black text-[9px] uppercase tracking-wider flex items-center gap-1 animate-pulse">
                        <Clock className="w-3 h-3" />
                        PENDING REVIEW
                      </span>
                    ) : isUnderReview ? (
                      <span className="px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 font-black text-[9px] uppercase tracking-wider flex items-center gap-1">
                        <Hourglass className="w-3 h-3" />
                        UNDER REVIEW
                      </span>
                    ) : isApproved ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-[9px] uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        APPROVED ✦ VIP ACTIVE
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 font-black text-[9px] uppercase tracking-wider flex items-center gap-1">
                        <Ban className="w-3 h-3" />
                        REJECTED
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
                      {p.paymentMethod || "bKash"} {p.network ? `(${p.network})` : ""}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">
                      REQUESTED AMOUNT
                    </span>
                    <p className="font-black text-emerald-400">
                      ${p.amount || 20}.00 USD
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">
                      TRANSACTION ID (TRXID)
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-bold text-slate-100 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700 text-[11px] truncate max-w-[130px]">
                        {p.transactionId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(p.transactionId, `tx_${p.id}`)}
                        className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                        title="Copy TrxID"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      {copiedId === `tx_${p.id}` && <span className="text-[9px] text-emerald-400">✓</span>}
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-500 font-mono uppercase font-bold">
                      SENDER PHONE / WALLET
                    </span>
                    <p className="font-mono font-bold text-slate-300">
                      {p.senderNumber || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Footer Row: Timestamp, Review Audit, and Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-800/80">
                  <div className="text-[10px] text-slate-400 font-mono space-y-0.5">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Calendar className="w-3 h-3" />
                      <span>Submitted: {dateStr}</span>
                    </div>
                    {(p.reviewedBy || p.approvedBy || p.disabledBy) && (
                      <div className="text-slate-400">
                        Reviewed by: <span className="text-indigo-300">{p.reviewedBy || p.approvedBy || p.disabledBy}</span>
                        {p.reviewedAt && ` at ${new Date(p.reviewedAt).toLocaleString()}`}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setSelectedRequest(p)}
                      className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="View full request details"
                    >
                      <Eye className="w-3 h-3" />
                      <span>{language === "bn" ? "বিস্তারিত" : "Details"}</span>
                    </button>

                    {isPending && onUnderReview && (
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => setConfirmModal({ type: "UNDER_REVIEW", payment: p })}
                        className="px-2.5 py-1 rounded-xl bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/30 text-blue-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Hourglass className="w-3 h-3" />
                        <span>{language === "bn" ? "পর্যালোচনায় রাখুন" : "Under Review"}</span>
                      </button>
                    )}

                    {!isApproved && (
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => setConfirmModal({ type: "APPROVE", payment: p })}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition flex items-center gap-1 shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{language === "bn" ? "অ্যাপ্রুভ (VIP একটিভ)" : "Approve VIP"}</span>
                      </button>
                    )}

                    {!isRejected && (
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => setConfirmModal({ type: "REJECT", payment: p })}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <Ban className="w-3 h-3" />
                        <span>{language === "bn" ? "বাতিল" : "Reject"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-3 rounded-2xl bg-[#0a0c12] border border-slate-800 text-xs mt-3">
            <span className="text-[11px] text-slate-400 font-mono">
              {language === "bn"
                ? `মোট ${filteredPayments.length} টির মধ্যে ${startIndex + 1} - ${Math.min(filteredPayments.length, startIndex + itemsPerPage)} দেখানো হচ্ছে`
                : `Showing ${startIndex + 1} - ${Math.min(filteredPayments.length, startIndex + itemsPerPage)} of ${filteredPayments.length} requests`}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs cursor-pointer transition active:scale-95"
              >
                {language === "bn" ? "পূর্ববর্তী" : "Previous"}
              </button>
              <span className="px-2 py-1 text-[11px] font-mono text-indigo-300 font-bold">
                {validPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs cursor-pointer transition active:scale-95"
              >
                {language === "bn" ? "পরবর্তী" : "Next"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-[#10121a] border-2 border-indigo-500/30 rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl text-left">
            <div className="flex items-start justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {confirmModal.type === "APPROVE" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : confirmModal.type === "UNDER_REVIEW" ? (
                  <Hourglass className="w-5 h-5 text-blue-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                )}
                <h4 className="text-white font-extrabold text-sm">
                  {confirmModal.type === "APPROVE"
                    ? (language === "bn" ? "পেমেন্ট অনুমোদন নিশ্চিতকরণ" : "Confirm Payment Approval")
                    : confirmModal.type === "UNDER_REVIEW"
                    ? (language === "bn" ? "পর্যালোচনা তালিকায় রাখুন" : "Mark as Under Review")
                    : (language === "bn" ? "পেমেন্ট বাতিল নিশ্চিতকরণ" : "Confirm Payment Rejection")}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-2">
              <p>
                {confirmModal.type === "APPROVE"
                  ? (language === "bn"
                      ? `আপনি কি নিশ্চিত যে ইউজার ${confirmModal.payment.username} এর পেমেন্ট অনুমোদন করতে চান? এটি সাথে সাথে ইউজার অ্যাকাউন্টে ৩০ দিনের VIP সাবস্ক্রিপশন চালু করবে।`
                      : `Are you sure you want to approve payment for ${confirmModal.payment.username}? This will activate 30 days of VIP access for this user immediately.`)
                  : confirmModal.type === "UNDER_REVIEW"
                  ? (language === "bn"
                      ? `এই রিকোয়েস্টটিকে পর্যালোচনাধীন অবস্থায় রাখবেন?`
                      : `Do you want to mark this request as Under Review?`)
                  : (language === "bn"
                      ? `আপনি কি নিশ্চিত যে এই রিকোয়েস্টটি (${confirmModal.payment.transactionId}) বাতিল করতে চান?`
                      : `Are you sure you want to reject this payment request (${confirmModal.payment.transactionId})?`)}
              </p>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] space-y-1">
                <div>User: <span className="text-white font-bold">{confirmModal.payment.username}</span></div>
                <div>TrxID: <span className="text-emerald-300">{confirmModal.payment.transactionId}</span></div>
                <div>Amount: <span className="text-white font-bold">${confirmModal.payment.amount}.00</span></div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                {language === "bn" ? "না, ফিরে যান" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={handleConfirmAction}
                className={`flex-1 py-2 px-3 rounded-xl text-white text-xs font-black transition cursor-pointer active:scale-95 disabled:opacity-50 ${
                  confirmModal.type === "APPROVE"
                    ? "bg-emerald-600 hover:bg-emerald-500 shadow-md"
                    : confirmModal.type === "UNDER_REVIEW"
                    ? "bg-blue-600 hover:bg-blue-500"
                    : "bg-rose-600 hover:bg-rose-500"
                }`}
              >
                {confirmModal.type === "APPROVE"
                  ? (language === "bn" ? "হ্যাঁ, অনুমোদন করুন" : "Yes, Approve")
                  : confirmModal.type === "UNDER_REVIEW"
                  ? (language === "bn" ? "পর্যালোচনায় রাখুন" : "Set Under Review")
                  : (language === "bn" ? "হ্যাঁ, বাতিল করুন" : "Yes, Reject")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-[#10121a] border-2 border-indigo-500/30 rounded-3xl p-5 max-w-lg w-full space-y-4 shadow-2xl text-left max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-white font-extrabold text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-sky-400" />
                  <span>Request Details: {selectedRequest.id}</span>
                </h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedRequest.username}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-white p-1 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Status</span>
                <p className="font-extrabold text-sm text-amber-400 uppercase">{selectedRequest.status}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Amount</span>
                <p className="font-extrabold text-sm text-emerald-400">${selectedRequest.amount || 20}.00 USD</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Method</span>
                <p className="font-bold text-slate-200">{selectedRequest.paymentMethod} {selectedRequest.network ? `(${selectedRequest.network})` : ""}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Sender Number</span>
                <p className="font-mono font-bold text-slate-200">{selectedRequest.senderNumber || "N/A"}</p>
              </div>

              <div className="col-span-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Transaction Reference (TrxID)</span>
                <p className="font-mono font-black text-sm text-white select-all">{selectedRequest.transactionId}</p>
              </div>

              <div className="col-span-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Audit History</span>
                <div className="text-[11px] text-slate-400 font-mono space-y-0.5">
                  <div>Submitted: {new Date(selectedRequest.timestamp).toLocaleString()}</div>
                  {selectedRequest.reviewedBy && (
                    <div>Reviewed by: {selectedRequest.reviewedBy} at {selectedRequest.reviewedAt ? new Date(selectedRequest.reviewedAt).toLocaleString() : "N/A"}</div>
                  )}
                  {selectedRequest.approvedBy && (
                    <div className="text-emerald-400">Approved by: {selectedRequest.approvedBy} at {selectedRequest.approvedAt ? new Date(selectedRequest.approvedAt).toLocaleString() : "N/A"}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
