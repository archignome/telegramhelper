import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import LogConsole from '@/components/dashboard/LogConsole';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getLogs, clearLogs } from '@/lib/api';

export default function Logs() {
  const [logData, setLogData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [limit, setLimit] = useState(100);
  const { toast } = useToast();

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const level = filter === 'all' ? undefined : filter;
      const response = await getLogs(level, limit);
      setLogData(response.data || []);
      setIsLoading(false);
    } catch (error) {
      toast({
        title: "Error loading logs",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter, limit, toast]);

  const handleClearLogs = async () => {
    try {
      await clearLogs();
      toast({
        title: "Logs cleared",
        description: "All logs have been successfully cleared",
      });
      setLogData([]);
    } catch (error) {
      toast({
        title: "Error clearing logs",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-6 flex-grow">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-neutral-700">Bot Logs</h1>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-neutral-500">Log level:</span>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Filter level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                  <SelectItem value="verbose">Verbose</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-neutral-500">Limit:</span>
              <Input
                type="number"
                className="w-[80px]"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
                min={10}
                max={1000}
              />
            </div>
            
            <Button variant="outline" onClick={fetchLogs}>
              <span className="material-icons text-sm mr-1">refresh</span>
              Refresh
            </Button>
            
            <Button variant="destructive" onClick={handleClearLogs}>
              <span className="material-icons text-sm mr-1">delete</span>
              Clear Logs
            </Button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="h-[calc(100vh-300px)] overflow-y-auto bg-neutral-100 rounded-md p-3 font-mono text-xs">
            {isLoading ? (
              <div className="text-center py-10 text-neutral-400">Loading logs...</div>
            ) : logData.length > 0 ? (
              logData.map((log, index) => (
                <div 
                  key={index} 
                  className={`${
                    log.level === 'error' ? 'text-red-500' :
                    log.level === 'warn' ? 'text-orange-500' :
                    log.level === 'info' ? 'text-green-600' :
                    log.level === 'debug' ? 'text-blue-500' :
                    'text-gray-600'
                  } mb-1`}
                >
                  [{new Date(log.timestamp).toLocaleString()}] [{log.level.toUpperCase()}] {log.message}
                  {log.metadata && <span className="text-gray-500"> {log.metadata}</span>}
                  {log.userId && <span className="text-purple-500"> (User: {log.userId})</span>}
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-neutral-400">No logs available</div>
            )}
          </div>
        </div>
      </main>
      
      <AppFooter />
    </div>
  );
}
