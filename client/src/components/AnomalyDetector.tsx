import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, ArrowRight, PieChart, AlertTriangle, ArrowUp, ArrowDown, Waves, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Anomaly {
  type: 'price' | 'volume' | 'volatility' | 'gap' | 'correlation';
  timestamp: Date;
  symbol: string;
  severity: 'low' | 'medium' | 'high';
  value: number;
  expectedRange: [number, number];
  description: string;
  potentialCauses?: string[];
  suggestedActions?: string[];
  relatedSymbols?: string[];
}

interface TradingOpportunity {
  type: 'mean_reversion' | 'trend_continuation' | 'volatility_play';
  description: string;
  relatedAnomaly: Anomaly;
  potentialGain: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface AnomalyDetectionResult {
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
  tradingOpportunities: TradingOpportunity[];
}

export default function AnomalyDetector() {
  const [symbol, setSymbol] = useState<string>("HDFCBANK");
  const [lookbackPeriod, setLookbackPeriod] = useState<number>(60);
  const [sensitivityLevel, setSensitivityLevel] = useState<"low" | "medium" | "high">("medium");
  const [includeVolume, setIncludeVolume] = useState<boolean>(true);
  const [includeGaps, setIncludeGaps] = useState<boolean>(true);
  const [includeVolatility, setIncludeVolatility] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AnomalyDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableSymbols = [
    { symbol: "HDFCBANK", name: "HDFC Bank" },
    { symbol: "INFY", name: "Infosys" },
    { symbol: "RELIANCE", name: "Reliance Industries" },
    { symbol: "TCS", name: "Tata Consultancy Services" },
    { symbol: "ICICIBANK", name: "ICICI Bank" },
  ];

  const detectAnomalies = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await apiRequest<AnomalyDetectionResult>("/api/market/anomalies", {
        method: "POST",
        body: JSON.stringify({
          symbol,
          lookbackPeriod,
          sensitivityLevel,
          includeVolume,
          includeGaps,
          includeVolatility,
          includeCorrelation: false,
          correlatedSymbols: []
        })
      });
      
      setResult(data);
    } catch (err) {
      console.error("Anomaly detection failed:", err);
      setError("Failed to detect anomalies. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatPercentage = (value: number): string => {
    return (value * 100).toFixed(2) + "%";
  };

  const getAnomalyTypeIcon = (type: string) => {
    switch (type) {
      case 'price':
        return <ArrowUp className="h-4 w-4" />;
      case 'volume':
        return <PieChart className="h-4 w-4" />;
      case 'volatility':
        return <Waves className="h-4 w-4" />;
      case 'gap':
        return <ArrowDown className="h-4 w-4" />;
      case 'correlation':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case 'medium':
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case 'low':
        return "bg-green-100 text-green-800 hover:bg-green-200";
      default:
        return "";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Market Anomaly Detector</CardTitle>
        <CardDescription>
          Identify unusual market behavior and trading opportunities using statistical anomaly detection.
          This tool analyzes price, volume, volatility, gaps, and correlation breakdowns.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Symbol</label>
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
            <label className="text-sm font-medium">Sensitivity Level</label>
            <Select 
              value={sensitivityLevel} 
              onValueChange={(value: "low" | "medium" | "high") => setSensitivityLevel(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select sensitivity level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (fewer anomalies)</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High (more anomalies)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Anomaly Types</label>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="include-volume"
                checked={includeVolume}
                onCheckedChange={(checked) => setIncludeVolume(!!checked)}
              />
              <Label htmlFor="include-volume">Volume Anomalies</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox 
                id="include-gaps"
                checked={includeGaps}
                onCheckedChange={(checked) => setIncludeGaps(!!checked)}
              />
              <Label htmlFor="include-gaps">Gap Anomalies</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox 
                id="include-volatility"
                checked={includeVolatility}
                onCheckedChange={(checked) => setIncludeVolatility(!!checked)}
              />
              <Label htmlFor="include-volatility">Volatility Anomalies</Label>
            </div>
          </div>
        </div>
        
        <div className="pt-2">
          <Button onClick={detectAnomalies} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Detecting Anomalies...
              </>
            ) : (
              <>
                Detect Anomalies
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
              <h3 className="text-lg font-semibold mb-4">Detection Results for {result.symbol}</h3>
              
              <Tabs defaultValue="anomalies">
                <TabsList className="mb-4">
                  <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
                  <TabsTrigger value="opportunities">Trading Opportunities</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                </TabsList>
                
                <TabsContent value="anomalies">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Detected Anomalies ({result.anomalies.length})</h4>
                    
                    {result.anomalies.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        No anomalies detected with current settings
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.anomalies.map((anomaly, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {getAnomalyTypeIcon(anomaly.type)}
                                  <span className="capitalize">{anomaly.type}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={getSeverityColor(anomaly.severity)}>
                                  {anomaly.severity}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDate(anomaly.timestamp.toString())}</TableCell>
                              <TableCell>{anomaly.description}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="opportunities">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Trading Opportunities ({result.tradingOpportunities.length})</h4>
                    
                    {result.tradingOpportunities.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        No trading opportunities detected
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Potential Gain</TableHead>
                            <TableHead>Risk Level</TableHead>
                            <TableHead>Description</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.tradingOpportunities.map((opportunity, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {opportunity.type === 'mean_reversion' ? (
                                    <ArrowDown className="h-4 w-4" />
                                  ) : opportunity.type === 'trend_continuation' ? (
                                    <TrendingUp className="h-4 w-4" />
                                  ) : (
                                    <Waves className="h-4 w-4" />
                                  )}
                                  <span className="capitalize">{opportunity.type.replace('_', ' ')}</span>
                                </div>
                              </TableCell>
                              <TableCell>{formatPercentage(opportunity.potentialGain)}</TableCell>
                              <TableCell>
                                <Badge className={getSeverityColor(opportunity.riskLevel)}>
                                  {opportunity.riskLevel}
                                </Badge>
                              </TableCell>
                              <TableCell>{opportunity.description}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="summary">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="py-3 px-4">
                          <CardTitle className="text-sm font-medium">Anomalies by Type</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 px-4 pb-3">
                          <ul className="space-y-1">
                            {Object.entries(result.summary.byType).map(([type, count]) => (
                              <li key={type} className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  {getAnomalyTypeIcon(type)}
                                  <span className="capitalize">{type}</span>
                                </div>
                                <span className="font-medium">{count}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="py-3 px-4">
                          <CardTitle className="text-sm font-medium">Anomalies by Severity</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 px-4 pb-3">
                          <ul className="space-y-1">
                            {Object.entries(result.summary.bySeverity).map(([severity, count]) => (
                              <li key={severity} className="flex justify-between items-center">
                                <Badge className={getSeverityColor(severity)}>
                                  {severity}
                                </Badge>
                                <span className="font-medium">{count}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p>Time Range: {formatDate(result.timeRange.start.toString())} to {formatDate(result.timeRange.end.toString())}</p>
                      <p>Total Anomalies: {result.summary.totalAnomalies}</p>
                      <p>Trading Opportunities: {result.tradingOpportunities.length}</p>
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
          Statistical analysis - Not financial advice
        </div>
        <div>
          Updated: {new Date().toLocaleDateString()}
        </div>
      </CardFooter>
    </Card>
  );
}