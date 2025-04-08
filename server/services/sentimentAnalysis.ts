import { Sentiment } from "@/lib/types";

export async function analyzeSentiment(symbolOrText: string): Promise<Sentiment | { rating: number; confidence: number }> {
  try {
    // Detect if input is a symbol or free text
    const isSymbol = /^[A-Z]+$/.test(symbolOrText);
    
    if (isSymbol) {
      // Return sentiment for a specific stock symbol
      return getStockSentiment(symbolOrText);
    } else {
      // Analyze sentiment of free text
      return analyzeTextSentiment(symbolOrText);
    }
  } catch (error) {
    console.error(`Error analyzing sentiment for ${symbolOrText}:`, error);
    throw new Error(`Failed to analyze sentiment for ${symbolOrText}`);
  }
}

function getStockSentiment(symbol: string): Sentiment {
  // In a real implementation, this would fetch data from:
  // 1. Twitter/X API for tweets about the stock
  // 2. News APIs for recent headlines
  // 3. Reddit API for relevant posts
  // 4. Then use NLP to analyze the sentiment
  
  // For the MVP, we return static mock data
  switch (symbol) {
    case "HDFCBANK":
      return {
        name: "HDFC Bank",
        symbol: "HDFCBANK",
        overall: 72,
        sources: 147,
        sources_breakdown: {
          twitter: 75,
          news: 68,
          reddit: 70
        },
        recent_headlines: [
          { text: "HDFC Bank launches new digital banking solutions for SMEs", sentiment: "positive" },
          { text: "Analysts bullish on HDFC Bank after strong quarterly results", sentiment: "positive" },
          { text: "HDFC Bank partners with fintech startups to enhance customer experience", sentiment: "positive" },
          { text: "HDFC Bank faces technical glitches in mobile app, users report", sentiment: "negative" }
        ]
      };
    case "INFY":
      return {
        name: "Infosys",
        symbol: "INFY",
        overall: 65,
        sources: 93,
        sources_breakdown: {
          twitter: 62,
          news: 68,
          reddit: 64
        },
        recent_headlines: [
          { text: "Infosys wins large deal with European retailer for digital transformation", sentiment: "positive" },
          { text: "Infosys to announce Q1 results next month, expectations high", sentiment: "positive" },
          { text: "Infosys faces employee attrition challenges amid tech industry slowdown", sentiment: "negative" }
        ]
      };
    case "RELIANCE":
      return {
        name: "Reliance Industries",
        symbol: "RELIANCE",
        overall: 51,
        sources: 215,
        sources_breakdown: {
          twitter: 48,
          news: 55,
          reddit: 50
        },
        recent_headlines: [
          { text: "Reliance Retail expands e-commerce presence with new acquisitions", sentiment: "positive" },
          { text: "Reliance Jio introduces new 5G plans, mixed customer response", sentiment: "neutral" },
          { text: "Reliance Industries faces regulatory scrutiny in energy segment", sentiment: "negative" }
        ]
      };
    default:
      return {
        name: "Unknown Stock",
        symbol: symbol,
        overall: 50,
        sources: 10,
        sources_breakdown: {
          twitter: 50,
          news: 50,
          reddit: 50
        }
      };
  }
}

function analyzeTextSentiment(text: string): { rating: number; confidence: number } {
  // In a real implementation, this would use the OpenAI API or another NLP service
  // to analyze the sentiment of the text
  
  // For the MVP, we use a simple keyword-based approach
  const positiveWords = ["good", "great", "excellent", "bullish", "up", "rise", "growth", "profit", "gain", "positive"];
  const negativeWords = ["bad", "poor", "terrible", "bearish", "down", "fall", "decline", "loss", "negative"];
  
  const words = text.toLowerCase().split(/\W+/);
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) positiveCount++;
    if (negativeWords.includes(word)) negativeCount++;
  });
  
  const totalSentimentWords = positiveCount + negativeCount;
  
  if (totalSentimentWords === 0) {
    // Neutral sentiment
    return { rating: 3, confidence: 0.5 };
  }
  
  const sentimentScore = (positiveCount / totalSentimentWords) * 4 + 1; // 1-5 scale
  const confidence = Math.min(1, totalSentimentWords / 10); // More words, higher confidence
  
  return {
    rating: Math.round(sentimentScore * 10) / 10, // Round to 1 decimal place
    confidence: Math.round(confidence * 100) / 100 // Round to 2 decimal places
  };
}
