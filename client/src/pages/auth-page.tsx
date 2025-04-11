import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { FaLock, FaUser, FaEnvelope, FaArrowRight } from "react-icons/fa";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      
      // Simulate login API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // For development only - in production we'd call the real API endpoint
      // const response = await apiRequest("/api/login", {
      //   method: "POST",
      //   body: JSON.stringify({
      //     username: data.username,
      //     password: data.password,
      //   }),
      // });
      
      // Mock successful login for development
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', data.username);
      
      toast({
        title: "Login Successful",
        description: "Welcome to AI Margin Optimizer!",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    try {
      setIsLoading(true);
      
      // Simulate registration API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For development only - in production we'd call the real API endpoint
      // const response = await apiRequest("/api/register", {
      //   method: "POST",
      //   body: JSON.stringify({
      //     username: data.username,
      //     email: data.email,
      //     name: data.name,
      //     password: data.password,
      //   }),
      // });
      
      // Mock successful registration
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', data.username);
      localStorage.setItem('email', data.email);
      localStorage.setItem('name', data.name);
      
      toast({
        title: "Registration Successful",
        description: "Your account has been created successfully!",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Username</Label>
                  <div className="relative">
                    <FaUser className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-username"
                      className="pl-10"
                      placeholder="Enter your username"
                      {...loginForm.register("username")}
                    />
                  </div>
                  {loginForm.formState.errors.username && (
                    <p className="text-sm text-red-500">{loginForm.formState.errors.username.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-password"
                      type="password"
                      className="pl-10"
                      placeholder="Enter your password"
                      {...loginForm.register("password")}
                    />
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Log in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-username">Username</Label>
                  <div className="relative">
                    <FaUser className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-username"
                      className="pl-10"
                      placeholder="Choose a username"
                      {...registerForm.register("username")}
                    />
                  </div>
                  {registerForm.formState.errors.username && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.username.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-email"
                      type="email"
                      className="pl-10"
                      placeholder="Enter your email"
                      {...registerForm.register("email")}
                    />
                  </div>
                  {registerForm.formState.errors.email && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-name">Full Name</Label>
                  <div className="relative">
                    <FaUser className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-name"
                      className="pl-10"
                      placeholder="Enter your full name"
                      {...registerForm.register("name")}
                    />
                  </div>
                  {registerForm.formState.errors.name && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-password"
                      type="password"
                      className="pl-10"
                      placeholder="Create a password"
                      {...registerForm.register("password")}
                    />
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-confirm-password"
                      type="password"
                      className="pl-10"
                      placeholder="Confirm your password"
                      {...registerForm.register("confirmPassword")}
                    />
                  </div>
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
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