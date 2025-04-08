/**
 * WebSocket Service
 * 
 * Provides real-time communication between server and clients
 * Used for notifications, trade updates, and real-time data
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { storage } from '../storage';
import { log } from '../vite';

// Client sessions map
const clients = new Map<number, WebSocket>();

// Initialize WebSocket server
export function initializeWebSocketServer(httpServer: HttpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  log('WebSocket server initialized', 'websocket');
  
  wss.on('connection', async (ws: WebSocket) => {
    log('WebSocket client connected', 'websocket');
    
    let userId: number | null = null;
    
    // Handle client authentication
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'authenticate') {
          // Authenticate the user
          userId = parseInt(data.userId, 10);
          const user = await storage.getUser(userId);
          
          if (!user) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Authentication failed'
            }));
            return;
          }
          
          // Add client to the sessions
          clients.set(userId, ws);
          
          log(`Client authenticated as user ${userId}`, 'websocket');
          
          // Send initial data
          ws.send(JSON.stringify({
            type: 'authenticated',
            userId
          }));
          
          // Send any pending notifications
          const alerts = await storage.getAlertNotifications(userId);
          
          if (alerts && alerts.length > 0) {
            ws.send(JSON.stringify({
              type: 'alerts',
              alerts
            }));
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle client disconnect
    ws.on('close', () => {
      log('WebSocket client disconnected', 'websocket');
      
      if (userId) {
        clients.delete(userId);
      }
    });
  });
  
  return wss;
}

/**
 * Send a message to a specific user
 */
export function sendToUser(userId: number, data: any) {
  const client = clients.get(userId);
  
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(data));
    return true;
  }
  
  return false;
}

/**
 * Send a trade update to a user
 */
export function sendTradeUpdate(userId: number, tradeData: any) {
  return sendToUser(userId, {
    type: 'trade_update',
    tradeData
  });
}

/**
 * Send an alert notification to a user
 */
export function sendAlertNotification(userId: number, alertData: any) {
  return sendToUser(userId, {
    type: 'alert',
    alertData
  });
}

/**
 * Send a market data update to a user
 */
export function sendMarketUpdate(userId: number, marketData: any) {
  return sendToUser(userId, {
    type: 'market_update',
    marketData
  });
}

/**
 * Send auto-trade execution result to a user
 */
export function sendAutoTradeUpdate(userId: number, tradeData: any) {
  return sendToUser(userId, {
    type: 'auto_trade',
    tradeData
  });
}

/**
 * Broadcast a message to all connected clients
 */
export function broadcast(data: any) {
  let count = 0;
  
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
      count++;
    }
  });
  
  return count;
}