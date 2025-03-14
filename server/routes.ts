import express, { Router, type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { healthMonitor } from "./health";
import { initBot, stopBot, getBot } from "./bot";
import logger from "./logger";

// Create API router
function createApiRouter(): Router {
  const router = Router();
  
  // Health endpoint
  router.get("/health", async (req, res) => {
    try {
      const healthStatus = await healthMonitor.runHealthCheck();
      res.json({
        status: "success",
        data: healthStatus,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
  
  // Get bot status
  router.get("/bot/status", (req, res) => {
    const bot = getBot();
    res.json({
      status: "success",
      data: {
        isRunning: !!bot,
      },
    });
  });
  
  // Start bot
  router.post("/bot/start", async (req, res) => {
    try {
      const bot = getBot();
      if (bot) {
        return res.json({
          status: "success",
          message: "Bot is already running",
        });
      }
      
      await initBot();
      res.json({
        status: "success",
        message: "Bot started successfully",
      });
    } catch (error) {
      logger.error("Failed to start bot from API", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
  
  // Stop bot
  router.post("/bot/stop", async (req, res) => {
    try {
      await stopBot();
      res.json({
        status: "success",
        message: "Bot stopped successfully",
      });
    } catch (error) {
      logger.error("Failed to stop bot from API", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
  
  // Get all VPN plans
  router.get("/plans", async (req, res) => {
    try {
      const plans = await storage.getAllPlans();
      res.json({
        status: "success",
        data: plans,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
  
  // Get bot configuration
  router.get("/config", async (req, res) => {
    try {
      const config = await storage.getBotConfig();
      res.json({
        status: "success",
        data: config,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
  
  // Update bot configuration
  router.put("/config", async (req, res) => {
    try {
      const { adminId, logLevel, healthCheckInterval, detailedLogging } = req.body;
      
      const config = await storage.saveBotConfig({
        adminId,
        logLevel,
        healthCheckInterval,
        detailedLogging,
      });
      
      res.json({
        status: "success",
        data: config,
        message: "Configuration updated successfully",
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
  
  // Get bot logs
  router.get("/logs", async (req, res) => {
    try {
      const level = req.query.level as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      
      let logs;
      if (level) {
        logs = await storage.getLogsByLevel(level, limit);
      } else {
        logs = await storage.getLogs(limit);
      }
      
      res.json({
        status: "success",
        data: logs,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
  
  // Clear logs
  router.delete("/logs", async (req, res) => {
    try {
      await storage.clearLogs();
      res.json({
        status: "success",
        message: "Logs cleared successfully",
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
  
  return router;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Register API routes under /api prefix
  app.use("/api", createApiRouter());
  
  // Initialize the bot when the server starts
  try {
    await initBot();
  } catch (error) {
    logger.error("Failed to initialize bot during server startup", {
      error: error instanceof Error ? error.message : String(error),
    });
    // Continue server startup even if bot fails to initialize
  }
  
  const httpServer = createServer(app);
  
  return httpServer;
}
