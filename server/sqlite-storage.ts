import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { IStorage } from './storage';
import fs from 'fs';
import path from 'path';
import type {
  User, InsertUser,
  BotUser, InsertBotUser,
  VpnPlan, InsertVpnPlan,
  Order, InsertOrder,
  BotConfig, InsertBotConfig,
  BotLog, InsertLog
} from '@shared/schema';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'vpnbot.db');
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

export class SQLiteStorage implements IStorage {
  constructor() {
    this.initDatabase();
  }

  private initDatabase() {
    // Create tables if they don't exist
    sqlite.exec(`
      -- Create users table if not exists
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create bot_users table if not exists
      CREATE TABLE IF NOT EXISTS bot_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id TEXT NOT NULL UNIQUE,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create vpn_plans table if not exists
      CREATE TABLE IF NOT EXISTS vpn_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_id TEXT,
        name TEXT NOT NULL,
        description TEXT,
        duration INTEGER NOT NULL,
        price INTEGER NOT NULL,
        traffic INTEGER,
        devices INTEGER,
        plan_type TEXT NOT NULL DEFAULT 'basic',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create orders table if not exists
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        plan_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES bot_users(telegram_id),
        FOREIGN KEY (plan_id) REFERENCES vpn_plans(id)
      );

      -- Create bot_config table if not exists
      CREATE TABLE IF NOT EXISTS bot_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id TEXT NOT NULL,
        log_level TEXT NOT NULL DEFAULT 'info',
        health_check_interval INTEGER NOT NULL DEFAULT 5,
        detailed_logging INTEGER NOT NULL DEFAULT 1,
        last_started TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create bot_logs table if not exists
      CREATE TABLE IF NOT EXISTS bot_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        user_id TEXT,
        metadata TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES bot_users(telegram_id)
      );
    `);

    // Add indexes for better performance
    sqlite.exec(`
      CREATE INDEX IF NOT EXISTS idx_bot_users_telegram_id ON bot_users(telegram_id);
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_bot_logs_level ON bot_logs(level);
      CREATE INDEX IF NOT EXISTS idx_bot_logs_timestamp ON bot_logs(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_vpn_plans_is_active ON vpn_plans(is_active);
    `);
    
    // Initialize default plans if vpn_plans table is empty
    const count = sqlite.prepare('SELECT COUNT(*) as count FROM vpn_plans').get() as { count: number };
    
    if (count.count === 0) {
      const defaultPlans = [
        { plan_id: '1month', name: '1 Month Basic', description: '30GB Traffic • 1 Month • 2 Devices', duration: 30, price: 42000, traffic: 30, devices: 2, plan_type: 'basic', is_active: 1 },
        { plan_id: '3month', name: '3 Months Pro', description: '100GB Traffic • 3 Months • 3 Devices', duration: 90, price: 110000, traffic: 100, devices: 3, plan_type: 'premium', is_active: 1 },
        { plan_id: '6month', name: '6 Months Premium', description: '250GB Traffic • 6 Months • 5 Devices', duration: 180, price: 200000, traffic: 250, devices: 5, plan_type: 'ultimate', is_active: 1 },
        { plan_id: '30GB-1M-3D', name: '1 Month 30GB + 3 Devices', description: '30GB Traffic • 1 Month • 3 Devices', duration: 30, price: 90000, traffic: 30, devices: 3, plan_type: 'basic', is_active: 1 },
        { plan_id: '45GB-1M-3D', name: '1 Month 45GB + 3 Devices', description: '45GB Traffic • 1 Month • 3 Devices', duration: 30, price: 115000, traffic: 45, devices: 3, plan_type: 'basic', is_active: 1 },
        { plan_id: '100GB-2M-5D', name: '2 Months 100GB + 5 Devices', description: '100GB Traffic • 2 Months • 5 Devices', duration: 60, price: 210000, traffic: 100, devices: 5, plan_type: 'premium', is_active: 1 },
        { plan_id: '150GB-3M-10D', name: '3 Months 150GB + 10 Devices', description: '150GB Traffic • 3 Months • 10 Devices', duration: 90, price: 300000, traffic: 150, devices: 10, plan_type: 'premium', is_active: 1 },
        { plan_id: '15GB-1M', name: '1 Month 15GB', description: '15GB Traffic • 1 Month • 1 Device', duration: 30, price: 60000, traffic: 15, devices: 1, plan_type: 'basic', is_active: 1 },
        { plan_id: '20GB-1M', name: '1 Month 20GB', description: '20GB Traffic • 1 Month • 1 Device', duration: 30, price: 70000, traffic: 20, devices: 1, plan_type: 'basic', is_active: 1 },
        { plan_id: '30GB-2M-5D', name: '2 Months 30GB + 5 Devices', description: '30GB Traffic • 2 Months • 5 Devices', duration: 60, price: 130000, traffic: 30, devices: 5, plan_type: 'basic', is_active: 1 },
        { plan_id: '70GB-1M-3D', name: '1 Month 70GB + 3 Devices', description: '70GB Traffic • 1 Month • 3 Devices', duration: 30, price: 140000, traffic: 70, devices: 3, plan_type: 'premium', is_active: 1 }
      ];
      
      const insertStmt = sqlite.prepare(`
        INSERT INTO vpn_plans (plan_id, name, description, duration, price, traffic, devices, plan_type, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const plan of defaultPlans) {
        insertStmt.run(
          plan.plan_id,
          plan.name,
          plan.description,
          plan.duration,
          plan.price,
          plan.traffic,
          plan.devices,
          plan.plan_type,
          plan.is_active
        );
      }
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = sqlite.prepare('SELECT * FROM users WHERE id = ?').get(id) as any | undefined;
    if (!result) return undefined;
    
    return {
      id: result.id,
      username: result.username,
      createdAt: result.created_at
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = sqlite.prepare('SELECT * FROM users WHERE username = ?').get(username) as any | undefined;
    if (!result) return undefined;
    
    return {
      id: result.id,
      username: result.username,
      createdAt: result.created_at
    };
  }

  async createUser(user: InsertUser): Promise<User> {
    const stmt = sqlite.prepare(`
      INSERT INTO users (username)
      VALUES (?)
    `);
    
    const result = stmt.run(user.username);
    const id = result.lastInsertRowid as number;
    const now = new Date().toISOString();
    
    return {
      id,
      username: user.username,
      createdAt: now
    };
  }

  // Bot user operations
  async getBotUser(telegramId: string): Promise<BotUser | undefined> {
    const result = sqlite.prepare('SELECT * FROM bot_users WHERE telegram_id = ?').get(telegramId) as any;
    
    if (!result) return undefined;
    
    return {
      id: result.id,
      telegramId: result.telegram_id,
      username: result.username,
      firstName: result.first_name,
      lastName: result.last_name,
      joinedAt: result.joined_at,
      lastActivity: result.last_activity
    };
  }

  async createBotUser(user: InsertBotUser): Promise<BotUser> {
    const stmt = sqlite.prepare(`
      INSERT INTO bot_users (telegram_id, username, first_name, last_name)
      VALUES (?, ?, ?, ?)
    `);
    
    const now = new Date().toISOString();
    const result = stmt.run(
      user.telegramId,
      user.username || null,
      user.firstName || null,
      user.lastName || null
    );
    
    const id = result.lastInsertRowid as number;
    
    return {
      id,
      telegramId: user.telegramId,
      username: user.username || null,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      joinedAt: now,
      lastActivity: now
    };
  }

  async updateBotUserActivity(telegramId: string): Promise<void> {
    const stmt = sqlite.prepare(`
      UPDATE bot_users
      SET last_activity = CURRENT_TIMESTAMP
      WHERE telegram_id = ?
    `);
    
    stmt.run(telegramId);
  }

  // VPN plan operations
  async getAllPlans(): Promise<VpnPlan[]> {
    const results = sqlite.prepare('SELECT * FROM vpn_plans').all() as any[];
    
    return results.map(row => ({
      id: row.id,
      planId: row.plan_id,
      name: row.name,
      description: row.description,
      duration: row.duration,
      price: row.price,
      traffic: row.traffic,
      devices: row.devices,
      planType: row.plan_type,
      isActive: !!row.is_active,
      createdAt: new Date(row.created_at)
    }));
  }

  async getActivePlans(): Promise<VpnPlan[]> {
    const results = sqlite.prepare('SELECT * FROM vpn_plans WHERE is_active = 1').all() as any[];
    
    return results.map(row => ({
      id: row.id,
      planId: row.plan_id,
      name: row.name,
      description: row.description,
      duration: row.duration,
      price: row.price,
      traffic: row.traffic,
      devices: row.devices,
      planType: row.plan_type,
      isActive: true,
      createdAt: new Date(row.created_at)
    }));
  }

  async getPlan(id: number): Promise<VpnPlan | undefined> {
    const result = sqlite.prepare('SELECT * FROM vpn_plans WHERE id = ?').get(id) as any;
    
    if (!result) return undefined;
    
    return {
      id: result.id,
      planId: result.plan_id,
      name: result.name,
      description: result.description,
      duration: result.duration,
      price: result.price,
      traffic: result.traffic,
      devices: result.devices,
      planType: result.plan_type,
      isActive: !!result.is_active,
      createdAt: new Date(result.created_at)
    };
  }

  async createPlan(plan: InsertVpnPlan): Promise<VpnPlan> {
    const stmt = sqlite.prepare(`
      INSERT INTO vpn_plans (plan_id, name, description, duration, price, traffic, devices, plan_type, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      plan.planId || null,
      plan.name,
      plan.description || null,
      plan.duration,
      plan.price,
      plan.traffic || null,
      plan.devices || null,
      plan.planType || 'basic',
      plan.isActive === undefined ? 1 : (plan.isActive ? 1 : 0)
    );
    
    const id = result.lastInsertRowid as number;
    const now = new Date();
    
    return {
      id,
      planId: plan.planId || null,
      name: plan.name,
      description: plan.description || null,
      duration: plan.duration,
      price: plan.price,
      traffic: plan.traffic || null,
      devices: plan.devices || null,
      planType: plan.planType || 'basic',
      isActive: plan.isActive === undefined ? true : plan.isActive,
      createdAt: now
    };
  }

  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    const result = sqlite.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    
    if (!result) return undefined;
    
    return {
      id: result.id,
      userId: result.user_id,
      planId: result.plan_id,
      status: result.status,
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at)
    };
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    const results = sqlite.prepare('SELECT * FROM orders WHERE user_id = ?').all(userId) as any[];
    
    return results.map(row => ({
      id: row.id,
      userId: row.user_id,
      planId: row.plan_id,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const stmt = sqlite.prepare(`
      INSERT INTO orders (user_id, plan_id, status)
      VALUES (?, ?, ?)
    `);
    
    const now = new Date();
    const result = stmt.run(
      order.userId,
      order.planId,
      order.status || 'pending'
    );
    
    const id = result.lastInsertRowid as number;
    
    return {
      id,
      userId: order.userId,
      planId: order.planId,
      status: order.status || 'pending',
      createdAt: now,
      updatedAt: now
    };
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const stmt = sqlite.prepare(`
      UPDATE orders
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(status, id);
    
    return this.getOrder(id);
  }

  // Bot config operations
  async getBotConfig(): Promise<BotConfig | undefined> {
    const result = sqlite.prepare('SELECT * FROM bot_config ORDER BY id DESC LIMIT 1').get() as any;
    
    if (!result) return undefined;
    
    return {
      id: result.id,
      adminId: result.admin_id,
      logLevel: result.log_level,
      healthCheckInterval: result.health_check_interval,
      detailedLogging: !!result.detailed_logging,
      lastStarted: new Date(result.last_started)
    };
  }

  async saveBotConfig(config: InsertBotConfig): Promise<BotConfig> {
    let id: number;
    const existingConfig = await this.getBotConfig();
    
    if (existingConfig) {
      // Update existing config
      const stmt = sqlite.prepare(`
        UPDATE bot_config
        SET admin_id = ?, log_level = ?, health_check_interval = ?, detailed_logging = ?, last_started = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      stmt.run(
        config.adminId,
        config.logLevel || 'info',
        config.healthCheckInterval || 5,
        config.detailedLogging === undefined ? 1 : (config.detailedLogging ? 1 : 0),
        existingConfig.id
      );
      
      id = existingConfig.id;
    } else {
      // Create new config
      const stmt = sqlite.prepare(`
        INSERT INTO bot_config (admin_id, log_level, health_check_interval, detailed_logging)
        VALUES (?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        config.adminId,
        config.logLevel || 'info',
        config.healthCheckInterval || 5,
        config.detailedLogging === undefined ? 1 : (config.detailedLogging ? 1 : 0)
      );
      
      id = result.lastInsertRowid as number;
    }
    
    const now = new Date();
    
    return {
      id,
      adminId: config.adminId,
      logLevel: config.logLevel || 'info',
      healthCheckInterval: config.healthCheckInterval || 5,
      detailedLogging: config.detailedLogging === undefined ? true : config.detailedLogging,
      lastStarted: now
    };
  }

  // Log operations
  async getLogs(limit?: number): Promise<BotLog[]> {
    let query = 'SELECT * FROM bot_logs ORDER BY timestamp DESC';
    
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    
    const results = sqlite.prepare(query).all() as any[];
    
    return results.map(row => ({
      id: row.id,
      level: row.level,
      message: row.message,
      userId: row.user_id,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      timestamp: new Date(row.timestamp)
    }));
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
    const placeholders = allowedLevels.map(() => '?').join(',');
    
    let query = `SELECT * FROM bot_logs WHERE level IN (${placeholders}) ORDER BY timestamp DESC`;
    
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    
    const results = sqlite.prepare(query).all(...allowedLevels) as any[];
    
    return results.map(row => ({
      id: row.id,
      level: row.level,
      message: row.message,
      userId: row.user_id,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      timestamp: new Date(row.timestamp)
    }));
  }

  async addLog(log: InsertLog): Promise<BotLog> {
    const stmt = sqlite.prepare(`
      INSERT INTO bot_logs (level, message, user_id, metadata)
      VALUES (?, ?, ?, ?)
    `);
    
    const metadata = log.metadata ? JSON.stringify(log.metadata) : null;
    const now = new Date();
    
    const result = stmt.run(
      log.level,
      log.message,
      log.userId || null,
      metadata
    );
    
    const id = result.lastInsertRowid as number;
    
    return {
      id,
      level: log.level,
      message: log.message,
      userId: log.userId || null,
      metadata: log.metadata || null,
      timestamp: now
    };
  }

  async clearLogs(): Promise<void> {
    sqlite.prepare('DELETE FROM bot_logs').run();
  }
}