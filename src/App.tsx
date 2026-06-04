import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  RefreshCw, 
  RotateCcw, 
  Trash2, 
  Languages, 
  HelpCircle, 
  FileCheck, 
  Search, 
  AlertCircle,
  Wifi,
  Battery,
  Signal,
  History,
  X,
  Smartphone,
  Sparkles,
  LogOut,
  ShieldCheck,
  Megaphone
} from "lucide-react";
import { AnalysisHistoryItem, TradingAnalysis } from "./types";
import { translations, Language } from "./utils/translations";
import UploadArea from "./components/UploadArea";
import AnalysisResult from "./components/AnalysisResult";
import LoginScreen from "./components/LoginScreen";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  // Translate & Language States
  const [language, setLanguage] = useState<Language>("bn"); // Default to Bangla as requested in Bengali
  const t = translations[language];

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // States to keep track of active sessions and registered users
  const [registeredUsers, setRegisteredUsers] = useState<Record<string, string>>({});
  const [activeSessions, setActiveSessions] = useState<Record<string, number>>({});
  const [networkFilter, setNetworkFilter] = useState<"all" | "active">("all");

  // App configurations controlled dynamically by the admin
  const [telegramLink, setTelegramLink] = useState("https://t.me/poketbrokar");
  const [globalAnnouncement, setGlobalAnnouncement] = useState("");
  const [analysisReloadKey, setAnalysisReloadKey] = useState(0);

  const refreshCustomConfig = () => {
    try {
      const storedTelegram = localStorage.getItem("nila_custom_telegram_v1");
      if (storedTelegram) setTelegramLink(storedTelegram);

      const storedAnnounce = localStorage.getItem("nila_custom_announcement_v1");
      if (storedAnnounce) setGlobalAnnouncement(storedAnnounce);
      
      const storedRegList = localStorage.getItem("nila_registered_users_v1");
      if (storedRegList) {
        setRegisteredUsers(JSON.parse(storedRegList));
      } else {
        const defaultList = { 
          "limon258144@gmail.com": "nila2026", 
          "admin@gmail.com": "nila2026", 
          "korimanalice@gmail.com": "nila2026",
          "demo.trader@gmail.com": "nila2026",
          "safayet.trader@gmail.com": "nila2026",
          "rashed.vip@gmail.com": "nila2026",
          "tariq.bin.ziyad@gmail.com": "nila2026"
        };
        setRegisteredUsers(defaultList);
        localStorage.setItem("nila_registered_users_v1", JSON.stringify(defaultList));
      }

      const storedActive = localStorage.getItem("nila_active_sessions_v1");
      if (storedActive) {
        setActiveSessions(JSON.parse(storedActive));
      } else {
        const defaultActive = {
          "limon258144@gmail.com": Date.now(),
          "demo.trader@gmail.com": Date.now() - 15000,
          "rashed.vip@gmail.com": Date.now() - 45000,
          "korimanalice@gmail.com": Date.now() - 120000
        };
        setActiveSessions(defaultActive);
        localStorage.setItem("nila_active_sessions_v1", JSON.stringify(defaultActive));
      }

      setAnalysisReloadKey(prev => prev + 1);
    } catch (e) {
      console.error("Failed to load configs from storage", e);
    }
  };

  // Subtle success arpeggio chime built with Web Audio API for rewarding user feedback
  const playSuccessChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      // Note frequencies of a sparkling C major arpeggio (C5 -> E5 -> G5 -> C6)
      const notes = [
        { freq: 523.25, delay: 0, vol: 0.10, duration: 0.35 },    // C5
        { freq: 659.25, delay: 0.06, vol: 0.08, duration: 0.35 }, // E5
        { freq: 783.99, delay: 0.12, vol: 0.07, duration: 0.40 }, // G5
        { freq: 1046.50, delay: 0.18, vol: 0.06, duration: 0.45 } // C6
      ];

      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Mix pure sines for a bell/music-box sweetness
        osc.type = "sine";
        osc.frequency.setValueAtTime(note.freq, now + note.delay);

        // Sound envelope control: rapid fade-in, organic exponential decay
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(note.vol, now + note.delay + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + note.delay + note.duration);

        osc.start(now + note.delay);
        osc.stop(now + note.delay + note.duration);
      });
    } catch (e) {
      console.warn("Successful chime audio playback skipped or blocked by browser user gesture policy", e);
    }
  };

  // Helper to determine if a logged in account has administrative privileges
  const isUserAdmin = (username: string | null): boolean => {
    if (!username) return false;
    const lower = username.toLowerCase();
    return (
      lower === "00000000000" || 
      lower === "limon258144@gmail.com" || 
      lower === "admin@gmail.com"
    );
  };

  // Analysis rate limiting (Max 2 per day per user account, excluding master accounts)
  const checkAnalysisLimit = (username: string): { allowed: boolean; remaining: number; count: number } => {
    if (isUserAdmin(username)) {
      return { allowed: true, remaining: 999, count: 0 };
    }
    
    try {
      const limitDataStr = localStorage.getItem("nila_analysis_limits_v1") || "{}";
      const limits: Record<string, number[]> = JSON.parse(limitDataStr);
      
      const userTimestamps = limits[username] || [];
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const activeTimestamps = userTimestamps.filter(t => t > oneDayAgo);
      
      const count = activeTimestamps.length;
      const remaining = Math.max(0, 2 - count);
      return { allowed: remaining > 0, remaining, count };
    } catch (e) {
      console.error(e);
      return { allowed: true, remaining: 2, count: 0 };
    }
  };

  const incrementAnalysisCount = (username: string) => {
    if (!username || isUserAdmin(username)) return;
    
    try {
      const limitDataStr = localStorage.getItem("nila_analysis_limits_v1") || "{}";
      const limits: Record<string, number[]> = JSON.parse(limitDataStr);
      
      const userTimestamps = limits[username] || [];
      userTimestamps.push(Date.now());
      
      // Keep only last 24 hours of logs to avoid infinite storage bloat
      const oneDayAgo = Date.now() - 24 * 60 * 65 * 1000;
      limits[username] = userTimestamps.filter(t => t > oneDayAgo);
      
      localStorage.setItem("nila_analysis_limits_v1", JSON.stringify(limits));
      // Dispatch custom settings update event so limits reactively recalculate
      window.dispatchEvent(new Event("nila_settings_updated"));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshCustomConfig();
    window.addEventListener("nila_settings_updated", refreshCustomConfig);
    return () => window.removeEventListener("nila_settings_updated", refreshCustomConfig);
  }, []);

  // Core Data States
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [activeItem, setActiveItem] = useState<AnalysisHistoryItem | null>(null);

  // Upload States
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  // Analysis States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mock status bar states
  const [mockClock, setMockClock] = useState("10:00 AM");
  const [mockBattery, setMockBattery] = useState(100);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [communitySearch, setCommunitySearch] = useState("");

  // Update clock & battery animations to make UI highly alive
  useEffect(() => {
    document.title = "নীলা ট্রেডার/L dp";
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setMockClock(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 15000);

    // Slowly fluctuate simulated battery
    const batteryRandom = Math.floor(Math.random() * 15) + 80;
    setMockBattery(batteryRandom);

    return () => clearInterval(interval);
  }, []);

  // Load history and user session from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("nila_logged_in_user_v1");
      if (storedUser) {
        setCurrentUser(storedUser);
        if (isUserAdmin(storedUser)) {
          setShowAdminPanel(true);
        }
        // Register active session & registered user directory in localStorage
        try {
          // 1. Sync active sessions
          const storedSessions = localStorage.getItem("nila_active_sessions_v1");
          let sessions: Record<string, number> = {};
          if (storedSessions) {
            sessions = JSON.parse(storedSessions);
          }
          sessions[storedUser] = Date.now();
          localStorage.setItem("nila_active_sessions_v1", JSON.stringify(sessions));

          // 2. Sync registered directory
          const storedReg = localStorage.getItem("nila_registered_users_v1");
          let regs = storedReg ? JSON.parse(storedReg) : {};
          if (!regs[storedUser]) {
            regs[storedUser] = "google-oauth";
            localStorage.setItem("nila_registered_users_v1", JSON.stringify(regs));
          }

          window.dispatchEvent(new Event("nila_settings_updated"));
        } catch (err) {
          console.error("Failed to register session on mount", err);
        }
      }

      const storedHistory = localStorage.getItem("trading_analysis_history_v1");
      if (storedHistory) {
        const parsed = JSON.parse(storedHistory) as AnalysisHistoryItem[];
        setHistory(parsed);
        if (parsed.length > 0) {
          // Default load the first item to show the dashboard immediately
          setActiveItem(parsed[0]);
        }
      }
    } catch (e) {
      console.error("Failed to parse localStorage history or user session on load", e);
    }
  }, []);

  // Sync history list to localStorage
  const saveHistoryToStorage = (newHistory: AnalysisHistoryItem[]) => {
    try {
      localStorage.setItem("trading_analysis_history_v1", JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to write history in localStorage", e);
    }
  };

  const stepsBn = [
    "ট্রেডিং স্ক্রিনশটটি প্রসেস করা হচ্ছে...",
    "ক্যান্ডেলস্টিক প্যাটার্ন এবং চার্ট স্ট্রাকচার স্ক্যান করা হচ্ছে...",
    "গুরুত্বপূর্ণ সাপোর্ট এবং রেজিস্ট্যান্স লেভেল হিসাব করা হচ্ছে...",
    "ক্যান্ডেল ব্রেকআউট এবং রিজেকশন জোন পরীক্ষা করা হচ্ছে...",
    "আপ ও ডাউন ক্যান্ডেলের সঠিক ট্রেড এন্ট্রি পয়েন্ট খোঁজা হচ্ছে...",
    "স্টপ-লস এবং টেক-প্রফিটের ঝুঁকি রেশিও নির্ধারণ করা হচ্ছে...",
    "বাংলা ভাষায় নিখুঁত সিগন্যাল রিপোর্ট প্রস্তুত করা হচ্ছে..."
  ];

  const stepsEn = [
    "Uploading screenshot securely...",
    "Scanning visual candles and pattern structures...",
    "Calculating major Support and Resistance levels...",
    "Evaluating immediate candle breakouts...",
    "Formulating Buy and Sell closing thresholds...",
    "Finalizing trading risk-to-reward ratio...",
    "Formatting technical report in English..."
  ];

  const steps = language === "bn" ? stepsBn : stepsEn;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setAnalysisStep((prev) => (prev + 1) % steps.length);
      }, 2500);
    } else {
      setAnalysisStep(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing, steps.length]);

  // Handle uploaded or selected sample image
  const handleImageSelected = (dataUrl: string, fileName: string) => {
    setSelectedImage(dataUrl);
    setSelectedFileName(fileName);
    setErrorMsg(null);
    setActiveItem(null); // Clear selected calculation to show prompt/pre-analyze mode
  };

  // call full stack backend analyze endpoint
  const runAnalysis = async () => {
    if (!selectedImage) return;

    // Open Telegram group link exactly once across sessions
    try {
      const hasOpenedTelegram = localStorage.getItem("nila_telegram_opened_v1");
      if (!hasOpenedTelegram) {
        window.open(telegramLink, "_blank");
        localStorage.setItem("nila_telegram_opened_v1", "true");
      }
    } catch (e) {
      console.error("Local storage or window redirect failed", e);
    }

    if (currentUser) {
      const limitCheck = checkAnalysisLimit(currentUser);
      if (!limitCheck.allowed) {
        setErrorMsg(
          language === "bn"
            ? "দুঃখিত! আপনি ২৪ ঘণ্টায় সর্বোচ্চ ২ টি ছবি অ্যানালাইসিস করার কোটা অতিক্রম করেছেন। দয়া করে আগামীকাল আবার চেষ্টা করুন।"
            : "Sorry! You have exceeded the limit of 2 chart analyses per 24 hours. Please try again tomorrow."
        );
        return;
      }
    }

    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: selectedImage,
        }),
      });

      let errorText = "";
      let analyzedPayload: TradingAnalysis | null = null;

      try {
        const text = await response.text();
        if (!response.ok) {
          try {
            const parsed = JSON.parse(text);
            errorText = parsed.error || parsed.message || `Error ${response.status}`;
          } catch {
            // Check if it is an HTML or text error response
            if (text.includes("GEMINI_API_KEY") || text.includes("missing") || text.includes("API key")) {
              errorText = language === "bn"
                ? "আপনার API কী (GEMINI_API_KEY) সেট করা নেই অথবা সেটি ভুল। দয়া করে সেটিংস (Settings > Secrets) এ গিয়ে সঠিক API Key যুক্ত করুন এবং পেজটি রিফ্রেশ করুন।"
                : "Your API key (GEMINI_API_KEY) is missing or invalid. Please check and configure a valid Gemini API Key in Settings > Secrets and refresh the page.";
            } else if (text.includes("The page could not be loaded") || text.includes("The page c") || response.status === 502 || response.status === 503) {
              errorText = language === "bn"
                ? "সার্ভার লোড করতে ব্যাহত হয়েছে। অনুগ্রহ করে সেটিংস (Settings > Secrets) এ GEMINI_API_KEY সঠিকভাবে সেট করা আছে কিনা যাচাই করুন এবং পেজটি রিফ্রেশ করুন।"
                : "The page/service could not be loaded. Please ensure your GEMINI_API_KEY is correctly set in Settings > Secrets and refresh the page.";
            } else {
              errorText = text.length > 120 ? `${text.slice(0, 120)}...` : text;
            }
          }
        } else {
          try {
            analyzedPayload = JSON.parse(text) as TradingAnalysis;
          } catch (jsonErr) {
            console.error("Failed to parse successful analysis JSON:", jsonErr);
            throw new Error(
              language === "bn"
                ? "সার্ভার থেকে প্রাপ্ত তথ্য সঠিক প্যাটার্নে নেই। দয়া করে আবার চেষ্টা করুন।"
                : "Invalid response pattern received from the server. Please try again."
            );
          }
        }
      } catch (parseFail: any) {
        throw new Error(parseFail.message || t.serverOffline);
      }

      if (errorText) {
        let finalError = errorText;
        const lowerError = finalError.toLowerCase();
        if (
          lowerError.includes("429") ||
          lowerError.includes("quota") ||
          lowerError.includes("limit") ||
          lowerError.includes("resource_exhausted") ||
          lowerError.includes("rate limit") ||
          lowerError.includes("exhausted") ||
          lowerError.includes("503") ||
          lowerError.includes("unavailable") ||
          lowerError.includes("high demand") ||
          lowerError.includes("temporary") ||
          lowerError.includes("spikes") ||
          lowerError.includes("apierror") ||
          lowerError.includes("api-error")
        ) {
          finalError = "eror dblpr";
        }
        throw new Error(finalError);
      }

      if (!analyzedPayload) {
        throw new Error(t.serverOffline);
      }

      const newItem: AnalysisHistoryItem = {
        id: `analysis_${Date.now()}`,
        timestamp: Date.now(),
        imageFileName: selectedFileName || "unnamed_chart.png",
        imageDataUrl: selectedImage,
        analysis: analyzedPayload,
      };

      const updatedHistory = [newItem, ...history];
      setHistory(updatedHistory);
      setActiveItem(newItem);
      saveHistoryToStorage(updatedHistory);

      if (currentUser) {
        incrementAnalysisCount(currentUser);
      }

      // Trigger the interactive Web Audio success arpeggio chime
      playSuccessChime();

      // Reset work images to display analysis directly
      setSelectedImage(null);
      setSelectedFileName(null);

    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || t.serverOffline;
      const lowerErr = errMsg.toLowerCase();
      if (
        lowerErr.includes("quota") ||
        lowerErr.includes("limit") ||
        lowerErr.includes("429") ||
        lowerErr.includes("rate limit") ||
        lowerErr.includes("exhausted") ||
        lowerErr.includes("503") ||
        lowerErr.includes("unavailable") ||
        lowerErr.includes("high demand") ||
        lowerErr.includes("temporary") ||
        lowerErr.includes("spikes") ||
        lowerErr.includes("apierror") ||
        lowerErr.includes("api-error") ||
        lowerErr.includes("unvailable")
      ) {
        errMsg = "eror dblpr";
      }
      setErrorMsg(errMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Sidebar item select
  const handleSelectItem = (item: AnalysisHistoryItem) => {
    setActiveItem(item);
    // Clear tentative selection states
    setSelectedImage(null);
    setSelectedFileName(null);
    setErrorMsg(null);
    setShowHistoryDrawer(false); // Close history drawer on mobile select
  };

  // Delete individual item from history
  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    saveHistoryToStorage(updated);
    if (activeItem?.id === id) {
      setActiveItem(updated.length > 0 ? updated[0] : null);
    }
  };

  // Clear all items in history
  const handleClearAllHistory = () => {
    if (confirm(language === "bn" ? "আপনি কি সম্পূর্ণ হিস্ট্রি মুছতে চান?" : "Are you sure you want to delete all analyzed charts?")) {
      setHistory([]);
      setActiveItem(null);
      localStorage.removeItem("trading_analysis_history_v1");
      setShowHistoryDrawer(false);
    }
  };

  // Cancel tentative image selection
  const handleCancelSelection = () => {
    setSelectedImage(null);
    setSelectedFileName(null);
    setErrorMsg(null);
    if (history.length > 0) {
      setActiveItem(history[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[#060608] text-slate-100 flex flex-col justify-center items-center p-0 md:p-6 lg:p-10 relative overflow-x-hidden font-sans">
      
      {/* Decorative desktop ambient light source */}
      <div className="absolute top-0 left-1/4 w-[40rem] h-[40rem] rounded-full bg-indigo-500/10 blur-3xl pointer-events-none hidden md:block" />
      <div className="absolute bottom-0 right-1/4 w-[40rem] h-[40rem] rounded-full bg-purple-500/10 blur-3xl pointer-events-none hidden md:block" />

      {/* Main Responsive Layout Wrapper: Mobile-first simulated phone chassis for desktop screens */}
      <div 
        id="applet-viewport-frame"
        className="w-full md:max-w-[480px] min-h-screen md:min-h-[880px] md:max-h-[920px] bg-[#0b0c10] md:rounded-[44px] md:border-8 md:border-[#1d2230] md:shadow-[0_0_80px_20px_rgba(99,102,241,0.15)] flex flex-col overflow-hidden relative"
      >
        
        {/* Simulated Smartphone Bezel Notch & Top Speaker (Visual craftsmanship for 'phoner moto' requested design) */}
        <div className="hidden md:flex justify-center items-center absolute top-1.5 left-0 right-0 z-50 pointer-events-none">
          {/* Dynamic Island style Pill */}
          <div className="w-28 h-6 bg-black rounded-full border border-slate-900 flex items-center justify-center">
            <span className="w-2.5 h-2.5 bg-indigo-900/40 rounded-full border border-indigo-400/40 animate-pulse" />
          </div>
        </div>

        {/* Mock Physical Top Status Bar */}
        <div className="bg-[#0b0c10] px-6 pt-3 pb-2 flex justify-between items-center text-xs font-semibold text-slate-400 border-b border-white/5 relative z-40 select-none">
          <div className="font-mono text-[11px] font-bold tracking-tight">
            {mockClock}
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] font-black tracking-widest text-[#a855f7] font-mono drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]">
            NILA\L
          </div>
          
          <div className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5 text-emerald-400" />
            <Wifi className="w-3.5 h-3.5 text-indigo-400" />
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono">{mockBattery}%</span>
              <Battery className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Dynamic Compact Interactive Main Header */}
        <header className="bg-[#0f111a]/95 border-b border-indigo-500/15 backdrop-blur-md px-4 py-3.5 flex items-center justify-between sticky top-0 z-40 select-none">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <TrendingUp className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-black font-display text-white tracking-tight flex items-center gap-1">
                {language === "bn" ? "নীলা ট্রেডার/L" : "NILA TRADER/L"}
                <span className="text-[8px] font-mono bg-indigo-505/10 text-indigo-400 px-1 py-0.5 border border-indigo-500/20 rounded">
                  PRO
                </span>
              </h1>
              <span 
                onClick={() => window.open(telegramLink, "_blank")}
                className="text-[10.5px] block text-indigo-300 hover:text-indigo-205 cursor-pointer font-bold leading-tight mt-1 hover:underline transition duration-150 active:scale-95"
              >
                {language === "bn" ? "এটার প্রিমিয়াম ভার্সন চাইলে টেলিগ্রামে মেসেজ দিন" : "Want premium version? Message on Telegram"}
              </span>
            </div>
          </div>

          {/* Controls button rail */}
          <div className="flex items-center gap-1.5">

            {/* History Toggle button with badge count */}
            {currentUser && (
              <button
                id="toggle-history-drawer-btn"
                onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition active:scale-90 relative cursor-pointer"
              >
                <History className="w-4 h-4" />
                {history.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-600 text-[8px] font-extrabold text-white rounded-full flex items-center justify-center animate-bounce">
                    {history.length}
                  </span>
                )}
              </button>
            )}

            {/* Language switch button */}
            <button
              id="lang-toggle-btn"
              onClick={() => setLanguage(language === "bn" ? "en" : "bn")}
              className="text-[10px] uppercase font-black px-2.5 py-1.5 rounded-xl bg-indigo-600/20 border-2 border-indigo-500/40 text-indigo-300 active:scale-95 cursor-pointer"
              title="Change Language"
            >
              {language === "bn" ? "EN" : "বাংলা"}
            </button>

            {/* Admin control toggle button */}
            {isUserAdmin(currentUser) && (
              <button
                id="admin-toggle-btn"
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className={`p-2 rounded-xl border transition duration-150 active:scale-90 cursor-pointer ${
                  showAdminPanel 
                    ? "bg-indigo-650 border-indigo-550 text-white shadow-md shadow-indigo-600/20" 
                    : "bg-slate-900 border-slate-805 text-indigo-400 hover:text-indigo-300"
                }`}
                title={language === "bn" ? "এডমিন প্যানেল" : "Admin Panel"}
              >
                <ShieldCheck className="w-4 h-4" />
              </button>
            )}

            {/* Log out button when logged-in */}
            {currentUser && (
              <button
                id="logout-btn"
                onClick={() => setShowLogoutConfirm(true)}
                className="p-2 rounded-xl bg-rose-950/20 border border-rose-500/25 text-rose-400 hover:text-white hover:bg-rose-900/10 transition active:scale-90 cursor-pointer"
                title={language === "bn" ? "লগ আউট" : "Log Out"}
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

          </div>
        </header>

        {/* Mock App Inner Canvas Scroll container - Touch scroll mimicking real phone feel */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#07070a] p-4 space-y-6 pb-24 relative z-30">
          
          {!currentUser ? (
            <LoginScreen 
              language={language === "bn" ? "bn" : "en"} 
              onLoginSuccess={(un) => {
                setCurrentUser(un);
                localStorage.setItem("nila_logged_in_user_v1", un);
                if (isUserAdmin(un)) {
                  setShowAdminPanel(true);
                }
                try {
                  const storedSessions = localStorage.getItem("nila_active_sessions_v1");
                  let sessions: Record<string, number> = {};
                  if (storedSessions) {
                    sessions = JSON.parse(storedSessions);
                  }
                  sessions[un] = Date.now();
                  localStorage.setItem("nila_active_sessions_v1", JSON.stringify(sessions));

                  const storedReg = localStorage.getItem("nila_registered_users_v1");
                  let regs = storedReg ? JSON.parse(storedReg) : {};
                  if (!regs[un]) {
                    regs[un] = "google-oauth";
                    localStorage.setItem("nila_registered_users_v1", JSON.stringify(regs));
                  }

                  window.dispatchEvent(new Event("nila_settings_updated"));
                } catch (err) {
                  console.error(err);
                }
              }} 
            />
          ) : showAdminPanel ? (
            <AdminPanel 
              language={language} 
              onBackToApp={() => setShowAdminPanel(false)} 
            />
          ) : (
            <>
              {/* Global Broadcast Announcement set by Admin */}
              {globalAnnouncement && (
                <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-indigo-950/40 border-2 border-indigo-500/15 rounded-2xl p-2.5 px-3.5 flex items-center gap-2.5 text-left text-xs text-indigo-200 animate-fade-in">
                  <Megaphone className="w-3.5 h-3.5 text-indigo-400 shrink-0" style={{ animationDuration: "2s" }} />
                  <p className="font-semibold leading-relaxed select-none">{globalAnnouncement}</p>
                </div>
              )}

              {/* Daily Analysis limit banner */}
              {currentUser && !isUserAdmin(currentUser) && (
                (() => {
                  const limitInfo = checkAnalysisLimit(currentUser);
                  return (
                    <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition duration-150 ${
                      limitInfo.remaining === 0 
                        ? "bg-rose-950/20 border-rose-500/30 text-rose-300 animate-bounce" 
                        : "bg-indigo-950/20 border-indigo-500/15 text-indigo-300"
                    }`}>
                      <div className="flex items-center gap-2">
                        <Sparkles className={`w-3.5 h-3.5 ${limitInfo.remaining === 0 ? "text-rose-450" : "text-indigo-400 animate-pulse"}`} />
                        <span className="font-semibold select-none">
                          {language === "bn"
                            ? "অ্যানালাইসিস দৈনিক লিমিট:"
                            : "Daily Analysis Limit:"}
                        </span>
                      </div>
                      <div className="font-mono font-bold text-right text-[11px]">
                        {language === "bn"
                          ? `${limitInfo.remaining} টি বাকি (২ টির মধ্যে)`
                          : `${limitInfo.remaining} remaining (out of 2)`}
                      </div>
                    </div>
                  );
                })()
              )}
              {/* Active API Error state notification */}
              {errorMsg && (
                <div id="api-error-alert" className="bg-rose-500/10 border-2 border-rose-500/40 text-rose-200 text-xs px-4 py-3.5 rounded-2xl flex flex-col gap-3 shadow-xl">
                  <div className="flex items-start gap-2.5 w-full">
                    <AlertCircle className="w-5 h-5 text-rose-450 shrink-0 mt-0.5 animate-pulse" />
                    <div className="space-y-1.5 w-full text-left">
                      <div className="flex items-center justify-between gap-2 w-full">
                        <p className="font-extrabold text-rose-300">
                          {language === "bn" ? "অ্যানালাইসিস ত্রুটি" : "Analysis Failed"}
                        </p>
                        <span className="text-[10px] font-mono font-black bg-rose-950/80 text-rose-400 border border-rose-500/40 px-2 py-0.5 rounded-md animate-pulse shrink-0 select-none tracking-wider">
                          eror dblpr
                        </span>
                      </div>
                      <p className="opacity-90 leading-relaxed text-rose-200/90">{errorMsg}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full pt-1.5 border-t border-rose-500/10">
                    <button
                      onClick={runAnalysis}
                      className="flex-1 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/30 text-rose-300 font-extrabold text-xs py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition active:scale-95"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      {language === "bn" ? "আবার চেষ্টা করুন" : "Retry Analysis"}
                    </button>
                  </div>
                </div>
              )}

              {/* Core App View Controller */}
              {isAnalyzing ? (
                /* Analysis loading display */
                <div id="analysis-loading-state" className="bg-[#111116] border-2 border-slate-800 rounded-3xl p-8 text-center min-h-[360px] flex flex-col items-center justify-center space-y-5 animate-fade-in relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-1 bg-slate-800">
                    <div className="h-full bg-indigo-500 animate-[pulse_1.5s_infinite]" style={{ width: "70%" }} />
                  </div>
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full border-4 border-slate-850 border-t-indigo-500 animate-spin" />
                    <TrendingUp className="w-5 h-5 text-indigo-400 absolute inset-0 m-auto loading-pulse animate-bounce" />
                  </div>
                  <div className="space-y-2 max-w-sm">
                    <h3 className="text-white font-display font-black text-base md:text-lg">
                      {t.analyzing}
                    </h3>
                    <p className="text-[#a855f7] text-xs font-mono font-bold tracking-tight h-10 content-center">
                      {steps[analysisStep]}
                    </p>
                  </div>
                  
                  <div className="w-48 bg-slate-900 border border-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full transition-all duration-700 ease-out" 
                      style={{ width: `${((analysisStep + 1) / steps.length) * 100}%` }}
                    />
                  </div>
                </div>
              ) : selectedImage ? (
                /* image loaded - prep for analysis view */
                <div id="analysis-ready-view" className="bg-[#111116] border-2 border-indigo-500/20 rounded-3xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-white font-display font-black text-xs flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-indigo-400" />
                      নতুন চার্ট স্ক্যান করতে প্রস্তুত
                    </h3>
                    <span className="text-[10px] text-indigo-400 font-mono truncate max-w-[140px]">
                      {selectedFileName}
                    </span>
                  </div>

                  <div className="bg-slate-950 rounded-2xl overflow-hidden aspect-[4/3] p-3 flex items-center justify-center border border-slate-850">
                    <img
                      src={selectedImage}
                      alt="Tentative chart selection"
                      className="max-h-full max-w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      id="trigger-analysis-btn"
                      onClick={runAnalysis}
                      disabled={!isUserAdmin(currentUser) && checkAnalysisLimit(currentUser || "").remaining <= 0}
                      className={`w-full font-black py-3.5 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition duration-150 active:scale-95 cursor-pointer ${
                        !isUserAdmin(currentUser) && checkAnalysisLimit(currentUser || "").remaining <= 0
                          ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50 shadow-none"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
                      }`}
                    >
                      <Search className="w-5 h-5" />
                      {!isUserAdmin(currentUser) && checkAnalysisLimit(currentUser || "").remaining <= 0
                        ? (language === "bn" ? "দৈনিক লিমিট শেষ (২/২)" : "Daily Limit Reached (2/2)")
                        : (language === "bn" ? "বিশ্লেষণ শুরু করুন" : "Start Analysis")}
                    </button>
                    <button
                      id="cancel-image-selection-btn"
                      onClick={handleCancelSelection}
                      className="w-full py-3 border-2 border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs rounded-2xl hover:bg-slate-900 transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      বাতিল করুন
                    </button>
                  </div>
                </div>
              ) : activeItem ? (
                /* Active Analysis decision screens */
                <div className="space-y-5 animate-fade-in">
                  
                  {/* Quick swap uploader link banner */}
                  <div className="flex items-center justify-between gap-3 bg-[#111116] border-2 border-slate-800 rounded-3xl px-4 py-3">
                    <div className="max-w-[200px] overflow-hidden">
                      <span className="text-[9px] uppercase font-mono text-indigo-400 font-black block tracking-widest">ফাইল রেকর্ড</span>
                      <span className="text-xs text-white truncate block font-bold leading-tight mt-0.5">{activeItem.imageFileName}</span>
                    </div>
                    <button
                      id="nav-to-uploader-btn"
                      onClick={() => {
                        setSelectedImage(null);
                        setSelectedFileName(null);
                        setActiveItem(null);
                      }}
                      className="bg-indigo-600/10 border-2 border-indigo-500/30 text-indigo-300 font-black text-xs px-3.5 py-2 rounded-2xl hover:bg-[#131520] transition duration-150 flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "6s" }} />
                      নতুন চার্ট দিন
                    </button>
                  </div>

                  {/* Comprehensive visual pattern metrics */}
                  <AnalysisResult
                    analysis={activeItem.analysis}
                    language={language}
                    imageFileName={activeItem.imageFileName}
                    imageDataUrl={activeItem.imageDataUrl}
                  />

                </div>
              ) : (
                /* Standard Uploader dashboard */
                <div className="space-y-5 animate-fade-in">
                  
                  <div className="bg-[#111116] border-2 border-indigo-500/20 rounded-3xl p-5 text-center relative overflow-hidden">
                    <div className="absolute -right-12 -top-12 w-28 h-28 bg-[#c084fc]/10 rounded-full blur-2xl pointer-events-none" />
                    <h3 className="text-white font-display font-black text-base mb-1">
                      কোনো ট্রেডিং চার্ট ফাইল নেই
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                      আপনার কিউএল, পকেট অপশন বা ট্রেডিংভিউ চার্টের স্ক্রিনশট নিচে আপলোড করুন। আমাদের এআই অ্যানালাইজার তৎক্ষণাৎ পরবর্তী ক্যান্ডেলের পূর্বাভাস নির্ধারণ করে দেবে।
                    </p>
                  </div>

                  <UploadArea
                    onImageSelected={handleImageSelected}
                    language={language}
                    isAnalyzing={isAnalyzing}
                  />

                </div>
              )}

              {/* 🌐 LIVE TRADERS NETWORK ACTIVITY & ACCOUNTS DIRECTORY */}
              <div id="live-members-directory-widget" className="bg-[#111116] border-2 border-indigo-500/15 rounded-3xl p-5 space-y-4 shadow-xl select-none relative overflow-hidden text-left mt-2 animate-fade-in">
                {/* Glowing subtle ambient mesh */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                
                {/* Panel Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <h3 className="text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                      <Wifi className="w-3.5 h-3.5 text-indigo-400" />
                      {language === "bn" ? "লাইভ ট্রেডার্স নেটওয়ার্ক" : "Live Traders Network"}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 bg-[#09090d] border border-slate-800/60 rounded-xl px-2 py-0.5">
                    <span className="text-[9px] font-mono font-black text-indigo-400 uppercase tracking-widest">
                      {networkFilter === "active" ? (language === "bn" ? "সক্রিয়" : "Active") : (language === "bn" ? "সকল" : "All")}
                    </span>
                  </div>
                </div>

                {/* 📊 INTERACTIVE STATS / FILTER TABS (Click to filter names!) */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="logged-in-members-card"
                    onClick={() => {
                      setNetworkFilter("active");
                      playSuccessChime(); // subtle sweet tick sound
                    }}
                    className={`p-3 rounded-2xl border transition duration-150 flex flex-col items-center justify-center gap-1 cursor-pointer select-none ${
                      networkFilter === "active"
                        ? "bg-indigo-650/25 border-emerald-500/50 text-white shadow-[0_0_12px_rgba(16,185,129,0.12)]"
                        : "bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-800 hover:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-center">
                        {language === "bn" ? "অনলাইন ট্রেডার্স" : "Online Traders"}
                      </span>
                    </div>
                    <span className="text-[15px] font-black font-mono text-emerald-400 mt-0.5">
                      {Object.keys(activeSessions).length} {language === "bn" ? "জন সক্রিয়" : "Active"}
                    </span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight mt-0.5 animate-pulse">
                      {language === "bn" ? "নাম দেখতে চাপুন" : "Tap to show list"}
                    </span>
                  </button>

                  <button
                    id="registered-members-card"
                    onClick={() => {
                      setNetworkFilter("all");
                      playSuccessChime(); // subtle sweet tick sound
                    }}
                    className={`p-3 rounded-2xl border transition duration-150 flex flex-col items-center justify-center gap-1 cursor-pointer select-none ${
                      networkFilter === "all"
                        ? "bg-indigo-650/25 border-indigo-500/50 text-white shadow-[0_0_12px_rgba(99,102,241,0.12)]"
                        : "bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-800 hover:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-center">
                        {language === "bn" ? "মোট লগইনকৃত" : "Total Logged-in"}
                      </span>
                    </div>
                    <span className="text-[15px] font-black font-mono text-indigo-400 mt-0.5">
                      {Object.keys(registeredUsers).length} {language === "bn" ? "টি অ্যাকাউন্ট" : "Accounts"}
                    </span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight mt-0.5 animate-pulse">
                      {language === "bn" ? "নাম দেখতে চাপুন" : "Tap to show list"}
                    </span>
                  </button>
                </div>

                <div className="bg-[#14141d]/40 rounded-xl p-2 px-3 flex items-center justify-between text-[11px] text-indigo-300/90 font-bold border border-slate-900/60">
                  <span>
                    {language === "bn" 
                      ? (networkFilter === "active" ? "🟢 এখন যারা অনলাইন আছেন:" : "👥 নীলা সিস্টেমে মোট লগইনকৃত মেম্বারসমূহ:")
                      : (networkFilter === "active" ? "🟢 Showing online users now:" : "👥 Showing all registered members:")}
                  </span>
                  <span className="text-[10px] font-mono bg-indigo-950/50 px-1.5 py-0.5 rounded text-indigo-400 border border-indigo-900/30">
                    {networkFilter === "active" ? Object.keys(activeSessions).length : Object.keys(registeredUsers).length}
                  </span>
                </div>

                {/* Directory Live Search */}
                <div className="relative">
                  <input 
                    type="text"
                    value={communitySearch}
                    onChange={(e) => setCommunitySearch(e.target.value)}
                    placeholder={language === "bn" ? "ইউজার বা জিমেইল অ্যাকাউন্ট খুঁজুন..." : "Filter traders by email..."}
                    className="w-full bg-slate-950/90 border border-slate-850 hover:border-slate-800 text-slate-200 text-xs rounded-xl py-2 px-3 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40"
                  />
                </div>

                {/* Users list mapped */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                  {Object.keys(registeredUsers).length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs font-semibold italic">
                      {language === "bn" ? "মেম্বার তালিকা লোড হচ্ছে..." : "Loading member directory..."}
                    </div>
                  ) : (
                    (() => {
                      // Filter registered list based on active/all tabs and the search query
                      const filteredList = Object.keys(registeredUsers).filter((username) => {
                        // If active tab is selected, must be online
                        if (networkFilter === "active" && activeSessions[username] === undefined) {
                          return false;
                        }
                        return username.toLowerCase().includes(communitySearch.trim().toLowerCase());
                      });

                      if (filteredList.length === 0) {
                        return (
                          <div className="text-center py-6 text-slate-500 text-[11px] font-bold leading-relaxed">
                            {language === "bn" 
                              ? (networkFilter === "active" ? "এই মুহূর্তে কেউ অনলাইন নেই বা সার্চের সাথে মেলেনি!" : "কোনো মেম্বার ম্যাচ করেনি!") 
                              : (networkFilter === "active" ? "No users online match active criteria!" : "No registered members match this search!")}
                          </div>
                        );
                      }

                      return filteredList.map((username, index) => {
                        const isOnline = activeSessions[username] !== undefined;
                        const isCurrentUser = username === currentUser;
                        
                        // Assign a deterministic clean dark gradient avatar based on name index
                        const avatarColors = [
                          "bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white",
                          "bg-gradient-to-tr from-purple-600 to-pink-600 text-white",
                          "bg-gradient-to-tr from-teal-500 to-emerald-600 text-white",
                          "bg-gradient-to-tr from-amber-500 to-rose-600 text-white"
                        ];
                        const colorClass = avatarColors[index % avatarColors.length];
                        const initial = username.charAt(0).toUpperCase();

                        return (
                          <div 
                            key={username}
                            className={`flex items-center justify-between p-2.5 rounded-2xl border transition duration-150 ${
                              isCurrentUser 
                                ? "bg-indigo-950/15 border-indigo-500/25 shadow-inner" 
                                : "bg-[#14141a]/60 border-slate-900/60 hover:border-slate-800"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {/* Avatar badge */}
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs select-none shadow-md ${colorClass}`}>
                                {initial}
                              </div>
                              
                              <div className="min-w-0 text-left">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[11px] text-slate-200 font-extrabold truncate max-w-[130px] font-mono">
                                    {username}
                                  </span>
                                  
                                  {isCurrentUser && (
                                    <span className="text-[8px] font-mono font-black border border-indigo-500/30 bg-indigo-600/10 text-indigo-400 px-1 rounded-md leading-relaxed">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <span className="text-[9.5px] text-slate-500 font-bold block mt-0.5 leading-none">
                                  {isUserAdmin(username) ? (language === "bn" ? "এডমিন অ্যাকাউন্ট" : "Master Admin") : (language === "bn" ? "ভিআইপি ট্রেডার" : "VIP Trader")}
                                </span>
                              </div>
                            </div>

                            {/* Connection Live/Offline dot layout */}
                            <div className="flex items-center gap-2 bg-[#09090c] border border-slate-900 px-2.5 py-1 rounded-xl shrink-0">
                              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-700"}`} />
                              <span className={`text-[10px] uppercase font-black tracking-wide ${isOnline ? "text-emerald-400" : "text-slate-500"}`}>
                                {isOnline 
                                  ? (language === "bn" ? "অনলাইন" : "Active") 
                                  : (language === "bn" ? "অফলাইন" : "Offline")
                                }
                              </span>
                            </div>
                          </div>
                        );
                      });
                    })()
                  )}
                </div>

                {/* Widget footer bar */}
                <div className="flex items-center justify-center gap-1.5 text-[9.5px] text-slate-500 font-bold pt-1 border-t border-slate-900 select-none">
                  <span className="inline-block w-1 h-1 bg-indigo-400 rounded-full animate-bounce" />
                  <span>
                    {language === "bn" 
                      ? "পদ্ধতি সুরক্ষিত এবং মেম্বার ডেটা স্বয়ংক্রিয়ভাবে সমন্বয় করা হচ্ছে" 
                      : "System secure — live member stats synchronized interactively"}
                  </span>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Mock Physical Bottom Pill Home Bar Navigation */}
        <div className="absolute bottom-1.5 inset-x-0 z-40 flex justify-center pointer-events-none hidden md:flex">
          <div className="w-32 h-1.5 bg-slate-800 rounded-full hover:bg-slate-700 transition" />
        </div>

        {/* Navigation Sidebar Drawer for History (Optimized layout for phone overlay) */}
        {showHistoryDrawer && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col justify-end transition-all duration-300">
            <div className="bg-[#111116] border-t-2 border-indigo-500/30 rounded-t-[32px] p-5 max-h-[80%] flex flex-col justify-between overflow-hidden relative">
              
              <div className="flex items-center justify-between border-b border-slate-805 pb-3">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-[#c084fc]" />
                  <h3 className="text-white font-display font-black text-sm uppercase">
                    পূর্ববর্তী অ্যানালাইসিস হিস্ট্রি
                  </h3>
                </div>
                <button
                  onClick={() => setShowHistoryDrawer(false)}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable list inside drawer */}
              <div className="flex-1 overflow-y-auto custom-scrollbar my-4 space-y-3 pr-1">
                {history.length === 0 ? (
                  <p className="text-xs text-slate-500 font-bold text-center py-10 leading-relaxed">
                    কোনো হিস্ট্রি রেকর্ড নেই। অনুগ্রহ করে প্রথমে ড্যাশবোর্ড থেকে একটি ট্রেডিং চার্ট বিশ্লেষণ করুন।
                  </p>
                ) : (
                  history.map((item) => {
                    const isItemUp = item.analysis.prediction?.toLowerCase() === "up";
                    const isItemDown = item.analysis.prediction?.toLowerCase() === "down";

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectItem(item)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          activeItem?.id === item.id
                            ? "bg-indigo-950/20 border-indigo-500/70"
                            : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-800">
                            <img src={item.imageDataUrl} alt="prev analysis thumbnail" className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-white font-bold truncate max-w-[150px]">{item.imageFileName}</p>
                            <span className={`text-[10px] font-bold font-mono tracking-wider ${isItemUp ? "text-emerald-400" : isItemDown ? "text-rose-400" : "text-yellow-450"}`}>
                              {isItemUp ? "UP ✦ CALL" : isItemDown ? "DOWN ✦ PUT" : "NEUTRAL"} ({item.analysis.confidence}%)
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleDeleteItem(item.id, e)}
                          className="p-2 text-slate-500 hover:text-rose-450 hover:bg-rose-950/25 rounded-xl transition"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Drawer bottoms */}
              {history.length > 0 && (
                <button
                  onClick={handleClearAllHistory}
                  className="w-full bg-rose-950/30 hover:bg-rose-900/30 border-2 border-rose-500/30 text-rose-305 font-bold text-xs py-3 rounded-2xl tracking-wider uppercase transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  হিস্ট্রি ডাটা সম্পূর্ণ মুছুন
                </button>
              )}

            </div>
          </div>
        )}

        {/* Custom Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-[#111116] border-2 border-indigo-500/30 rounded-3xl p-6 max-w-xs w-full space-y-4 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
                <LogOut className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-white font-extrabold text-sm uppercase tracking-wide">
                  {language === "bn" ? "লগ আউট করতে চান?" : "Confirm Logout?"}
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                  {language === "bn"
                    ? "আপনি কি আসলেই ড্যাশবোর্ড থেকে লগ আউট করতে চান?"
                    : "Are you sure you want to log out of your session?"}
                </p>
              </div>
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-350 text-xs font-bold py-2.5 rounded-xl transition duration-150 active:scale-95 cursor-pointer"
                >
                  {language === "bn" ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const userToRemove = currentUser;
                    setCurrentUser(null);
                    localStorage.removeItem("nila_logged_in_user_v1");
                    setShowAdminPanel(false);
                    setShowLogoutConfirm(false);
                    try {
                      const storedSessions = localStorage.getItem("nila_active_sessions_v1");
                      if (storedSessions && userToRemove) {
                        const sessions = JSON.parse(storedSessions);
                        delete sessions[userToRemove];
                        localStorage.setItem("nila_active_sessions_v1", JSON.stringify(sessions));
                        window.dispatchEvent(new Event("nila_settings_updated"));
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2.5 rounded-xl transition duration-150 active:scale-95 cursor-pointer"
                >
                  {language === "bn" ? "লগ আউট" : "Log Out"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Small Ambient hint footer under phone (Hidden on actual mobile screens) */}
      <div className="mt-4 text-[11px] text-slate-600 font-mono flex items-center gap-1 select-none hidden md:flex">
        <span>Press</span>
        <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-400 font-bold">F12</span>
        <span>or resize to preview genuine responsive smartphone fidelity.</span>
      </div>

    </div>
  );
}
