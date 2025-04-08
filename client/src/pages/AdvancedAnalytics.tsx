import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PortfolioOptimizer from "@/components/PortfolioOptimizer";
import MonteCarloSimulator from "@/components/MonteCarloSimulator";
import AnomalyDetector from "@/components/AnomalyDetector";
import RiskAnalyzer from "@/components/RiskAnalyzer";

export default function AdvancedAnalytics() {
  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex flex-col items-start gap-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
        <p className="text-lg text-muted-foreground">
          Use AI-powered mathematical models to optimize your portfolio, simulate trading strategies,
          detect market anomalies, and analyze risk.
        </p>
      </div>

      <Tabs defaultValue="portfolio" className="w-full">
        <TabsList className="mb-8 w-full justify-start">
          <TabsTrigger value="portfolio">Portfolio Optimizer</TabsTrigger>
          <TabsTrigger value="monte-carlo">Monte Carlo Simulator</TabsTrigger>
          <TabsTrigger value="anomaly">Anomaly Detector</TabsTrigger>
          <TabsTrigger value="risk">Risk Analyzer</TabsTrigger>
        </TabsList>
        
        <TabsContent value="portfolio" className="w-full">
          <PortfolioOptimizer />
        </TabsContent>
        
        <TabsContent value="monte-carlo" className="w-full">
          <MonteCarloSimulator />
        </TabsContent>
        
        <TabsContent value="anomaly" className="w-full">
          <AnomalyDetector />
        </TabsContent>
        
        <TabsContent value="risk" className="w-full">
          <RiskAnalyzer />
        </TabsContent>
      </Tabs>
    </div>
  );
}