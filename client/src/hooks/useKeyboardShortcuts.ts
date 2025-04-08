import { useEffect } from 'react';
import { useVoice } from '@/contexts/VoiceContext';

export function useKeyboardShortcuts() {
  const { toggleListening, isListening } = useVoice();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl + Space to toggle voice recognition
      if (event.ctrlKey && event.code === 'Space') {
        event.preventDefault();
        toggleListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleListening, isListening]);
}

export default useKeyboardShortcuts;