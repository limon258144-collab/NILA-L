import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
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
}

function readDb(): DbState {
  try {
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, "utf-8");
      return JSON.parse(content);
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

    // 1. Merge registeredUsers
    if (payload.registeredUsers) {
      db.registeredUsers = { ...db.registeredUsers, ...payload.registeredUsers };
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
      db.submittedPayments = Array.from(paymentMap.values());
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

    // Parse data URL to get mimetype and raw base64 data
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Invalid image format. Expected helper Base64 Data URL." });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    const ai = getGenAI();

    // Technical trading detailed prompt with very strict instructions to prevent trading losses and validate if it is a trading chart
    let promptText = `
      CRITICAL VALIDATION STEP:
      First, inspect if the uploaded image is indeed a valid financial trading chart, candlestick chart, market asset graph, or trading platform screenshot (e.g., MetaTrader, IQ Option, TradingView, Pocket Option, Binance, line/bar/candle chart, etc.).
      If the image is NOT a trading chart (for example, if it is a photo of a person, a selfie, a household object, random text, animals, scenery, documents, memes, or anything other than a financial market graph/chart), you MUST strictly set:
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
    `;

    if (precision === "sureshot") {
      promptText += `
        You are an expert professional financial analyst, technical researcher, and chart pattern recognition system.
        Analyze the attached trading chart image meticulously. Follow standard chart reading rules (candlestick structures, support/resistance, trend indicators, relative price volumes, price action levels).

        CRITICAL CAPITAL PROTECTION & SURE-SHOT DIRECTIVE (৭০%+ নিশ্চিত সিগন্যাল):
        - ONLY predict "Up" or "Down" if there is at least a 70% or higher probability of success (৭০%+ শিউর শট সম্ভাবনা).
        - If you decide to predict "Up" or "Down", your confidence level MUST be between 70% to 100%. In both 'reasoningBangla' and 'recommendationBangla', you MUST write explicitly: "🔥 এই সিগন্যালে ৭০% এর বেশি শিউর শট সম্ভাবনা রয়েছে" (This signal has an 70%+ sure shot probability).
        - If you predict "Up", confidence MUST be between 70 to 100. Formulate recommendations explicitly with "৭০%+ নিশ্চিত শিউর শট সিগন্যাল".
        - If you predict "Down", confidence MUST be between 70 to 100. Formulate recommendations explicitly with "৭০%+ নিশ্চিত শিউর শট সিগন্যাল".
        - If the market has any high-risk setup, ranges, choppy patterns, or anything that is less than 70% sure, you MUST strictly set the prediction to "Neutral".
        - For "Neutral" predictions, set confidence below 50. In the Bengali and English reasoning and recommendations, state very clearly "NO ENTRY (কোনো এন্ট্রি নিবেন না)" and warn that the market is too risky/unstable right now, and to preserve money. Set supportLevels and resistanceLevels to ["N/A"] so the user avoids triggering trades.
        
        STRICT MAXIMUM PROTECTION ENFORCEMENT:
        The user is operating in "🔥 100% SURE SHOTS ONLY" mode.
        - Unless this chart displays a pristine, textbook-perfect, high-probability pattern bounce or breakout with absolute conviction, you MUST output "Neutral".
        - Do NOT make any predictions of "Up" or "Down" for flat ranges, small candle sizes, weak volumes, mixed indicators, or any uncertain trend direction.
        - Better to give "Neutral" than to risk a losing trade. 90% of tricky setups should be returned as "Neutral" in this mode to preserve capital.
      `;
    } else {
      promptText += `
        You are an expert professional financial analyst, technical researcher, and chart pattern recognition system.
        Analyze the attached trading chart image meticulously. Follow standard chart reading rules (candlestick structures, support/resistance, trend indicators, relative price volumes, price action levels).

        STANDARD TRADING MODE DIRECTIVE (বেশি ট্রেড এন্ট্রি এবং সিগন্যাল):
        - The user is in "STANDARD" mode to get active Buy/Sell signals and frequent entries (বেশি এন্ট্রি সিগন্যাল).
        - Therefore, do NOT be overly conservative or strict. Be active, predictive, and supportive!
        - Carefully evaluate the overall trend, support/resistance zones, EMA indicators, and recent price action. Whenever there is a general bias, make a clear decision to predict either "Up" (Bullish/Call) or "Down" (Bearish/Put).
        - Avoid predicting "Neutral" unless the chart is completely flat, unreadable, or shows absolutely zero movement.
        - If you predict "Up" or "Down", set your confidence representing the setup strength (typically between 55% to 90%).
        - In the Bengali 'reasoningBangla' and 'recommendationBangla', formulate actionable recommendations on how the user can enter the trade. Explain the trend simply so they can understand and trade.
      `;
    }

    promptText += `

      Objectives:
      1. Carefully inspect recent candles and identify overall trend.
      2. Provide a prediction of whether the NEXT CANDLE is "Up", "Down", or "Neutral" based on above safety rules. If the image is not a trading chart, return "NOT_A_CHART".
      3. Define trigger levels or relative zones for "Up" or "Down" inputs. If Neutral or NOT_A_CHART, set to "N/A".
      4. Detect support and resistance levels. If Neutral or NOT_A_CHART, set to ["N/A"].
      5. Translate everything beautifully to Bengali (বাংলা) so technical Bengali traders can understand easily. Explain why it is a trade setup or why it is a NO ENTRY.
      6. Provide SL and TP recommendation. If Neutral or NOT_A_CHART, set to "N/A".

      Provide your analysis strictly in valid JSON matching the requested response schema format. Do not prepend markdown formatting inside the json fields.
    `;

    // Progressive model fallback list to ensure robustness against high demand / free plan quotas
    const candidateModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"];
    let response = null;
    let lastModelError = null;

    for (const modelName of candidateModels) {
      try {
        console.log(`[Server] Attempting technical analysis using model: ${modelName}`);
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
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                prediction: {
                  type: Type.STRING,
                  description: "Predicted direction of the next candle: 'Up' (Bullish/Call), 'Down' (Bearish/Put), 'Neutral', or 'NOT_A_CHART' (if the uploaded image is not a trading chart)."
                },
                priceCloseUpEntry: {
                  type: Type.STRING,
                  description: "At which closing price or breakout condition should we take an UP trade? Be highly specific."
                },
                priceCloseDownEntry: {
                  type: Type.STRING,
                  description: "At which closing price or breakdown condition should we take a DOWN trade? Be highly specific."
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
                  description: "Suggested Risk-to-Reward ratio (e.g. '1:2', '1:1.5')."
                },
                suggestedStopLoss: {
                  type: Type.STRING,
                  description: "Stop Loss level suggesting where to exit if trade goes wrong."
                },
                suggestedTakeProfit: {
                  type: Type.STRING,
                  description: "Take Profit level suggesting where to secure gains."
                }
              },
              required: [
                "prediction", "priceCloseUpEntry", "priceCloseDownEntry", "confidence",
                "supportLevels", "resistanceLevels", "patternsIdentified", "reasoning",
                "reasoningBangla", "recommendation", "recommendationBangla", "riskRewardRatio",
                "suggestedStopLoss", "suggestedTakeProfit"
              ]
            }
          }
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
