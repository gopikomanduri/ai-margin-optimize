/**
 * Monte Carlo Simulation Service
 * 
 * This service provides Monte Carlo simulations for analyzing trading strategies,
 * portfolio performance, and risk assessment under different market scenarios.
 */

export interface SimulationParams {
  initialInvestment: number;
  timeHorizonDays: number;
  numSimulations: number;
  assets: Array<{
    symbol: string;
    weight: number;
    expectedAnnualReturn: number;
    annualVolatility: number;
  }>;
  confidenceInterval?: number; // e.g., 0.95 for 95% confidence
  drawdownThreshold?: number; // e.g., 0.2 for 20% max drawdown alert
}

export interface SimulationResult {
  // Simulation results
  simulationPaths: number[][];
  finalValueStats: {
    mean: number;
    median: number;
    min: number;
    max: number;
    stdDev: number;
    confidenceInterval: [number, number];
  };
  drawdownStats: {
    mean: number;
    median: number;
    max: number;
    exceedanceProbability: number; // Probability of exceeding threshold
  };
  
  // Percentiles of final values
  percentiles: Record<string, number>; // e.g., "10%": 5420, "50%": 7890, etc.
  
  // Summary
  successProbability: number; // Probability of profit
  expectedValue: number; // Expected final value
  riskAssessment: {
    riskLevel: 'low' | 'moderate' | 'high';
    keyRisks: string[];
    riskRewardRatio: number;
  };
}

/**
 * Run Monte Carlo simulation for portfolio or strategy analysis
 */
export function runMonteCarloSimulation(params: SimulationParams): SimulationResult {
  const {
    initialInvestment,
    timeHorizonDays,
    numSimulations,
    assets,
    confidenceInterval = 0.95,
    drawdownThreshold = 0.2
  } = params;
  
  // Validate input parameters
  if (assets.reduce((sum, asset) => sum + asset.weight, 0) !== 1) {
    throw new Error("Asset weights must sum to 1");
  }
  
  // Calculate portfolio parameters
  const portfolioReturn = assets.reduce(
    (sum, asset) => sum + asset.weight * asset.expectedAnnualReturn, 
    0
  );
  
  // Calculate volatility with correlation (simplified, assuming correlation of 0.5 between assets)
  let portfolioVariance = 0;
  for (let i = 0; i < assets.length; i++) {
    for (let j = 0; j < assets.length; j++) {
      const correlation = i === j ? 1 : 0.5; // Simplification: 0.5 correlation between different assets
      portfolioVariance += 
        assets[i].weight * 
        assets[j].weight * 
        assets[i].annualVolatility * 
        assets[j].annualVolatility * 
        correlation;
    }
  }
  const portfolioVolatility = Math.sqrt(portfolioVariance);
  
  // Daily parameters
  const dailyReturn = portfolioReturn / 252; // ~ 252 trading days in a year
  const dailyVolatility = portfolioVolatility / Math.sqrt(252);
  
  // Run simulations
  const simulationPaths: number[][] = [];
  const finalValues: number[] = [];
  const maxDrawdowns: number[] = [];
  
  for (let sim = 0; sim < numSimulations; sim++) {
    const path: number[] = [initialInvestment];
    let peak = initialInvestment;
    let maxDrawdown = 0;
    
    for (let day = 1; day <= timeHorizonDays; day++) {
      // Generate random return using normal distribution
      const randomReturn = generateNormalRandom(dailyReturn, dailyVolatility);
      
      // Calculate new portfolio value
      const prevValue = path[day - 1];
      const newValue = prevValue * (1 + randomReturn);
      path.push(newValue);
      
      // Track peak and calculate drawdown
      if (newValue > peak) {
        peak = newValue;
      } else {
        const drawdown = (peak - newValue) / peak;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
    }
    
    simulationPaths.push(path);
    finalValues.push(path[path.length - 1]);
    maxDrawdowns.push(maxDrawdown);
  }
  
  // Calculate statistics
  finalValues.sort((a, b) => a - b);
  maxDrawdowns.sort((a, b) => a - b);
  
  const mean = calculateMean(finalValues);
  const median = calculateMedian(finalValues);
  const stdDev = calculateStdDev(finalValues, mean);
  
  // Calculate confidence interval
  const alpha = 1 - confidenceInterval;
  const z = calculateNormalQuantile(1 - alpha / 2); // Two-tailed
  const marginOfError = z * stdDev / Math.sqrt(numSimulations);
  const ciLower = mean - marginOfError;
  const ciUpper = mean + marginOfError;
  
  // Calculate percentiles
  const percentiles: Record<string, number> = {
    "1%": calculatePercentile(finalValues, 0.01),
    "5%": calculatePercentile(finalValues, 0.05),
    "10%": calculatePercentile(finalValues, 0.1),
    "25%": calculatePercentile(finalValues, 0.25),
    "50%": calculatePercentile(finalValues, 0.5),
    "75%": calculatePercentile(finalValues, 0.75),
    "90%": calculatePercentile(finalValues, 0.9),
    "95%": calculatePercentile(finalValues, 0.95),
    "99%": calculatePercentile(finalValues, 0.99),
  };
  
  // Calculate success probability (probability of profit)
  const profitCount = finalValues.filter(val => val > initialInvestment).length;
  const successProbability = profitCount / numSimulations;
  
  // Calculate drawdown statistics
  const meanDrawdown = calculateMean(maxDrawdowns);
  const medianDrawdown = calculateMedian(maxDrawdowns);
  const maxDrawdown = Math.max(...maxDrawdowns);
  const drawdownExceedances = maxDrawdowns.filter(d => d > drawdownThreshold).length;
  const drawdownExceedanceProbability = drawdownExceedances / numSimulations;
  
  // Risk assessment
  let riskLevel: 'low' | 'moderate' | 'high';
  if (drawdownExceedanceProbability < 0.1) {
    riskLevel = 'low';
  } else if (drawdownExceedanceProbability < 0.3) {
    riskLevel = 'moderate';
  } else {
    riskLevel = 'high';
  }
  
  const keyRisks: string[] = [];
  if (drawdownExceedanceProbability > 0.2) {
    keyRisks.push(`${Math.round(drawdownExceedanceProbability * 100)}% chance of exceeding ${drawdownThreshold * 100}% drawdown`);
  }
  if (percentiles["5%"] < initialInvestment * 0.8) {
    keyRisks.push(`5% chance of losing more than ${Math.round((1 - percentiles["5%"] / initialInvestment) * 100)}% of investment`);
  }
  if (portfolioVolatility > 0.25) {
    keyRisks.push("High portfolio volatility may lead to large fluctuations");
  }
  
  // Risk-reward ratio: expected gain vs potential loss at 5% percentile
  const expectedGain = mean - initialInvestment;
  const potentialLoss = initialInvestment - percentiles["5%"];
  const riskRewardRatio = expectedGain > 0 && potentialLoss > 0 
    ? expectedGain / potentialLoss 
    : 0;
  
  return {
    simulationPaths,
    finalValueStats: {
      mean,
      median,
      min: Math.min(...finalValues),
      max: Math.max(...finalValues),
      stdDev,
      confidenceInterval: [ciLower, ciUpper]
    },
    drawdownStats: {
      mean: meanDrawdown,
      median: medianDrawdown,
      max: maxDrawdown,
      exceedanceProbability: drawdownExceedanceProbability
    },
    percentiles,
    successProbability,
    expectedValue: mean,
    riskAssessment: {
      riskLevel,
      keyRisks,
      riskRewardRatio
    }
  };
}

/**
 * Generate a random number from normal distribution
 */
function generateNormalRandom(mean: number, stdDev: number): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  
  return mean + stdDev * z0;
}

/**
 * Calculate mean of an array
 */
function calculateMean(arr: number[]): number {
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

/**
 * Calculate median of a sorted array
 */
function calculateMedian(sortedArr: number[]): number {
  const mid = Math.floor(sortedArr.length / 2);
  return sortedArr.length % 2 !== 0
    ? sortedArr[mid]
    : (sortedArr[mid - 1] + sortedArr[mid]) / 2;
}

/**
 * Calculate standard deviation
 */
function calculateStdDev(arr: number[], mean: number): number {
  const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

/**
 * Calculate percentile of a sorted array
 */
function calculatePercentile(sortedArr: number[], percentile: number): number {
  const index = Math.max(0, Math.min(Math.floor(percentile * sortedArr.length), sortedArr.length - 1));
  return sortedArr[index];
}

/**
 * Approximate the quantile (inverse CDF) of the standard normal distribution
 * This is used to calculate Z scores for confidence intervals
 */
function calculateNormalQuantile(p: number): number {
  // Approximation of the inverse error function
  function erfInv(x: number): number {
    const a = 0.147;
    const y = Math.log(1 - x * x);
    const z = 2 / (Math.PI * a) + y / 2;
    return Math.sign(x) * Math.sqrt(Math.sqrt(z * z - y / a) - z);
  }
  
  // Convert to standard normal quantile
  return Math.sqrt(2) * erfInv(2 * p - 1);
}

/**
 * Run a simulation for a single trading strategy or portfolio
 */
export function simulateStrategy(params: {
  initialCapital: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  tradesPerYear: number;
  years: number;
  numSimulations: number;
}): {
  simulationPaths: number[][];
  finalCapital: {
    mean: number;
    median: number;
    min: number;
    max: number;
    percentiles: Record<string, number>;
  };
  maxDrawdown: {
    mean: number;
    median: number;
    max: number;
  };
  cagr: {
    mean: number;
    median: number;
  };
  profitProbability: number;
} {
  const {
    initialCapital,
    winRate,
    avgWin,
    avgLoss,
    tradesPerYear,
    years,
    numSimulations
  } = params;
  
  if (winRate < 0 || winRate > 1) {
    throw new Error("Win rate must be between 0 and 1");
  }
  
  const totalTrades = Math.round(tradesPerYear * years);
  const simulationPaths: number[][] = [];
  const finalValues: number[] = [];
  const maxDrawdowns: number[] = [];
  const cagrs: number[] = [];
  
  for (let sim = 0; sim < numSimulations; sim++) {
    const equity: number[] = [initialCapital];
    let capital = initialCapital;
    let peak = initialCapital;
    let maxDrawdown = 0;
    
    for (let trade = 1; trade <= totalTrades; trade++) {
      // Determine if trade is a win or loss
      const isWin = Math.random() < winRate;
      
      // Calculate profit/loss amount
      const amount = capital * (isWin ? avgWin : -avgLoss);
      
      // Update capital
      capital += amount;
      equity.push(capital);
      
      // Track peak and calculate drawdown
      if (capital > peak) {
        peak = capital;
      } else {
        const drawdown = (peak - capital) / peak;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
      
      // Safety check: if bankrupt, break
      if (capital <= 0) {
        // Fill the remaining trades with zero
        for (let i = trade + 1; i <= totalTrades; i++) {
          equity.push(0);
        }
        capital = 0;
        maxDrawdown = 1;
        break;
      }
    }
    
    simulationPaths.push(equity);
    finalValues.push(capital);
    maxDrawdowns.push(maxDrawdown);
    
    // Calculate CAGR
    if (capital > 0) {
      const cagr = Math.pow(capital / initialCapital, 1 / years) - 1;
      cagrs.push(cagr);
    } else {
      cagrs.push(-1); // 100% loss = -100% CAGR
    }
  }
  
  // Sort arrays for percentile calculations
  finalValues.sort((a, b) => a - b);
  maxDrawdowns.sort((a, b) => a - b);
  cagrs.sort((a, b) => a - b);
  
  // Calculate statistics
  const meanCapital = calculateMean(finalValues);
  const medianCapital = calculateMedian(finalValues);
  const meanDrawdown = calculateMean(maxDrawdowns);
  const medianDrawdown = calculateMedian(maxDrawdowns);
  const meanCAGR = calculateMean(cagrs);
  const medianCAGR = calculateMedian(cagrs);
  
  // Calculate percentiles for final capital
  const percentiles: Record<string, number> = {
    "1%": calculatePercentile(finalValues, 0.01),
    "5%": calculatePercentile(finalValues, 0.05),
    "10%": calculatePercentile(finalValues, 0.1),
    "25%": calculatePercentile(finalValues, 0.25),
    "50%": calculatePercentile(finalValues, 0.5),
    "75%": calculatePercentile(finalValues, 0.75),
    "90%": calculatePercentile(finalValues, 0.9),
    "95%": calculatePercentile(finalValues, 0.95),
    "99%": calculatePercentile(finalValues, 0.99),
  };
  
  // Calculate profit probability
  const profitCount = finalValues.filter(val => val > initialCapital).length;
  const profitProbability = profitCount / numSimulations;
  
  return {
    simulationPaths,
    finalCapital: {
      mean: meanCapital,
      median: medianCapital,
      min: Math.min(...finalValues),
      max: Math.max(...finalValues),
      percentiles
    },
    maxDrawdown: {
      mean: meanDrawdown,
      median: medianDrawdown,
      max: Math.max(...maxDrawdowns)
    },
    cagr: {
      mean: meanCAGR,
      median: medianCAGR
    },
    profitProbability
  };
}