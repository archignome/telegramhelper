import { Context } from 'telegraf';
import { storage } from '../storage';
import logger from '../logger';

// Function to format price from cents to dollars with $ sign
export function formatPrice(priceInCents: number): string {
  return `$${(priceInCents / 100).toFixed(2)}`;
}

// Function to format duration from days to a human-readable format
export function formatDuration(days: number): string {
  if (days % 365 === 0) {
    const years = days / 365;
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  } else if (days % 30 === 0) {
    const months = days / 30;
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  } else if (days % 7 === 0) {
    const weeks = days / 7;
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  } else {
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  }
}

// Update or register a new bot user from context
export async function updateUserFromContext(ctx: Context): Promise<string> {
  try {
    if (!ctx.from) {
      throw new Error('No user in context');
    }

    const telegramId = ctx.from.id.toString();
    const existingUser = await storage.getBotUser(telegramId);

    if (existingUser) {
      // Update last activity
      await storage.updateBotUserActivity(telegramId);
      return telegramId;
    } else {
      // Create new user
      const newUser = await storage.createBotUser({
        telegramId,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
      });
      logger.info('New user registered', { 
        userId: telegramId, 
        username: ctx.from.username 
      });
      return telegramId;
    }
  } catch (error) {
    logger.error('Failed to update user from context', { 
      error: error instanceof Error ? error.message : String(error),
      userId: ctx.from?.id.toString()
    });
    return ctx.from?.id.toString() || 'unknown';
  }
}

// Check if the user is an admin
export async function isAdmin(ctx: Context): Promise<boolean> {
  try {
    if (!ctx.from) {
      return false;
    }

    const userId = ctx.from.id.toString();
    const config = await storage.getBotConfig();
    
    // If no config exists, we treat the first user as admin
    if (!config) {
      // Create initial admin config with this user
      await storage.saveBotConfig({
        adminId: userId,
        logLevel: 'info',
        healthCheckInterval: 5,
        detailedLogging: true
      });
      
      logger.info('First user set as admin', { userId });
      return true;
    }
    
    return config.adminId === userId;
  } catch (error) {
    logger.error('Failed to check admin status', { 
      error: error instanceof Error ? error.message : String(error),
      userId: ctx.from?.id.toString()
    });
    return false;
  }
}

// Extract user ID from command parameters
export function extractUserIdFromCommand(text?: string): string | null {
  if (!text) return null;
  
  // Extract parameters from the command (e.g., "/completeorder 123456789")
  const params = text.split(' ');
  if (params.length < 2) return null;
  
  // Return the first parameter as the user ID
  return params[1];
}

// Find a recent pending order for a user
export async function findPendingOrder(userId: string): Promise<number | null> {
  try {
    const userOrders = await storage.getUserOrders(userId);
    
    // Find the most recent pending order
    const pendingOrders = userOrders
      .filter(order => order.status === 'pending' || order.status === 'paid')
      .sort((a, b) => {
        // Handle both string and Date objects for createdAt
        const dateA = typeof a.createdAt === 'string' ? new Date(a.createdAt) : a.createdAt;
        const dateB = typeof b.createdAt === 'string' ? new Date(b.createdAt) : b.createdAt;
        return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
      });
    
    return pendingOrders.length > 0 ? pendingOrders[0].id : null;
  } catch (error) {
    logger.error('Failed to find pending order', { 
      error: error instanceof Error ? error.message : String(error),
      userId
    });
    return null;
  }
}

// Function to safely handle async operations with error handling
export async function safeExecute<T>(
  operation: () => Promise<T>,
  errorMessage: string,
  ctx?: Context
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    const userId = ctx?.from?.id.toString();
    logger.error(errorMessage, {
      error: error instanceof Error ? error.message : String(error),
      userId
    });
    
    if (ctx) {
      try {
        await ctx.reply('Sorry, an error occurred while processing your request. Please try again later.');
      } catch (replyError) {
        logger.error('Failed to send error message to user', {
          error: replyError instanceof Error ? replyError.message : String(replyError),
          userId
        });
      }
    }
    
    return null;
  }
}
