import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function AppHeader() {
  const [location] = useLocation();
  const [botStatus, setBotStatus] = useState<'active' | 'inactive' | 'unknown'>('unknown');

  const refreshDashboard = async () => {
    try {
      // In a real implementation, this would call the API to get updated data
      console.log('Refreshing dashboard data...');
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    }
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <span className="material-icons text-primary mr-2">rss_feed</span>
          <h1 className="text-xl font-medium text-neutral-500">VPN Sales Telegram Bot</h1>
        </div>
        <div className="flex items-center">
          <div className="mr-4 flex items-center">
            <span 
              className={`w-3 h-3 rounded-full mr-2 ${
                botStatus === 'active' ? 'bg-green-500' : 
                botStatus === 'inactive' ? 'bg-red-500' : 'bg-yellow-500'
              }`}
            />
            <span className={`text-sm ${
              botStatus === 'active' ? 'text-green-600' : 
              botStatus === 'inactive' ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {botStatus === 'active' ? 'Bot Active' : 
               botStatus === 'inactive' ? 'Bot Inactive' : 'Status Unknown'}
            </span>
          </div>
          <Button 
            variant="default" 
            size="sm" 
            className="flex items-center"
            onClick={refreshDashboard}
          >
            <span className="material-icons text-sm mr-1">refresh</span>
            Refresh
          </Button>
        </div>
      </div>
    </header>
  );
}
