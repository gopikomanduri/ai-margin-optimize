import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import AdvancedAnalytics from "@/pages/AdvancedAnalytics";
import Alerts from "@/pages/Alerts";
import BrokerConnection from "@/pages/BrokerConnection";

import Navbar from "@/components/Navbar";
import { AlertNotifications } from "@/components/AlertNotifications";

function Router() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/advanced-analytics" component={AdvancedAnalytics} />
          <Route path="/alerts" component={Alerts} />
          <Route path="/broker" component={BrokerConnection} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col">
        <div className="fixed top-4 right-4 z-50">
          <AlertNotifications />
        </div>
        <Router />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
