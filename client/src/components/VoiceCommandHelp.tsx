import { useState } from 'react';
import { useVoice } from '@/contexts/VoiceContext';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function VoiceCommandHelp() {
  const [open, setOpen] = useState(false);
  const { commands, browserSupportsSpeechRecognition } = useVoice();

  // Format the command string for display (capitalize first letter, etc.)
  const formatCommand = (command: string) => {
    return command.charAt(0).toUpperCase() + command.slice(1);
  };

  // Simplify the command description based on the callback function
  const getCommandDescription = (command: string) => {
    if (command.startsWith('go to')) {
      return `Navigates to the ${command.replace('go to ', '')} page`;
    }
    if (command === 'stop listening') {
      return 'Stops the voice recognition';
    }
    return 'Executes the command';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          disabled={!browserSupportsSpeechRecognition}
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Voice Commands</DialogTitle>
          <DialogDescription>
            List of available voice commands you can use
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Table>
            <TableCaption>Say these commands while voice recognition is active</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Command</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commands.map((cmd, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">"{formatCommand(cmd.command)}"</TableCell>
                  <TableCell>{getCommandDescription(cmd.command)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="text-sm text-muted-foreground">
            <p>To start voice recognition, click the microphone icon in the navigation bar.</p>
            <p>Make sure you grant microphone permissions when prompted by your browser.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default VoiceCommandHelp;