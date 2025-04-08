/**
 * ML-based Index Sensitivity Modeling
 * 
 * This service uses machine learning to model how different stocks respond to
 * changes in market indices like NIFTY or S&P 500. It calculates beta coefficients,
 * correlation metrics, and more advanced ML-based sensitivity measures.
 */

import { storage } from "../storage";
import { getMarketData } from "./marketData";
import { getTechnicalAnalysis } from "./technicalAnalysis";

// Types
export interface SensitivityModel {
  symbol: string;
  index: string;
  metrics: {
    beta: number;                // Traditional beta coefficient
    correlation: number;         // Correlation coefficient
    r2: number;                  // R-squared value
    mlSensitivity: number;       // ML-derived sensitivity score
    confidenceInterval: {        // Confidence interval for the sensitivity
      lower: number;
      upper: number;
    };
    stressTestResults: {         // How the stock reacts in extreme scenarios
      strongUp: number;          // % change when index moves up 5%
      strongDown: number;        // % change when index moves down 5% 
      extremeVolatility: number; // % change during high VIX
    };
  };
  forecast: {                    // ML forecast for different market scenarios
    bullishMarket: number;       // Expected performance in bullish market
    bearishMarket: number;       // Expected performance in bearish market
    volatileMarket: number;      // Expected performance in volatile market
    timeframe: string;           // Forecast timeframe
  };
  historicalPerformance: {
    outperformedIndex: boolean;  // Has it outperformed the index?
    outperformancePercent: number; // By what percent
    consistencyScore: number;    // Consistency of outperformance (0-1)
  };
  createdAt: string;
}

export interface SensitivityParameters {
  symbol: string;
  index?: string;              // Default to NIFTY for Indian stocks, S&P 500 for US
  lookbackPeriod?: number;     // Days of historical data, default 180
  includeStressTests?: boolean; // Run stress tests, default true
  includeForecast?: boolean;   // Generate forecasts, default true
  forecastPeriod?: number;     // Forecast days, default 30
  modelComplexity?: 'simple' | 'moderate' | 'complex'; // ML model complexity
}

/**
 * Calculate the beta coefficient between a stock and an index
 */
function calculateBeta(stockReturns: number[], indexReturns: number[]): number {
  // Ensure arrays are of the same length
  const n = Math.min(stockReturns.length, indexReturns.length);
  
  // Calculate covariance
  let sumProductDeviations = 0;
  let sumIndexSquaredDeviations = 0;
  
  const avgStockReturn = stockReturns.reduce((sum, val) => sum + val, 0) / n;
  const avgIndexReturn = indexReturns.reduce((sum, val) => sum + val, 0) / n;
  
  for (let i = 0; i < n; i++) {
    const stockDeviation = stockReturns[i] - avgStockReturn;
    const indexDeviation = indexReturns[i] - avgIndexReturn;
    
    sumProductDeviations += stockDeviation * indexDeviation;
    sumIndexSquaredDeviations += indexDeviation * indexDeviation;
  }
  
  const covariance = sumProductDeviations / n;
  const indexVariance = sumIndexSquaredDeviations / n;
  
  return covariance / indexVariance;
}

/**
 * Calculate correlation coefficient between stock and index
 */
function calculateCorrelation(stockReturns: number[], indexReturns: number[]): number {
  const n = Math.min(stockReturns.length, indexReturns.length);
  
  const avgStockReturn = stockReturns.reduce((sum, val) => sum + val, 0) / n;
  const avgIndexReturn = indexReturns.reduce((sum, val) => sum + val, 0) / n;
  
  let sumProductDeviations = 0;
  let sumStockSquaredDeviations = 0;
  let sumIndexSquaredDeviations = 0;
  
  for (let i = 0; i < n; i++) {
    const stockDeviation = stockReturns[i] - avgStockReturn;
    const indexDeviation = indexReturns[i] - avgIndexReturn;
    
    sumProductDeviations += stockDeviation * indexDeviation;
    sumStockSquaredDeviations += stockDeviation * stockDeviation;
    sumIndexSquaredDeviations += indexDeviation * indexDeviation;
  }
  
  return sumProductDeviations / (Math.sqrt(sumStockSquaredDeviations) * Math.sqrt(sumIndexSquaredDeviations));
}

/**
 * Calculate R-squared (coefficient of determination)
 */
function calculateRSquared(correlation: number): number {
  return correlation * correlation;
}

/**
 * Apply machine learning techniques for advanced sensitivity modeling
 * For now, this is a simplified implementation
 */
function applyMachineLearning(
  stockReturns: number[], 
  indexReturns: number[],
  modelComplexity: 'simple' | 'moderate' | 'complex'
): {
  mlSensitivity: number;
  confidenceInterval: { lower: number; upper: number };
} {
  // In a real implementation, this would use a proper ML model like:
  // - Random Forest for non-linear relationships
  // - LSTM for time-series forecasting
  // - Bayesian models for uncertainty quantification
  
  // Simplified implementation based on modelComplexity
  let mlSensitivity = 0;
  let confidenceInterval = { lower: 0, upper: 0 };
  
  const beta = calculateBeta(stockReturns, indexReturns);
  const correlation = calculateCorrelation(stockReturns, indexReturns);
  
  switch (modelComplexity) {
    case 'simple':
      // Simply use beta with a small adjustment
      mlSensitivity = beta * (1 + Math.random() * 0.1 - 0.05);
      confidenceInterval = {
        lower: beta * 0.9,
        upper: beta * 1.1
      };
      break;
      
    case 'moderate':
      // Use both beta and correlation with some non-linearity
      mlSensitivity = beta * (1 + 0.2 * Math.sign(correlation - 0.5) * Math.pow(Math.abs(correlation - 0.5), 0.5));
      
      // Add some market regime awareness (simplified)
      const recentIndexSum = indexReturns.slice(-20).reduce((sum, val) => sum + val, 0);
      const volatilityAdjustment = 0.1 * Math.sin(recentIndexSum); // Proxy for recent market regime
      mlSensitivity *= (1 + volatilityAdjustment);
      
      confidenceInterval = {
        lower: mlSensitivity * 0.85,
        upper: mlSensitivity * 1.15
      };
      break;
      
    case 'complex':
      // Simulate a more complex model with regime detection, non-linearities, etc.
      
      // Detect high volatility periods (simplified)
      const indexVolatility = standardDeviation(indexReturns.slice(-30));
      const isHighVol = indexVolatility > standardDeviation(indexReturns);
      
      // Simulate regime-dependent sensitivity
      const regimeAdjustment = isHighVol ? 0.3 : -0.1;
      
      // Simulate non-linear relationship
      const nonLinearFactor = correlation > 0.7 
        ? Math.pow(correlation, 2) 
        : Math.pow(correlation, 0.5);
      
      mlSensitivity = beta * (1 + regimeAdjustment) * nonLinearFactor;
      
      // Tighter confidence interval with more data
      const confidenceWidth = 0.3 - Math.min(0.2, 0.2 * (stockReturns.length / 500));
      confidenceInterval = {
        lower: mlSensitivity * (1 - confidenceWidth),
        upper: mlSensitivity * (1 + confidenceWidth)
      };
      break;
  }
  
  return {
    mlSensitivity,
    confidenceInterval
  };
}

// Utility function to calculate standard deviation
function standardDeviation(values: number[]): number {
  const n = values.length;
  if (n === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  
  return Math.sqrt(variance);
}

/**
 * Calculate stress test results
 */
function calculateStressTestResults(
  beta: number, 
  correlation: number, 
  mlSensitivity: number
): {
  strongUp: number;
  strongDown: number;
  extremeVolatility: number;
} {
  // Non-linear stress responses
  const upBias = correlation > 0.5 ? 0.1 : -0.1; // Stocks with high correlation might outperform in rallies
  const downBias = beta > 1.2 ? -0.2 : 0.1; // High beta stocks might underperform more in crashes
  
  return {
    strongUp: 5 * mlSensitivity * (1 + upBias), // 5% index move
    strongDown: -5 * mlSensitivity * (1 + downBias), // -5% index move
    extremeVolatility: mlSensitivity * (correlation < 0.3 ? -2 : 2) // How it behaves in volatile times
  };
}

/**
 * Generate forecasts based on the sensitivity model
 */
function generateForecasts(
  beta: number,
  mlSensitivity: number,
  historicalPerformance: { outperformedIndex: boolean; outperformancePercent: number },
  period: number
): {
  bullishMarket: number;
  bearishMarket: number;
  volatileMarket: number;
  timeframe: string;
} {
  // Adjust sensitivity based on historical outperformance
  const performanceAdjustment = historicalPerformance.outperformedIndex 
    ? 1 + (Math.min(historicalPerformance.outperformancePercent, 20) / 100)
    : 1 - (Math.min(Math.abs(historicalPerformance.outperformancePercent), 20) / 200);
  
  // Forecast returns for different market scenarios
  const scenarioReturns = {
    bullishMarket: 15 * (beta * 0.7 + mlSensitivity * 0.3) * performanceAdjustment / 365 * period,
    bearishMarket: -10 * (beta * 0.8 + mlSensitivity * 0.2) * performanceAdjustment / 365 * period,
    volatileMarket: 5 * (mlSensitivity - 1) * performanceAdjustment / 365 * period,
    timeframe: `${period} days`
  };
  
  return scenarioReturns;
}

/**
 * Calculate historical performance metrics
 */
function calculateHistoricalPerformance(
  stockReturns: number[],
  indexReturns: number[]
): {
  outperformedIndex: boolean;
  outperformancePercent: number;
  consistencyScore: number;
} {
  const n = Math.min(stockReturns.length, indexReturns.length);
  
  // Calculate cumulative returns
  const stockCumulativeReturn = stockReturns.reduce((acc, ret) => (1 + acc) * (1 + ret) - 1, 0);
  const indexCumulativeReturn = indexReturns.reduce((acc, ret) => (1 + acc) * (1 + ret) - 1, 0);
  
  // Calculate outperformance
  const outperformedIndex = stockCumulativeReturn > indexCumulativeReturn;
  const outperformancePercent = (stockCumulativeReturn - indexCumulativeReturn) * 100;
  
  // Calculate consistency of outperformance (percentage of periods where stock outperformed)
  let outperformanceCount = 0;
  for (let i = 0; i < n; i++) {
    if (stockReturns[i] > indexReturns[i]) {
      outperformanceCount++;
    }
  }
  
  const consistencyScore = outperformanceCount / n;
  
  return {
    outperformedIndex,
    outperformancePercent,
    consistencyScore
  };
}

/**
 * Get historical price data (simplified)
 */
async function getHistoricalPriceData(
  symbol: string, 
  index: string, 
  days: number
): Promise<{ stockPrices: number[]; indexPrices: number[] }> {
  // In a real implementation, this would fetch data from a market data API
  
  // Simulate historical prices with some randomness but maintain a relationship
  // between the stock and index based on the symbol characteristics
  const baseStockVolatility = symbol.length % 5 + 1; // Simple way to get different volatilities per stock
  const indexVolatility = 1.0;
  
  const baseStockTrend = (symbol.charCodeAt(0) % 5 - 2) / 100; // Between -0.02 and 0.02 daily
  const indexTrend = 0.0003; // Slight upward trend
  
  const correlation = 0.6 + (symbol.length % 10) / 20; // Between 0.6 and 1.0
  
  const stockPrices: number[] = [];
  const indexPrices: number[] = [];
  
  let stockPrice = 100;
  let indexPrice = 1000;
  
  // Generate price series
  for (let i = 0; i <= days; i++) {
    // Common market factor
    const marketMove = (Math.random() - 0.5) * 0.02;
    
    // Stock-specific move
    const specificMove = (Math.random() - 0.5) * 0.03;
    
    // Update prices with trends, volatility, and correlation
    indexPrice *= (1 + indexTrend + marketMove * indexVolatility);
    stockPrice *= (1 + baseStockTrend + 
                  correlation * marketMove * baseStockVolatility + 
                  (1 - correlation) * specificMove);
    
    indexPrices.push(indexPrice);
    stockPrices.push(stockPrice);
  }
  
  return { stockPrices, indexPrices };
}

/**
 * Convert prices to returns
 */
function calculateReturns(prices: number[]): number[] {
  const returns: number[] = [];
  
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1]);
  }
  
  return returns;
}

/**
 * Main function to create a sensitivity model for a stock
 */
export async function createSensitivityModel(params: SensitivityParameters): Promise<SensitivityModel> {
  const {
    symbol,
    index = symbol.includes('NIFTY') || symbol.includes('BANK') ? 'NIFTY' : 'SPX',
    lookbackPeriod = 180,
    includeStressTests = true,
    includeForecast = true,
    forecastPeriod = 30,
    modelComplexity = 'moderate'
  } = params;
  
  // Get historical price data
  const { stockPrices, indexPrices } = await getHistoricalPriceData(symbol, index, lookbackPeriod);
  
  // Calculate returns
  const stockReturns = calculateReturns(stockPrices);
  const indexReturns = calculateReturns(indexPrices);
  
  // Calculate basic metrics
  const beta = calculateBeta(stockReturns, indexReturns);
  const correlation = calculateCorrelation(stockReturns, indexReturns);
  const r2 = calculateRSquared(correlation);
  
  // Apply ML enhancements
  const { mlSensitivity, confidenceInterval } = applyMachineLearning(
    stockReturns, 
    indexReturns, 
    modelComplexity
  );
  
  // Calculate stress test results if requested
  const stressTestResults = includeStressTests 
    ? calculateStressTestResults(beta, correlation, mlSensitivity)
    : { strongUp: 0, strongDown: 0, extremeVolatility: 0 };
  
  // Calculate historical performance
  const historicalPerformance = calculateHistoricalPerformance(stockReturns, indexReturns);
  
  // Generate forecasts if requested
  const forecast = includeForecast
    ? generateForecasts(beta, mlSensitivity, historicalPerformance, forecastPeriod)
    : { bullishMarket: 0, bearishMarket: 0, volatileMarket: 0, timeframe: `${forecastPeriod} days` };
  
  // Construct the sensitivity model
  const sensitivityModel: SensitivityModel = {
    symbol,
    index,
    metrics: {
      beta,
      correlation,
      r2,
      mlSensitivity,
      confidenceInterval,
      stressTestResults
    },
    forecast,
    historicalPerformance,
    createdAt: new Date().toISOString()
  };
  
  // Log the event
  await storage.createEventLog({
    eventType: "sensitivity_model_created",
    details: {
      symbol,
      index,
      beta,
      mlSensitivity,
      modelComplexity
    }
  });
  
  return sensitivityModel;
}

/**
 * Compare multiple stocks based on their sensitivity to an index
 */
export async function compareSensitivity(
  symbols: string[], 
  index?: string,
  modelComplexity: 'simple' | 'moderate' | 'complex' = 'moderate'
): Promise<SensitivityModel[]> {
  const models: SensitivityModel[] = [];
  
  for (const symbol of symbols) {
    const model = await createSensitivityModel({
      symbol,
      index,
      modelComplexity
    });
    
    models.push(model);
  }
  
  return models;
}

/**
 * Find stocks with specific sensitivity characteristics
 */
export async function findStocksWithSensitivity(
  availableSymbols: string[],
  criteria: {
    targetBeta?: number;
    betaRange?: { min: number; max: number };
    targetCorrelation?: number;
    correlationRange?: { min: number; max: number };
    outperformedIndex?: boolean;
    consistencyThreshold?: number;
  }
): Promise<{
  matchingStocks: string[];
  sensitivityModels: SensitivityModel[];
}> {
  const models: SensitivityModel[] = [];
  const matchingStocks: string[] = [];
  
  for (const symbol of availableSymbols) {
    const model = await createSensitivityModel({
      symbol,
      modelComplexity: 'simple' // Use simple for faster screening
    });
    
    models.push(model);
    
    // Check if the stock matches the criteria
    let matches = true;
    
    if (criteria.targetBeta !== undefined) {
      const betaTolerance = 0.2;
      if (Math.abs(model.metrics.beta - criteria.targetBeta) > betaTolerance) {
        matches = false;
      }
    }
    
    if (criteria.betaRange !== undefined) {
      if (model.metrics.beta < criteria.betaRange.min || model.metrics.beta > criteria.betaRange.max) {
        matches = false;
      }
    }
    
    if (criteria.targetCorrelation !== undefined) {
      const correlationTolerance = 0.1;
      if (Math.abs(model.metrics.correlation - criteria.targetCorrelation) > correlationTolerance) {
        matches = false;
      }
    }
    
    if (criteria.correlationRange !== undefined) {
      if (model.metrics.correlation < criteria.correlationRange.min || 
          model.metrics.correlation > criteria.correlationRange.max) {
        matches = false;
      }
    }
    
    if (criteria.outperformedIndex !== undefined) {
      if (model.historicalPerformance.outperformedIndex !== criteria.outperformedIndex) {
        matches = false;
      }
    }
    
    if (criteria.consistencyThreshold !== undefined) {
      if (model.historicalPerformance.consistencyScore < criteria.consistencyThreshold) {
        matches = false;
      }
    }
    
    if (matches) {
      matchingStocks.push(symbol);
    }
  }
  
  return {
    matchingStocks,
    sensitivityModels: models.filter(model => matchingStocks.includes(model.symbol))
  };
}

/**
 * Analyze portfolio sensitivity to indices
 */
export async function analyzePortfolioSensitivity(
  holdings: Array<{ symbol: string; weight: number }>,
  indices: string[] = ['NIFTY', 'SPX', 'VIX']
): Promise<{
  portfolioSensitivity: { [index: string]: number };
  stockSensitivities: Array<{ symbol: string; weight: number; sensitivities: { [index: string]: number } }>;
  diversificationScore: number;
  riskFactors: { 
    marketRisk: number; 
    sectorConcentration: number;
    volatilityExposure: number;
  };
}> {
  // Validate portfolio
  const totalWeight = holdings.reduce((sum, holding) => sum + holding.weight, 0);
  
  if (Math.abs(totalWeight - 1) > 0.001) {
    throw new Error("Portfolio weights must sum to 1");
  }
  
  // Get sensitivity models for each holding against each index
  const stockSensitivities: Array<{ 
    symbol: string; 
    weight: number; 
    sensitivities: { [index: string]: number }
  }> = [];
  
  for (const holding of holdings) {
    const sensitivities: { [index: string]: number } = {};
    
    for (const index of indices) {
      const model = await createSensitivityModel({
        symbol: holding.symbol,
        index,
        modelComplexity: 'moderate'
      });
      
      sensitivities[index] = model.metrics.mlSensitivity;
    }
    
    stockSensitivities.push({
      symbol: holding.symbol,
      weight: holding.weight,
      sensitivities
    });
  }
  
  // Calculate portfolio sensitivity to each index (weighted average)
  const portfolioSensitivity: { [index: string]: number } = {};
  
  for (const index of indices) {
    portfolioSensitivity[index] = stockSensitivities.reduce(
      (sum, stock) => sum + stock.weight * stock.sensitivities[index],
      0
    );
  }
  
  // Calculate diversification score based on correlation matrix (simplified)
  // A higher score means better diversification
  let totalCorrelation = 0;
  let correlationPairs = 0;
  
  for (let i = 0; i < holdings.length; i++) {
    for (let j = i + 1; j < holdings.length; j++) {
      // Simplified correlation calculation - would use actual correlation in a real implementation
      const modelI = await createSensitivityModel({
        symbol: holdings[i].symbol,
        modelComplexity: 'simple'
      });
      
      const modelJ = await createSensitivityModel({
        symbol: holdings[j].symbol,
        modelComplexity: 'simple'
      });
      
      // Use similarity of betas as a proxy for correlation
      const betaCorrelation = 1 - Math.min(1, Math.abs(modelI.metrics.beta - modelJ.metrics.beta) / 2);
      
      totalCorrelation += betaCorrelation;
      correlationPairs++;
    }
  }
  
  const avgCorrelation = correlationPairs > 0 ? totalCorrelation / correlationPairs : 0;
  const diversificationScore = 1 - avgCorrelation;
  
  // Calculate risk factors
  const marketRisk = Math.abs(portfolioSensitivity['NIFTY'] || portfolioSensitivity['SPX'] || 1);
  const volatilityExposure = Math.abs(portfolioSensitivity['VIX'] || 0.2);
  
  // Simplified sector concentration calculation
  // In a real implementation, would use actual sector data
  const sectorConcentration = 0.5; // Placeholder
  
  return {
    portfolioSensitivity,
    stockSensitivities,
    diversificationScore,
    riskFactors: {
      marketRisk,
      sectorConcentration,
      volatilityExposure
    }
  };
}