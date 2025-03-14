import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'VERBOSE';
  message: string;
}

export default function LogConsole() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // In a real implementation, this would fetch logs from the API
    const sampleLogs: LogEntry[] = [
      { timestamp: '2023-08-15 09:12:43', level: 'INFO', message: 'Bot started successfully' },
      { timestamp: '2023-08-15 09:15:22', level: 'INFO', message: 'User 123456789 used /start command' },
      { timestamp: '2023-08-15 09:16:05', level: 'INFO', message: 'User 123456789 requested /plans' },
      { timestamp: '2023-08-15 09:17:31', level: 'INFO', message: 'User 123456789 selected Premium Plan' },
      { timestamp: '2023-08-15 09:18:12', level: 'WARN', message: 'Payment verification delay detected' },
      { timestamp: '2023-08-15 09:20:45', level: 'INFO', message: 'User 123456789 sent /paid command' },
      { timestamp: '2023-08-15 10:05:55', level: 'ERROR', message: 'API rate limit reached, retrying in 60s' },
      { timestamp: '2023-08-15 10:07:03', level: 'INFO', message: 'API connection restored' }
    ];
    setLogs(sampleLogs);
  }, []);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-500';
      case 'WARN': return 'text-orange-500';
      case 'INFO': return 'text-green-600';
      case 'DEBUG': return 'text-blue-500';
      case 'VERBOSE': return 'text-gray-600';
      default: return 'text-gray-700';
    }
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
    // Would filter logs in a real implementation
  };

  const handleClearLogs = () => {
    // Would clear logs in a real implementation
    setLogs([]);
  };

  const handleDownloadLogs = () => {
    // Would download logs in a real implementation
    console.log('Download logs');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-neutral-500 flex items-center">
          <span className="material-icons mr-2 text-primary">subject</span>
          Bot Logs
        </h2>
        <div className="flex">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-blue-700 mr-3 flex items-center"
            onClick={handleClearLogs}
          >
            <span className="material-icons text-sm mr-1">clear_all</span>
            Clear
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-blue-700 flex items-center"
            onClick={handleDownloadLogs}
          >
            <span className="material-icons text-sm mr-1">download</span>
            Download
          </Button>
        </div>
      </div>
      
      <div className="h-64 overflow-y-auto bg-neutral-100 rounded-md p-3 font-mono text-xs">
        {logs.map((log, index) => (
          <div key={index} className={getLevelColor(log.level)}>
            [{log.timestamp}] [{log.level}] {log.message}
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-gray-500 text-center py-4">No logs to display</div>
        )}
      </div>
      
      <div className="mt-3 flex items-center">
        <label className="text-sm text-neutral-400 mr-2">Filter:</label>
        <Select onValueChange={handleFilterChange} defaultValue={filter}>
          <SelectTrigger className="w-[180px] h-8 text-sm">
            <SelectValue placeholder="Select filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="error">Errors Only</SelectItem>
            <SelectItem value="warn">Warnings & Errors</SelectItem>
            <SelectItem value="info">Info & Above</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
