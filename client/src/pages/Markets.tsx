import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";

export default function Markets() {
  // Fetch user profile
  const { data: userProfile, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/user/profile'],
  });

  // Fetch market data
  const { data: marketOverview, isLoading: isLoadingMarket } = useQuery({
    queryKey: ['/api/market/overview'],
  });

  const isLoading = isLoadingUser || isLoadingMarket;

  return (
    <div className="flex min-h-screen flex-col">
      <Header userProfile={userProfile} isLoading={isLoadingUser} />
      <div className="flex flex-1">
        <Navbar />
        <main className="flex-1 py-6">
          <div className="container">
            <div className="mb-6">
              <h1 className="text-3xl font-bold tracking-tight mb-4">Markets</h1>
              <p className="text-muted-foreground">
                Track market movements, analyze trends, and stay updated with the latest market data.
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Market Indices */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Market Indices</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {marketOverview?.indices?.map((index: any) => (
                      <Card key={index.symbol}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex justify-between items-center">
                            <span>{index.symbol}</span>
                            <span className={index.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}>
                              {index.changePercent >= 0 ? (
                                <TrendingUp className="h-4 w-4 inline mr-1" />
                              ) : (
                                <TrendingDown className="h-4 w-4 inline mr-1" />
                              )}
                              {index.changePercent >= 0 ? '+' : ''}{index.changePercent}%
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {index.value?.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Change: {index.change >= 0 ? '+' : ''}{index.change?.toLocaleString()}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Market Sectors */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Sector Performance</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {marketOverview?.sectors?.map((sector: any) => (
                      <Card key={sector.name}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{sector.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className={`text-lg font-semibold ${sector.performancePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {sector.performancePercent >= 0 ? '+' : ''}{sector.performancePercent}%
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Market Movers */}
                <div>
                  <Tabs defaultValue="gainers">
                    <TabsList>
                      <TabsTrigger value="gainers">Top Gainers</TabsTrigger>
                      <TabsTrigger value="losers">Top Losers</TabsTrigger>
                      <TabsTrigger value="volume">Most Active</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="gainers" className="mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {marketOverview?.topGainers?.slice(0, 6).map((stock: any) => (
                          <Card key={stock.symbol}>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base flex justify-between items-center">
                                <span>{stock.symbol}</span>
                                <span className="text-green-500">
                                  +{stock.changePercent}%
                                </span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-lg font-semibold">
                                ₹{stock.price?.toLocaleString()}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {stock.name}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="losers" className="mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {marketOverview?.topLosers?.slice(0, 6).map((stock: any) => (
                          <Card key={stock.symbol}>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base flex justify-between items-center">
                                <span>{stock.symbol}</span>
                                <span className="text-red-500">
                                  {stock.changePercent}%
                                </span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-lg font-semibold">
                                ₹{stock.price?.toLocaleString()}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {stock.name}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="volume" className="mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {marketOverview?.mostActive?.slice(0, 6).map((stock: any) => (
                          <Card key={stock.symbol}>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base flex justify-between items-center">
                                <span>{stock.symbol}</span>
                                <span className={stock.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}>
                                  {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%
                                </span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-lg font-semibold">
                                ₹{stock.price?.toLocaleString()}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Vol: {(stock.volume / 1000000).toFixed(2)}M
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}