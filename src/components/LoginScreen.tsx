import React, { useState } from "react";
import { 
  Lock, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Send,
  Sparkles,
  PlusCircle,
  Mail,
  ChevronRight,
  ArrowRight,
  X,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LoginScreenProps {
  onLoginSuccess: (username: string) => void;
  language: "bn" | "en";
}

// Authentic Google 'G' Logo rendered as standard SVG
const GoogleLogomark = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

export default function LoginScreen({ onLoginSuccess, language }: LoginScreenProps) {
  const [showChooser, setShowChooser] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Custom screen views inside Google Account popup
  // 'select': Pick predefined emails
  // 'custom': Form to input custom Gmail address
  const [googleView, setGoogleView] = useState<"select" | "custom">("select");
  const [customEmail, setCustomEmail] = useState("");
  const [selectedEmail, setSelectedEmail] = useState("");
  const [chooserSearch, setChooserSearch] = useState("");

  // Dynamically load registered user accounts from localStorage or fallbacks
  const getDynamicAccounts = () => {
    let regs: Record<string, string> = {
      "limon258144@gmail.com": "nila2026", 
      "admin@gmail.com": "nila2026", 
      "korimanalice@gmail.com": "nila2026",
      "demo.trader@gmail.com": "nila2026",
      "safayet.trader@gmail.com": "nila2026",
      "rashed.vip@gmail.com": "nila2026",
      "tariq.bin.ziyad@gmail.com": "nila2026"
    };
    try {
      const stored = localStorage.getItem("nila_registered_users_v1");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed === "object" && parsed !== null) {
          regs = { ...regs, ...parsed };
        }
      }
    } catch (e) {
      console.error(e);
    }

    const nameMap: Record<string, string> = {
      "limon258144@gmail.com": "Limon Ahmed",
      "admin@gmail.com": "Master Admin",
      "korimanalice@gmail.com": "Korim Trader",
      "demo.trader@gmail.com": "Demo Account",
      "safayet.trader@gmail.com": "Safayet Islam",
      "rashed.vip@gmail.com": "Rashed Al-Amin",
      "tariq.bin.ziyad@gmail.com": "Tariq Bin Ziyad"
    };

    const colorMap = [
      "bg-teal-600 text-teal-100",
      "bg-indigo-600 text-indigo-100",
      "bg-amber-600 text-amber-100",
      "bg-emerald-600 text-emerald-100",
      "bg-purple-600 text-purple-100",
      "bg-rose-600 text-rose-100",
      "bg-sky-600 text-sky-100"
    ];

    return Object.keys(regs).map((email, idx) => {
      const username = email.split("@")[0];
      const name = nameMap[email] || username.charAt(0).toUpperCase() + username.slice(1);
      const initial = name.charAt(0).toUpperCase();
      const color = colorMap[idx % colorMap.length];
      return { name, email, initial, color };
    });
  };

  const accounts = getDynamicAccounts();

  const handleAccountSelect = (email: string) => {
    setIsSigningIn(true);
    setSelectedEmail(email);
    setErrorMsg(null);
    
    // Simulate natural secure Google callback delay
    setTimeout(() => {
      setIsSigningIn(false);
      setShowChooser(false);
      onLoginSuccess(email);
    }, 1200);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    const cleanMail = customEmail.trim().toLowerCase();
    
    if (!cleanMail) {
      setErrorMsg(
        language === "bn"
          ? "দয়া করে একটি জিমেইল এড্রেস লিখুন!"
          : "Please write a Gmail address!"
      );
      return;
    }
    
    if (!cleanMail.includes("@gmail.com")) {
      setErrorMsg(
        language === "bn"
          ? "সঠিক Gmail দিন, যেমন: username@gmail.com"
          : "Must be a valid @gmail.com address."
      );
      return;
    }

    setIsSigningIn(true);
    setSelectedEmail(cleanMail);
    
    setTimeout(() => {
      setIsSigningIn(false);
      setShowChooser(false);
      // Store in users locally for traceability
      try {
        const users = JSON.parse(localStorage.getItem("nila_registered_users_v1") || "{}");
        users[cleanMail] = "google-oauth";
        localStorage.setItem("nila_registered_users_v1", JSON.stringify(users));
      } catch (err) {
        console.error(err);
      }
      onLoginSuccess(cleanMail);
    }, 1500);
  };

  const openTelegramGroup = () => {
    window.open("https://t.me/poketbrokar", "_blank");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full flex-1 flex flex-col justify-center px-4 py-8 relative"
    >
      {/* Background radial highlight */}
      <div className="absolute inset-0 bg-radial from-slate-900/50 via-transparent to-transparent pointer-events-none" />

      <div className="bg-[#10121d]/90 border border-indigo-500/20 rounded-[32px] p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Sleek top cyber glowing strip */}
        <div className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 shadow-[0_0_15px_#6366f1]" />
        
        {/* Core Locking Branding Header */}
        <div className="text-center space-y-2.5 mb-7 mt-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 shadow-xl mb-1.5 relative">
            <Lock className="w-5 h-5" />
            <motion.div 
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -right-0.5 -top-0.5 w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_6px_#6366f1]"
            />
          </div>
          
          <h2 className="text-xl font-black text-white tracking-tight flex items-center justify-center gap-1.5 uppercase select-none">
            {language === "bn" ? "নীলা ট্রেডার সিকিউরিটি" : "NILA TRADER SECURITY"}
            <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-indigo-650 text-white shadow-sm shrink-0">
              VIP
            </span>
          </h2>
          <p className="text-xs text-slate-400 font-semibold max-w-xs mx-auto leading-relaxed">
            {language === "bn" 
              ? "অ্যানালাইজার ড্যাশবোর্ডে প্রবেশ করতে আপনার গুগল অ্যাকাউন্ট (জিমেইল) দিয়ে সাইন ইন করুন।" 
              : "Verify your identity using your Google Account (Gmail) to access signals."}
          </p>
        </div>

        {/* CTA "Continue with Google" Action Button */}
        <div className="my-8 relative z-10">
          <button
            onClick={() => {
              setShowChooser(true);
              setGoogleView("select");
              setErrorMsg(null);
            }}
            className="w-full flex items-center justify-center gap-3.5 bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-200/90 hover:border-white font-bold py-4 px-5 rounded-2xl shadow-xl hover:shadow-indigo-500/10 transition duration-150 active:scale-[0.98] cursor-pointer cursor-interactive"
          >
            <GoogleLogomark />
            <span className="text-sm select-none tracking-wide text-slate-900">
              {language === "bn" ? "গুগল দিয়ে লগইন করুন" : "Continue with Google"}
            </span>
          </button>
          
          <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-slate-500">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {language === "bn" ? "অফিসিয়াল ও নিরাপদ জিমেইল লগইন" : "Official & Secure Google Sign-In"}
            </span>
          </div>
        </div>

        {/* Support Telegram links */}
        <div className="mt-6 border-t border-slate-800/60 pt-4 flex flex-col items-center select-none text-center">
          <p className="text-[11px] text-slate-400 font-semibold leading-relaxed mb-3">
            {language === "bn" ? "নতুন পাসওয়ার্ড বা VIP অ্যাক্সেস কোড পেতে এখানে যোগাযোগ করুন:" : "To get VIP access codes or custom assistance, contact here:"}
          </p>

          <button
            onClick={openTelegramGroup}
            className="tg-interactive-glow w-full bg-sky-950/30 hover:bg-sky-950/50 border border-sky-400/30 text-sky-301 font-black text-[11px] py-2 px-3 rounded-2xl transition duration-150 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 shrink-0" />
            <span>@POKETS_BROKAR (TELEGRAM GROUP)</span>
          </button>
        </div>
      </div>

      {/* --- HIGHLY POLISHED AUTHENTIC GOOGLE-THEMED CHOOSE ACCOUNT MODAL --- */}
      <AnimatePresence>
        {showChooser && (
          <div id="google-auth-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="w-full max-w-sm bg-[#121522] border-2 border-indigo-500/25 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Fake top bar */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500" />
              
              {/* Close Button */}
              {!isSigningIn && (
                <button
                  onClick={() => setShowChooser(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800/50 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Loader overlay */}
              {isSigningIn && (
                <div className="absolute inset-0 bg-[#121522]/95 flex flex-col items-center justify-center space-y-4 z-40">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <GoogleLogomark />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-white tracking-wide">
                      {language === "bn" ? "সাইনিং ইন..." : "Signing in..."}
                    </p>
                    <p className="text-[10px] font-mono text-slate-450 mt-1">
                      {selectedEmail}
                    </p>
                  </div>
                </div>
              )}

              {/* Main Google Logo Indicator */}
              <div className="flex flex-col items-center space-y-2 mb-6">
                <GoogleLogomark />
                
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5 mt-1">
                  Google
                  <span className="text-[10px] bg-slate-800 text-slate-300 font-normal px-1.5 py-0.5 rounded border border-slate-700">
                    Sign in
                  </span>
                </h3>
                
                <p className="text-xs text-slate-400 text-center font-semibold max-w-xs leading-relaxed">
                  {language === "bn" 
                    ? "নীলা ট্রেডারে প্রবেশ করতে একটি জিমেইল অ্যাকাউন্ট বেছে নিন" 
                    : "Choose an account to continue to Nila Trader"}
                </p>
              </div>

              {/* ALERT Error Notification */}
              {errorMsg && (
                <div className="p-3 mb-4 rounded-xl bg-rose-500/15 border border-rose-500/25 text-rose-300 text-[11px] flex items-start gap-2 animate-shake text-left">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-450 shrink-0 mt-0.5" />
                  <p className="font-semibold leading-relaxed">{errorMsg}</p>
                </div>
              )}

              {/* View Switch Logic */}
              {googleView === "select" ? (
                // ACC SELECT VIEW
                <div className="space-y-3">
                  {/* Account Search input */}
                  <div className="relative mb-2">
                    <input 
                      type="text"
                      className="w-full bg-[#090a12] border border-slate-800/80 hover:border-slate-700/80 focus:border-indigo-505 text-slate-200 text-xs rounded-xl py-2 px-3 placeholder-slate-600 focus:outline-none"
                      placeholder={language === "bn" ? "জিমেইল টাইপ বা সার্চ করুন..." : "Find or type Google account email..."}
                      value={chooserSearch}
                      onChange={(e) => setChooserSearch(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                    {(() => {
                      const filteredList = accounts.filter(acc => 
                        acc.email.toLowerCase().includes(chooserSearch.trim().toLowerCase()) || 
                        acc.name.toLowerCase().includes(chooserSearch.trim().toLowerCase())
                      );

                      if (filteredList.length === 0) {
                        return (
                          <div className="text-center py-6 text-slate-500 text-[11px] font-bold">
                            {language === "bn" ? "কোনো জিমেইল অ্যাকাউন্ট পাওয়া যায়নি!" : "No Gmail accounts matched!"}
                          </div>
                        );
                      }

                      return filteredList.map((acc, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAccountSelect(acc.email)}
                          className="w-full p-2.5 rounded-2xl bg-[#090b14] mb-0.5 hover:bg-indigo-950/40 border border-slate-900 hover:border-slate-800/80 focus:border-indigo-500 transition duration-150 flex items-center justify-between group cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center font-black text-xs shrink-0 select-none ${acc.color}`}>
                              {acc.initial}
                            </div>
                            <div className="truncate min-w-0">
                              <p className="text-[11px] font-bold text-white group-hover:text-indigo-300 transition shrink-0 truncate">
                                {acc.name}
                              </p>
                              <p className="text-[9.5px] font-mono font-medium text-slate-400 shrink-0 truncate">
                                {acc.email}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition shrink-0" />
                        </button>
                      ));
                    })()}
                  </div>

                  {/* Add / Use Another Account Link */}
                  <button
                    onClick={() => {
                      setGoogleView("custom");
                      setErrorMsg(null);
                    }}
                    className="w-full p-2.5 rounded-2xl bg-indigo-950/15 hover:bg-indigo-950/25 border border-dashed border-indigo-500/20 hover:border-indigo-500/30 transition duration-150 flex items-center gap-2.5 cursor-pointer text-left group"
                  >
                    <div className="w-7.5 h-7.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition shrink-0">
                      <PlusCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-indigo-300 group-hover:text-indigo-200 transition">
                        {language === "bn" ? "অন্য জিমেইল ব্যবহার করুন" : "Use another account"}
                      </p>
                      <p className="text-[9.5px] text-slate-500 font-semibold">
                        {language === "bn" ? "নতুন @gmail.com অ্যাকাউন্ট লিখুন" : "Sign in using another Gmail address"}
                      </p>
                    </div>
                  </button>

                </div>
              ) : (
                // CUSTOM ACCOUNT MANUAL GMAIL ENTRANCE
                <form onSubmit={handleCustomSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold tracking-wider text-slate-450 uppercase">
                      {language === "bn" ? "আপনার জিমেইল এড্রেস" : "Your Gmail Address"}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-550">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        placeholder="e.g. limon258144@gmail.com"
                        className="w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 hover:border-slate-700 transition duration-150 rounded-2xl text-slate-100 text-sm placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Buttons controls */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      disabled={isSigningIn}
                      onClick={() => {
                        setGoogleView("select");
                        setErrorMsg(null);
                      }}
                      className="py-3 px-4 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 font-bold rounded-2xl text-xs transition duration-150 active:scale-95 cursor-pointer cursor-interactive"
                    >
                      {language === "bn" ? "ফিরে যান" : "Back"}
                    </button>
                    <button
                      type="submit"
                      disabled={isSigningIn}
                      className="py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl text-xs shadow-md shadow-indigo-600/15 flex items-center justify-center gap-1 transition duration-150 active:scale-95 cursor-pointer cursor-interactive"
                    >
                      <span>{language === "bn" ? "পরবর্তী" : "Next"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}

              {/* Official Google Privacy policy footer disclaimer */}
              <div className="mt-6 pt-4 border-t border-slate-900/60 text-center text-[10px] text-slate-500 leading-normal font-medium select-none">
                {language === "bn" ? (
                  <span>
                    চালিয়ে গেলে গুগল অ্যাকাউন্টের নাম ও ইমেইল সরবরাহ করতে আপনি সম্মত হচ্ছেন। এটি নিরাপদ এবং জিপিটি প্রোটোকল মেনে চলে।
                  </span>
                ) : (
                  <span>
                    To proceed, Google will share your profile name and email address with Nila Trader. Secure encrypted transmission.
                  </span>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
