import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface Plan {
  id: number;
  name: string;
  duration: string;
  price: string;
}

export default function PlansTable() {
  const [plans, setPlans] = useState<Plan[]>([
    { id: 1, name: 'Basic Plan', duration: '1 Month', price: '$9.99' },
    { id: 2, name: 'Premium Plan', duration: '6 Months', price: '$49.99' },
    { id: 3, name: 'Ultimate Plan', duration: '12 Months', price: '$89.99' }
  ]);

  const handleEditPlan = (planId: number) => {
    console.log('Edit plan:', planId);
    // Would open edit dialog
  };

  const handleDeletePlan = (planId: number) => {
    console.log('Delete plan:', planId);
    // Would confirm and delete
  };

  const handleAddNewPlan = () => {
    console.log('Add new plan');
    // Would open add plan dialog
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-medium text-neutral-500 mb-4 flex items-center">
        <span className="material-icons mr-2 text-primary">vpn_lock</span>
        VPN Plans Configuration
      </h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Plan Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Duration</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Price</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-neutral-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {plans.map(plan => (
              <tr key={plan.id}>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500">{plan.name}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500">{plan.duration}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500">{plan.price}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                  <button 
                    className="text-primary hover:text-blue-700 mx-1"
                    onClick={() => handleEditPlan(plan.id)}
                  >
                    <span className="material-icons text-sm">edit</span>
                  </button>
                  <button 
                    className="text-red-500 hover:text-red-700 mx-1"
                    onClick={() => handleDeletePlan(plan.id)}
                  >
                    <span className="material-icons text-sm">delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4">
        <Button 
          variant="outline"
          className="bg-green-600 text-white hover:bg-green-700 flex items-center"
          onClick={handleAddNewPlan}
        >
          <span className="material-icons text-sm mr-1">add</span>
          Add New Plan
        </Button>
      </div>
    </div>
  );
}
