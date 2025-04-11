import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Broker icons
import { SiZerodha } from "react-icons/si";
import { FaShieldAlt } from "react-icons/fa";

interface BrokerLoginProps {
  onLoginSuccess?: () => void;
}

export function BrokerLogin({ onLoginSuccess }: BrokerLoginProps) {
  const [loading, setLoading] = useState({
    zerodha: false,
    fyers: false,
    angel: false,
    upstox: false,
    iifl: false
  });
  
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const handleConnect = async (broker: string) => {
    try {
      setLoading({ ...loading, [broker]: true });
      
      // Initiate OAuth flow with broker
      const response = await apiRequest(`/api/broker/${broker}/connect`, {
        method: "POST"
      });
      
      if (response.success && response.redirectUrl) {
        // Open broker's login page in a new window
        window.open(response.redirectUrl, "_blank", "width=800,height=600");
        
        toast({
          title: `Connecting to ${broker.charAt(0).toUpperCase() + broker.slice(1)}`,
          description: "Please complete the login process in the new window."
        });
        
        // Poll for connection status
        const pollInterval = setInterval(async () => {
          const statusResponse = await apiRequest(`/api/broker/${broker}/status`, {
            method: "GET"
          });
          
          if (statusResponse.success && statusResponse.connected) {
            clearInterval(pollInterval);
            
            toast({
              title: "Connection Successful",
              description: `Your ${broker.charAt(0).toUpperCase() + broker.slice(1)} account has been connected successfully.`
            });
            
            if (onLoginSuccess) {
              onLoginSuccess();
            } else {
              setLocation("/");
            }
          }
        }, 3000);
        
        // Stop polling after 2 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
        }, 2 * 60 * 1000);
      } else {
        throw new Error(response.message || `Failed to initiate ${broker} connection`);
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading({ ...loading, [broker]: false });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Connect Your Broker</CardTitle>
        <CardDescription>
          Choose your broker to connect your account
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          {/* Zerodha */}
          <Button
            variant="outline"
            className="flex items-center justify-between p-6 h-auto hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            onClick={() => handleConnect('zerodha')}
            disabled={loading.zerodha}
          >
            <div className="flex items-center gap-3">
              <SiZerodha className="h-8 w-8 text-[#387ed1]" />
              <div className="text-left">
                <div className="font-semibold text-lg">Connect with Zerodha</div>
                <div className="text-sm text-muted-foreground">India's largest broker</div>
              </div>
            </div>
            {loading.zerodha ? (
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-blue-600"></div>
            ) : (
              <FaShieldAlt className="h-5 w-5 text-blue-600" />
            )}
          </Button>
          
          {/* FYERS */}
          <Button
            variant="outline"
            className="flex items-center justify-between p-6 h-auto hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
            onClick={() => handleConnect('fyers')}
            disabled={loading.fyers}
          >
            <div className="flex items-center gap-3">
              <div className="font-bold text-xl text-green-600 h-8 w-8 flex items-center">F</div>
              <div className="text-left">
                <div className="font-semibold text-lg">Connect with FYERS</div>
                <div className="text-sm text-muted-foreground">Tech-first trading platform</div>
              </div>
            </div>
            {loading.fyers ? (
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-green-600"></div>
            ) : (
              <FaShieldAlt className="h-5 w-5 text-green-600" />
            )}
          </Button>
          
          {/* Angel One */}
          <Button
            variant="outline"
            className="flex items-center justify-between p-6 h-auto hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20"
            onClick={() => handleConnect('angel')}
            disabled={loading.angel}
          >
            <div className="flex items-center gap-3">
              <div className="font-bold text-xl text-purple-600 h-8 w-8 flex items-center">A</div>
              <div className="text-left">
                <div className="font-semibold text-lg">Connect with Angel One</div>
                <div className="text-sm text-muted-foreground">Popular retail broker</div>
              </div>
            </div>
            {loading.angel ? (
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-purple-600"></div>
            ) : (
              <FaShieldAlt className="h-5 w-5 text-purple-600" />
            )}
          </Button>
          
          {/* Upstox */}
          <Button
            variant="outline"
            className="flex items-center justify-between p-6 h-auto hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={() => handleConnect('upstox')}
            disabled={loading.upstox}
          >
            <div className="flex items-center gap-3">
              <div className="font-bold text-xl text-red-600 h-8 w-8 flex items-center">U</div>
              <div className="text-left">
                <div className="font-semibold text-lg">Connect with Upstox</div>
                <div className="text-sm text-muted-foreground">Mobile-first broker</div>
              </div>
            </div>
            {loading.upstox ? (
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-red-600"></div>
            ) : (
              <FaShieldAlt className="h-5 w-5 text-red-600" />
            )}
          </Button>
        </div>
      </CardContent>
      
      <CardFooter>
        <p className="text-xs text-center text-muted-foreground w-full">
          We use secure OAuth to connect with your broker. Your credentials are never stored on our servers.
        </p>
      </CardFooter>
    </Card>
  );
}