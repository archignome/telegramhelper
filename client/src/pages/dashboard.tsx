import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import StatusCards from '@/components/dashboard/StatusCards';
import ConfigSection from '@/components/dashboard/ConfigSection';
import PlansTable from '@/components/dashboard/PlansTable';
import BotCommands from '@/components/dashboard/BotCommands';
import LogConsole from '@/components/dashboard/LogConsole';
import HealthStatus from '@/components/dashboard/HealthStatus';

export default function Dashboard() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-6 flex-grow">
        <StatusCards />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ConfigSection />
            <PlansTable />
          </div>
          
          <div className="space-y-6">
            <BotCommands />
            <LogConsole />
            <HealthStatus />
          </div>
        </div>
      </main>
      
      <AppFooter />
    </div>
  );
}
