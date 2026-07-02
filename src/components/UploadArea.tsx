import React, { useRef, useState } from "react";
import { UploadCloud, Image as ImageIcon, Sparkles, TrendingUp, Clipboard } from "lucide-react";
import { translations, Language } from "../utils/translations";
import { sampleCharts } from "../utils/samples";
// @ts-ignore
import tradeLensLogo from "../assets/images/tradelens_logo_1782904706226.jpg";

interface Props {
  onImageSelected: (dataUrl: string, fileName: string) => void;
  language: Language;
  isAnalyzing: boolean;
  isProUser?: boolean;
}

export default function UploadArea({ onImageSelected, language, isAnalyzing, isProUser = false }: Props) {
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Client-side image resize and compression helper to reduce base64 footprint (extremely fast)
  const compressAndResizeImage = (dataUrl: string, callback: (compressed: string) => void) => {
    const img = new Image();
    img.onload = () => {
      const maxDimension = 1280;
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Convert to high-performance JPEG format with 0.82 quality
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
        callback(compressedDataUrl);
      } else {
        callback(dataUrl);
      }
    };
    img.onerror = () => {
      callback(dataUrl);
    };
    img.src = dataUrl;
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setLocalError(language === "bn" ? "অনুগ্রহ করে একটি সঠিক ছবি (PNG, JPG, JPEG) আপলোড করুন।" : "Please upload a valid image file (PNG, JPG, JPEG).");
      return;
    }
    setLocalError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === "string") {
        compressAndResizeImage(e.target.result, (compressedData) => {
          onImageSelected(compressedData, file.name);
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerInputClick = () => {
    if (!isAnalyzing) {
      fileInputRef.current?.click();
    }
  };

  const handlePasteInput = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result && typeof event.target.result === "string") {
                compressAndResizeImage(event.target.result, (compressedData) => {
                  onImageSelected(compressedData, "clipboard-pasted-chart.png");
                  setPasteError(null);
                  setPasteText("");
                });
              }
            };
            reader.readAsDataURL(blob);
            e.preventDefault();
            return;
          }
        }
      }
    }
  };

  const handlePasteTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setPasteText(value);
    setPasteError(null);

    const trimmed = value.trim();
    if (trimmed.startsWith("data:image/") && trimmed.includes(";base64,")) {
      compressAndResizeImage(trimmed, (compressedData) => {
        onImageSelected(compressedData, "base64-instant-load.png");
        setPasteText("");
        setPasteError(null);
      });
    }
  };

  const loadPastedContent = () => {
    const trimmed = pasteText.trim();
    if (!trimmed) return;

    if (trimmed.startsWith("data:image/")) {
      compressAndResizeImage(trimmed, (compressedData) => {
        onImageSelected(compressedData, "base64-pasted-chart.png");
        setPasteText("");
        setPasteError(null);
      });
    } else if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      onImageSelected(trimmed, "url-pasted-chart.png");
      setPasteText("");
      setPasteError(null);
    } else {
      setPasteError(t.pasteInvalid);
    }
  };

  return (
    <div id="chart-upload-container" className="space-y-6">
      {/* Dynamic Mobile Optimized Drag Zone */}
      <div
        id="uploader-drop-zone"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerInputClick}
        className={`relative group border-3 border-dashed rounded-3xl p-6 md:p-8 text-center cursor-pointer transition-all duration-500 flex flex-col items-center justify-center min-h-[220px] ${
          isDragActive
            ? "border-emerald-500 bg-emerald-950/30 shadow-[0_0_35px_rgba(16,185,129,0.25)]"
            : isProUser
              ? "bg-[#16122d]/75 border-[#a855f7]/40 hover:border-[#a855f7]/85 hover:bg-[#1f1a42]/80 shadow-[0_0_25px_rgba(168,85,247,0.15)] backdrop-blur-md"
              : "bg-[#111116] border-indigo-500/30 hover:border-indigo-500/65 hover:bg-[#141419]"
        } ${isAnalyzing ? "pointer-events-none opacity-50" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isAnalyzing}
        />

        <div className="mb-4 relative">
          {isProUser && (
            <style>{`
              @keyframes tennisBallBounce {
                0%, 100% {
                  transform: translateY(0) scale(1, 1);
                }
                25% {
                  transform: translateY(-50px) scale(0.9, 1.1); /* Elastic stretch on ascent */
                }
                50% {
                  transform: translateY(0) scale(1.05, 0.95); /* Ground hit */
                }
                54% {
                  transform: translateY(0) scale(1.25, 0.75); /* Tennis squash impact */
                }
                58% {
                  transform: translateY(0) scale(0.85, 1.15); /* Lift off stretch */
                }
                75% {
                  transform: translateY(-18px) scale(0.95, 1.05); /* Small secondary bounce */
                }
                90% {
                  transform: translateY(0) scale(1.02, 0.98); /* Settling down */
                }
              }
              .tennis-ball-bounce {
                animation: tennisBallBounce 1.6s cubic-bezier(0.25, 0.8, 0.25, 1) infinite;
                transform-origin: bottom center;
              }
            `}</style>
          )}
          <div className={`p-1.5 rounded-full overflow-hidden w-28 h-28 flex items-center justify-center border-2 shadow-xl transition-all duration-300 ${
            isProUser
              ? "bg-[#1b1735] ring-8 ring-[#a855f7]/15 border-[#a855f7]/40 group-hover:border-[#a855f7]/90 group-hover:ring-[#a855f7]/25 tennis-ball-bounce"
              : "bg-[#18181e] ring-8 ring-indigo-500/10 border-slate-800 group-hover:border-indigo-500/50"
          }`}>
            <img 
              src={tradeLensLogo} 
              alt="TradeLens Logo" 
              className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-full shadow-lg border transition-colors duration-300 ${
            isProUser
              ? "bg-[#a855f7] border-[#d8b4fe] text-white group-hover:bg-emerald-500 group-hover:border-emerald-400"
              : "bg-indigo-600 border-indigo-400 text-white group-hover:bg-emerald-500 group-hover:border-emerald-400"
          }`}>
            <UploadCloud className="w-4 h-4" />
          </div>
        </div>

        <h3 className="text-white font-display font-black text-base sm:text-lg mb-2">
          {t.uploadPlaceholder}
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mb-1 font-medium">
          {t.uploadHelp}
        </p>

        {localError && (
          <p className="text-xs text-rose-400 max-w-sm mt-3 font-bold bg-rose-950/20 px-3 py-1.5 rounded-xl border border-rose-500/25 animate-bounce">
            ⚠️ {localError}
          </p>
        )}

        {isDragActive && (
          <div className="absolute inset-0 bg-emerald-950/50 rounded-3xl border-3 border-emerald-500 flex items-center justify-center">
            <span className="text-emerald-400 font-extrabold text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 animate-spin" /> এখনই চার্ট ইমেজ ছেড়ে দিন!
            </span>
          </div>
        )}
      </div>

      {/* Touch-Friendly Clipboard / URL Paste Box */}
      <div 
        id="paste-input-card" 
        className={`transition-all duration-500 border-2 rounded-3xl p-5 space-y-4 ${
          isProUser
            ? "bg-[#16122d]/75 border-[#a855f7]/40 shadow-[0_0_20px_rgba(168,85,247,0.12)] backdrop-blur-md"
            : "bg-[#111116] border-slate-800"
        }`}
      >
        <h4 className="text-white font-display font-black text-sm flex items-center gap-2">
          <Clipboard className={`w-5 h-5 ${isProUser ? "text-[#c084fc]" : "text-indigo-400"}`} />
          {t.pasteTitle}
        </h4>
        <div className="space-y-3">
          <textarea
            id="paste-textarea"
            rows={2}
            value={pasteText}
            onChange={handlePasteTextChange}
            onPaste={handlePasteInput}
            placeholder="স্ক্রিনশট কপি করে সরাসরি এখানে Ctrl+V চেপে পেস্ট করুন অথবা ইমেজ লিংক এখানে রাখুন..."
            className={`w-full text-slate-100 placeholder-slate-500 rounded-2xl p-3.5 text-xs font-sans outline-none focus:ring-2 transition-all resize-none font-bold ${
              isProUser
                ? "bg-[#0c0a18] border-[#a855f7]/30 focus:border-[#a855f7]/80 focus:ring-[#a855f7]/20"
                : "bg-[#09090b] border-slate-800 focus:border-indigo-500/80 focus:ring-indigo-500/30"
            }`}
            disabled={isAnalyzing}
          />
          {pasteError && (
            <p className="text-rose-400 text-xs font-semibold leading-tight">
              {pasteError}
            </p>
          )}
          <div className="flex justify-end">
            <button
              id="load-paste-btn"
              onClick={loadPastedContent}
              disabled={isAnalyzing || !pasteText.trim()}
              className={`w-full sm:w-auto disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs px-5 py-3 rounded-2xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                isProUser
                  ? "bg-[#a855f7] hover:bg-[#b876fc] shadow-[#a855f7]/10"
                  : "bg-indigo-600 hover:bg-indigo-550 shadow-indigo-500/10"
              }`}
            >
              <Sparkles className={`w-4 h-4 ${isProUser ? "text-purple-200 animate-spin" : "text-indigo-200"}`} style={isProUser ? { animationDuration: "12s" } : undefined} />
              {t.pasteBtn}
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Demo Candlestick Patterns Picker */}
      <div 
        id="sample-picker-section" 
        className={`transition-all duration-500 border-2 rounded-3xl p-5 ${
          isProUser
            ? "bg-[#16122d]/75 border-[#a855f7]/40 shadow-[0_0_20px_rgba(168,85,247,0.12)] backdrop-blur-md"
            : "bg-[#111116] border-slate-800"
        }`}
      >
        <h4 className="text-white font-display font-black text-sm mb-1 flex items-center gap-2">
          <TrendingUp className={`w-5 h-5 ${isProUser ? "text-emerald-450" : "text-emerald-450"}`} />
          {t.sampleCharts}
        </h4>
        <p className="text-xs text-slate-400 mb-4 font-medium">{t.sampleDesc}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {sampleCharts.map((sample) => (
            <button
              id={`sample-chart-btn-${sample.id}`}
              key={sample.id}
              onClick={() => onImageSelected(sample.dataUrl, `${sample.id}.png`)}
              className={`group text-left rounded-2xl p-3 transition-all duration-200 flex flex-col items-start gap-2 overflow-hidden active:scale-95 border ${
                isProUser
                  ? "bg-[#0c0a18] border-[#a855f7]/20 hover:border-[#a855f7]/70 hover:bg-[#1a1538]"
                  : "bg-slate-950 border-slate-800 hover:border-indigo-500/50 hover:bg-[#141419]"
              }`}
              title={t[sample.titleKey]}
              disabled={isAnalyzing}
            >
              <div className={`w-full rounded-xl overflow-hidden aspect-[16/9] border ${
                isProUser ? "bg-[#080710] border-[#a855f7]/15" : "bg-[#111114] border-slate-850"
              }`}>
                <img
                  src={sample.dataUrl}
                  alt={t[sample.titleKey]}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="w-full">
                <p className={`text-xs font-black truncate transition-colors ${
                  isProUser ? "text-[#e9d5ff] group-hover:text-amber-300" : "text-slate-200 group-hover:text-amber-400"
                }`}>
                  {t[sample.titleKey]}
                </p>
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block">
                  {language === "bn" ? "ডেমো চার্ট প্রস্তুত" : "Demo Chart Ready"}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
