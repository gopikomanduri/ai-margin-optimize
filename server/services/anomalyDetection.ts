/**
 * Anomaly Detection Service
 * 
 * This service implements statistical methods to detect anomalies in market data,
 * including price movements, volume spikes, volatility changes, and correlation breakdowns.
 * It helps identify potential trading opportunities or risks.
 */

interface PriceData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  symbol: string; // Adding symbol to the interface
}

export interface AnomalyDetectionParams {
  symbol: string;
  lookbackPeriod: number; // How many days to look back for establishing baseline
  sensitivityLevel: 'low' | 'medium' | 'high'; // Affects detection thresholds
  includeVolume?: boolean;
  includeGaps?: boolean;
  includeVolatility?: boolean;
  includeCorrelation?: boolean;
  correlatedSymbols?: string[]; // For correlation anomalies
}

export interface Anomaly {
  type: 'price' | 'volume' | 'volatility' | 'gap' | 'correlation';
  timestamp: Date;
  symbol: string;
  severity: 'low' | 'medium' | 'high';
  value: number;
  expectedRange: [number, number];
  description: string;
  potentialCauses?: string[];
  suggestedActions?: string[];
  relatedSymbols?: string[]; // For correlation anomalies
}

export interface AnomalyDetectionResult {
  symbol: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  anomalies: Anomaly[];
  summary: {
    totalAnomalies: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  };
  tradingOpportunities: Array<{
    type: 'mean_reversion' | 'trend_continuation' | 'volatility_play';
    description: string;
    relatedAnomaly: Anomaly;
    potentialGain: number;
    riskLevel: 'low' | 'medium' | 'high';
  }>;
}

/**
 * Detect anomalies in market data for a specific symbol
 */
export async function detectAnomalies(params: AnomalyDetectionParams): Promise<AnomalyDetectionResult> {
  const {
    symbol,
    lookbackPeriod,
    sensitivityLevel,
    includeVolume = true,
    includeGaps = true,
    includeVolatility = true,
    includeCorrelation = false,
    correlatedSymbols = []
  } = params;
  
  // Step 1: Fetch historical data
  const historicalData = await fetchHistoricalData(symbol, lookbackPeriod);
  
  // Step 2: Detect different types of anomalies
  const anomalies: Anomaly[] = [];
  
  // Price anomalies (always included)
  const priceAnomalies = detectPriceAnomalies(historicalData, sensitivityLevel);
  anomalies.push(...priceAnomalies);
  
  // Volume anomalies (optional)
  if (includeVolume) {
    const volumeAnomalies = detectVolumeAnomalies(historicalData, sensitivityLevel);
    anomalies.push(...volumeAnomalies);
  }
  
  // Gap anomalies (optional)
  if (includeGaps) {
    const gapAnomalies = detectGapAnomalies(historicalData, sensitivityLevel);
    anomalies.push(...gapAnomalies);
  }
  
  // Volatility anomalies (optional)
  if (includeVolatility) {
    const volatilityAnomalies = detectVolatilityAnomalies(historicalData, sensitivityLevel);
    anomalies.push(...volatilityAnomalies);
  }
  
  // Correlation anomalies (optional)
  if (includeCorrelation && correlatedSymbols.length > 0) {
    const correlationAnomalies = await detectCorrelationAnomalies(
      symbol, 
      correlatedSymbols,
      lookbackPeriod,
      sensitivityLevel
    );
    anomalies.push(...correlationAnomalies);
  }
  
  // Step 3: Generate trading opportunities
  const tradingOpportunities = generateTradingOpportunities(anomalies, historicalData);
  
  // Step 4: Generate result summary
  const summary = {
    totalAnomalies: anomalies.length,
    byType: anomalies.reduce((counts, anomaly) => {
      counts[anomaly.type] = (counts[anomaly.type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>),
    bySeverity: anomalies.reduce((counts, anomaly) => {
      counts[anomaly.severity] = (counts[anomaly.severity] || 0) + 1;
      return counts;
    }, {} as Record<string, number>)
  };
  
  return {
    symbol,
    timeRange: {
      start: historicalData[0].timestamp,
      end: historicalData[historicalData.length - 1].timestamp
    },
    anomalies,
    summary,
    tradingOpportunities
  };
}

/**
 * Fetch historical price and volume data
 */
async function fetchHistoricalData(symbol: string, days: number): Promise<PriceData[]> {
  // In a real implementation, this would fetch data from financial APIs
  // For now, we'll generate synthetic data based on the symbol
  
  const data: PriceData[] = [];
  const basePrice = symbol.charCodeAt(0) % 10 * 10 + 50; // Generate base price from symbol
  const volatility = (symbol.charCodeAt(1) % 5 + 1) / 100; // Generate volatility from symbol
  
  // Create a date object for the starting date
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);
  
  let currentPrice = basePrice;
  let trend = 0;
  
  // Generate data for each day
  for (let i = 0; i <= days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    // Skip weekends
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      continue;
    }
    
    // Update trend (slow-changing component)
    if (i % 20 === 0) {
      trend = (Math.random() - 0.5) * 0.001;
    }
    
    // Daily random walk with trend component
    const dailyReturn = trend + (Math.random() - 0.5) * volatility;
    currentPrice *= (1 + dailyReturn);
    
    // Generate high, low, open prices based on close
    const dailyVolatility = volatility * currentPrice;
    const high = currentPrice + Math.random() * dailyVolatility;
    const low = currentPrice - Math.random() * dailyVolatility;
    const open = low + Math.random() * (high - low);
    
    // Generate volume - typically correlates with price volatility
    const volumeBase = 100000 + Math.random() * 900000;
    const volumeMultiplier = 1 + Math.abs(dailyReturn) * 20; // Higher volume on bigger moves
    const volume = Math.round(volumeBase * volumeMultiplier);
    
    // Add data point
    data.push({
      timestamp: currentDate,
      open,
      high,
      low,
      close: currentPrice,
      volume,
      symbol // Add the symbol to each data point
    });
    
    // Occasionally add anomalies
    if (Math.random() < 0.05) {
      // Price spike/crash
      currentPrice *= (Math.random() < 0.5) ? 
        (1 + volatility * 5) : // spike
        (1 - volatility * 5);  // crash
    }
  }
  
  return data;
}

/**
 * Detect price anomalies using statistical methods
 */
function detectPriceAnomalies(data: PriceData[], sensitivityLevel: 'low' | 'medium' | 'high'): Anomaly[] {
  const anomalies: Anomaly[] = [];
  
  // Calculate returns
  const returns: number[] = [];
  for (let i = 1; i < data.length; i++) {
    returns.push((data[i].close - data[i-1].close) / data[i-1].close);
  }
  
  // Calculate mean and standard deviation of returns
  const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
  const stdDev = Math.sqrt(
    returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / returns.length
  );
  
  // Set threshold based on sensitivity level
  let threshold = 2.0; // Default medium (2 standard deviations)
  if (sensitivityLevel === 'low') {
    threshold = 3.0;
  } else if (sensitivityLevel === 'high') {
    threshold = 1.5;
  }
  
  // Look for anomalies in recent data (skip training period)
  const trainingPeriod = Math.floor(data.length / 2);
  for (let i = trainingPeriod; i < data.length; i++) {
    const returnIndex = i - 1;
    if (returnIndex >= 0 && returnIndex < returns.length) {
      const currentReturn = returns[returnIndex];
      const deviation = Math.abs(currentReturn - mean) / stdDev;
      
      if (deviation > threshold) {
        const severity: 'low' | 'medium' | 'high' = 
          deviation > threshold * 1.5 ? 'high' :
          deviation > threshold * 1.2 ? 'medium' : 'low';
        
        const isPositive = currentReturn > mean;
        
        anomalies.push({
          type: 'price',
          timestamp: data[i].timestamp,
          symbol: data[i].symbol,
          severity,
          value: currentReturn,
          expectedRange: [mean - stdDev, mean + stdDev],
          description: `Unusual ${isPositive ? 'positive' : 'negative'} price movement of ${(currentReturn * 100).toFixed(2)}% (${deviation.toFixed(1)} standard deviations from mean)`,
          potentialCauses: [
            isPositive ? 'Positive news or earnings' : 'Negative news or earnings',
            'Large institutional buying or selling',
            'Market overreaction',
            'Sector rotation'
          ],
          suggestedActions: [
            severity === 'high' ? 
              (isPositive ? 'Consider taking profits or trimming position' : 'Possible dip buying opportunity if fundamentals unchanged') : 
              'Monitor closely for follow-through movement'
          ]
        });
      }
    }
  }
  
  return anomalies;
}

/**
 * Detect volume anomalies
 */
function detectVolumeAnomalies(data: PriceData[], sensitivityLevel: 'low' | 'medium' | 'high'): Anomaly[] {
  const anomalies: Anomaly[] = [];
  
  // Calculate log of volumes to normalize
  const logVolumes: number[] = data.map(d => Math.log(d.volume));
  
  // Calculate mean and standard deviation of volumes
  const mean = logVolumes.reduce((sum, val) => sum + val, 0) / logVolumes.length;
  const stdDev = Math.sqrt(
    logVolumes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / logVolumes.length
  );
  
  // Set threshold based on sensitivity level
  let threshold = 2.0; // Default medium
  if (sensitivityLevel === 'low') {
    threshold = 3.0;
  } else if (sensitivityLevel === 'high') {
    threshold = 1.5;
  }
  
  // Look for anomalies in recent data (skip training period)
  const trainingPeriod = Math.floor(data.length / 2);
  for (let i = trainingPeriod; i < data.length; i++) {
    const logVolume = logVolumes[i];
    const deviation = Math.abs(logVolume - mean) / stdDev;
    
    if (deviation > threshold) {
      const severity: 'low' | 'medium' | 'high' = 
        deviation > threshold * 1.5 ? 'high' :
        deviation > threshold * 1.2 ? 'medium' : 'low';
      
      const isHigh = logVolume > mean;
      
      // Calculate the volume ratio compared to average
      const volumeRatio = Math.exp(logVolume - mean);
      
      anomalies.push({
        type: 'volume',
        timestamp: data[i].timestamp,
        symbol: data[i].symbol,
        severity,
        value: data[i].volume,
        expectedRange: [
          Math.exp(mean - stdDev),
          Math.exp(mean + stdDev)
        ],
        description: `Unusual ${isHigh ? 'high' : 'low'} volume: ${volumeRatio.toFixed(1)}x typical volume`,
        potentialCauses: [
          isHigh ? 'Large institutional activity' : 'Lack of interest',
          isHigh ? 'Major news event' : 'Market holiday or low liquidity period',
          isHigh ? 'Index rebalancing' : 'Waiting for catalyst'
        ],
        suggestedActions: [
          isHigh ? 'Volume confirms price movement direction' : 'Low volume moves may reverse',
          isHigh && severity === 'high' ? 'May indicate trend reversal point' : 'Monitor for follow-through'
        ]
      });
    }
  }
  
  return anomalies;
}

/**
 * Detect price gaps between trading sessions
 */
function detectGapAnomalies(data: PriceData[], sensitivityLevel: 'low' | 'medium' | 'high'): Anomaly[] {
  const anomalies: Anomaly[] = [];
  
  // Calculate gaps as percentage of price
  const gaps: number[] = [];
  for (let i = 1; i < data.length; i++) {
    gaps.push((data[i].open - data[i-1].close) / data[i-1].close);
  }
  
  // Calculate mean and standard deviation of gaps
  const mean = gaps.reduce((sum, val) => sum + val, 0) / gaps.length;
  const stdDev = Math.sqrt(
    gaps.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / gaps.length
  );
  
  // Set threshold based on sensitivity level
  let threshold = 2.0; // Default medium
  if (sensitivityLevel === 'low') {
    threshold = 3.0;
  } else if (sensitivityLevel === 'high') {
    threshold = 1.5;
  }
  
  // Look for anomalies in recent data (skip training period)
  const trainingPeriod = Math.floor(data.length / 2);
  for (let i = trainingPeriod; i < data.length; i++) {
    const gapIndex = i - 1;
    if (gapIndex >= 0 && gapIndex < gaps.length) {
      const gap = gaps[gapIndex];
      const deviation = Math.abs(gap - mean) / stdDev;
      
      if (deviation > threshold) {
        const severity: 'low' | 'medium' | 'high' = 
          deviation > threshold * 1.5 ? 'high' :
          deviation > threshold * 1.2 ? 'medium' : 'low';
        
        const isUp = gap > 0;
        
        anomalies.push({
          type: 'gap',
          timestamp: data[i].timestamp,
          symbol: data[i].symbol,
          severity,
          value: gap,
          expectedRange: [mean - stdDev, mean + stdDev],
          description: `${isUp ? 'Up' : 'Down'} gap of ${(gap * 100).toFixed(2)}% between sessions`,
          potentialCauses: [
            'Overnight news or earnings',
            'Pre-market institutional activity',
            'Global market events affecting opening price'
          ],
          suggestedActions: [
            severity === 'high' ? 
              (isUp ? 'Watch for gap fill (reversals often occur)' : 'Down gaps often continue intraday') : 
              'Gaps in direction of prevailing trend tend to hold'
          ]
        });
      }
    }
  }
  
  return anomalies;
}

/**
 * Detect volatility anomalies
 */
function detectVolatilityAnomalies(data: PriceData[], sensitivityLevel: 'low' | 'medium' | 'high'): Anomaly[] {
  const anomalies: Anomaly[] = [];
  
  // Calculate daily true range as volatility measure
  const trueRanges: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const highLowRange = data[i].high - data[i].low;
    const highCloseDiff = Math.abs(data[i].high - data[i-1].close);
    const lowCloseDiff = Math.abs(data[i].low - data[i-1].close);
    
    const tr = Math.max(highLowRange, highCloseDiff, lowCloseDiff);
    const trPercent = tr / data[i-1].close; // Normalize by price
    
    trueRanges.push(trPercent);
  }
  
  // Use rolling window for volatility comparison
  const windowSize = 5;
  const volatility: number[] = [];
  
  for (let i = windowSize; i < trueRanges.length; i++) {
    const windowAvg = trueRanges
      .slice(i - windowSize, i)
      .reduce((sum, val) => sum + val, 0) / windowSize;
    
    volatility.push(windowAvg);
  }
  
  // Calculate mean and standard deviation of volatility
  const mean = volatility.reduce((sum, val) => sum + val, 0) / volatility.length;
  const stdDev = Math.sqrt(
    volatility.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / volatility.length
  );
  
  // Set threshold based on sensitivity level
  let threshold = 2.0; // Default medium
  if (sensitivityLevel === 'low') {
    threshold = 3.0;
  } else if (sensitivityLevel === 'high') {
    threshold = 1.5;
  }
  
  // Look for anomalies in recent data
  const dataOffset = 1 + windowSize; // Offset for data index
  for (let i = 0; i < volatility.length; i++) {
    const currentVol = volatility[i];
    const deviation = Math.abs(currentVol - mean) / stdDev;
    
    if (deviation > threshold) {
      const severity: 'low' | 'medium' | 'high' = 
        deviation > threshold * 1.5 ? 'high' :
        deviation > threshold * 1.2 ? 'medium' : 'low';
      
      const isHigh = currentVol > mean;
      
      // Calculate how many times normal volatility
      const volRatio = currentVol / mean;
      
      anomalies.push({
        type: 'volatility',
        timestamp: data[i + dataOffset].timestamp,
        symbol: data[i + dataOffset].symbol,
        severity,
        value: currentVol,
        expectedRange: [mean - stdDev, mean + stdDev],
        description: `${isHigh ? 'High' : 'Low'} volatility period: ${volRatio.toFixed(1)}x normal levels`,
        potentialCauses: [
          isHigh ? 'Uncertainty in the market' : 'Consolidation phase',
          isHigh ? 'Approaching major news event' : 'Lack of catalysts',
          isHigh ? 'Change in market regime' : 'Summer or holiday trading'
        ],
        suggestedActions: [
          isHigh ? 'Reduce position size due to higher risk' : 'Opportunity for selling options premium',
          isHigh ? 'Set wider stops to avoid noise' : 'Look for breakout setups from low volatility'
        ]
      });
    }
  }
  
  return anomalies;
}

/**
 * Detect correlation anomalies between related assets
 */
async function detectCorrelationAnomalies(
  baseSymbol: string,
  correlatedSymbols: string[],
  lookbackPeriod: number,
  sensitivityLevel: 'low' | 'medium' | 'high'
): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];
  
  // Get data for base symbol
  const baseData = await fetchHistoricalData(baseSymbol, lookbackPeriod);
  
  // Calculate returns for base symbol
  const baseReturns: number[] = [];
  for (let i = 1; i < baseData.length; i++) {
    baseReturns.push((baseData[i].close - baseData[i-1].close) / baseData[i-1].close);
  }
  
  // Window size for rolling correlation
  const windowSize = 20; // 20-day rolling correlation
  
  // Process each correlated symbol
  for (const symbol of correlatedSymbols) {
    // Get data for correlated symbol
    const corrData = await fetchHistoricalData(symbol, lookbackPeriod);
    
    // Calculate returns for correlated symbol
    const corrReturns: number[] = [];
    for (let i = 1; i < corrData.length; i++) {
      corrReturns.push((corrData[i].close - corrData[i-1].close) / corrData[i-1].close);
    }
    
    // Calculate historical correlation
    const baselineCorrelation = calculateCorrelation(baseReturns, corrReturns);
    
    // Calculate rolling correlations
    const rollingCorrelations: number[] = [];
    for (let i = windowSize; i < baseReturns.length; i++) {
      const baseWindow = baseReturns.slice(i - windowSize, i);
      const corrWindow = corrReturns.slice(i - windowSize, i);
      
      const correlation = calculateCorrelation(baseWindow, corrWindow);
      rollingCorrelations.push(correlation);
    }
    
    // Calculate mean and std dev of correlation changes
    const correlationChanges: number[] = [];
    for (let i = 1; i < rollingCorrelations.length; i++) {
      correlationChanges.push(rollingCorrelations[i] - rollingCorrelations[i-1]);
    }
    
    const mean = correlationChanges.reduce((sum, val) => sum + val, 0) / correlationChanges.length;
    const stdDev = Math.sqrt(
      correlationChanges.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / correlationChanges.length
    );
    
    // Set threshold based on sensitivity level
    let threshold = 2.0; // Default medium
    if (sensitivityLevel === 'low') {
      threshold = 3.0;
    } else if (sensitivityLevel === 'high') {
      threshold = 1.5;
    }
    
    // Look for anomalies in correlation
    const dataOffset = windowSize + 1; // Offset for data index
    for (let i = 1; i < rollingCorrelations.length; i++) {
      const change = correlationChanges[i-1];
      const deviation = Math.abs(change - mean) / stdDev;
      
      if (deviation > threshold) {
        const currentCorr = rollingCorrelations[i];
        const prevCorr = rollingCorrelations[i-1];
        const isDecreasing = currentCorr < prevCorr;
        
        const severity: 'low' | 'medium' | 'high' = 
          deviation > threshold * 1.5 ? 'high' :
          deviation > threshold * 1.2 ? 'medium' : 'low';
        
        anomalies.push({
          type: 'correlation',
          timestamp: baseData[i + dataOffset].timestamp,
          symbol: baseSymbol,
          severity,
          value: currentCorr,
          expectedRange: [baselineCorrelation - 0.3, baselineCorrelation + 0.3],
          description: `Correlation with ${symbol} ${isDecreasing ? 'decreased' : 'increased'} to ${currentCorr.toFixed(2)} from ${prevCorr.toFixed(2)}`,
          potentialCauses: [
            'Sector rotation',
            'Asset-specific news affecting one but not the other',
            'Change in market regime',
            'Changing risk relationships'
          ],
          suggestedActions: [
            'Reconsider pairs trading strategies',
            'Review diversification assumptions',
            'Watch for reversion to normal correlation'
          ],
          relatedSymbols: [symbol]
        });
      }
    }
  }
  
  return anomalies;
}

/**
 * Calculate correlation between two arrays
 */
function calculateCorrelation(array1: number[], array2: number[]): number {
  if (array1.length !== array2.length || array1.length === 0) {
    return 0;
  }
  
  const n = array1.length;
  
  // Calculate means
  const mean1 = array1.reduce((sum, val) => sum + val, 0) / n;
  const mean2 = array2.reduce((sum, val) => sum + val, 0) / n;
  
  // Calculate covariance and variances
  let covariance = 0;
  let variance1 = 0;
  let variance2 = 0;
  
  for (let i = 0; i < n; i++) {
    const diff1 = array1[i] - mean1;
    const diff2 = array2[i] - mean2;
    
    covariance += diff1 * diff2;
    variance1 += diff1 * diff1;
    variance2 += diff2 * diff2;
  }
  
  // Avoid division by zero
  if (variance1 === 0 || variance2 === 0) {
    return 0;
  }
  
  return covariance / Math.sqrt(variance1 * variance2);
}

/**
 * Generate trading opportunities based on detected anomalies
 */
function generateTradingOpportunities(
  anomalies: Anomaly[],
  priceData: PriceData[]
): Array<{
  type: 'mean_reversion' | 'trend_continuation' | 'volatility_play';
  description: string;
  relatedAnomaly: Anomaly;
  potentialGain: number;
  riskLevel: 'low' | 'medium' | 'high';
}> {
  const opportunities: Array<{
    type: 'mean_reversion' | 'trend_continuation' | 'volatility_play';
    description: string;
    relatedAnomaly: Anomaly;
    potentialGain: number;
    riskLevel: 'low' | 'medium' | 'high';
  }> = [];
  
  // Get the latest price
  const latestPrice = priceData[priceData.length - 1].close;
  
  // Focus on recent anomalies (last 5 days)
  const recentAnomalies = anomalies.filter(a => {
    const daysDiff = (new Date().getTime() - a.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 5;
  });
  
  for (const anomaly of recentAnomalies) {
    if (anomaly.type === 'price' && anomaly.severity === 'high') {
      // Large price anomalies may suggest mean reversion
      const isPositive = anomaly.value > (anomaly.expectedRange[0] + anomaly.expectedRange[1]) / 2;
      
      opportunities.push({
        type: 'mean_reversion',
        description: `Mean reversion ${isPositive ? 'short' : 'long'} opportunity after large price ${isPositive ? 'spike' : 'drop'}`,
        relatedAnomaly: anomaly,
        potentialGain: Math.abs(anomaly.value) * 0.5, // Assuming 50% reversion
        riskLevel: 'medium'
      });
    }
    
    if (anomaly.type === 'volume' && anomaly.severity !== 'low') {
      // Volume spikes often precede continued movement
      const priceAnomaly = anomalies.find(a => 
        a.type === 'price' && 
        Math.abs(a.timestamp.getTime() - anomaly.timestamp.getTime()) < 24 * 60 * 60 * 1000
      );
      
      if (priceAnomaly) {
        const direction = priceAnomaly.value > 0 ? 'upward' : 'downward';
        
        opportunities.push({
          type: 'trend_continuation',
          description: `Trend continuation ${direction} after volume spike confirms price movement`,
          relatedAnomaly: anomaly,
          potentialGain: Math.abs(priceAnomaly.value) * 0.7, // 70% continuation
          riskLevel: 'medium'
        });
      }
    }
    
    if (anomaly.type === 'volatility') {
      // Volatility anomalies suggest option strategies
      const isHigh = anomaly.value > (anomaly.expectedRange[0] + anomaly.expectedRange[1]) / 2;
      
      if (isHigh) {
        opportunities.push({
          type: 'volatility_play',
          description: 'Option selling opportunity during high volatility period',
          relatedAnomaly: anomaly,
          potentialGain: anomaly.value * 2, // Volatility premium
          riskLevel: 'high'
        });
      } else {
        opportunities.push({
          type: 'volatility_play',
          description: 'Long option/straddle opportunity ahead of potential volatility increase',
          relatedAnomaly: anomaly,
          potentialGain: 0.05, // Moderate gains from volatility expansion
          riskLevel: 'low'
        });
      }
    }
    
    if (anomaly.type === 'gap' && anomaly.severity === 'high') {
      // Gap trading strategies
      const isGapUp = anomaly.value > 0;
      
      opportunities.push({
        type: 'mean_reversion',
        description: `${isGapUp ? 'Gap fill short' : 'Gap fill long'} opportunity after significant opening gap`,
        relatedAnomaly: anomaly,
        potentialGain: Math.abs(anomaly.value) * 0.8, // 80% gap fill potential
        riskLevel: isGapUp ? 'medium' : 'high' // Down gaps riskier to fade
      });
    }
    
    if (anomaly.type === 'correlation' && anomaly.severity !== 'low') {
      // Correlation breakdowns suggest pairs trading
      opportunities.push({
        type: 'mean_reversion',
        description: `Pairs trading opportunity as correlation between ${anomaly.symbol} and ${anomaly.relatedSymbols?.[0] || 'related asset'} breaks down`,
        relatedAnomaly: anomaly,
        potentialGain: 0.03, // 3% gain on pair convergence
        riskLevel: 'low'
      });
    }
  }
  
  return opportunities;
}