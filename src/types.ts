export interface TradingAnalysis {
  prediction: "Up" | "Down" | "Neutral";
  priceCloseUpEntry: string;
  priceCloseDownEntry: string;
  confidence: number;
  supportLevels: string[];
  resistanceLevels: string[];
  patternsIdentified: string[];
  reasoning: string;
  reasoningBangla: string;
  recommendation: string;
  recommendationBangla: string;
  riskRewardRatio: string;
  suggestedStopLoss: string;
  suggestedTakeProfit: string;
}

export interface AnalysisHistoryItem {
  id: string;
  timestamp: number;
  imageFileName: string;
  imageDataUrl: string; // so the user can see their analyzed chart thumbnail
  analysis: TradingAnalysis;
}
