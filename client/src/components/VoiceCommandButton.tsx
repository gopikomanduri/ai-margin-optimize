import { Mic, MicOff } from 'lucide-react';
import { useVoice } from '@/contexts/VoiceContext';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

export function VoiceCommandButton() {
  const { 
    isListening, 
    toggleListening, 
    transcript, 
    browserSupportsSpeechRecognition 
  } = useVoice();

  if (!browserSupportsSpeechRecognition) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline"
              size="icon"
              disabled
              className="relative text-muted-foreground"
            >
              <MicOff className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Your browser doesn't support speech recognition</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="relative">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={isListening ? "destructive" : "outline"}
              size="icon"
              onClick={toggleListening}
              className="relative"
            >
              {isListening ? (
                <Mic className="h-4 w-4 animate-pulse" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isListening ? "Stop" : "Start"} voice commands (Ctrl+Space)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {isListening && transcript && (
        <Badge 
          variant="outline" 
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-background"
        >
          {transcript}
        </Badge>
      )}
    </div>
  );
}

export default VoiceCommandButton;