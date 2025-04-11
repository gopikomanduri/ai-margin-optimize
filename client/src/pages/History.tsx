import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function History() {
  // Define history type
  type HistoryItem = {
    id: number;
    type: 'trade' | 'margin' | 'pledge' | 'unpledge';
    timestamp: string;
    description: string;
    status: 'completed' | 'pending' | 'failed';
    amount?: number;
    symbol?: string;
    quantity?: number;
    price?: number;
  };
  
  // Get history data
  const { data: historyData, isLoading: isLoadingHistory } = useQuery<HistoryItem[]>({
    queryKey: ['/api/history'],
  });
  
  const isLoading = isLoadingHistory;

  // No longer using this function as we're using custom colors via className
  // const getStatusBadgeVariant = (status: string) => {
  //   switch (status) {
  //     case 'completed':
  //       return 'success';
  //     case 'pending':
  //       return 'warning';
  //     case 'failed':
  //       return 'destructive';
  //     default:
  //       return 'secondary';
  //   }
  // };

  // Format timestamp to readable date
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get type badge
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'trade':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Trade</Badge>;
      case 'margin':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">Margin</Badge>;
      case 'pledge':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700">Pledge</Badge>;
      case 'unpledge':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700">Unpledge</Badge>;
      default:
        return <Badge variant="outline">Other</Badge>;
    }
  };

  return (
    <div className="px-6 py-4">
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-4">History</h1>
          <p className="text-muted-foreground">
            Track your past activities, trades, margin optimizations, and account changes.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Activity History</CardTitle>
                <Button variant="outline" size="sm" className="gap-1">
                  <Filter className="h-4 w-4" /> Filter
                </Button>
              </div>
              <CardDescription>
                A comprehensive log of all your platform activities and transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyData?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatTimestamp(item.timestamp)}</TableCell>
                      <TableCell>{getTypeBadge(item.type)}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>
                        {item.symbol && (
                          <div className="text-sm">
                            {item.symbol}{' '}
                            {item.quantity && `× ${item.quantity}`}{' '}
                            {item.price && `@ ₹${item.price.toLocaleString()}`}
                          </div>
                        )}
                        {item.amount && (
                          <div className="text-sm">
                            Amount: ₹{item.amount.toLocaleString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`
                          ${item.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                          ${item.status === 'pending' ? 'bg-amber-100 text-amber-800' : ''}
                          ${item.status === 'failed' ? 'bg-red-100 text-red-800' : ''}
                        `}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Show empty state if no data */}
                  {historyData?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No history data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}