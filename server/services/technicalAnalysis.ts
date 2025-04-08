import { TechnicalData } from "@/lib/types";

export async function getTechnicalAnalysis(symbol: string): Promise<TechnicalData> {
  try {
    // In a real implementation, this would perform actual technical analysis
    // using a library like TA-Lib or call an external API
    
    // For the MVP, we return static mock data
    return {
      ema: {
        signal: "Bullish",
        description: "Price above all EMAs with 20-EMA crossing above 50-EMA (Golden Cross).",
        chartData: {
          price: generatePriceData(30, true),
          ema20: generateSmoothData(30, true, 5),
          ema50: generateSmoothData(30, true, 10),
          ema200: generateSmoothData(30, true, 15)
        }
      },
      rsi: {
        value: 52,
        signal: "Neutral",
        description: "RSI in neutral zone, showing moderate bullish momentum."
      },
      macd: {
        signal: "Bullish",
        description: "MACD line crossed above signal line 2 days ago, confirming bullish momentum.",
        chartData: {
          macd: generateOscillatorData(30, true),
          signal: generateOscillatorData(30, true, 5, 0.5),
          histogram: generateHistogramData(30)
        }
      },
      adx: {
        value: 28,
        signal: "Strong",
        description: "ADX above 25 indicates a strong trend. +DI above -DI suggests bullish direction.",
        chartData: {
          adx: generateTrendData(30, true, 20, 35),
          plusDI: generateTrendData(30, true, 15, 30),
          minusDI: generateTrendData(30, false, 10, 20)
        }
      },
      obv: {
        signal: "Bullish",
        description: "On-Balance Volume rising, confirming price uptrend with increasing volume.",
        chartData: generateCumulativeData(30, true)
      }
    };
  } catch (error) {
    console.error(`Error analyzing technical indicators for ${symbol}:`, error);
    throw new Error(`Failed to analyze technical indicators for ${symbol}`);
  }
}

// Helper functions to generate chart data

function generatePriceData(length: number, uptrend: boolean = true) {
  const result = [];
  let value = 50;
  
  for (let i = 0; i < length; i++) {
    const trend = uptrend ? 0.5 : -0.5;
    const randomness = (Math.random() * 3) - 1.5;
    value = Math.max(0, Math.min(100, value + trend + randomness));
    result.push(value);
  }
  
  return result;
}

function generateSmoothData(length: number, uptrend: boolean = true, lag: number = 0, scale: number = 1) {
  const priceData = generatePriceData(length + lag, uptrend);
  const result = [];
  
  // Simple moving average calculation
  for (let i = lag; i < priceData.length; i++) {
    let sum = 0;
    for (let j = 0; j < lag; j++) {
      sum += priceData[i - j];
    }
    result.push((sum / lag) * scale);
  }
  
  return result;
}

function generateOscillatorData(length: number, uptrend: boolean = true, lag: number = 0, scale: number = 1) {
  const result = [];
  let value = 0;
  
  for (let i = 0; i < length; i++) {
    const trend = uptrend ? 0.1 : -0.1;
    const randomness = (Math.random() * 0.4) - 0.2;
    // Oscillators typically move around zero
    value = Math.max(-2, Math.min(2, value + trend + randomness)) * scale;
    
    // Add a lag if specified
    if (i >= lag) {
      result.push(value);
    }
  }
  
  // Pad the beginning with appropriate values if needed
  while (result.length < length) {
    result.unshift(0);
  }
  
  return result;
}

function generateHistogramData(length: number) {
  const macdLine = generateOscillatorData(length, true);
  const signalLine = generateOscillatorData(length, true, 5, 0.8);
  
  return macdLine.map((value, index) => value - signalLine[index]);
}

function generateTrendData(length: number, uptrend: boolean = true, min: number = 10, max: number = 50) {
  const result = [];
  let value = min + ((max - min) / 2);
  
  for (let i = 0; i < length; i++) {
    const trend = uptrend ? 0.3 : -0.3;
    const randomness = (Math.random() * 2) - 1;
    value = Math.max(min, Math.min(max, value + trend + randomness));
    result.push(value);
  }
  
  return result;
}

function generateCumulativeData(length: number, uptrend: boolean = true) {
  const result = [];
  let value = 50;
  
  for (let i = 0; i < length; i++) {
    const trend = uptrend ? 1 : -1;
    const randomness = (Math.random() * 4) - 2;
    value = value + trend + randomness;
    result.push(value);
  }
  
  return result;
}
