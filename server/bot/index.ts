import { Telegraf } from 'telegraf';
import { setupCommands } from './commands';
import { storage } from '../storage';
import logger, { updateLoggerConfig } from '../logger';
import { healthMonitor } from '../health';

let bot: Telegraf | null = null;

// Initialize the bot
export async function initBot() {
  try {
    // Get bot token from environment
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN not found in environment variables');
    }
    
    // Get or create bot config
    let config = await storage.getBotConfig();
    const adminId = process.env.ADMIN_TELEGRAM_ID || '';
    
    if (!config) {
      config = await storage.saveBotConfig({
        adminId,
        logLevel: process.env.LOG_LEVEL || 'info',
        healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '5'),
        detailedLogging: process.env.DETAILED_LOGGING !== 'false',
      });
      logger.info('Created initial bot configuration');
    } else if (!config.adminId && adminId) {
      // Update admin ID if it's not set but is available in env
      config = await storage.saveBotConfig({
        ...config,
        adminId,
      });
      logger.info('Updated admin ID from environment variable');
    }
    
    // Update logger configuration
    await updateLoggerConfig(config.logLevel, config.detailedLogging);
    
    // Create new Telegraf instance
    bot = new Telegraf(token);
    
    // Setup bot commands and handlers
    setupCommands(bot);
    
    // Register the bot with the health monitor
    healthMonitor.setBot(bot);
    
    // Start health checks
    const healthCheckInterval = await healthMonitor.startHealthChecks(config.healthCheckInterval);
    logger.info(`Health checks started with ${healthCheckInterval} minute interval`);
    
    // Launch the bot in webhook or long polling mode
    if (process.env.NODE_ENV === 'production' && process.env.WEBHOOK_URL) {
      // Production: use webhooks (not implemented for this example)
      logger.info('Bot starting in webhook mode');
      
      // This would be implemented in a production environment with a proper domain
      // bot.telegram.setWebhook(process.env.WEBHOOK_URL);
      
      // For now, just use long polling in all environments
      await bot.launch();
    } else {
      // Development or no webhook URL: use long polling
      logger.info('Bot starting in long polling mode');
      await bot.launch();
    }
    
    logger.info('Bot successfully started');
    
    // Setup graceful stop
    setupGracefulStop();
    
    return bot;
  } catch (error) {
    logger.error('Failed to initialize bot', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

// Stop the bot
export async function stopBot() {
  try {
    if (bot) {
      // Stop health checks
      healthMonitor.stopHealthChecks();
      
      // Stop the bot
      await bot.stop();
      bot = null;
      logger.info('Bot stopped gracefully');
    }
  } catch (error) {
    logger.error('Error stopping bot', { 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
}

// Setup graceful stop handlers
function setupGracefulStop() {
  // Handle graceful shutdown
  process.once('SIGINT', () => {
    logger.info('SIGINT signal received');
    stopBot().catch(error => {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    });
  });
  
  process.once('SIGTERM', () => {
    logger.info('SIGTERM signal received');
    stopBot().catch(error => {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    });
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { 
      error: error.message, 
      stack: error.stack 
    });
    
    // Don't exit immediately, give the logger time to write
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { 
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined
    });
  });
}

// Get the current bot instance
export function getBot() {
  return bot;
}
