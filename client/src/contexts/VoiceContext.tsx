import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useToast } from '@/hooks/use-toast';
import { useVoiceCommands, CommandType } from '@/lib/voiceCommands';

// Define the structure of our context
interface VoiceContextType {
  isListening: boolean;
  transcript: string;
  resetTranscript: () => void;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  commands: CommandType[];
  lastExecutedCommand?: string;
  browserSupportsSpeechRecognition: boolean;
}

// Create context with default values
const VoiceContext = createContext<VoiceContextType>({
  isListening: false,
  transcript: '',
  resetTranscript: () => {},
  startListening: () => {},
  stopListening: () => {},
  toggleListening: () => {},
  commands: [],
  lastExecutedCommand: undefined,
  browserSupportsSpeechRecognition: false,
});

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [lastExecutedCommand, setLastExecutedCommand] = useState<string>();
  const { toast } = useToast();
  const { commands } = useVoiceCommands();

  // Augment the stop listening command to update our state
  const enhancedCommands = commands.map(cmd => {
    if (cmd.command === 'stop listening') {
      return {
        ...cmd,
        callback: () => {
          SpeechRecognition.stopListening();
          setLastExecutedCommand('Stopped voice recognition');
          cmd.callback();
        }
      };
    }
    return cmd;
  });

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition({ 
    commands: enhancedCommands,
    transcribing: true,
  });

  // Capture commands that were executed
  useEffect(() => {
    const handleCommand = (command: string) => {
      setLastExecutedCommand(command);
    };
    
    document.addEventListener('voice-command-executed', (e: any) => {
      handleCommand(e.detail.command);
    });
    
    return () => {
      document.removeEventListener('voice-command-executed', (e: any) => {
        handleCommand(e.detail.command);
      });
    };
  }, []);

  const startListening = () => {
    resetTranscript();
    SpeechRecognition.startListening({ continuous: true });
    toast({
      title: 'Voice Recognition',
      description: 'Listening for commands...',
    });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
    toast({
      title: 'Voice Recognition',
      description: 'Stopped listening',
    });
  };

  const toggleListening = () => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const contextValue: VoiceContextType = {
    isListening: listening,
    transcript,
    resetTranscript,
    startListening,
    stopListening,
    toggleListening,
    commands: enhancedCommands,
    lastExecutedCommand,
    browserSupportsSpeechRecognition,
  };

  return (
    <VoiceContext.Provider value={contextValue}>
      {children}
    </VoiceContext.Provider>
  );
}

// Custom hook to use the voice context
export const useVoice = () => useContext(VoiceContext);