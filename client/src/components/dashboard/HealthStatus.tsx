import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface HealthMetrics {
  botService: { status: 'healthy' | 'warning' | 'error'; label: string };
  telegramApi: { status: 'healthy' | 'warning' | 'error'; label: string };
  memoryUsage: { status: 'healthy' | 'warning' | 'error'; label: string };
  cpuLoad: { status: 'healthy' | 'warning' | 'error'; label: string };
  lastHealthCheck: string;
}

export default function HealthStatus() {
  const [health, setHealth] = useState<HealthMetrics>({
    botService: { status: 'healthy', label: 'Healthy' },
    telegramApi: { status: 'healthy', label: 'Connected' },
    memoryUsage: { status: 'healthy', label: '128MB / 512MB' },
    cpuLoad: { status: 'warning', label: '42%' },
    lastHealthCheck: '2 min ago'
  });

  const [isChecking, setIsChecking] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-orange-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-orange-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const runHealthCheck = async () => {
    setIsChecking(true);
    
    try {
      // In a real implementation, this would call the API
      console.log('Running health check...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update with "new" health data
      setHealth({
        ...health,
        lastHealthCheck: 'just now'
      });
    } catch (error) {
      console.error('Error running health check:', error);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-medium text-neutral-500 mb-4 flex items-center">
        <span className="material-icons mr-2 text-primary">monitor_heart</span>
        Health Status
      </h2>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="text-neutral-400">Bot Service</div>
          <div className="flex items-center">
            <span className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(health.botService.status)}`}></span>
            <span className={getStatusTextColor(health.botService.status)}>{health.botService.label}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-neutral-400">Telegram API</div>
          <div className="flex items-center">
            <span className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(health.telegramApi.status)}`}></span>
            <span className={getStatusTextColor(health.telegramApi.status)}>{health.telegramApi.label}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-neutral-400">Memory Usage</div>
          <div className="flex items-center">
            <span className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(health.memoryUsage.status)}`}></span>
            <span className={getStatusTextColor(health.memoryUsage.status)}>{health.memoryUsage.label}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-neutral-400">CPU Load</div>
          <div className="flex items-center">
            <span className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(health.cpuLoad.status)}`}></span>
            <span className={getStatusTextColor(health.cpuLoad.status)}>{health.cpuLoad.label}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-neutral-400">Last Health Check</div>
          <div className="text-neutral-400">{health.lastHealthCheck}</div>
        </div>
      </div>
      
      <div className="mt-4">
        <Button 
          className="w-full" 
          onClick={runHealthCheck}
          disabled={isChecking}
        >
          <span className="material-icons text-sm mr-1">play_circle</span>
          {isChecking ? 'Running Check...' : 'Run Health Check Now'}
        </Button>
      </div>
    </div>
  );
}
