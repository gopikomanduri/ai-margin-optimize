import React, { useState } from 'react';
import { AlertsList } from '@/components/AlertsList';
import { useQuery } from '@tanstack/react-query';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Spinner } from '@/components/ui/spinner';
import { Bell, TrendingUp, AlertCircle } from 'lucide-react';

export default function AlertsPage() {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  
  // Fetch stocks for filter dropdown
  const { data: stocks, isLoading: loadingStocks } = useQuery({
    queryKey: ['/api/market/stocks'],
    queryFn: async () => {
      const response = await fetch('/api/market/stocks');
      if (!response.ok) {
        throw new Error('Failed to fetch stocks');
      }
      return response.json();
    },
  });

  // Mock data for demonstration - in a real app, this would come from the API
  const alertStats = [
    { date: '2023-01-01', triggered: 3, created: 5 },
    { date: '2023-01-02', triggered: 5, created: 2 },
    { date: '2023-01-03', triggered: 2, created: 7 },
    { date: '2023-01-04', triggered: 7, created: 1 },
    { date: '2023-01-05', triggered: 4, created: 3 },
    { date: '2023-01-06', triggered: 8, created: 4 },
    { date: '2023-01-07', triggered: 6, created: 2 },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Alerts & Notifications</h1>
          <p className="text-gray-500">
            Create and manage your market alerts to stay informed about price movements,
            technical indicators, and market events.
          </p>
        </div>
        
        <Tabs defaultValue="all-alerts" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all-alerts">All Alerts</TabsTrigger>
            <TabsTrigger value="overview">Alert Overview</TabsTrigger>
            {selectedSymbol && (
              <TabsTrigger value="symbol-alerts">{selectedSymbol} Alerts</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="all-alerts">
            <AlertsList />
          </TabsContent>
          
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-500" />
                    Alert Activity
                  </CardTitle>
                  <CardDescription>
                    Recent alert activity trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={alertStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="triggered" stroke="#3b82f6" name="Triggered" />
                        <Line type="monotone" dataKey="created" stroke="#10b981" name="Created" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Most Active Symbols
                  </CardTitle>
                  <CardDescription>
                    Symbols with most alerts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {loadingStocks ? (
                      <Spinner />
                    ) : (
                      (stocks || []).slice(0, 5).map((stock: { symbol: string; name: string }, index: number) => (
                        <div 
                          key={stock.symbol}
                          className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedSymbol(stock.symbol)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-blue-600">{stock.symbol}</span>
                            <span className="text-sm text-gray-500">{stock.name}</span>
                          </div>
                          <span className="text-sm">{5 - index} alerts</span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    Recent Triggers
                  </CardTitle>
                  <CardDescription>
                    Recently triggered alerts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {/* Sample alert triggers - would come from API in real app */}
                    <div className="border-l-4 border-blue-500 pl-2 py-1">
                      <div className="font-medium">INFY crossed 1500</div>
                      <div className="text-xs text-gray-500">5 minutes ago</div>
                    </div>
                    <div className="border-l-4 border-red-500 pl-2 py-1">
                      <div className="font-medium">HDFCBANK below 1600</div>
                      <div className="text-xs text-gray-500">30 minutes ago</div>
                    </div>
                    <div className="border-l-4 border-green-500 pl-2 py-1">
                      <div className="font-medium">RELIANCE above 2800</div>
                      <div className="text-xs text-gray-500">1 hour ago</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {selectedSymbol && (
            <TabsContent value="symbol-alerts">
              <AlertsList symbol={selectedSymbol} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}