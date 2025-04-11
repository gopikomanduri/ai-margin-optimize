import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import AdvancedAnalytics from "@/pages/AdvancedAnalytics";
import Alerts from "@/pages/Alerts";
import BrokerConnection from "@/pages/BrokerConnection";
import MarginOptimizer from "@/pages/MarginOptimizer";
import AuthPage from "@/pages/auth-page";
import Markets from "@/pages/Markets";
import Portfolio from "@/pages/Portfolio";
import History from "@/pages/History";
import Settings from "@/pages/Settings";

import Navbar from "@/components/Navbar";
import { AlertNotifications } from "@/components/AlertNotifications";
import { VoiceProvider } from "./contexts/VoiceContext";
import VoiceTranscriptDisplay from "@/components/VoiceTranscriptDisplay";
import useKeyboardShortcuts from "@/hooks/useKeyboardShortcuts";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function Router() {
  // Enable keyboard shortcuts
  useKeyboardShortcuts();
  
  // Get authentication status
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  
  return (
    <>
      {isLoggedIn && <Navbar />}
      <main className="flex-1">
        <Switch>
          <ProtectedRoute path="/" component={Home} />
          <ProtectedRoute path="/advanced-analytics" component={AdvancedAnalytics} />
          <ProtectedRoute path="/alerts" component={Alerts} />
          <ProtectedRoute path="/broker" component={BrokerConnection} />
          <ProtectedRoute path="/margin-optimizer" component={MarginOptimizer} />
          <ProtectedRoute path="/markets" component={Markets} />
          <ProtectedRoute path="/portfolio" component={Portfolio} />
          <ProtectedRoute path="/history" component={History} />
          <ProtectedRoute path="/settings" component={Settings} />
          <Route path="/auth" component={AuthPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <VoiceProvider>
        <div className="min-h-screen flex flex-col">
          <div className="fixed top-4 right-4 z-50">
            <AlertNotifications />
          </div>
          <Router />
          <VoiceTranscriptDisplay />
        </div>
        <Toaster />
      </VoiceProvider>
    </QueryClientProvider>
  );
}

export default App;
