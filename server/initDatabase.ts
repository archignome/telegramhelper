import { storage } from './storage';
import logger from './logger';

/**
 * Initialize database with admin config and VPN plans
 */
export async function initDatabase() {
  try {
    logger.info('Initializing database...');
    
    // Check if admin config exists
    const existingConfig = await storage.getBotConfig();
    const adminId = process.env.ADMIN_TELEGRAM_ID || '5789540789'; // Use env var or default
    
    // Set the admin ID if not already set
    if (!existingConfig) {
      const config = await storage.saveBotConfig({
        adminId,
        logLevel: 'info',
        healthCheckInterval: 5,
        detailedLogging: true
      });
      
      logger.info('Admin config created', { adminId });
    } else if (!existingConfig.adminId) {
      // Update admin ID if it's empty
      // Create a new config with the admin ID
      const config = await storage.saveBotConfig({
        adminId,
        logLevel: existingConfig.logLevel,
        healthCheckInterval: existingConfig.healthCheckInterval,
        detailedLogging: existingConfig.detailedLogging
      });
      
      logger.info('Admin config updated with admin ID', { adminId });
    } else {
      logger.info('Admin config already exists', { adminId: existingConfig.adminId });
    }
    
    // Check if VPN plans exist
    const existingPlans = await storage.getAllPlans();
    
    if (existingPlans.length === 0) {
      // Create sample VPN plans
      const plans = [
        {
          name: 'Basic Monthly',
          description: 'Standard VPN service for 1 month',
          duration: 30, // days
          price: 4200, // $42.00
          traffic: 100, // GB
          devices: 2,
          planType: 'basic',
          isActive: true
        },
        {
          name: 'Premium Monthly',
          description: 'Enhanced VPN service for 1 month',
          duration: 30, // days
          price: 6000, // $60.00
          traffic: 500, // GB
          devices: 5,
          planType: 'premium',
          isActive: true
        },
        {
          name: 'Basic Quarterly',
          description: 'Standard VPN service for 3 months',
          duration: 90, // days
          price: 10500, // $105.00
          traffic: 100, // GB
          devices: 2,
          planType: 'basic',
          isActive: true
        },
        {
          name: 'Premium Quarterly',
          description: 'Enhanced VPN service for 3 months',
          duration: 90, // days
          price: 15000, // $150.00
          traffic: 500, // GB
          devices: 5,
          planType: 'premium',
          isActive: true
        },
        {
          name: 'Basic Annual',
          description: 'Standard VPN service for 1 year',
          duration: 365, // days
          price: 30000, // $300.00
          traffic: 100, // GB
          devices: 2,
          planType: 'basic',
          isActive: true
        },
        {
          name: 'Premium Annual',
          description: 'Enhanced VPN service for 1 year',
          duration: 365, // days
          price: 48000, // $480.00
          traffic: 500, // GB
          devices: 5,
          planType: 'premium',
          isActive: true
        }
      ];
      
      // Create each plan
      for (const plan of plans) {
        await storage.createPlan(plan);
      }
      
      logger.info('VPN plans created', { count: plans.length });
    } else {
      logger.info('VPN plans already exist', { count: existingPlans.length });
    }
    
    logger.info('Database initialization completed');
  } catch (error) {
    logger.error('Failed to initialize database', { 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
}