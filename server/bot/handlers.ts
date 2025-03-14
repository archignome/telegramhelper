import { Context, Markup } from 'telegraf';
import { storage } from '../storage';
import logger from '../logger';
import { formatPrice, formatDuration, isAdmin, extractUserIdFromCommand, findPendingOrder, safeExecute } from './utils';

// Handler for start command
export async function startHandler(ctx: Context) {
  await safeExecute(
    async () => {
      const userId = ctx.from?.id.toString();
      if (!userId) throw new Error('No user ID in context');
      
      logger.info('User started the bot', { userId });
      
      const message = `
Welcome to our VPN Sales Bot! 🚀

We offer secure, high-speed VPN services that protect your privacy and enhance your internet experience.

📋 Type /plans to see our available VPN plans
🔒 All plans include:
  • Secure encryption
  • No-logs policy
  • Global server network
  • 24/7 customer support

How to purchase:
1. Select a plan using /plans
2. Make a payment following the instructions
3. Send a screenshot of your payment to this bot
4. Wait for verification and receive your VPN account

Type /help for more information.
      `;
      
      return await ctx.reply(message, { parse_mode: 'Markdown' });
    },
    'Error handling start command',
    ctx
  );
}

// Handler for help command
export async function helpHandler(ctx: Context) {
  await safeExecute(
    async () => {
      const userId = ctx.from?.id.toString();
      if (!userId) throw new Error('No user ID in context');
      
      logger.info('User requested help', { userId });
      
      const message = `
Available commands:

/start - Start the bot and get a welcome message
/plans - View available VPN subscription plans
/help - Show this help message

How to Purchase a VPN Plan:
1. Use /plans to select a VPN plan
2. Follow payment instructions 
3. Send a screenshot of your payment receipt to this bot
4. Wait for admin verification (usually within 24 hours)
5. Receive your VPN account details directly from our admin

For assistance, please contact our support team.
      `;
      
      return await ctx.reply(message);
    },
    'Error handling help command',
    ctx
  );
}

// Handler for plans command
export async function plansHandler(ctx: Context) {
  await safeExecute(
    async () => {
      const userId = ctx.from?.id.toString();
      if (!userId) throw new Error('No user ID in context');
      
      logger.info('User requested plans', { userId });
      
      const plans = await storage.getActivePlans();
      
      if (plans.length === 0) {
        return await ctx.reply('No VPN plans are currently available. Please check back later.');
      }
      
      let message = 'Choose a VPN Plan:\n\n';
      
      // Create inline keyboard with available plans
      const buttons = plans.map(plan => [
        Markup.button.callback(
          `${plan.name} - ${formatPrice(plan.price)} / ${formatDuration(plan.duration)}`,
          `select_plan:${plan.id}`
        )
      ]);
      
      return await ctx.reply(
        message, 
        Markup.inlineKeyboard(buttons)
      );
    },
    'Error handling plans command',
    ctx
  );
}

// Handler for plan selection
export async function planSelectionHandler(ctx: Context) {
  await safeExecute(
    async () => {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        throw new Error('Invalid callback query');
      }
      
      const userId = ctx.from?.id.toString();
      if (!userId) throw new Error('No user ID in context');
      
      const data = ctx.callbackQuery.data;
      const planId = parseInt(data.split(':')[1]);
      
      // Get the selected plan
      const selectedPlan = await storage.getPlan(planId);
      
      if (!selectedPlan) {
        await ctx.answerCbQuery('This plan is no longer available.');
        return await ctx.reply('Sorry, the selected plan is not available. Please choose another plan from /plans.');
      }
      
      logger.info('User selected a plan', { 
        userId, 
        planId, 
        planName: selectedPlan.name 
      });
      
      // Create an order record
      const order = await storage.createOrder({
        userId,
        planId: selectedPlan.id,
        status: 'pending'
      });
      
      // Answer the callback query to remove "loading" state
      await ctx.answerCbQuery(`You selected: ${selectedPlan.name}`);
      
      // Send confirmation message
      const message = `
You have selected: ${selectedPlan.name}

💰 Price: ${formatPrice(selectedPlan.price)}
⏱ Duration: ${formatDuration(selectedPlan.duration)}
📝 Details: ${selectedPlan.description}

To proceed with your purchase, please complete the payment using the following instructions:

1. Send payment to: 
   Bank Account: 1234-5678-9012-3456
   Name: VPN Service Ltd.
   
2. Take a screenshot of your payment confirmation
   
3. Send the screenshot directly to this bot

4. Wait for admin verification (usually within 24 hours)

5. You will receive your VPN account details directly from the admin
      `;
      
      return await ctx.reply(message);
    },
    'Error handling plan selection',
    ctx
  );
}

// Handler for paid command
export async function paidHandler(ctx: Context) {
  await safeExecute(
    async () => {
      const userId = ctx.from?.id.toString();
      if (!userId) throw new Error('No user ID in context');
      
      // Find the most recent pending order
      const orderId = await findPendingOrder(userId);
      
      if (!orderId) {
        return await ctx.reply('No pending orders found. Please select a plan first using the /plans command.');
      }
      
      // Update the order status
      const updatedOrder = await storage.updateOrderStatus(orderId, 'paid');
      
      if (!updatedOrder) {
        throw new Error(`Failed to update order status for order ${orderId}`);
      }
      
      logger.info('User marked order as paid', { 
        userId, 
        orderId 
      });
      
      // Get the plan details
      const plan = await storage.getPlan(updatedOrder.planId);
      
      if (!plan) {
        throw new Error(`Plan not found for order ${orderId}`);
      }
      
      // Send confirmation message
      const message = `
Thank you for your payment! 🎉

We have received your payment for the ${plan.name}.
Your order is now being processed.

An admin will complete your order shortly and you'll receive your VPN credentials.
      `;
      
      return await ctx.reply(message);
    },
    'Error handling paid command',
    ctx
  );
}

// Handler for admin complete order command
export async function completeOrderHandler(ctx: Context) {
  await safeExecute(
    async () => {
      const adminId = ctx.from?.id.toString();
      if (!adminId) throw new Error('No user ID in context');
      
      // Check if the user is an admin
      const isUserAdmin = await isAdmin(ctx);
      
      if (!isUserAdmin) {
        logger.warn('Non-admin user attempted to use admin command', { 
          userId: adminId 
        });
        return await ctx.reply('This command is only available to administrators.');
      }
      
      // Extract user ID from command
      const messageText = ctx.message && 'text' in ctx.message ? ctx.message.text : undefined;
      const targetUserId = extractUserIdFromCommand(messageText);
      
      if (!targetUserId) {
        return await ctx.reply('Usage: /completeorder USER_ID');
      }
      
      // Find the user's most recent paid order
      const userOrders = await storage.getUserOrders(targetUserId);
      const paidOrders = userOrders
        .filter(order => order.status === 'paid')
        .sort((a, b) => {
          // Handle both string and Date objects for createdAt
          const dateA = typeof a.createdAt === 'string' ? new Date(a.createdAt) : a.createdAt;
          const dateB = typeof b.createdAt === 'string' ? new Date(b.createdAt) : b.createdAt;
          return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
        });
      
      if (paidOrders.length === 0) {
        return await ctx.reply(`No paid orders found for user ${targetUserId}.`);
      }
      
      const orderToComplete = paidOrders[0];
      
      // Update the order status
      const updatedOrder = await storage.updateOrderStatus(orderToComplete.id, 'completed');
      
      if (!updatedOrder) {
        throw new Error(`Failed to update order status for order ${orderToComplete.id}`);
      }
      
      logger.info('Admin completed an order', { 
        adminId, 
        userId: targetUserId, 
        orderId: orderToComplete.id 
      });
      
      // Get the plan details
      const plan = await storage.getPlan(updatedOrder.planId);
      
      // Send confirmation message to admin
      const message = `
Order completed for user ${targetUserId}!

Plan: ${plan?.name || 'Unknown plan'}
Order ID: ${orderToComplete.id}
      `;
      
      try {
        // Notify the user that their order has been completed
        await ctx.telegram.sendMessage(
          targetUserId,
          `Your order for ${plan?.name || 'VPN service'} has been completed! Here are your credentials: (simulation - credentials would be here in a real bot)`
        );
      } catch (error) {
        logger.error('Failed to notify user about completed order', { 
          error: error instanceof Error ? error.message : String(error),
          userId: targetUserId
        });
      }
      
      return await ctx.reply(message);
    },
    'Error handling complete order command',
    ctx
  );
}

// Handler for payment screenshots
export async function paymentScreenshotHandler(ctx: Context) {
  await safeExecute(
    async () => {
      const userId = ctx.from?.id.toString();
      if (!userId) throw new Error('No user ID in context');
      
      if (!ctx.message || !('photo' in ctx.message) || !ctx.message.photo) {
        return;
      }
      
      // Find pending order for this user
      const orderId = await findPendingOrder(userId);
      if (!orderId) {
        return await ctx.reply('No pending orders found. Please select a VPN plan first with /plans command before sending payment proof.');
      }
      
      // Get order and plan details
      const order = await storage.getOrder(orderId);
      const plan = order ? await storage.getPlan(order.planId) : null;
      
      // Get admin ID from config
      const botConfig = await storage.getBotConfig();
      const adminId = botConfig?.adminId;
      
      if (!adminId) {
        logger.error('No admin ID configured in bot_config', { userId });
        return await ctx.reply('Error: Admin not configured. Please contact support.');
      }
      
      // Get the largest photo (best quality)
      const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      
      // Update order status to 'paid'
      await storage.updateOrderStatus(orderId, 'paid');
      
      logger.info('User sent payment screenshot', { userId, orderId });
      
      // Forward the photo to admin with order details
      try {
        // Send the photo to admin
        await ctx.telegram.sendPhoto(adminId, photoId, {
          caption: `
📢 PAYMENT SCREENSHOT RECEIVED

👤 User ID: ${userId}
🛒 Order ID: ${orderId}
💼 Plan: ${plan?.name || 'Unknown Plan'}
💰 Amount: ${plan ? formatPrice(plan.price) : 'Unknown'}

✅ To complete this order, use:
/completeorder ${userId}
          `
        });
        
        // Confirm to the user
        return await ctx.reply(`
Thank you for your payment screenshot! 📸

Your order is now being processed and will be reviewed by an administrator.
You will receive your VPN account information directly after verification.

Order details:
• Plan: ${plan?.name || 'VPN Service'}
• Amount: ${plan ? formatPrice(plan.price) : ''}
• Status: Payment verification in progress
        `);
      } catch (error) {
        logger.error('Failed to forward payment screenshot to admin', {
          error: error instanceof Error ? error.message : String(error),
          userId,
          adminId
        });
        return await ctx.reply('Error: Could not process your payment proof. Please contact support or try again later.');
      }
    },
    'Error handling payment screenshot',
    ctx
  );
}

// Fallback handler for unrecognized messages
export async function fallbackHandler(ctx: Context) {
  // First check if this is a photo message, to handle payment screenshots
  if (ctx.message && 'photo' in ctx.message && ctx.message.photo) {
    return paymentScreenshotHandler(ctx);
  }
  
  // Handle text messages
  if (ctx.message && 'text' in ctx.message) {
    await safeExecute(
      async () => {
        const userId = ctx.from?.id.toString();
        if (!userId) throw new Error('No user ID in context');
        
        logger.debug('Received unrecognized message', { 
          userId, 
          message: ctx.message 
        });
        
        return await ctx.reply(
          "I didn't understand that command. Type /help to see all available commands."
        );
      },
      'Error handling fallback message',
      ctx
    );
  }
}
