import React from "react";
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  HelpCircle,
  Activity,
  Compass
} from "lucide-react";
import { TradingAnalysis } from "../types";

interface Props {
  analysis: TradingAnalysis;
  language: string;
  imageFileName: string;
  imageDataUrl: string;
}

export default function AnalysisResult({ analysis, language, imageFileName, imageDataUrl }: Props) {
  const isUp = analysis.prediction?.toLowerCase() === "up";
  const isDown = analysis.prediction?.toLowerCase() === "down";

  const [telegram, setTelegram] = React.useState("https://t.me/poketbrokar");
  const [owner1, setOwner1] = React.useState("nila\\ldp.onar");
  const [owner2, setOwner2] = React.useState("korim debolopar");

  React.useEffect(() => {
    const loadCustomVals = () => {
      const storedTelegram = localStorage.getItem("nila_custom_telegram_v1");
      if (storedTelegram) setTelegram(storedTelegram);

      const storedOwner1 = localStorage.getItem("nila_custom_owner1_v1");
      if (storedOwner1) setOwner1(storedOwner1);

      const storedOwner2 = localStorage.getItem("nila_custom_owner2_v1");
      if (storedOwner2) setOwner2(storedOwner2);
    };

    loadCustomVals();

    window.addEventListener("nila_settings_updated", loadCustomVals);
    return () => window.removeEventListener("nila_settings_updated", loadCustomVals);
  }, []);

  // Vibrant compact styling
  let predictionBg = "bg-[#111114] border-slate-800";
  let predictionText = "text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]";
  let predictionLabel = "সতর্ক থাকুন / রেঞ্জ বাউন্ড";
  let PredictionIcon = HelpCircle;

  if (isUp) {
    predictionBg = "bg-[#131d1a]/95 border-emerald-500/40";
    predictionText = "text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]";
    predictionLabel = "UP / কল ট্রেড (বাই)";
    PredictionIcon = ArrowUpCircle;
  } else if (isDown) {
    predictionBg = "bg-[#221518]/95 border-rose-500/40";
    predictionText = "text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]";
    predictionLabel = "DOWN / পুট ট্রেড (সেল)";
    PredictionIcon = ArrowDownCircle;
  }

  // Fallback support and resistance levels from fields if missing in arrays
  const supportLevels = (analysis.supportLevels && analysis.supportLevels.length > 0) 
    ? analysis.supportLevels 
    : [analysis.priceCloseUpEntry || "N/A"];

  const resistanceLevels = (analysis.resistanceLevels && analysis.resistanceLevels.length > 0) 
    ? analysis.resistanceLevels 
    : [analysis.priceCloseDownEntry || "N/A"];

  return (
    <div id="trading-analysis-results" className="space-y-4">
      {/* 1. Next Candle Prediction Header */}
      <div className={`border rounded-2xl p-3.5 ${predictionBg} relative overflow-hidden shadow-sm transition-all duration-300`}>
        <div className="flex items-center gap-3 relative z-10">
          <div className={`p-2 rounded-xl shrink-0 ${isUp ? "bg-emerald-550/10 text-emerald-400" : isDown ? "bg-rose-550/10 text-rose-400" : "bg-yellow-550/10 text-yellow-400"}`}>
            <PredictionIcon className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono font-bold block">
              পরবর্তী ক্যান্ডেল সিদ্ধান্ত (PREDICTION)
            </span>
            <h2 className={`text-base sm:text-lg font-display font-black tracking-tight mt-0.5 ${predictionText}`}>
              • {predictionLabel}
            </h2>
          </div>
        </div>
      </div>

      {/* 2. visual Screenshot Container */}
      <div className="bg-[#111114] border border-slate-800 rounded-2xl p-3">
        <div className="bg-slate-950 rounded-xl overflow-hidden aspect-[16/10] border border-slate-850 relative">
          <img
            src={imageDataUrl}
            alt={imageFileName}
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* 3. Bangla Candle Closing Guidelines Card */}
      <div className="bg-[#111114] border-2 border-indigo-500/20 rounded-2xl p-4.5 space-y-3">
        <h4 className="text-indigo-300 font-display font-bold text-xs sm:text-sm tracking-wide border-b border-white/5 pb-2">
          ★ ক্যান্ডেল ক্লোজিং ট্রেড নির্দেশিকা
        </h4>
        
        {/* Important Time Warning Banner */}
        <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-3 flex items-start gap-2.5 animate-pulse">
          <span className="text-amber-400 text-base leading-none select-none shrink-0">⚠️</span>
          <div className="space-y-0.5">
            <p className="text-amber-300 text-xs sm:text-sm font-black leading-tight">
              {language === "bn" 
                ? "পরবর্তী ক্যান্ডেল ১৫ সেকেন্ডের ভেতরে ট্রেড নিতে হবে!" 
                : "Next candle trade must be taken within 15 seconds!"}
            </p>
            <span className="text-[10px] text-slate-400 font-mono block">
              Execution window: ≤ 15 seconds max
            </span>
          </div>
        </div>
        
        <div className="space-y-3 text-xs sm:text-sm text-slate-200 font-semibold leading-relaxed">
          {supportLevels && supportLevels[0] !== "N/A" && (
            <div className="bg-emerald-950/15 border border-emerald-500/20 rounded-xl p-3">
              <span className="text-emerald-400 font-bold block mb-1">UP (বুলিশ) ট্রেড এর নিয়ম:</span>
              রানিং ক্যান্ডেলটি যদি <strong className="text-emerald-300 font-mono text-sm px-2 py-0.5 bg-slate-950 border border-emerald-500/30 rounded-md select-all">{supportLevels[0]}</strong> এর <strong className="text-emerald-400 underline decoration-emerald-500/30">নিচে ক্লোজ দেয়</strong>, তবে পরবর্তী ক্যান্ডেলে সরাসরি <strong className="text-emerald-300 font-black">UP ট্রেড নিন</strong>।
            </div>
          )}

          {resistanceLevels && resistanceLevels[0] !== "N/A" && (
            <div className="bg-rose-950/15 border border-rose-500/20 rounded-xl p-3">
              <span className="text-rose-400 font-bold block mb-1">DOWN (বেয়ারিশ) ট্রেড এর নিয়ম:</span>
              রানিং ক্যান্ডেলটি যদি <strong className="text-rose-300 font-mono text-sm px-2 py-0.5 bg-slate-950 border border-rose-500/30 rounded-md select-all">{resistanceLevels[0]}</strong> এর <strong className="text-rose-400 underline decoration-rose-500/30">উপরে ক্লোজ দেয়</strong>, তবে পরবর্তী ক্যান্ডেলে সরাসরি <strong className="text-rose-300 font-black">DOWN ট্রেড নিন</strong>।
            </div>
          )}

          {(!supportLevels || supportLevels[0] === "N/A") && (!resistanceLevels || resistanceLevels[0] === "N/A") && (
            <p className="text-slate-400 font-normal italic">
              কোনো ক্যান্ডেলস্টিক ক্লোজিং মার্ক বা লেভেল পাওয়া যায়নি। ক্যান্ডেল ক্লোজিং সময়ের আগে তড়িঘড়ি করে ট্রেড নেওয়া থেকে বিরত থাকুন।
            </p>
          )}
        </div>
      </div>

      {/* 4. Owner Credit Label */}
      <div className="border-t border-slate-800/30 pt-2.5 mt-2 text-center select-none">
        <p className="text-[11px] text-slate-400/90 font-medium mb-1.5 tracking-wide">
          যেকোনো প্রয়োজনে এখানে ট্যাপ করে মেসেজ দিন
        </p>
        <div className="flex items-center justify-between px-1 text-[10.5px] font-mono font-bold tracking-wider">
          <div 
            onClick={() => window.open(telegram, "_blank")}
            className="tg-interactive-glow flex items-center gap-1.5 cursor-pointer transition-colors duration-150 active:scale-95 hover:underline decoration-sky-400/50"
          >
            <svg className="w-3.5 h-3.5 fill-current shrink-0 text-sky-400" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.62 5.8c.15-.1.32-.17.49-.17.18 0 .35.05.49.14.15.1.25.26.28.45.03.18.01.38-.06.56l-2.11 9.55c-.09.4-.33.74-.68.96-.34.22-.76.28-1.15.17l-3-2.12-1.63 1.58c-.12.12-.29.19-.46.19-.13 0-.25-.03-.36-.1-.18-.1-.31-.27-.36-.48l-1.09-3.54-3.12-.98c-.41-.13-.73-.44-.86-.84-.13-.4-.05-.84.22-1.17l12.44-7.56z"/>
            </svg>
            <span>{owner1}</span>
          </div>
          
          <div 
            onClick={() => window.open(telegram, "_blank")}
            className="tg-interactive-glow flex items-center gap-1.5 cursor-pointer transition-colors duration-150 active:scale-95 hover:underline decoration-sky-400/50"
          >
            <svg className="w-3.5 h-3.5 fill-current shrink-0 text-sky-400" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.62 5.8c.15-.1.32-.17.49-.17.18 0 .35.05.49.14.15.1.25.26.28.45.03.18.01.38-.06.56l-2.11 9.55c-.09.4-.33.74-.68.96-.34.22-.76.28-1.15.17l-3-2.12-1.63 1.58c-.12.12-.29.19-.46.19-.13 0-.25-.03-.36-.1-.18-.1-.31-.27-.36-.48l-1.09-3.54-3.12-.98c-.41-.13-.73-.44-.86-.84-.13-.4-.05-.84.22-1.17l12.44-7.56z"/>
            </svg>
            <span>{owner2}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
