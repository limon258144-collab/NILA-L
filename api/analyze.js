import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ override: true });

// Lazy initializer for Google GenAI client to prevent crashing on startup when key is missing
let aiClient = null;
function getGenAI() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is missing. Please set your GEMINI_API_KEY in Vercel environment variables.");
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

export default async function handler(req, res) {
  // Support CORS if needed
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

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

    // Progressive model fallback list to ensure robustness against high demand / free plan quotas
    const candidateModels = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash"];
    let response = null;
    let lastModelError = null;

    for (const modelName of candidateModels) {
      try {
        console.log(`Attempting technical analysis using model: ${modelName}`);
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
              type: "OBJECT",
              properties: {
                prediction: {
                  type: "STRING",
                  description: "Predicted direction of the next candle: 'Up' (Bullish/Call), 'Down' (Bearish/Put), or 'Neutral'."
                },
                priceCloseUpEntry: {
                  type: "STRING",
                  description: "At which closing price or breakout condition should we take an UP trade? Be highly specific."
                },
                priceCloseDownEntry: {
                  type: "STRING",
                  description: "At which closing price or breakdown condition should we take a DOWN trade? Be highly specific."
                },
                confidence: {
                  type: "INTEGER",
                  description: "Confidence level of this prediction (percentage 0 to 100)."
                },
                supportLevels: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                  description: "Key support levels identified from the chart."
                },
                resistanceLevels: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                  description: "Key resistance levels identified from the chart."
                },
                patternsIdentified: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                  description: "Specific chart pattern, indicator setups, or candlestick formations identified."
                },
                reasoning: {
                  type: "STRING",
                  description: "Detailed professional technical analysis reasoning in English."
                },
                reasoningBangla: {
                  type: "STRING",
                  description: "Complete technical analysis reasoning in highly-clear Bengali language (বাংলা) explaining patterns and price action."
                },
                recommendation: {
                  type: "STRING",
                  description: "Trade execution guidance and warnings in English."
                },
                recommendationBangla: {
                  type: "STRING",
                  description: "Trade execution guidance and warnings in Bengali language (বাংলা)."
                },
                riskRewardRatio: {
                  type: "STRING",
                  description: "Suggested Risk-to-Reward ratio (e.g. '1:2', '1:1.5')."
                },
                suggestedStopLoss: {
                  type: "STRING",
                  description: "Stop Loss level suggesting where to exit if trade goes wrong."
                },
                suggestedTakeProfit: {
                  type: "STRING",
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
          console.log(`Technical analysis successfully completed using model: ${modelName}`);
          break;
        }
      } catch (err) {
        console.warn(`Model ${modelName} failed or encountered rate limits. Trying next model. Error details:`, err);
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
    return res.status(200).json(tradingAnalysis);

  } catch (error) {
    console.error("Analysis API Error:", error);
    let errorMessage = (error && error.message) || "An unexpected error occurred during analysis.";
    
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
}
