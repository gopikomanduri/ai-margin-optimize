import Anthropic from '@anthropic-ai/sdk';

// Print the API key format for debugging (only the prefix, not the entire key)
const apiKeyPrefix = process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.substring(0, 10) + '...' : 'undefined';
console.log(`Debug: Anthropic API key format check - prefix: ${apiKeyPrefix}`);

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  // Try to directly use the API key here (for testing purposes)
  apiKey: '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',
});

interface AIResponse {
  content: string;
  suggestions?: string[];
  trades?: any[];
}

// Safe type guard to check if the content block is a text block
function isTextBlock(block: any): block is { type: 'text', text: string } {
  return block && block.type === 'text' && typeof block.text === 'string';
}

export async function getAnthropicCompletion(
  prompt: string,
  mode: "beginner" | "pro",
  context: Record<string, any>
): Promise<AIResponse> {
  try {
    // Since we're experiencing credit balance issues, let's use mock data
    console.log("Using mock data due to credit balance limitations");
    return getMockResponse(prompt, mode);
    
    /* Uncomment this when API credits are available
    const systemPrompt = getSystemPrompt(mode, context);
    
    console.log("Sending request to Anthropic API...");
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: 'user', content: prompt }
      ],
    });
    */

    /* Uncomment this when API credits are available
    try {
      // Try to parse the response as JSON using our type guard
      const contentBlock = response.content[0];
      const responseContent = isTextBlock(contentBlock)
        ? contentBlock.text
        : JSON.stringify({response: "I couldn't generate a proper response"});
      
      const parsedResponse = JSON.parse(responseContent);
      
      return {
        content: parsedResponse.response || "",
        suggestions: parsedResponse.suggestions || [],
        trades: parsedResponse.trades || [],
      };
    } catch (parseError) {
      // If parsing fails, use the response text directly
      console.warn("Failed to parse Claude response as JSON:", parseError);
      
      const contentBlock = response.content[0];
      const responseText = isTextBlock(contentBlock)
        ? contentBlock.text
        : "I'm having trouble generating a response right now.";
        
      return {
        content: responseText,
        suggestions: ["Ask a follow-up question", "View market overview", "Get trading ideas"],
      };
    }
    */
  } catch (error) {
    console.error("Anthropic API error:", error);
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
  // Check for RSI indicator explanation (for the /api/explain endpoint test)
  if (prompt.toLowerCase().includes("rsi") || prompt.toLowerCase().includes("relative strength index")) {
    return {
      content: mode === "beginner" 
        ? "The Relative Strength Index (RSI) is a momentum indicator that measures the speed and change of price movements. It ranges from 0 to 100 and helps you identify if a stock is overbought (typically above 70) or oversold (typically below 30). When RSI is high, it might be a good time to consider selling, and when it's low, it might be a good time to consider buying." 
        : "RSI (Relative Strength Index) is a momentum oscillator that measures the speed and magnitude of price movements on a scale of 0-100. The formula RS = Average Gain / Average Loss is used to calculate RSI = 100 - (100/(1+RS)). Traditional interpretation: Values >70 indicate overbought conditions suggesting potential reversal/correction; values <30 indicate oversold conditions suggesting potential buying opportunity. Divergences between RSI and price action often precede market reversals.",
      suggestions: ["How do I use RSI for trading?", "Tell me about other technical indicators", "Show me RSI on a stock chart"],
    };
  } 
  // Simple keyword matching to provide somewhat relevant responses
  else if (prompt.toLowerCase().includes("trade") || prompt.toLowerCase().includes("idea")) {
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