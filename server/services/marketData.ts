export async function getMarketData() {
  try {
    // In a real implementation, this would fetch data from a market data API
    // For the MVP, we'll return static mock data
    
    // This would be replaced with actual API calls to services like
    // Alpha Vantage, Yahoo Finance, etc.
    
    return {
      indices: [
        {
          symbol: "NIFTY",
          value: "22,457",
          change: 152.80,
          changePercent: 0.68,
          chartData: generateChartData(15, true) // Uptrend
        },
        {
          symbol: "BANKNIFTY",
          value: "48,128",
          change: 439.35,
          changePercent: 0.92,
          chartData: generateChartData(15, true) // Uptrend
        }
      ],
      topGainers: [
        { symbol: "HDFCBANK", name: "HDFC Bank", change: 2.3 },
        { symbol: "INFY", name: "Infosys", change: 1.8 },
        { symbol: "RELIANCE", name: "Reliance", change: 1.6 }
      ],
      topLosers: [
        { symbol: "TECHM", name: "Tech Mahindra", change: -1.2 },
        { symbol: "WIPRO", name: "Wipro", change: -0.9 },
        { symbol: "POWERGRID", name: "Power Grid", change: -0.7 }
      ],
      volume: {
        total: "4.2B",
        change: 8.5
      },
      breadth: {
        advances: 32,
        declines: 18,
        unchanged: 0
      }
    };
  } catch (error) {
    console.error("Error fetching market data:", error);
    throw new Error("Failed to fetch market data");
  }
}

// Helper to generate chart data points
function generateChartData(points: number, uptrend: boolean = true) {
  const result = [];
  let value = 50;
  
  for (let i = 0; i < points; i++) {
    // Add some randomness
    const change = (Math.random() * 4) - (uptrend ? 1 : 3);
    value = Math.max(0, Math.min(100, value + change));
    result.push(value);
  }
  
  return result;
}
