import React, { useRef, useState } from "react";
import { UploadCloud, Image as ImageIcon, Sparkles, TrendingUp, Clipboard } from "lucide-react";
import { translations, Language } from "../utils/translations";
import { sampleCharts } from "../utils/samples";

interface Props {
  onImageSelected: (dataUrl: string, fileName: string) => void;
  language: Language;
  isAnalyzing: boolean;
}

export default function UploadArea({ onImageSelected, language, isAnalyzing }: Props) {
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);

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
      alert("অনুগ্রহ করে একটি সঠিক ছবি (PNG, JPG, JPEG) আপলোড করুন।");
      return;
    }
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
        className={`relative group bg-[#111116] border-3 border-dashed rounded-3xl p-6 md:p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[220px] ${
          isDragActive
            ? "border-emerald-500 bg-emerald-950/20 shadow-2xl shadow-emerald-500/20"
            : "border-indigo-500/30 hover:border-indigo-500/65 hover:bg-[#141419]"
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

        <div className="bg-[#18181e] p-4 rounded-full text-[#c084fc] group-hover:text-emerald-400 group-hover:bg-[#1f1e28] transition-all duration-300 mb-4 ring-8 ring-indigo-500/10">
          <UploadCloud className="w-10 h-10 group-hover:scale-110 transition-transform duration-300" />
        </div>

        <h3 className="text-white font-display font-black text-base sm:text-lg mb-2">
          {t.uploadPlaceholder}
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mb-1 font-medium">
          {t.uploadHelp}
        </p>

        {isDragActive && (
          <div className="absolute inset-0 bg-emerald-950/50 rounded-3xl border-3 border-emerald-500 flex items-center justify-center">
            <span className="text-emerald-400 font-extrabold text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 animate-spin" /> এখনই চার্ট ইমেজ ছেড়ে দিন!
            </span>
          </div>
        )}
      </div>

      {/* Touch-Friendly Clipboard / URL Paste Box */}
      <div id="paste-input-card" className="bg-[#111116] border-2 border-slate-800 rounded-3xl p-5 space-y-4">
        <h4 className="text-white font-display font-black text-sm flex items-center gap-2">
          <Clipboard className="w-5 h-5 text-indigo-400" />
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
            className="w-full bg-[#09090b] text-slate-100 placeholder-slate-500 border border-slate-800 focus:border-indigo-500/80 rounded-2xl p-3.5 text-xs font-sans outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none font-bold"
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
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-550 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs px-5 py-3 rounded-2xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/10 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              {t.pasteBtn}
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Demo Candlestick Patterns Picker */}
      <div id="sample-picker-section" className="bg-[#111116] border-2 border-slate-800 rounded-3xl p-5">
        <h4 className="text-white font-display font-black text-sm mb-1 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          {t.sampleCharts}
        </h4>
        <p className="text-xs text-slate-400 mb-4 font-medium">{t.sampleDesc}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {sampleCharts.map((sample) => (
            <button
              id={`sample-chart-btn-${sample.id}`}
              key={sample.id}
              onClick={() => onImageSelected(sample.dataUrl, `${sample.id}.png`)}
              className="group text-left bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-3 hover:bg-[#141419] transition-all duration-200 flex flex-col items-start gap-2 overflow-hidden active:scale-95"
              title={t[sample.titleKey]}
              disabled={isAnalyzing}
            >
              <div className="w-full bg-[#111114] rounded-xl overflow-hidden aspect-[16/9] border border-slate-850">
                <img
                  src={sample.dataUrl}
                  alt={t[sample.titleKey]}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="w-full">
                <p className="text-xs font-black text-slate-200 truncate group-hover:text-amber-400 transition-colors">
                  {t[sample.titleKey]}
                </p>
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">ডেমো চার্ট প্রস্তুত</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
