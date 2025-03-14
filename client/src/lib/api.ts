// API endpoints for the application
export const API_ENDPOINTS = {
  HEALTH: '/api/health',
  BOT_STATUS: '/api/bot/status',
  BOT_START: '/api/bot/start',
  BOT_STOP: '/api/bot/stop',
  PLANS: '/api/plans',
  CONFIG: '/api/config',
  LOGS: '/api/logs',
};

// Health Status API
export async function getHealthStatus() {
  const response = await fetch(API_ENDPOINTS.HEALTH);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch health status: ${response.statusText}`);
  }
  
  return await response.json();
}

// Bot Status API
export async function getBotStatus() {
  const response = await fetch(API_ENDPOINTS.BOT_STATUS);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch bot status: ${response.statusText}`);
  }
  
  return await response.json();
}

export async function startBot() {
  const response = await fetch(API_ENDPOINTS.BOT_START, {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to start bot: ${response.statusText}`);
  }
  
  return await response.json();
}

export async function stopBot() {
  const response = await fetch(API_ENDPOINTS.BOT_STOP, {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to stop bot: ${response.statusText}`);
  }
  
  return await response.json();
}

// Plans API
export async function getPlans() {
  const response = await fetch(API_ENDPOINTS.PLANS);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch plans: ${response.statusText}`);
  }
  
  return await response.json();
}

// Config API
export async function getBotConfig() {
  const response = await fetch(API_ENDPOINTS.CONFIG);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch bot config: ${response.statusText}`);
  }
  
  return await response.json();
}

export async function updateBotConfig(config: Record<string, any>) {
  const response = await fetch(API_ENDPOINTS.CONFIG, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update bot config: ${response.statusText}`);
  }
  
  return await response.json();
}

// Logs API
export async function getLogs(level?: string, limit?: number) {
  let url = API_ENDPOINTS.LOGS;
  
  if (level || limit) {
    const params = new URLSearchParams();
    
    if (level) {
      params.append('level', level);
    }
    
    if (limit) {
      params.append('limit', limit.toString());
    }
    
    url += `?${params.toString()}`;
  }
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch logs: ${response.statusText}`);
  }
  
  return await response.json();
}

export async function clearLogs() {
  const response = await fetch(API_ENDPOINTS.LOGS, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to clear logs: ${response.statusText}`);
  }
  
  return await response.json();
}
