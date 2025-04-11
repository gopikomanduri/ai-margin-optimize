import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BrokerConnectButtons } from "./BrokerConnectButtons";

interface BrokerLoginProps {
  onLoginSuccess?: () => void;
}

export function BrokerLogin({ onLoginSuccess }: BrokerLoginProps) {
  return (
    <Card className="w-full max-w-md mx-auto border-1 border-primary/20">
      <CardHeader>
        <CardTitle className="text-2xl">Connect Broker</CardTitle>
        <CardDescription>
          Connect your trading account to access portfolio data
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <BrokerConnectButtons onLoginSuccess={onLoginSuccess} />
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