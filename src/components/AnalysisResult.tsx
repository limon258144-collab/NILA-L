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
    </div>
  );
}
