import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Enums
export const vpnPlanEnum = z.enum(['basic', 'premium', 'ultimate']);
export const orderStatusEnum = z.enum(['pending', 'paid', 'completed', 'cancelled']);
export const logLevelEnum = z.enum(['error', 'warn', 'info', 'debug', 'verbose']);

// Users table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true,
  createdAt: true 
});

// Bot users table
export const botUsers = sqliteTable('bot_users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  telegramId: text('telegram_id').notNull().unique(),
  username: text('username'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  joinedAt: text('joined_at').default(sql`CURRENT_TIMESTAMP`),
  lastActivity: text('last_activity').default(sql`CURRENT_TIMESTAMP`)
});

export const insertBotUserSchema = createInsertSchema(botUsers).omit({ 
  id: true,
  joinedAt: true,
  lastActivity: true 
});

// VPN plans table
export const vpnPlans = sqliteTable('vpn_plans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  planId: text('plan_id'),
  name: text('name').notNull(),
  description: text('description'),
  duration: integer('duration').notNull(),
  price: integer('price').notNull(),
  traffic: integer('traffic'), // Traffic in GB
  devices: integer('devices'), // Number of devices
  planType: text('plan_type').notNull().default('basic'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

export const insertVpnPlanSchema = createInsertSchema(vpnPlans).omit({ 
  id: true,
  createdAt: true 
});

// Orders table
export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => botUsers.telegramId),
  planId: integer('plan_id').notNull().references(() => vpnPlans.id),
  status: text('status').notNull().default('pending'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

export const insertOrderSchema = createInsertSchema(orders).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true 
});

// Bot config table
export const botConfig = sqliteTable('bot_config', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  adminId: text('admin_id').notNull(),
  logLevel: text('log_level').notNull().default('info'),
  healthCheckInterval: integer('health_check_interval').notNull().default(5),
  detailedLogging: integer('detailed_logging', { mode: 'boolean' }).notNull().default(true),
  lastStarted: text('last_started').default(sql`CURRENT_TIMESTAMP`)
});

export const insertBotConfigSchema = createInsertSchema(botConfig).omit({ 
  id: true,
  lastStarted: true 
});

// Bot logs table
export const botLogs = sqliteTable('bot_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  level: text('level').notNull(),
  message: text('message').notNull(),
  userId: text('user_id').references(() => botUsers.telegramId),
  metadata: text('metadata'), // JSON as text in SQLite
  timestamp: text('timestamp').default(sql`CURRENT_TIMESTAMP`)
});

export const insertLogSchema = createInsertSchema(botLogs).omit({ 
  id: true,
  timestamp: true 
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type BotUser = typeof botUsers.$inferSelect;
export type InsertBotUser = z.infer<typeof insertBotUserSchema>;

export type VpnPlan = typeof vpnPlans.$inferSelect;
export type InsertVpnPlan = z.infer<typeof insertVpnPlanSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type BotConfig = typeof botConfig.$inferSelect;
export type InsertBotConfig = z.infer<typeof insertBotConfigSchema>;

export type BotLog = typeof botLogs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;