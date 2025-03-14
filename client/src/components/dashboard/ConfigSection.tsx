import { useState } from 'react';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const configSchema = z.object({
  botToken: z.string().min(1, { message: "Bot token is required" }),
  adminId: z.string().min(1, { message: "Admin ID is required" }),
  logLevel: z.enum(['error', 'warn', 'info', 'debug', 'verbose']),
  healthCheckInterval: z.coerce.number().min(1).max(60),
  detailedLogging: z.boolean().default(true),
});

type ConfigFormValues = z.infer<typeof configSchema>;

export default function ConfigSection() {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      adminId: '123456789',
      logLevel: 'info',
      healthCheckInterval: 5,
      detailedLogging: true,
    },
  });

  const onSubmit = async (data: ConfigFormValues) => {
    setIsSaving(true);
    try {
      // Send data to the API
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }
      
      const result = await response.json();
      console.log('Configuration saved:', result);
    } catch (error) {
      console.error('Error saving configuration:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-medium text-neutral-500 mb-4 flex items-center">
        <span className="material-icons mr-2 text-primary">settings</span>
        Bot Configuration
      </h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="botToken"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-neutral-400">Telegram Bot Token</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    {...field} 
                    placeholder="Enter bot token" 
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="adminId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-neutral-400">Admin Telegram ID</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="Enter admin Telegram ID" 
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="logLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-neutral-400">Log Level</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select log level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="error">error</SelectItem>
                      <SelectItem value="warn">warn</SelectItem>
                      <SelectItem value="info">info</SelectItem>
                      <SelectItem value="debug">debug</SelectItem>
                      <SelectItem value="verbose">verbose</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="healthCheckInterval"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-neutral-400">Health Check Interval (min)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      min={1} 
                      max={60} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="detailedLogging"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm text-neutral-400">
                    Enable detailed error logging
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          <div className="pt-2">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
