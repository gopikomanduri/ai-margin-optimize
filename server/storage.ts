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
  BadgeDefinition,
  InsertBadgeDefinition,
  UserBadge,
  InsertUserBadge,
  TradingGoal,
  InsertTradingGoal,
  // Table references for database queries
  users,
  chatMessages,
  contextMemory,
  brokerConnections,
  tradingPositions,
  eventLogs,
  badgeDefinitions,
  userBadges,
  tradingGoals
} from "@shared/schema";
import { db } from "./db";
import { and, desc, eq } from "drizzle-orm";

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
  
  // Badge definition methods
  getBadgeDefinitions(category?: string): Promise<BadgeDefinition[]>;
  getBadgeDefinitionByCode(code: string): Promise<BadgeDefinition | undefined>;
  getBadgeDefinition(id: number): Promise<BadgeDefinition | undefined>;
  createBadgeDefinition(badge: InsertBadgeDefinition): Promise<BadgeDefinition>;
  updateBadgeDefinition(id: number, badge: Partial<InsertBadgeDefinition>): Promise<BadgeDefinition>;
  
  // User badge methods
  getUserBadges(userId: number): Promise<UserBadge[]>;
  getUserBadge(id: number): Promise<UserBadge | undefined>;
  getUserBadgeByBadgeId(userId: number, badgeId: number): Promise<UserBadge | undefined>;
  createUserBadge(userBadge: InsertUserBadge): Promise<UserBadge>;
  updateUserBadge(id: number, userBadge: Partial<InsertUserBadge>): Promise<UserBadge>;
  markUserBadgeAsSeen(id: number): Promise<UserBadge>;
  
  // Trading goal methods
  getTradingGoals(userId: number, isCompleted?: boolean): Promise<TradingGoal[]>;
  getTradingGoal(id: number): Promise<TradingGoal | undefined>;
  createTradingGoal(goal: InsertTradingGoal): Promise<TradingGoal>;
  updateTradingGoal(id: number, goal: Partial<InsertTradingGoal>): Promise<TradingGoal>;
  completeTradingGoal(id: number): Promise<TradingGoal>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private chatMessages: Map<number, ChatMessage>;
  private contextMemories: Map<number, ContextMemory>;
  private brokerConnections: Map<number, BrokerConnection>;
  private tradingPositions: Map<number, TradingPosition>;
  private eventLogs: Map<number, EventLog>;
  private badgeDefinitions: Map<number, BadgeDefinition>;
  private userBadges: Map<number, UserBadge>;
  private tradingGoals: Map<number, TradingGoal>;
  
  private userIdCounter: number;
  private messageIdCounter: number;
  private memoryIdCounter: number;
  private connectionIdCounter: number;
  private positionIdCounter: number;
  private logIdCounter: number;
  private badgeDefinitionIdCounter: number;
  private userBadgeIdCounter: number;
  private tradingGoalIdCounter: number;

  constructor() {
    this.users = new Map();
    this.chatMessages = new Map();
    this.contextMemories = new Map();
    this.brokerConnections = new Map();
    this.tradingPositions = new Map();
    this.eventLogs = new Map();
    this.badgeDefinitions = new Map();
    this.userBadges = new Map();
    this.tradingGoals = new Map();
    
    this.userIdCounter = 1;
    this.messageIdCounter = 1;
    this.memoryIdCounter = 1;
    this.connectionIdCounter = 1;
    this.positionIdCounter = 1;
    this.logIdCounter = 1;
    this.badgeDefinitionIdCounter = 1;
    this.userBadgeIdCounter = 1;
    this.tradingGoalIdCounter = 1;
    
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

  // Badge definition methods
  async getBadgeDefinitions(category?: string): Promise<BadgeDefinition[]> {
    return Array.from(this.badgeDefinitions.values())
      .filter(badge => badge.isActive && (!category || badge.category === category))
      .sort((a, b) => a.level - b.level);
  }

  async getBadgeDefinitionByCode(code: string): Promise<BadgeDefinition | undefined> {
    return Array.from(this.badgeDefinitions.values())
      .find(badge => badge.code === code && badge.isActive);
  }

  async getBadgeDefinition(id: number): Promise<BadgeDefinition | undefined> {
    return this.badgeDefinitions.get(id);
  }

  async createBadgeDefinition(badge: InsertBadgeDefinition): Promise<BadgeDefinition> {
    const id = this.badgeDefinitionIdCounter++;
    const now = new Date();
    const badgeDefinition: BadgeDefinition = {
      ...badge,
      id,
      createdAt: now,
      updatedAt: now,
      isActive: badge.isActive ?? true
    };
    this.badgeDefinitions.set(id, badgeDefinition);
    return badgeDefinition;
  }

  async updateBadgeDefinition(id: number, badge: Partial<InsertBadgeDefinition>): Promise<BadgeDefinition> {
    const existingBadge = this.badgeDefinitions.get(id);
    if (!existingBadge) {
      throw new Error(`Badge definition with id ${id} not found`);
    }
    
    const updatedBadge: BadgeDefinition = {
      ...existingBadge,
      ...badge,
      updatedAt: new Date()
    };
    
    this.badgeDefinitions.set(id, updatedBadge);
    return updatedBadge;
  }

  // User badge methods
  async getUserBadges(userId: number): Promise<UserBadge[]> {
    return Array.from(this.userBadges.values())
      .filter(badge => badge.userId === userId)
      .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime());
  }

  async getUserBadge(id: number): Promise<UserBadge | undefined> {
    return this.userBadges.get(id);
  }

  async getUserBadgeByBadgeId(userId: number, badgeId: number): Promise<UserBadge | undefined> {
    return Array.from(this.userBadges.values())
      .find(badge => badge.userId === userId && badge.badgeId === badgeId);
  }

  async createUserBadge(userBadge: InsertUserBadge): Promise<UserBadge> {
    const id = this.userBadgeIdCounter++;
    const now = new Date();
    const newUserBadge: UserBadge = {
      ...userBadge,
      id,
      earnedAt: now,
      firstEarnedAt: now,
      isNew: true,
      currentLevel: userBadge.currentLevel ?? 1
    };
    this.userBadges.set(id, newUserBadge);
    return newUserBadge;
  }

  async updateUserBadge(id: number, userBadge: Partial<InsertUserBadge>): Promise<UserBadge> {
    const existingBadge = this.userBadges.get(id);
    if (!existingBadge) {
      throw new Error(`User badge with id ${id} not found`);
    }
    
    const updatedBadge: UserBadge = {
      ...existingBadge,
      ...userBadge,
      earnedAt: new Date()
    };
    
    this.userBadges.set(id, updatedBadge);
    return updatedBadge;
  }

  async markUserBadgeAsSeen(id: number): Promise<UserBadge> {
    const existingBadge = this.userBadges.get(id);
    if (!existingBadge) {
      throw new Error(`User badge with id ${id} not found`);
    }
    
    const updatedBadge: UserBadge = {
      ...existingBadge,
      isNew: false
    };
    
    this.userBadges.set(id, updatedBadge);
    return updatedBadge;
  }

  // Trading goal methods
  async getTradingGoals(userId: number, isCompleted?: boolean): Promise<TradingGoal[]> {
    return Array.from(this.tradingGoals.values())
      .filter(goal => 
        goal.userId === userId && 
        (isCompleted === undefined || goal.isCompleted === isCompleted)
      )
      .sort((a, b) => {
        // Sort by completion status and creation date
        if (a.isCompleted !== b.isCompleted) {
          return a.isCompleted ? 1 : -1; // Active goals first
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async getTradingGoal(id: number): Promise<TradingGoal | undefined> {
    return this.tradingGoals.get(id);
  }

  async createTradingGoal(goal: InsertTradingGoal): Promise<TradingGoal> {
    const id = this.tradingGoalIdCounter++;
    const now = new Date();
    const tradingGoal: TradingGoal = {
      ...goal,
      id,
      createdAt: now,
      updatedAt: now,
      isCompleted: false
    };
    this.tradingGoals.set(id, tradingGoal);
    return tradingGoal;
  }

  async updateTradingGoal(id: number, goal: Partial<InsertTradingGoal>): Promise<TradingGoal> {
    const existingGoal = this.tradingGoals.get(id);
    if (!existingGoal) {
      throw new Error(`Trading goal with id ${id} not found`);
    }
    
    const updatedGoal: TradingGoal = {
      ...existingGoal,
      ...goal,
      updatedAt: new Date()
    };
    
    this.tradingGoals.set(id, updatedGoal);
    return updatedGoal;
  }

  async completeTradingGoal(id: number): Promise<TradingGoal> {
    const existingGoal = this.tradingGoals.get(id);
    if (!existingGoal) {
      throw new Error(`Trading goal with id ${id} not found`);
    }
    
    const now = new Date();
    const completedGoal: TradingGoal = {
      ...existingGoal,
      isCompleted: true,
      completedAt: now,
      updatedAt: now
    };
    
    this.tradingGoals.set(id, completedGoal);
    return completedGoal;
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getChatMessages(userId: number, limit?: number): Promise<ChatMessage[]> {
    const query = db.select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(desc(chatMessages.createdAt));
    
    if (limit) {
      query.limit(limit);
    }

    return await query;
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [chatMessage] = await db.insert(chatMessages).values(message).returning();
    return chatMessage;
  }

  async clearChatMessages(userId: number): Promise<void> {
    await db.delete(chatMessages).where(eq(chatMessages.userId, userId));
  }

  async getContextMemory(userId: number): Promise<ContextMemory | undefined> {
    const [memory] = await db.select()
      .from(contextMemory)
      .where(eq(contextMemory.userId, userId));
    
    return memory || undefined;
  }

  async createOrUpdateContextMemory(memory: InsertContextMemory): Promise<ContextMemory> {
    // Check if a memory already exists for this user
    const existingMemory = await this.getContextMemory(memory.userId);
    
    if (existingMemory) {
      // Update existing memory
      const [updatedMemory] = await db.update(contextMemory)
        .set({
          data: memory.data,
          lastUpdated: new Date()
        })
        .where(eq(contextMemory.id, existingMemory.id))
        .returning();
        
      return updatedMemory;
    } else {
      // Create new memory
      const [newMemory] = await db.insert(contextMemory)
        .values({
          ...memory,
          lastUpdated: new Date()
        })
        .returning();
        
      return newMemory;
    }
  }

  async getBrokerConnections(userId: number): Promise<BrokerConnection[]> {
    return await db.select()
      .from(brokerConnections)
      .where(eq(brokerConnections.userId, userId));
  }

  async getBrokerConnectionByBroker(userId: number, broker: string): Promise<BrokerConnection | undefined> {
    const [connection] = await db.select()
      .from(brokerConnections)
      .where(and(
        eq(brokerConnections.userId, userId),
        eq(brokerConnections.broker, broker)
      ));
      
    return connection || undefined;
  }

  async createBrokerConnection(connection: InsertBrokerConnection): Promise<BrokerConnection> {
    const [brokerConnection] = await db.insert(brokerConnections)
      .values(connection)
      .returning();
      
    return brokerConnection;
  }

  async updateBrokerConnection(id: number, partialConnection: Partial<InsertBrokerConnection>): Promise<BrokerConnection> {
    const [updatedConnection] = await db.update(brokerConnections)
      .set(partialConnection)
      .where(eq(brokerConnections.id, id))
      .returning();
      
    return updatedConnection;
  }

  async getTradingPositions(userId: number, status?: string): Promise<TradingPosition[]> {
    let query = db.select()
      .from(tradingPositions)
      .where(eq(tradingPositions.userId, userId));
      
    if (status) {
      query = query.where(eq(tradingPositions.status, status));
    }
    
    return await query;
  }

  async createTradingPosition(position: InsertTradingPosition): Promise<TradingPosition> {
    const [tradingPosition] = await db.insert(tradingPositions)
      .values(position)
      .returning();
      
    return tradingPosition;
  }

  async updateTradingPosition(id: number, partialPosition: Partial<InsertTradingPosition>): Promise<TradingPosition> {
    const [updatedPosition] = await db.update(tradingPositions)
      .set(partialPosition)
      .where(eq(tradingPositions.id, id))
      .returning();
      
    return updatedPosition;
  }

  async createEventLog(log: InsertEventLog): Promise<EventLog> {
    const [eventLog] = await db.insert(eventLogs)
      .values({
        ...log,
        createdAt: new Date()
      })
      .returning();
      
    return eventLog;
  }

  async getEventLogs(userId: number, limit?: number): Promise<EventLog[]> {
    let query = db.select()
      .from(eventLogs)
      .where(eq(eventLogs.userId, userId))
      .orderBy(desc(eventLogs.createdAt));
      
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }

  // Badge definition methods
  async getBadgeDefinitions(category?: string): Promise<BadgeDefinition[]> {
    let query = db.select().from(badgeDefinitions)
      .where(eq(badgeDefinitions.isActive, true));
      
    if (category) {
      query = query.where(eq(badgeDefinitions.category, category));
    }
    
    return await query.orderBy(badgeDefinitions.level);
  }
  
  async getBadgeDefinitionByCode(code: string): Promise<BadgeDefinition | undefined> {
    const [badge] = await db.select()
      .from(badgeDefinitions)
      .where(and(
        eq(badgeDefinitions.code, code),
        eq(badgeDefinitions.isActive, true)
      ));
      
    return badge || undefined;
  }
  
  async getBadgeDefinition(id: number): Promise<BadgeDefinition | undefined> {
    const [badge] = await db.select()
      .from(badgeDefinitions)
      .where(eq(badgeDefinitions.id, id));
      
    return badge || undefined;
  }
  
  async createBadgeDefinition(badge: InsertBadgeDefinition): Promise<BadgeDefinition> {
    const now = new Date();
    const [badgeDefinition] = await db.insert(badgeDefinitions)
      .values({
        ...badge,
        createdAt: now,
        updatedAt: now,
        isActive: badge.isActive ?? true
      })
      .returning();
      
    return badgeDefinition;
  }
  
  async updateBadgeDefinition(id: number, badge: Partial<InsertBadgeDefinition>): Promise<BadgeDefinition> {
    const [updatedBadge] = await db.update(badgeDefinitions)
      .set({
        ...badge,
        updatedAt: new Date()
      })
      .where(eq(badgeDefinitions.id, id))
      .returning();
      
    return updatedBadge;
  }
  
  // User badge methods
  async getUserBadges(userId: number): Promise<UserBadge[]> {
    return await db.select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.earnedAt));
  }
  
  async getUserBadge(id: number): Promise<UserBadge | undefined> {
    const [badge] = await db.select()
      .from(userBadges)
      .where(eq(userBadges.id, id));
      
    return badge || undefined;
  }
  
  async getUserBadgeByBadgeId(userId: number, badgeId: number): Promise<UserBadge | undefined> {
    const [badge] = await db.select()
      .from(userBadges)
      .where(and(
        eq(userBadges.userId, userId),
        eq(userBadges.badgeId, badgeId)
      ));
      
    return badge || undefined;
  }
  
  async createUserBadge(userBadge: InsertUserBadge): Promise<UserBadge> {
    const now = new Date();
    const [badge] = await db.insert(userBadges)
      .values({
        ...userBadge,
        earnedAt: now,
        firstEarnedAt: now,
        isNew: true,
        currentLevel: userBadge.currentLevel ?? 1
      })
      .returning();
      
    return badge;
  }
  
  async updateUserBadge(id: number, userBadge: Partial<InsertUserBadge>): Promise<UserBadge> {
    const [updatedBadge] = await db.update(userBadges)
      .set({
        ...userBadge,
        earnedAt: new Date()
      })
      .where(eq(userBadges.id, id))
      .returning();
      
    return updatedBadge;
  }
  
  async markUserBadgeAsSeen(id: number): Promise<UserBadge> {
    const [updatedBadge] = await db.update(userBadges)
      .set({ isNew: false })
      .where(eq(userBadges.id, id))
      .returning();
      
    return updatedBadge;
  }
  
  // Trading goal methods
  async getTradingGoals(userId: number, isCompleted?: boolean): Promise<TradingGoal[]> {
    try {
      let result;
      
      if (isCompleted !== undefined) {
        result = await db.select().from(tradingGoals)
          .where(
            and(
              eq(tradingGoals.userId, userId),
              eq(tradingGoals.isCompleted, isCompleted)
            )
          );
      } else {
        result = await db.select().from(tradingGoals)
          .where(eq(tradingGoals.userId, userId));
      }
      
      // Sort the results in memory
      return result.sort((a, b) => {
        // First by completion status
        if (a.isCompleted !== b.isCompleted) {
          return a.isCompleted ? 1 : -1;
        }
        // Then by created date (newest first)
        return new Date(b.createdAt || new Date()).getTime() - new Date(a.createdAt || new Date()).getTime();
      });
    } catch (error) {
      console.error('Error in getTradingGoals:', error);
      return [];
    }
  }
  
  async getTradingGoal(id: number): Promise<TradingGoal | undefined> {
    const [goal] = await db.select()
      .from(tradingGoals)
      .where(eq(tradingGoals.id, id));
      
    return goal || undefined;
  }
  
  async createTradingGoal(goal: InsertTradingGoal): Promise<TradingGoal> {
    const now = new Date();
    const [tradingGoal] = await db.insert(tradingGoals)
      .values({
        ...goal,
        createdAt: now,
        updatedAt: now,
        isCompleted: false
      })
      .returning();
      
    return tradingGoal;
  }
  
  async updateTradingGoal(id: number, goal: Partial<InsertTradingGoal>): Promise<TradingGoal> {
    const [updatedGoal] = await db.update(tradingGoals)
      .set({
        ...goal,
        updatedAt: new Date()
      })
      .where(eq(tradingGoals.id, id))
      .returning();
      
    return updatedGoal;
  }
  
  async completeTradingGoal(id: number): Promise<TradingGoal> {
    const now = new Date();
    const [completedGoal] = await db.update(tradingGoals)
      .set({
        isCompleted: true,
        completedAt: now,
        updatedAt: now
      })
      .where(eq(tradingGoals.id, id))
      .returning();
      
    return completedGoal;
  }
}

// Use the DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
