import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config({ override: true });

const app = express();
const PORT = 3000;

const DB_PATH = path.join(process.cwd(), "db_state.json");

interface DbState {
  registeredUsers: Record<string, string>;
  activeSessions: Record<string, number>;
  proUsers: Array<{ username: string; expiresAt: number; verifiedAt: number }>;
  submittedPayments: Array<{
    id: string;
    username: string;
    senderNumber: string;
    transactionId: string;
    amount: number;
    network: string;
    status: "pending" | "approved" | "rejected";
    timestamp: number;
  }>;
  supportChats: Record<string, any>;
  analysisLimits: Record<string, any>;
  configs: Record<string, string>;
  deletedPayments?: string[];
  deletedUsers?: string[];
  registrationTimes?: Record<string, number>;
}

function readDb(): DbState {
  try {
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, "utf-8");
      const db = JSON.parse(content) as DbState;
      if (db) {
        if (!db.deletedPayments) db.deletedPayments = [];
        if (!db.deletedUsers) db.deletedUsers = [];
        if (!db.registrationTimes) db.registrationTimes = {};
        if (Array.isArray(db.submittedPayments)) {
          db.submittedPayments = db.submittedPayments.filter((p: any) => {
            return p && p.id && p.id.length >= 8;
          });
        }
      }
      return db;
    }
  } catch (err) {
    console.error("Error reading db_state.json:", err);
  }
  return {
    registeredUsers: {},
    activeSessions: {},
    proUsers: [],
    submittedPayments: [],
    supportChats: {},
    analysisLimits: {},
    configs: {},
    deletedPayments: [],
    deletedUsers: [],
    registrationTimes: {},
  };
}

function writeDb(state: DbState) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing db_state.json:", err);
  }
}

// Set up JSON parsing with a higher limit for high-res images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy initializer for Google GenAI client to prevent crashing on startup when key is missing
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is missing. Please set your GEMINI_API_KEY in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API Health check endpoint
app.get("/api/health", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({ status: "ok", geminiKeyConfigured: hasKey });
});

// Real-Time Database Sync Endpoint
app.post("/api/db/sync", (req, res) => {
  try {
    const payload = req.body || {};
    const db = readDb();

    // 0. Merge and keep deletion lists
    const incomingDeletedPayments = payload.deletedPayments && Array.isArray(payload.deletedPayments) ? payload.deletedPayments : [];
    const incomingDeletedUsers = payload.deletedUsers && Array.isArray(payload.deletedUsers) ? payload.deletedUsers : [];

    const existingDeletedPayments = db.deletedPayments || [];
    const existingDeletedUsers = db.deletedUsers || [];

    const mergedDeletedPayments = Array.from(new Set([...existingDeletedPayments, ...incomingDeletedPayments]));
    const mergedDeletedUsers = Array.from(new Set([...existingDeletedUsers, ...incomingDeletedUsers]));

    db.deletedPayments = mergedDeletedPayments;
    db.deletedUsers = mergedDeletedUsers;

    // 1. Merge registeredUsers
    if (payload.registeredUsers) {
      db.registeredUsers = { ...db.registeredUsers, ...payload.registeredUsers };
      // Remove newly registered users from deletedUsers
      for (const un of Object.keys(payload.registeredUsers)) {
        db.deletedUsers = (db.deletedUsers || []).filter(u => u.toLowerCase() !== un.toLowerCase());
      }
    }
    const activeDeletedUsers = (db.deletedUsers || []);
    for (const un of activeDeletedUsers) {
      delete db.registeredUsers[un];
    }

    // 2. Merge activeSessions
    if (payload.activeSessions) {
      for (const [username, timestamp] of Object.entries(payload.activeSessions)) {
        const existing = db.activeSessions[username];
        if (existing === undefined || (timestamp as number) > existing) {
          db.activeSessions[username] = timestamp as number;
        }
      }
    }
    for (const un of mergedDeletedUsers) {
      delete db.activeSessions[un];
    }

    // 3. Merge proUsers
    if (payload.proUsers && Array.isArray(payload.proUsers)) {
      const proMap = new Map<string, any>();
      for (const p of db.proUsers || []) {
        if (p && p.username) {
          proMap.set(p.username.toLowerCase(), p);
        }
      }
      for (const p of payload.proUsers) {
        if (p && p.username) {
          const key = p.username.toLowerCase();
          const existing = proMap.get(key);
          if (!existing || p.expiresAt > existing.expiresAt || p.verifiedAt > existing.verifiedAt) {
            proMap.set(key, p);
          }
        }
      }
      for (const un of mergedDeletedUsers) {
        proMap.delete(un.toLowerCase());
      }
      db.proUsers = Array.from(proMap.values());
    }

    // 4. Merge submittedPayments
    if (payload.submittedPayments && Array.isArray(payload.submittedPayments)) {
      const paymentMap = new Map<string, any>();
      for (const p of db.submittedPayments || []) {
        if (p && p.id) {
          paymentMap.set(p.id, p);
        }
      }
      for (const p of payload.submittedPayments) {
        if (p && p.id) {
          const existing = paymentMap.get(p.id);
          if (!existing) {
            paymentMap.set(p.id, p);
          } else {
            if (existing.status === "pending" && p.status !== "pending") {
              paymentMap.set(p.id, p);
            } else if (p.status === "pending" && existing.status !== "pending") {
              // keep existing
            } else {
              if (p.timestamp > existing.timestamp) {
                paymentMap.set(p.id, p);
              }
            }
          }
        }
      }
      for (const pId of mergedDeletedPayments) {
        paymentMap.delete(pId);
      }
      db.submittedPayments = Array.from(paymentMap.values()).filter((p: any) => {
        return p && p.id && p.id.length >= 8 && !activeDeletedUsers.includes(p.username);
      });
    }

    // 5. Merge supportChats
    if (payload.supportChats) {
      for (const [user, chat] of Object.entries(payload.supportChats)) {
        const existingChat = db.supportChats[user] || { messages: [], unreadCountByUser: 0, unreadCountByAdmin: 0, lastUpdated: 0 };
        const clientChat = chat as any;

        const msgMap = new Map<string, any>();
        for (const m of existingChat.messages || []) {
          if (m && m.id) msgMap.set(m.id, m);
        }
        for (const m of clientChat.messages || []) {
          if (m && m.id) msgMap.set(m.id, m);
        }

        const mergedMessages = Array.from(msgMap.values()).sort((a, b) => a.timestamp - b.timestamp);
        const lastUpdated = Math.max(existingChat.lastUpdated || 0, clientChat.lastUpdated || 0);
        const unreadCountByUser = clientChat.lastUpdated > (existingChat.lastUpdated || 0)
          ? clientChat.unreadCountByUser
          : existingChat.unreadCountByUser;
        const unreadCountByAdmin = clientChat.lastUpdated > (existingChat.lastUpdated || 0)
          ? clientChat.unreadCountByAdmin
          : existingChat.unreadCountByAdmin;

        db.supportChats[user] = {
          messages: mergedMessages,
          unreadCountByUser,
          unreadCountByAdmin,
          lastUpdated,
        };
      }
    }

    // 6. Merge analysisLimits
    if (payload.analysisLimits) {
      db.analysisLimits = { ...db.analysisLimits, ...payload.analysisLimits };
    }

    // 7. Merge configs
    if (payload.configs) {
      db.configs = { ...db.configs, ...payload.configs };
    }

    // 8. Merge registrationTimes
    if (payload.registrationTimes) {
      db.registrationTimes = { ...db.registrationTimes, ...payload.registrationTimes };
    }

    writeDb(db);
    res.json({ status: "ok", state: db });
  } catch (err: any) {
    console.error("[Sync API Error]:", err);
    res.status(500).json({ error: err.message });
  }
});

// Primary Endpoint: Trading Chart pattern analyzer
app.post("/api/analyze", async (req, res): Promise<any> => {
  try {
    const { image, precision } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Image data is required" });
    }

    let mimeType = "";
    let base64Data = "";

    if (image.startsWith("http://") || image.startsWith("https://")) {
      try {
        const fetchRes = await fetch(image);
        if (!fetchRes.ok) {
          return res.status(400).json({ error: `Failed to fetch image from URL: ${fetchRes.statusText}` });
        }
        const arrayBuffer = await fetchRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        base64Data = buffer.toString("base64");
        
        const contentType = fetchRes.headers.get("content-type");
        mimeType = contentType && contentType.startsWith("image/") ? contentType : "image/jpeg";
      } catch (err: any) {
        return res.status(400).json({ error: `Failed to load image from URL: ${err.message}` });
      }
    } else {
      // Parse data URL to get mimetype and raw base64 data
      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: "Invalid image format. Expected helper Base64 Data URL." });
      }
      mimeType = matches[1];
      base64Data = matches[2];
    }

    const ai = getGenAI();

    // Technical trading detailed prompt with very strict instructions to prevent trading losses and validate if it is a trading chart
    let promptText = `
      CRITICAL VALIDATION STEP:
      First, inspect if the uploaded image is indeed a valid financial trading chart, candlestick chart, market asset graph, or trading platform screenshot (e.g., MetaTrader, IQ Option, TradingView, Pocket Option, Binance, line/bar/candle chart, etc.).
      
      STRICT ANTI-SPOOF / ANTI-SELFIE CONSTRAINTS:
      - If the image contains a photo of a person, a human face, a selfie, a video player with a person in it, animals, household objects, general documents, memes, or scenery, it is NOT a trading chart.
      - If the image is a screenshot of this analysis app itself (containing text like 'PRO FEUCHER ACTIVE KARO', 'SURE SHOT', 'PREDICTION', 'UP / কল ট্রেড', 'DOWN / পুট ট্রেড', 'ক্যান্ডেল ক্লোজিং ট্রেড নির্দেশিকা', or 'Nila' logos), it is NOT a valid trading chart.
      - A valid trading chart MUST have visible candlestick bars (red and green blocks with wicks) or an active financial line/bar graph taking up the main/majority area of the screen.
      
      If the image is NOT a trading chart, you MUST strictly set:
      - 'prediction' to "NOT_A_CHART"
      - 'confidence' to 0
      - 'supportLevels' to ["N/A"]
      - 'resistanceLevels' to ["N/A"]
      - 'patternsIdentified' to ["Invalid Image / Not a Chart"]
      - 'reasoning' to "The uploaded image is not a recognized trading chart or candlestick graph. Please upload a valid trading chart screenshot."
      - 'reasoningBangla' to "আপলোডকৃত ছবিটি কোনো ট্রেডিং চার্ট বা ক্যান্ডেলস্টিক গ্রাফ নয়। অনুগ্রহ করে আপনার পছন্দের ট্রেডিং প্ল্যাটফর্মের সঠিক চার্টের স্ক্রিনশট আপলোড করুন।"
      - 'recommendation' to "NO ENTRY (NOT A TRADING CHART)"
      - 'recommendationBangla' to "কোনো এন্ট্রি নেই (ট্রেডিং চার্ট নয়)। সঠিক ফাইন্যান্সিয়াল চার্ট আপলোড করা হলে এখানে সিগন্যাল সিদ্ধান্ত প্রদর্শিত হবে।"
      - 'riskRewardRatio' to "N/A"
      - 'suggestedStopLoss' to "N/A"
      - 'suggestedTakeProfit' to "N/A"

      Only if the image is a valid trading chart, proceed with the following detailed technical analysis instructions.

      STRICT DIRECTION ACCURACY CONSTRAINT (আপ এবং ডাউন নির্দেশের সতর্কতা):
      - DO NOT confuse or invert the prediction directions.
      - 'Up' means a bullish prediction. Buy/Call signal. Price is expected to go UP. Green candlestick confirmation, support zone bounce, or bullish breakout.
      - 'Down' means a bearish prediction. Sell/Put signal. Price is expected to go DOWN. Red candlestick confirmation, resistance zone rejection, or bearish breakdown.
      - Carefully verify the trend on the right side of the chart (latest candles). If the latest price action is breaking resistance upwards, the prediction is 'Up'. If the latest price action is breaking support downwards, the prediction is 'Down'.
      - Check that all prices align with the prediction direction:
        * For 'Up' predictions, 'priceCloseUpEntry' must be higher than current price, 'suggestedTakeProfit' must be higher than entry, and 'suggestedStopLoss' must be lower than entry.
        * For 'Down' predictions, 'priceCloseDownEntry' must be lower than current price, 'suggestedTakeProfit' must be lower than entry, and 'suggestedStopLoss' must be higher than entry.
    `;

    // ULTRA-PRECISE TECHNICAL ANALYSIS PROMPT WITH STRICT 70% LOSS PROTECTION DIRECTIVE
    promptText += `
      You are an elite, world-class institutional financial analyst, price-action specialist, and algorithmic candlestick pattern recognition engine.
      Analyze the attached trading chart image with extreme precision and mathematical rigor (অনেক নিখুঁতভাবে মার্কেট অ্যানালাইসিস করুন).

      CRITICAL 70% LOSS-PROTECTION RULE (৭০% এর নিচে হলে লস এড়াতে NO TRADE):
      - User safety and capital preservation is the TOP priority.
      - If you judge that the probability of winning the next candle is LESS than 70% (< 70% confidence), OR if the market shows choppiness, uncertainty, wick rejection conflicts, lack of momentum, Doji consolidation, or risk of loss:
        * You MUST set 'prediction' to "Neutral".
        * You MUST set 'confidence' to a number below 70 (e.g. 35 to 65).
        * In 'reasoningBangla' and 'recommendationBangla', you MUST explicitly write:
          "⚠️ NO TRADE - MARKET IS RISKY (মার্কেট বর্তমানে চরম ঝুঁকিপূর্ণ ও অনির্দিষ্ট)। ক্যান্ডেল সফল হওয়ার সম্ভাবনা ৭০% এর নিচে এবং ট্রেড নিলে লস হওয়ার তীব্র ঝুঁকি রয়েছে। তাই নিজের ব্যালেন্স সুরক্ষিত রাখতে এই মুহূর্তে কোনো ট্রেড নিবেন না।"
        * In 'recommendation', write: "NO TRADE - MARKET IS RISKY (High risk of loss, setup confidence is below 70%)."
        * Set 'priceCloseUpEntry' and 'priceCloseDownEntry' to "N/A".

      DECISIVE 70%+ SURE-SHOT RULE (৭০% বা তার বেশি সম্ভাবনা নিশ্চিত হলে তবেই ট্রেড):
      - ONLY if the technical confluence (Support/Resistance bounce, strong momentum breakout, engulfing candle, rejection wick, EMA trend alignment) provides a 70% to 100% winning probability (≥ 70% confidence):
        * If bullish confluence: Predict "Up" (Call / Buy), set confidence between 70 and 99. In 'reasoningBangla' and 'recommendationBangla', explain the exact candlestick reason and write: "🔥 এই সিগন্যালে ৭০%+ শিউর শট নিশ্চয়তা রয়েছে।"
        * If bearish confluence: Predict "Down" (Put / Sell), set confidence between 70 and 99. In 'reasoningBangla' and 'recommendationBangla', explain the exact candlestick reason and write: "🔥 এই সিগন্যালে ৭০%+ শিউর শট নিশ্চয়তা রয়েছে।"
        * Provide specific breakout / breakdown price levels.

      Objectives:
      1. Meticulously inspect the latest 5-10 candlestick micro-structures, wick lengths, and key levels on the right.
      2. Strictly apply the 70% threshold: <70% -> "Neutral" (NO TRADE - MARKET IS RISKY), >=70% -> "Up" or "Down".
      3. If image is not a trading chart, return "NOT_A_CHART".
      4. Translate technical findings into fluent, crystal-clear Bengali (বাংলা) so traders clearly know if they should take a 70%+ sure shot trade or stay away because market is risky.

      Provide your analysis strictly in valid JSON matching the requested response schema format. Do not prepend markdown formatting inside the json fields.
    `;

    // Progressive model fallback list prioritizing reliable high-performance multimodal models
    const candidateModels = [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-3.7-flash",
      "gemini-2.0-flash",
      "gemini-flash-latest",
      "gemini-1.5-flash"
    ];
    let response = null;
    let lastModelError = null;

    for (const modelName of candidateModels) {
      try {
        console.log(`[Server] Attempting technical analysis using model: ${modelName}`);
        
        // Configure thinking level HIGH for complex deep reasoning models
        const modelConfig: any = {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              prediction: {
                type: Type.STRING,
                description: "Predicted direction of the next candle: 'Up' (Bullish/Call), 'Down' (Bearish/Put), 'Neutral' (if <70% confidence / risky market), or 'NOT_A_CHART'."
              },
              priceCloseUpEntry: {
                type: Type.STRING,
                description: "At which closing price or breakout condition should we take an UP trade? Or 'N/A'."
              },
              priceCloseDownEntry: {
                type: Type.STRING,
                description: "At which closing price or breakdown condition should we take a DOWN trade? Or 'N/A'."
              },
              confidence: {
                type: Type.INTEGER,
                description: "Confidence level of this prediction (percentage 0 to 100)."
              },
              supportLevels: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Key support levels identified from the chart."
              },
              resistanceLevels: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Key resistance levels identified from the chart."
              },
              patternsIdentified: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Specific chart pattern, indicator setups, or candlestick formations identified."
              },
              reasoning: {
                type: Type.STRING,
                description: "Detailed professional technical analysis reasoning in English."
              },
              reasoningBangla: {
                type: Type.STRING,
                description: "Complete technical analysis reasoning in highly-clear Bengali language (বাংলা) explaining patterns and price action."
              },
              recommendation: {
                type: Type.STRING,
                description: "Trade execution guidance and warnings in English."
              },
              recommendationBangla: {
                type: Type.STRING,
                description: "Trade execution guidance and warnings in Bengali language (বাংলা)."
              },
              riskRewardRatio: {
                type: Type.STRING,
                description: "Suggested Risk-to-Reward ratio (e.g. '1:2', '1:1.5') or 'N/A'."
              },
              suggestedStopLoss: {
                type: Type.STRING,
                description: "Stop Loss level suggesting where to exit if trade goes wrong, or 'N/A'."
              },
              suggestedTakeProfit: {
                type: Type.STRING,
                description: "Take Profit level suggesting where to secure gains, or 'N/A'."
              }
            },
            required: [
              "prediction", "priceCloseUpEntry", "priceCloseDownEntry", "confidence",
              "supportLevels", "resistanceLevels", "patternsIdentified", "reasoning",
              "reasoningBangla", "recommendation", "recommendationBangla", "riskRewardRatio",
              "suggestedStopLoss", "suggestedTakeProfit"
            ]
          }
        };

        if (modelName === "gemini-3.7-flash") {
          modelConfig.thinkingConfig = {
            thinkingLevel: ThinkingLevel.HIGH,
          };
        }

        response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: promptText,
            },
          ],
          config: modelConfig,
        });

        if (response && response.text) {
          console.log(`[Server] Technical analysis successfully completed using model: ${modelName}`);
          break;
        }
      } catch (err) {
        console.warn(`[Server] Model ${modelName} failed or encountered rate limits. Trying next model. Error details:`, err);
        lastModelError = err;
      }
    }

    if (!response || !response.text) {
      throw lastModelError || new Error("All candidate models failed or returned empty response content.");
    }

    const analysisText = response.text;
    if (!analysisText) {
      throw new Error("Unable to extract response content from Gemini.");
    }

    const tradingAnalysis = JSON.parse(analysisText.trim());
    return res.json(tradingAnalysis);

  } catch (error: any) {
    console.error("Analysis API Error:", error);
    let errorMessage = error.message || "An unexpected error occurred during analysis.";
    
    // Check if error is due to rate limits or quotas
    const lowerMessage = errorMessage.toLowerCase();
    if (
      lowerMessage.includes("429") || 
      lowerMessage.includes("quota") || 
      lowerMessage.includes("limit") || 
      lowerMessage.includes("exhausted") ||
      lowerMessage.includes("resource_exhausted")
    ) {
      errorMessage = "Gemini API Quota or Rate Limit exceeded. Please try again in 30 seconds.";
    }

    return res.status(500).json({
      error: errorMessage,
    });
  }
});

// Setup Vite Dev Server / Static files middleware
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error("Error setting up server:", err);
});
