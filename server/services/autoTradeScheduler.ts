/**
 * Auto-Trade Scheduler Service
 * 
 * Manages scheduled automated trading tasks
 * Periodically checks for signals and executes trades based on configurations
 */

import { storage } from '../storage';
import { generateTechnicalSignals, generateSentimentSignals, 
         generateAnomalySignals, processSignal, combineSignals } from './tradingEngine';
import { sendAutoTradeUpdate } from './websocket';
import { log } from '../vite';

// Map of scheduled tasks (userId => intervalId)
const scheduledTasks = new Map<number, NodeJS.Timeout>();

// Default interval for checking signals (in milliseconds)
const DEFAULT_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

export interface AutoTradeConfig {
  userId: number;
  enabled: boolean;
  symbols: string[];
  signalSources: string[];
  minConfidence: number;
  maxPositions: number;
  checkInterval: number;
  riskParameters: {
    maxPositionSize: number;
    maxDrawdown: number;
    stopLossPercent: number;
    takeProfitPercent: number;
  };
}

/**
 * Start the auto-trade scheduler for a user
 */
export async function startAutoTradeScheduler(config: AutoTradeConfig): Promise<boolean> {
  try {
    // Stop any existing scheduler for this user
    stopAutoTradeScheduler(config.userId);
    
    if (!config.enabled) {
      return true;
    }
    
    // Create a task to periodically check for signals
    const intervalId = setInterval(async () => {
      await checkAndExecuteTrades(config);
    }, config.checkInterval || DEFAULT_CHECK_INTERVAL);
    
    // Store the interval ID
    scheduledTasks.set(config.userId, intervalId);
    
    log(`Auto-trade scheduler started for user ${config.userId}`, 'auto-trade');
    
    // Run an initial check immediately
    setTimeout(() => {
      checkAndExecuteTrades(config);
    }, 1000);
    
    return true;
  } catch (error) {
    console.error('Error starting auto-trade scheduler:', error);
    return false;
  }
}

/**
 * Stop the auto-trade scheduler for a user
 */
export function stopAutoTradeScheduler(userId: number): boolean {
  try {
    const intervalId = scheduledTasks.get(userId);
    
    if (intervalId) {
      clearInterval(intervalId);
      scheduledTasks.delete(userId);
      log(`Auto-trade scheduler stopped for user ${userId}`, 'auto-trade');
    }
    
    return true;
  } catch (error) {
    console.error('Error stopping auto-trade scheduler:', error);
    return false;
  }
}

/**
 * Check for signals and execute trades based on the configuration
 */
async function checkAndExecuteTrades(config: AutoTradeConfig): Promise<void> {
  try {
    log(`Checking for auto-trade signals for user ${config.userId}`, 'auto-trade');
    
    // Get all open positions for the user
    const openPositions = await storage.getTradingPositions(config.userId, 'open');
    
    // Skip if maximum positions reached
    if (openPositions.length >= config.maxPositions) {
      log(`Maximum open positions (${config.maxPositions}) reached for user ${config.userId}`, 'auto-trade');
      return;
    }
    
    // Get active symbols that don't already have open positions
    const openSymbols = openPositions.map(pos => pos.symbol);
    const availableSymbols = config.symbols.filter(symbol => !openSymbols.includes(symbol));
    
    if (availableSymbols.length === 0) {
      log(`No available symbols for new positions for user ${config.userId}`, 'auto-trade');
      return;
    }
    
    // Process each available symbol
    const results = [];
    
    for (const symbol of availableSymbols) {
      const signals = [];
      
      // Get signals based on configured sources
      if (config.signalSources.includes('technical')) {
        const technicalSignals = await generateTechnicalSignals(symbol);
        signals.push(...technicalSignals);
      }
      
      if (config.signalSources.includes('sentiment')) {
        const sentimentSignals = await generateSentimentSignals(symbol);
        signals.push(...sentimentSignals);
      }
      
      if (config.signalSources.includes('anomaly')) {
        const anomalySignals = await generateAnomalySignals(symbol);
        signals.push(...anomalySignals);
      }
      
      if (signals.length === 0) {
        continue;
      }
      
      // Combine signals
      const combinedSignal = combineSignals(signals);
      
      // Skip if confidence below threshold
      if (!combinedSignal || combinedSignal.confidence < config.minConfidence) {
        continue;
      }
      
      // Process the signal (execute trade)
      const result = await processSignal(config.userId, combinedSignal, config.riskParameters);
      
      // Record the result
      results.push({
        symbol,
        executed: result,
        signal: combinedSignal
      });
      
      // Notify the user
      sendAutoTradeUpdate(config.userId, {
        success: result,
        symbol,
        direction: combinedSignal.direction,
        confidence: combinedSignal.confidence,
        source: combinedSignal.source,
        timestamp: new Date().toISOString()
      });
      
      // Log auto-trade execution
      await storage.createEventLog({
        userId: config.userId,
        eventType: result ? 'auto_trade_executed' : 'auto_trade_rejected',
        details: {
          symbol,
          direction: combinedSignal.direction,
          confidence: combinedSignal.confidence,
          source: combinedSignal.source,
          reason: combinedSignal.metadata.reason
        }
      });
      
      // If a trade was executed, exit the loop
      if (result) {
        break;
      }
    }
    
    log(`Auto-trade check completed for user ${config.userId}. Signals processed: ${results.length}`, 'auto-trade');
  } catch (error) {
    console.error('Error in auto-trade scheduler:', error);
    
    // Log error
    await storage.createEventLog({
      userId: config.userId,
      eventType: 'auto_trade_error',
      details: {
        error: error.message
      }
    });
  }
}