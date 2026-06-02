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

  // App configurations controlled dynamically by the admin
  const [telegramLink, setTelegramLink] = useState("https://t.me/poketbrokar");
  const [globalAnnouncement, setGlobalAnnouncement] = useState("");

  const refreshCustomConfig = () => {
    try {
      const storedTelegram = localStorage.getItem("nila_custom_telegram_v1");
      if (storedTelegram) setTelegramLink(storedTelegram);

      const storedAnnounce = localStorage.getItem("nila_custom_announcement_v1");
      if (storedAnnounce) setGlobalAnnouncement(storedAnnounce);
    } catch (e) {
      console.error("Failed to load configs from storage", e);
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
        if (storedUser === "00000000000") {
          setShowAdminPanel(true);
        }
        // Register active session in localStorage
        try {
          const storedSessions = localStorage.getItem("nila_active_sessions_v1");
          let sessions: Record<string, number> = {};
          if (storedSessions) {
            sessions = JSON.parse(storedSessions);
          }
          sessions[storedUser] = Date.now();
          localStorage.setItem("nila_active_sessions_v1", JSON.stringify(sessions));
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
        throw new Error(errorText);
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

      // Reset work images to display analysis directly
      setSelectedImage(null);
      setSelectedFileName(null);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || t.serverOffline);
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
            {currentUser === "00000000000" && (
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
                if (un === "00000000000") {
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
              {/* Active API Error state notification */}
              {errorMsg && (
                <div id="api-error-alert" className="bg-rose-500/10 border-2 border-rose-500/40 text-rose-200 text-xs px-4 py-3.5 rounded-2xl flex flex-col gap-3 shadow-xl">
                  <div className="flex items-start gap-2.5 w-full">
                    <AlertCircle className="w-5 h-5 text-rose-450 shrink-0 mt-0.5" />
                    <div className="space-y-1 w-full text-left">
                      <p className="font-extrabold">{language === "bn" ? "অ্যানালাইসিস ত্রুটি" : "Analysis Failed"}</p>
                      <p className="opacity-90">{errorMsg}</p>
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
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3.5 px-4 rounded-2xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition duration-150 active:scale-95 cursor-pointer"
                    >
                      <Search className="w-5 h-5 animate-pulse" />
                      বিশ্লেষণ শুরু করুন
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
