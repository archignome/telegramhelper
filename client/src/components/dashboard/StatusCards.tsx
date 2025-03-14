import { useState, useEffect } from 'react';

interface StatusCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
}

function StatusCard({ title, value, subtitle, icon }: StatusCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-neutral-400 font-medium">{title}</h2>
        <span className="material-icons text-primary">{icon}</span>
      </div>
      <p className="text-2xl font-semibold text-neutral-500">{value}</p>
      <p className="text-sm text-neutral-300 mt-1">{subtitle}</p>
    </div>
  );
}

export default function StatusCards() {
  const [stats, setStats] = useState({
    uptime: '99.8%',
    totalUsers: 0,
    plansSelected: 0,
    errors: 0
  });

  // In a real implementation, this would fetch data from the API
  useEffect(() => {
    // Simulate loading data
    const loadStats = async () => {
      // API call would go here
      setStats({
        uptime: '99.8%',
        totalUsers: 247,
        plansSelected: 86,
        errors: 3
      });
    };

    loadStats();
  }, []);

  const cards = [
    {
      title: 'Uptime',
      value: stats.uptime,
      subtitle: 'Last 30 days',
      icon: 'schedule'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      subtitle: '+12 today',
      icon: 'people'
    },
    {
      title: 'Plans Selected',
      value: stats.plansSelected,
      subtitle: 'Last 7 days',
      icon: 'shopping_cart'
    },
    {
      title: 'Errors',
      value: stats.errors,
      subtitle: 'Last 24 hours',
      icon: 'error_outline'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <StatusCard
          key={index}
          title={card.title}
          value={card.value}
          subtitle={card.subtitle}
          icon={card.icon}
        />
      ))}
    </div>
  );
}
