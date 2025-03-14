import cron from 'node-cron';
import { Telegraf } from 'telegraf';
import { MemoryUsage } from 'process';
import logger from './logger';

export interface HealthStatus {
  timestamp: string;
  uptime: number;
  botRunning: boolean;
  telegramApiConnected: boolean;
  memoryUsage: MemoryUsage;
  healthCheckInterval: number;
}

class HealthMonitor {
  private bot: Telegraf | null = null;
  private healthStatus: HealthStatus;
  private intervalId: NodeJS.Timeout | null = null;
  private healthCheckInterval: number = 5; // minutes

  constructor() {
    this.healthStatus = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      botRunning: false,
      telegramApiConnected: false,
      memoryUsage: process.memoryUsage(),
      healthCheckInterval: this.healthCheckInterval,
    };
  }

  // Set the bot reference
  setBot(bot: Telegraf | null) {
    this.bot = bot;
    this.updateHealthStatus();
    this.startPeriodicHealthCheck();
    logger.info('Health monitor initialized with bot reference');
  }

  // Set the health check interval
  setHealthCheckInterval(minutes: number) {
    this.healthCheckInterval = minutes;
    this.healthStatus.healthCheckInterval = minutes;
    this.startPeriodicHealthCheck(); // Restart with new interval
    logger.info(`Health check interval set to ${minutes} minutes`);
  }

  // Update health status data
  private updateHealthStatus() {
    this.healthStatus = {
      ...this.healthStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  }

  // Public method to start health checks
  async startHealthChecks(intervalMinutes = 5): Promise<number> {
    // Update the interval if needed
    if (this.healthCheckInterval !== intervalMinutes) {
      this.setHealthCheckInterval(intervalMinutes);
    } else {
      this.startPeriodicHealthCheck();
    }
    
    // Run an initial health check
    await this.runHealthCheck();
    
    return this.healthCheckInterval;
  }
  
  // Stop health checks
  stopHealthChecks() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Health checks stopped');
    }
  }

  // Start periodic health checks
  private startPeriodicHealthCheck() {
    // Clear existing interval if any
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Set new interval
    this.intervalId = setInterval(async () => {
      try {
        await this.runHealthCheck();
        logger.verbose('Periodic health check completed');
      } catch (error) {
        logger.error('Periodic health check failed', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }, this.healthCheckInterval * 60 * 1000);

    logger.info(`Periodic health checks started (every ${this.healthCheckInterval} minutes)`);
  }

  // Run a complete health check
  async runHealthCheck(): Promise<HealthStatus> {
    try {
      this.updateHealthStatus();

      // Check if bot is initialized
      this.healthStatus.botRunning = !!this.bot;

      // Test Telegram API connection
      if (this.bot) {
        try {
          // GetMe is a lightweight API call to verify connectivity
          await this.bot.telegram.getMe();
          this.healthStatus.telegramApiConnected = true;
          logger.info('Health check passed: Telegram API is connected');
        } catch (error) {
          this.healthStatus.telegramApiConnected = false;
          logger.error('Health check failed: Telegram API connection issue', { 
            error: error instanceof Error ? error.message : String(error)
          });

          // Try to restart the bot if Telegram API connection fails
          this.attemptBotRecovery(error);
        }
      } else {
        this.healthStatus.telegramApiConnected = false;
        logger.warn('Health check warning: Bot is not initialized');
      }

      // Log the health check result
      if (this.healthStatus.botRunning && this.healthStatus.telegramApiConnected) {
        logger.info('Health check passed: all systems operational', {
          memoryUsage: {
            rss: Math.round(this.healthStatus.memoryUsage.rss / 1024 / 1024),
            heapUsed: Math.round(this.healthStatus.memoryUsage.heapUsed / 1024 / 1024),
          },
          uptime: Math.round(this.healthStatus.uptime / 60),
        });
      }

      return this.healthStatus;
    } catch (error) {
      logger.error('Health check failed with an unexpected error', { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  // Attempt to recover from a bot failure
  private async attemptBotRecovery(error: unknown) {
    logger.warn('Attempting to recover from bot failure', {
      error: error instanceof Error ? error.message : String(error)
    });

    // We're not actually restarting the bot here - that would require refactoring
    // the bot initialization logic. In a real implementation, this would
    // attempt to re-establish the connection gracefully.

    // For now, we just log the recovery attempt
    logger.info('Bot recovery attempted');
  }
}

// Export a singleton instance
export const healthMonitor = new HealthMonitor();