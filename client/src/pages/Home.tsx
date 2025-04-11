import { useState } from "react";
import ChatInterface from "@/components/ChatInterface";
import InfoPanel from "@/components/InfoPanel";
import { useQuery } from "@tanstack/react-query";

const Home = () => {
  const [activeTab, setActiveTab] = useState("Assistant");
  const [activeSideTab, setActiveSideTab] = useState("Market Overview");
  const [selectedStock, setSelectedStock] = useState("HDFCBANK");
  
  // Fetch market overview
  const { data: marketOverview, isLoading: marketLoading } = useQuery({
    queryKey: ['/api/market/overview'],
  });

  return (
    <div className="p-6">
      {/* Dashboard Tabs */}
      <div className="bg-white border-b border-slate-200 mb-4 rounded-lg">
        <div className="flex px-4 overflow-x-auto">
          {["Assistant", "Sentiment Analysis", "Technical Analysis", "Fundamental Data", "Index Impact"].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm border-b-2 whitespace-nowrap ${
                activeTab === tab 
                  ? "text-primary-600 border-primary-600 font-medium" 
                  : "text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content Area with Split View */}
      <div className="flex flex-col lg:flex-row overflow-hidden">
        <ChatInterface activeTab={activeTab} />
        
        <InfoPanel 
          activeTab={activeSideTab} 
          setActiveTab={setActiveSideTab} 
          selectedStock={selectedStock}
          setSelectedStock={setSelectedStock}
          marketData={marketOverview}
          isLoading={marketLoading}
        />
      </div>
    </div>
  );
};

export default Home;
