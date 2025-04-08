import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "sk-mock-key-for-development" });

interface AIResponse {
  content: string;
  suggestions?: string[];
  trades?: any[];
}

export async function getOpenAICompletion(
  prompt: string,
  mode: "beginner" | "pro",
  context: Record<string, any>
): Promise<AIResponse> {
  try {
    // For development, return mock data if no API key
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "sk-mock-key-for-development") {
      return getMockResponse(prompt, mode);
    }
    
    const systemPrompt = getSystemPrompt(mode, context);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });
    
    const responseContent = response.choices[0].message.content || "{}";
    const parsedResponse = JSON.parse(responseContent);
    
    return {
      content: parsedResponse.response || "",
      suggestions: parsedResponse.suggestions || [],
      trades: parsedResponse.trades || [],
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    return {
      content: "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
      suggestions: ["Try asking a different question", "Check market overview"],
    };
  }
}

function getSystemPrompt(mode: string, context: Record<string, any>): string {
  const basePrompt = `You are TradeMind, an AI-powered trading assistant. Your role is to provide personalized trading insights and recommendations based on technical analysis, sentiment analysis, and fundamental data.

Always respond in JSON format with the following structure:
{
  "response": "Your main response text here",
  "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"],
  "trades": [optional array of trade objects]
}

Trade objects should have the following structure if you recommend specific trades:
{
  "name": "Company Name",
  "symbol": "TICKER",
  "action": "Buy" or "Sell",
  "entryPrice": "price",
  "targetPrice": "price",
  "stopLoss": "price",
  "riskLevel": "Low", "Medium", or "High",
  "rationale": "Brief explanation",
  "technicalSignal": "Bullish", "Bearish", or "Neutral",
  "sentiment": "Positive", "Negative", or "Neutral",
  "upcomingEvents": "Event info or null"
}

User context:
${JSON.stringify(context, null, 2)}

Additional guidelines:
- ${mode === "beginner" ? "Use simple language and explain concepts. Avoid jargon." : "Use professional trading terminology. Be concise and technical."}
- Be honest about limitations and uncertainties.
- Provide actionable insights when possible.
- Consider both technical and fundamental factors in your analysis.
- Don't make unrealistic predictions about market movements.
- Recommend trades that match the user's risk profile if known.`;

  return basePrompt;
}

// Mock response for development without API key
function getMockResponse(prompt: string, mode: string): AIResponse {
  // Simple keyword matching to provide somewhat relevant responses
  if (prompt.toLowerCase().includes("trade") || prompt.toLowerCase().includes("idea")) {
    return {
      content: "Based on current market conditions, here are a couple of trading ideas that align with a moderate risk profile:",
      suggestions: ["Tell me more about HDFC Bank", "Show me the technical analysis", "What's the market sentiment?"],
      trades: [
        {
          name: "HDFC Bank",
          symbol: "HDFCBANK",
          action: "Buy",
          entryPrice: "₹1,642",
          targetPrice: "₹1,680",
          stopLoss: "₹1,620",
          riskLevel: "Low",
          rationale: "Forming a bullish flag pattern after recent consolidation. RSI at 52 shows moderate momentum.",
          technicalSignal: "Bullish",
          sentiment: "Positive",
          upcomingEvents: null,
          chartData: [60, 58, 57, 59, 63, 65, 64, 62, 64, 67, 69, 71, 70, 72, 74, 75, 78, 80, 79, 82]
        },
        {
          name: "Infosys",
          symbol: "INFY",
          action: "Buy",
          entryPrice: "₹1,950",
          targetPrice: "₹2,020",
          stopLoss: "₹1,910",
          riskLevel: "Low",
          rationale: "Recent pullback offering good entry point. Support at 200-day EMA with 3.5% dividend yield as cushion.",
          technicalSignal: "Neutral",
          sentiment: "Positive",
          upcomingEvents: "Earnings in 2 weeks",
          chartData: [70, 72, 75, 73, 70, 68, 65, 62, 60, 58, 57, 60, 63, 65, 68, 70, 69, 71, 73, 75]
        }
      ]
    };
  } else if (prompt.toLowerCase().includes("sentiment") || prompt.toLowerCase().includes("market")) {
    return {
      content: mode === "beginner" 
        ? "The overall market sentiment is positive today. The NIFTY index is up by 0.68% and most sectors are showing green. Financial stocks are particularly strong." 
        : "Market exhibits bullish sentiment with NIFTY +0.68%, trading above all key EMAs. Breadth indicators show 68% advancers. Financial sector outperforming with 1.2% gains, suggesting rotational strength.",
      suggestions: ["Show me bullish stocks", "What's the technical outlook?", "Any upcoming market events?"],
    };
  } else if (prompt.toLowerCase().includes("portfolio") || prompt.toLowerCase().includes("position")) {
    return {
      content: "You currently don't have any open positions since you haven't connected your broker account yet. Would you like me to help you connect your trading account so I can analyze your portfolio?",
      suggestions: ["Connect my broker", "Show me some trade ideas", "Explain how to connect"],
    };
  } else {
    return {
      content: "Hello! I'm TradeMind, your AI-powered trading assistant. I can help you with market analysis, trading ideas, and portfolio management. What would you like to know about today?",
      suggestions: ["Show me today's market overview", "Suggest low-risk trade ideas", "Analyze market sentiment"],
    };
  }
}
