/**
 * Portfolio Optimization Service
 * 
 * This service implements Modern Portfolio Theory (MPT) for optimizing portfolio allocations
 * based on historical returns, volatility, and correlation between assets.
 */

interface Asset {
  symbol: string;
  name: string;
  historicalReturns: number[];
  expectedReturn: number;
  volatility: number;
  weight?: number;
}

interface OptimizationResult {
  optimalWeights: Record<string, number>;
  expectedReturn: number;
  expectedVolatility: number;
  sharpeRatio: number;
}

interface OptimizationParams {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentHorizon: 'short' | 'medium' | 'long';
  assets: string[];
  constraints?: {
    minWeight?: Record<string, number>;
    maxWeight?: Record<string, number>;
  };
}

/**
 * Optimize portfolio based on modern portfolio theory
 * 
 * @param params Optimization parameters including risk tolerance and assets
 * @returns Optimal portfolio weights and expected performance metrics
 */
export async function optimizePortfolio(params: OptimizationParams): Promise<OptimizationResult> {
  // Get historical data for assets
  const assets = await Promise.all(
    params.assets.map(async (symbol) => {
      const historicalData = await getHistoricalData(symbol);
      return {
        symbol,
        name: getAssetName(symbol),
        historicalReturns: calculateReturns(historicalData),
        expectedReturn: calculateExpectedReturn(historicalData, params.investmentHorizon),
        volatility: calculateVolatility(historicalData)
      } as Asset;
    })
  );

  // Calculate correlation matrix
  const correlationMatrix = calculateCorrelationMatrix(assets);
  
  // Apply risk profile
  const riskMultiplier = getRiskMultiplier(params.riskTolerance);
  
  // Run optimization algorithm
  const optimalPortfolio = findEfficientPortfolio(assets, correlationMatrix, riskMultiplier, params.constraints);
  
  return {
    optimalWeights: assets.reduce((weights, asset, index) => {
      weights[asset.symbol] = optimalPortfolio.weights[index];
      return weights;
    }, {} as Record<string, number>),
    expectedReturn: optimalPortfolio.expectedReturn,
    expectedVolatility: optimalPortfolio.expectedVolatility,
    sharpeRatio: optimalPortfolio.sharpeRatio
  };
}

/**
 * Get historical price data for a given asset
 */
async function getHistoricalData(symbol: string): Promise<number[]> {
  // In a real implementation, this would fetch data from financial APIs
  // For now, we'll use mock data based on the symbol's characteristics
  
  // This is a simplified approach - in production, this would connect to
  // financial data APIs or databases with historical prices
  const baseValue = symbol.charCodeAt(0) % 10 + 1;
  const volatilityFactor = (symbol.charCodeAt(1) % 5 + 1) / 10;
  const trendFactor = ((symbol.charCodeAt(2) % 7) - 3) / 100;
  
  const prices: number[] = [];
  let price = 100 * baseValue;
  
  // Generate 252 days (1 trading year) of data
  for (let i = 0; i < 252; i++) {
    price = price * (1 + trendFactor + (Math.random() - 0.5) * volatilityFactor);
    prices.push(price);
  }
  
  return prices;
}

/**
 * Get asset name from symbol
 */
function getAssetName(symbol: string): string {
  // This would normally look up the name from a database
  // For now we'll return a placeholder
  const commonNames: Record<string, string> = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corp.',
    'GOOGL': 'Alphabet Inc.',
    'AMZN': 'Amazon.com Inc.',
    'TSLA': 'Tesla Inc.',
    'FB': 'Meta Platforms Inc.',
    'NFLX': 'Netflix Inc.',
    'NVDA': 'NVIDIA Corp.',
    'HDFCBANK': 'HDFC Bank Ltd.',
    'INFY': 'Infosys Ltd.',
    'RELIANCE': 'Reliance Industries Ltd.',
    'TCS': 'Tata Consultancy Services Ltd.'
  };
  
  return commonNames[symbol] || `${symbol} Stock`;
}

/**
 * Calculate return series from price data
 */
function calculateReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1]);
  }
  return returns;
}

/**
 * Calculate expected return based on historical data and investment horizon
 */
function calculateExpectedReturn(prices: number[], horizon: 'short' | 'medium' | 'long'): number {
  const returns = calculateReturns(prices);
  
  // Different horizons use different weightings of historical data
  switch (horizon) {
    case 'short':
      // More weight to recent performance
      return weightedAverage(returns, 0.8);
    case 'medium':
      // More balanced view
      return weightedAverage(returns, 0.5);
    case 'long':
      // Long-term average with less recency bias
      return average(returns);
    default:
      return average(returns);
  }
}

/**
 * Calculate volatility (standard deviation of returns)
 */
function calculateVolatility(prices: number[]): number {
  const returns = calculateReturns(prices);
  const avg = average(returns);
  const squaredDiffs = returns.map(r => Math.pow(r - avg, 2));
  return Math.sqrt(average(squaredDiffs));
}

/**
 * Calculate correlation matrix between assets
 */
function calculateCorrelationMatrix(assets: Asset[]): number[][] {
  const n = assets.length;
  const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    // Diagonal is always 1 (perfect correlation with self)
    matrix[i][i] = 1;
    
    for (let j = i + 1; j < n; j++) {
      const correlation = calculateCorrelation(
        assets[i].historicalReturns,
        assets[j].historicalReturns
      );
      
      // Matrix is symmetric
      matrix[i][j] = correlation;
      matrix[j][i] = correlation;
    }
  }
  
  return matrix;
}

/**
 * Calculate correlation between two return series
 */
function calculateCorrelation(returns1: number[], returns2: number[]): number {
  const n = Math.min(returns1.length, returns2.length);
  
  if (n === 0) return 0;
  
  const mean1 = average(returns1);
  const mean2 = average(returns2);
  
  let numerator = 0;
  let denom1 = 0;
  let denom2 = 0;
  
  for (let i = 0; i < n; i++) {
    const diff1 = returns1[i] - mean1;
    const diff2 = returns2[i] - mean2;
    numerator += diff1 * diff2;
    denom1 += diff1 * diff1;
    denom2 += diff2 * diff2;
  }
  
  if (denom1 === 0 || denom2 === 0) return 0;
  
  return numerator / Math.sqrt(denom1 * denom2);
}

/**
 * Calculate simple average of an array
 */
function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

/**
 * Calculate weighted average with recency bias
 * @param arr Array of values
 * @param recencyBias Value between 0-1 indicating weight of recent vs old data
 */
function weightedAverage(arr: number[], recencyBias: number): number {
  if (arr.length === 0) return 0;
  
  let sum = 0;
  let weightSum = 0;
  
  for (let i = 0; i < arr.length; i++) {
    // Calculate weight: newer items get higher weight
    const position = i / arr.length;
    const weight = 1 + recencyBias * position;
    
    sum += arr[i] * weight;
    weightSum += weight;
  }
  
  return sum / weightSum;
}

/**
 * Get risk multiplier based on risk tolerance
 */
function getRiskMultiplier(riskTolerance: 'conservative' | 'moderate' | 'aggressive'): number {
  switch (riskTolerance) {
    case 'conservative':
      return 0.5;  // More emphasis on minimizing volatility
    case 'moderate':
      return 1.0;  // Balanced approach
    case 'aggressive':
      return 2.0;  // More emphasis on maximizing returns
    default:
      return 1.0;
  }
}

/**
 * Find efficient portfolio using optimization
 */
function findEfficientPortfolio(
  assets: Asset[],
  correlationMatrix: number[][],
  riskMultiplier: number,
  constraints?: { minWeight?: Record<string, number>; maxWeight?: Record<string, number> }
): {
  weights: number[];
  expectedReturn: number;
  expectedVolatility: number;
  sharpeRatio: number;
} {
  const n = assets.length;
  
  // Start with equal weights
  let weights = Array(n).fill(1 / n);
  
  // Apply constraints if provided
  if (constraints) {
    weights = applyConstraints(weights, assets, constraints);
  }
  
  // Crude optimization using gradient descent
  // In a real implementation, a proper optimization library would be used
  const iterations = 1000;
  const learningRate = 0.01;
  
  for (let iter = 0; iter < iterations; iter++) {
    // Calculate current portfolio metrics
    const { expectedReturn, volatility } = calculatePortfolioMetrics(
      assets, weights, correlationMatrix
    );
    
    // Utility function to maximize: return - risk*volatility
    const utility = expectedReturn - riskMultiplier * volatility;
    
    // Calculate gradients for each weight
    const gradients = calculateGradients(
      assets, weights, correlationMatrix, riskMultiplier
    );
    
    // Update weights
    for (let i = 0; i < n; i++) {
      weights[i] += learningRate * gradients[i];
    }
    
    // Normalize weights to sum to 1
    const sum = weights.reduce((a, b) => a + b, 0);
    weights = weights.map(w => w / sum);
    
    // Apply constraints again
    if (constraints) {
      weights = applyConstraints(weights, assets, constraints);
    }
  }
  
  // Calculate final portfolio metrics
  const { expectedReturn, volatility } = calculatePortfolioMetrics(
    assets, weights, correlationMatrix
  );
  
  const riskFreeRate = 0.02; // Assuming 2% risk-free rate
  const sharpeRatio = (expectedReturn - riskFreeRate) / volatility;
  
  return {
    weights,
    expectedReturn,
    expectedVolatility: volatility,
    sharpeRatio
  };
}

/**
 * Apply weight constraints to portfolio
 */
function applyConstraints(
  weights: number[],
  assets: Asset[],
  constraints: { minWeight?: Record<string, number>; maxWeight?: Record<string, number> }
): number[] {
  const n = weights.length;
  const newWeights = [...weights];
  
  // Apply min/max constraints
  for (let i = 0; i < n; i++) {
    const symbol = assets[i].symbol;
    
    if (constraints.minWeight && constraints.minWeight[symbol] !== undefined) {
      newWeights[i] = Math.max(newWeights[i], constraints.minWeight[symbol]);
    }
    
    if (constraints.maxWeight && constraints.maxWeight[symbol] !== undefined) {
      newWeights[i] = Math.min(newWeights[i], constraints.maxWeight[symbol]);
    }
  }
  
  // Normalize to sum to 1
  const sum = newWeights.reduce((a, b) => a + b, 0);
  return newWeights.map(w => w / sum);
}

/**
 * Calculate portfolio metrics (expected return and volatility)
 */
function calculatePortfolioMetrics(
  assets: Asset[],
  weights: number[],
  correlationMatrix: number[][]
): { expectedReturn: number; volatility: number } {
  const n = assets.length;
  
  // Calculate expected return
  let expectedReturn = 0;
  for (let i = 0; i < n; i++) {
    expectedReturn += weights[i] * assets[i].expectedReturn;
  }
  
  // Calculate portfolio variance
  let variance = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      variance += weights[i] * weights[j] * 
                 assets[i].volatility * assets[j].volatility * 
                 correlationMatrix[i][j];
    }
  }
  
  return {
    expectedReturn,
    volatility: Math.sqrt(variance)
  };
}

/**
 * Calculate gradients for optimization
 */
function calculateGradients(
  assets: Asset[],
  weights: number[],
  correlationMatrix: number[][],
  riskMultiplier: number
): number[] {
  const n = assets.length;
  const epsilon = 0.0001;
  const gradients: number[] = Array(n).fill(0);
  
  // Calculate base utility
  const { expectedReturn, volatility } = calculatePortfolioMetrics(
    assets, weights, correlationMatrix
  );
  const baseUtility = expectedReturn - riskMultiplier * volatility;
  
  // Calculate gradient for each weight using finite differences
  for (let i = 0; i < n; i++) {
    const perturbedWeights = [...weights];
    perturbedWeights[i] += epsilon;
    
    // Normalize
    const sum = perturbedWeights.reduce((a, b) => a + b, 0);
    const normalizedWeights = perturbedWeights.map(w => w / sum);
    
    // Calculate new utility
    const { expectedReturn: newReturn, volatility: newVol } = calculatePortfolioMetrics(
      assets, normalizedWeights, correlationMatrix
    );
    const newUtility = newReturn - riskMultiplier * newVol;
    
    // Estimate gradient
    gradients[i] = (newUtility - baseUtility) / epsilon;
  }
  
  return gradients;
}