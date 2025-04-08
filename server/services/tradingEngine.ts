/**
 * Trading Engine Service
 * 
 * This service handles the automatic execution of trades based on signals
 * from various sources like technical analysis, mathematical models, and alerts.
 */

import { storage } from "../storage";
import { db } from "../db";
import { tradingPositions, eventLogs } from "@shared/schema";
import { eq } from "drizzle-orm";
import { getTechnicalAnalysis } from "./technicalAnalysis";
import { analyzeSentiment } from "./sentimentAnalysis";
import { getBrokerData, placeBrokerOrder } from "./broker";
import { optimizePortfolio } from "./portfolioOptimization";
import { runMonteCarloSimulation } from "./monteCarloSimulation";
import { detectAnomalies } from "./anomalyDetection";

// Types of trading signals
export type SignalSource = 'technical' | 'sentiment' | 'portfolio' | 'monte_carlo' | 'anomaly' | 'alert';

export interface TradingSignal {
  symbol: string;
  direction: 'long' | 'short';
  confidence: number; // 0-1 scale
  source: SignalSource;
  metadata: {
    price?: number;
    stopLoss?: number;
    takeProfit?: number;
    expiryTime?: Date;
    indicator?: string;
    value?: number;
    reason?: string;
  };
}

export interface TradeParameters {
  symbol: string;
  direction: 'long' | 'short';
  quantity: number;
  price?: number; // For limit orders
  stopLoss?: number;
  takeProfit?: number;
  orderType: 'market' | 'limit';
  metadata?: Record<string, any>; // Additional details to save
}

export interface RiskParameters {
  maxPositionSize: number; // Maximum amount to risk per position
  maxDrawdown: number; // Maximum account drawdown before stopping
  maxOpenPositions: number; // Max simultaneous open positions
  stopLossPercent: number; // Default stop loss percentage
  takeProfitPercent: number; // Default take profit percentage
}

// Default risk parameters
const DEFAULT_RISK_PARAMETERS: RiskParameters = {
  maxPositionSize: 10000, // $10,000 max per position
  maxDrawdown: 0.05, // 5% account drawdown before stopping
  maxOpenPositions: 5,
  stopLossPercent: 0.02, // 2% stop loss
  takeProfitPercent: 0.05, // 5% take profit
};

/**
 * Process a trading signal and determine if a trade should be executed
 */
export async function processSignal(
  userId: number, 
  signal: TradingSignal, 
  riskParams: RiskParameters = DEFAULT_RISK_PARAMETERS
): Promise<boolean> {
  try {
    console.log(`Processing signal for ${signal.symbol}, direction: ${signal.direction}, confidence: ${signal.confidence}`);
    
    // Skip low confidence signals
    if (signal.confidence < 0.6) {
      console.log(`Signal rejected - low confidence: ${signal.confidence}`);
      return false;
    }
    
    // Check number of open positions
    const openPositions = await db.select()
      .from(tradingPositions)
      .where(eq(tradingPositions.userId, userId))
      .where(eq(tradingPositions.status, 'open'));
    
    if (openPositions.length >= riskParams.maxOpenPositions) {
      console.log(`Signal rejected - maximum open positions (${riskParams.maxOpenPositions}) reached`);
      
      // Log the rejected signal
      await db.insert(eventLogs).values({
        userId,
        eventType: 'signal_rejected',
        details: {
          reason: 'max_positions_reached',
          signal
        },
        createdAt: new Date()
      });
      
      return false;
    }
    
    // Check if we already have a position for this symbol
    const existingPosition = openPositions.find(p => p.symbol === signal.symbol);
    if (existingPosition) {
      console.log(`Signal rejected - already have an open position for ${signal.symbol}`);
      
      // Log the rejected signal
      await db.insert(eventLogs).values({
        userId,
        eventType: 'signal_rejected',
        details: {
          reason: 'position_exists',
          signal,
          positionId: existingPosition.id
        },
        createdAt: new Date()
      });
      
      return false;
    }
    
    // Calculate position size based on confidence and max position size
    const positionSize = Math.min(
      riskParams.maxPositionSize * signal.confidence,
      riskParams.maxPositionSize
    );
    
    // Get current market price
    const marketData = await getBrokerData(userId, 'quote', { symbol: signal.symbol });
    const currentPrice = marketData?.price || signal.metadata.price;
    
    if (!currentPrice) {
      console.log(`Signal rejected - unable to determine current price for ${signal.symbol}`);
      return false;
    }
    
    // Calculate quantity based on position size and price
    const quantity = Math.floor(positionSize / currentPrice);
    
    if (quantity <= 0) {
      console.log(`Signal rejected - calculated quantity is 0 for ${signal.symbol}`);
      return false;
    }
    
    // Calculate stop loss and take profit if not provided
    const stopLoss = signal.metadata.stopLoss || 
      (signal.direction === 'long' 
        ? currentPrice * (1 - riskParams.stopLossPercent)
        : currentPrice * (1 + riskParams.stopLossPercent));
    
    const takeProfit = signal.metadata.takeProfit ||
      (signal.direction === 'long'
        ? currentPrice * (1 + riskParams.takeProfitPercent)
        : currentPrice * (1 - riskParams.takeProfitPercent));
    
    // Create trade parameters
    const tradeParams: TradeParameters = {
      symbol: signal.symbol,
      direction: signal.direction,
      quantity,
      price: currentPrice,
      stopLoss,
      takeProfit,
      orderType: 'market', // Default to market orders
      metadata: {
        signalSource: signal.source,
        confidence: signal.confidence,
        reason: signal.metadata.reason || `Signal from ${signal.source}`
      }
    };
    
    // Execute the trade
    const success = await executeTrade(userId, tradeParams);
    
    if (success) {
      console.log(`Trade executed successfully for ${signal.symbol}`);
      
      // Log successful trade
      await db.insert(eventLogs).values({
        userId,
        eventType: 'trade_executed',
        details: {
          signal,
          trade: tradeParams
        },
        createdAt: new Date()
      });
    }
    
    return success;
  } catch (error) {
    console.error('Error processing trading signal:', error);
    
    // Log error
    await db.insert(eventLogs).values({
      userId,
      eventType: 'signal_error',
      details: {
        error: error.message,
        signal
      },
      createdAt: new Date()
    });
    
    return false;
  }
}

/**
 * Execute a trade with the given parameters
 */
export async function executeTrade(userId: number, params: TradeParameters): Promise<boolean> {
  try {
    console.log(`Executing ${params.direction} trade for ${params.symbol}, quantity: ${params.quantity}`);
    
    // Get the broker connections for this user
    const brokerConnections = await storage.getBrokerConnections(userId);
    
    if (brokerConnections.length === 0 || !brokerConnections.some(conn => conn.isActive)) {
      console.log('No active broker connections found');
      return false;
    }
    
    // Default to the first active broker connection
    const brokerConnection = brokerConnections.find(conn => conn.isActive) || brokerConnections[0];
    
    // Place the order through the broker service
    const orderResult = await placeBrokerOrder(userId, {
      broker: brokerConnection.broker,
      symbol: params.symbol,
      quantity: params.quantity,
      orderType: params.orderType,
      direction: params.direction,
      price: params.price,
      stopLoss: params.stopLoss,
      takeProfit: params.takeProfit
    });
    
    if (!orderResult.success) {
      console.log(`Order placement failed: ${orderResult.message}`);
      return false;
    }
    
    // Record the position in our database
    const position = await storage.createTradingPosition({
      userId,
      symbol: params.symbol,
      direction: params.direction,
      entryPrice: params.price?.toString() || orderResult.filledPrice?.toString() || '0',
      quantity: params.quantity,
      status: 'open',
      entryDate: new Date(),
      metadata: {
        orderId: orderResult.orderId,
        broker: brokerConnection.broker,
        stopLoss: params.stopLoss,
        takeProfit: params.takeProfit,
        ...params.metadata
      }
    });
    
    console.log(`Position recorded with ID: ${position.id}`);
    return true;
  } catch (error) {
    console.error('Error executing trade:', error);
    return false;
  }
}

/**
 * Generate trading signals based on technical analysis
 */
export async function generateTechnicalSignals(symbol: string): Promise<TradingSignal[]> {
  try {
    const technicalData = await getTechnicalAnalysis(symbol);
    const signals: TradingSignal[] = [];
    
    // RSI signals
    if (technicalData.rsi < 30) {
      // Oversold - bullish signal
      signals.push({
        symbol,
        direction: 'long',
        confidence: (30 - technicalData.rsi) / 30, // Higher confidence when more oversold
        source: 'technical',
        metadata: {
          indicator: 'rsi',
          value: technicalData.rsi,
          reason: `RSI is oversold at ${technicalData.rsi.toFixed(2)}`
        }
      });
    } else if (technicalData.rsi > 70) {
      // Overbought - bearish signal
      signals.push({
        symbol,
        direction: 'short',
        confidence: (technicalData.rsi - 70) / 30, // Higher confidence when more overbought
        source: 'technical',
        metadata: {
          indicator: 'rsi',
          value: technicalData.rsi,
          reason: `RSI is overbought at ${technicalData.rsi.toFixed(2)}`
        }
      });
    }
    
    // MACD signals
    if (technicalData.macd.histogram > 0 && technicalData.macd.histogram > technicalData.macd.previous) {
      // Bullish momentum
      signals.push({
        symbol,
        direction: 'long',
        confidence: Math.min(0.8, technicalData.macd.histogram / 2),
        source: 'technical',
        metadata: {
          indicator: 'macd',
          value: technicalData.macd.histogram,
          reason: `MACD histogram is positive and increasing (${technicalData.macd.histogram.toFixed(2)})`
        }
      });
    } else if (technicalData.macd.histogram < 0 && technicalData.macd.histogram < technicalData.macd.previous) {
      // Bearish momentum
      signals.push({
        symbol,
        direction: 'short',
        confidence: Math.min(0.8, Math.abs(technicalData.macd.histogram) / 2),
        source: 'technical',
        metadata: {
          indicator: 'macd',
          value: technicalData.macd.histogram,
          reason: `MACD histogram is negative and decreasing (${technicalData.macd.histogram.toFixed(2)})`
        }
      });
    }
    
    // Moving average crossovers
    if (technicalData.sma50 > technicalData.sma200 && 
        technicalData.previousSma50 <= technicalData.previousSma200) {
      // Golden cross - strong bullish
      signals.push({
        symbol,
        direction: 'long',
        confidence: 0.9,
        source: 'technical',
        metadata: {
          indicator: 'moving_average_crossover',
          value: technicalData.sma50,
          reason: 'Golden cross: 50-day SMA crossed above 200-day SMA'
        }
      });
    } else if (technicalData.sma50 < technicalData.sma200 && 
              technicalData.previousSma50 >= technicalData.previousSma200) {
      // Death cross - strong bearish
      signals.push({
        symbol,
        direction: 'short',
        confidence: 0.9,
        source: 'technical',
        metadata: {
          indicator: 'moving_average_crossover',
          value: technicalData.sma50,
          reason: 'Death cross: 50-day SMA crossed below 200-day SMA'
        }
      });
    }
    
    return signals;
  } catch (error) {
    console.error('Error generating technical signals:', error);
    return [];
  }
}

/**
 * Generate trading signals based on sentiment analysis
 */
export async function generateSentimentSignals(symbol: string): Promise<TradingSignal[]> {
  try {
    const sentimentData = await analyzeSentiment(symbol);
    const signals: TradingSignal[] = [];
    
    // Only generate signals for strong sentiment
    if (sentimentData.overall.score > 70) {
      signals.push({
        symbol,
        direction: 'long',
        confidence: sentimentData.overall.score / 100,
        source: 'sentiment',
        metadata: {
          value: sentimentData.overall.score,
          reason: `Highly positive sentiment score of ${sentimentData.overall.score}`
        }
      });
    } else if (sentimentData.overall.score < 30) {
      signals.push({
        symbol,
        direction: 'short',
        confidence: (100 - sentimentData.overall.score) / 100,
        source: 'sentiment',
        metadata: {
          value: sentimentData.overall.score,
          reason: `Highly negative sentiment score of ${sentimentData.overall.score}`
        }
      });
    }
    
    return signals;
  } catch (error) {
    console.error('Error generating sentiment signals:', error);
    return [];
  }
}

/**
 * Generate trading signals based on anomaly detection
 */
export async function generateAnomalySignals(symbol: string): Promise<TradingSignal[]> {
  try {
    const anomalyResult = await detectAnomalies({
      symbol,
      lookbackPeriod: 60,
      sensitivityLevel: 'medium',
      includeVolume: true,
      includeGaps: true,
      includeVolatility: true
    });
    
    const signals: TradingSignal[] = [];
    
    // Process each trading opportunity from anomaly detection
    anomalyResult.tradingOpportunities.forEach(opportunity => {
      const direction = opportunity.type === 'mean_reversion' 
        ? (opportunity.relatedAnomaly.value > opportunity.relatedAnomaly.expectedRange[1] ? 'short' : 'long')
        : (opportunity.type === 'trend_continuation' ? 'long' : 'short');
      
      // Only add high potential opportunities
      if (opportunity.potentialGain > 0.03) { // 3% or more potential gain
        signals.push({
          symbol,
          direction,
          confidence: Math.min(0.8, opportunity.potentialGain), // Cap confidence at 0.8
          source: 'anomaly',
          metadata: {
            reason: opportunity.description,
            value: opportunity.relatedAnomaly.value
          }
        });
      }
    });
    
    return signals;
  } catch (error) {
    console.error('Error generating anomaly signals:', error);
    return [];
  }
}

/**
 * Generate trading signals from Monte Carlo simulations
 */
export async function generateMonteCarloSignals(
  symbol: string, 
  initialInvestment: number = 10000
): Promise<TradingSignal[]> {
  try {
    // Get technical data first for baseline
    const technicalData = await getTechnicalAnalysis(symbol);
    
    // Run Monte Carlo simulation
    const result = runMonteCarloSimulation({
      initialInvestment,
      timeHorizonDays: 30, // 30-day horizon
      numSimulations: 1000,
      assets: [{
        symbol,
        weight: 1,
        expectedAnnualReturn: 0.15, // 15% annual return expectation
        annualVolatility: 0.25 // 25% volatility
      }],
      confidenceInterval: 0.95,
      drawdownThreshold: 0.1 // 10% drawdown threshold
    });
    
    const signals: TradingSignal[] = [];
    
    // Generate signal if success probability is high
    if (result.successProbability > 0.65) {
      signals.push({
        symbol,
        direction: 'long',
        confidence: result.successProbability,
        source: 'monte_carlo',
        metadata: {
          reason: `Monte Carlo simulation shows ${(result.successProbability * 100).toFixed(1)}% probability of profit`,
          value: result.expectedValue
        }
      });
    } else if (result.drawdownStats.exceedanceProbability > 0.6) {
      // High probability of significant drawdown - short signal
      signals.push({
        symbol,
        direction: 'short',
        confidence: result.drawdownStats.exceedanceProbability,
        source: 'monte_carlo',
        metadata: {
          reason: `Monte Carlo simulation shows ${(result.drawdownStats.exceedanceProbability * 100).toFixed(1)}% probability of significant drawdown`,
          value: result.drawdownStats.max
        }
      });
    }
    
    return signals;
  } catch (error) {
    console.error('Error generating Monte Carlo signals:', error);
    return [];
  }
}

/**
 * Generate trading signals from portfolio optimization
 */
export async function generatePortfolioSignals(symbols: string[]): Promise<TradingSignal[]> {
  try {
    const optimizationResult = await optimizePortfolio({
      riskTolerance: 'moderate', 
      investmentHorizon: 'medium',
      assets: symbols
    });
    
    const signals: TradingSignal[] = [];
    
    // Generate signals based on optimal weights
    optimizationResult.allocations.forEach(allocation => {
      if (allocation.optimalWeight > 0.2) { // Only care about significant allocations
        signals.push({
          symbol: allocation.symbol,
          direction: 'long',
          confidence: allocation.optimalWeight, // Higher weight = higher confidence
          source: 'portfolio',
          metadata: {
            reason: `Portfolio optimization suggests ${(allocation.optimalWeight * 100).toFixed(1)}% allocation`,
            value: allocation.optimalWeight
          }
        });
      } else if (allocation.optimalWeight < 0.05 && allocation.currentWeight > 0.1) {
        // Significantly reduced allocation compared to current - could be a sell signal
        signals.push({
          symbol: allocation.symbol,
          direction: 'short',
          confidence: 1 - (allocation.optimalWeight / allocation.currentWeight),
          source: 'portfolio',
          metadata: {
            reason: `Portfolio optimization suggests reducing position from ${(allocation.currentWeight * 100).toFixed(1)}% to ${(allocation.optimalWeight * 100).toFixed(1)}%`,
            value: allocation.optimalWeight
          }
        });
      }
    });
    
    return signals;
  } catch (error) {
    console.error('Error generating portfolio signals:', error);
    return [];
  }
}

/**
 * Process multiple signals into a single decision, considering
 * the combined strength of signals.
 */
export function combineSignals(signals: TradingSignal[]): TradingSignal | null {
  if (signals.length === 0) return null;
  
  // Group signals by symbol and direction
  const groupedSignals: Record<string, Record<string, TradingSignal[]>> = {};
  
  signals.forEach(signal => {
    if (!groupedSignals[signal.symbol]) {
      groupedSignals[signal.symbol] = { long: [], short: [] };
    }
    
    groupedSignals[signal.symbol][signal.direction].push(signal);
  });
  
  // Find the symbol with the strongest signal
  let bestSymbol = '';
  let bestDirection: 'long' | 'short' = 'long';
  let bestScore = 0;
  
  Object.entries(groupedSignals).forEach(([symbol, directions]) => {
    // Calculate score for long signals
    const longScore = directions.long.reduce((score, signal) => {
      return score + signal.confidence;
    }, 0);
    
    // Calculate score for short signals
    const shortScore = directions.short.reduce((score, signal) => {
      return score + signal.confidence;
    }, 0);
    
    // Determine which direction has a stronger signal
    if (longScore > shortScore && longScore > bestScore) {
      bestSymbol = symbol;
      bestDirection = 'long';
      bestScore = longScore;
    } else if (shortScore > longScore && shortScore > bestScore) {
      bestSymbol = symbol;
      bestDirection = 'short';
      bestScore = shortScore;
    }
  });
  
  // If we didn't find a strong enough signal, return null
  if (bestScore < 1.5) return null;
  
  // Combine the signals for the best symbol and direction
  const signalsToMerge = groupedSignals[bestSymbol][bestDirection];
  
  // Calculate average confidence, capped at 0.95
  const avgConfidence = Math.min(0.95, signalsToMerge.reduce((sum, s) => sum + s.confidence, 0) / signalsToMerge.length);
  
  // Collect reasons from all signals
  const reasons = signalsToMerge.map(s => s.metadata.reason || 'Unknown reason').join('; ');
  
  // Return combined signal
  return {
    symbol: bestSymbol,
    direction: bestDirection,
    confidence: avgConfidence,
    source: 'combined',
    metadata: {
      reason: `Combined signal based on multiple indicators: ${reasons}`,
      sources: signalsToMerge.map(s => s.source)
    }
  };
}