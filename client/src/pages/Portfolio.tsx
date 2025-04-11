import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, TrendingUp, TrendingDown, Info, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function Portfolio() {
  const [_, setLocation] = useLocation();
  
  // Define broker connection status type
  type BrokerConnectionStatus = {
    success: boolean;
    connected: boolean;
    broker?: string;
    status?: string;
    message?: string;
  };
  
  // Get broker connection status
  const { data: brokerConnection, isLoading: isLoadingBroker } = useQuery<BrokerConnectionStatus>({
    queryKey: ['/api/broker/zerodha/status'],
  });
  
  // Define holdings type
  type Holding = {
    symbol: string;
    name: string;
    quantity: number;
    avgPrice: number;
    ltp: number;
    currentValue: number;
    pnl: number;
    pnlPercent: number;
    dayChange: number;
    dayChangePercent: number;
  };
  
  // Get portfolio holdings
  const { data: portfolioHoldings, isLoading: isLoadingPortfolio } = useQuery<Holding[]>({
    queryKey: ['/api/portfolio/holdings'],
    enabled: brokerConnection?.connected === true,
  });
  
  const isLoading = isLoadingBroker || isLoadingPortfolio;
  // Check if broker is successfully connected
  const isConnected = brokerConnection ? (brokerConnection.success && brokerConnection.connected) : false;
  
  // Calculate portfolio summary if data is available
  const portfolioSummary = portfolioHoldings ? {
    totalValue: portfolioHoldings.reduce((acc, holding) => acc + holding.currentValue, 0),
    totalPnL: portfolioHoldings.reduce((acc, holding) => acc + holding.pnl, 0),
    dayChange: portfolioHoldings.reduce((acc, holding) => acc + holding.dayChange, 0),
    holdings: portfolioHoldings.length,
  } : null;
  
  // Handle broker connection button click
  const handleConnectBroker = () => {
    setLocation('/broker');
  };
  
  return (
    <div className="px-6 py-4">
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-4">Portfolio</h1>
          <p className="text-muted-foreground">
            View and manage your investment portfolio across multiple assets with real-time analytics.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !isConnected ? (
          <div className="flex flex-col items-center justify-center h-64 max-w-md mx-auto">
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Broker Connection Required</AlertTitle>
              <AlertDescription>
                Please connect to your trading account to view portfolio details and enable intelligent margin optimization.
              </AlertDescription>
            </Alert>
            <Button onClick={handleConnectBroker}>Connect Broker</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Portfolio Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Portfolio Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{portfolioSummary?.totalValue.toLocaleString() || '0'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {portfolioSummary?.holdings || 0} holdings
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Overall Profit/Loss
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${portfolioSummary?.totalPnL && portfolioSummary.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {portfolioSummary?.totalPnL && portfolioSummary.totalPnL >= 0 ? '+' : ''}
                    ₹{portfolioSummary?.totalPnL.toLocaleString() || '0'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    All time
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Today's Change
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${portfolioSummary?.dayChange && portfolioSummary.dayChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {portfolioSummary?.dayChange && portfolioSummary.dayChange >= 0 ? '+' : ''}
                    ₹{portfolioSummary?.dayChange.toLocaleString() || '0'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Today
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Broker Connection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-semibold flex items-center">
                    <span className="h-3 w-3 rounded-full bg-green-500 mr-2"></span>
                    {brokerConnection?.broker || 'Connected'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Last updated: Just now
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Holdings Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Holdings</CardTitle>
                  <Button variant="outline" size="sm" className="gap-1">
                    <RefreshCw className="h-4 w-4" /> Refresh
                  </Button>
                </div>
                <CardDescription>
                  Your current stock holdings and their performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Avg. Price</TableHead>
                      <TableHead>LTP</TableHead>
                      <TableHead>Current Value</TableHead>
                      <TableHead>P&L</TableHead>
                      <TableHead>Day Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portfolioHoldings?.map((holding) => (
                      <TableRow key={holding.symbol}>
                        <TableCell>
                          <div className="font-medium">{holding.symbol}</div>
                          <div className="text-xs text-muted-foreground">{holding.name}</div>
                        </TableCell>
                        <TableCell>{holding.quantity}</TableCell>
                        <TableCell>₹{holding.avgPrice.toLocaleString()}</TableCell>
                        <TableCell>₹{holding.ltp.toLocaleString()}</TableCell>
                        <TableCell>₹{holding.currentValue.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className={`flex items-center ${holding.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {holding.pnl >= 0 ? (
                              <TrendingUp className="h-4 w-4 mr-1" />
                            ) : (
                              <TrendingDown className="h-4 w-4 mr-1" />
                            )}
                            <span>
                              {holding.pnl >= 0 ? '+' : ''}₹{holding.pnl.toLocaleString()}
                            </span>
                            <Badge className={`ml-2 ${holding.pnl >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`} variant="outline">
                              {holding.pnl >= 0 ? '+' : ''}{holding.pnlPercent.toFixed(2)}%
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`${holding.dayChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {holding.dayChange >= 0 ? '+' : ''}
                            {holding.dayChangePercent.toFixed(2)}%
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}