import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BrokerLogin } from "@/components/BrokerLogin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { SiZerodha } from "react-icons/si";
import { FaCheck, FaTimes, FaExchangeAlt, FaPlus, FaSync } from "react-icons/fa";

type BrokerInfo = {
  id: number;
  broker: string;
  isActive: boolean;
  lastUpdated: string;
  metadata?: {
    accountId?: string;
    name?: string;
    email?: string;
  };
};

export default function BrokerConnectionPage() {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const { toast } = useToast();

  const { 
    data: connections = [], 
    isLoading, 
    isError, 
    refetch 
  } = useQuery<BrokerInfo[]>({
    queryKey: ['/api/broker/connections'],
    refetchOnWindowFocus: false,
  });

  const handleDisconnect = async (id: number) => {
    try {
      const response = await apiRequest(`/api/broker/disconnect/${id}`, {
        method: "POST",
      });
      
      if (response.success) {
        toast({
          title: "Broker Disconnected",
          description: "Your broker connection has been removed successfully.",
        });
        refetch();
      } else {
        throw new Error(response.message || "Failed to disconnect broker");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const getBrokerIcon = (broker: string) => {
    switch (broker.toLowerCase()) {
      case 'zerodha':
        return <SiZerodha className="h-6 w-6" />;
      case 'angel':
        return <span className="font-bold text-lg">A</span>;
      default:
        return <FaExchangeAlt className="h-6 w-6" />;
    }
  };
  
  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Broker Connections</h1>
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3">Loading your connections...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container max-w-6xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Broker Connections</h1>
        <Card className="mb-8">
          <CardContent className="py-6">
            <div className="text-center p-4">
              <p className="text-red-500 mb-4">Failed to load broker connections</p>
              <Button onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Broker Connections</h1>
        <Button 
          onClick={() => setShowLoginForm(true)}
          className="flex items-center gap-2"
          variant="outline"
        >
          <FaPlus className="h-4 w-4" />
          <span>Add Broker</span>
        </Button>
      </div>
      
      {showLoginForm ? (
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Connect New Broker</CardTitle>
              <CardDescription>
                Add a new broker connection to enable automated trading
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BrokerLogin 
                onLoginSuccess={() => {
                  setShowLoginForm(false);
                  refetch();
                }} 
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowLoginForm(false)}
              >
                Cancel
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : null}
      
      {connections && connections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {connections.map((connection: BrokerInfo) => (
            <Card key={connection.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      {getBrokerIcon(connection.broker)}
                    </div>
                    <div>
                      <CardTitle>{connection.broker}</CardTitle>
                      <CardDescription>
                        {connection.metadata?.accountId || "Account connected"}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(connection.isActive)}>
                    {connection.isActive ? (
                      <><FaCheck className="mr-1 h-3 w-3" /> Active</>
                    ) : (
                      <><FaTimes className="mr-1 h-3 w-3" /> Inactive</>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Account Name</p>
                    <p>{connection.metadata?.name || "Not available"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Email</p>
                    <p>{connection.metadata?.email || "Not available"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Last Updated</p>
                    <p>{new Date(connection.lastUpdated).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="pt-0 flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => refetch()}
                  className="flex items-center gap-1"
                >
                  <FaSync className="h-3 w-3" />
                  <span>Refresh</span>
                </Button>
                
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDisconnect(connection.id)}
                >
                  Disconnect
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="mb-8">
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-xl mb-4">No broker connections found</p>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Connect to your preferred trading broker to start automated trading
              </p>
              <Button 
                onClick={() => setShowLoginForm(true)}
                className="flex items-center gap-2"
                size="lg"
              >
                <FaPlus className="h-4 w-4" />
                <span>Connect Broker</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}