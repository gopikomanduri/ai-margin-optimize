import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingDown, TrendingUp, IndianRupee, ArrowRight, Info } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PledgedStock = {
  id: number;
  symbol: string;
  name: string;
  quantity: number;
  pledgedQuantity: number;
  currentPrice: number;
  pledgedValue: number;
  haircut: number;
  marginAvailable: number;
  broker: string;
  lastUpdated: string;
};

type PledgedHoldingsData = {
  pledgedStocks: PledgedStock[];
  totalPledgedValue: number;
  totalMarginAvailable: number;
  totalMarginUtilized: number;
};

type OptimizationRecommendation = {
  stockId: number;
  symbol: string;
  name: string;
  currentPledgedQuantity: number;
  recommendedPledgedQuantity: number;
  quantityToUnpledge: number;
  currentPrice: number;
  valueToFree: number;
  priorityScore: number;
  reason: string;
};

type OptimizationData = {
  recommendations: OptimizationRecommendation[];
  potentialSavings: number;
  confidence: number;
  marketFactors: {
    newsSentiment: Record<string, number>;
    volatilityMetrics: Record<string, number>;
    macroFactors: Array<{
      factor: string;
      sentiment: string;
      impact: string;
    }>;
  };
};

type UnpledgeDialogProps = {
  open: boolean;
  onClose: () => void;
  stock: PledgedStock | null;
  recommendation?: OptimizationRecommendation;
};

const UnpledgeDialog = ({ open, onClose, stock, recommendation }: UnpledgeDialogProps) => {
  const [quantity, setQuantity] = useState(recommendation?.quantityToUnpledge || 0);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"request" | "otp">("request");
  const [requestId, setRequestId] = useState("");
  const { toast } = useToast();
  
  if (!stock) return null;
  
  const handleSubmit = async () => {
    try {
      // For demo purposes we're simulating the API call
      // In a real implementation, this would call the unpledge API
      
      if (step === "request") {
        // Create unpledge request
        const mockRequestId = "UP" + Math.floor(Math.random() * 1000000);
        setRequestId(mockRequestId);
        setStep("otp");
        
        toast({
          title: "OTP requested",
          description: "An OTP has been sent to your registered mobile number.",
        });
      } else {
        // Verify OTP and complete unpledge
        toast({
          title: "Unpledge successful",
          description: `Successfully unpledged ${quantity} shares of ${stock.symbol}`,
        });
        
        onClose();
        setStep("request");
        setOtp("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process unpledge request",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {step === "request" ? "Unpledge Securities" : "Enter OTP"}
          </DialogTitle>
          <DialogDescription>
            {step === "request"
              ? `You are about to unpledge shares of ${stock.name}`
              : "Enter the OTP sent to your registered mobile number"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {step === "request" ? (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="symbol" className="text-right">
                  Symbol
                </Label>
                <div className="col-span-3">
                  <strong>{stock.symbol}</strong>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <div className="col-span-3">
                  {stock.name}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">
                  Current Price
                </Label>
                <div className="col-span-3">
                  ₹{stock.currentPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="pledged" className="text-right">
                  Pledged Quantity
                </Label>
                <div className="col-span-3">
                  {stock.pledgedQuantity}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">
                  Quantity to Unpledge
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  className="col-span-3"
                  value={quantity}
                  max={stock.pledgedQuantity}
                  min={1}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="value" className="text-right">
                  Value
                </Label>
                <div className="col-span-3">
                  ₹{(quantity * stock.currentPrice).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="otp" className="text-right">
                OTP
              </Label>
              <Input
                id="otp"
                type="text"
                className="col-span-3"
                value={otp}
                placeholder="Enter 6-digit OTP"
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>
            {step === "request" ? "Request OTP" : "Verify & Unpledge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const PledgedHoldings = () => {
  const [selectedStock, setSelectedStock] = useState<PledgedStock | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<OptimizationRecommendation | undefined>(undefined);
  const [unpledgeDialogOpen, setUnpledgeDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: pledgedHoldings, isLoading: isLoadingHoldings } = useQuery<PledgedHoldingsData>({
    queryKey: ["/api/pledged-holdings"],
  });
  
  const { data: optimizationData, isLoading: isLoadingOptimization } = useQuery<OptimizationData>({
    queryKey: ["/api/margin-optimization"],
  });
  
  const handleUnpledge = (stock: PledgedStock, recommendation?: OptimizationRecommendation) => {
    setSelectedStock(stock);
    setSelectedRecommendation(recommendation);
    setUnpledgeDialogOpen(true);
  };
  
  const closeUnpledgeDialog = () => {
    setUnpledgeDialogOpen(false);
    setSelectedStock(null);
    setSelectedRecommendation(undefined);
  };
  
  const isLoading = isLoadingHoldings || isLoadingOptimization;
  
  return (
    <div className="space-y-8">
      {/* Margin Utilization Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Margin Utilization</span>
            <Badge variant="outline" className="ml-2">
              {new Date().toLocaleString()}
            </Badge>
          </CardTitle>
          <CardDescription>
            Current margin usage and available margin for trading
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Margin Utilized</span>
                  <span className="text-sm font-medium">
                    ₹{pledgedHoldings?.totalMarginUtilized.toLocaleString("en-IN")} of ₹{pledgedHoldings?.totalMarginAvailable.toLocaleString("en-IN")}
                  </span>
                </div>
                <Progress 
                  value={pledgedHoldings ? (pledgedHoldings.totalMarginUtilized / pledgedHoldings.totalMarginAvailable) * 100 : 0} 
                  className="h-2"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-3">
                  <div className="text-sm text-muted-foreground">Total Pledged</div>
                  <div className="text-2xl font-bold flex items-center">
                    <IndianRupee className="h-4 w-4 mr-1" />
                    {pledgedHoldings?.totalPledgedValue.toLocaleString("en-IN")}
                  </div>
                </div>
                
                <div className="rounded-lg border p-3">
                  <div className="text-sm text-muted-foreground">Available Margin</div>
                  <div className="text-2xl font-bold flex items-center text-green-600">
                    <IndianRupee className="h-4 w-4 mr-1" />
                    {pledgedHoldings ? (pledgedHoldings.totalMarginAvailable - pledgedHoldings.totalMarginUtilized).toLocaleString("en-IN") : 0}
                  </div>
                </div>
              </div>
              
              {optimizationData && optimizationData.recommendations.length > 0 && (
                <div className="mt-4 p-4 border rounded-lg bg-green-50">
                  <div className="flex items-center mb-2">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                    <span className="font-medium">Optimization Opportunity</span>
                  </div>
                  <p className="text-sm mb-2">
                    You can potentially free up <strong>₹{optimizationData.potentialSavings.toLocaleString("en-IN")}</strong> in collateral value with our AI recommendations.
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Info className="h-3 w-3 mr-1" />
                    <span>AI Confidence: {(optimizationData.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Pledged Holdings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pledged Holdings</CardTitle>
          <CardDescription>
            Securities currently pledged for margin trading
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : pledgedHoldings?.pledgedStocks && pledgedHoldings.pledgedStocks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Pledged Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Pledged Value</TableHead>
                  <TableHead className="text-right">Haircut</TableHead>
                  <TableHead className="text-right">Margin Available</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pledgedHoldings.pledgedStocks.map((stock) => (
                  <TableRow key={stock.id}>
                    <TableCell className="font-medium">
                      <div>{stock.symbol}</div>
                      <div className="text-xs text-muted-foreground">{stock.name}</div>
                    </TableCell>
                    <TableCell>{stock.quantity}</TableCell>
                    <TableCell>{stock.pledgedQuantity}</TableCell>
                    <TableCell className="text-right">₹{stock.currentPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">₹{stock.pledgedValue.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right">{(stock.haircut * 100).toFixed(0)}%</TableCell>
                    <TableCell className="text-right">₹{stock.marginAvailable.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUnpledge(stock)}
                      >
                        Unpledge
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-8">
              <p className="text-muted-foreground">No pledged securities found</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Optimization Recommendations */}
      {optimizationData && optimizationData.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-primary" />
              AI Margin Optimization Recommendations
            </CardTitle>
            <CardDescription>
              Intelligent recommendations to optimize your margin utilization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-muted rounded-lg flex items-center">
              <div className="flex-1">
                <div className="text-sm font-medium">Potential savings</div>
                <div className="text-2xl font-bold">₹{optimizationData.potentialSavings.toLocaleString("en-IN")}</div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">AI Confidence</div>
                <div className="flex items-center">
                  <Progress value={optimizationData.confidence * 100} className="h-2 w-32 mr-2" />
                  <span className="text-sm">{(optimizationData.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Security</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Recommended</TableHead>
                  <TableHead className="text-right">Value to Free</TableHead>
                  <TableHead className="text-right">Priority</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {optimizationData.recommendations.map((rec) => {
                  const stock = pledgedHoldings?.pledgedStocks.find(s => s.id === rec.stockId);
                  if (!stock) return null;
                  
                  return (
                    <TableRow key={rec.stockId}>
                      <TableCell className="font-medium">
                        <div>{rec.symbol}</div>
                        <div className="text-xs text-muted-foreground">{rec.name}</div>
                      </TableCell>
                      <TableCell>{rec.currentPledgedQuantity}</TableCell>
                      <TableCell className="flex items-center">
                        {rec.recommendedPledgedQuantity}
                        <ArrowRight className="h-4 w-4 mx-1 text-muted-foreground" />
                        <span className="text-green-600">-{rec.quantityToUnpledge}</span>
                      </TableCell>
                      <TableCell className="text-right">₹{rec.valueToFree.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={rec.priorityScore > 0.8 ? "destructive" : "default"}>
                          {rec.priorityScore > 0.8 ? "High" : "Medium"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleUnpledge(stock, rec)}
                        >
                          Unpledge
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Market Factors Influencing Recommendations</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm space-y-1">
                  <div className="font-medium">News Sentiment</div>
                  {Object.entries(optimizationData.marketFactors.newsSentiment).map(([symbol, score]) => (
                    <div key={symbol} className="flex justify-between">
                      <span>{symbol}</span>
                      <Badge variant={score > 0.6 ? "default" : score > 0.4 ? "outline" : "destructive"}>
                        {score > 0.6 ? "Positive" : score > 0.4 ? "Neutral" : "Negative"}
                      </Badge>
                    </div>
                  ))}
                </div>
                
                <div className="text-sm space-y-1">
                  <div className="font-medium">Volatility Metrics</div>
                  {Object.entries(optimizationData.marketFactors.volatilityMetrics).map(([symbol, score]) => (
                    <div key={symbol} className="flex justify-between">
                      <span>{symbol}</span>
                      <Badge variant={score < 0.2 ? "default" : score < 0.3 ? "outline" : "destructive"}>
                        {score < 0.2 ? "Low" : score < 0.3 ? "Medium" : "High"}
                      </Badge>
                    </div>
                  ))}
                </div>
                
                <div className="text-sm space-y-1">
                  <div className="font-medium">Macro Factors</div>
                  {optimizationData.marketFactors.macroFactors.map((factor, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{factor.factor}</span>
                      <Badge variant={
                        factor.sentiment === "Positive" ? "success" : 
                        factor.sentiment === "Stable" ? "outline" : 
                        "destructive"
                      }>
                        {factor.sentiment}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Unpledge Dialog */}
      <UnpledgeDialog
        open={unpledgeDialogOpen}
        onClose={closeUnpledgeDialog}
        stock={selectedStock}
        recommendation={selectedRecommendation}
      />
    </div>
  );
};