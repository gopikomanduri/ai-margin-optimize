import { ReactNode } from "react";
import { Route, useLocation } from "wouter";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
}

export function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  const [_, setLocation] = useLocation();
  
  // In a real app, you'd use authentication context to check if user is logged in
  // For now, we'll simulate this with localStorage
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const isLoading = false; // Replace with actual loading state when needed
  
  return (
    <Route path={path}>
      {(params) => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }
        
        if (!isLoggedIn) {
          // Redirect to auth page if not logged in
          setLocation("/auth");
          return null;
        }
        
        // Pass the route params to the component
        return <Component {...params} />;
      }}
    </Route>
  );
}