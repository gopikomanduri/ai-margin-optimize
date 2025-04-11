import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { FaArrowRight, FaShieldAlt } from "react-icons/fa";
import { SiZerodha } from "react-icons/si";

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState({
    zerodha: false,
    fyers: false,
    angel: false,
    upstox: false,
    iifl: false
  });

  // Simple login for development
  const handleDirectLogin = () => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('username', 'demo_user');
    toast({
      title: "Login Successful",
      description: "Welcome to AI Margin Optimizer!",
    });
    setLocation("/");
  };
  
  // Broker connection handler
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
            
            // Auto login after successful broker connection
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', `${broker}_user`);
            setLocation("/");
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="flex flex-col lg:flex-row w-full max-w-6xl rounded-xl overflow-hidden shadow-xl bg-background">
        {/* Left side - Form */}
        <div className="w-full lg:w-1/2 p-6 lg:p-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent mb-2">
              AI Margin Optimizer
            </h1>
            <p className="text-muted-foreground">
              Real-Time Margin Optimization & Risk Engine
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="broker">Connect Broker</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <div className="space-y-6 py-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium">Quick Login</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    For demo purposes, you can login directly
                  </p>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={handleDirectLogin}
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Demo Login"}
                </Button>
                
                <div className="relative flex items-center justify-center">
                  <div className="h-px flex-grow bg-muted"></div>
                  <span className="mx-3 text-xs text-muted-foreground">OR</span>
                  <div className="h-px flex-grow bg-muted"></div>
                </div>
                
                <div className="text-center mb-2">
                  <p className="text-sm text-muted-foreground">
                    Directly connect with your broker
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Zerodha */}
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center py-6 h-auto hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    onClick={() => handleConnect('zerodha')}
                    disabled={loading.zerodha}
                  >
                    <SiZerodha className="h-8 w-8 mb-2 text-[#387ed1]" />
                    <span className="font-medium">Zerodha</span>
                    {loading.zerodha && (
                      <div className="mt-2 h-3 w-3 animate-spin rounded-full border-b-2 border-blue-600"></div>
                    )}
                  </Button>
                  
                  {/* FYERS */}
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center py-6 h-auto hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
                    onClick={() => handleConnect('fyers')}
                    disabled={loading.fyers}
                  >
                    <div className="text-xl font-bold mb-2 text-green-600">FYERS</div>
                    <span className="font-medium">FYERS</span>
                    {loading.fyers && (
                      <div className="mt-2 h-3 w-3 animate-spin rounded-full border-b-2 border-green-600"></div>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="broker">
              <div className="space-y-6 py-4">
                <div className="space-y-2 mb-4">
                  <h3 className="text-lg font-medium">Connect Your Broker</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect your trading account to enable AI-powered margin optimization
                  </p>
                </div>
                
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
                </div>
                
                <div className="flex items-center gap-2 text-xs text-center text-gray-500 justify-center mt-4">
                  <FaShieldAlt className="h-3 w-3" />
                  <p>We use secure OAuth connections. Your credentials are never stored on our servers.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right side - Hero */}
        <div className="w-full lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 lg:p-12 text-white flex flex-col justify-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Margin Optimization & Risk Engine</h2>
            <p className="text-xl">
              Boost your trading performance with AI-powered margin optimization
            </p>
            
            <div className="space-y-4 mt-8">
              <div className="flex items-start gap-3">
                <FaArrowRight className="h-5 w-5 mt-1 flex-shrink-0" />
                <p>Reduce over-pledging by 20-30% with smart collateral management</p>
              </div>
              
              <div className="flex items-start gap-3">
                <FaArrowRight className="h-5 w-5 mt-1 flex-shrink-0" />
                <p>Real-time analysis of news sentiment and market conditions</p>
              </div>
              
              <div className="flex items-start gap-3">
                <FaArrowRight className="h-5 w-5 mt-1 flex-shrink-0" />
                <p>Predict and prevent margin shortfalls before they happen</p>
              </div>
              
              <div className="flex items-start gap-3">
                <FaArrowRight className="h-5 w-5 mt-1 flex-shrink-0" />
                <p>Connect multiple brokers through a unified interface</p>
              </div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4 mt-6">
              <p className="italic">
                "AI Margin Optimizer freed up ₹12 lakhs in my trading capital, allowing me to take new positions that earned ₹65,000 in additional profits."
              </p>
              <p className="mt-2 font-medium">— Mr. Sharma, F&O Trader</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}