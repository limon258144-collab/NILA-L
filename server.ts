import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config({ override: true });

const app = express();
const PORT = 3000;

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

    // Technical trading detailed prompt with very strict instructions to prevent trading losses
    let promptText = `
      You are an expert professional financial analyst, technical researcher, and chart pattern recognition system.
      Analyze the attached trading chart image meticulously. Follow standard chart reading rules (candlestick structures, support/resistance, trend indicators, relative price volumes, price action levels).

      CRITICAL CAPITAL PROTECTION DIRECTIVE:
      Our user has experienced consecutive losses. You MUST apply extreme safety parameters:
      - ONLY predict "Up" or "Down" if there is an exceptionally clean, high-precision candlestick setup (e.g., clear rejection at key historical support/resistance, verified double bottom/top, strong breakout with volume, or clear EMA bounce) with extreme certainty (95%+ target accuracy).
      - If you predict "Up", confidence MUST be between 98 to 100. Write "🔥 100% SURE SHOT" clearly in the Bengali reasoning, and formulate recommendations explicitly with "১০০% নিশ্চিত সিওর শট সিগন্যাল".
      - If you predict "Down", confidence MUST be between 98 to 100. Write "🔥 100% SURE SHOT" clearly in the Bengali reasoning, and formulate recommendations explicitly with "১০০% নিশ্চিত সিওর শট সিগন্যাল".
      - If the market exhibits ANY indecisiveness, tight sideways consolidation, high candle wicks, confusing patterns, low volume, or choppy behavior, you MUST strictly set the prediction to "Neutral".
      - For "Neutral" predictions, set confidence below 50. In the Bengali and English reasoning and recommendations, state very clearly "NO ENTRY (কোনো এন্ট্রি নিবেন না)" and warn that the market is too risky/unstable right now, and to preserve money. Set supportLevels and resistanceLevels to ["N/A"] so the user avoids triggering trades.
    `;

    if (precision === "sureshot") {
      promptText += `
      
      STRICT MAXIMUM PROTECTION ENFORCEMENT:
      The user is operating in "🔥 100% SURE SHOTS ONLY" mode.
      - Unless this chart displays a pristine, textbook-perfect, high-probability pattern bounce or breakout with absolute confirmation, you MUST output "Neutral".
      - Do NOT make any predictions of "Up" or "Down" for flat ranges, small candle sizes, weak volumes, mixed indicators, or any uncertain trend direction.
      - Better to give "Neutral" than to risk a losing trade. 90% of tricky setups should be returned as "Neutral" in this mode to preserve capital.
      `;
    }

    promptText += `

      Objectives:
      1. Carefully inspect recent candles and identify overall trend.
      2. Provide a safe prediction of whether the NEXT CANDLE is "Up", "Down", or "Neutral" based on above strict safety rules.
      3. Define trigger levels or relative zones for "Up" or "Down" inputs. If Neutral, set to "N/A".
      4. Detect support and resistance levels. If Neutral, set to ["N/A"].
      5. Translate everything beautifully to Bengali (বাংলা) so technical Bengali traders can understand easily. Explain why it is a SURE SHOT or why it is a NO ENTRY.
      6. Provide SL and TP recommendation. If Neutral, set to "N/A".

      Provide your analysis strictly in valid JSON matching the requested response schema format. Do not prepend markdown formatting inside the json fields.
    `;

    // Progressive model fallback list to ensure robustness against high demand / free plan quotas
    const candidateModels = ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"];
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
                  description: "Predicted direction of the next candle: 'Up' (Bullish/Call), 'Down' (Bearish/Put), or 'Neutral'."
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
