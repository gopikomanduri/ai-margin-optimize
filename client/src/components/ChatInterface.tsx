import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MessageType, ChatMessage } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import TradeCard from "@/components/TradeCard";

interface ChatInterfaceProps {
  activeTab: string;
}

const ChatInterface = ({ activeTab }: ChatInterfaceProps) => {
  const [inputMessage, setInputMessage] = useState("");
  const [languageMode, setLanguageMode] = useState("beginner");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Fetch chat history
  const { data: chatHistory, isLoading } = useQuery<{
    messages: ChatMessage[];
    contextInfo: { messageCount: number; lastUpdated: string };
  }>({
    queryKey: ['/api/chat/history'],
  });
  
  // Post new message mutation
  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/chat/message', { 
        message,
        languageMode
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/history'] });
    },
    onError: (error) => {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Clear chat history mutation
  const { mutate: clearChat } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/chat/clear', {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/history'] });
      toast({
        title: "Chat cleared",
        description: "Your chat history has been cleared."
      });
    }
  });
  
  // Refresh context mutation
  const { mutate: refreshContext } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/chat/refresh', {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/history'] });
      toast({
        title: "Context refreshed",
        description: "Your chat context has been refreshed with latest data."
      });
    }
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    sendMessage(inputMessage);
    setInputMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Auto-scroll to bottom of chat on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  if (activeTab !== "Assistant") {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-200">
      {/* Chat Header */}
      <div className="bg-white p-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Trading Assistant</h2>
          <p className="text-sm text-slate-500">Your AI-Powered Trading Co-Pilot</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <span className="text-xs text-slate-600 mr-2">Mode:</span>
            <select 
              className="text-xs border border-slate-200 rounded py-1 px-2"
              value={languageMode}
              onChange={(e) => setLanguageMode(e.target.value)}
            >
              <option value="beginner">Beginner</option>
              <option value="pro">Pro</option>
            </select>
          </div>
          <button 
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500" 
            title="Start new chat"
            onClick={() => clearChat()}
          >
            <i className="ri-restart-line"></i>
          </button>
        </div>
      </div>
      
      {/* Chat Messages Area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto bg-white p-4 space-y-6"
      >
        {isLoading ? (
          <div className="flex justify-center p-6">
            <span className="text-slate-500">Loading chat history...</span>
          </div>
        ) : chatHistory?.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 mb-4">
              <i className="ri-robot-line text-2xl"></i>
            </div>
            <h3 className="text-lg font-medium text-slate-800">Welcome to TradeMind</h3>
            <p className="text-sm text-slate-500 text-center max-w-md mt-2">
              Your AI-powered trading assistant. Ask me anything about stocks, trading strategies, or market analysis.
            </p>
          </div>
        ) : (
          chatHistory?.messages.map((message, index) => (
            <div 
              key={index}
              className={`flex items-start max-w-4xl ${
                message.type === MessageType.USER ? "justify-end ml-auto" : ""
              }`}
            >
              {message.type === MessageType.ASSISTANT && (
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white mr-3 flex-shrink-0">
                  <i className="ri-robot-line"></i>
                </div>
              )}
              
              <div className={`relative ${
                message.type === MessageType.ASSISTANT 
                  ? "bg-slate-50 rounded-lg p-4 chat-bubble" 
                  : "bg-primary-50 rounded-lg p-4 text-slate-700 chat-bubble-user"
              }`}>
                <div className="prose prose-sm">
                  <p className="m-0">{message.content}</p>
                </div>
                
                {/* Trade suggestions */}
                {message.type === MessageType.ASSISTANT && message.trades && message.trades.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {message.trades.map((trade, idx) => (
                      <TradeCard key={idx} trade={trade} />
                    ))}
                  </div>
                )}
                
                {/* Quick reply suggestions */}
                {message.type === MessageType.ASSISTANT && message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.suggestions.map((suggestion, idx) => (
                      <button 
                        key={idx}
                        className={`text-xs ${
                          idx === 0 
                            ? "bg-primary-50 text-primary-600 hover:bg-primary-100" 
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        } px-3 py-1.5 rounded-full`}
                        onClick={() => {
                          setInputMessage(suggestion);
                          setTimeout(() => handleSendMessage(), 100);
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {message.type === MessageType.USER && (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 ml-3 flex-shrink-0">
                  <span className="text-sm">T</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Chat Input Area */}
      <div className="bg-white border-t border-slate-200 p-4">
        <div className="flex items-end space-x-2">
          <div className="flex-1 flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden relative">
            <textarea
              className="flex-1 px-4 py-3 text-sm outline-none resize-none max-h-32"
              placeholder="Ask about stocks, indices, or trading ideas..."
              rows={1}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
            ></textarea>
            <div className="flex items-center space-x-1 px-3">
              <button className="text-slate-400 hover:text-slate-600 p-1">
                <i className="ri-link-m"></i>
              </button>
              <button className="text-slate-400 hover:text-slate-600 p-1">
                <i className="ri-attachment-2"></i>
              </button>
            </div>
          </div>
          <button 
            className={`p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 ${
              isSending ? "opacity-70 cursor-not-allowed" : ""
            }`}
            onClick={handleSendMessage}
            disabled={isSending || !inputMessage.trim()}
          >
            {isSending ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-send-plane-fill"></i>}
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
          <div className="flex items-center">
            <span className="mr-4">
              <span className="font-medium">Context Memory:</span> {chatHistory?.contextInfo.messageCount || 0} messages
            </span>
            <span>
              <span className="font-medium">Last updated:</span> {chatHistory?.contextInfo.lastUpdated || "Never"}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              className="text-slate-500 hover:text-slate-700 flex items-center"
              onClick={() => refreshContext()}
            >
              <i className="ri-refresh-line mr-1"></i> Refresh
            </button>
            <button 
              className="text-slate-500 hover:text-slate-700 flex items-center"
              onClick={() => clearChat()}
            >
              <i className="ri-delete-bin-line mr-1"></i> Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
