import {
  User,
  InsertUser,
  ChatMessage,
  InsertChatMessage,
  ContextMemory,
  InsertContextMemory,
  BrokerConnection,
  InsertBrokerConnection,
  TradingPosition,
  InsertTradingPosition,
  EventLog,
  InsertEventLog,
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Chat messages methods
  getChatMessages(userId: number, limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  clearChatMessages(userId: number): Promise<void>;
  
  // Context memory methods
  getContextMemory(userId: number): Promise<ContextMemory | undefined>;
  createOrUpdateContextMemory(memory: InsertContextMemory): Promise<ContextMemory>;
  
  // Broker connection methods
  getBrokerConnections(userId: number): Promise<BrokerConnection[]>;
  getBrokerConnectionByBroker(userId: number, broker: string): Promise<BrokerConnection | undefined>;
  createBrokerConnection(connection: InsertBrokerConnection): Promise<BrokerConnection>;
  updateBrokerConnection(id: number, connection: Partial<InsertBrokerConnection>): Promise<BrokerConnection>;
  
  // Trading positions methods
  getTradingPositions(userId: number, status?: string): Promise<TradingPosition[]>;
  createTradingPosition(position: InsertTradingPosition): Promise<TradingPosition>;
  updateTradingPosition(id: number, position: Partial<InsertTradingPosition>): Promise<TradingPosition>;
  
  // Event logs methods
  createEventLog(log: InsertEventLog): Promise<EventLog>;
  getEventLogs(userId: number, limit?: number): Promise<EventLog[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private chatMessages: Map<number, ChatMessage>;
  private contextMemories: Map<number, ContextMemory>;
  private brokerConnections: Map<number, BrokerConnection>;
  private tradingPositions: Map<number, TradingPosition>;
  private eventLogs: Map<number, EventLog>;
  
  private userIdCounter: number;
  private messageIdCounter: number;
  private memoryIdCounter: number;
  private connectionIdCounter: number;
  private positionIdCounter: number;
  private logIdCounter: number;

  constructor() {
    this.users = new Map();
    this.chatMessages = new Map();
    this.contextMemories = new Map();
    this.brokerConnections = new Map();
    this.tradingPositions = new Map();
    this.eventLogs = new Map();
    
    this.userIdCounter = 1;
    this.messageIdCounter = 1;
    this.memoryIdCounter = 1;
    this.connectionIdCounter = 1;
    this.positionIdCounter = 1;
    this.logIdCounter = 1;
    
    // Create a default user
    this.createUser({
      username: "trader",
      password: "password",
      name: "Trader",
      email: "trader@example.com",
      preferences: {
        riskLevel: "moderate",
        tradingStyle: "swing",
        favoriteStocks: ["HDFCBANK", "INFY", "RELIANCE"],
      },
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }
  
  // Chat messages methods
  async getChatMessages(userId: number, limit?: number): Promise<ChatMessage[]> {
    const messages = Array.from(this.chatMessages.values())
      .filter(msg => msg.userId === userId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    return limit ? messages.slice(-limit) : messages;
  }
  
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = this.messageIdCounter++;
    const now = new Date();
    const chatMessage: ChatMessage = { ...message, id, createdAt: now };
    this.chatMessages.set(id, chatMessage);
    return chatMessage;
  }
  
  async clearChatMessages(userId: number): Promise<void> {
    Array.from(this.chatMessages.entries())
      .filter(([_, msg]) => msg.userId === userId)
      .forEach(([id, _]) => this.chatMessages.delete(id));
  }
  
  // Context memory methods
  async getContextMemory(userId: number): Promise<ContextMemory | undefined> {
    return Array.from(this.contextMemories.values())
      .find(memory => memory.userId === userId);
  }
  
  async createOrUpdateContextMemory(memory: InsertContextMemory): Promise<ContextMemory> {
    const existingMemory = await this.getContextMemory(memory.userId);
    
    if (existingMemory) {
      const updatedMemory: ContextMemory = {
        ...existingMemory,
        data: memory.data,
        lastUpdated: new Date(),
      };
      this.contextMemories.set(existingMemory.id, updatedMemory);
      return updatedMemory;
    }
    
    const id = this.memoryIdCounter++;
    const now = new Date();
    const newMemory: ContextMemory = { ...memory, id, lastUpdated: now };
    this.contextMemories.set(id, newMemory);
    return newMemory;
  }
  
  // Broker connection methods
  async getBrokerConnections(userId: number): Promise<BrokerConnection[]> {
    return Array.from(this.brokerConnections.values())
      .filter(conn => conn.userId === userId);
  }
  
  async getBrokerConnectionByBroker(userId: number, broker: string): Promise<BrokerConnection | undefined> {
    return Array.from(this.brokerConnections.values())
      .find(conn => conn.userId === userId && conn.broker === broker);
  }
  
  async createBrokerConnection(connection: InsertBrokerConnection): Promise<BrokerConnection> {
    const id = this.connectionIdCounter++;
    const now = new Date();
    const brokerConnection: BrokerConnection = { 
      ...connection, 
      id, 
      createdAt: now,
      updatedAt: now 
    };
    this.brokerConnections.set(id, brokerConnection);
    return brokerConnection;
  }
  
  async updateBrokerConnection(id: number, partialConnection: Partial<InsertBrokerConnection>): Promise<BrokerConnection> {
    const existingConnection = this.brokerConnections.get(id);
    if (!existingConnection) {
      throw new Error(`Broker connection with id ${id} not found`);
    }
    
    const updatedConnection: BrokerConnection = {
      ...existingConnection,
      ...partialConnection,
      updatedAt: new Date(),
    };
    
    this.brokerConnections.set(id, updatedConnection);
    return updatedConnection;
  }
  
  // Trading positions methods
  async getTradingPositions(userId: number, status?: string): Promise<TradingPosition[]> {
    return Array.from(this.tradingPositions.values())
      .filter(pos => pos.userId === userId && (!status || pos.status === status));
  }
  
  async createTradingPosition(position: InsertTradingPosition): Promise<TradingPosition> {
    const id = this.positionIdCounter++;
    const tradingPosition: TradingPosition = { ...position, id };
    this.tradingPositions.set(id, tradingPosition);
    return tradingPosition;
  }
  
  async updateTradingPosition(id: number, partialPosition: Partial<InsertTradingPosition>): Promise<TradingPosition> {
    const existingPosition = this.tradingPositions.get(id);
    if (!existingPosition) {
      throw new Error(`Trading position with id ${id} not found`);
    }
    
    const updatedPosition: TradingPosition = {
      ...existingPosition,
      ...partialPosition,
    };
    
    this.tradingPositions.set(id, updatedPosition);
    return updatedPosition;
  }
  
  // Event logs methods
  async createEventLog(log: InsertEventLog): Promise<EventLog> {
    const id = this.logIdCounter++;
    const now = new Date();
    const eventLog: EventLog = { ...log, id, createdAt: now };
    this.eventLogs.set(id, eventLog);
    return eventLog;
  }
  
  async getEventLogs(userId: number, limit?: number): Promise<EventLog[]> {
    const logs = Array.from(this.eventLogs.values())
      .filter(log => !userId || log.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return limit ? logs.slice(0, limit) : logs;
  }
}

export const storage = new MemStorage();
