import React, { useState } from "react";
import { ShieldCheck, Plus, Ban, Trash2, UserCheck, Shield, AlertCircle } from "lucide-react";
import { AdminRoleItem } from "../../types";

interface AdminRoleManagementProps {
  adminRoles: Record<string, AdminRoleItem>;
  currentAdminEmail?: string;
  isSuperAdmin: boolean;
  language: "bn" | "en";
  onAddAdmin: (email: string, name: string, role: "SUPER_ADMIN" | "ADMIN") => void;
  onDisableAdmin: (email: string) => void;
  onRemoveAdmin: (email: string) => void;
}

export default function AdminRoleManagement({
  adminRoles,
  currentAdminEmail,
  isSuperAdmin,
  language,
  onAddAdmin,
  onDisableAdmin,
  onRemoveAdmin,
}: AdminRoleManagementProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"SUPER_ADMIN" | "ADMIN">("ADMIN");

  // Deduplicate by email address
  const uniqueAdminsMap = new Map<string, AdminRoleItem>();
  for (const item of Object.values(adminRoles || {})) {
    if (item && item.email) {
      uniqueAdminsMap.set(item.email.toLowerCase(), item);
    }
  }
  const list = Array.from(uniqueAdminsMap.values());

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            {language === "bn" ? "অ্যাডমিন ম্যানেজমেন্ট ও অ্যাক্সেস রোল" : "Admin Management & RBAC Roles"}
          </h3>
          <p className="text-[11px] text-slate-400">
            {isSuperAdmin
              ? "Super Admin can designate administrators, assign permissions, or revoke admin privileges."
              : "Administrative privileges are restricted. Only Super Admin can modify administrator roles."}
          </p>
        </div>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === "bn" ? "নতুন অ্যাডমিন যুক্ত করুন" : "Add Admin"}</span>
          </button>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>You have regular Admin access. Super Admin permissions are required to modify roles.</span>
        </div>
      )}

      {/* Admin Cards List */}
      <div className="space-y-3">
        {list.map((admin, idx) => {
          const isPrimary = admin.email.toLowerCase() === "limon258144@gmail.com";
          const isSelf = currentAdminEmail && currentAdminEmail.toLowerCase() === admin.email.toLowerCase();

          return (
            <div
              key={`admin_role_${admin.email.toLowerCase()}_${idx}`}
              className="p-3.5 rounded-2xl bg-[#0c0e14] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                    admin.role === "SUPER_ADMIN"
                      ? "bg-purple-950 border-purple-500/40 text-purple-300"
                      : "bg-indigo-950 border-indigo-500/40 text-indigo-300"
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-white">{admin.name || admin.email}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase ${
                        admin.role === "SUPER_ADMIN"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      }`}
                    >
                      {admin.role}
                    </span>
                    {admin.status === "disabled" && (
                      <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[8px] font-black uppercase">
                        DISABLED
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">{admin.email}</div>
                  <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                    Created: {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : "N/A"}
                  </div>
                </div>
              </div>

              {/* Action Buttons for Super Admin */}
              {isSuperAdmin && !isPrimary && (
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {admin.status !== "disabled" ? (
                    <button
                      type="button"
                      onClick={() => onDisableAdmin(admin.email)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                    >
                      <Ban className="w-3 h-3" />
                      DISABLE
                    </button>
                  ) : (
                    <span className="text-[10px] text-rose-400 font-bold px-2 py-1">Disabled</span>
                  )}

                  <button
                    type="button"
                    onClick={() => onRemoveAdmin(admin.email)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                    title="Remove Admin"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Admin Modal */}
      {showAddModal && isSuperAdmin && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[10000] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#12141f] border-2 border-purple-500/30 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-white text-sm uppercase">Add Administrator</h4>
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
                if (!email.trim()) return;
                onAddAdmin(email.trim().toLowerCase(), name.trim(), role);
                setShowAddModal(false);
                setEmail("");
                setName("");
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                  Admin Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Agent Alpha"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                  Role Permission
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
                >
                  <option value="ADMIN">ADMIN (Manage users and payments)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Full control + RBAC)</option>
                </select>
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
                  className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                >
                  Grant Admin Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
