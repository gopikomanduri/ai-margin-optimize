import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatMessageSchema, insertContextMemorySchema } from "@shared/schema";
import { z } from "zod";
import { analyzeSentiment } from "./services/sentimentAnalysis";
import { getTechnicalAnalysis } from "./services/technicalAnalysis";
import { getCorporateActions } from "./services/corporateActions";
import { getMarketData } from "./services/marketData";
import { getAnthropicCompletion } from "./services/anthropic";
import { connectBroker, getBrokerData } from "./services/broker";
import { saveToMemory, retrieveFromMemory } from "./services/mcp";

export async function registerRoutes(app: Express): Promise<Server> {
  // Default user ID (for demo purposes)
  const DEFAULT_USER_ID = 1;
  
  // Get user profile
  app.get("/api/user/profile", async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(DEFAULT_USER_ID);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return password
      const { password, ...userProfile } = user;
      res.json(userProfile);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user profile" });
    }
  });
  
  // Chat history
  app.get("/api/chat/history", async (req: Request, res: Response) => {
    try {
      const messages = await storage.getChatMessages(DEFAULT_USER_ID);
      const contextMemory = await storage.getContextMemory(DEFAULT_USER_ID);
      
      const formattedMessages = messages.map(msg => {
        const metadata = msg.metadata as Record<string, any> || {};
        return {
          type: msg.type,
          content: msg.content,
          timestamp: msg.createdAt ? msg.createdAt.toISOString() : new Date().toISOString(),
          suggestions: metadata.suggestions || [],
          trades: metadata.trades || [],
        };
      });
      
      const lastUpdated = contextMemory?.lastUpdated 
        ? new Date(contextMemory.lastUpdated).toLocaleTimeString() 
        : "Never";
      
      res.json({ 
        messages: formattedMessages,
        contextInfo: {
          messageCount: messages.length,
          lastUpdated,
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get chat history" });
    }
  });
  
  // Send a new message
  app.post("/api/chat/message", async (req: Request, res: Response) => {
    try {
      const { message, languageMode } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      // Add user message to chat history
      const userMessage = await storage.createChatMessage({
        userId: DEFAULT_USER_ID,
        content: message,
        type: "user",
        metadata: {}
      });
      
      // Retrieve context from memory
      const contextData = await retrieveFromMemory(DEFAULT_USER_ID);
      
      // Get AI response from Anthropic
      const aiResponse = await getAnthropicCompletion(
        message, 
        languageMode || "beginner", 
        contextData
      );
      
      // Add assistant message to chat history
      const assistantMessage = await storage.createChatMessage({
        userId: DEFAULT_USER_ID,
        content: aiResponse.content,
        type: "assistant",
        metadata: {
          suggestions: aiResponse.suggestions || [],
          trades: aiResponse.trades || [],
        }
      });
      
      // Save context to memory
      await saveToMemory(DEFAULT_USER_ID, {
        lastMessage: message,
        lastResponse: aiResponse.content,
        ...contextData,
      });
      
      // Log the interaction
      await storage.createEventLog({
        userId: DEFAULT_USER_ID,
        eventType: "chat_message",
        details: {
          userMessageId: userMessage.id,
          assistantMessageId: assistantMessage.id,
        }
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to process message" });
    }
  });
  
  // Clear chat history
  app.post("/api/chat/clear", async (req: Request, res: Response) => {
    try {
      await storage.clearChatMessages(DEFAULT_USER_ID);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear chat history" });
    }
  });
  
  // Refresh context
  app.post("/api/chat/refresh", async (req: Request, res: Response) => {
    try {
      // Get the latest context
      const contextMemory = await storage.getContextMemory(DEFAULT_USER_ID);
      if (contextMemory) {
        // Update timestamp
        const contextData = contextMemory.data;
        await storage.createOrUpdateContextMemory({
          userId: DEFAULT_USER_ID,
          data: contextData as Record<string, any>,
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to refresh context" });
    }
  });
  
  // Market overview data
  app.get("/api/market/overview", async (req: Request, res: Response) => {
    try {
      // Get market data
      const marketData = await getMarketData();
      
      // Get sentiment data for top stocks
      const sentimentData = await Promise.all(
        ["HDFCBANK", "INFY", "RELIANCE"].map(async (symbol) => {
          return await analyzeSentiment(symbol);
        })
      );
      
      // Get technical analysis for default stock
      const technicalIndicators = {
        HDFCBANK: await getTechnicalAnalysis("HDFCBANK"),
        INFY: await getTechnicalAnalysis("INFY"),
        RELIANCE: await getTechnicalAnalysis("RELIANCE"),
      };
      
      // Get upcoming events/corporate actions
      const events = await getCorporateActions();
      
      // Get broker data if connected
      const brokerConnections = await storage.getBrokerConnections(DEFAULT_USER_ID);
      const watchlist = brokerConnections.length > 0 
        ? await getBrokerData(DEFAULT_USER_ID, "watchlist") 
        : [];
      
      const lastUpdated = new Date().toLocaleTimeString();
      
      res.json({
        indices: marketData.indices,
        sentiments: sentimentData,
        technicalIndicators,
        events,
        watchlist,
        lastUpdated,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get market overview" });
    }
  });
  
  // Get available stocks
  app.get("/api/market/stocks", async (req: Request, res: Response) => {
    try {
      const stocks = [
        { symbol: "HDFCBANK", name: "HDFC Bank" },
        { symbol: "INFY", name: "Infosys" },
        { symbol: "RELIANCE", name: "Reliance Industries" },
        { symbol: "TCS", name: "Tata Consultancy Services" },
        { symbol: "ICICIBANK", name: "ICICI Bank" },
      ];
      
      res.json(stocks);
    } catch (error) {
      res.status(500).json({ message: "Failed to get stocks list" });
    }
  });
  
  // Connect broker
  app.post("/api/broker/connect", async (req: Request, res: Response) => {
    try {
      const authUrl = await connectBroker(DEFAULT_USER_ID, "zerodha");
      res.json({ authUrl });
    } catch (error) {
      res.status(500).json({ message: "Failed to connect broker" });
    }
  });
  
  // Share functionality
  app.post("/api/share", async (req: Request, res: Response) => {
    try {
      // Generate a share URL (mock implementation)
      const shareId = Math.random().toString(36).substring(2, 10);
      const shareUrl = `https://trademind.io/shared/${shareId}`;
      
      res.json({ shareUrl });
    } catch (error) {
      res.status(500).json({ message: "Failed to create share link" });
    }
  });
  
  // Technical analysis endpoint
  app.get("/api/technical/:symbol", async (req: Request, res: Response) => {
    try {
      const { symbol } = req.params;
      const technicalData = await getTechnicalAnalysis(symbol);
      res.json(technicalData);
    } catch (error) {
      res.status(500).json({ message: "Failed to get technical analysis" });
    }
  });
  
  // Sentiment analysis endpoint
  app.get("/api/sentiment/:symbol", async (req: Request, res: Response) => {
    try {
      const { symbol } = req.params;
      const sentimentData = await analyzeSentiment(symbol);
      res.json(sentimentData);
    } catch (error) {
      res.status(500).json({ message: "Failed to get sentiment analysis" });
    }
  });
  
  // Text sentiment analysis
  app.post("/api/analyze/sentiment", async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }
      
      const result = await analyzeSentiment(text);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze sentiment" });
    }
  });
  
  // Generate trading idea
  app.post("/api/generate/trade-idea", async (req: Request, res: Response) => {
    try {
      const { preferences } = req.body;
      
      // Get market data
      const marketData = await getMarketData();
      
      // Get AI-generated trade ideas
      const tradeIdeas = await getAnthropicCompletion(
        `Generate a trade idea with the following preferences: ${JSON.stringify(preferences)}`,
        "pro",
        { preferences }
      );
      
      res.json({
        ideas: tradeIdeas.trades || [],
        marketContext: marketData.indices,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate trading idea" });
    }
  });
  
  // Explain trading concept
  app.post("/api/explain", async (req: Request, res: Response) => {
    try {
      const { concept } = req.body;
      
      if (!concept) {
        return res.status(400).json({ message: "Concept is required" });
      }
      
      const aiResponse = await getAnthropicCompletion(
        `Explain the trading concept: ${concept}`,
        "beginner",
        {}
      );
      
      res.json({ explanation: aiResponse.content });
    } catch (error) {
      res.status(500).json({ message: "Failed to explain concept" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
