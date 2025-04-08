import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import SentimentCard from "./SentimentCard";
import TechnicalIndicators from "./TechnicalIndicators";
import EventCard from "./EventCard";

interface InfoPanelProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedStock: string;
  setSelectedStock: (stock: string) => void;
  marketData: any;
  isLoading: boolean;
}

const InfoPanel = ({ 
  activeTab, 
  setActiveTab, 
  selectedStock, 
  setSelectedStock,
  marketData,
  isLoading
}: InfoPanelProps) => {
  const { toast } = useToast();
  
  // Connect to broker mutation
  const { mutate: connectBroker, isPending } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/broker/connect', {});
      return response.json();
    },
    onSuccess: (data) => {
      window.location.href = data.authUrl;
    },
    onError: (error) => {
      toast({
        title: "Error connecting to broker",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return (
    <div className="w-full lg:w-96 xl:w-[448px] flex-shrink-0 bg-white border-l border-slate-200 overflow-hidden flex flex-col">
      {/* Tab Headers for Side Panel */}
      <div className="border-b border-slate-200">
        <div className="flex px-2">
          {["Market Overview", "Sentiment", "Technical", "Watchlist"].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-xs ${
                activeTab === tab 
                  ? "text-primary-600 border-b-2 border-primary-600 font-medium" 
                  : "text-slate-500 border-b-2 border-transparent hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      
      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Market Snapshot */}
            {activeTab === "Market Overview" && (
              <>
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">Market Snapshot</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {marketData?.indices?.map((index: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">{index.symbol}</span>
                          <span className={`text-xs font-medium ${
                            index.change >= 0 ? "text-success-500" : "text-danger-500"
                          }`}>
                            {index.change >= 0 ? "+" : ""}{index.changePercent}%
                          </span>
                        </div>
                        <div className="flex items-baseline">
                          <span className="text-lg font-mono font-semibold">{index.value}</span>
                          <span className={`text-xs font-mono ml-1 ${
                            index.change >= 0 ? "text-success-500" : "text-danger-500"
                          }`}>
                            {index.change >= 0 ? "+" : ""}{index.change}
                          </span>
                        </div>
                        <div className="h-6 mt-1">
                          {index.chartData && (
                            <svg className="w-full h-full" viewBox="0 0 100 30">
                              <path
                                d={`M0,${30-index.chartData[0]} ${index.chartData.map((point: number, i: number) => 
                                  `L${i*(100/(index.chartData.length-1))},${30-point}`).join(' ')}`}
                                fill="none"
                                stroke={index.change >= 0 ? "#10b981" : "#ef4444"}
                                strokeWidth="1.5"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Sentiment Analysis */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">Sentiment Analysis</h3>
                    <span className="text-xs text-slate-500">Last updated: {marketData?.lastUpdated}</span>
                  </div>
                  
                  <div className="space-y-3">
                    {marketData?.sentiments?.map((sentiment: any, idx: number) => (
                      <SentimentCard key={idx} sentiment={sentiment} />
                    ))}
                  </div>
                </div>
                
                {/* Technical Indicators */}
                <TechnicalIndicators 
                  selectedStock={selectedStock} 
                  setSelectedStock={setSelectedStock}
                  technicalData={marketData?.technicalIndicators?.[selectedStock]}
                />
                
                {/* Corporate Actions */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Upcoming Events</h3>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="space-y-3">
                      {marketData?.events?.map((event: any, idx: number) => (
                        <EventCard key={idx} event={event} />
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {activeTab === "Sentiment" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Market Sentiment Analysis</h3>
                {marketData?.sentiments?.map((sentiment: any, idx: number) => (
                  <SentimentCard key={idx} sentiment={sentiment} detailed />
                ))}
              </div>
            )}
            
            {activeTab === "Technical" && (
              <TechnicalIndicators 
                selectedStock={selectedStock} 
                setSelectedStock={setSelectedStock}
                technicalData={marketData?.technicalIndicators?.[selectedStock]}
                detailed
              />
            )}
            
            {activeTab === "Watchlist" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Your Watchlist</h3>
                {marketData?.watchlist?.length > 0 ? (
                  <div className="space-y-2">
                    {marketData.watchlist.map((stock: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{stock.name}</div>
                            <div className="text-xs text-slate-500">{stock.symbol}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-medium">{stock.price}</div>
                            <div className={`text-xs ${stock.change >= 0 ? "text-success-500" : "text-danger-500"}`}>
                              {stock.change >= 0 ? "+" : ""}{stock.changePercent}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-lg p-6 text-center">
                    <div className="w-12 h-12 mx-auto bg-slate-200 rounded-full flex items-center justify-center mb-2">
                      <i className="ri-star-line text-slate-500 text-xl"></i>
                    </div>
                    <p className="text-slate-600 mb-2">Your watchlist is empty</p>
                    <p className="text-xs text-slate-500">Add stocks to your watchlist to track them easily</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Connect Broker Button */}
      <div className="border-t border-slate-200 p-4">
        <div className="flex flex-col space-y-2">
          <button 
            className="w-full py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center disabled:opacity-70"
            onClick={() => connectBroker()}
            disabled={isPending}
          >
            {isPending ? (
              <i className="ri-loader-4-line animate-spin mr-2"></i>
            ) : (
              <i className="ri-link mr-2"></i>
            )}
            Connect Broker
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center">
                <i className="ri-line-chart-line text-xs text-primary-600"></i>
              </div>
              <div className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center">
                <i className="ri-funds-line text-xs text-primary-600"></i>
              </div>
              <div className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center">
                <i className="ri-stock-line text-xs text-primary-600"></i>
              </div>
            </div>
            <span className="text-xs text-slate-500">+ 2 more supported</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;
