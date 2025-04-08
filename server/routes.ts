import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { storage } from "./storage";
import { insertChatMessageSchema, insertContextMemorySchema, insertAlertTriggerSchema } from "@shared/schema";
import { z } from "zod";
import { analyzeSentiment } from "./services/sentimentAnalysis";
import { getTechnicalAnalysis } from "./services/technicalAnalysis";
import { getCorporateActions } from "./services/corporateActions";
import { getMarketData } from "./services/marketData";
import { getAnthropicCompletion } from "./services/anthropic";
import { connectBroker, getBrokerData } from "./services/broker";
import { saveToMemory, retrieveFromMemory } from "./services/mcp";
// New AI and Mathematical Models
import { optimizePortfolio } from "./services/portfolioOptimization";
import { runMonteCarloSimulation, simulateStrategy } from "./services/monteCarloSimulation";
import { detectAnomalies } from "./services/anomalyDetection";
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
      const volatility = technicalData.atr ? technicalData.atr.current / entryPrice : 0.02;
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
      
      res.json({
        triggered: triggeredAlerts.length > 0,
        count: triggeredAlerts.length,
        alerts: triggeredAlerts
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to simulate price alert" });
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
  
  return httpServer;
}
