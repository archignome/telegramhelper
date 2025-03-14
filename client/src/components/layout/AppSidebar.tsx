import { Link, useLocation } from 'wouter';

interface SidebarItemProps {
  path: string;
  icon: string;
  label: string;
  currentPath: string;
}

function SidebarItem({ path, icon, label, currentPath }: SidebarItemProps) {
  const isActive = currentPath === path;
  
  return (
    <Link href={path}>
      <a className={`flex items-center px-4 py-3 text-sm rounded-md transition-colors ${
        isActive 
          ? 'bg-primary text-white' 
          : 'text-neutral-500 hover:bg-neutral-100 hover:text-primary'
      }`}>
        <span className={`material-icons text-xl mr-3 ${isActive ? 'text-white' : 'text-primary'}`}>
          {icon}
        </span>
        {label}
      </a>
    </Link>
  );
}

export default function AppSidebar() {
  const [location] = useLocation();
  
  const navItems = [
    { path: '/', icon: 'dashboard', label: 'Dashboard' },
    { path: '/settings', icon: 'settings', label: 'Settings' },
    { path: '/logs', icon: 'article', label: 'Logs' }
  ];
  
  return (
    <aside className="bg-white w-64 h-full shadow-md p-4">
      <div className="flex items-center mb-8 px-4">
        <span className="material-icons text-2xl text-primary mr-2">rss_feed</span>
        <h1 className="font-medium text-lg text-neutral-700">VPN Sales Bot</h1>
      </div>
      
      <nav className="space-y-1">
        {navItems.map((item) => (
          <SidebarItem
            key={item.path}
            path={item.path}
            icon={item.icon}
            label={item.label}
            currentPath={location}
          />
        ))}
      </nav>
      
      <div className="absolute bottom-8 px-4 w-full left-0">
        <div className="px-4 py-3 bg-neutral-100 rounded-lg">
          <h3 className="text-sm font-medium text-neutral-700 mb-2 flex items-center">
            <span className="material-icons text-primary text-sm mr-1">info</span>
            Bot Status
          </h3>
          <div className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
            <span className="text-xs text-green-600">Active & Running</span>
          </div>
          <div className="text-xs text-neutral-400 mt-1">
            Last ping: 2 min ago
          </div>
        </div>
      </div>
    </aside>
  );
}
