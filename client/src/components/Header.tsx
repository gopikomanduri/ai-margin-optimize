import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  userProfile: any;
  isLoading: boolean;
}

const Header = ({ userProfile, isLoading }: HeaderProps) => {
  const { toast } = useToast();
  
  const { mutate: shareAssistant } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/share', {
        method: 'POST'
      });
      return response.json();
    },
    onSuccess: (data) => {
      navigator.clipboard.writeText(data.shareUrl);
      toast({
        title: "Share link copied!",
        description: "The link has been copied to your clipboard."
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating share link",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="flex items-center">
          <span className="text-primary-600 text-2xl font-bold">AI Margin Optimizer</span>
          <span className="text-slate-500 ml-2 text-xs border border-slate-200 rounded px-2 py-0.5">BETA</span>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button 
          className="hidden sm:flex items-center gap-1 text-xs px-3 py-1.5 border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50"
          onClick={() => shareAssistant()}
        >
          <i className="ri-share-line"></i>
          Share
        </button>
        <a 
          href="https://github.com/yourusername/ai-margin-optimizer-docs" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1 text-xs px-3 py-1.5 border border-success-500 rounded-md text-success-500 hover:bg-success-500/10"
        >
          <i className="ri-book-open-line"></i>
          Documentation
        </a>
        <div className="relative">
          <button className="flex items-center space-x-2 px-3 py-1.5 border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50">
            <span className="hidden sm:inline text-sm">
              {isLoading ? "Loading..." : `Hi, ${userProfile?.name || "Trader"}`}
            </span>
            <div className="w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm">
              {isLoading ? "..." : userProfile?.name?.[0] || "T"}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
