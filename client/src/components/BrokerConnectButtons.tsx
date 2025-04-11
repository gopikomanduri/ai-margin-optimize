import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

// Broker icons
import { SiZerodha } from "react-icons/si";
import { 
  FaLock, 
  FaExternalLinkAlt, 
  FaAngleRight, 
  FaChartLine,
  FaShieldAlt
} from "react-icons/fa";

interface BrokerConnectButtonsProps {
  onLoginSuccess?: () => void;
}

export function BrokerConnectButtons({ onLoginSuccess }: BrokerConnectButtonsProps) {
  const [loading, setLoading] = useState({
    zerodha: false,
    angel: false,
    fyers: false,
    upstox: false,
    iifl: false
  });
  
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const handleZerodhaConnect = async () => {
    try {
      setLoading({ ...loading, zerodha: true });
      
      // Initiate OAuth flow with Zerodha
      const response = await apiRequest("/api/broker/zerodha/connect", {
        method: "POST"
      });
      
      if (response.success && response.redirectUrl) {
        // Open Zerodha's login page in a new window
        window.open(response.redirectUrl, "_blank", "width=800,height=600");
        
        toast({
          title: "Connecting to Zerodha",
          description: "Please complete the login process in the new window."
        });
        
        // Poll for connection status
        const pollInterval = setInterval(async () => {
          const statusResponse = await apiRequest("/api/broker/zerodha/status", {
            method: "GET"
          });
          
          if (statusResponse.success && statusResponse.connected) {
            clearInterval(pollInterval);
            
            toast({
              title: "Connection Successful",
              description: "Your Zerodha account has been connected successfully."
            });
            
            if (onLoginSuccess) {
              onLoginSuccess();
            } else {
              setLocation("/");
            }
          }
        }, 3000); // Check every 3 seconds
        
        // Stop polling after 2 minutes (in case user abandons the flow)
        setTimeout(() => {
          clearInterval(pollInterval);
        }, 2 * 60 * 1000);
      } else {
        throw new Error(response.message || "Failed to initiate Zerodha connection");
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading({ ...loading, zerodha: false });
    }
  };

  const handleFyersConnect = async () => {
    try {
      setLoading({ ...loading, fyers: true });
      
      // Initiate OAuth flow with FYERS
      const response = await apiRequest("/api/broker/fyers/connect", {
        method: "POST"
      });
      
      if (response.success && response.redirectUrl) {
        window.open(response.redirectUrl, "_blank", "width=800,height=600");
        
        toast({
          title: "Connecting to FYERS",
          description: "Please complete the login process in the new window."
        });
        
        // Poll for connection status
        const pollInterval = setInterval(async () => {
          const statusResponse = await apiRequest("/api/broker/fyers/status", {
            method: "GET"
          });
          
          if (statusResponse.success && statusResponse.connected) {
            clearInterval(pollInterval);
            
            toast({
              title: "Connection Successful",
              description: "Your FYERS account has been connected successfully."
            });
            
            if (onLoginSuccess) {
              onLoginSuccess();
            } else {
              setLocation("/");
            }
          }
        }, 3000);
        
        setTimeout(() => {
          clearInterval(pollInterval);
        }, 2 * 60 * 1000);
      } else {
        throw new Error(response.message || "Failed to initiate FYERS connection");
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading({ ...loading, fyers: false });
    }
  };
  
  const handleAngelConnect = async () => {
    try {
      setLoading({ ...loading, angel: true });
      
      // Initiate OAuth flow with Angel One
      const response = await apiRequest("/api/broker/angel/connect", {
        method: "POST"
      });
      
      if (response.success && response.redirectUrl) {
        window.open(response.redirectUrl, "_blank", "width=800,height=600");
        
        toast({
          title: "Connecting to Angel One",
          description: "Please complete the login process in the new window."
        });
        
        // Poll for connection status
        const pollInterval = setInterval(async () => {
          const statusResponse = await apiRequest("/api/broker/angel/status", {
            method: "GET"
          });
          
          if (statusResponse.success && statusResponse.connected) {
            clearInterval(pollInterval);
            
            toast({
              title: "Connection Successful",
              description: "Your Angel One account has been connected successfully."
            });
            
            if (onLoginSuccess) {
              onLoginSuccess();
            } else {
              setLocation("/");
            }
          }
        }, 3000);
        
        setTimeout(() => {
          clearInterval(pollInterval);
        }, 2 * 60 * 1000);
      } else {
        throw new Error(response.message || "Failed to initiate Angel One connection");
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading({ ...loading, angel: false });
    }
  };
  
  const handleUpstoxConnect = async () => {
    try {
      setLoading({ ...loading, upstox: true });
      
      // Initiate OAuth flow with Upstox
      const response = await apiRequest("/api/broker/upstox/connect", {
        method: "POST"
      });
      
      if (response.success && response.redirectUrl) {
        window.open(response.redirectUrl, "_blank", "width=800,height=600");
        
        toast({
          title: "Connecting to Upstox",
          description: "Please complete the login process in the new window."
        });
        
        // Poll for connection status
        const pollInterval = setInterval(async () => {
          const statusResponse = await apiRequest("/api/broker/upstox/status", {
            method: "GET"
          });
          
          if (statusResponse.success && statusResponse.connected) {
            clearInterval(pollInterval);
            
            toast({
              title: "Connection Successful",
              description: "Your Upstox account has been connected successfully."
            });
            
            if (onLoginSuccess) {
              onLoginSuccess();
            } else {
              setLocation("/");
            }
          }
        }, 3000);
        
        setTimeout(() => {
          clearInterval(pollInterval);
        }, 2 * 60 * 1000);
      } else {
        throw new Error(response.message || "Failed to initiate Upstox connection");
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading({ ...loading, upstox: false });
    }
  };
  
  const handleIiflConnect = async () => {
    try {
      setLoading({ ...loading, iifl: true });
      
      // Initiate OAuth flow with IIFL
      const response = await apiRequest("/api/broker/iifl/connect", {
        method: "POST"
      });
      
      if (response.success && response.redirectUrl) {
        window.open(response.redirectUrl, "_blank", "width=800,height=600");
        
        toast({
          title: "Connecting to IIFL",
          description: "Please complete the login process in the new window."
        });
        
        // Poll for connection status
        const pollInterval = setInterval(async () => {
          const statusResponse = await apiRequest("/api/broker/iifl/status", {
            method: "GET"
          });
          
          if (statusResponse.success && statusResponse.connected) {
            clearInterval(pollInterval);
            
            toast({
              title: "Connection Successful",
              description: "Your IIFL account has been connected successfully."
            });
            
            if (onLoginSuccess) {
              onLoginSuccess();
            } else {
              setLocation("/");
            }
          }
        }, 3000);
        
        setTimeout(() => {
          clearInterval(pollInterval);
        }, 2 * 60 * 1000);
      } else {
        throw new Error(response.message || "Failed to initiate IIFL connection");
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading({ ...loading, iifl: false });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
        <h3 className="text-lg font-medium flex items-center gap-2 mb-2">
          <FaChartLine className="text-blue-600" />
          <span>AI Margin Optimization</span>
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
          Connect your broker to analyze your portfolio and optimize margin requirements based on market conditions.
        </p>
        <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
          <FaShieldAlt />
          <span>Secure OAuth connection with end-to-end encryption</span>
        </div>
      </div>
      
      <Separator />
      
      {/* Popular Brokers */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Popular Brokers</h3>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Zerodha */}
          <Button
            variant="outline"
            className="flex items-center justify-center h-20 border-2 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all"
            onClick={handleZerodhaConnect}
            disabled={loading.zerodha}
          >
            <div className="flex flex-col items-center">
              <SiZerodha className="h-8 w-8 mb-2 text-[#387ed1]" />
              <div className="flex items-center gap-1">
                <span className="font-medium">Zerodha</span>
                {loading.zerodha && (
                  <div className="ml-1 h-3 w-3 animate-spin rounded-full border-b-2 border-blue-600"></div>
                )}
              </div>
            </div>
          </Button>
          
          {/* FYERS */}
          <Button
            variant="outline"
            className="flex items-center justify-center h-20 border-2 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/30 transition-all"
            onClick={handleFyersConnect}
            disabled={loading.fyers}
          >
            <div className="flex flex-col items-center">
              <div className="text-xl font-bold mb-2 text-green-600">FYERS</div>
              <div className="flex items-center gap-1">
                <span className="font-medium">FYERS</span>
                {loading.fyers && (
                  <div className="ml-1 h-3 w-3 animate-spin rounded-full border-b-2 border-green-600"></div>
                )}
              </div>
            </div>
          </Button>
        </div>
      </div>
      
      {/* Other Brokers */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Other Brokers</h3>
        
        <div className="grid grid-cols-1 gap-3">
          {/* Angel One */}
          <Button
            variant="outline"
            className="flex items-center justify-between px-4 h-12 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all"
            onClick={handleAngelConnect}
            disabled={loading.angel}
          >
            <div className="flex items-center">
              <div className="font-medium text-purple-600">Angel One</div>
            </div>
            {loading.angel ? (
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-purple-600"></div>
            ) : (
              <FaExternalLinkAlt className="h-3 w-3 text-gray-400" />
            )}
          </Button>
          
          {/* Upstox */}
          <Button
            variant="outline"
            className="flex items-center justify-between px-4 h-12 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
            onClick={handleUpstoxConnect}
            disabled={loading.upstox}
          >
            <div className="flex items-center">
              <div className="font-medium text-red-600">Upstox</div>
            </div>
            {loading.upstox ? (
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-red-600"></div>
            ) : (
              <FaExternalLinkAlt className="h-3 w-3 text-gray-400" />
            )}
          </Button>
          
          {/* IIFL */}
          <Button
            variant="outline"
            className="flex items-center justify-between px-4 h-12 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all"
            onClick={handleIiflConnect}
            disabled={loading.iifl}
          >
            <div className="flex items-center">
              <div className="font-medium text-orange-600">IIFL</div>
            </div>
            {loading.iifl ? (
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-orange-600"></div>
            ) : (
              <FaExternalLinkAlt className="h-3 w-3 text-gray-400" />
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-xs text-center text-gray-500 justify-center mt-4">
        <FaLock className="h-3 w-3" />
        <p>Your broker credentials are never stored on our servers</p>
      </div>
    </div>
  );
}