import { Telegraf, Context } from 'telegraf';
import { startHandler, helpHandler, plansHandler, planSelectionHandler, paidHandler, completeOrderHandler, fallbackHandler, paymentScreenshotHandler } from './handlers';
import { loggerMiddleware, userActivityMiddleware, errorHandlerMiddleware, rateLimitMiddleware } from './middleware';
import logger from '../logger';

export function setupCommands(bot: Telegraf<Context>) {
  try {
    // Register global middleware (order matters)
    bot.use(errorHandlerMiddleware);
    bot.use(rateLimitMiddleware);
    bot.use(loggerMiddleware);
    bot.use(userActivityMiddleware);
    
    // Register command handlers
    bot.command('start', startHandler);
    bot.command('help', helpHandler);
    bot.command('plans', plansHandler);
    bot.command('completeorder', completeOrderHandler);
    
    // Register callback query handlers for inline keyboards
    bot.action(/^select_plan:\d+$/, planSelectionHandler);
    
    // Register photo handler for payment screenshots
    bot.on('photo', paymentScreenshotHandler);
    
    // Register fallback handler for unrecognized messages
    bot.on('message', fallbackHandler);
    
    // Set up commands list for Telegram menu
    bot.telegram.setMyCommands([
      { command: 'start', description: 'Start the bot and get a welcome message' },
      { command: 'plans', description: 'View available VPN subscription plans' },
      { command: 'help', description: 'Show help information' },
    ]).catch(error => {
      logger.error('Failed to set bot commands', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    });
    
    logger.info('Bot commands setup completed');
  } catch (error) {
    logger.error('Error setting up bot commands', { 
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}
