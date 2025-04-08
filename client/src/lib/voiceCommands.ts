import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "./queryClient";

// Types for commands
export type CommandType = {
  command: string;
  callback: (...args: any[]) => void;
  matchInterim?: boolean;
  isFuzzyMatch?: boolean;
  fuzzyMatchingThreshold?: number;
  bestMatchOnly?: boolean;
};

// Type for voice command hooks return value
export type VoiceCommandsHook = {
  commands: CommandType[];
};

// Using a hook pattern to generate commands with access to React hooks
export function useVoiceCommands(): VoiceCommandsHook {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Notification helper
  const notify = (title: string, description: string) => {
    toast({
      title,
      description,
    });
  };

  // Basic navigation commands
  const navigationCommands: CommandType[] = [
    {
      command: 'go to home',
      callback: () => {
        navigate('/');
        notify('Voice Command', 'Navigated to Home');
      },
    },
    {
      command: 'go to advanced analytics',
      callback: () => {
        navigate('/advanced-analytics');
        notify('Voice Command', 'Navigated to Advanced Analytics');
      },
    },
    {
      command: 'go to alerts',
      callback: () => {
        navigate('/alerts');
        notify('Voice Command', 'Navigated to Alerts');
      },
    },
    {
      command: 'go to broker',
      callback: () => {
        navigate('/broker');
        notify('Voice Command', 'Navigated to Broker Connections');
      },
    },
  ];

  // System commands
  const systemCommands: CommandType[] = [
    {
      command: 'stop listening',
      callback: () => {
        notify('Voice Command', 'Stopped voice recognition');
      },
    },
    {
      command: 'help',
      callback: () => {
        // This will be handled by opening the help dialog
        document.getElementById('voice-command-help-button')?.click();
        notify('Voice Command', 'Opening help');
      },
    },
  ];

  // Trading related commands
  const tradingCommands: CommandType[] = [
    {
      command: 'show my positions',
      callback: () => {
        navigate('/');
        // This would typically trigger a component action or API call
        notify('Voice Command', 'Showing your current positions');
      },
    },
    {
      command: 'show market overview',
      callback: () => {
        navigate('/advanced-analytics');
        notify('Voice Command', 'Loading market overview');
      },
    },
    {
      command: 'create alert for *',
      callback: (symbol) => {
        navigate('/alerts');
        notify('Voice Command', `Creating alert for ${symbol}`);
        // You would typically set some state or trigger a modal here
      },
      isFuzzyMatch: true,
      fuzzyMatchingThreshold: 0.7,
    },
    {
      command: 'analyze stock *',
      callback: (symbol) => {
        navigate('/advanced-analytics');
        notify('Voice Command', `Analyzing ${symbol}`);
        // You would typically call an API or set state for the analytics component
      },
      isFuzzyMatch: true,
      fuzzyMatchingThreshold: 0.7,
    },
  ];

  // Auto-trade related commands
  const autoTradeCommands: CommandType[] = [
    {
      command: 'enable auto trade',
      callback: async () => {
        try {
          // Get the first auto-trade config (as an example)
          const configs = await apiRequest('/api/auto-trade/configs');
          if (configs && configs.length > 0) {
            // Toggle the first config to enabled
            await apiRequest(`/api/auto-trade/configs/${configs[0].id}/toggle`, {
              method: 'PATCH',
              body: JSON.stringify({ enabled: true })
            });
            notify('Voice Command', 'Auto-trade enabled');
          } else {
            notify('Voice Command', 'No auto-trade configurations found');
          }
        } catch (error) {
          notify('Error', 'Failed to enable auto-trade');
        }
      },
    },
    {
      command: 'disable auto trade',
      callback: async () => {
        try {
          // Get the first auto-trade config (as an example)
          const configs = await apiRequest('/api/auto-trade/configs');
          if (configs && configs.length > 0) {
            // Toggle the first config to disabled
            await apiRequest(`/api/auto-trade/configs/${configs[0].id}/toggle`, {
              method: 'PATCH',
              body: JSON.stringify({ enabled: false })
            });
            notify('Voice Command', 'Auto-trade disabled');
          } else {
            notify('Voice Command', 'No auto-trade configurations found');
          }
        } catch (error) {
          notify('Error', 'Failed to disable auto-trade');
        }
      },
    },
    {
      command: 'create auto trade config',
      callback: () => {
        navigate('/');
        notify('Voice Command', 'Opening auto trade configuration form');
        // This would typically open a modal or navigate to a specific form
      },
    },
  ];

  // Combine all commands
  const allCommands = [
    ...navigationCommands,
    ...systemCommands,
    ...tradingCommands,
    ...autoTradeCommands,
  ];

  return { commands: allCommands };
}