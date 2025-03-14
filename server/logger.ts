import { storage } from './storage';
import winston from 'winston';
import { format } from 'date-fns';

// Define log levels
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  verbose: 4,
};

// Format for console logs
const consoleFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  const formattedTimestamp = format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss');
  let metaString = '';
  
  if (Object.keys(meta).length > 0) {
    try {
      metaString = ` ${JSON.stringify(meta)}`;
    } catch (error) {
      metaString = ' [Meta serialization failed]';
    }
  }
  
  return `[${formattedTimestamp}] [${level.toUpperCase()}] ${message}${metaString}`;
});

// Create the Winston logger
export const createLogger = (configuredLevel = 'info', detailedLogging = true) => {
  const logger = winston.createLogger({
    level: configuredLevel,
    levels: LOG_LEVELS,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          consoleFormat
        ),
      }),
    ],
  });

  // Add database logging transport using proper winston transport
  class DatabaseTransport extends winston.Transport {
    constructor(opts?: any) {
      super(opts);
    }

    log(info: winston.LogEntry, callback: () => void) {
      setImmediate(() => {
        this.emit('logged', info);
      });

      const { level, message, userId, ...rest } = info;
      
      // Don't save verbose logs to database to save space
      if (level === 'verbose' && !detailedLogging) {
        callback();
        return;
      }
      
      let metadata = '';
      if (Object.keys(rest).length > 0 && detailedLogging) {
        try {
          // Filter out timestamp and message
          const { timestamp, ...metaRest } = rest;
          metadata = JSON.stringify(metaRest);
        } catch (error) {
          metadata = '[Serialization failed]';
        }
      }
      
      storage.addLog({
        level: level as any,
        message: String(message),
        userId: userId ? String(userId) : undefined,
        metadata: metadata || undefined,
      }).catch(err => {
        // Log to console if database logging fails
        console.error('Failed to save log to database:', err);
      });
      
      callback();
    }
  }
  
  logger.add(new DatabaseTransport());
  
  return logger;
};

// Default logger instance
let logger = createLogger();

// Function to update logger configuration
export const updateLoggerConfig = async (level = 'info', detailedLogging = true) => {
  logger = createLogger(level, detailedLogging);
  await logger.info('Logger configuration updated', { 
    level, 
    detailedLogging 
  });
  return logger;
};

// Get the current logger
export const getLogger = () => logger;

// Export a simplified interface for consistent logging
export default {
  error: (message: string, meta: Record<string, any> = {}) => {
    logger.error(message, meta);
  },
  warn: (message: string, meta: Record<string, any> = {}) => {
    logger.warn(message, meta);
  },
  info: (message: string, meta: Record<string, any> = {}) => {
    logger.info(message, meta);
  },
  debug: (message: string, meta: Record<string, any> = {}) => {
    logger.debug(message, meta);
  },
  verbose: (message: string, meta: Record<string, any> = {}) => {
    logger.verbose(message, meta);
  },
};
