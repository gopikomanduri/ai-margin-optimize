import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Save, BellRing, User, Shield, Sliders, LogOut, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Settings() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  
  // Fetch user profile
  const { data: userProfile, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/user/profile'],
  });
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: ''
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    marketAlerts: true,
    marginOptimizationAlerts: true,
    newsAlerts: false,
    tradeConfirmations: true
  });
  
  // Handle profile form changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value
    });
  };
  
  // Handle notification toggle
  const handleNotificationToggle = (key: string) => {
    setNotificationSettings({
      ...notificationSettings,
      [key]: !notificationSettings[key as keyof typeof notificationSettings]
    });
  };
  
  // Handle save profile
  const handleSaveProfile = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully.",
    });
  };
  
  // Handle save notifications
  const handleSaveNotifications = () => {
    toast({
      title: "Notification Settings Updated",
      description: "Your notification preferences have been saved.",
    });
  };
  
  // Handle logout
  const handleLogout = () => {
    // Clear authentication
    localStorage.removeItem("isLoggedIn");
    // Redirect to login
    setLocation('/auth');
    
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
  };

  // Initialize profile form when data is loaded
  useState(() => {
    if (userProfile) {
      setProfileForm({
        name: userProfile.name || '',
        email: userProfile.email || '',
        phone: userProfile.phone || ''
      });
    }
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Header userProfile={userProfile} isLoading={isLoadingUser} />
      <div className="flex flex-1">
        <Navbar />
        <main className="flex-1 py-6">
          <div className="container">
            <div className="mb-6">
              <h1 className="text-3xl font-bold tracking-tight mb-4">Settings</h1>
              <p className="text-muted-foreground">
                Manage your account settings, notifications, and preferences.
              </p>
            </div>

            {isLoadingUser ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Tabs defaultValue="profile" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="profile" className="gap-2">
                    <User className="h-4 w-4" /> Profile
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="gap-2">
                    <BellRing className="h-4 w-4" /> Notifications
                  </TabsTrigger>
                  <TabsTrigger value="preferences" className="gap-2">
                    <Sliders className="h-4 w-4" /> Preferences
                  </TabsTrigger>
                  <TabsTrigger value="security" className="gap-2">
                    <Shield className="h-4 w-4" /> Security
                  </TabsTrigger>
                  <TabsTrigger value="brokers" className="gap-2">
                    <Briefcase className="h-4 w-4" /> Broker Connections
                  </TabsTrigger>
                </TabsList>
                
                {/* Profile Settings */}
                <TabsContent value="profile">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Settings</CardTitle>
                      <CardDescription>
                        Manage your personal information and account details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            name="name"
                            value={profileForm.name}
                            onChange={handleProfileChange}
                            placeholder="Your Name"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={userProfile?.username || ''}
                            disabled
                            className="bg-muted"
                          />
                          <p className="text-xs text-muted-foreground">
                            Username cannot be changed
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={profileForm.email}
                            onChange={handleProfileChange}
                            placeholder="your.email@example.com"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            name="phone"
                            value={profileForm.phone}
                            onChange={handleProfileChange}
                            placeholder="+91 9999999999"
                          />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline">Cancel</Button>
                      <Button onClick={handleSaveProfile} className="gap-1">
                        <Save className="h-4 w-4" /> Save Changes
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                {/* Notification Settings */}
                <TabsContent value="notifications">
                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Settings</CardTitle>
                      <CardDescription>
                        Configure how and when you receive notifications and alerts
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base">Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive notifications via email
                            </p>
                          </div>
                          <Switch
                            checked={notificationSettings.emailNotifications}
                            onCheckedChange={() => handleNotificationToggle('emailNotifications')}
                          />
                        </div>
                        
                        <Separator />
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base">Push Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive push notifications in your browser
                            </p>
                          </div>
                          <Switch
                            checked={notificationSettings.pushNotifications}
                            onCheckedChange={() => handleNotificationToggle('pushNotifications')}
                          />
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <h3 className="text-lg font-medium">Alert Types</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Market Alerts</Label>
                            <p className="text-sm text-muted-foreground">
                              Significant market movements and index updates
                            </p>
                          </div>
                          <Switch
                            checked={notificationSettings.marketAlerts}
                            onCheckedChange={() => handleNotificationToggle('marketAlerts')}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Margin Optimization Alerts</Label>
                            <p className="text-sm text-muted-foreground">
                              Notifications about margin requirement changes and optimization opportunities
                            </p>
                          </div>
                          <Switch
                            checked={notificationSettings.marginOptimizationAlerts}
                            onCheckedChange={() => handleNotificationToggle('marginOptimizationAlerts')}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>News Alerts</Label>
                            <p className="text-sm text-muted-foreground">
                              Breaking news that may impact your portfolio
                            </p>
                          </div>
                          <Switch
                            checked={notificationSettings.newsAlerts}
                            onCheckedChange={() => handleNotificationToggle('newsAlerts')}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Trade Confirmations</Label>
                            <p className="text-sm text-muted-foreground">
                              Notifications about executed trades and orders
                            </p>
                          </div>
                          <Switch
                            checked={notificationSettings.tradeConfirmations}
                            onCheckedChange={() => handleNotificationToggle('tradeConfirmations')}
                          />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button onClick={handleSaveNotifications} className="ml-auto gap-1">
                        <Save className="h-4 w-4" /> Save Preferences
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                {/* Preferences Settings */}
                <TabsContent value="preferences">
                  <Card>
                    <CardHeader>
                      <CardTitle>Application Preferences</CardTitle>
                      <CardDescription>
                        Customize your trading platform experience
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">
                        Configure your application preferences here
                      </p>
                      
                      {/* Preferences settings to be implemented */}
                      <div className="p-8 text-center text-muted-foreground">
                        Preference settings will be available soon
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Security Settings */}
                <TabsContent value="security">
                  <Card>
                    <CardHeader>
                      <CardTitle>Security Settings</CardTitle>
                      <CardDescription>
                        Manage account security and authentication options
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">
                        Configure your account security settings below
                      </p>
                      
                      {/* Security settings to be implemented */}
                      <div className="p-8 text-center text-muted-foreground">
                        Security settings will be available soon
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="pt-4">
                        <h3 className="text-lg font-medium mb-2">Account Actions</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Manage your account access and sessions
                        </p>
                        
                        <Button variant="destructive" onClick={handleLogout} className="gap-1">
                          <LogOut className="h-4 w-4" /> Logout
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Broker Connections */}
                <TabsContent value="brokers">
                  <Card>
                    <CardHeader>
                      <CardTitle>Broker Connections</CardTitle>
                      <CardDescription>
                        Manage connections to your trading accounts and brokers
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={() => setLocation('/broker')} className="mb-6">
                        Manage Broker Connections
                      </Button>
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Connected Brokers</h3>
                        
                        {/* Show connected brokers if available, otherwise show empty state */}
                        <div className="p-6 border rounded-md bg-muted/50 text-center text-muted-foreground">
                          Use the Broker Connections page to connect to your preferred trading platforms
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}