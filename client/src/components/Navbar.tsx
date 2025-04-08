import { Link, useLocation } from "wouter";
import { Home, BarChart2, Bell, MessageSquare, Settings } from "lucide-react";

export default function Navbar() {
  const [location] = useLocation();

  const navItems = [
    { label: "Home", icon: Home, href: "/" },
    { label: "Advanced Analytics", icon: BarChart2, href: "/advanced-analytics" },
    { label: "Alerts", icon: Bell, href: "/alerts" },
  ];

  return (
    <nav className="bg-card border-b">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg">TradeMind</span>
            <span className="text-xs text-muted-foreground">AI Trading Assistant</span>
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
          </div>
        </div>
      </div>
    </nav>
  );
}