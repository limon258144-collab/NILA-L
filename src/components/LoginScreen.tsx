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
  // Current active login mode: direct email login / register new account
  const [activeSegment, setActiveSegment] = useState<"login" | "register">("login");
  
  const [showChooser, setShowChooser] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Custom screen views inside Google Account popup
  const [googleView, setGoogleView] = useState<"select" | "custom">("select");
  const [customEmail, setCustomEmail] = useState("");
  const [selectedEmail, setSelectedEmail] = useState("");

  // Email and Password for Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Input states for custom sign-up/registration form
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  // Dynamically load registered user accounts from localStorage or fallbacks
  const getDynamicAccounts = () => {
    let regs: Record<string, string> = {};
    try {
      const stored = localStorage.getItem("nila_registered_users_v2");
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
        const users = JSON.parse(localStorage.getItem("nila_registered_users_v2") || "{}");
        users[cleanMail] = "google-oauth";
        localStorage.setItem("nila_registered_users_v2", JSON.stringify(users));
      } catch (err) {
        console.error(err);
      }
      onLoginSuccess(cleanMail);
    }, 1500);
  };

  // Direct login submit handler
  const handleDirectLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const email = loginEmail.trim().toLowerCase();
    const password = loginPassword.trim();

    if (!email || !password) {
      setErrorMsg(
        language === "bn" 
          ? "দয়া করে ফর্মে আপনার জিমেইল ও পাসওয়ার্ড লিখুন!" 
          : "Please write your Gmail and password!"
      );
      return;
    }

    if (!email.includes("@gmail.com")) {
      setErrorMsg(
        language === "bn" 
          ? "সঠিক জিমেইল আইডি দিন, যেমন: username@gmail.com" 
          : "Please enter a valid @gmail.com address."
      );
      return;
    }

    // Load actual users
    let regs: Record<string, string> = {};

    try {
      const stored = localStorage.getItem("nila_registered_users_v2");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed === "object" && parsed !== null) {
          regs = { ...regs, ...parsed };
        }
      }
    } catch (err) {
      console.error(err);
    }

    if (!regs[email]) {
      setErrorMsg(
        language === "bn" 
          ? "দুঃখিত! এই ইমেইলে কোনো অ্যাকাউন্ট নিবন্ধিত নেই। প্রথমে 'রেজিস্ট্রেশন' করুন।" 
          : "Incorrect email! No registration found. Please Register first."
      );
      return;
    }

    if (regs[email] !== password) {
      setErrorMsg(
        language === "bn" 
          ? "ভুল পাসওয়ার্ড! দয়া করে সঠিক পাসওয়ার্ড দিন।" 
          : "Incorrect password! Please write correct security password."
      );
      return;
    }

    setIsSigningIn(true);
    setSelectedEmail(email);

    setTimeout(() => {
      setIsSigningIn(false);
      onLoginSuccess(email);
    }, 1205);
  };

  // Direct register/signup submit handler
  const handleDirectRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const email = regEmail.trim().toLowerCase();
    const password = regPassword.trim();
    const confirm = regConfirmPassword.trim();

    if (!email || !password || !confirm) {
      setErrorMsg(
        language === "bn" 
          ? "দয়া করে সম্পূর্ণ ফর্মটি পূরণ করুন!" 
          : "Please fill up the entire form!"
      );
      return;
    }

    if (!email.includes("@gmail.com")) {
      setErrorMsg(
        language === "bn" 
          ? "শুধুমাত্র @gmail.com অ্যাকাউন্ট দিয়ে রেজিস্ট্রেশন করতে পারবেন!" 
          : "You can only register with a valid @gmail.com address!"
      );
      return;
    }

    if (password.length < 4) {
      setErrorMsg(
        language === "bn" 
          ? "নিরাপত্তা পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে!" 
          : "Your security password must be at least 4 chars!"
      );
      return;
    }

    if (password !== confirm) {
      setErrorMsg(
        language === "bn" 
          ? "পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড সমান হতে হবে!" 
          : "Passwords do not match! Please confirm correct password."
      );
      return;
    }

    // Load actual users
    let regs: Record<string, string> = {};

    try {
      const stored = localStorage.getItem("nila_registered_users_v2");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed === "object" && parsed !== null) {
          regs = { ...regs, ...parsed };
        }
      }
    } catch (err) {
      console.error(err);
    }

    if (regs[email]) {
      setErrorMsg(
        language === "bn" 
          ? "এই জিমেইল ইতিমধ্যে নিবন্ধিত রয়েছে। দয়া করে লগইন করুন।" 
          : "This Gmail is already registered. Please go to Login tab."
      );
      return;
    }

    // Write back
    regs[email] = password;
    try {
      localStorage.setItem("nila_registered_users_v2", JSON.stringify(regs));
    } catch (err) {
      console.error(err);
    }

    setIsSigningIn(true);
    setSelectedEmail(email);

    setTimeout(() => {
      setIsSigningIn(false);
      onLoginSuccess(email);
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
        <div className="text-center space-y-2 mb-5 mt-2">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 shadow-xl mb-1 relative">
            <Lock className="w-5 h-5 animate-pulse" />
            <motion.div 
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -right-0.5 -top-0.5 w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_6px_#6366f1]"
            />
          </div>
          
          <h2 className="text-lg font-black text-white tracking-wider flex items-center justify-center gap-1.5 uppercase select-none">
            {language === "bn" ? "নীলা ট্রেডার সিকিউরিটি" : "NILA TRADER SECURITY"}
            <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-indigo-650 text-white shadow-sm shrink-0">
              VIP
            </span>
          </h2>
          <p className="text-[11px] text-slate-400 font-semibold max-w-xs mx-auto leading-relaxed">
            {language === "bn" 
              ? "সিস্টেমে সুরক্ষিতভাবে প্রবেশ করতে লগইন করুন অথবা নতুন অ্যাকাউন্ট তৈরি করুন।" 
              : "Securely sign in to your system or register your new VIP trading profile."}
          </p>
        </div>

        {/* --- CUSTOM RICH LOGIN AND REGISTRATION TABBED INTERFACE --- */}
        <div className="mb-6">
          <div className="grid grid-cols-2 bg-slate-950/80 p-1 rounded-2xl border border-slate-800/80 select-none">
            <button
              onClick={() => {
                setActiveSegment("login");
                setErrorMsg(null);
              }}
              className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeSegment === "login"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>{language === "bn" ? "লগইন" : "Login"}</span>
            </button>
            <button
              onClick={() => {
                setActiveSegment("register");
                setErrorMsg(null);
              }}
              className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeSegment === "register"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span>{language === "bn" ? "রেজিস্ট্রেশন" : "Register"}</span>
            </button>
          </div>
        </div>

        {/* LOADING COVER OVERLAY */}
        {isSigningIn && (
          <div className="absolute inset-0 bg-[#10121d]/95 flex flex-col items-center justify-center space-y-4 z-50 rounded-[32px] p-6">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <GoogleLogomark />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-white tracking-wide">
                {language === "bn" ? "যাচাই করা হচ্ছে..." : "Authenticating..."}
              </p>
              <p className="text-[10px] font-mono text-slate-450 mt-1">
                {selectedEmail}
              </p>
            </div>
          </div>
        )}

        {/* MAIN ERROR NOTIFICATION */}
        {errorMsg && (
          <div className="p-3 mb-5 rounded-2xl bg-rose-500/15 border border-rose-500/25 text-rose-200 text-xs flex items-start gap-2.5 animate-shake text-left">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="font-semibold leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* ACTIVE FORM RENDER */}
        <div className="relative z-10 transition-all duration-300">
          
          {activeSegment === "login" && (
            /* --- DIRECT LOGIN FORM --- */
            <form onSubmit={handleDirectLogin} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-black tracking-wider text-slate-400 uppercase">
                  {language === "bn" ? "জিমেইল এড্রেস" : "Gmail Address"}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. user@gmail.com"
                    className="w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-800/80 focus:border-indigo-500 hover:border-slate-700/80 transition duration-150 rounded-2xl text-slate-100 text-xs placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-black tracking-wider text-slate-400 uppercase">
                  {language === "bn" ? "পাসওয়ার্ড বা এক্সেস পিন" : "Password / Access PIN"}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder={language === "bn" ? "পাসওয়ার্ড কোডটি দিন..." : "Enter verification code..."}
                    className="w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-800/80 focus:border-indigo-500 hover:border-slate-700/80 transition duration-150 rounded-2xl text-slate-100 text-xs placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl text-xs tracking-wider uppercase transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/15"
              >
                <span>{language === "bn" ? "নিরাপদ লগইন সম্পন্ন করুন" : "Secure Sign In"}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}

          {activeSegment === "register" && (
            /* --- DIRECT REGISTRATION (REJICTION = REGISTRATION) FORM --- */
            <form onSubmit={handleDirectRegister} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-black tracking-wider text-slate-400 uppercase">
                  {language === "bn" ? "জিমেইল এড্রেস" : "Gmail Address"}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. target@gmail.com"
                    className="w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-800/80 focus:border-indigo-500 hover:border-slate-700/80 transition duration-150 rounded-2xl text-slate-100 text-xs placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-black tracking-wider text-slate-400 uppercase">
                  {language === "bn" ? "নতুন পাসওয়ার্ড সেট করুন" : "Create Password / PIN"}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder={language === "bn" ? "পাসওয়ার্ড (কমপক্ষে ৪ সংখ্যা)" : "Minimum 4 characters..."}
                    className="w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-800/80 focus:border-indigo-500 hover:border-slate-700/80 transition duration-150 rounded-2xl text-slate-100 text-xs placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-black tracking-wider text-slate-400 uppercase">
                  {language === "bn" ? "পাসওয়ার্ড নিশ্চিত করুন" : "Confirm Password"}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder={language === "bn" ? "পাসওয়ার্ডটি আবার লিখুন..." : "Confirm password again..."}
                    className="w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-800/80 focus:border-indigo-500 hover:border-slate-700/80 transition duration-150 rounded-2xl text-slate-100 text-xs placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs tracking-wider uppercase transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/15"
              >
                <span>{language === "bn" ? "নতুন অ্যাকাউন্ট রেজিস্ট্রেশন করুন" : "Complete Registration"}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Google auto integration tab removed */}

        </div>

        {/* Support Telegram links */}
        <div className="mt-6 border-t border-slate-800/60 pt-4 flex flex-col items-center select-none text-center">
          <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mb-3">
            {language === "bn" ? "নতুন পাসওয়ার্ড বা VIP এক্সেস পেতে সরাসরি সাপোর্ট গ্রূপ জয়েন করুন:" : "To unlock premium tools or passwords, join Telegram directly:"}
          </p>

          <button
            onClick={openTelegramGroup}
            className="tg-interactive-glow w-full bg-sky-950/30 hover:bg-sky-950/50 border border-sky-400/30 text-sky-300 font-black text-[11px] py-2 px-3 rounded-2xl transition duration-150 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
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

              {/* View Switch Logic */}
              {googleView === "select" ? (
                // ACC SELECT VIEW
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  
                  {accounts.map((acc, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAccountSelect(acc.email)}
                      className="w-full p-3 rounded-2xl bg-slate-900 mb-0.5 hover:bg-indigo-950/40 border border-slate-800/65 focus:border-indigo-500 hover:border-slate-700 transition duration-150 flex items-center justify-between group cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 select-none ${acc.color}`}>
                          {acc.initial}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition shrink-0 truncate">
                            {acc.name}
                          </p>
                          <p className="text-[10px] font-mono font-medium text-slate-450 shrink-0 truncate">
                            {acc.email}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition shrink-0" />
                    </button>
                  ))}

                  {/* Add / Use Another Account Link */}
                  <button
                    onClick={() => {
                      setGoogleView("custom");
                      setErrorMsg(null);
                    }}
                    className="w-full p-3 rounded-2xl bg-indigo-950/20 hover:bg-indigo-950/35 border border-dashed border-indigo-500/20 hover:border-indigo-500/40 transition duration-150 flex items-center gap-3 cursor-pointer text-left group"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 group-hover:text-amber-300 transition shrink-0">
                      <PlusCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-indigo-300 group-hover:text-indigo-200 transition">
                        {language === "bn" ? "অন্য জিমেইল ব্যবহার করুন" : "Use another account"}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {language === "bn" ? "যেকোনো @gmail.com অ্যাকাউন্ট লিখুন" : "Sign in using any other Gmail address"}
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
                      className="py-3 px-4 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 font-bold rounded-2xl text-xs transition duration-150 active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                    >
                      {language === "bn" ? "ফিরে যান" : "Back"}
                    </button>
                    <button
                      type="submit"
                      disabled={isSigningIn}
                      className="py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl text-xs shadow-md shadow-indigo-600/15 flex items-center justify-center gap-1 transition duration-150 active:scale-95 cursor-pointer"
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
