import React from "react";
import { Activity, ShieldCheck, Clock, User, Calendar, ExternalLink } from "lucide-react";
import { ActivityLogItem } from "../../types";

interface AdminActivityLogsProps {
  logs: ActivityLogItem[];
  language: "bn" | "en";
}

export default function AdminActivityLogs({ logs, language }: AdminActivityLogsProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800">
        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          {language === "bn" ? "অ্যাডমিন অ্যাক্টিভিটি লগ (অডিট ট্রেইল)" : "Admin Activity Audit Trail"}
        </h3>
        <p className="text-[11px] text-slate-400">
          {language === "bn"
            ? "প্রতিটি প্রশাসনিক পরিবর্তন, অনুমোদন, পাসওয়ার্ড রিসেট বা অ্যাকাউন্ট বন্ধের অপরিবর্তনীয় রেকর্ড।"
            : "Immutable chronological audit log of all administrator operations and account status modifications."}
        </p>
      </div>

      {/* Logs Table / List */}
      <div className="space-y-2">
        {logs.length === 0 ? (
          <div className="p-8 text-center bg-[#0c0e14] border border-slate-850 rounded-2xl space-y-2">
            <Activity className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400 font-semibold">
              {language === "bn"
                ? "কোনো অ্যাক্টিভিটি লগ রেকর্ড পাওয়া যায়নি।"
                : "No admin activity recorded yet. Actions will appear here in real time."}
            </p>
          </div>
        ) : (
          logs.map((log) => {
            const dateStr = log.timestamp
              ? new Date(log.timestamp).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "medium",
                })
              : "N/A";

            return (
              <div
                key={log.id}
                className="p-3 rounded-2xl bg-[#0c0e14] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-[12px]">{log.action}</span>
                    {log.targetUser && (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-950/70 text-indigo-300 border border-indigo-500/20 text-[10px] font-mono">
                        Target: {log.targetUser}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                    <span>Admin: {log.adminEmail}</span>
                    {log.adminUid && <span>(UID: {log.adminUid})</span>}
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 self-start sm:self-auto shrink-0">
                  <Clock className="w-3 h-3 text-slate-600" />
                  <span>{dateStr}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
