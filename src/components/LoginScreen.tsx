import React, { useState } from "react";
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  Send,
  Sparkles,
  Smartphone
} from "lucide-react";
import { motion } from "motion/react";

interface LoginScreenProps {
  onLoginSuccess: (username: string) => void;
  language: "bn" | "en";
}

export default function LoginScreen({ onLoginSuccess, language }: LoginScreenProps) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Notification states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Default master credential lists configured locally for immediate ease of use
  // Users can also register on the fly
  const getRegisteredUsers = (): Record<string, string> => {
    try {
      const users = localStorage.getItem("nila_registered_users_v1");
      if (users) {
        return JSON.parse(users);
      }
    } catch (e) {
      console.error(e);
    }
    // Default admin user fallback matches usual simple structures
    return { "admin": "123", "limon": "nila2026", "korim": "nila2026" };
  };

  const saveRegisteredUsers = (users: Record<string, string>) => {
    try {
      localStorage.setItem("nila_registered_users_v1", JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanUsername = username.trim().toLowerCase();

    if (!cleanUsername || !password) {
      setErrorMsg(
        language === "bn" 
          ? "দয়া করে ইউজারনেম এবং পাসওয়ার্ড দুটিই পূরণ করুন!" 
          : "Please fill in both username and password!"
      );
      return;
    }

    if (isLoginTab) {
      // HANDLE LOGIN
      const users = getRegisteredUsers();
      const isAdminAccount = cleanUsername === "00000000000" && password === "0000000000";

      if (isAdminAccount || (users[cleanUsername] && users[cleanUsername] === password)) {
        // Automatically provision or align local master admin record
        if (isAdminAccount && !users["00000000000"]) {
          const updatedUsers = { ...users, "00000000000": "0000000000" };
          saveRegisteredUsers(updatedUsers);
        }

        setSuccessMsg(
          language === "bn" 
            ? "এডমিন প্যানেলে লগইন সফল হয়েছে! লোড হচ্ছে..." 
            : "Admin panel login successful! Redirecting..."
        );
        setTimeout(() => {
          onLoginSuccess(isAdminAccount ? "00000000000" : username);
        }, 800);
      } else {
        setErrorMsg(
          language === "bn" 
            ? "ভুল ইউজারনেম অথবা পাসওয়ার্ড দেওয়া হয়েছে। দয়া করে আবার চেষ্টা করুন!" 
            : "Invalid username or password. Please try again!"
        );
      }
    } else {
      // HANDLE REGISTRATION
      if (password !== confirmPassword) {
        setErrorMsg(
          language === "bn" 
            ? "দুটি পাসওয়ার্ড মেলেনি! পুনরায় টাইপ করুন।" 
            : "Passwords do not match!"
        );
        return;
      }

      if (password.length < 3) {
        setErrorMsg(
          language === "bn" 
            ? "নিরাপত্তার জন্য পাসওয়ার্ড অন্তত ৩ অক্ষরের হতে হবে।" 
            : "Password must be at least 3 characters."
        );
        return;
      }

      const users = getRegisteredUsers();
      if (users[cleanUsername]) {
        setErrorMsg(
          language === "bn" 
            ? "এই ইউজারনেমটি ইতিমধ্যে নিবন্ধিত আছে। অন্য ইউজারনেম দিন।" 
            : "Username is already registered. Choose another one."
        );
        return;
      }

      // Register new user locally
      const updatedUsers = { ...users, [cleanUsername]: password };
      saveRegisteredUsers(updatedUsers);

      setSuccessMsg(
        language === "bn" 
          ? "রেজিস্ট্রেশন সফল হয়েছে! এখন লগইন করুন।" 
          : "Registration successful! You can now log in."
      );
      
      // Auto transition back to login tab with fields populated
      setTimeout(() => {
        setIsLoginTab(true);
        setConfirmPassword("");
        setSuccessMsg(null);
      }, 1500);
    }
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
        <div className="text-center space-y-2.5 mb-7">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 shadow-xl mb-1.5 relative">
            <Lock className="w-5 h-5" />
            <motion.div 
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -right-0.5 -top-0.5 w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_6px_#6366f1]"
            />
          </div>
          
          <h2 className="text-xl font-black text-white tracking-tight flex items-center justify-center gap-1.5 uppercase">
            {language === "bn" ? "নীলা ট্রেডার সিকিউরিটি" : "NILA TRADER LOCK"}
            <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-indigo-600 text-white shadow-sm shrink-0">
              VIP
            </span>
          </h2>
          <p className="text-xs text-slate-400 font-semibold max-w-xs mx-auto leading-relaxed">
            {language === "bn" 
              ? "অ্যানালাইজার ড্যাশবোর্ড ঢুকতে ইউজারনেম পাসওয়ার্ড দিয়ে লগইন করুন।" 
              : "Verify your credentials or register to get immediate binary signal analysis."}
          </p>
        </div>

        {/* Tab Switcher Slider bar */}
        <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800/40 relative z-10 mb-6 font-semibold text-xs">
          <button
            onClick={() => {
              setIsLoginTab(true);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2.5 px-3 rounded-xl transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
              isLoginTab 
                ? "bg-indigo-650 text-white font-extrabold shadow-sm shadow-indigo-600/15" 
                : "text-slate-400 hover:text-slate-205"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            {language === "bn" ? "লগইন" : "Login"}
          </button>
          <button
            onClick={() => {
              setIsLoginTab(false);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2.5 px-3 rounded-xl transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
              !isLoginTab 
                ? "bg-indigo-650 text-white font-extrabold shadow-sm shadow-indigo-600/15" 
                : "text-slate-400 hover:text-slate-205"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            {language === "bn" ? "রেজিস্ট্রেশন" : "Register"}
          </button>
        </div>

        {/* Alerts feedback boxes with animations */}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2 text-left"
          >
            <AlertCircle className="w-4 h-4 text-rose-450 shrink-0 mt-0.5" />
            <p className="font-semibold leading-relaxed">{errorMsg}</p>
          </motion.div>
        )}

        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs flex items-start gap-2 text-left"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-450 shrink-0 mt-0.5" />
            <p className="font-semibold leading-relaxed">{successMsg}</p>
          </motion.div>
        )}

        {/* Auth Input Form structure */}
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold tracking-wider text-indigo-400 uppercase">
              {language === "bn" ? "ইউজারনেম দিন" : "Username"}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={language === "bn" ? "যেমন: admin / limon" : "e.g. admin"}
                className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 focus:border-indigo-500/50 hover:border-slate-700 transition duration-150 rounded-2xl text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold tracking-wider text-indigo-400 uppercase flex justify-between items-center">
              <span>{language === "bn" ? "পাসওয়ার্ড দিন" : "Password"}</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full pl-10 pr-10 py-3 bg-slate-950/60 border border-slate-800 focus:border-indigo-500/50 hover:border-slate-700 transition duration-150 rounded-2xl text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-351 transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password field only on sign up */}
          {!isLoginTab && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-[10px] font-mono font-bold tracking-wider text-indigo-400 uppercase">
                {language === "bn" ? "পাসওয়ার্ড নিশ্চিত করুন" : "Confirm Password"}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 focus:border-indigo-500/50 hover:border-slate-700 transition duration-150 rounded-2xl text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                  required={!isLoginTab}
                />
              </div>
            </div>
          )}

          {/* CTA Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-551 hover:to-indigo-650 text-white font-black py-3.5 rounded-2xl mt-2 select-none active:scale-95 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer text-sm flex items-center justify-center gap-2"
          >
            {isLoginTab ? (
              <>
                <KeyRound className="w-4 h-4" />
                {language === "bn" ? "লগইন করুন" : "Sign In"}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {language === "bn" ? "অ্যাকাউন্ট তৈরি করুন" : "Create Account"}
              </>
            )}
          </button>
        </form>

        {/* Support Telegram links */}
        <div className="mt-6 border-t border-slate-800/60 pt-4 flex flex-col items-center select-none text-center">
          <p className="text-[11px] text-slate-400 font-semibold leading-relaxed mb-3">
            {language === "bn" ? "নতুন পাসওয়ার্ড বা VIP অ্যাক্সেস কোড পেতে যোগাযোগ করুন:" : "To get VIP access codes or custom assistance, click below:"}
          </p>

          <button
            onClick={openTelegramGroup}
            className="tg-interactive-glow w-full bg-sky-950/30 hover:bg-sky-950/50 border border-sky-400/30 text-sky-301 font-black text-[11px] py-2 px-3 rounded-2xl transition duration-150 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 shrink-0" />
            <span>@POKETS_BROKAR (TELEGRAM GROUP)</span>
          </button>
        </div>

        {/* Demo Fallback hints for ease of use */}
        <div className="mt-4 bg-slate-950/80 border border-slate-800/40 rounded-xl p-2.5 text-center text-[10.5px]">
          <span className="text-emerald-450 font-bold block mb-1">
            🔑 {language === "bn" ? "নিবন্ধিত অ্যাকাউন্ট দিয়ে লগইন করুন:" : "Registered Accounts:"}
          </span>
          <p className="text-slate-400 leading-relaxed">
            {language === "bn" 
              ? "সাধারণ ইউজারনেম admin এবং পাসওয়ার্ড 123 দিয়ে লগইন করুন, অথবা সম্পূর্ণ নতুন অ্যাকাউন্ট খুলুন।" 
              : "Use 'admin' as username and '123' as password to test, or click Register above to create your own!"}
          </p>
          <div className="mt-2 pt-2 border-t border-slate-800/60">
            <span className="text-indigo-400 font-bold block mb-0.5">
              🛡️ {language === "bn" ? "এডমিন প্যানেলে লগইন করার নিয়ম:" : "Admin Panel Access:"}
            </span>
            <p className="text-slate-300 font-mono text-[9px] font-semibold">
              Username: <span className="text-white bg-slate-900 border border-slate-800 px-1 py-0.2 rounded font-black">00000000000</span>
              <br />
              Password: <span className="text-white bg-slate-900 border border-slate-800 px-1 py-0.2 rounded font-black">0000000000</span>
            </p>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
