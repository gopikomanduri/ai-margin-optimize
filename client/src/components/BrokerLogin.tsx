import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Broker icons
import { SiZerodha } from "react-icons/si";
import { FaAngleRight, FaKey, FaUserAlt } from "react-icons/fa";

interface BrokerLoginProps {
  onLoginSuccess?: () => void;
}

export function BrokerLogin({ onLoginSuccess }: BrokerLoginProps) {
  const [zerodhaCredentials, setZerodhaCredentials] = useState({
    username: "",
    password: "",
    pin: "",
  });
  
  const [angelCredentials, setAngelCredentials] = useState({
    username: "",
    password: "",
    totp: "",
  });
  
  const [fyersCredentials, setFyersCredentials] = useState({
    username: "",
    password: "",
    pin: "",
  });
  
  const [loading, setLoading] = useState({
    zerodha: false,
    angel: false,
    fyers: false
  });
  
  const [step, setStep] = useState({
    zerodha: 1, // 1 = username/password, 2 = PIN
    angel: 1,   // 1 = username/password, 2 = TOTP
    fyers: 1    // 1 = username/password, 2 = PIN
  });
  
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const handleZerodhaCredentialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setZerodhaCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleAngelCredentialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAngelCredentials((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleFyersCredentialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFyersCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleZerodhaLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading({ ...loading, zerodha: true });
      
      if (step.zerodha === 1) {
        // First step - username and password
        const response = await apiRequest("/api/broker/zerodha/auth", {
          method: "POST",
          body: JSON.stringify({
            username: zerodhaCredentials.username,
            password: zerodhaCredentials.password,
          }),
        });
        
        if (response.success) {
          // Move to PIN step
          setStep({ ...step, zerodha: 2 });
          toast({
            title: "Authentication Step 1 Complete",
            description: "Please enter your Zerodha PIN to complete login.",
          });
        } else {
          throw new Error(response.message || "Failed to authenticate with Zerodha");
        }
      } else {
        // Second step - PIN verification
        const response = await apiRequest("/api/broker/zerodha/verify", {
          method: "POST",
          body: JSON.stringify({
            username: zerodhaCredentials.username,
            pin: zerodhaCredentials.pin,
          }),
        });
        
        if (response.success) {
          toast({
            title: "Login Successful",
            description: "You have successfully connected to your Zerodha account.",
          });
          
          if (onLoginSuccess) {
            onLoginSuccess();
          } else {
            setLocation("/");
          }
        } else {
          throw new Error(response.message || "Failed to verify PIN");
        }
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading({ ...loading, zerodha: false });
    }
  };

  const handleAngelLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading({ ...loading, angel: true });
      
      if (step.angel === 1) {
        // First step - username and password
        const response = await apiRequest("/api/broker/angel/auth", {
          method: "POST",
          body: JSON.stringify({
            username: angelCredentials.username,
            password: angelCredentials.password,
          }),
        });
        
        if (response.success) {
          // Move to TOTP step
          setStep({ ...step, angel: 2 });
          toast({
            title: "Authentication Step 1 Complete",
            description: "Please enter your Angel One TOTP to complete login.",
          });
        } else {
          throw new Error(response.message || "Failed to authenticate with Angel One");
        }
      } else {
        // Second step - TOTP verification
        const response = await apiRequest("/api/broker/angel/verify", {
          method: "POST",
          body: JSON.stringify({
            username: angelCredentials.username,
            totp: angelCredentials.totp,
          }),
        });
        
        if (response.success) {
          toast({
            title: "Login Successful",
            description: "You have successfully connected to your Angel One account.",
          });
          
          if (onLoginSuccess) {
            onLoginSuccess();
          } else {
            setLocation("/");
          }
        } else {
          throw new Error(response.message || "Failed to verify TOTP");
        }
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading({ ...loading, angel: false });
    }
  };
  
  const handleFyersLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading({ ...loading, fyers: true });
      
      if (step.fyers === 1) {
        // First step - username and password
        const response = await apiRequest("/api/broker/fyers/auth", {
          method: "POST",
          body: JSON.stringify({
            username: fyersCredentials.username,
            password: fyersCredentials.password,
          }),
        });
        
        if (response.success) {
          // Move to PIN step
          setStep({ ...step, fyers: 2 });
          toast({
            title: "Authentication Step 1 Complete",
            description: "Please enter your FYERS PIN to complete login.",
          });
        } else {
          throw new Error(response.message || "Failed to authenticate with FYERS");
        }
      } else {
        // Second step - PIN verification
        const response = await apiRequest("/api/broker/fyers/verify", {
          method: "POST",
          body: JSON.stringify({
            username: fyersCredentials.username,
            pin: fyersCredentials.pin,
          }),
        });
        
        if (response.success) {
          toast({
            title: "Login Successful",
            description: "You have successfully connected to your FYERS account.",
          });
          
          if (onLoginSuccess) {
            onLoginSuccess();
          } else {
            setLocation("/");
          }
        } else {
          throw new Error(response.message || "Failed to verify PIN");
        }
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading({ ...loading, fyers: false });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Connect Your Broker</CardTitle>
        <CardDescription className="text-center">
          Connect your trading account to enable AI-powered margin optimization
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="zerodha" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="zerodha" className="flex items-center gap-2">
              <SiZerodha className="h-4 w-4" />
              <span>Zerodha</span>
            </TabsTrigger>
            <TabsTrigger value="fyers" className="flex items-center gap-2">
              <span className="font-bold text-sm">FYERS</span>
            </TabsTrigger>
            <TabsTrigger value="angel" className="flex items-center gap-2">
              <span className="font-bold text-sm">Angel</span>
              <span>One</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Zerodha Login Form */}
          <TabsContent value="zerodha">
            <form onSubmit={handleZerodhaLogin} className="space-y-4 pt-4">
              {step.zerodha === 1 ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="zerodha-username">Zerodha User ID</Label>
                    <div className="relative">
                      <FaUserAlt className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="zerodha-username"
                        name="username"
                        placeholder="ZD1234"
                        className="pl-10"
                        value={zerodhaCredentials.username}
                        onChange={handleZerodhaCredentialsChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="zerodha-password">Password</Label>
                    <div className="relative">
                      <FaKey className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="zerodha-password"
                        name="password"
                        type="password"
                        className="pl-10"
                        value={zerodhaCredentials.password}
                        onChange={handleZerodhaCredentialsChange}
                        required
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="zerodha-pin">Zerodha PIN</Label>
                  <Input
                    id="zerodha-pin"
                    name="pin"
                    type="password"
                    placeholder="Enter your 6-digit PIN"
                    value={zerodhaCredentials.pin}
                    onChange={handleZerodhaCredentialsChange}
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                  />
                  <p className="text-xs text-gray-500">
                    Please enter the 6-digit PIN you use to log in to Zerodha Kite
                  </p>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-[#387ed1] hover:bg-[#2c6cb6]"
                disabled={loading.zerodha}
              >
                {loading.zerodha ? (
                  "Connecting..."
                ) : step.zerodha === 1 ? (
                  "Continue"
                ) : (
                  "Connect Zerodha Account"
                )}
              </Button>
            </form>
          </TabsContent>
          
          {/* FYERS Login Form */}
          <TabsContent value="fyers">
            <form onSubmit={handleFyersLogin} className="space-y-4 pt-4">
              {step.fyers === 1 ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fyers-username">FYERS Client ID</Label>
                    <div className="relative">
                      <FaUserAlt className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="fyers-username"
                        name="username"
                        placeholder="XY00000"
                        className="pl-10"
                        value={fyersCredentials.username}
                        onChange={handleFyersCredentialsChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fyers-password">Password</Label>
                    <div className="relative">
                      <FaKey className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="fyers-password"
                        name="password"
                        type="password"
                        className="pl-10"
                        value={fyersCredentials.password}
                        onChange={handleFyersCredentialsChange}
                        required
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="fyers-pin">FYERS PIN</Label>
                  <Input
                    id="fyers-pin"
                    name="pin"
                    type="password"
                    placeholder="Enter your FYERS PIN"
                    value={fyersCredentials.pin}
                    onChange={handleFyersCredentialsChange}
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                  />
                  <p className="text-xs text-gray-500">
                    Please enter the security PIN for your FYERS account
                  </p>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                disabled={loading.fyers}
              >
                {loading.fyers ? (
                  "Connecting..."
                ) : step.fyers === 1 ? (
                  "Continue"
                ) : (
                  "Connect FYERS Account"
                )}
              </Button>
            </form>
          </TabsContent>
          
          {/* Angel One Login Form */}
          <TabsContent value="angel">
            <form onSubmit={handleAngelLogin} className="space-y-4 pt-4">
              {step.angel === 1 ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="angel-username">Angel One Client ID</Label>
                    <div className="relative">
                      <FaUserAlt className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="angel-username"
                        name="username"
                        placeholder="A123456"
                        className="pl-10"
                        value={angelCredentials.username}
                        onChange={handleAngelCredentialsChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="angel-password">Password</Label>
                    <div className="relative">
                      <FaKey className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="angel-password"
                        name="password"
                        type="password"
                        className="pl-10"
                        value={angelCredentials.password}
                        onChange={handleAngelCredentialsChange}
                        required
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="angel-totp">Angel One TOTP</Label>
                  <Input
                    id="angel-totp"
                    name="totp"
                    placeholder="Enter the 6-digit code from your authenticator app"
                    value={angelCredentials.totp}
                    onChange={handleAngelCredentialsChange}
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                  />
                  <p className="text-xs text-gray-500">
                    Please enter the 6-digit code from your authenticator app
                  </p>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                disabled={loading.angel}
              >
                {loading.angel ? (
                  "Connecting..."
                ) : step.angel === 1 ? (
                  "Continue"
                ) : (
                  "Connect Angel One Account"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-2">
        <p className="text-xs text-center text-gray-500">
          Your login credentials are securely transmitted to your broker. We do not store your password or PIN.
        </p>
        <p className="text-xs text-center text-gray-500">
          By connecting your account, you allow AI Margin Optimizer to analyze your portfolio and optimize margin requirements based on market conditions.
        </p>
      </CardFooter>
    </Card>
  );
}