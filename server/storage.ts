import { 
  users, 
  botUsers, 
  vpnPlans, 
  orders, 
  botConfig, 
  botLogs,
  type User, 
  type InsertUser,
  type BotUser,
  type InsertBotUser,
  type VpnPlan,
  type InsertVpnPlan,
  type Order,
  type InsertOrder,
  type BotConfig,
  type InsertBotConfig,
  type BotLog,
  type InsertLog
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Bot user operations
  getBotUser(telegramId: string): Promise<BotUser | undefined>;
  createBotUser(user: InsertBotUser): Promise<BotUser>;
  updateBotUserActivity(telegramId: string): Promise<void>;
  
  // VPN plan operations
  getAllPlans(): Promise<VpnPlan[]>;
  getActivePlans(): Promise<VpnPlan[]>;
  getPlan(id: number): Promise<VpnPlan | undefined>;
  createPlan(plan: InsertVpnPlan): Promise<VpnPlan>;
  
  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getUserOrders(userId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  // Bot config operations
  getBotConfig(): Promise<BotConfig | undefined>;
  saveBotConfig(config: InsertBotConfig): Promise<BotConfig>;
  
  // Log operations
  getLogs(limit?: number): Promise<BotLog[]>;
  getLogsByLevel(level: string, limit?: number): Promise<BotLog[]>;
  addLog(log: InsertLog): Promise<BotLog>;
  clearLogs(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private botUsers: Map<string, BotUser>;
  private vpnPlans: Map<number, VpnPlan>;
  private orders: Map<number, Order>;
  private botConfig: BotConfig | undefined;
  private botLogs: BotLog[];
  
  private userIdCounter: number;
  private botUserIdCounter: number;
  private planIdCounter: number;
  private orderIdCounter: number;
  private logIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.botUsers = new Map();
    this.vpnPlans = new Map();
    this.orders = new Map();
    this.botLogs = [];
    
    this.userIdCounter = 1;
    this.botUserIdCounter = 1;
    this.planIdCounter = 1;
    this.orderIdCounter = 1;
    this.logIdCounter = 1;
    
    // Initialize with default plans
    const defaultPlans: InsertVpnPlan[] = [
      { name: "Basic Plan", description: "Standard VPN service", duration: 30, price: 999, isActive: true },
      { name: "Premium Plan", description: "Enhanced speed and features", duration: 180, price: 4999, isActive: true },
      { name: "Ultimate Plan", description: "Best value, premium features", duration: 365, price: 8999, isActive: true }
    ];
    
    defaultPlans.forEach(plan => this.createPlan(plan));
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Bot user operations
  async getBotUser(telegramId: string): Promise<BotUser | undefined> {
    return this.botUsers.get(telegramId);
  }
  
  async createBotUser(user: InsertBotUser): Promise<BotUser> {
    const id = this.botUserIdCounter++;
    const now = new Date();
    const botUser: BotUser = { 
      ...user, 
      id, 
      joinedAt: now, 
      lastActivity: now 
    };
    this.botUsers.set(user.telegramId, botUser);
    return botUser;
  }
  
  async updateBotUserActivity(telegramId: string): Promise<void> {
    const user = this.botUsers.get(telegramId);
    if (user) {
      user.lastActivity = new Date();
      this.botUsers.set(telegramId, user);
    }
  }
  
  // VPN plan operations
  async getAllPlans(): Promise<VpnPlan[]> {
    return Array.from(this.vpnPlans.values());
  }
  
  async getActivePlans(): Promise<VpnPlan[]> {
    return Array.from(this.vpnPlans.values()).filter(plan => plan.isActive);
  }
  
  async getPlan(id: number): Promise<VpnPlan | undefined> {
    return this.vpnPlans.get(id);
  }
  
  async createPlan(plan: InsertVpnPlan): Promise<VpnPlan> {
    const id = this.planIdCounter++;
    const vpnPlan: VpnPlan = { ...plan, id };
    this.vpnPlans.set(id, vpnPlan);
    return vpnPlan;
  }
  
  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async getUserOrders(userId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.userId === userId);
  }
  
  async createOrder(order: InsertOrder): Promise<Order> {
    const id = this.orderIdCounter++;
    const now = new Date();
    const newOrder: Order = { 
      ...order, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.orders.set(id, newOrder);
    return newOrder;
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (order) {
      order.status = status as any; // Bypass type checking for status enum
      order.updatedAt = new Date();
      this.orders.set(id, order);
      return order;
    }
    return undefined;
  }
  
  // Bot config operations
  async getBotConfig(): Promise<BotConfig | undefined> {
    return this.botConfig;
  }
  
  async saveBotConfig(config: InsertBotConfig): Promise<BotConfig> {
    const now = new Date();
    
    if (!this.botConfig) {
      this.botConfig = {
        ...config,
        id: 1,
        lastStarted: now
      };
    } else {
      this.botConfig = {
        ...this.botConfig,
        ...config,
      };
    }
    
    return this.botConfig;
  }
  
  // Log operations
  async getLogs(limit?: number): Promise<BotLog[]> {
    const logs = [...this.botLogs].sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
    
    return limit ? logs.slice(0, limit) : logs;
  }
  
  async getLogsByLevel(level: string, limit?: number): Promise<BotLog[]> {
    const levelMap: Record<string, string[]> = {
      'error': ['error'],
      'warn': ['error', 'warn'],
      'info': ['error', 'warn', 'info'],
      'debug': ['error', 'warn', 'info', 'debug'],
      'verbose': ['error', 'warn', 'info', 'debug', 'verbose'],
    };
    
    const allowedLevels = levelMap[level] || ['info', 'warn', 'error'];
    
    const logs = [...this.botLogs]
      .filter(log => allowedLevels.includes(log.level))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? logs.slice(0, limit) : logs;
  }
  
  async addLog(log: InsertLog): Promise<BotLog> {
    const id = this.logIdCounter++;
    const now = new Date();
    const botLog: BotLog = { 
      ...log, 
      id, 
      timestamp: now 
    };
    this.botLogs.push(botLog);
    
    // Limit logs to 5000 entries to prevent memory growth
    if (this.botLogs.length > 5000) {
      this.botLogs.shift();
    }
    
    return botLog;
  }
  
  async clearLogs(): Promise<void> {
    this.botLogs = [];
  }
}

import { SQLiteStorage } from './sqlite-storage';

// Export a single instance
// Use SQLiteStorage for local persistence
export const storage = new SQLiteStorage();
