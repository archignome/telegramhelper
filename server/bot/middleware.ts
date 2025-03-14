import { Context, Middleware } from 'telegraf';
import logger from '../logger';
import { updateUserFromContext } from './utils';

// Middleware to log all updates
export const loggerMiddleware: Middleware<Context> = async (ctx, next) => {
  const startTime = new Date();
  const userId = ctx.from?.id.toString();
  const username = ctx.from?.username;
  
  // Get the update type
  let updateType = 'unknown';
  if (ctx.updateType) {
    updateType = ctx.updateType;
  }
  
  // Get the command if it exists
  let command = '';
  if (ctx.message && 'text' in ctx.message && ctx.message.text.startsWith('/')) {
    command = ctx.message.text.split(' ')[0];
  }
  
  try {
    logger.verbose(`Received ${updateType}${command ? ` (${command})` : ''}`, { 
      userId, 
      username, 
      updateType, 
      command
    });
    
    // Continue to the next middleware or handler
    await next();
    
    // Calculate processing time
    const processingTime = new Date().getTime() - startTime.getTime();
    
    logger.verbose(`Processed ${updateType}${command ? ` (${command})` : ''} in ${processingTime}ms`, { 
      userId, 
      username, 
      processingTime
    });
  } catch (error) {
    // Calculate processing time
    const processingTime = new Date().getTime() - startTime.getTime();
    
    logger.error(`Error processing ${updateType}${command ? ` (${command})` : ''} in ${processingTime}ms`, { 
      userId, 
      username, 
      error: error instanceof Error ? error.message : String(error), 
      processingTime
    });
    
    // Always re-throw to allow other error handlers to catch it
    throw error;
  }
};

// Middleware to update user activity
export const userActivityMiddleware: Middleware<Context> = async (ctx, next) => {
  try {
    if (ctx.from) {
      await updateUserFromContext(ctx);
    }
  } catch (error) {
    logger.warn('Failed to update user activity', { 
      error: error instanceof Error ? error.message : String(error),
      userId: ctx.from?.id.toString()
    });
    // Continue even if this fails
  }
  
  await next();
};

// Global error handling middleware
export const errorHandlerMiddleware: Middleware<Context> = async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    const userId = ctx.from?.id.toString();
    
    logger.error('Unhandled error in bot request', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      updateType: ctx.updateType,
    });
    
    try {
      // Send a user-friendly error message
      await ctx.reply('Sorry, something went wrong while processing your request. Please try again later.');
    } catch (replyError) {
      logger.error('Failed to send error message to user', { 
        error: replyError instanceof Error ? replyError.message : String(replyError),
        userId
      });
    }
  }
};

// Rate limiting middleware (simple implementation)
const userRequestCounts = new Map<string, { count: number; timestamp: number }>();

export const rateLimitMiddleware: Middleware<Context> = async (ctx, next) => {
  if (!ctx.from) {
    await next();
    return;
  }
  
  const userId = ctx.from.id.toString();
  const now = Date.now();
  const windowMs = 60000; // 1 minute window
  const maxRequestsPerWindow = 30; // Max 30 requests per minute per user
  
  const userRequests = userRequestCounts.get(userId) || { count: 0, timestamp: now };
  
  // Reset count if the window has passed
  if (now - userRequests.timestamp > windowMs) {
    userRequests.count = 0;
    userRequests.timestamp = now;
  }
  
  // Increment the request count
  userRequests.count += 1;
  userRequestCounts.set(userId, userRequests);
  
  // Check if the user has exceeded the rate limit
  if (userRequests.count > maxRequestsPerWindow) {
    logger.warn('Rate limit exceeded', { userId });
    await ctx.reply('You are sending too many requests. Please slow down and try again later.');
    return;
  }
  
  await next();
};
