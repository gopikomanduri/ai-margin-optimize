export enum MessageType {
  USER = "user",
  ASSISTANT = "assistant"
}

export interface ChatMessage {
  type: MessageType;
  content: string;
  timestamp: string;
  suggestions?: string[];
  trades?: Trade[];
}

export interface Trade {
  name: string;
  symbol: string;
  action: "Buy" | "Sell";
  entryPrice: string;
  targetPrice: string;
  stopLoss: string;
  riskLevel: "Low" | "Medium" | "High";
  rationale: string;
  technicalSignal: "Bullish" | "Bearish" | "Neutral";
  sentiment: "Positive" | "Negative" | "Neutral";
  upcomingEvents: string | null;
  chartData: number[];
}

export interface Sentiment {
  name: string;
  symbol: string;
  overall: number;
  sources: number;
  sources_breakdown?: {
    twitter: number;
    news: number;
    reddit: number;
  };
  recent_headlines?: {
    text: string;
    sentiment: "positive" | "negative" | "neutral";
  }[];
}

export interface TechnicalData {
  ema: {
    signal: "Bullish" | "Bearish" | "Neutral";
    description: string;
    chartData: {
      price: number[];
      ema20: number[];
      ema50: number[];
      ema200: number[];
    };
  };
  rsi: {
    value: number;
    signal: "Overbought" | "Oversold" | "Neutral";
    description: string;
  };
  macd: {
    signal: "Bullish" | "Bearish" | "Neutral";
    description: string;
    chartData: {
      macd: number[];
      signal: number[];
      histogram: number[];
    };
  };
  adx: {
    value: number;
    signal: "Strong" | "Weak";
    description: string;
    chartData: {
      adx: number[];
      plusDI: number[];
      minusDI: number[];
    };
  };
  obv: {
    signal: "Bullish" | "Bearish" | "Neutral";
    description: string;
    chartData: number[];
  };
}

export interface Event {
  title: string;
  date: string;
  type: "earnings" | "dividend" | "policy" | "split" | "ipo" | "other";
  description: string;
}
