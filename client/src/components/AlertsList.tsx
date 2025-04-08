import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  Bell, 
  Edit, 
  Trash, 
  ArrowUpCircle, 
  ArrowDownCircle,
  BarChart3, 
  Volume2,
  Newspaper,
  Plus
} from 'lucide-react';

// Define types for Alert
interface Alert {
  id: number;
  userId: number;
  symbol: string;
  alertType: string;
  condition: string;
  value: string;
  timeframe?: string;
  indicator?: string;
  active: boolean;
  notifyVia: string;
  name: string;
  description?: string;
  cooldownMinutes?: number;
  lastTriggered?: Date;
  createdAt: Date;
}

interface AlertsListProps {
  symbol?: string; // Optional - if provided, only shows alerts for this symbol
}

export function AlertsList({ symbol }: AlertsListProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch alerts - either all or filtered by symbol
  const { data: alerts, isLoading, error } = useQuery({
    queryKey: symbol ? ['/api/alerts/symbol', symbol] : ['/api/alerts'],
    queryFn: async () => {
      const endpoint = symbol ? `/api/alerts/symbol/${symbol}` : '/api/alerts';
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }
      return response.json();
    },
  });

  // Delete alert mutation
  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      return apiRequest(`/api/alerts/${alertId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/symbol'] });
      toast({
        title: "Alert deleted",
        description: "The alert has been successfully deleted.",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete the alert. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Render alert type with appropriate styling and icon
  const renderAlertType = (type: string) => {
    let color = '';
    let Icon;
    
    switch (type) {
      case 'price':
        color = 'bg-blue-100 text-blue-800';
        Icon = type === 'price' ? ArrowUpCircle : ArrowDownCircle;
        break;
      case 'technical':
        color = 'bg-purple-100 text-purple-800';
        Icon = BarChart3;
        break;
      case 'volume':
        color = 'bg-green-100 text-green-800';
        Icon = Volume2;
        break;
      case 'news':
        color = 'bg-yellow-100 text-yellow-800';
        Icon = Newspaper;
        break;
      default:
        color = 'bg-gray-100 text-gray-800';
        Icon = Bell;
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        <span>{type}</span>
      </span>
    );
  };

  // Format date for display
  const formatDate = (dateString?: Date) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Spinner /></div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md flex items-center gap-2">
        <AlertTriangle size={20} />
        <span>Error loading alerts. Please try again.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{symbol ? `Alerts for ${symbol}` : 'All Alerts'}</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Bell className="mr-2 h-4 w-4" /> Create Alert
        </Button>
      </div>
      
      {alerts && alerts.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Last Triggered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert: Alert) => (
                <TableRow key={alert.id}>
                  <TableCell>{alert.name}</TableCell>
                  <TableCell className="font-medium">{alert.symbol}</TableCell>
                  <TableCell>{renderAlertType(alert.alertType)}</TableCell>
                  <TableCell>
                    {alert.condition} {alert.value}
                    {alert.alertType === 'technical' && alert.indicator && (
                      <span className="text-xs text-gray-500 block">
                        {alert.indicator.toUpperCase()} ({alert.timeframe})
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(alert.lastTriggered)}</TableCell>
                  <TableCell>
                    <Badge variant={alert.active ? "default" : "outline"}>
                      {alert.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setSelectedAlert(alert);
                        setIsCreateDialogOpen(true);
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" onClick={() => {
                          setSelectedAlert(alert);
                          setIsDeleteDialogOpen(true);
                        }}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border rounded-md bg-gray-50">
          <div className="relative mb-8">
            <Bell className="h-16 w-16 text-gray-300" />
            <div className="absolute top-0 right-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center animate-pulse">
              <Plus className="h-4 w-4 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-medium text-gray-800 mb-2">No alerts configured</h3>
          <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
            Create your first price alert to get notified when stocks hit your target price or technical indicators reach specific thresholds.
          </p>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="px-6 py-2 rounded-full shadow-md hover:shadow-lg transition-all"
          >
            <Bell className="h-4 w-4 mr-2" />
            Create New Alert
          </Button>
        </div>
      )}

      {/* Create/Edit Alert Dialog */}
      {isCreateDialogOpen && (
        <CreateEditAlertDialog
          isOpen={isCreateDialogOpen}
          setIsOpen={setIsCreateDialogOpen}
          alert={selectedAlert}
          onClose={() => {
            setSelectedAlert(null);
            setIsCreateDialogOpen(false);
          }}
          defaultSymbol={symbol}
        />
      )}

      {/* Delete Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the alert "{selectedAlert?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedAlert(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => selectedAlert && deleteAlertMutation.mutate(selectedAlert.id)}
              disabled={deleteAlertMutation.isPending}
            >
              {deleteAlertMutation.isPending ? <Spinner className="mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface CreateEditAlertDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  alert: Alert | null;
  onClose: () => void;
  defaultSymbol?: string;
}

function CreateEditAlertDialog({ 
  isOpen, 
  setIsOpen, 
  alert, 
  onClose,
  defaultSymbol
}: CreateEditAlertDialogProps) {
  const isEditing = !!alert;
  const queryClient = useQueryClient();
  
  // Form state
  const [formData, setFormData] = useState<Partial<Alert>>(
    alert || {
      symbol: defaultSymbol || '',
      alertType: 'price',
      condition: 'above',
      value: '',
      active: true,
      notifyVia: 'app',
      name: '',
      description: '',
      cooldownMinutes: 60,
    }
  );

  // Mutations for create/update
  const createMutation = useMutation({
    mutationFn: async (data: Partial<Alert>) => {
      return apiRequest('/api/alerts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/symbol'] });
      toast({
        title: "Alert created",
        description: "The alert has been successfully created.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create the alert. Please check your inputs and try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; alert: Partial<Alert> }) => {
      return apiRequest(`/api/alerts/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(data.alert),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/symbol'] });
      toast({
        title: "Alert updated",
        description: "The alert has been successfully updated.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update the alert. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.symbol || !formData.value) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (isEditing && alert) {
      updateMutation.mutate({ id: alert.id, alert: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Get stocks for dropdown
  const { data: stocks } = useQuery({
    queryKey: ['/api/market/stocks'],
    queryFn: async () => {
      const response = await fetch('/api/market/stocks');
      if (!response.ok) {
        throw new Error('Failed to fetch stocks');
      }
      return response.json();
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Alert' : 'Create New Alert'}</DialogTitle>
          <DialogDescription>
            Set up an alert to get notified when market conditions match your criteria.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Alert Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Give your alert a name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol *</Label>
              {stocks ? (
                <Select
                  value={formData.symbol}
                  onValueChange={(value) => handleSelectChange('symbol', value)}
                >
                  <SelectTrigger id="symbol">
                    <SelectValue placeholder="Select stock" />
                  </SelectTrigger>
                  <SelectContent>
                    {stocks.map((stock: { symbol: string; name: string }) => (
                      <SelectItem key={stock.symbol} value={stock.symbol}>
                        {stock.symbol} - {stock.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="symbol"
                  name="symbol"
                  placeholder="Symbol (e.g., AAPL)"
                  value={formData.symbol}
                  onChange={handleInputChange}
                  required
                />
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="alertType">Alert Type</Label>
              <Select
                value={formData.alertType}
                onValueChange={(value) => handleSelectChange('alertType', value)}
              >
                <SelectTrigger id="alertType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="technical">Technical Indicator</SelectItem>
                  <SelectItem value="volume">Volume</SelectItem>
                  <SelectItem value="news">News</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => handleSelectChange('condition', value)}
              >
                <SelectTrigger id="condition">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">Above</SelectItem>
                  <SelectItem value="below">Below</SelectItem>
                  <SelectItem value="crosses">Crosses</SelectItem>
                  {formData.alertType === 'price' && (
                    <SelectItem value="percent_change">Percent Change</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {formData.alertType === 'technical' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="indicator">Indicator</Label>
                <Select
                  value={formData.indicator}
                  onValueChange={(value) => handleSelectChange('indicator', value)}
                >
                  <SelectTrigger id="indicator">
                    <SelectValue placeholder="Select indicator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rsi">RSI</SelectItem>
                    <SelectItem value="macd">MACD</SelectItem>
                    <SelectItem value="sma">SMA</SelectItem>
                    <SelectItem value="ema">EMA</SelectItem>
                    <SelectItem value="bollinger">Bollinger Bands</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timeframe">Timeframe</Label>
                <Select
                  value={formData.timeframe}
                  onValueChange={(value) => handleSelectChange('timeframe', value)}
                >
                  <SelectTrigger id="timeframe">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">1 minute</SelectItem>
                    <SelectItem value="5m">5 minutes</SelectItem>
                    <SelectItem value="15m">15 minutes</SelectItem>
                    <SelectItem value="1h">1 hour</SelectItem>
                    <SelectItem value="4h">4 hours</SelectItem>
                    <SelectItem value="1d">1 day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">
                Value *
                {formData.condition === 'percent_change' && ' (%)'}
              </Label>
              <Input
                id="value"
                name="value"
                type="number"
                step="0.01"
                placeholder="Threshold value"
                value={formData.value}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notifyVia">Notification Method</Label>
              <Select
                value={formData.notifyVia}
                onValueChange={(value) => handleSelectChange('notifyVia', value)}
              >
                <SelectTrigger id="notifyVia">
                  <SelectValue placeholder="Select notification method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="app">In-App</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="all">All Methods</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cooldownMinutes">Cooldown (minutes)</Label>
            <Input
              id="cooldownMinutes"
              name="cooldownMinutes"
              type="number"
              min="0"
              placeholder="Minimum time between alerts"
              value={formData.cooldownMinutes}
              onChange={handleInputChange}
            />
            <p className="text-xs text-gray-500">
              Minimum time between consecutive alerts for the same condition.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="Optional description or notes"
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? (
                <Spinner className="mr-2" />
              ) : null}
              {isEditing ? 'Update Alert' : 'Create Alert'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}