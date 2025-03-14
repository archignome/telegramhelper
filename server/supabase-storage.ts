import { supabase } from './supabase';
import { IStorage } from './storage';
import type {
  User, InsertUser,
  BotUser, InsertBotUser,
  VpnPlan, InsertVpnPlan,
  Order, InsertOrder,
  BotConfig, InsertBotConfig,
  BotLog, InsertLog
} from '@shared/schema';

export class SupabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('username', username)
      .single();
    
    if (error || !data) return undefined;
    return data as User;
  }

  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single();
    
    if (error) throw error;
    return data as User;
  }

  // Bot user operations
  async getBotUser(telegramId: string): Promise<BotUser | undefined> {
    const { data, error } = await supabase
      .from('bot_users')
      .select()
      .eq('telegramId', telegramId)
      .single();
    
    if (error || !data) return undefined;
    return data as BotUser;
  }

  async createBotUser(user: InsertBotUser): Promise<BotUser> {
    const { data, error } = await supabase
      .from('bot_users')
      .insert([{
        ...user,
        joinedAt: new Date(),
        lastActivity: new Date()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data as BotUser;
  }

  async updateBotUserActivity(telegramId: string): Promise<void> {
    const { error } = await supabase
      .from('bot_users')
      .update({ lastActivity: new Date() })
      .eq('telegramId', telegramId);
    
    if (error) throw error;
  }

  // VPN plan operations
  async getAllPlans(): Promise<VpnPlan[]> {
    const { data, error } = await supabase
      .from('vpn_plans')
      .select();
    
    if (error) throw error;
    return data as VpnPlan[];
  }

  async getActivePlans(): Promise<VpnPlan[]> {
    const { data, error } = await supabase
      .from('vpn_plans')
      .select()
      .eq('isActive', true);
    
    if (error) throw error;
    return data as VpnPlan[];
  }

  async getPlan(id: number): Promise<VpnPlan | undefined> {
    const { data, error } = await supabase
      .from('vpn_plans')
      .select()
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as VpnPlan;
  }

  async createPlan(plan: InsertVpnPlan): Promise<VpnPlan> {
    const { data, error } = await supabase
      .from('vpn_plans')
      .insert([plan])
      .select()
      .single();
    
    if (error) throw error;
    return data as VpnPlan;
  }

  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    const { data, error } = await supabase
      .from('orders')
      .select()
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as Order;
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select()
      .eq('userId', userId);
    
    if (error) throw error;
    return data as Order[];
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        ...order,
        createdAt: new Date(),
        updatedAt: new Date()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data as Order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status,
        updatedAt: new Date()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    return data as Order;
  }

  // Bot config operations
  async getBotConfig(): Promise<BotConfig | undefined> {
    const { data, error } = await supabase
      .from('bot_config')
      .select()
      .single();
    
    if (error || !data) return undefined;
    return data as BotConfig;
  }

  async saveBotConfig(config: InsertBotConfig): Promise<BotConfig> {
    // Use upsert to either update existing config or create new one
    const { data, error } = await supabase
      .from('bot_config')
      .upsert([{
        ...config,
        lastStarted: new Date()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data as BotConfig;
  }

  // Log operations
  async getLogs(limit?: number): Promise<BotLog[]> {
    let query = supabase
      .from('bot_logs')
      .select()
      .order('timestamp', { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as BotLog[];
  }

  async getLogsByLevel(level: string, limit?: number): Promise<BotLog[]> {
    let query = supabase
      .from('bot_logs')
      .select()
      .eq('level', level)
      .order('timestamp', { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as BotLog[];
  }

  async addLog(log: InsertLog): Promise<BotLog> {
    const { data, error } = await supabase
      .from('bot_logs')
      .insert([{
        ...log,
        timestamp: new Date()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data as BotLog;
  }

  async clearLogs(): Promise<void> {
    const { error } = await supabase
      .from('bot_logs')
      .delete()
      .neq('id', 0); // Delete all logs
    
    if (error) throw error;
  }
}