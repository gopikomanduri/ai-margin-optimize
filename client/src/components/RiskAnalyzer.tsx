import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, ArrowRight, ShieldAlert, BadgeCheck, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface RiskMetrics {
  stopLossPercent: number;
  takeProfitPercent: number;
  riskRewardRatio: number;
  probProfitable: number;
  expectedValue: number;
  expectedValuePercent: number;
  maxLossPercent: number;
  valueAtRisk: {
    "95%": number;
    "99%": number;
  };
  kellyPercentage: number;
  kellyPositionSize: number;
}

interface SimulationResults {
  expectedValue: number;
  percentiles: Record<string, number>;
  successProbability: number;
  drawdownProbability: number;
}

interface RiskAnalysisResult {
  symbol: string;
  positionType: string;
  positionSize: number;
  riskMetrics: RiskMetrics;
  simulationResults: SimulationResults;
  recommendations: string[];
}

export default function RiskAnalyzer() {
  const [symbol, setSymbol] = useState<string>("HDFCBANK");
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [stopLoss, setStopLoss] = useState<number | undefined>();
  const [takeProfit, setTakeProfit] = useState<number | undefined>();
  const [positionType, setPositionType] = useState<"long" | "short">("long");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<RiskAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableSymbols = [
    { symbol: "HDFCBANK", name: "HDFC Bank" },
    { symbol: "INFY", name: "Infosys" },
    { symbol: "RELIANCE", name: "Reliance Industries" },
    { symbol: "TCS", name: "Tata Consultancy Services" },
    { symbol: "ICICIBANK", name: "ICICI Bank" },
  ];

  const analyzeRisk = async () => {
    if (!entryPrice || !quantity || entryPrice <= 0 || quantity <= 0) {
      setError("Please enter valid entry price and quantity");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const data = await apiRequest<RiskAnalysisResult>("/api/risk/analyze", {
        method: "POST",
        body: JSON.stringify({
          symbol,
          entryPrice,
          quantity,
          stopLoss,
          takeProfit,
          positionType,
        })
      });
      
      setResult(data);
    } catch (err) {
      console.error("Risk analysis failed:", err);
      setError("Failed to analyze risk. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return (value * 100).toFixed(2) + "%";
  };

  const getTradeQuality = (riskRewardRatio: number, probProfitable: number): "good" | "moderate" | "poor" => {
    if (riskRewardRatio >= 2 && probProfitable >= 0.5) return "good";
    if (riskRewardRatio >= 1 && probProfitable >= 0.4) return "moderate";
    return "poor";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Position Risk Analyzer</CardTitle>
        <CardDescription>
          Analyze the risk profile of a trading position using Monte Carlo simulation to
          calculate probability of profit, expected value, and optimal position sizing.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="symbol">Symbol</Label>
            <Select 
              value={symbol} 
              onValueChange={setSymbol}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a symbol" />
              </SelectTrigger>
              <SelectContent>
                {availableSymbols.map((s) => (
                  <SelectItem key={s.symbol} value={s.symbol}>
                    {s.symbol} - {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="position-type">Position Type</Label>
            <Select 
              value={positionType} 
              onValueChange={(value: "long" | "short") => setPositionType(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select position type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="long">Long</SelectItem>
                <SelectItem value="short">Short</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="entry-price">Entry Price (₹)</Label>
            <Input
              id="entry-price"
              type="number"
              value={entryPrice || ""}
              onChange={(e) => setEntryPrice(Number(e.target.value))}
              placeholder="Enter entry price"
              min={0}
              step={0.1}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity || ""}
              onChange={(e) => setQuantity(Number(e.target.value))}
              placeholder="Enter quantity"
              min={1}
              step={1}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="stop-loss">Stop Loss (Optional)</Label>
            <Input
              id="stop-loss"
              type="number"
              value={stopLoss || ""}
              onChange={(e) => setStopLoss(Number(e.target.value) || undefined)}
              placeholder="Enter stop loss price"
              min={0}
              step={0.1}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="take-profit">Take Profit (Optional)</Label>
            <Input
              id="take-profit"
              type="number"
              value={takeProfit || ""}
              onChange={(e) => setTakeProfit(Number(e.target.value) || undefined)}
              placeholder="Enter take profit price"
              min={0}
              step={0.1}
            />
          </div>
        </div>
        
        <div className="pt-2">
          <Button onClick={analyzeRisk} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Risk...
              </>
            ) : (
              <>
                Analyze Risk
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-50 p-3 rounded-md text-red-600 text-sm mt-4">
            {error}
          </div>
        )}
        
        {result && (
          <div className="mt-6 space-y-6">
            <Separator />
            
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Risk Analysis Results - {result.symbol} ({result.positionType.toUpperCase()})
              </h3>
              
              <Tabs defaultValue="summary">
                <TabsList className="mb-4">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="metrics">Risk Metrics</TabsTrigger>
                  <TabsTrigger value="simulation">Simulation Results</TabsTrigger>
                </TabsList>
                
                <TabsContent value="summary">
                  <div className="space-y-4">
                    {/* Position Overview Card */}
                    <Card>
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm font-medium">Position Overview</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 px-4 pb-3">
                        <div className="grid grid-cols-2 gap-y-2">
                          <div className="text-sm text-muted-foreground">Position Size:</div>
                          <div className="text-sm font-medium">{formatCurrency(result.positionSize)}</div>
                          
                          <div className="text-sm text-muted-foreground">Type:</div>
                          <div className="text-sm font-medium capitalize">{result.positionType}</div>
                          
                          <div className="text-sm text-muted-foreground">Stop Loss:</div>
                          <div className="text-sm font-medium">
                            {result.riskMetrics.stopLossPercent ? 
                              formatPercentage(result.riskMetrics.stopLossPercent) :
                              "Not Set"}
                          </div>
                          
                          <div className="text-sm text-muted-foreground">Take Profit:</div>
                          <div className="text-sm font-medium">
                            {result.riskMetrics.takeProfitPercent ? 
                              formatPercentage(result.riskMetrics.takeProfitPercent) :
                              "Not Set"}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Trade Quality Analysis */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Trade Quality Analysis</h4>
                      
                      {/* Trade Quality Alert */}
                      {result.riskMetrics.riskRewardRatio && (
                        <Alert className={
                          getTradeQuality(
                            result.riskMetrics.riskRewardRatio, 
                            result.riskMetrics.probProfitable
                          ) === "good" ? 
                            "border-green-400" : 
                            getTradeQuality(
                              result.riskMetrics.riskRewardRatio, 
                              result.riskMetrics.probProfitable
                            ) === "moderate" ? 
                              "border-yellow-400" : 
                              "border-red-400"
                        }>
                          <div className="flex items-center gap-2">
                            {getTradeQuality(
                              result.riskMetrics.riskRewardRatio, 
                              result.riskMetrics.probProfitable
                            ) === "good" ? (
                              <BadgeCheck className="h-4 w-4 text-green-500" />
                            ) : getTradeQuality(
                              result.riskMetrics.riskRewardRatio, 
                              result.riskMetrics.probProfitable
                            ) === "moderate" ? (
                              <ShieldAlert className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <AlertTitle className="capitalize">
                              {getTradeQuality(
                                result.riskMetrics.riskRewardRatio, 
                                result.riskMetrics.probProfitable
                              )} Trade Setup
                            </AlertTitle>
                          </div>
                          <AlertDescription>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              {result.recommendations.map((rec, index) => (
                                <li key={index} className="text-sm">{rec}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {/* Key Metrics */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                          <CardHeader className="py-3 px-4">
                            <CardTitle className="text-sm font-medium">Risk/Reward</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0 px-4 pb-3">
                            <div className="text-xl font-bold">
                              {result.riskMetrics.riskRewardRatio.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {result.riskMetrics.riskRewardRatio >= 2 ? 
                                "Excellent" : 
                                result.riskMetrics.riskRewardRatio >= 1 ? 
                                  "Good" : 
                                  "Poor"}
                            </p>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="py-3 px-4">
                            <CardTitle className="text-sm font-medium">Probability</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0 px-4 pb-3">
                            <div className="text-xl font-bold">
                              {formatPercentage(result.riskMetrics.probProfitable)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Chance of Profit
                            </p>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="py-3 px-4">
                            <CardTitle className="text-sm font-medium">Expected Value</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0 px-4 pb-3">
                            <div className="text-xl font-bold">
                              {formatPercentage(result.riskMetrics.expectedValuePercent)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(result.riskMetrics.expectedValue)}
                            </p>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="py-3 px-4">
                            <CardTitle className="text-sm font-medium">Kelly %</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0 px-4 pb-3">
                            <div className="text-xl font-bold">
                              {formatPercentage(result.riskMetrics.kellyPercentage)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Optimal Allocation
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                    
                    {/* Position Sizing */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Recommended Position Size</h4>
                      
                      <div className="flex items-center gap-2">
                        <div className="w-full">
                          <Progress value={
                            (result.positionSize / (result.riskMetrics.kellyPositionSize * 2)) * 100
                          } className="h-2" />
                        </div>
                        <div className="text-sm font-medium w-24 flex-shrink-0">
                          {formatCurrency(result.riskMetrics.kellyPositionSize)}
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Kelly Formula suggests an optimal position size of {formatCurrency(result.riskMetrics.kellyPositionSize)},
                        which is {formatPercentage(result.riskMetrics.kellyPositionSize / result.positionSize)} of your current position.
                        {result.riskMetrics.kellyPositionSize < result.positionSize ? 
                          " Consider reducing position size." : 
                          " Your position size is conservative."}
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="metrics">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">Risk Parameters</h4>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Stop Loss</span>
                            <span className="font-medium">{formatPercentage(result.riskMetrics.stopLossPercent)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Take Profit</span>
                            <span className="font-medium">{formatPercentage(result.riskMetrics.takeProfitPercent)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Risk/Reward Ratio</span>
                            <span className="font-medium">{result.riskMetrics.riskRewardRatio.toFixed(2)}</span>
                          </div>
                          <Separator className="my-1" />
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Maximum Loss %</span>
                            <span className="font-medium">{formatPercentage(result.riskMetrics.maxLossPercent)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">Performance Metrics</h4>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Probability of Profit</span>
                            <span className="font-medium">{formatPercentage(result.riskMetrics.probProfitable)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Expected Value</span>
                            <span className="font-medium">{formatCurrency(result.riskMetrics.expectedValue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Expected Return %</span>
                            <span className="font-medium">{formatPercentage(result.riskMetrics.expectedValuePercent)}</span>
                          </div>
                          <Separator className="my-1" />
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Kelly Percentage</span>
                            <span className="font-medium">{formatPercentage(result.riskMetrics.kellyPercentage)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Value at Risk (VaR)</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="py-3 px-4">
                            <CardTitle className="text-sm font-medium">95% VaR</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0 px-4 pb-3">
                            <div className="text-lg font-bold">
                              {formatCurrency(result.riskMetrics.valueAtRisk["95%"])}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatPercentage(result.riskMetrics.valueAtRisk["95%"] / result.positionSize)} of position
                            </p>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="py-3 px-4">
                            <CardTitle className="text-sm font-medium">99% VaR</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0 px-4 pb-3">
                            <div className="text-lg font-bold">
                              {formatCurrency(result.riskMetrics.valueAtRisk["99%"])}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatPercentage(result.riskMetrics.valueAtRisk["99%"] / result.positionSize)} of position
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="simulation">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Monte Carlo Simulation Results</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="py-3 px-4">
                          <CardTitle className="text-sm font-medium">Expected Value</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 px-4 pb-3">
                          <div className="text-lg font-bold">
                            {formatCurrency(result.simulationResults.expectedValue)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            After {positionType === "long" ? "30 days" : "30 days"}
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="py-3 px-4">
                          <CardTitle className="text-sm font-medium">Success Probability</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 px-4 pb-3">
                          <div className="text-lg font-bold">
                            {formatPercentage(result.simulationResults.successProbability)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Probability of profit
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="py-3 px-4">
                          <CardTitle className="text-sm font-medium">Drawdown Risk</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 px-4 pb-3">
                          <div className="text-lg font-bold">
                            {formatPercentage(result.simulationResults.drawdownProbability)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Probability of {formatPercentage(Math.abs(result.riskMetrics.stopLossPercent || 0.2))}+ drawdown
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Outcome Percentiles</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-sm font-medium mb-2">Worst Outcomes</h5>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">1% (Worst case)</span>
                              <span className="font-medium">{formatCurrency(result.simulationResults.percentiles["1%"])}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">5%</span>
                              <span className="font-medium">{formatCurrency(result.simulationResults.percentiles["5%"])}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">10%</span>
                              <span className="font-medium">{formatCurrency(result.simulationResults.percentiles["10%"])}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-medium mb-2">Best Outcomes</h5>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">90%</span>
                              <span className="font-medium">{formatCurrency(result.simulationResults.percentiles["90%"])}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">95%</span>
                              <span className="font-medium">{formatCurrency(result.simulationResults.percentiles["95%"])}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">99% (Best case)</span>
                              <span className="font-medium">{formatCurrency(result.simulationResults.percentiles["99%"])}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex items-center justify-between border-t p-4 text-sm text-muted-foreground">
        <div>
          Based on Monte Carlo simulation with 500 iterations
        </div>
        <div>
          Not financial advice - For educational purposes only
        </div>
      </CardFooter>
    </Card>
  );
}