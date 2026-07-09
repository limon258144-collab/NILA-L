import React, { useRef, useState, useEffect } from "react";
import { UploadCloud, Image as ImageIcon, Sparkles } from "lucide-react";
import { translations, Language } from "../utils/translations";
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
  const [localError, setLocalError] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState("");

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

  const handleTextInputPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (isAnalyzing) return;

    const files = e.clipboardData?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        e.preventDefault();
        processFile(file);
        return;
      }
    }

    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            processFile(file);
            return;
          }
        }
      }
    }

    const pastedText = e.clipboardData?.getData("text") || "";
    if (pastedText.trim()) {
      const trimmed = pastedText.trim();
      if (trimmed.startsWith("data:image/")) {
        e.preventDefault();
        setLocalError(null);
        compressAndResizeImage(trimmed, (compressedData) => {
          onImageSelected(compressedData, "pasted-image.png");
        });
        setPasteText("");
      } else if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        e.preventDefault();
        setLocalError(null);
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            try {
              const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
              compressAndResizeImage(dataUrl, (compressedData) => {
                onImageSelected(compressedData, "pasted-url.jpg");
              });
            } catch (err) {
              onImageSelected(trimmed, "pasted-url.jpg");
            }
          } else {
            onImageSelected(trimmed, "pasted-url.jpg");
          }
        };
        img.onerror = () => {
          onImageSelected(trimmed, "pasted-url.jpg");
        };
        img.src = trimmed;
        setPasteText("");
      }
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPasteText(val);
    const trimmed = val.trim();
    if (trimmed.startsWith("data:image/") || trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      if (trimmed.startsWith("data:image/")) {
        compressAndResizeImage(trimmed, (compressedData) => {
          onImageSelected(compressedData, "pasted-image.png");
        });
        setPasteText("");
      } else if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        onImageSelected(trimmed, "pasted-url.jpg");
        setPasteText("");
      }
    }
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isAnalyzing) return;
      
      const files = e.clipboardData?.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type.startsWith("image/")) {
          e.preventDefault();
          processFile(file);
          return;
        }
      }

      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              e.preventDefault();
              processFile(file);
              break;
            }
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [isAnalyzing, language, onImageSelected]);

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

        <div className="mt-3 flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 px-3.5 py-1.5 rounded-full border border-indigo-500/20 text-[10px] sm:text-xs font-black tracking-wide uppercase shadow-sm group-hover:bg-indigo-500/15 transition-all duration-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>
            {language === "bn" ? "কিবোর্ড থেকে সরাসরি Ctrl+V চেপে ইমেজ পেস্ট করুন" : "Press Ctrl+V to Paste Image directly"}
          </span>
        </div>

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

      {/* Paste Image Box below Drop Zone */}
      <div 
        id="image-paste-container"
        className={`border-2 rounded-3xl p-5 transition-all duration-300 ${
          isProUser
            ? "bg-[#16122d]/40 border-[#a855f7]/30 hover:border-[#a855f7]/55 shadow-[0_0_15px_rgba(168,85,247,0.06)]"
            : "bg-[#111116] border-indigo-500/10 hover:border-indigo-500/30"
        }`}
      >
        <div className="flex items-center gap-2 mb-3 select-none">
          <ImageIcon className="w-4.5 h-4.5 text-indigo-400" />
          <span className="text-white font-black text-xs sm:text-sm">
            {language === "bn" ? "কপি করা ইমেজ সরাসরি পেস্ট করুন" : "Paste Copied Image/URL Directly"}
          </span>
          <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md font-bold ml-auto uppercase tracking-wide">
            Ctrl + V Supported
          </span>
        </div>
        
        <textarea
          id="image-paste-box"
          rows={3}
          value={pasteText}
          onChange={handleTextChange}
          onPaste={handleTextInputPaste}
          disabled={isAnalyzing}
          placeholder={translations[language].pastePlaceholder}
          className="w-full bg-[#0d0d12] text-slate-200 placeholder:text-slate-600 border border-slate-800/80 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 rounded-2xl px-4 py-3.5 text-xs font-medium outline-none resize-none transition duration-150"
        />
        
        <p className="text-[10px] text-slate-500 font-bold select-none block mt-2 text-left leading-relaxed">
          {language === "bn"
            ? "* কম্পিউটার বা ফোন থেকে কোনো চার্ট ছবি বা স্ক্রিনশট কপি (Copy) করে এই টেক্সট বক্সে ক্লিক দিয়ে কিবোর্ড থেকে Ctrl+V প্রেস করুন। অথবা সরাসরি ছবির লিঙ্ক (URL) এখানে পেস্ট করুন।"
            : "* Copy any chart image or screenshot to clipboard, click inside the box above, and press Ctrl+V to import. Direct image URLs or Base64 data are also supported."}
        </p>
      </div>
    </div>
  );
}
