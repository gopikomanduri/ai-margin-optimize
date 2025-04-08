import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  BellRing,
  Check,
  ChevronDown,
  X,
  AlertCircle
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/hooks/use-toast';

interface AlertNotification {
  id: number;
  triggerId: number;
  userId: number;
  symbol: string;
  triggeredAt: Date;
  triggerValue: string;
  message: string;
  status: 'delivered' | 'failed' | 'pending';
  notificationChannel: 'app' | 'email' | 'sms' | 'all';
}

export function AlertNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [readNotifications, setReadNotifications] = useState<Set<number>>(new Set());
  
  // Fetch existing notifications
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/alert-notifications'],
    queryFn: async () => {
      const response = await fetch('/api/alert-notifications');
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      return response.json();
    },
  });

  // Update notifications list when data changes
  useEffect(() => {
    if (data) {
      setNotifications(data);
      // Calculate unread count
      const newUnreadCount = data.filter((notification: AlertNotification) => 
        !readNotifications.has(notification.id)
      ).length;
      setUnreadCount(newUnreadCount);
    }
  }, [data, readNotifications]);

  // WebSocket connection for real-time notifications
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
      
      // Authenticate (in a real app, would send a token)
      socket.send(JSON.stringify({
        type: 'authenticate',
        userId: 1 // Fixed user ID for demo
      }));
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'alert') {
          // New alert notification received
          const newNotification = data.data;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast notification
          toast({
            title: `Alert: ${newNotification.symbol}`,
            description: newNotification.message,
          });
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };
    
    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    // Clean up WebSocket connection
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  // Mark a notification as read
  const markAsRead = (id: number) => {
    setReadNotifications(prev => new Set(prev).add(id));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    const newReadSet = new Set(readNotifications);
    notifications.forEach(notification => {
      newReadSet.add(notification.id);
    });
    setReadNotifications(newReadSet);
    setUnreadCount(0);
  };

  // Format date
  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    
    // If today, show only time
    const now = new Date();
    if (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    ) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Otherwise show date and time
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render notification status with icon
  const renderStatus = (status: string) => {
    switch (status) {
      case 'delivered':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <Check className="h-3 w-3" />
            Delivered
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
            <X className="h-3 w-3" />
            Failed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1">
            <Spinner className="h-3 w-3" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          {wsConnected ? <BellRing /> : <Bell />}
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-medium">Notifications</h3>
          <div className="flex items-center gap-2">
            {wsConnected ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                Disconnected
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
              Mark all as read
            </Button>
          </div>
        </div>
        
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Spinner />
            </div>
          ) : error ? (
            <div className="p-4 text-red-500 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Failed to load notifications
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mb-2" />
              <p className="text-gray-500">No notifications yet</p>
              <p className="text-xs text-gray-400">
                Notifications will appear here when your alerts are triggered
              </p>
            </div>
          ) : (
            <div>
              {notifications.map((notification: AlertNotification) => {
                const isRead = readNotifications.has(notification.id);
                
                return (
                  <div 
                    key={notification.id}
                    className={`p-4 border-b ${isRead ? 'bg-white' : 'bg-blue-50'}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex justify-between mb-1">
                      <div className="font-medium">{notification.symbol}</div>
                      <div className="text-xs text-gray-500">
                        {formatDate(notification.triggeredAt)}
                      </div>
                    </div>
                    <p className="text-sm mb-2">{notification.message}</p>
                    <div className="flex justify-between items-center">
                      {renderStatus(notification.status)}
                      <div className="text-xs text-gray-500">
                        via {notification.notificationChannel}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}