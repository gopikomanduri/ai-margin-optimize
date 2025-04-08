import { storage } from "../storage";
import { BrokerConnection, InsertBrokerConnection } from "@shared/schema";

// Supported brokers
export type BrokerType = "zerodha" | "angelone" | "fyers" | "robinhood" | "binance";

// Order types
export type OrderType = "market" | "limit" | "stop" | "stop_limit";

// Order direction
export type OrderDirection = "long" | "short";

// Order parameters
export interface OrderParameters {
  broker: string;
  symbol: string;
  quantity: number;
  orderType: string;
  direction: OrderDirection;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  validity?: string;
  metadata?: Record<string, any>;
}

// Order result
export interface OrderResult {
  success: boolean;
  orderId?: string;
  message?: string;
  filledPrice?: number;
  status?: string;
  details?: Record<string, any>;
}

/**
 * Connect to the specified broker
 * @param userId The user ID
 * @param broker The broker to connect to
 * @returns Authentication URL for the user to complete the broker connection
 */
export async function connectBroker(userId: number, broker: BrokerType): Promise<string> {
  try {
    // Check if there's an existing connection
    const existingConnection = await storage.getBrokerConnectionByBroker(userId, broker);
    
    let authUrl = "";
    
    // Generate authentication URL based on broker
    switch (broker) {
      case "zerodha":
        authUrl = "https://kite.zerodha.com/connect/login?v=3&api_key=" + (process.env.ZERODHA_API_KEY || "mock_key");
        break;
      case "angelone":
        authUrl = "https://smartapi.angelbroking.com/oauth/authorize?client_id=" + (process.env.ANGELONE_CLIENT_ID || "mock_id");
        break;
      case "fyers":
        authUrl = "https://api.fyers.in/api/v2/generate-authcode?client_id=" + (process.env.FYERS_CLIENT_ID || "mock_id");
        break;
      case "robinhood":
        authUrl = "https://robinhood.com/oauth/authorize?client_id=" + (process.env.ROBINHOOD_CLIENT_ID || "mock_id");
        break;
      case "binance":
        authUrl = "https://accounts.binance.com/en/oauth/authorize?client_id=" + (process.env.BINANCE_CLIENT_ID || "mock_id");
        break;
      default:
        throw new Error(`Unsupported broker: ${broker}`);
    }
    
    // Create a new connection or update existing one
    if (existingConnection) {
      await storage.updateBrokerConnection(existingConnection.id, {
        isActive: true,
        metadata: { ...existingConnection.metadata, lastConnectionAttempt: new Date().toISOString() }
      });
    } else {
      const brokerConnection: InsertBrokerConnection = {
        userId,
        broker,
        authToken: null,
        refreshToken: null,
        isActive: false,
        metadata: { 
          lastConnectionAttempt: new Date().toISOString(),
          status: "pending_authorization"
        }
      };
      
      await storage.createBrokerConnection(brokerConnection);
    }
    
    // Log this event
    await storage.createEventLog({
      userId,
      eventType: "broker_connection_initiated",
      details: { broker, timestamp: new Date().toISOString() }
    });
    
    return authUrl;
  } catch (error) {
    console.error(`Error connecting to broker ${broker}:`, error);
    throw new Error(`Failed to connect to broker: ${error.message}`);
  }
}

/**
 * Complete broker authorization process after user authentication
 * @param userId The user ID
 * @param broker The broker
 * @param authCode Authorization code from the broker's callback
 * @returns Updated broker connection
 */
export async function completeBrokerAuth(userId: number, broker: BrokerType, authCode: string): Promise<BrokerConnection> {
  try {
    const existingConnection = await storage.getBrokerConnectionByBroker(userId, broker);
    
    if (!existingConnection) {
      throw new Error(`No pending connection found for broker: ${broker}`);
    }
    
    // In a real implementation, this would exchange the auth code for tokens
    // and store them securely. For the MVP, we'll simulate successful connection.
    const authToken = `auth_${Math.random().toString(36).substring(2, 15)}`;
    const refreshToken = `refresh_${Math.random().toString(36).substring(2, 15)}`;
    
    const updatedConnection = await storage.updateBrokerConnection(existingConnection.id, {
      authToken,
      refreshToken,
      isActive: true,
      metadata: {
        ...existingConnection.metadata,
        status: "connected",
        connectedAt: new Date().toISOString()
      }
    });
    
    // Log this event
    await storage.createEventLog({
      userId,
      eventType: "broker_connected",
      details: { 
        broker,
        timestamp: new Date().toISOString(),
        connectionId: existingConnection.id
      }
    });
    
    return updatedConnection;
  } catch (error) {
    console.error(`Error completing broker auth for ${broker}:`, error);
    throw new Error(`Failed to complete broker authorization: ${error.message}`);
  }
}

/**
 * Disconnect broker
 * @param userId The user ID
 * @param broker The broker to disconnect
 */
export async function disconnectBroker(userId: number, broker: BrokerType): Promise<void> {
  try {
    const existingConnection = await storage.getBrokerConnectionByBroker(userId, broker);
    
    if (!existingConnection) {
      throw new Error(`No connection found for broker: ${broker}`);
    }
    
    await storage.updateBrokerConnection(existingConnection.id, {
      isActive: false,
      metadata: {
        ...existingConnection.metadata,
        status: "disconnected",
        disconnectedAt: new Date().toISOString()
      }
    });
    
    // Log this event
    await storage.createEventLog({
      userId,
      eventType: "broker_disconnected",
      details: { broker, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    console.error(`Error disconnecting broker ${broker}:`, error);
    throw new Error(`Failed to disconnect broker: ${error.message}`);
  }
}

/**
 * Get data from connected broker
 * @param userId The user ID
 * @param dataType The type of data to retrieve
 * @param params Additional parameters for the request
 * @returns The requested broker data
 */
export async function getBrokerData(
  userId: number, 
  dataType: "positions" | "orders" | "portfolio" | "watchlist" | "quote",
  params?: Record<string, any>
): Promise<any> {
  try {
    // Get active broker connections
    const connections = await storage.getBrokerConnections(userId);
    const activeConnections = connections.filter(conn => conn.isActive);
    
    if (activeConnections.length === 0) {
      return dataType === "quote" ? null : [];
    }
    
    // In a real implementation, this would make API calls to the broker
    // using the stored tokens to fetch the requested data
    
    // For the MVP, we'll return mock data based on the data type
    switch (dataType) {
      case "positions":
        return [
          { 
            symbol: "HDFCBANK", 
            quantity: 10, 
            avgPrice: "1620.50", 
            currentPrice: "1642.30",
            pnl: "218.00",
            pnlPercent: "1.35%",
            broker: activeConnections[0].broker
          },
          { 
            symbol: "INFY", 
            quantity: 15, 
            avgPrice: "1910.75", 
            currentPrice: "1950.40",
            pnl: "595.50",
            pnlPercent: "2.08%",
            broker: activeConnections[0].broker
          }
        ];
      
      case "orders":
        return [
          {
            orderId: "ORD123456",
            symbol: "RELIANCE",
            type: "LIMIT",
            side: "BUY",
            quantity: 5,
            price: "2456.00",
            status: "COMPLETE",
            time: "2023-06-14T09:45:30Z",
            broker: activeConnections[0].broker
          },
          {
            orderId: "ORD123457",
            symbol: "TCS",
            type: "MARKET",
            side: "SELL",
            quantity: 2,
            price: "3567.25",
            status: "COMPLETE",
            time: "2023-06-14T10:15:45Z",
            broker: activeConnections[0].broker
          }
        ];
      
      case "portfolio":
        return [
          {
            symbol: "HDFCBANK",
            name: "HDFC Bank",
            quantity: 10,
            value: "16423.00",
            allocation: "45.2%",
            dayChange: "+1.3%",
            broker: activeConnections[0].broker
          },
          {
            symbol: "INFY",
            name: "Infosys",
            quantity: 15,
            value: "29256.00",
            allocation: "54.8%",
            dayChange: "+2.1%",
            broker: activeConnections[0].broker
          }
        ];
      
      case "watchlist":
        return [
          {
            symbol: "RELIANCE",
            name: "Reliance Industries",
            price: "2456.75",
            change: 1.2,
            changePercent: "1.2%",
            volume: "2.5M",
            broker: activeConnections[0].broker
          },
          {
            symbol: "TCS",
            name: "Tata Consultancy Services",
            price: "3568.50",
            change: -0.5,
            changePercent: "-0.5%",
            volume: "1.8M",
            broker: activeConnections[0].broker
          },
          {
            symbol: "ITC",
            name: "ITC Limited",
            price: "423.30",
            change: 0.8,
            changePercent: "0.8%",
            volume: "3.2M",
            broker: activeConnections[0].broker
          }
        ];
      
      case "quote":
        if (!params?.symbol) {
          throw new Error("Symbol is required for quote data");
        }
        
        // Mock quote data for different symbols
        const quotes = {
          "HDFCBANK": { price: 1642.30, change: 12.50, changePercent: 0.77, volume: 4500000 },
          "INFY": { price: 1950.40, change: 23.80, changePercent: 1.24, volume: 2100000 },
          "RELIANCE": { price: 2456.75, change: 28.90, changePercent: 1.19, volume: 3200000 },
          "TCS": { price: 3568.50, change: -18.25, changePercent: -0.51, volume: 1200000 },
          "ITC": { price: 423.30, change: 3.40, changePercent: 0.81, volume: 6500000 },
          "AAPL": { price: 190.50, change: 2.30, changePercent: 1.22, volume: 55000000 },
          "MSFT": { price: 338.15, change: 3.75, changePercent: 1.12, volume: 22000000 },
          "GOOGL": { price: 130.25, change: 1.75, changePercent: 1.36, volume: 18000000 },
          "AMZN": { price: 128.90, change: 2.15, changePercent: 1.70, volume: 35000000 },
          "TSLA": { price: 245.20, change: 5.80, changePercent: 2.42, volume: 65000000 }
        };
        
        const symbol = params.symbol.toUpperCase();
        if (quotes[symbol]) {
          return {
            symbol,
            price: quotes[symbol].price,
            change: quotes[symbol].change,
            changePercent: quotes[symbol].changePercent,
            volume: quotes[symbol].volume,
            broker: activeConnections[0].broker,
            timestamp: new Date()
          };
        } else {
          // Generate a random price for unknown symbols between 50 and 500
          const randomPrice = 50 + Math.random() * 450;
          return {
            symbol,
            price: parseFloat(randomPrice.toFixed(2)),
            change: parseFloat((Math.random() * 10 - 5).toFixed(2)),
            changePercent: parseFloat((Math.random() * 5 - 2.5).toFixed(2)),
            volume: Math.floor(Math.random() * 10000000),
            broker: activeConnections[0].broker,
            timestamp: new Date()
          };
        }
      
      default:
        return [];
    }
  } catch (error) {
    console.error(`Error getting broker data (${dataType}):`, error);
    throw new Error(`Failed to get broker data: ${error.message}`);
  }
}

/**
 * Place a broker order
 * @param userId The user ID
 * @param orderParams The order parameters
 * @returns Result of the order placement
 */
export async function placeBrokerOrder(userId: number, orderParams: OrderParameters): Promise<OrderResult> {
  try {
    console.log(`Placing ${orderParams.direction} order for ${orderParams.symbol}, quantity: ${orderParams.quantity}`);
    
    // Get broker connection
    const connection = await storage.getBrokerConnectionByBroker(userId, orderParams.broker);
    
    if (!connection || !connection.isActive) {
      return {
        success: false,
        message: `No active connection found for broker: ${orderParams.broker}`
      };
    }
    
    // In a real implementation, this would make an API call to the broker
    // to place the order. For the MVP, we'll simulate a successful order.
    
    // Generate a random order ID
    const orderId = `ORD${Math.floor(Math.random() * 1000000)}`;
    
    // Get the current price for the symbol
    const quoteData = await getBrokerData(userId, 'quote', { symbol: orderParams.symbol });
    const currentPrice = orderParams.price || quoteData.price;
    
    // Randomly apply some slippage for market orders
    const slippage = orderParams.orderType === 'market' ? (Math.random() * 0.01 - 0.005) : 0; // ±0.5% slippage
    const filledPrice = parseFloat((currentPrice * (1 + slippage)).toFixed(2));
    
    // Log the order
    await storage.createEventLog({
      userId,
      eventType: 'order_placed',
      details: {
        broker: orderParams.broker,
        symbol: orderParams.symbol,
        quantity: orderParams.quantity,
        direction: orderParams.direction,
        orderType: orderParams.orderType,
        price: orderParams.price || 'market',
        filledPrice,
        stopLoss: orderParams.stopLoss,
        takeProfit: orderParams.takeProfit,
        timestamp: new Date().toISOString(),
        orderId
      }
    });
    
    return {
      success: true,
      orderId,
      filledPrice,
      message: `Successfully placed ${orderParams.direction} order for ${orderParams.symbol}`,
      status: 'filled',
      details: {
        symbol: orderParams.symbol,
        quantity: orderParams.quantity,
        direction: orderParams.direction,
        orderType: orderParams.orderType,
        time: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error placing broker order:', error);
    
    // Log the error
    await storage.createEventLog({
      userId,
      eventType: 'order_error',
      details: {
        error: error.message,
        orderParams
      }
    });
    
    return {
      success: false,
      message: `Failed to place order: ${error.message}`
    };
  }
}
