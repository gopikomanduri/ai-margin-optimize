import { pgTable, text, serial, integer, boolean, timestamp, json, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  preferences: jsonb("preferences"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // "user" or "assistant"
  metadata: jsonb("metadata"), // suggestions, trades, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Context memory table
export const contextMemory = pgTable("context_memory", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  data: jsonb("data").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Broker connections table
export const brokerConnections = pgTable("broker_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  broker: text("broker").notNull(), // e.g., "zerodha", "angelone"
  authToken: text("auth_token"),
  refreshToken: text("refresh_token"),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trading positions table
export const tradingPositions = pgTable("trading_positions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  symbol: text("symbol").notNull(),
  entryPrice: text("entry_price").notNull(),
  quantity: integer("quantity").notNull(),
  direction: text("direction").notNull(), // "long" or "short"
  entryDate: timestamp("entry_date").notNull(),
  exitDate: timestamp("exit_date"),
  exitPrice: text("exit_price"),
  pnl: text("pnl"),
  status: text("status").notNull(), // "open" or "closed"
  metadata: jsonb("metadata"),
});

// Event logs table
export const eventLogs = pgTable("event_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  eventType: text("event_type").notNull(),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  preferences: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  userId: true,
  content: true,
  type: true,
  metadata: true,
});

export const insertContextMemorySchema = createInsertSchema(contextMemory).pick({
  userId: true,
  data: true,
});

export const insertBrokerConnectionSchema = createInsertSchema(brokerConnections).pick({
  userId: true,
  broker: true,
  authToken: true,
  refreshToken: true,
  isActive: true,
  metadata: true,
});

export const insertTradingPositionSchema = createInsertSchema(tradingPositions).pick({
  userId: true,
  symbol: true,
  entryPrice: true,
  quantity: true,
  direction: true,
  entryDate: true,
  exitDate: true,
  exitPrice: true,
  pnl: true,
  status: true,
  metadata: true,
});

export const insertEventLogSchema = createInsertSchema(eventLogs).pick({
  userId: true,
  eventType: true,
  details: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertContextMemory = z.infer<typeof insertContextMemorySchema>;
export type InsertBrokerConnection = z.infer<typeof insertBrokerConnectionSchema>;
export type InsertTradingPosition = z.infer<typeof insertTradingPositionSchema>;
export type InsertEventLog = z.infer<typeof insertEventLogSchema>;

export type User = typeof users.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type ContextMemory = typeof contextMemory.$inferSelect;
export type BrokerConnection = typeof brokerConnections.$inferSelect;
export type TradingPosition = typeof tradingPositions.$inferSelect;
export type EventLog = typeof eventLogs.$inferSelect;
