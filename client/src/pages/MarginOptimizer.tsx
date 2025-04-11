import { PledgedHoldings } from "@/components/PledgedHoldings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Info, AlertTriangle, TrendingUp, Landmark, Percent } from "lucide-react";
import { useLocation } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Dashboard metrics for quick insights
const MetricCard = ({ title, value, icon, description, change }: any) => {
  const Icon = icon || Info;
  const isPositive = change && parseFloat(change) > 0;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={`text-xs ${isPositive ? "text-green-500" : "text-red-500"} flex items-center`}>
            {isPositive ? "+" : ""}{change}
            <span className="text-muted-foreground ml-1">{description}</span>
          </p>
        )}
        {!change && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
};

export default function MarginOptimizer() {
  const [_, setLocation] = useLocation();
  const { data: userProfile, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/user/profile'],
  });
  
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
  
  const { data: marketOverview, isLoading: isLoadingMarket } = useQuery({
    queryKey: ['/api/market/overview'],
  });
  
  const isLoading = isLoadingUser || isLoadingBroker || isLoadingMarket;
  // Check if broker is successfully connected
  const isConnected = brokerConnection ? (brokerConnection.success && brokerConnection.connected) : false;
  
  // Handle broker connection button click
  const handleConnectBroker = () => {
    setLocation('/broker');
  };
  
  return (
    <div className="p-6">
      <div className="container">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-4">Margin Optimization</h1>
          <p className="text-muted-foreground">
            Optimize your margin requirements and free up capital with AI-powered recommendations
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : !isConnected ? (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Broker Not Connected</AlertTitle>
            <AlertDescription>
              Please connect your broker account to access margin optimization features.
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={handleConnectBroker}
              >
                Connect Broker
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Dashboard cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <MetricCard
                title="Total Margin"
                value="₹12,56,000"
                icon={Landmark}
                description="Available margin"
              />
              <MetricCard
                title="Utilization"
                value="62.5%"
                icon={Percent}
                description="Of available margin"
                change="-3.2%"
              />
              <MetricCard
                title="Pledged Value"
                value="₹7,20,120"
                icon={Landmark}
                description="Total pledged value"
              />
              <MetricCard
                title="Optimization Score"
                value="84/100"
                icon={TrendingUp}
                description="Efficiency score"
                change="+6"
              />
            </div>

            <Tabs defaultValue="holdings" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="holdings">Pledged Holdings</TabsTrigger>
                <TabsTrigger value="history">Pledge History</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="holdings">
                <PledgedHoldings />
              </TabsContent>
              
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>Pledge/Unpledge History</CardTitle>
                    <CardDescription>
                      Your recent pledge and unpledge transactions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center p-8 text-muted-foreground">
                      No recent transactions found
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>Optimization Settings</CardTitle>
                    <CardDescription>
                      Configure your margin optimization preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center p-8 text-muted-foreground">
                      Settings configuration coming soon
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}