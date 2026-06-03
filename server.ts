import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

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
    const { image } = req.body;

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

    // Technical trading detailed prompt
    const promptText = `
      You are an expert professional financial analyst, technical researcher, and chart pattern recognition system.
      Analyze the attached trading chart image meticulously. Follow standard chart reading rules (candlestick structures, support/resistance, trend indicators, relative price volumes, price action levels).

      Your primary objectives are to:
      1. Carefully inspect the recent candles and identify the overall prevailing trend and immediate candlestick patterns.
      2. Provide a concrete prediction of whether the NEXT CANDLE is most likely to go Up (Bullish/Call/Buy), Down (Bearish/Put/Sell), or remains Neutral.
      3. Define the precise, critical price level thresholds (or relative conditions if exact numbers are not clearly readable) which will trigger:
         - An UP trade (Call / Buy trade). Tell the trader EXACTLY at what price zone/closing trigger to take the trade.
         - A DOWN trade (Put / Sell trade). Tell the trader EXACTLY at what price zone/closing trigger to take the trade.
      4. Detect key support levels and resistance levels on the visible axis.
      5. Formulate high-quality reasoning and next-step actions in both English and Bengali (বাংলা) so technical Bengali trading terms are easily understood and explained naturally.
      6. Suggest a comprehensive trade management plan including expected Risk-to-Reward ratio, appropriate Stop Loss (SL), and Take Profit (TP) levels.

      Provide your analysis strictly in valid JSON matching the requested response schema format. Do not prepend markdown formatting inside the json fields. Treat this as an educational and statistical pattern match tool.
    `;

    // Make the Gemini API call safely using gemini-2.5-flash for much faster analysis and fewer rate limits
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
