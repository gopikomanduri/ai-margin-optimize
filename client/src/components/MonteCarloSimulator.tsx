import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, ArrowRight, LineChart } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SimulationAsset {
  symbol: string;
  weight: number;
  expectedAnnualReturn: number;
  annualVolatility: number;
}

interface SimulationResult {
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
    exceedanceProbability: number;
  };
  percentiles: Record<string, number>;
  successProbability: number;
  expectedValue: number;
  riskAssessment: {
    riskLevel: 'low' | 'moderate' | 'high';
    keyRisks: string[];
    riskRewardRatio: number;
  };
}

export default function MonteCarloSimulator() {
  const [initialInvestment, setInitialInvestment] = useState<number>(100000);
  const [timeHorizonDays, setTimeHorizonDays] = useState<number>(252);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Default assets for simulation
  const defaultAssets: SimulationAsset[] = [
    {
      symbol: "HDFCBANK",
      weight: 0.4,
      expectedAnnualReturn: 0.15,
      annualVolatility: 0.25
    },
    {
      symbol: "RELIANCE",
      weight: 0.3,
      expectedAnnualReturn: 0.12,
      annualVolatility: 0.22
    },
    {
      symbol: "INFY",
      weight: 0.3,
      expectedAnnualReturn: 0.10,
      annualVolatility: 0.28
    }
  ];

  const runSimulation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await apiRequest<SimulationResult>("/api/simulation/monte-carlo", {
        method: "POST",
        body: JSON.stringify({
          initialInvestment,
          timeHorizonDays,
          numSimulations: 1000,
          assets: defaultAssets,
          confidenceInterval: 0.95,
          drawdownThreshold: 0.2
        }),
      });
      
      setResult(data);
    } catch (err) {
      console.error("Monte Carlo simulation failed:", err);
      setError("Failed to run simulation. Please try again.");
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Monte Carlo Simulator</CardTitle>
        <CardDescription>
          Run a Monte Carlo simulation to forecast possible outcomes for your portfolio over time.
          This helps you understand the range of possibilities and associated risks.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="initial-investment">Initial Investment (₹)</Label>
            <Input
              id="initial-investment"
              type="number"
              value={initialInvestment}
              onChange={(e) => setInitialInvestment(Number(e.target.value))}
              min={1000}
              step={1000}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="time-horizon">Time Horizon (Days)</Label>
            <Input
              id="time-horizon"
              type="number"
              value={timeHorizonDays}
              onChange={(e) => setTimeHorizonDays(Number(e.target.value))}
              min={30}
              max={3650}
            />
            <p className="text-xs text-muted-foreground">
              252 days = 1 trading year
            </p>
          </div>
        </div>
        
        <div className="pt-2">
          <Button onClick={runSimulation} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Simulating...
              </>
            ) : (
              <>
                Run Simulation
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
              <h3 className="text-lg font-semibold mb-4">Simulation Results</h3>
              
              <Tabs defaultValue="summary">
                <TabsList className="mb-4">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="stats">Statistics</TabsTrigger>
                  <TabsTrigger value="risks">Risk Assessment</TabsTrigger>
                </TabsList>
                
                <TabsContent value="summary">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="py-3 px-4">
                          <CardTitle className="text-sm font-medium">Expected Value</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 px-4">
                          <div className="text-xl font-bold">{formatCurrency(result.expectedValue)}</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="py-3 px-4">
                          <CardTitle className="text-sm font-medium">Success Probability</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 px-4">
                          <div className="text-xl font-bold">{formatPercentage(result.successProbability)}</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="py-3 px-4">
                          <CardTitle className="text-sm font-medium">Potential Return</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 px-4">
                          <div className="text-xl font-bold">
                            {formatPercentage((result.expectedValue / initialInvestment) - 1)}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="py-3 px-4">
                          <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 px-4">
                          <div className="text-xl font-bold">{formatPercentage(result.drawdownStats.max)}</div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <Alert className={`mt-4 ${result.riskAssessment.riskLevel === 'high' ? 'border-red-400' : result.riskAssessment.riskLevel === 'moderate' ? 'border-yellow-400' : 'border-green-400'}`}>
                      <AlertTitle>Risk Level: {result.riskAssessment.riskLevel.charAt(0).toUpperCase() + result.riskAssessment.riskLevel.slice(1)}</AlertTitle>
                      <AlertDescription>
                        {result.riskAssessment.keyRisks[0]}
                      </AlertDescription>
                    </Alert>
                    
                    <div className="pt-2 flex justify-center">
                      <LineChart className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="stats">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Final Value Statistics</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium mb-2">Range</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Minimum</span>
                            <span className="font-medium">{formatCurrency(result.finalValueStats.min)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Maximum</span>
                            <span className="font-medium">{formatCurrency(result.finalValueStats.max)}</span>
                          </div>
                          <Separator className="my-1" />
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Range</span>
                            <span className="font-medium">{formatCurrency(result.finalValueStats.max - result.finalValueStats.min)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium mb-2">Central Tendency</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Mean</span>
                            <span className="font-medium">{formatCurrency(result.finalValueStats.mean)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Median</span>
                            <span className="font-medium">{formatCurrency(result.finalValueStats.median)}</span>
                          </div>
                          <Separator className="my-1" />
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Std Deviation</span>
                            <span className="font-medium">{formatCurrency(result.finalValueStats.stdDev)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Percentiles</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(result.percentiles).map(([percentile, value]) => (
                          <div key={percentile} className="flex justify-between">
                            <span className="text-sm text-muted-foreground">{percentile}</span>
                            <span className="font-medium">{formatCurrency(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="risks">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Risk Assessment</h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Risk-Reward Ratio</span>
                        <span className="font-medium">{result.riskAssessment.riskRewardRatio.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Drawdown Probability</span>
                        <span className="font-medium">{formatPercentage(result.drawdownStats.exceedanceProbability)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Confidence Interval (95%)</span>
                        <span className="font-medium">
                          {formatCurrency(result.finalValueStats.confidenceInterval[0])} - {formatCurrency(result.finalValueStats.confidenceInterval[1])}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Key Risks</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {result.riskAssessment.keyRisks.map((risk, index) => (
                          <li key={index} className="text-sm">{risk}</li>
                        ))}
                      </ul>
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
          Results are based on {result ? '1,000' : 'multiple'} simulations
        </div>
        <div>
          Not financial advice - For educational purposes only
        </div>
      </CardFooter>
    </Card>
  );
}