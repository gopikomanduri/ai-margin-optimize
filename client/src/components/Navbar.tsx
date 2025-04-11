import { Link, useLocation } from "wouter";
import { Home, BarChart2, Bell, Link2, LogOut, User } from "lucide-react";
import VoiceCommandButton from "./VoiceCommandButton";
import VoiceCommandHelp from "./VoiceCommandHelp";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  const username = localStorage.getItem('username') || 'User';

  const navItems = [
    { label: "Home", icon: Home, href: "/" },
    { label: "Advanced Analytics", icon: BarChart2, href: "/advanced-analytics" },
    { label: "Alerts", icon: Bell, href: "/alerts" },
    { label: "Broker Connections", icon: Link2, href: "/broker" },
  ];
  
  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('name');
    
    // Show success message
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    
    // Redirect to auth page
    setLocation("/auth");
  };

  return (
    <nav className="bg-card border-b">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">AI Margin Optimizer</span>
            <span className="text-xs text-muted-foreground">Margin Optimization & Risk Engine</span>
          </div>
          
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a className={`px-3 py-2 rounded-md text-sm flex items-center space-x-1 transition-colors
                  ${location === item.href 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted hover:text-foreground"}`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </a>
              </Link>
            ))}
            
            <div className="ml-2 flex items-center space-x-2">
              <VoiceCommandButton />
              <VoiceCommandHelp />
              
              <div className="border-l pl-2 ml-2 flex items-center">
                <div className="flex items-center mr-2">
                  <User className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="text-sm font-medium">{username}</span>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                  className="flex items-center text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  <span>Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}