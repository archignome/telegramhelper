import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import ConfigSection from '@/components/dashboard/ConfigSection';
import PlansTable from '@/components/dashboard/PlansTable';
import { getBotConfig } from '@/lib/api';

export default function Settings() {
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [config, setConfig] = useState(null);
  
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        const configData = await getBotConfig();
        setConfig(configData);
        setIsLoading(false);
      } catch (error) {
        toast({
          title: "Error loading configuration",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [toast]);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-6 flex-grow">
        <h1 className="text-2xl font-bold mb-6 text-neutral-700">Bot Settings</h1>
        
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <p className="text-center py-10 text-neutral-400">Loading settings...</p>
          </div>
        ) : (
          <>
            <ConfigSection />
            <PlansTable />
          </>
        )}
      </main>
      
      <AppFooter />
    </div>
  );
}
