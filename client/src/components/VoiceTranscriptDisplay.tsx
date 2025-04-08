import { useVoice } from '@/contexts/VoiceContext';
import { Mic } from 'lucide-react';
import { useState, useEffect } from 'react';

export function VoiceTranscriptDisplay() {
  const { isListening, transcript, lastExecutedCommand } = useVoice();
  const [showLastCommand, setShowLastCommand] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | undefined>(undefined);

  // When a command is executed, show it for a few seconds
  useEffect(() => {
    if (lastExecutedCommand) {
      setLastCommand(lastExecutedCommand);
      setShowLastCommand(true);
      
      const timer = setTimeout(() => {
        setShowLastCommand(false);
      }, 3000);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [lastExecutedCommand]);

  if (!isListening && !showLastCommand) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-background shadow-md rounded-lg border px-4 py-2 min-w-[300px] text-center">
        {isListening && (
          <div className="flex items-center justify-center space-x-2">
            <Mic className="h-4 w-4 text-destructive animate-pulse" />
            <span className="text-sm">
              {transcript ? 
                `"${transcript}"` : 
                'Listening for commands...'}
            </span>
          </div>
        )}
        
        {showLastCommand && !isListening && (
          <div className="text-sm text-muted-foreground">
            <span>Command executed: </span>
            <span className="font-medium">{lastCommand}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default VoiceTranscriptDisplay;