export default function BotCommands() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-medium text-neutral-500 mb-4 flex items-center">
        <span className="material-icons mr-2 text-primary">code</span>
        Bot Commands
      </h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-neutral-400 text-sm mb-2">/start Command</h3>
          <div className="bg-neutral-100 p-3 rounded text-sm font-mono">
            <pre>Welcome to VPN Sales Bot!
We offer secure, fast VPN services.
Type /plans to see our offerings.</pre>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium text-neutral-400 text-sm mb-2">/plans Command</h3>
          <div className="bg-neutral-100 p-3 rounded text-sm font-mono">
            <pre>Available VPN Plans:
• Basic Plan: $9.99/month
• Premium Plan: $49.99/6 months
• Ultimate Plan: $89.99/year</pre>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium text-neutral-400 text-sm mb-2">/paid Command</h3>
          <div className="bg-neutral-100 p-3 rounded text-sm font-mono">
            <pre>Thank you for your payment!
Your order is being processed.
You'll receive your VPN credentials soon.</pre>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium text-neutral-400 text-sm mb-2">/completeorder Command (Admin Only)</h3>
          <div className="bg-neutral-100 p-3 rounded text-sm font-mono">
            <pre>/completeorder 123456789
Order completed for user 123456789!</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
