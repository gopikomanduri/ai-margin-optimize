import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { storage } from "./storage";
import { insertChatMessageSchema, insertContextMemorySchema, insertAlertTriggerSchema, insertTradingGoalSchema } from "@shared/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { alertTriggers, alertNotifications } from "@shared/schema";
import seedDatabase from "./seed";
import { analyzeSentiment } from "./services/sentimentAnalysis";
import { getTechnicalAnalysis } from "./services/technicalAnalysis";
import { getCorporateActions } from "./services/corporateActions";
import { getMarketData } from "./services/marketData";
import { getAnthropicCompletion } from "./services/anthropic";
import { 
  connectBroker, 
  completeBrokerAuth, 
  getBrokerData, 
  BrokerType,
  getPledgedHoldings,
  getMarginOptimizationRecommendations,
  createPledgeRequest,
  createUnpledgeRequest,
  requestPledgeOTP,
  authorizePledgeRequest
} from "./services/broker";
import { InsertBrokerConnection, InsertTradingGoal } from "@shared/schema";
import { saveToMemory, retrieveFromMemory } from "./services/mcp";
import { seedBadgeDefinitions } from "./services/badgeService";
import * as badgeService from "./services/badgeService";
import * as goalService from "./services/goalService";
import * as eventService from "./services/eventService";
import * as autoTradeScheduler from "./services/autoTradeScheduler";
// New AI and Mathematical Models
import { optimizePortfolio } from "./services/portfolioOptimization";
import { runMonteCarloSimulation, simulateStrategy } from "./services/monteCarloSimulation";
import { detectAnomalies } from "./services/anomalyDetection";
import * as tradingEngine from "./services/tradingEngine";
import { createSensitivityModel, compareSensitivity, findStocksWithSensitivity, analyzePortfolioSensitivity } from "./services/sensitivityModeling";
import { createStrategy, updateStrategy, getStrategy, listStrategies, deleteStrategy, runBacktest } from "./services/strategyBuilder";
// Alert system
import { 
  getAlertsByUser,
  getAlertsBySymbol,
  createAlert, 
  updateAlert, 
  deleteAlert, 
  getAlertNotifications,
  checkPriceAlerts
} from "./services/alertService";

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
  
  // Get broker connections
  app.get("/api/broker/connections", async (req: Request, res: Response) => {
    try {
      const connections = await storage.getBrokerConnections(DEFAULT_USER_ID);
      
      const formattedConnections = connections.map(conn => {
        const metadata = conn.metadata as Record<string, any> || {};
        return {
          id: conn.id,
          broker: conn.broker,
          isActive: conn.isActive,
          lastUpdated: metadata.connectedAt || metadata.lastConnectionAttempt || new Date().toISOString(),
          metadata: {
            accountId: metadata.accountId,
            name: metadata.name,
            email: metadata.email
          }
        };
      });
      
      res.json(formattedConnections);
    } catch (error) {
      console.error('Error getting broker connections:', error);
      res.status(500).json({ message: "Failed to get broker connections" });
    }
  });
  
  // Connect broker (by broker name)
  app.post("/api/broker/:broker/connect", async (req: Request, res: Response) => {
    try {
      const { broker } = req.params;
      
      if (!broker || !['zerodha', 'fyers', 'angel', 'upstox', 'iifl'].includes(broker)) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid broker specified" 
        });
      }
      
      const redirectUrl = await connectBroker(DEFAULT_USER_ID, broker as BrokerType);
      
      res.json({ 
        success: true,
        redirectUrl,
        message: `${broker.charAt(0).toUpperCase() + broker.slice(1)} connection initiated`
      });
    } catch (error) {
      console.error(`Error connecting to broker:`, error);
      res.status(500).json({ 
        success: false,
        message: "Failed to connect broker: " + error.message 
      });
    }
  });
  
  // Check broker connection status
  app.get("/api/broker/:broker/status", async (req: Request, res: Response) => {
    try {
      const { broker } = req.params;
      
      if (!broker || !['zerodha', 'fyers', 'angel', 'upstox', 'iifl'].includes(broker)) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid broker specified" 
        });
      }
      
      const connection = await storage.getBrokerConnectionByBroker(DEFAULT_USER_ID, broker);
      
      if (!connection) {
        return res.json({ 
          success: true,
          connected: false,
          message: "No connection found"
        });
      }
      
      const metadata = connection.metadata as Record<string, any> || {};
      const connected = connection.isActive && metadata.status === "connected";
      
      res.json({
        success: true,
        connected,
        status: metadata.status || "unknown",
        lastUpdated: metadata.connectedAt || metadata.lastConnectionAttempt,
        details: {
          accountId: metadata.accountId,
          name: metadata.name
        }
      });
    } catch (error) {
      console.error(`Error checking broker status:`, error);
      res.status(500).json({ 
        success: false,
        message: "Failed to check broker status: " + error.message 
      });
    }
  });
  
  // Disconnect broker
  app.post("/api/broker/disconnect/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid connection ID"
        });
      }
      
      const connection = await storage.getBrokerConnection(id);
      
      if (!connection || connection.userId !== DEFAULT_USER_ID) {
        return res.status(404).json({
          success: false,
          message: "Broker connection not found"
        });
      }
      
      await storage.updateBrokerConnection(id, {
        isActive: false,
        metadata: {
          ...connection.metadata,
          status: "disconnected",
          disconnectedAt: new Date().toISOString()
        }
      });
      
      // Log the event
      await storage.createEventLog({
        userId: DEFAULT_USER_ID,
        eventType: "broker_disconnected",
        details: { 
          broker: connection.broker,
          timestamp: new Date().toISOString(),
          connectionId: id
        }
      });
      
      res.json({
        success: true,
        message: `Successfully disconnected from ${connection.broker}`
      });
    } catch (error) {
      console.error('Error disconnecting broker:', error);
      res.status(500).json({
        success: false, 
        message: "Failed to disconnect broker: " + error.message
      });
    }
  });
  
  // Complete broker authorization (for OAuth callback)
  app.post("/api/broker/:broker/authorize", async (req: Request, res: Response) => {
    try {
      const { broker } = req.params;
      const { authCode } = req.body;
      
      if (!broker || !['zerodha', 'fyers', 'angel', 'upstox', 'iifl'].includes(broker)) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid broker specified" 
        });
      }
      
      if (!authCode) {
        return res.status(400).json({
          success: false,
          message: "Authorization code is required"
        });
      }
      
      const connection = await completeBrokerAuth(DEFAULT_USER_ID, broker as BrokerType, authCode);
      
      res.json({ 
        success: true, 
        message: `Successfully connected to ${broker}`,
        connection: {
          id: connection.id,
          broker: connection.broker,
          isActive: connection.isActive
        }
      });
    } catch (error) {
      console.error('Error authorizing broker:', error);
      res.status(500).json({
        success: false,
        message: "Failed to authorize broker: " + error.message
      });
    }
  });
  
  // Get pledged holdings
  app.get("/api/pledged-holdings", async (req: Request, res: Response) => {
    try {
      const pledgedHoldings = await getPledgedHoldings(DEFAULT_USER_ID);
      res.status(200).json(pledgedHoldings);
    } catch (error) {
      console.error("Error getting pledged holdings:", error);
      res.status(500).send(`Failed to get pledged holdings: ${error.message}`);
    }
  });
  
  // Get margin optimization recommendations
  app.get("/api/margin-optimization", async (req: Request, res: Response) => {
    try {
      const optimizationRecommendations = await getMarginOptimizationRecommendations(DEFAULT_USER_ID);
      res.status(200).json(optimizationRecommendations);
    } catch (error) {
      console.error("Error getting margin optimization recommendations:", error);
      res.status(500).send(`Failed to get margin optimization recommendations: ${error.message}`);
    }
  });
  
  // Create a pledge request
  app.post("/api/pledge", async (req: Request, res: Response) => {
    try {
      const { broker, symbol, quantity, purpose } = req.body;
      
      // Validate pledge parameters
      if (!broker || !symbol || !quantity) {
        return res.status(400).send("Missing required pledge parameters");
      }
      
      const result = await createPledgeRequest(DEFAULT_USER_ID, {
        broker,
        symbol,
        quantity,
        purpose
      });
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error creating pledge request:", error);
      res.status(500).send(`Failed to create pledge request: ${error.message}`);
    }
  });
  
  // Create an unpledge request
  app.post("/api/unpledge", async (req: Request, res: Response) => {
    try {
      const { broker, symbol, quantity, pledgeId, purpose } = req.body;
      
      // Validate unpledge parameters
      if (!broker || !symbol || !quantity) {
        return res.status(400).send("Missing required unpledge parameters");
      }
      
      const result = await createUnpledgeRequest(DEFAULT_USER_ID, {
        broker,
        symbol,
        quantity,
        pledgeId,
        purpose
      });
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error creating unpledge request:", error);
      res.status(500).send(`Failed to create unpledge request: ${error.message}`);
    }
  });
  
  // Request OTP for pledge authorization
  app.post("/api/pledge/request-otp", async (req: Request, res: Response) => {
    try {
      const { broker, requestId, requestType } = req.body;
      
      // Validate OTP request parameters
      if (!broker || !requestId || !requestType) {
        return res.status(400).send("Missing required OTP request parameters");
      }
      
      const result = await requestPledgeOTP(DEFAULT_USER_ID, {
        broker,
        requestId,
        requestType
      });
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error requesting OTP:", error);
      res.status(500).send(`Failed to request OTP: ${error.message}`);
    }
  });
  
  // Authorize pledge with OTP
  app.post("/api/pledge/authorize", async (req: Request, res: Response) => {
    try {
      const { broker, requestId, requestType, otp } = req.body;
      
      // Validate authorization parameters
      if (!broker || !requestId || !requestType || !otp) {
        return res.status(400).send("Missing required authorization parameters");
      }
      
      const result = await authorizePledgeRequest(DEFAULT_USER_ID, {
        broker,
        requestId,
        requestType,
        otp
      });
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error authorizing request:", error);
      res.status(500).send(`Failed to authorize request: ${error.message}`);
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

  /*** Advanced AI and Mathematical Models API Endpoints ***/

  // Portfolio Optimization
  app.post("/api/portfolio/optimize", async (req: Request, res: Response) => {
    try {
      const {
        riskTolerance = "moderate",
        investmentHorizon = "medium",
        assets = ["HDFCBANK", "INFY", "RELIANCE", "TCS", "ICICIBANK"],
        constraints
      } = req.body;

      if (!assets || !Array.isArray(assets) || assets.length === 0) {
        return res.status(400).json({ message: "Assets array is required" });
      }

      const result = await optimizePortfolio({
        riskTolerance: riskTolerance as 'conservative' | 'moderate' | 'aggressive',
        investmentHorizon: investmentHorizon as 'short' | 'medium' | 'long',
        assets,
        constraints
      });

      await storage.createEventLog({
        userId: DEFAULT_USER_ID,
        eventType: "portfolio_optimization",
        details: {
          requestParams: { riskTolerance, investmentHorizon, assetsCount: assets.length },
          resultSummary: {
            expectedReturn: result.expectedReturn,
            expectedVolatility: result.expectedVolatility,
            sharpeRatio: result.sharpeRatio
          }
        }
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to optimize portfolio" });
    }
  });

  // Monte Carlo Simulation
  app.post("/api/simulation/monte-carlo", async (req: Request, res: Response) => {
    try {
      const {
        initialInvestment,
        timeHorizonDays,
        numSimulations = 1000,
        assets,
        confidenceInterval = 0.95,
        drawdownThreshold = 0.2
      } = req.body;

      if (!initialInvestment || !timeHorizonDays || !assets) {
        return res.status(400).json({ 
          message: "Initial investment, time horizon, and assets are required" 
        });
      }

      const result = runMonteCarloSimulation({
        initialInvestment,
        timeHorizonDays,
        numSimulations,
        assets,
        confidenceInterval,
        drawdownThreshold
      });

      await storage.createEventLog({
        userId: DEFAULT_USER_ID,
        eventType: "monte_carlo_simulation",
        details: {
          requestParams: { 
            initialInvestment, 
            timeHorizonDays, 
            numSimulations, 
            assetsCount: assets.length 
          },
          resultSummary: {
            expectedValue: result.expectedValue,
            successProbability: result.successProbability,
            maxDrawdown: result.drawdownStats.max
          }
        }
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to run Monte Carlo simulation" });
    }
  });

  // Trading Strategy Simulation
  app.post("/api/simulation/strategy", async (req: Request, res: Response) => {
    try {
      const {
        initialCapital,
        winRate,
        avgWin,
        avgLoss,
        tradesPerYear,
        years,
        numSimulations = 1000
      } = req.body;

      if (!initialCapital || winRate === undefined || !avgWin || !avgLoss || !tradesPerYear || !years) {
        return res.status(400).json({ 
          message: "All strategy parameters are required" 
        });
      }

      const result = simulateStrategy({
        initialCapital,
        winRate,
        avgWin,
        avgLoss,
        tradesPerYear,
        years,
        numSimulations
      });

      await storage.createEventLog({
        userId: DEFAULT_USER_ID,
        eventType: "strategy_simulation",
        details: {
          requestParams: { initialCapital, winRate, avgWin, avgLoss, tradesPerYear, years },
          resultSummary: {
            meanFinalCapital: result.finalCapital.mean,
            profitProbability: result.profitProbability,
            meanCAGR: result.cagr.mean
          }
        }
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to simulate trading strategy" });
    }
  });

  // Anomaly Detection
  app.post("/api/market/anomalies", async (req: Request, res: Response) => {
    try {
      const {
        symbol,
        lookbackPeriod = 60,
        sensitivityLevel = "medium",
        includeVolume = true,
        includeGaps = true,
        includeVolatility = true,
        includeCorrelation = false,
        correlatedSymbols = []
      } = req.body;

      if (!symbol) {
        return res.status(400).json({ message: "Symbol is required" });
      }

      const result = await detectAnomalies({
        symbol,
        lookbackPeriod,
        sensitivityLevel: sensitivityLevel as 'low' | 'medium' | 'high',
        includeVolume,
        includeGaps,
        includeVolatility,
        includeCorrelation,
        correlatedSymbols
      });

      await storage.createEventLog({
        userId: DEFAULT_USER_ID,
        eventType: "anomaly_detection",
        details: {
          symbol,
          anomalyCount: result.anomalies.length,
          tradingOpportunities: result.tradingOpportunities.length
        }
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to detect market anomalies" });
    }
  });

  // Risk Analysis for a Position
  app.post("/api/risk/analyze", async (req: Request, res: Response) => {
    try {
      const {
        symbol,
        entryPrice,
        quantity,
        stopLoss,
        takeProfit,
        positionType = "long"
      } = req.body;

      if (!symbol || !entryPrice || !quantity) {
        return res.status(400).json({ message: "Symbol, entry price, and quantity are required" });
      }

      // Get technical analysis data for volatility
      const technicalData = await getTechnicalAnalysis(symbol);
      
      // Run a mini Monte Carlo simulation for the position
      const positionSize = entryPrice * quantity;
      // Extract volatility or use fallback value
      const volatility = 0.02; // Default volatility of 2%
      const daysToTarget = 30; // Default to a month
      
      // Calculate risk parameters
      const stopLossPercent = stopLoss ? (Math.abs(entryPrice - stopLoss) / entryPrice) * (positionType === "long" ? -1 : 1) : -0.05;
      const takeProfitPercent = takeProfit ? (Math.abs(takeProfit - entryPrice) / entryPrice) * (positionType === "long" ? 1 : -1) : 0.1;
      
      // Run simplified simulation
      const result = runMonteCarloSimulation({
        initialInvestment: positionSize,
        timeHorizonDays: daysToTarget,
        numSimulations: 500,
        assets: [{
          symbol,
          weight: 1,
          expectedAnnualReturn: positionType === "long" ? 0.15 : -0.15,
          annualVolatility: volatility * Math.sqrt(252)
        }],
        confidenceInterval: 0.95,
        drawdownThreshold: Math.abs(stopLossPercent)
      });
      
      // Calculate risk metrics
      const riskRewardRatio = Math.abs(takeProfitPercent / stopLossPercent);
      const probProfitable = result.successProbability;
      const expectedValue = result.expectedValue - positionSize;
      const expectedValuePercent = expectedValue / positionSize;
      const maxLoss = positionSize - result.percentiles["1%"];
      const maxLossPercent = maxLoss / positionSize;
      
      // Kelly criterion calculation
      const winProbability = probProfitable;
      const lossProbability = 1 - winProbability;
      const kellyPercentage = Math.max(0, winProbability - (lossProbability / riskRewardRatio));
      const kellyPositionSize = kellyPercentage * positionSize;
      
      const riskAnalysis = {
        symbol,
        positionType,
        positionSize,
        riskMetrics: {
          stopLossPercent,
          takeProfitPercent,
          riskRewardRatio,
          probProfitable,
          expectedValue,
          expectedValuePercent,
          maxLossPercent,
          valueAtRisk: {
            "95%": positionSize - result.percentiles["5%"],
            "99%": positionSize - result.percentiles["1%"]
          },
          kellyPercentage,
          kellyPositionSize,
        },
        simulationResults: {
          expectedValue: result.expectedValue,
          percentiles: result.percentiles,
          successProbability: result.successProbability,
          drawdownProbability: result.drawdownStats.exceedanceProbability,
        },
        recommendations: [
          kellyPercentage < 0.1 ? "Position has unfavorable risk-reward characteristics" : 
            "Position has favorable risk-reward characteristics",
          riskRewardRatio < 1 ? "Consider adjusting stop loss or take profit to improve risk-reward ratio" : 
            `Risk-reward ratio of ${riskRewardRatio.toFixed(2)} is acceptable`,
          probProfitable < 0.4 ? "Low probability of profit, consider alternative trade setup" : 
            probProfitable > 0.6 ? "High probability of profit" : "Moderate probability of profit",
          expectedValuePercent < 0 ? "Negative expected value, consider avoiding this trade" :
            "Positive expected value trade"
        ]
      };
      
      await storage.createEventLog({
        userId: DEFAULT_USER_ID,
        eventType: "risk_analysis",
        details: {
          symbol,
          positionSize,
          riskRewardRatio,
          expectedValuePercent
        }
      });
      
      res.json(riskAnalysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze risk" });
    }
  });

  // --------------- ML-BASED INDEX SENSITIVITY MODELING API ENDPOINTS ---------------
  
  // Create sensitivity model for a single stock
  app.post("/api/sensitivity/model", async (req: Request, res: Response) => {
    try {
      const {
        symbol,
        index,
        lookbackPeriod,
        includeStressTests,
        includeForecast,
        forecastPeriod,
        modelComplexity
      } = req.body;
      
      if (!symbol) {
        return res.status(400).json({ message: "Symbol is required" });
      }
      
      const sensitivityModel = await createSensitivityModel({
        symbol,
        index,
        lookbackPeriod,
        includeStressTests,
        includeForecast,
        forecastPeriod,
        modelComplexity: modelComplexity || 'moderate'
      });
      
      // Log the event
      await storage.createEventLog({
        userId: DEFAULT_USER_ID,
        eventType: "sensitivity_model_created",
        details: {
          symbol,
          index: sensitivityModel.index,
          beta: sensitivityModel.metrics.beta,
          mlSensitivity: sensitivityModel.metrics.mlSensitivity,
        }
      });
      
      res.json(sensitivityModel);
    } catch (error) {
      console.error("Error creating sensitivity model:", error);
      res.status(500).json({ message: "Failed to create sensitivity model" });
    }
  });
  
  // Compare multiple stocks based on their sensitivity to an index
  app.post("/api/sensitivity/compare", async (req: Request, res: Response) => {
    try {
      const { symbols, index, modelComplexity } = req.body;
      
      if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
        return res.status(400).json({ message: "Symbols array is required" });
      }
      
      const sensitivityModels = await compareSensitivity(
        symbols,
        index,
        modelComplexity || 'moderate'
      );
      
      // Generate quick comparison summary
      const comparisonSummary = sensitivityModels.map(model => ({
        symbol: model.symbol,
        beta: model.metrics.beta,
        mlSensitivity: model.metrics.mlSensitivity,
        bullishExpectation: model.forecast.bullishMarket,
        bearishExpectation: model.forecast.bearishMarket, 
        r2: model.metrics.r2,
        consistencyScore: model.historicalPerformance.consistencyScore
      }));
      
      // Sort by beta in descending order
      comparisonSummary.sort((a, b) => b.beta - a.beta);
      
      // Log the event
      await storage.createEventLog({
        userId: DEFAULT_USER_ID,
        eventType: "sensitivity_comparison",
        details: {
          symbols,
          index: index || 'default',
          modelCount: sensitivityModels.length
        }
      });
      
      res.json({
        models: sensitivityModels,
        summary: comparisonSummary,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error comparing sensitivities:", error);
      res.status(500).json({ message: "Failed to compare sensitivities" });
    }
  });
  
  // Find stocks with specific sensitivity characteristics
  app.post("/api/sensitivity/screen", async (req: Request, res: Response) => {
    try {
      const { 
        availableSymbols,
        targetBeta,
        betaRange,
        targetCorrelation,
        correlationRange,
        outperformedIndex,
        consistencyThreshold 
      } = req.body;
      
      if (!availableSymbols || !Array.isArray(availableSymbols) || availableSymbols.length === 0) {
        return res.status(400).json({ message: "Available symbols array is required" });
      }
      
      // Filter criteria
      const criteria = {
        targetBeta,
        betaRange,
        targetCorrelation,
        correlationRange,
        outperformedIndex,
        consistencyThreshold
      };
      
      const result = await findStocksWithSensitivity(availableSymbols, criteria);
      
      // Log the event
      await storage.createEventLog({
        userId: DEFAULT_USER_ID,
        eventType: "sensitivity_screening",
        details: {
          criteriaCount: Object.keys(criteria).filter(k => criteria[k] !== undefined).length,
          symbolsScreened: availableSymbols.length,
          matchesFound: result.matchingStocks.length
        }
      });
      
      res.json({
        matchingStocks: result.matchingStocks,
        sensitivityModels: result.sensitivityModels,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error screening for sensitivities:", error);
      res.status(500).json({ message: "Failed to screen for sensitivities" });
    }
  });
  
  // Analyze portfolio sensitivity to indices
  app.post("/api/sensitivity/portfolio", async (req: Request, res: Response) => {
    try {
      const { holdings, indices } = req.body;
      
      if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
        return res.status(400).json({ message: "Holdings array is required" });
      }
      
      // Ensure proper format for holdings
      const formattedHoldings = holdings.map(holding => ({
        symbol: holding.symbol,
        weight: holding.weight || holding.allocation || (1 / holdings.length)
      }));
      
      // Validate weights sum to approximately 1
      const totalWeight = formattedHoldings.reduce((sum, h) => sum + h.weight, 0);
      
      if (Math.abs(totalWeight - 1) > 0.05) {
        // Normalize weights to sum to 1
        formattedHoldings.forEach(h => h.weight = h.weight / totalWeight);
      }
      
      const portfolioAnalysis = await analyzePortfolioSensitivity(
        formattedHoldings,
        indices
      );
      
      // Log the event
      await storage.createEventLog({
        userId: DEFAULT_USER_ID,
        eventType: "portfolio_sensitivity_analysis",
        details: {
          holdingsCount: formattedHoldings.length,
          indicesAnalyzed: indices ? indices.length : 3,
          diversificationScore: portfolioAnalysis.diversificationScore
        }
      });
      
      res.json({
        analysis: portfolioAnalysis,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error analyzing portfolio sensitivity:", error);
      res.status(500).json({ 
        message: "Failed to analyze portfolio sensitivity",
        error: error.message 
      });
    }
  });

  // --------------- STRATEGY BUILDER AND BACKTESTER API ENDPOINTS ---------------
  
  // Get strategies for the current user
  app.get("/api/strategies", async (req: Request, res: Response) => {
    try {
      const strategies = await listStrategies(DEFAULT_USER_ID);
      res.json(strategies);
    } catch (error) {
      console.error("Error listing strategies:", error);
      res.status(500).json({ message: "Failed to list strategies" });
    }
  });
  
  // Get a specific strategy by ID
  app.get("/api/strategies/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ message: "Strategy ID is required" });
      }
      
      const strategy = await getStrategy(DEFAULT_USER_ID, id);
      
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      
      res.json(strategy);
    } catch (error) {
      console.error("Error getting strategy:", error);
      res.status(500).json({ message: "Failed to get strategy" });
    }
  });
  
  // Create a new strategy
  app.post("/api/strategies", async (req: Request, res: Response) => {
    try {
      const {
        name,
        description,
        symbols,
        timeframe,
        entryConditions,
        exitConditions,
        positionSizing,
        riskManagement,
        direction
      } = req.body;
      
      // Validate required fields
      if (!name || !symbols || !Array.isArray(symbols) || symbols.length === 0 || !timeframe) {
        return res.status(400).json({ 
          message: "Name, symbols array, and timeframe are required" 
        });
      }
      
      const strategy = await createStrategy(DEFAULT_USER_ID, {
        name,
        description: description || `Strategy created on ${new Date().toLocaleDateString()}`,
        symbols,
        timeframe,
        entryConditions: entryConditions || [],
        exitConditions: exitConditions || [],
        positionSizing: positionSizing || { type: 'percentage', value: 5 },
        riskManagement: riskManagement || {
          stopLossType: 'percentage',
          stopLossValue: 2,
          takeProfitType: 'percentage',
          takeProfitValue: 6
        },
        direction: direction || 'both'
      });
      
      res.status(201).json(strategy);
    } catch (error) {
      console.error("Error creating strategy:", error);
      res.status(500).json({ message: "Failed to create strategy" });
    }
  });
  
  // Update an existing strategy
  app.put("/api/strategies/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ message: "Strategy ID is required" });
      }
      
      const updatedStrategy = await updateStrategy(DEFAULT_USER_ID, id, req.body);
      res.json(updatedStrategy);
    } catch (error) {
      console.error("Error updating strategy:", error);
      res.status(500).json({ message: "Failed to update strategy" });
    }
  });
  
  // Delete a strategy
  app.delete("/api/strategies/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ message: "Strategy ID is required" });
      }
      
      const success = await deleteStrategy(DEFAULT_USER_ID, id);
      
      if (!success) {
        return res.status(404).json({ message: "Strategy not found or delete failed" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting strategy:", error);
      res.status(500).json({ message: "Failed to delete strategy" });
    }
  });
  
  // Run backtest on a strategy
  app.post("/api/strategies/backtest", async (req: Request, res: Response) => {
    try {
      const {
        strategy,
        startDate,
        endDate,
        initialCapital,
        slippage,
        commission
      } = req.body;
      
      if (!strategy) {
        return res.status(400).json({ message: "Strategy is required" });
      }
      
      // Parse dates if they are provided as strings
      const parsedStartDate = startDate ? new Date(startDate) : undefined;
      const parsedEndDate = endDate ? new Date(endDate) : undefined;
      
      const result = await runBacktest({
        strategy,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        initialCapital,
        slippage,
        commission
      });
      
      // Log the event
      await storage.createEventLog({
        userId: DEFAULT_USER_ID,
        eventType: "strategy_backtest",
        details: {
          strategyId: strategy.id,
          strategyName: strategy.name,
          startDate: parsedStartDate?.toISOString(),
          endDate: parsedEndDate?.toISOString(),
          totalTrades: result.totalTrades,
          winRate: result.winRate,
          netProfitPercent: result.netProfitPercent
        }
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error running backtest:", error);
      res.status(500).json({ message: "Failed to run backtest", error: String(error) });
    }
  });

  // --------------- ALERT SYSTEM API ENDPOINTS ---------------
  
  // Get alerts for current user
  app.get("/api/alerts", async (req: Request, res: Response) => {
    try {
      const alerts = await getAlertsByUser(DEFAULT_USER_ID);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });
  
  // Get alerts for a specific symbol
  app.get("/api/alerts/symbol/:symbol", async (req: Request, res: Response) => {
    try {
      const { symbol } = req.params;
      const alerts = await getAlertsBySymbol(symbol);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch alerts for symbol" });
    }
  });
  
  // Create a new alert
  app.post("/api/alerts", async (req: Request, res: Response) => {
    try {
      const alertData = insertAlertTriggerSchema.parse({
        ...req.body,
        userId: DEFAULT_USER_ID
      });
      
      const newAlert = await createAlert(alertData);
      
      await storage.createEventLog({
        userId: DEFAULT_USER_ID,
        eventType: "alert_created",
        details: {
          alertId: newAlert.id,
          symbol: newAlert.symbol,
          alertType: newAlert.alertType
        }
      });
      
      res.status(201).json(newAlert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid alert data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create alert" });
    }
  });
  
  // Update an existing alert
  app.put("/api/alerts/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const alertId = parseInt(id, 10);
      
      if (isNaN(alertId)) {
        return res.status(400).json({ message: "Invalid alert ID" });
      }
      
      const updatedAlert = await updateAlert(alertId, DEFAULT_USER_ID, req.body);
      
      if (!updatedAlert) {
        return res.status(404).json({ message: "Alert not found or you don't have permission" });
      }
      
      res.json(updatedAlert);
    } catch (error) {
      res.status(500).json({ message: "Failed to update alert" });
    }
  });
  
  // Delete (deactivate) an alert
  app.delete("/api/alerts/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const alertId = parseInt(id, 10);
      
      if (isNaN(alertId)) {
        return res.status(400).json({ message: "Invalid alert ID" });
      }
      
      const success = await deleteAlert(alertId, DEFAULT_USER_ID);
      
      if (!success) {
        return res.status(404).json({ message: "Alert not found or you don't have permission" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete alert" });
    }
  });
  
  // Get alert notifications history
  app.get("/api/alert-notifications", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const notifications = await getAlertNotifications(DEFAULT_USER_ID, limit);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  
  // Simulate a price alert trigger (for testing)
  app.post("/api/alerts/simulate/price", async (req: Request, res: Response) => {
    try {
      const { symbol, price } = req.body;
      
      if (!symbol || price === undefined) {
        return res.status(400).json({ message: "Symbol and price are required" });
      }
      
      const priceData = {
        symbol,
        price: parseFloat(price),
        timestamp: new Date(),
      };
      
      const triggeredAlerts = await checkPriceAlerts(priceData);
      
      // Create notification for UI demo if none triggered
      if (triggeredAlerts.length === 0) {
        // Get one alert of the proper type to simulate a trigger
        const alerts = await db
          .select()
          .from(alertTriggers)
          .where(eq(alertTriggers.symbol, symbol))
          .limit(1);
          
        if (alerts.length > 0) {
          const alert = alerts[0];
          const notification = {
            triggerId: alert.id,
            userId: DEFAULT_USER_ID,
            symbol,
            triggeredAt: new Date(),
            triggerValue: price.toString(),
            message: `${symbol} price is now $${price} (${alert.condition} your target of $${alert.value})`,
            status: "delivered" as const,
            notificationChannel: "app" as const
          };
          
          const [insertedNotification] = await db.insert(alertNotifications).values(notification).returning();
          
          // Send notification to connected WebSocket clients
          sendAlertToUser(DEFAULT_USER_ID, insertedNotification);
          
          triggeredAlerts.push(alert);
        }
      }
      
      res.json({
        triggered: triggeredAlerts.length > 0,
        count: triggeredAlerts.length,
        alerts: triggeredAlerts
      });
    } catch (error) {
      console.error("Error simulating price alert:", error);
      res.status(500).json({ message: "Failed to simulate price alert" });
    }
  });
  
  // Demo API to create various alert types
  app.post("/api/demo/seed", async (req: Request, res: Response) => {
    try {
      await seedDatabase();
      res.json({ success: true, message: "Demo data seeded successfully" });
    } catch (error) {
      console.error("Error seeding demo data:", error);
      res.status(500).json({ message: "Failed to seed demo data" });
    }
  });
  
  // Send a simulated real-time notification for demo purposes
  app.post("/api/demo/notify", async (req: Request, res: Response) => {
    try {
      const { symbol, type = "price", price, value } = req.body;
      
      if (!symbol) {
        return res.status(400).json({ message: "Symbol is required" });
      }
      
      // Get a random alert for this user
      const alerts = await db
        .select()
        .from(alertTriggers)
        .where(eq(alertTriggers.userId, DEFAULT_USER_ID))
        .limit(10);
      
      if (alerts.length === 0) {
        return res.status(404).json({ message: "No alerts found for this user" });
      }
      
      // Select an alert based on type if provided, otherwise random
      const filteredAlerts = type ? alerts.filter(a => a.alertType === type) : alerts;
      const alert = filteredAlerts.length > 0 
        ? filteredAlerts[Math.floor(Math.random() * filteredAlerts.length)]
        : alerts[Math.floor(Math.random() * alerts.length)];
      
      // Create a notification message based on the alert type
      let message = '';
      let triggerValue = value || '0';
      
      switch (alert.alertType) {
        case 'price':
          const priceValue = price || (parseFloat(alert.value) * (alert.condition === 'above' ? 1.05 : 0.95)).toFixed(2);
          triggerValue = priceValue.toString();
          message = `${alert.symbol} price has ${alert.condition === 'above' ? 'risen above' : 'fallen below'} $${alert.value} to $${priceValue}`;
          break;
        case 'technical':
          const indicatorValue = value || (alert.condition === 'above' ? '75' : '25');
          triggerValue = indicatorValue;
          message = `${alert.symbol} ${alert.indicator?.toUpperCase()} has ${alert.condition === 'above' ? 'risen above' : 'fallen below'} ${alert.value} to ${indicatorValue} (${alert.timeframe})`;
          break;
        case 'volume':
          const volumeValue = value || '25000000';
          triggerValue = volumeValue;
          message = `${alert.symbol} trading volume has ${alert.condition === 'above' ? 'exceeded' : 'fallen below'} ${alert.value} to ${volumeValue}`;
          break;
        case 'news':
          message = `Breaking news for ${alert.symbol}: Major announcement affecting stock price`;
          break;
        default:
          message = `Alert triggered for ${alert.symbol}`;
      }
      
      // Create notification
      const notification = {
        triggerId: alert.id,
        userId: DEFAULT_USER_ID,
        symbol: alert.symbol,
        triggeredAt: new Date(),
        triggerValue,
        message,
        status: "delivered" as const,
        notificationChannel: "app" as const
      };
      
      const [insertedNotification] = await db.insert(alertNotifications).values(notification).returning();
      
      // Send notification to connected WebSocket clients
      sendAlertToUser(DEFAULT_USER_ID, insertedNotification);
      
      res.json({
        success: true,
        notification: insertedNotification,
        message: "Notification sent successfully"
      });
    } catch (error) {
      console.error("Error sending demo notification:", error);
      res.status(500).json({ message: "Failed to send notification" });
    }
  });

  // Initialize HTTP server with Express app
  const httpServer = createServer(app);
  
  // Initialize WebSocket server for real-time alerts
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Connected WebSocket clients mapped by user ID
  const connectedClients = new Map<number, WebSocket[]>();
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    // Set the default user ID initially (demo purposes)
    let userId = DEFAULT_USER_ID;
    
    // Add to connected clients
    if (!connectedClients.has(userId)) {
      connectedClients.set(userId, []);
    }
    connectedClients.get(userId)!.push(ws);
    
    // Authenticate user - in a real app, this would verify a token
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        if (data.type === 'authenticate') {
          // In a real app, verify token here
          userId = data.userId || DEFAULT_USER_ID;
          console.log(`Client authenticated as user ${userId}`);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // When client disconnects
    ws.on('close', () => {
      if (connectedClients.has(userId)) {
        const userClients = connectedClients.get(userId)!;
        const index = userClients.indexOf(ws);
        if (index !== -1) {
          userClients.splice(index, 1);
        }
        
        // Clean up empty user entries
        if (userClients.length === 0) {
          connectedClients.delete(userId);
        }
      }
      console.log('WebSocket client disconnected');
    });
    
    // Send initial connection success message
    ws.send(JSON.stringify({ 
      type: 'connection', 
      status: 'connected',
      timestamp: new Date().toISOString()
    }));
  });
  
  // Helper function to send alerts to connected clients
  function sendAlertToUser(userId: number, alertData: any) {
    if (connectedClients.has(userId)) {
      const userClients = connectedClients.get(userId)!;
      
      userClients.forEach(client => {
        // Check if the connection is still open
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'alert',
            data: alertData,
            timestamp: new Date().toISOString()
          }));
        }
      });
    }
  }
  
  // ==== Automated Trading API Endpoints ====
  
  // Get all trading signals for a symbol or set of symbols
  app.get("/api/trading/signals", async (req: Request, res: Response) => {
    try {
      const userId = DEFAULT_USER_ID;
      const symbol = req.query.symbol as string;
      const signalType = req.query.type as string;
      
      if (!symbol) {
        return res.status(400).json({ message: "Symbol is required" });
      }
      
      const signals = [];
      
      // Get signals based on type
      if (!signalType || signalType === 'technical') {
        const technicalSignals = await tradingEngine.generateTechnicalSignals(symbol);
        signals.push(...technicalSignals);
      }
      
      if (!signalType || signalType === 'sentiment') {
        const sentimentSignals = await tradingEngine.generateSentimentSignals(symbol);
        signals.push(...sentimentSignals);
      }
      
      if (!signalType || signalType === 'anomaly') {
        const anomalySignals = await tradingEngine.generateAnomalySignals(symbol);
        signals.push(...anomalySignals);
      }
      
      if (!signalType || signalType === 'monte_carlo') {
        const monteCarloSignals = await tradingEngine.generateMonteCarloSignals(symbol);
        signals.push(...monteCarloSignals);
      }
      
      // If we requested signals for multiple symbols, also check portfolio optimization
      if (symbol.includes(',')) {
        const symbols = symbol.split(',');
        const portfolioSignals = await tradingEngine.generatePortfolioSignals(symbols);
        signals.push(...portfolioSignals);
      }
      
      // Get the combined signal
      const combinedSignal = tradingEngine.combineSignals(signals);
      
      res.json({
        signals,
        combinedSignal,
        count: signals.length
      });
    } catch (error) {
      console.error('Error generating trading signals:', error);
      res.status(500).json({ message: "Failed to generate trading signals" });
    }
  });
  
  // Execute a trade based on a signal
  app.post("/api/trading/execute", async (req: Request, res: Response) => {
    try {
      const userId = DEFAULT_USER_ID;
      const { symbol, direction, confidence, source, metadata } = req.body;
      
      if (!symbol || !direction || !confidence) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Create a trading signal from the request
      const signal: tradingEngine.TradingSignal = {
        symbol,
        direction: direction as 'long' | 'short',
        confidence: parseFloat(confidence),
        source: source as tradingEngine.SignalSource || 'technical',
        metadata: metadata || {}
      };
      
      // Process the signal, which will execute the trade if it passes all checks
      const result = await tradingEngine.processSignal(userId, signal);
      
      if (result) {
        res.json({ 
          success: true,
          message: `Successfully executed ${direction} trade for ${symbol}`,
        });
      } else {
        res.json({ 
          success: false,
          message: "Signal rejected. Check risk parameters or existing positions.",
        });
      }
    } catch (error) {
      console.error('Error executing trade:', error);
      res.status(500).json({ message: "Failed to execute trade" });
    }
  });
  
  // Get all active trading positions
  app.get("/api/trading/positions", async (req: Request, res: Response) => {
    try {
      const userId = DEFAULT_USER_ID;
      const status = req.query.status as string || 'open';
      
      const positions = await storage.getTradingPositions(userId, status);
      
      res.json(positions);
    } catch (error) {
      console.error('Error fetching trading positions:', error);
      res.status(500).json({ message: "Failed to fetch trading positions" });
    }
  });
  
  // Update a trading position (e.g., close position)
  app.put("/api/trading/positions/:id", async (req: Request, res: Response) => {
    try {
      const userId = DEFAULT_USER_ID;
      const positionId = parseInt(req.params.id);
      const { status, exitPrice, pnl } = req.body;
      
      if (!positionId) {
        return res.status(400).json({ message: "Position ID is required" });
      }
      
      // Update the position
      const updatedPosition = await storage.updateTradingPosition(positionId, {
        status: status || 'closed',
        exitDate: new Date(),
        exitPrice: exitPrice || null,
        pnl: pnl || null
      });
      
      // Log the position update
      await storage.createEventLog({
        userId,
        eventType: "position_updated",
        details: {
          positionId,
          status,
          exitPrice,
          pnl,
          timestamp: new Date().toISOString()
        }
      });
      
      res.json(updatedPosition);
    } catch (error) {
      console.error('Error updating trading position:', error);
      res.status(500).json({ message: "Failed to update trading position" });
    }
  });
  
  // Get risk parameters
  app.get("/api/trading/risk", async (req: Request, res: Response) => {
    try {
      // In a real system, these would be stored in the database per user
      // For MVP, return the default risk parameters
      res.json({
        maxPositionSize: 10000,
        maxDrawdown: 0.05,
        maxOpenPositions: 5,
        stopLossPercent: 0.02,
        takeProfitPercent: 0.05
      });
    } catch (error) {
      console.error('Error fetching risk parameters:', error);
      res.status(500).json({ message: "Failed to fetch risk parameters" });
    }
  });
  
  // Update risk parameters
  app.put("/api/trading/risk", async (req: Request, res: Response) => {
    try {
      const userId = DEFAULT_USER_ID;
      const { maxPositionSize, maxDrawdown, maxOpenPositions, stopLossPercent, takeProfitPercent } = req.body;
      
      // In a real system, these would be stored in the database per user
      // For MVP, just acknowledge the update
      
      // Log the risk parameter update
      await storage.createEventLog({
        userId,
        eventType: "risk_parameters_updated",
        details: {
          maxPositionSize,
          maxDrawdown,
          maxOpenPositions,
          stopLossPercent,
          takeProfitPercent,
          timestamp: new Date().toISOString()
        }
      });
      
      res.json({ 
        success: true,
        message: "Risk parameters updated successfully", 
        parameters: {
          maxPositionSize: maxPositionSize || 10000,
          maxDrawdown: maxDrawdown || 0.05,
          maxOpenPositions: maxOpenPositions || 5,
          stopLossPercent: stopLossPercent || 0.02,
          takeProfitPercent: takeProfitPercent || 0.05
        }
      });
    } catch (error) {
      console.error('Error updating risk parameters:', error);
      res.status(500).json({ message: "Failed to update risk parameters" });
    }
  });
  
  /*** Badge System API Endpoints ***/
  
  // Initialize badges (seed default badge definitions)
  app.post("/api/badges/initialize", async (req: Request, res: Response) => {
    try {
      await seedBadgeDefinitions();
      res.json({ success: true, message: "Badge definitions initialized successfully" });
    } catch (error) {
      console.error('Error initializing badges:', error);
      res.status(500).json({ message: "Failed to initialize badge definitions" });
    }
  });
  
  // Get all badge definitions
  app.get("/api/badges/definitions", async (req: Request, res: Response) => {
    try {
      const { category } = req.query;
      const badges = await storage.getBadgeDefinitions(category as string | undefined);
      res.json(badges);
    } catch (error) {
      console.error('Error getting badge definitions:', error);
      res.status(500).json({ message: "Failed to get badge definitions" });
    }
  });
  
  // Get user badges
  app.get("/api/user/badges", async (req: Request, res: Response) => {
    try {
      const userBadges = await badgeService.getUserBadges(DEFAULT_USER_ID);
      
      // Get badge details for each user badge
      const detailedBadges = await Promise.all(
        userBadges.map(async (userBadge) => {
          const badgeDefinition = await storage.getBadgeDefinition(userBadge.badgeId);
          return {
            ...userBadge,
            badgeDetails: badgeDefinition
          };
        })
      );
      
      res.json(detailedBadges);
    } catch (error) {
      console.error('Error getting user badges:', error);
      res.status(500).json({ message: "Failed to get user badges" });
    }
  });
  
  // Test route for simulating trade completion and badge awarding
  app.post("/api/testing/simulate-trade", async (req: Request, res: Response) => {
    try {
      const userId = DEFAULT_USER_ID;
      const { symbol, entryPrice, exitPrice, quantity, direction, pnl } = req.body;
      
      // Create a test trading position
      const position = await storage.createTradingPosition({
        userId,
        symbol,
        status: 'closed',
        entryPrice,
        exitPrice,
        quantity,
        direction,
        pnl,
        entryDate: new Date(),
        exitDate: new Date(),
        metadata: {}
      });
      
      // Check if any badges should be awarded
      const awardedBadges = await badgeService.checkPositionForBadges(userId, position);
      
      // Update goal progress
      await goalService.updateGoalProgress(userId, position);
      
      res.json({ 
        success: true, 
        position,
        awardedBadges,
        message: `Trade simulated successfully. Awarded ${awardedBadges.length} badges.`
      });
    } catch (error) {
      console.error("Error simulating trade:", error);
      res.status(500).json({ message: "Failed to simulate trade", error: String(error) });
    }
  });
  
  // Mark a badge as seen
  app.post("/api/user/badges/:id/seen", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const badgeId = parseInt(id);
      
      if (isNaN(badgeId)) {
        return res.status(400).json({ message: "Invalid badge ID" });
      }
      
      const updatedBadge = await badgeService.markBadgeAsSeen(badgeId);
      res.json(updatedBadge);
    } catch (error) {
      console.error('Error marking badge as seen:', error);
      res.status(500).json({ message: "Failed to mark badge as seen" });
    }
  });
  
  // Award a badge (for testing purposes)
  app.post("/api/user/badges/award", async (req: Request, res: Response) => {
    try {
      const { badgeCode } = req.body;
      
      if (!badgeCode) {
        return res.status(400).json({ message: "Badge code is required" });
      }
      
      const newBadge = await badgeService.awardBadge(DEFAULT_USER_ID, badgeCode);
      
      if (!newBadge) {
        return res.status(400).json({ message: `Failed to award badge ${badgeCode}` });
      }
      
      res.json(newBadge);
    } catch (error) {
      console.error('Error awarding badge:', error);
      res.status(500).json({ message: "Failed to award badge" });
    }
  });
  
  /*** Trading Goals API Endpoints ***/
  
  // Get user trading goals
  app.get("/api/user/goals", async (req: Request, res: Response) => {
    try {
      const { completed } = req.query;
      const isCompleted = completed === "true" ? true : 
                        completed === "false" ? false : undefined;
      
      const goals = await goalService.getUserGoals(DEFAULT_USER_ID, isCompleted);
      res.json(goals);
    } catch (error) {
      console.error('Error getting trading goals:', error);
      res.status(500).json({ message: "Failed to get trading goals" });
    }
  });
  
  // Create a new trading goal
  app.post("/api/user/goals", async (req: Request, res: Response) => {
    try {
      const goalData = req.body;
      
      // Validate goal data
      const validatedGoal = insertTradingGoalSchema.parse({
        ...goalData,
        userId: DEFAULT_USER_ID,
        isCompleted: false
      });
      
      const newGoal = await goalService.createGoal(validatedGoal);
      res.status(201).json(newGoal);
    } catch (error) {
      console.error('Error creating trading goal:', error);
      res.status(500).json({ message: "Failed to create trading goal" });
    }
  });
  
  // Update a trading goal
  app.patch("/api/user/goals/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const goalId = parseInt(id);
      
      if (isNaN(goalId)) {
        return res.status(400).json({ message: "Invalid goal ID" });
      }
      
      const goal = await goalService.getGoal(goalId);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      if (goal.userId !== DEFAULT_USER_ID) {
        return res.status(403).json({ message: "Not authorized to update this goal" });
      }
      
      const updatedGoal = await goalService.updateGoal(goalId, req.body);
      res.json(updatedGoal);
    } catch (error) {
      console.error('Error updating trading goal:', error);
      res.status(500).json({ message: "Failed to update trading goal" });
    }
  });
  
  // Complete a trading goal
  app.post("/api/user/goals/:id/complete", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const goalId = parseInt(id);
      
      if (isNaN(goalId)) {
        return res.status(400).json({ message: "Invalid goal ID" });
      }
      
      const goal = await goalService.getGoal(goalId);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      if (goal.userId !== DEFAULT_USER_ID) {
        return res.status(403).json({ message: "Not authorized to complete this goal" });
      }
      
      if (goal.isCompleted) {
        return res.status(400).json({ message: "Goal is already completed" });
      }
      
      const completedGoal = await goalService.completeGoal(goalId);
      res.json(completedGoal);
    } catch (error) {
      console.error('Error completing trading goal:', error);
      res.status(500).json({ message: "Failed to complete trading goal" });
    }
  });
  
  // Create default goals for user
  app.post("/api/user/goals/defaults", async (req: Request, res: Response) => {
    try {
      const defaultGoals = await goalService.createDefaultGoals(DEFAULT_USER_ID);
      res.status(201).json(defaultGoals);
    } catch (error) {
      console.error('Error creating default goals:', error);
      res.status(500).json({ message: "Failed to create default goals" });
    }
  });
  
  // Get event logs for user
  app.get("/api/user/events", async (req: Request, res: Response) => {
    try {
      const { type, limit } = req.query;
      const parsedLimit = limit ? parseInt(limit as string) : 20;
      
      let events;
      
      if (type === 'badge') {
        events = await eventService.getBadgeEvents(DEFAULT_USER_ID, parsedLimit);
      } else if (type === 'goal') {
        events = await eventService.getGoalEvents(DEFAULT_USER_ID, parsedLimit);
      } else if (type) {
        events = await eventService.getEventLogsByType(DEFAULT_USER_ID, type as string, parsedLimit);
      } else {
        events = await eventService.getRecentEventLogs(DEFAULT_USER_ID, parsedLimit);
      }
      
      res.json(events);
    } catch (error) {
      console.error('Error getting event logs:', error);
      res.status(500).json({ message: "Failed to get event logs" });
    }
  });
  
  // Broker authentication endpoints
  // Zerodha authentication
  app.post("/api/broker/zerodha/auth", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username and password are required" });
      }
      
      const result = await import("./services/brokerAuth").then(
        module => module.zerodhaAuth(username, password)
      );
      
      res.json(result);
    } catch (error) {
      console.error("Zerodha auth error:", error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Authentication failed" 
      });
    }
  });
  
  app.post("/api/broker/zerodha/verify", async (req: Request, res: Response) => {
    try {
      const { username, pin } = req.body;
      
      if (!username || !pin) {
        return res.status(400).json({ success: false, message: "Username and PIN are required" });
      }
      
      const result = await import("./services/brokerAuth").then(
        module => module.zerodhaVerify(username, pin)
      );
      
      res.json(result);
    } catch (error) {
      console.error("Zerodha verification error:", error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Verification failed" 
      });
    }
  });
  
  // Angel One authentication
  app.post("/api/broker/angel/auth", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username and password are required" });
      }
      
      const result = await import("./services/brokerAuth").then(
        module => module.angelAuth(username, password)
      );
      
      res.json(result);
    } catch (error) {
      console.error("Angel auth error:", error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Authentication failed" 
      });
    }
  });
  
  app.post("/api/broker/angel/verify", async (req: Request, res: Response) => {
    try {
      const { username, totp } = req.body;
      
      if (!username || !totp) {
        return res.status(400).json({ success: false, message: "Username and TOTP are required" });
      }
      
      const result = await import("./services/brokerAuth").then(
        module => module.angelVerify(username, totp)
      );
      
      res.json(result);
    } catch (error) {
      console.error("Angel verification error:", error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Verification failed" 
      });
    }
  });
  
  // Get broker connections
  app.get("/api/broker/connections", async (req: Request, res: Response) => {
    try {
      const connections = await storage.getBrokerConnections(DEFAULT_USER_ID);
      
      // Format connections for the frontend
      const formattedConnections = connections.map(conn => ({
        id: conn.id,
        broker: conn.broker,
        isActive: !!conn.isActive,
        lastUpdated: conn.updatedAt || conn.createdAt,
        metadata: conn.metadata || {}
      }));
      
      res.json(formattedConnections);
    } catch (error) {
      console.error("Get broker connections error:", error);
      res.status(500).json({ message: "Failed to get broker connections" });
    }
  });
  
  // Disconnect broker
  app.post("/api/broker/disconnect/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const result = await import("./services/brokerAuth").then(
        module => module.disconnectBroker(parseInt(id))
      );
      
      if (result.success) {
        res.json({ success: true });
      } else {
        res.status(400).json({ success: false, message: result.message });
      }
    } catch (error) {
      console.error("Broker disconnect error:", error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to disconnect broker" 
      });
    }
  });

  // Initialize database with seed data
  app.post("/api/database/seed", async (req: Request, res: Response) => {
    try {
      // Seed badges
      await seedBadgeDefinitions();
      
      // Create default goals for the user
      await goalService.createDefaultGoals(DEFAULT_USER_ID);
      
      res.json({ success: true, message: "Database seeded successfully" });
    } catch (error) {
      console.error('Error seeding database:', error);
      res.status(500).json({ message: "Failed to seed database" });
    }
  });
  
  /*** Auto-Trade Configuration Routes ***/
  
  // Get all auto-trade configurations for a user
  app.get("/api/auto-trade/configs", async (req: Request, res: Response) => {
    try {
      const configs = await storage.getAutoTradeConfigs(DEFAULT_USER_ID);
      res.json(configs);
    } catch (error) {
      console.error("Error fetching auto-trade configs:", error);
      res.status(500).json({ message: "Failed to fetch auto-trade configurations" });
    }
  });
  
  // Get a specific auto-trade configuration
  app.get("/api/auto-trade/configs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const configId = parseInt(id, 10);
      
      if (isNaN(configId)) {
        return res.status(400).json({ message: "Invalid configuration ID" });
      }
      
      const config = await storage.getAutoTradeConfig(configId);
      
      if (!config) {
        return res.status(404).json({ message: "Auto-trade configuration not found" });
      }
      
      if (config.userId !== DEFAULT_USER_ID) {
        return res.status(403).json({ message: "Unauthorized access to configuration" });
      }
      
      res.json(config);
    } catch (error) {
      console.error("Error fetching auto-trade config:", error);
      res.status(500).json({ message: "Failed to fetch auto-trade configuration" });
    }
  });
  
  // Create a new auto-trade configuration
  app.post("/api/auto-trade/configs", async (req: Request, res: Response) => {
    try {
      const configData = req.body;
      
      if (!configData.name || !configData.symbols || !configData.signalSources) {
        return res.status(400).json({ message: "Missing required configuration fields" });
      }
      
      const autoTradeConfig = await storage.createAutoTradeConfig({
        userId: DEFAULT_USER_ID,
        name: configData.name,
        symbols: configData.symbols,
        signalSources: configData.signalSources,
        minConfidence: configData.minConfidence || 0.7,
        maxPositions: configData.maxPositions || 5,
        checkInterval: configData.checkInterval || 15, // minutes
        riskParameters: configData.riskParameters || {
          maxPositionSize: 0.1,      // 10% of portfolio per position
          maxDrawdown: 0.05,         // 5% max drawdown
          stopLossPercent: 0.02,     // 2% stop loss
          takeProfitPercent: 0.05    // 5% take profit
        },
        enabled: configData.enabled || false,
        metadata: configData.metadata || {},
        lastCheckTime: null,
        lastTradeTime: null
      });
      
      // Log the event
      await storage.createEventLog({
        userId: DEFAULT_USER_ID,
        eventType: "auto_trade_config_created",
        details: {
          configId: autoTradeConfig.id,
          name: autoTradeConfig.name,
          timestamp: new Date().toISOString()
        }
      });
      
      res.status(201).json(autoTradeConfig);
    } catch (error) {
      console.error("Error creating auto-trade config:", error);
      res.status(500).json({ message: "Failed to create auto-trade configuration" });
    }
  });
  
  // Update an auto-trade configuration
  app.put("/api/auto-trade/configs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const configId = parseInt(id, 10);
      const updateData = req.body;
      
      if (isNaN(configId)) {
        return res.status(400).json({ message: "Invalid configuration ID" });
      }
      
      // Check if the config exists and belongs to the user
      const existingConfig = await storage.getAutoTradeConfig(configId);
      
      if (!existingConfig) {
        return res.status(404).json({ message: "Auto-trade configuration not found" });
      }
      
      if (existingConfig.userId !== DEFAULT_USER_ID) {
        return res.status(403).json({ message: "Unauthorized access to configuration" });
      }
      
      const updatedConfig = await storage.updateAutoTradeConfig(configId, updateData);
      
      // Log the event
      await storage.createEventLog({
        userId: DEFAULT_USER_ID,
        eventType: "auto_trade_config_updated",
        details: {
          configId: updatedConfig.id,
          name: updatedConfig.name,
          timestamp: new Date().toISOString()
        }
      });
      
      res.json(updatedConfig);
    } catch (error) {
      console.error("Error updating auto-trade config:", error);
      res.status(500).json({ message: "Failed to update auto-trade configuration" });
    }
  });
  
  // Enable/disable an auto-trade configuration
  app.patch("/api/auto-trade/configs/:id/toggle", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const configId = parseInt(id, 10);
      const { enabled } = req.body;
      
      if (isNaN(configId)) {
        return res.status(400).json({ message: "Invalid configuration ID" });
      }
      
      if (enabled === undefined) {
        return res.status(400).json({ message: "Enabled status is required" });
      }
      
      // Check if the config exists and belongs to the user
      const existingConfig = await storage.getAutoTradeConfig(configId);
      
      if (!existingConfig) {
        return res.status(404).json({ message: "Auto-trade configuration not found" });
      }
      
      if (existingConfig.userId !== DEFAULT_USER_ID) {
        return res.status(403).json({ message: "Unauthorized access to configuration" });
      }
      
      const updatedConfig = await storage.toggleAutoTradeConfig(configId, enabled);
      
      // Start or stop the auto-trade scheduler based on the enabled status
      if (enabled) {
        const started = await autoTradeScheduler.startAutoTradeScheduler({
          userId: updatedConfig.userId,
          enabled: true,
          symbols: updatedConfig.symbols as string[],
          signalSources: updatedConfig.signalSources as string[],
          minConfidence: updatedConfig.minConfidence,
          maxPositions: updatedConfig.maxPositions,
          checkInterval: updatedConfig.checkInterval,
          riskParameters: updatedConfig.riskParameters as any
        });
        
        if (!started) {
          return res.status(500).json({ message: "Failed to start auto-trade scheduler" });
        }
      } else {
        autoTradeScheduler.stopAutoTradeScheduler(updatedConfig.userId);
      }
      
      // Log the event
      await storage.createEventLog({
        userId: DEFAULT_USER_ID,
        eventType: enabled ? "auto_trade_enabled" : "auto_trade_disabled",
        details: {
          configId: updatedConfig.id,
          name: updatedConfig.name,
          timestamp: new Date().toISOString()
        }
      });
      
      res.json(updatedConfig);
    } catch (error) {
      console.error("Error toggling auto-trade config:", error);
      res.status(500).json({ message: "Failed to toggle auto-trade configuration" });
    }
  });
  
  // Delete an auto-trade configuration
  app.delete("/api/auto-trade/configs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const configId = parseInt(id, 10);
      
      if (isNaN(configId)) {
        return res.status(400).json({ message: "Invalid configuration ID" });
      }
      
      // Check if the config exists and belongs to the user
      const existingConfig = await storage.getAutoTradeConfig(configId);
      
      if (!existingConfig) {
        return res.status(404).json({ message: "Auto-trade configuration not found" });
      }
      
      if (existingConfig.userId !== DEFAULT_USER_ID) {
        return res.status(403).json({ message: "Unauthorized access to configuration" });
      }
      
      // If the auto-trade is enabled, stop it first
      if (existingConfig.enabled) {
        autoTradeScheduler.stopAutoTradeScheduler(existingConfig.userId);
      }
      
      // For now, we're just updating the configuration as disabled instead of deleting it
      // This allows us to keep a record of past configurations
      const updatedConfig = await storage.updateAutoTradeConfig(configId, {
        enabled: false,
        metadata: {
          ...existingConfig.metadata as any,
          deletedAt: new Date().toISOString(),
          isDeleted: true
        }
      });
      
      // Log the event
      await storage.createEventLog({
        userId: DEFAULT_USER_ID,
        eventType: "auto_trade_config_deleted",
        details: {
          configId: updatedConfig.id,
          name: updatedConfig.name,
          timestamp: new Date().toISOString()
        }
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting auto-trade config:", error);
      res.status(500).json({ message: "Failed to delete auto-trade configuration" });
    }
  });
  
  return httpServer;
}
