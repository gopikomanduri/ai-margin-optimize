import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FaBriefcase, FaChartLine, FaChartBar, FaLock, FaUnlock, FaInfoCircle, FaExclamationTriangle } from "react-icons/fa";

// Types
interface Holding {
  symbol: string;
  companyName: string;
  quantity: number;
  averagePrice: number;
  lastPrice: number;
  currentValue: number;
  investmentValue: number;
  pnl: number;
  pnlPercentage: number;
  dayChange: number;
  dayChangePercentage: number;
  isPledged?: boolean;
  pledgedQuantity?: number;
}

interface PledgeData {
  symbol: string;
  companyName: string;
  quantity: number;
  value: number;
  pledgeDate: string;
  status: string;
  pledgeId?: string;
}

interface PortfolioSummaryProps {
  broker: string;
  brokerId: number;
}

export function PortfolioSummary({ broker, brokerId }: PortfolioSummaryProps) {
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  const [pledgeDialogOpen, setPledgeDialogOpen] = useState(false);
  
  // Fetch portfolio data
  const { data: holdings = [], isLoading: holdingsLoading } = useQuery<Holding[]>({
    queryKey: [`/api/broker/${brokerId}/holdings`],
    refetchOnWindowFocus: false,
  });
  
  // Fetch pledged holdings data
  const { data: pledges = [], isLoading: pledgesLoading } = useQuery<PledgeData[]>({
    queryKey: [`/api/broker/${brokerId}/pledges`],
    refetchOnWindowFocus: false,
  });
  
  // Calculate portfolio metrics
  const totalInvestment = holdings.reduce((sum, holding) => sum + holding.investmentValue, 0);
  const totalCurrentValue = holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
  const totalPnL = totalCurrentValue - totalInvestment;
  const totalPnLPercentage = totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;
  
  const totalPledgedValue = pledges.reduce((sum, pledge) => sum + pledge.value, 0);
  const pledgeableValue = totalCurrentValue - totalPledgedValue;
  
  // Filter holdings by status
  const pledgedHoldings = holdings.filter(h => h.isPledged);
  const nonPledgedHoldings = holdings.filter(h => !h.isPledged);
  
  const handlePledgeRequest = (holding: Holding) => {
    setSelectedHolding(holding);
    setPledgeDialogOpen(true);
  };
  
  if (holdingsLoading || pledgesLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Loading portfolio data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Portfolio Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <FaBriefcase className="text-primary" />
                <span>Portfolio Summary</span>
              </CardTitle>
              <CardDescription>Summary of your holdings with {broker}</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Last updated</p>
              <p className="text-sm font-medium">{new Date().toLocaleString()}</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-muted-foreground">Total Investment</p>
                <p className="text-2xl font-bold">₹{totalInvestment.toLocaleString()}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-muted-foreground">Current Value</p>
                <p className="text-2xl font-bold">₹{totalCurrentValue.toLocaleString()}</p>
              </CardContent>
            </Card>
            
            <Card className={`${totalPnL >= 0 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
              <CardContent className="p-4">
                <p className="text-sm font-medium text-muted-foreground">Profit/Loss</p>
                <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString()}
                </p>
                <p className={`text-sm ${totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {totalPnLPercentage >= 0 ? '+' : ''}{totalPnLPercentage.toFixed(2)}%
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-muted-foreground">Pledgeable Value</p>
                <p className="text-2xl font-bold">₹{pledgeableValue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">
                  {((pledgeableValue / totalCurrentValue) * 100).toFixed(0)}% of portfolio
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      {/* Holdings Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Your Holdings</CardTitle>
          <CardDescription>
            Manage your securities to optimize margin requirements
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="all">All ({holdings.length})</TabsTrigger>
              <TabsTrigger value="pledged">
                Pledged ({pledgedHoldings.length})
              </TabsTrigger>
              <TabsTrigger value="available">
                Available ({nonPledgedHoldings.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Avg Price</TableHead>
                      <TableHead>LTP</TableHead>
                      <TableHead>Current Value</TableHead>
                      <TableHead>P&L</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holdings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          <p className="text-muted-foreground">No holdings found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      holdings.map((holding) => (
                        <TableRow key={holding.symbol}>
                          <TableCell className="font-medium">{holding.symbol}</TableCell>
                          <TableCell>{holding.quantity}</TableCell>
                          <TableCell>₹{holding.averagePrice.toFixed(2)}</TableCell>
                          <TableCell>₹{holding.lastPrice.toFixed(2)}</TableCell>
                          <TableCell>₹{holding.currentValue.toLocaleString()}</TableCell>
                          <TableCell className={holding.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            <div>
                              {holding.pnl >= 0 ? '+' : ''}₹{holding.pnl.toLocaleString()}
                            </div>
                            <div className="text-xs">
                              {holding.pnlPercentage >= 0 ? '+' : ''}{holding.pnlPercentage.toFixed(2)}%
                            </div>
                          </TableCell>
                          <TableCell>
                            {holding.isPledged ? (
                              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 gap-1">
                                <FaLock className="h-3 w-3" /> 
                                Pledged
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 gap-1">
                                <FaUnlock className="h-3 w-3" />
                                Available
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {holding.isPledged ? (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:hover:bg-amber-900/30"
                              >
                                Unpledge
                              </Button>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30 dark:hover:bg-blue-900/30"
                                onClick={() => handlePledgeRequest(holding)}
                              >
                                Pledge
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="pledged">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Pledged Qty</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pledgedHoldings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          <p className="text-muted-foreground">No pledged holdings found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pledgedHoldings.map((holding) => (
                        <TableRow key={holding.symbol}>
                          <TableCell className="font-medium">{holding.symbol}</TableCell>
                          <TableCell>{holding.quantity}</TableCell>
                          <TableCell>{holding.pledgedQuantity || 0}</TableCell>
                          <TableCell>₹{holding.currentValue.toLocaleString()}</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:hover:bg-amber-900/30"
                            >
                              Unpledge
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="available">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Pledgeable</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nonPledgedHoldings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          <p className="text-muted-foreground">No available holdings found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      nonPledgedHoldings.map((holding) => (
                        <TableRow key={holding.symbol}>
                          <TableCell className="font-medium">{holding.symbol}</TableCell>
                          <TableCell>{holding.quantity}</TableCell>
                          <TableCell>₹{holding.currentValue.toLocaleString()}</TableCell>
                          <TableCell>Yes</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30 dark:hover:bg-blue-900/30"
                              onClick={() => handlePledgeRequest(holding)}
                            >
                              Pledge
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="bg-muted/30 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FaInfoCircle className="h-4 w-4 text-blue-500" />
            <p>AI Margin Optimizer analyzes market conditions to recommend optimal pledge/unpledge actions for your securities.</p>
          </div>
        </CardFooter>
      </Card>
      
      {/* Pledge Dialog */}
      <Dialog open={pledgeDialogOpen} onOpenChange={setPledgeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pledge Securities</DialogTitle>
            <DialogDescription>
              Pledge your holdings based on AI-optimized recommendations for efficient margin utilization.
            </DialogDescription>
          </DialogHeader>
          
          {selectedHolding && (
            <div className="py-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-semibold">{selectedHolding.symbol}</h3>
                  <p className="text-sm text-muted-foreground">{selectedHolding.companyName}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{selectedHolding.lastPrice.toFixed(2)}</p>
                  <p className={`text-xs ${selectedHolding.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedHolding.dayChange >= 0 ? '+' : ''}{selectedHolding.dayChangePercentage.toFixed(2)}%
                  </p>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Available Quantity</p>
                    <p className="font-medium">{selectedHolding.quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Value</p>
                    <p className="font-medium">₹{selectedHolding.currentValue.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="bg-yellow-50 dark:bg-yellow-950/30 p-3 rounded-md border border-yellow-200 dark:border-yellow-800 flex items-start gap-3">
                  <FaExclamationTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Important Notice</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      Pledged securities will be locked and can't be sold until they are unpledged. AI Margin Optimizer will continuously monitor market conditions and suggest optimal unpledge timing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex space-x-2 sm:justify-end">
            <Button variant="outline" onClick={() => setPledgeDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Confirm Pledge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}