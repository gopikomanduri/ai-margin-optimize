/**
 * Strategy Builder and Backtester
 * 
 * This service allows users to build trading strategies using technical indicators
 * and backtest them against historical data.
 */

import { getMarketData } from "./marketData";
import { getTechnicalAnalysis } from "./technicalAnalysis";
import { storage } from "../storage";

// Types

export type IndicatorType = 
  | 'sma' 
  | 'ema' 
  | 'rsi' 
  | 'macd' 
  | 'bollinger' 
  | 'stochastic'
  | 'atr'
  | 'adx'
  | 'obv'
  | 'fibonacci'
  | 'ichimoku'
  | 'parabolic_sar'
  | 'price';

export type Operator = 
  | 'greater_than' 
  | 'less_than' 
  | 'crosses_above' 
  | 'crosses_below' 
  | 'equals'
  | 'range';

export type TimeFrame = 
  | '1m' 
  | '5m' 
  | '15m' 
  | '30m' 
  | '1h' 
  | '4h' 
  | 'daily' 
  | 'weekly' 
  | 'monthly';

export interface Condition {
  id: string;
  indicatorType: IndicatorType;
  parameter1?: number; // e.g. period for SMA
  parameter2?: number; // e.g. second period for MACD
  parameter3?: number; // e.g. signal line period for MACD
  operator: Operator;
  value?: number;     // fixed value to compare against
  indicatorTypeRight?: IndicatorType; // for comparing two indicators
  parameter1Right?: number;
  parameter2Right?: number;
  parameter3Right?: number;
  valueRange?: [number, number]; // for 'range' operator
  timeframe?: TimeFrame;
}

export interface PositionSizing {
  type: 'fixed' | 'percentage' | 'volatility' | 'kelly';
  value: number; // The fixed size, percentage, or multiplier
  maxPositionSize?: number;
  maxPositionsOpen?: number;
}

export interface RiskManagement {
  stopLossType: 'fixed' | 'percentage' | 'atr' | 'volatility';
  stopLossValue: number;
  takeProfitType: 'fixed' | 'percentage' | 'atr' | 'volatility' | 'risk_ratio';
  takeProfitValue: number;
  trailingStop?: boolean;
  trailingStopValue?: number;
  maxDailyLoss?: number;
  maxDrawdown?: number;
}

export interface TradingStrategy {
  id?: string;
  name: string;
  description: string;
  symbols: string[];
  timeframe: TimeFrame;
  entryConditions: Condition[];
  exitConditions: Condition[];
  positionSizing: PositionSizing;
  riskManagement: RiskManagement;
  maxOpenTrades?: number;
  direction: 'long' | 'short' | 'both';
  created?: Date;
  lastModified?: Date;
  userId?: number;
}

export interface Trade {
  symbol: string;
  entryDate: Date;
  entryPrice: number;
  direction: 'long' | 'short';
  positionSize: number;
  exitDate?: Date;
  exitPrice?: number;
  pnl?: number;
  pnlPercent?: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
}

export interface BacktestResult {
  strategy: TradingStrategy;
  startDate: Date;
  endDate: Date;
  trades: Trade[];
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  netProfit: number;
  netProfitPercent: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  annualizedReturn: number;
  equityCurve: {date: Date, equity: number}[];
  monthly: {month: string, profit: number, profitPercent: number}[];
}

export interface BacktestParameters {
  strategy: TradingStrategy;
  startDate?: Date;
  endDate?: Date;
  initialCapital?: number;
  slippage?: number; // in percentage points
  commission?: number; // in percentage points
  dataQuality?: 'standard' | 'high';
}

/**
 * Create a new trading strategy
 */
export async function createStrategy(
  userId: number,
  strategyData: Omit<TradingStrategy, 'id' | 'created' | 'lastModified' | 'userId'>
): Promise<TradingStrategy> {
  // Create a new strategy with a unique ID
  const now = new Date();
  const strategyId = `strat_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  const strategy: TradingStrategy = {
    ...strategyData,
    id: strategyId,
    created: now,
    lastModified: now,
    userId
  };
  
  // In a real implementation, this would save to the database
  // For now, we'll just log the event
  await storage.createEventLog({
    userId,
    eventType: "strategy_created",
    details: {
      strategyId: strategy.id,
      name: strategy.name,
      symbols: strategy.symbols,
      timeframe: strategy.timeframe
    }
  });
  
  return strategy;
}

/**
 * Update an existing strategy
 */
export async function updateStrategy(
  userId: number,
  strategyId: string,
  strategyData: Partial<TradingStrategy>
): Promise<TradingStrategy> {
  // In a real implementation, this would update the database
  // For now, we'll just create a mock updated strategy
  
  const now = new Date();
  const mockCreated = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  
  const strategy: TradingStrategy = {
    id: strategyId,
    name: strategyData.name || "Updated Strategy",
    description: strategyData.description || "A strategy that was updated",
    symbols: strategyData.symbols || ["HDFCBANK", "INFY", "RELIANCE"],
    timeframe: strategyData.timeframe || "daily",
    entryConditions: strategyData.entryConditions || [],
    exitConditions: strategyData.exitConditions || [],
    positionSizing: strategyData.positionSizing || { type: 'percentage', value: 5 },
    riskManagement: strategyData.riskManagement || {
      stopLossType: 'percentage',
      stopLossValue: 2,
      takeProfitType: 'percentage',
      takeProfitValue: 6
    },
    direction: strategyData.direction || 'both',
    created: mockCreated,
    lastModified: now,
    userId
  };
  
  // Log the event
  await storage.createEventLog({
    userId,
    eventType: "strategy_updated",
    details: {
      strategyId,
      name: strategy.name,
      updatedAt: now.toISOString()
    }
  });
  
  return strategy;
}

/**
 * Get a specific strategy by ID
 */
export async function getStrategy(
  userId: number,
  strategyId: string
): Promise<TradingStrategy | null> {
  // In a real implementation, this would fetch from the database
  // For now, just return a mock strategy if the IDs have the same prefix
  
  if (!strategyId.startsWith('strat_')) {
    return null;
  }
  
  const mockCreated = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000); // 14 days ago
  const mockUpdated = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
  
  const strategy: TradingStrategy = {
    id: strategyId,
    name: "Golden Cross Strategy",
    description: "Buy when the 50-day SMA crosses above the 200-day SMA, sell when it crosses below",
    symbols: ["HDFCBANK", "INFY", "RELIANCE"],
    timeframe: "daily",
    entryConditions: [
      {
        id: "condition_1",
        indicatorType: 'sma',
        parameter1: 50,
        operator: 'crosses_above',
        indicatorTypeRight: 'sma',
        parameter1Right: 200
      }
    ],
    exitConditions: [
      {
        id: "condition_2",
        indicatorType: 'sma',
        parameter1: 50,
        operator: 'crosses_below',
        indicatorTypeRight: 'sma',
        parameter1Right: 200
      }
    ],
    positionSizing: {
      type: 'percentage',
      value: 10,
      maxPositionSize: 25000
    },
    riskManagement: {
      stopLossType: 'percentage',
      stopLossValue: 5,
      takeProfitType: 'percentage',
      takeProfitValue: 15,
      trailingStop: true,
      trailingStopValue: 2,
      maxDrawdown: 20
    },
    direction: 'long',
    created: mockCreated,
    lastModified: mockUpdated,
    userId
  };
  
  return strategy;
}

/**
 * List strategies for a user
 */
export async function listStrategies(userId: number): Promise<TradingStrategy[]> {
  // In a real implementation, this would fetch from the database
  // For now, just return some mock strategies
  
  const now = new Date();
  const mockCreated1 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const mockCreated2 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 14 days ago
  const mockUpdated1 = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
  const mockUpdated2 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
  
  const strategies: TradingStrategy[] = [
    {
      id: `strat_${Date.now() - 3000}_1`,
      name: "Golden Cross Strategy",
      description: "Buy when the 50-day SMA crosses above the 200-day SMA, sell when it crosses below",
      symbols: ["HDFCBANK", "INFY", "RELIANCE"],
      timeframe: "daily",
      entryConditions: [
        {
          id: "condition_1",
          indicatorType: 'sma',
          parameter1: 50,
          operator: 'crosses_above',
          indicatorTypeRight: 'sma',
          parameter1Right: 200
        }
      ],
      exitConditions: [
        {
          id: "condition_2",
          indicatorType: 'sma',
          parameter1: 50,
          operator: 'crosses_below',
          indicatorTypeRight: 'sma',
          parameter1Right: 200
        }
      ],
      positionSizing: {
        type: 'percentage',
        value: 10,
        maxPositionSize: 25000
      },
      riskManagement: {
        stopLossType: 'percentage',
        stopLossValue: 5,
        takeProfitType: 'percentage',
        takeProfitValue: 15,
        trailingStop: true,
        trailingStopValue: 2,
        maxDrawdown: 20
      },
      direction: 'long',
      created: mockCreated1,
      lastModified: mockUpdated1,
      userId
    },
    {
      id: `strat_${Date.now() - 2000}_2`,
      name: "RSI Reversal",
      description: "Buy when RSI is oversold, sell when overbought",
      symbols: ["INFY", "TCS"],
      timeframe: "daily",
      entryConditions: [
        {
          id: "condition_3",
          indicatorType: 'rsi',
          parameter1: 14,
          operator: 'less_than',
          value: 30
        }
      ],
      exitConditions: [
        {
          id: "condition_4",
          indicatorType: 'rsi',
          parameter1: 14,
          operator: 'greater_than',
          value: 70
        }
      ],
      positionSizing: {
        type: 'fixed',
        value: 10000
      },
      riskManagement: {
        stopLossType: 'percentage',
        stopLossValue: 3,
        takeProfitType: 'risk_ratio',
        takeProfitValue: 3
      },
      direction: 'both',
      created: mockCreated2,
      lastModified: mockUpdated2,
      userId
    }
  ];
  
  return strategies;
}

/**
 * Delete a strategy by ID
 */
export async function deleteStrategy(
  userId: number,
  strategyId: string
): Promise<boolean> {
  // In a real implementation, this would delete from the database
  // For now, just log the event and return a success message
  
  await storage.createEventLog({
    userId,
    eventType: "strategy_deleted",
    details: {
      strategyId,
      deletedAt: new Date().toISOString()
    }
  });
  
  return true;
}

/**
 * Generate synthetic historical data for backtesting
 */
function generateHistoricalData(
  symbol: string,
  startDate: Date,
  endDate: Date,
  timeframe: TimeFrame
): { date: Date; open: number; high: number; low: number; close: number; volume: number; }[] {
  // In a real implementation, this would fetch historical data from an API
  // For now, generate synthetic data
  
  const data = [];
  let current = new Date(startDate);
  
  // Starting price is deterministic based on the symbol to ensure consistent results
  const symbolSeed = symbol.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  let price = 100 + (symbolSeed % 900);
  const volatility = 2 + (symbolSeed % 5);
  
  const timeframeToDays = {
    '1m': 1/24/60,
    '5m': 5/24/60,
    '15m': 15/24/60,
    '30m': 30/24/60,
    '1h': 1/24,
    '4h': 4/24,
    'daily': 1,
    'weekly': 7,
    'monthly': 30
  };
  
  const increment = timeframeToDays[timeframe] || 1; // Default to daily
  
  while (current <= endDate) {
    if (current.getDay() !== 0 && current.getDay() !== 6) { // Skip weekends
      // Generate open, high, low, close values
      const changePercent = (Math.random() - 0.5) * volatility / 100;
      const open = price;
      const direction = Math.random() > 0.5 ? 1 : -1;
      const range = price * (0.01 + Math.random() * 0.02); // 1-3% range
      const close = price * (1 + changePercent);
      const high = Math.max(open, close) + Math.random() * range;
      const low = Math.min(open, close) - Math.random() * range;
      
      // Generate volume
      const volume = Math.floor(50000 + Math.random() * 1000000);
      
      // Add data point
      data.push({
        date: new Date(current),
        open,
        high,
        low,
        close,
        volume
      });
      
      // Update price for next period
      price = close;
    }
    
    // Move to next period
    current = new Date(current.getTime() + increment * 24 * 60 * 60 * 1000);
  }
  
  return data;
}

/**
 * Evaluate a condition against technical data
 */
function evaluateCondition(
  condition: Condition,
  history: any[],
  currentIndex: number
): boolean {
  // This is a simplified implementation
  // In a real application, this would be much more complex
  
  // Placeholder functions to extract indicator values
  function getIndicatorValue(
    indicatorType: IndicatorType,
    param1?: number,
    param2?: number,
    param3?: number,
    index = currentIndex
  ): number {
    // Get current and previous data points
    const current = history[index];
    const previous = index > 0 ? history[index - 1] : null;
    
    switch (indicatorType) {
      case 'price':
        return current.close;
      case 'sma':
        // Simple moving average - simple implementation
        const period = param1 || 14;
        if (index < period - 1) return current.close;
        
        let sum = 0;
        for (let i = 0; i < period; i++) {
          sum += history[index - i].close;
        }
        return sum / period;
      case 'ema':
        // Exponential moving average - simple implementation
        const emaPeriod = param1 || 14;
        if (index < emaPeriod - 1) return current.close;
        
        const multiplier = 2 / (emaPeriod + 1);
        const previousEMA = index === emaPeriod - 1 
          ? history.slice(0, emaPeriod).reduce((sum, bar) => sum + bar.close, 0) / emaPeriod
          : getIndicatorValue('ema', emaPeriod, undefined, undefined, index - 1);
        
        return (current.close - previousEMA) * multiplier + previousEMA;
      case 'rsi':
        // RSI - simplified implementation
        const rsiPeriod = param1 || 14;
        if (index < rsiPeriod) return 50; // Default RSI
        
        let gains = 0, losses = 0;
        for (let i = index - rsiPeriod + 1; i <= index; i++) {
          const change = history[i].close - history[i - 1].close;
          if (change >= 0) gains += change;
          else losses -= change;
        }
        
        const avgGain = gains / rsiPeriod;
        const avgLoss = losses / rsiPeriod;
        if (avgLoss === 0) return 100;
        
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
      
      case 'macd':
        // MACD - simplified implementation
        const fastPeriod = param1 || 12;
        const slowPeriod = param2 || 26;
        const fastEMA = getIndicatorValue('ema', fastPeriod, undefined, undefined, index);
        const slowEMA = getIndicatorValue('ema', slowPeriod, undefined, undefined, index);
        return fastEMA - slowEMA;
      
      case 'bollinger':
        // Bollinger Bands - return middle band (SMA)
        const bollingerPeriod = param1 || 20;
        return getIndicatorValue('sma', bollingerPeriod, undefined, undefined, index);
      
      default:
        return current.close;
    }
  }
  
  // Helper function to check if a crossing has occurred
  function hasCrossed(
    currentValue: number,
    currentCompareValue: number,
    previousValue: number,
    previousCompareValue: number,
    operator: 'crosses_above' | 'crosses_below'
  ): boolean {
    if (operator === 'crosses_above') {
      return previousValue < previousCompareValue && currentValue >= currentCompareValue;
    } else { // crosses_below
      return previousValue > previousCompareValue && currentValue <= currentCompareValue;
    }
  }
  
  // Get values for current and previous bars
  const currentValue = getIndicatorValue(
    condition.indicatorType,
    condition.parameter1,
    condition.parameter2,
    condition.parameter3
  );
  
  // For comparing against fixed value
  if (condition.value !== undefined && !condition.indicatorTypeRight) {
    switch (condition.operator) {
      case 'greater_than':
        return currentValue > condition.value;
      case 'less_than':
        return currentValue < condition.value;
      case 'equals':
        return Math.abs(currentValue - condition.value) < 0.0001; // Epsilon for float comparison
      case 'range':
        if (!condition.valueRange) return false;
        return currentValue >= condition.valueRange[0] && currentValue <= condition.valueRange[1];
      default:
        return false;
    }
  }
  
  // For comparing two indicators
  if (condition.indicatorTypeRight) {
    const currentCompareValue = getIndicatorValue(
      condition.indicatorTypeRight,
      condition.parameter1Right,
      condition.parameter2Right,
      condition.parameter3Right
    );
    
    // Check if we need to evaluate crossing conditions
    if (condition.operator === 'crosses_above' || condition.operator === 'crosses_below') {
      if (currentIndex === 0) return false; // No previous bar to compare
      
      const previousValue = getIndicatorValue(
        condition.indicatorType,
        condition.parameter1,
        condition.parameter2,
        condition.parameter3,
        currentIndex - 1
      );
      
      const previousCompareValue = getIndicatorValue(
        condition.indicatorTypeRight,
        condition.parameter1Right,
        condition.parameter2Right,
        condition.parameter3Right,
        currentIndex - 1
      );
      
      return hasCrossed(
        currentValue,
        currentCompareValue,
        previousValue,
        previousCompareValue,
        condition.operator
      );
    } else {
      // Simple comparison
      switch (condition.operator) {
        case 'greater_than':
          return currentValue > currentCompareValue;
        case 'less_than':
          return currentValue < currentCompareValue;
        case 'equals':
          return Math.abs(currentValue - currentCompareValue) < 0.0001;
        default:
          return false;
      }
    }
  }
  
  return false;
}

/**
 * Run a backtest with a trading strategy against historical data
 */
export async function runBacktest(params: BacktestParameters): Promise<BacktestResult> {
  const {
    strategy,
    startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Default to 1 year ago
    endDate = new Date(),
    initialCapital = 100000,
    slippage = 0.1,
    commission = 0.05
  } = params;
  
  const results: Record<string, Trade[]> = {};
  let equity = initialCapital;
  const equityCurve: {date: Date, equity: number}[] = [{ date: startDate, equity }];
  
  // Backtest each symbol
  for (const symbol of strategy.symbols) {
    const trades: Trade[] = [];
    let position: Trade | null = null;
    
    // Get historical data
    const history = generateHistoricalData(symbol, startDate, endDate, strategy.timeframe);
    
    // Iterate through each bar
    for (let i = 1; i < history.length; i++) { // Start at 1 to have a previous bar
      const bar = history[i];
      const date = bar.date;
      
      // Check if we have an open position
      if (position) {
        // Check exit conditions
        let shouldExit = false;
        
        // Check stop loss
        if (position.stopLossPrice !== undefined) {
          if (position.direction === 'long' && bar.low <= position.stopLossPrice) {
            shouldExit = true;
            bar.close = position.stopLossPrice; // Assume we exit at stop price
          } else if (position.direction === 'short' && bar.high >= position.stopLossPrice) {
            shouldExit = true;
            bar.close = position.stopLossPrice;
          }
        }
        
        // Check take profit
        if (!shouldExit && position.takeProfitPrice !== undefined) {
          if (position.direction === 'long' && bar.high >= position.takeProfitPrice) {
            shouldExit = true;
            bar.close = position.takeProfitPrice;
          } else if (position.direction === 'short' && bar.low <= position.takeProfitPrice) {
            shouldExit = true;
            bar.close = position.takeProfitPrice;
          }
        }
        
        // Check exit conditions if we haven't already decided to exit
        if (!shouldExit) {
          for (const condition of strategy.exitConditions) {
            if (evaluateCondition(condition, history, i)) {
              shouldExit = true;
              break;
            }
          }
        }
        
        // Exit the position if conditions are met
        if (shouldExit) {
          const slippageMultiplier = position.direction === 'long' ? 1 - slippage/100 : 1 + slippage/100;
          const exitPrice = bar.close * slippageMultiplier;
          const commissionAmount = position.positionSize * (commission / 100);
          
          position.exitDate = date;
          position.exitPrice = exitPrice;
          
          // Calculate P&L
          if (position.direction === 'long') {
            position.pnl = position.positionSize * (exitPrice / position.entryPrice - 1) - commissionAmount;
          } else {
            position.pnl = position.positionSize * (1 - exitPrice / position.entryPrice) - commissionAmount;
          }
          
          position.pnlPercent = (position.pnl / position.positionSize) * 100;
          
          // Update equity
          equity += position.pnl;
          equityCurve.push({ date, equity });
          
          // Store the closed trade
          trades.push(position);
          position = null;
        }
      } else {
        // Check entry conditions
        let shouldEnter = true;
        for (const condition of strategy.entryConditions) {
          if (!evaluateCondition(condition, history, i)) {
            shouldEnter = false;
            break;
          }
        }
        
        // Enter a new position if conditions are met
        if (shouldEnter) {
          // Determine direction
          let direction: 'long' | 'short';
          if (strategy.direction === 'both') {
            // For 'both', use a simple rule: RSI < 30 = long, RSI > 70 = short
            const rsi = evaluateCondition({
              id: 'temp_rsi',
              indicatorType: 'rsi',
              parameter1: 14,
              operator: 'less_than',
              value: 50
            }, history, i);
            
            direction = rsi ? 'long' : 'short';
          } else {
            direction = strategy.direction;
          }
          
          // Calculate position size
          let positionSize = 0;
          switch (strategy.positionSizing.type) {
            case 'fixed':
              positionSize = strategy.positionSizing.value;
              break;
            case 'percentage':
              positionSize = equity * (strategy.positionSizing.value / 100);
              break;
            case 'volatility':
            case 'kelly':
              // Simplified - would be more complex in real implementation
              positionSize = equity * 0.02; // 2% position size
              break;
          }
          
          // Apply maximum position size limit
          if (strategy.positionSizing.maxPositionSize && positionSize > strategy.positionSizing.maxPositionSize) {
            positionSize = strategy.positionSizing.maxPositionSize;
          }
          
          // Calculate entry price with slippage
          const slippageMultiplier = direction === 'long' ? 1 + slippage/100 : 1 - slippage/100;
          const entryPrice = bar.close * slippageMultiplier;
          
          // Calculate stop loss and take profit levels
          let stopLossPrice: number | undefined;
          let takeProfitPrice: number | undefined;
          
          switch (strategy.riskManagement.stopLossType) {
            case 'fixed':
              stopLossPrice = direction === 'long' 
                ? entryPrice - strategy.riskManagement.stopLossValue
                : entryPrice + strategy.riskManagement.stopLossValue;
              break;
            case 'percentage':
              stopLossPrice = direction === 'long'
                ? entryPrice * (1 - strategy.riskManagement.stopLossValue / 100)
                : entryPrice * (1 + strategy.riskManagement.stopLossValue / 100);
              break;
            // ATR and volatility based stops would be implemented here
          }
          
          switch (strategy.riskManagement.takeProfitType) {
            case 'fixed':
              takeProfitPrice = direction === 'long'
                ? entryPrice + strategy.riskManagement.takeProfitValue
                : entryPrice - strategy.riskManagement.takeProfitValue;
              break;
            case 'percentage':
              takeProfitPrice = direction === 'long'
                ? entryPrice * (1 + strategy.riskManagement.takeProfitValue / 100)
                : entryPrice * (1 - strategy.riskManagement.takeProfitValue / 100);
              break;
            case 'risk_ratio':
              if (stopLossPrice) {
                const riskAmount = Math.abs(entryPrice - stopLossPrice);
                takeProfitPrice = direction === 'long'
                  ? entryPrice + (riskAmount * strategy.riskManagement.takeProfitValue)
                  : entryPrice - (riskAmount * strategy.riskManagement.takeProfitValue);
              }
              break;
            // ATR and volatility based take profits would be implemented here
          }
          
          // Create the new position
          position = {
            symbol,
            entryDate: date,
            entryPrice,
            direction,
            positionSize,
            stopLossPrice,
            takeProfitPrice
          };
        }
      }
    }
    
    // Close any open position at the end of the test
    if (position) {
      const lastBar = history[history.length - 1];
      position.exitDate = lastBar.date;
      position.exitPrice = lastBar.close;
      
      // Calculate P&L
      if (position.direction === 'long') {
        position.pnl = position.positionSize * (position.exitPrice / position.entryPrice - 1);
      } else {
        position.pnl = position.positionSize * (1 - position.exitPrice / position.entryPrice);
      }
      
      position.pnlPercent = (position.pnl / position.positionSize) * 100;
      
      // Update equity
      equity += position.pnl;
      equityCurve.push({ date: lastBar.date, equity });
      
      // Store the closed trade
      trades.push(position);
    }
    
    results[symbol] = trades;
  }
  
  // Aggregate all trades
  const allTrades = Object.values(results).flat();
  
  // Calculate backtest statistics
  const totalTrades = allTrades.length;
  const winningTrades = allTrades.filter(t => (t.pnl || 0) > 0).length;
  const losingTrades = totalTrades - winningTrades;
  const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0;
  
  const winningTradesArray = allTrades.filter(t => (t.pnl || 0) > 0);
  const losingTradesArray = allTrades.filter(t => (t.pnl || 0) <= 0);
  
  const averageWin = winningTradesArray.length > 0
    ? winningTradesArray.reduce((sum, t) => sum + (t.pnlPercent || 0), 0) / winningTradesArray.length
    : 0;
  
  const averageLoss = losingTradesArray.length > 0
    ? Math.abs(losingTradesArray.reduce((sum, t) => sum + (t.pnlPercent || 0), 0) / losingTradesArray.length)
    : 0;
  
  const profitFactor = averageLoss > 0 ? (winRate * averageWin) / ((1 - winRate) * averageLoss) : 0;
  
  const netProfit = equity - initialCapital;
  const netProfitPercent = (netProfit / initialCapital) * 100;
  
  // Calculate maximum drawdown
  let peak = initialCapital;
  let maxDrawdown = 0;
  for (const point of equityCurve) {
    if (point.equity > peak) {
      peak = point.equity;
    }
    
    const drawdown = peak - point.equity;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  const maxDrawdownPercent = (maxDrawdown / peak) * 100;
  
  // Calculate Sharpe ratio (simplified)
  const returns = [];
  for (let i = 1; i < equityCurve.length; i++) {
    returns.push((equityCurve[i].equity / equityCurve[i-1].equity) - 1);
  }
  
  const averageReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - averageReturn, 2), 0) / returns.length);
  const annualReturnFactor = 252 / returns.length; // Assuming daily returns
  const sharpeRatio = stdDev > 0 ? (averageReturn / stdDev) * Math.sqrt(annualReturnFactor) : 0;
  
  // Calculate annualized return
  const days = (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
  const annualizedReturn = Math.pow(equity / initialCapital, 365 / days) - 1;
  
  // Calculate monthly returns
  const monthlyMap = new Map<string, {profit: number, startEquity: number}>();
  
  for (let i = 0; i < equityCurve.length; i++) {
    const point = equityCurve[i];
    const monthKey = `${point.date.getFullYear()}-${point.date.getMonth() + 1}`;
    
    if (!monthlyMap.has(monthKey)) {
      const previousPoint = i > 0 ? equityCurve[i-1] : {equity: initialCapital};
      monthlyMap.set(monthKey, {profit: 0, startEquity: previousPoint.equity});
    }
  }
  
  // For each trade, add profit to the corresponding month
  for (const trade of allTrades) {
    if (trade.exitDate && trade.pnl) {
      const monthKey = `${trade.exitDate.getFullYear()}-${trade.exitDate.getMonth() + 1}`;
      const monthData = monthlyMap.get(monthKey);
      
      if (monthData) {
        monthData.profit += trade.pnl;
      }
    }
  }
  
  // Convert to array and calculate percentages
  const monthly = Array.from(monthlyMap.entries()).map(([month, data]) => ({
    month,
    profit: data.profit,
    profitPercent: (data.profit / data.startEquity) * 100
  }));
  
  return {
    strategy,
    startDate,
    endDate,
    trades: allTrades,
    totalTrades,
    winningTrades,
    losingTrades,
    winRate,
    averageWin,
    averageLoss,
    profitFactor,
    netProfit,
    netProfitPercent,
    maxDrawdown,
    maxDrawdownPercent,
    sharpeRatio,
    annualizedReturn,
    equityCurve,
    monthly
  };
}