import React, { useState } from "react";
import { 
  Users, 
  Search, 
  Key, 
  ShieldCheck, 
  ShieldAlert, 
  UserCheck, 
  UserX, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Ban, 
  CreditCard, 
  Calendar, 
  Copy, 
  ExternalLink,
  X,
  Plus,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { UserAccount, PaymentRequestItem, UserAccountStatus, ProAccountStatus } from "../../types";

interface AdminUsersManagementProps {
  users: UserAccount[];
  payments: PaymentRequestItem[];
  language: "bn" | "en";
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onActivateUser: (email: string) => void;
  onDeactivateUser: (email: string) => void;
  onDisableUser: (email: string) => void;
  onActivatePro: (email: string) => void;
  onDeactivatePro: (email: string) => void;
  onResetPassword: (email: string, newPass: string) => void;
  onAddUser?: (email: string, pass: string, name: string) => void;
}

export default function AdminUsersManagement({
  users,
  payments,
  language,
  activeFilter,
  onFilterChange,
  onActivateUser,
  onDeactivateUser,
  onDisableUser,
  onActivatePro,
  onDeactivatePro,
  onResetPassword,
  onAddUser,
}: AdminUsersManagementProps) {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [showResetModal, setShowResetModal] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPass, setNewPass] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const getPaymentsForUser = (email: string) => {
    return payments.filter(
      (p) => p && p.username && p.username.toLowerCase() === email.toLowerCase()
    );
  };

  const getUserPaymentStatus = (email: string): string => {
    const userPayments = getPaymentsForUser(email);
    if (userPayments.length === 0) return "none";
    if (userPayments.some((p) => p.status === "pending")) return "pending";
    if (userPayments.some((p) => p.status === "approved")) return "approved";
    if (userPayments.some((p) => p.status === "disabled")) return "disabled";
    return "none";
  };

  // Filter users based on activeFilter and search
  const filteredUsers = users.filter((u) => {
    if (!u) return false;
    const email = u.email ? u.email.toLowerCase() : "";
    const pStatus = getUserPaymentStatus(email);

    // Apply Filter
    if (activeFilter === "ACTIVE" && u.status !== "active") return false;
    if (activeFilter === "INACTIVE" && u.status !== "inactive") return false;
    if (activeFilter === "DISABLED" && u.status !== "disabled") return false;
    if (activeFilter === "PRO ACTIVE" && u.proStatus !== "active") return false;
    if (activeFilter === "PRO INACTIVE" && u.proStatus !== "inactive") return false;
    if (activeFilter === "PENDING PAYMENT" && pStatus !== "pending") return false;
    if (activeFilter === "APPROVED" && pStatus !== "approved") return false;
    if (activeFilter === "DISABLED REQUEST" && pStatus !== "disabled") return false;

    // Apply Search
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const userPayments = getPaymentsForUser(email);
    const hasTrxMatch = userPayments.some(
      (p) => p.transactionId && p.transactionId.toLowerCase().includes(q)
    );

    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      email.includes(q) ||
      (u.uid && u.uid.toLowerCase().includes(q)) ||
      hasTrxMatch
    );
  });

  // Deduplicate by email to avoid any duplicate keys
  const uniqueUsersMap = new Map<string, UserAccount>();
  for (const u of filteredUsers) {
    if (u && u.email) {
      const lower = u.email.toLowerCase();
      if (!uniqueUsersMap.has(lower)) {
        uniqueUsersMap.set(lower, u);
      }
    }
  }
  const deduplicatedUsers = Array.from(uniqueUsersMap.values());

  const filterButtons = [
    { id: "ALL", label: "ALL" },
    { id: "ACTIVE", label: "ACTIVE" },
    { id: "INACTIVE", label: "INACTIVE" },
    { id: "DISABLED", label: "DISABLED" },
    { id: "PRO ACTIVE", label: "PRO ACTIVE" },
    { id: "PRO INACTIVE", label: "PRO INACTIVE" },
    { id: "PENDING PAYMENT", label: "PENDING PAYMENT" },
    { id: "APPROVED", label: "APPROVED" },
    { id: "DISABLED REQUEST", label: "DISABLED REQUEST" },
  ];

  return (
    <div className="space-y-4">
      {/* Header and Add User Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            {language === "bn" ? "ইউজার ম্যানেজমেন্ট ও প্রোফাইল" : "User Management & Control"}
          </h3>
          <p className="text-[11px] text-slate-400">
            {language === "bn"
              ? "নিবন্ধিত সকল ইউজার, অ্যাকাউন্ট স্ট্যাটাস, প্রো সুবিধা এবং ট্রানজেকশন তালিকা।"
              : "Search, filter, view complete payment histories and manage account access."}
          </p>
        </div>

        {onAddUser && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === "bn" ? "নতুন ইউজার যুক্ত করুন" : "Add User"}</span>
          </button>
        )}
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
              ? "নাম, ইমেইল, Firebase UID বা Transaction ID দিয়ে খুঁজুন..."
              : "Search by Name, Email, Firebase UID, or Transaction ID..."
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

      {/* Filter Chips Carousel */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        {filterButtons.map((btn) => (
          <button
            key={btn.id}
            type="button"
            onClick={() => onFilterChange(btn.id)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition cursor-pointer ${
              activeFilter === btn.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Users List Grid / Table */}
      <div className="space-y-2.5">
        {deduplicatedUsers.length === 0 ? (
          <div className="p-8 text-center bg-[#0c0e14] border border-slate-850 rounded-2xl space-y-2">
            <Users className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400 font-semibold">
              {language === "bn"
                ? "কোনো ইউজার পাওয়া যায়নি।"
                : "No users found matching current search and filter."}
            </p>
          </div>
        ) : (
          deduplicatedUsers.map((u, idx) => {
            const userPayments = getPaymentsForUser(u.email);
            const pStatus = getUserPaymentStatus(u.email);
            const isPro = u.proStatus === "active";
            const isDisabled = u.status === "disabled";

            return (
              <div
                key={`user_${u.uid || u.email}_${idx}`}
                onClick={() => setSelectedUser(u)}
                className={`p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer hover:scale-[1.005] ${
                  isDisabled
                    ? "bg-[#140c0f] border-rose-500/25 hover:border-rose-500/40"
                    : isPro
                    ? "bg-[#0f1118] border-purple-500/25 hover:border-purple-500/50"
                    : "bg-[#0c0e14] border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: User Identity */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                        isDisabled
                          ? "bg-rose-950 border-rose-500/40 text-rose-300"
                          : isPro
                          ? "bg-purple-950 border-purple-500/40 text-purple-300"
                          : "bg-indigo-950 border-indigo-500/40 text-indigo-300"
                      }`}
                    >
                      {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-white truncate">
                          {u.name || u.email.split("@")[0]}
                        </span>
                        {u.role === "SUPER_ADMIN" && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[8px] font-black uppercase">
                            SUPER ADMIN
                          </span>
                        )}
                        {u.role === "ADMIN" && (
                          <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[8px] font-black uppercase">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">{u.email}</div>
                      <div className="text-[9px] text-slate-500 font-mono flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        <span>UID: {u.uid || "N/A"}</span>
                        <span>•</span>
                        <span>Reg: {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}</span>
                        <span>•</span>
                        <span>Login: {u.lastLogin ? new Date(u.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}</span>
                        <span>•</span>
                        <span>Requests: {userPayments.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status Badges and Direct Action Controls */}
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    {/* Account Status Badge */}
                    {u.status === "active" ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-black uppercase tracking-wider">
                        ACTIVE
                      </span>
                    ) : u.status === "inactive" ? (
                      <span className="px-2 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-400 text-[9px] font-black uppercase tracking-wider">
                        INACTIVE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[9px] font-black uppercase tracking-wider">
                        DISABLED
                      </span>
                    )}

                    {/* Pro Status Badge */}
                    {isPro ? (
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        PRO ACTIVE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[9px] font-bold uppercase tracking-wider">
                        FREE TIER
                      </span>
                    )}

                    {/* Payment Status Badge */}
                    {pStatus === "pending" && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[9px] font-bold uppercase tracking-wider animate-pulse">
                        PENDING
                      </span>
                    )}
                  </div>
                </div>

                {/* Direct Action Buttons Row */}
                <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2.5 mt-2.5 border-t border-slate-800/60">
                  {u.status !== "active" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onActivateUser(u.email);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <UserCheck className="w-3 h-3" />
                      ACTIVATE
                    </button>
                  )}

                  {u.status === "active" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeactivateUser(u.email);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <UserX className="w-3 h-3" />
                      DEACTIVATE
                    </button>
                  )}

                  {u.status !== "disabled" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDisableUser(u.email);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Ban className="w-3 h-3" />
                      DISABLE
                    </button>
                  )}

                  {/* Reset Password Trigger Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowResetModal(u.email);
                      setTempPassword("");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <Key className="w-3 h-3" />
                    RESET PASSWORD
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* User Details Modal (Drawer) */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-[#10121a] border-2 border-indigo-500/30 rounded-3xl p-5 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar relative">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-white font-extrabold text-base flex items-center gap-2">
                  <span>{selectedUser.name || selectedUser.email.split("@")[0]}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {selectedUser.role}
                  </span>
                </h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedUser.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-850 text-xs">
              <div>
                <span className="text-[9px] text-slate-500 font-mono uppercase block">Firebase UID</span>
                <span className="font-mono text-slate-200 text-[10px] truncate block select-all">
                  {selectedUser.uid || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 font-mono uppercase block">Account Status</span>
                <span
                  className={`font-bold text-[11px] uppercase ${
                    selectedUser.status === "active"
                      ? "text-emerald-400"
                      : selectedUser.status === "disabled"
                      ? "text-rose-400"
                      : "text-slate-400"
                  }`}
                >
                  {selectedUser.status}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 font-mono uppercase block">Pro Status</span>
                <span
                  className={`font-bold text-[11px] uppercase ${
                    selectedUser.proStatus === "active" ? "text-purple-400" : "text-slate-400"
                  }`}
                >
                  {selectedUser.proStatus === "active" ? "ACTIVE ✦ 30 DAYS" : "INACTIVE"}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 font-mono uppercase block">Registered Date</span>
                <span className="text-[10px] text-slate-300 font-mono">
                  {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 font-mono uppercase block">Last Active</span>
                <span className="text-[10px] text-slate-300 font-mono">
                  {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleTimeString() : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 font-mono uppercase block">Payment History</span>
                <span className="text-[10px] text-emerald-400 font-bold font-mono">
                  {getPaymentsForUser(selectedUser.email).length} Records
                </span>
              </div>
            </div>

            {/* User Action Controls */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
                ACCOUNT & PRO ACTIONS
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {selectedUser.status !== "active" && (
                  <button
                    type="button"
                    onClick={() => {
                      onActivateUser(selectedUser.email);
                      setSelectedUser({ ...selectedUser, status: "active" });
                    }}
                    className="p-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    ACTIVATE USER
                  </button>
                )}

                {selectedUser.status === "active" && (
                  <button
                    type="button"
                    onClick={() => {
                      onDeactivateUser(selectedUser.email);
                      setSelectedUser({ ...selectedUser, status: "inactive" });
                    }}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    DEACTIVATE USER
                  </button>
                )}

                {selectedUser.status !== "disabled" && (
                  <button
                    type="button"
                    onClick={() => {
                      onDisableUser(selectedUser.email);
                      setSelectedUser({ ...selectedUser, status: "disabled", proStatus: "inactive" });
                    }}
                    className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/40 text-rose-300 font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    DISABLE USER
                  </button>
                )}

                {selectedUser.proStatus !== "active" ? (
                  <button
                    type="button"
                    onClick={() => {
                      onActivatePro(selectedUser.email);
                      setSelectedUser({ ...selectedUser, proStatus: "active" });
                    }}
                    className="p-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-purple-300 font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    ACTIVATE PRO
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onDeactivatePro(selectedUser.email);
                      setSelectedUser({ ...selectedUser, proStatus: "inactive" });
                    }}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    DEACTIVATE PRO
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(selectedUser.email);
                    setTempPassword("");
                  }}
                  className="p-2 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 text-indigo-300 font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  RESET PASSWORD
                </button>
              </div>
            </div>

            {/* Complete Payment History */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
                PAYMENT & APPROVAL HISTORY ({getPaymentsForUser(selectedUser.email).length})
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {getPaymentsForUser(selectedUser.email).length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-3 text-center bg-slate-950/40 rounded-xl">
                    No payment submissions found for this user.
                  </p>
                ) : (
                  getPaymentsForUser(selectedUser.email).map((pay) => (
                    <div
                      key={pay.id}
                      className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-850 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">${pay.amount}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            via {pay.paymentMethod} {pay.network ? `(${pay.network})` : ""}
                          </span>
                        </div>
                        <div className="text-[10px] text-amber-300 font-mono">TrxID: {pay.transactionId}</div>
                        <div className="text-[9px] text-slate-500">
                          {pay.timestamp ? new Date(pay.timestamp).toLocaleString() : "N/A"}
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          pay.status === "approved"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : pay.status === "disabled"
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {pay.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal (Never exposes plaintext password!) */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[10000] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#12141f] border-2 border-indigo-500/30 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400">
                <Key className="w-5 h-5" />
                <h4 className="font-black text-white text-sm uppercase">Secure Password Reset</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(null)}
                className="text-slate-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Target user: <span className="font-mono text-indigo-300 font-bold">{showResetModal}</span>
            </p>
            <p className="text-[11px] text-slate-400">
              For security, plaintext passwords are never displayed. Enter a new temporary password below to reset their access.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!tempPassword.trim()) return;
                onResetPassword(showResetModal, tempPassword.trim());
                setShowResetModal(null);
                setTempPassword("");
              }}
              className="space-y-3"
            >
              <input
                type="text"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                placeholder="Enter new temporary password"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50 font-mono"
                required
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                >
                  Save Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && onAddUser && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[10000] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#12141f] border-2 border-indigo-500/30 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-white text-sm uppercase">Create New User Account</h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newEmail.trim()) return;
                onAddUser(newEmail.trim().toLowerCase(), newPass.trim() || "123456", newName.trim());
                setShowAddModal(false);
                setNewEmail("");
                setNewName("");
                setNewPass("");
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                  User Full Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                  Initial Password
                </label>
                <input
                  type="text"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
