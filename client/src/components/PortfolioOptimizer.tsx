import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, ArrowRight, BarChart3, PieChart } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface OptimizationResult {
  optimalWeights: Record<string, number>;
  expectedReturn: number;
  expectedVolatility: number;
  sharpeRatio: number;
}

export default function PortfolioOptimizer() {
  const [riskTolerance, setRiskTolerance] = useState<"conservative" | "moderate" | "aggressive">("moderate");
  const [investmentHorizon, setInvestmentHorizon] = useState<"short" | "medium" | "long">("medium");
  const [selectedAssets, setSelectedAssets] = useState<string[]>(["HDFCBANK", "INFY", "RELIANCE", "TCS", "ICICIBANK"]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const optimize = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await apiRequest<OptimizationResult>("/api/portfolio/optimize", {
        method: "POST",
        body: JSON.stringify({
          riskTolerance,
          investmentHorizon,
          assets: selectedAssets,
        }),
      });
      
      setResult(data);
    } catch (err) {
      console.error("Portfolio optimization failed:", err);
      setError("Failed to optimize portfolio. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatPercentage = (value: number): string => {
    return (value * 100).toFixed(2) + "%";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Portfolio Optimizer</CardTitle>
        <CardDescription>
          Optimize your portfolio using Modern Portfolio Theory to find the optimal asset allocation
          based on your risk profile and investment horizon.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Risk Tolerance</label>
            <Select 
              value={riskTolerance} 
              onValueChange={(value) => setRiskTolerance(value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select risk tolerance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conservative">Conservative</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="aggressive">Aggressive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Investment Horizon</label>
            <Select 
              value={investmentHorizon} 
              onValueChange={(value) => setInvestmentHorizon(value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select investment horizon" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short-term (&lt; 1 year)</SelectItem>
                <SelectItem value="medium">Medium-term (1-3 years)</SelectItem>
                <SelectItem value="long">Long-term (&gt; 3 years)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="pt-2">
          <Button onClick={optimize} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                Optimize Portfolio
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
              <h3 className="text-lg font-semibold mb-4">Optimization Results</h3>
              
              <Tabs defaultValue="allocation">
                <TabsList className="mb-4">
                  <TabsTrigger value="allocation">Allocation</TabsTrigger>
                  <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
                </TabsList>
                
                <TabsContent value="allocation">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Optimal Asset Allocation</h4>
                    
                    <div className="space-y-3">
                      {Object.entries(result.optimalWeights).map(([symbol, weight]) => (
                        <div key={symbol} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span>{symbol}</span>
                            <span className="font-medium">{formatPercentage(weight)}</span>
                          </div>
                          <Progress value={weight * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-2 flex justify-center">
                      <PieChart className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="metrics">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="py-4 px-6">
                          <CardTitle className="text-sm font-medium">Expected Return</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 px-6">
                          <div className="text-2xl font-bold">{formatPercentage(result.expectedReturn)}</div>
                          <p className="text-xs text-muted-foreground">Annualized</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="py-4 px-6">
                          <CardTitle className="text-sm font-medium">Expected Volatility</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 px-6">
                          <div className="text-2xl font-bold">{formatPercentage(result.expectedVolatility)}</div>
                          <p className="text-xs text-muted-foreground">Annualized</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="py-4 px-6">
                          <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 px-6">
                          <div className="text-2xl font-bold">{result.sharpeRatio.toFixed(2)}</div>
                          <p className="text-xs text-muted-foreground">Risk-adjusted return</p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="pt-2 flex justify-center">
                      <BarChart3 className="h-6 w-6 text-muted-foreground" />
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
          Based on Modern Portfolio Theory
        </div>
        <div>
          Updated: {new Date().toLocaleDateString()}
        </div>
      </CardFooter>
    </Card>
  );
}