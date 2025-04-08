import { pgTable, text, serial, integer, boolean, timestamp, json, jsonb, date } from "drizzle-orm/pg-core";
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

// Alert triggers table for user-defined alerts
export const alertTriggers = pgTable("alert_triggers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  symbol: text("symbol").notNull(),
  alertType: text("alert_type").notNull(), // 'price', 'technical', 'volume', 'news', 'custom'
  condition: text("condition").notNull(), // 'above', 'below', 'crosses', 'percent_change'
  value: text("value").notNull(), // threshold value to trigger the alert
  timeframe: text("timeframe"), // for technical indicators - '1m', '5m', '15m', '1h', '1d', etc.
  indicator: text("indicator"), // 'rsi', 'macd', 'sma', 'ema', etc.
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  notifyVia: text("notify_via").notNull(), // 'app', 'email', 'sms', 'all'
  name: text("name").notNull(),
  description: text("description"),
  lastTriggered: timestamp("last_triggered"),
  cooldownMinutes: integer("cooldown_minutes").default(60), // minimum time between consecutive alerts
  metadata: jsonb("metadata"),
});

// Alert notifications history
export const alertNotifications = pgTable("alert_notifications", {
  id: serial("id").primaryKey(),
  triggerId: integer("trigger_id").notNull(), // reference to alert_triggers
  userId: integer("user_id").notNull(),
  symbol: text("symbol").notNull(),
  triggeredAt: timestamp("triggered_at").notNull().defaultNow(),
  triggerValue: text("trigger_value").notNull(), // the actual value that triggered the alert
  message: text("message").notNull(),
  status: text("status").notNull(), // 'delivered', 'failed', 'pending'
  notificationChannel: text("notification_channel").notNull(), // 'app', 'email', 'sms'
  metadata: jsonb("metadata"),
});

// Badge definitions table - contains the available badge types and requirements
export const badgeDefinitions = pgTable("badge_definitions", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // Unique code for the badge (e.g., 'first_trade', 'profitable_month')
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'achievement', 'milestone', 'streak', 'performance', etc.
  level: integer("level").notNull().default(1), // For tiered badges (bronze, silver, gold)
  maxLevel: integer("max_level").notNull().default(1), // Maximum level this badge can reach
  iconUrl: text("icon_url").notNull(),
  criteria: jsonb("criteria").notNull(), // JSON with threshold values and conditions
  points: integer("points").notNull().default(10), // Points awarded for earning this badge
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata"),
});

// User badges table - tracks which badges users have earned
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  badgeId: integer("badge_id").notNull(), // Reference to badge_definitions
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
  currentLevel: integer("current_level").notNull().default(1),
  progress: jsonb("progress").notNull(), // JSON with progress stats toward next level
  isNew: boolean("is_new").notNull().default(true), // Whether the user has seen this badge yet
  firstEarnedAt: timestamp("first_earned_at").notNull().defaultNow(), // When first earned (doesn't change on level ups)
  metadata: jsonb("metadata"),
});

// Trading goals table - defines personal trading goals that can earn badges
export const tradingGoals = pgTable("trading_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  targetType: text("target_type").notNull(), // 'profit', 'win_rate', 'trade_count', etc.
  targetValue: text("target_value").notNull(), // The numeric goal value
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  progress: jsonb("progress").notNull(), // JSON with current progress stats
  badgeId: integer("badge_id"), // Optional badge to award on completion
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  metadata: jsonb("metadata"),
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

export const insertAlertTriggerSchema = createInsertSchema(alertTriggers).pick({
  userId: true,
  symbol: true,
  alertType: true,
  condition: true,
  value: true,
  timeframe: true,
  indicator: true,
  active: true,
  notifyVia: true,
  name: true,
  description: true,
  cooldownMinutes: true,
  metadata: true,
});

export const insertAlertNotificationSchema = createInsertSchema(alertNotifications).pick({
  triggerId: true,
  userId: true,
  symbol: true,
  triggerValue: true,
  message: true,
  status: true,
  notificationChannel: true,
  metadata: true,
});

// Badge schemas
export const insertBadgeDefinitionSchema = createInsertSchema(badgeDefinitions).pick({
  code: true,
  name: true,
  description: true,
  category: true,
  level: true,
  maxLevel: true,
  iconUrl: true,
  criteria: true,
  points: true,
  isActive: true,
  metadata: true,
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).pick({
  userId: true,
  badgeId: true,
  currentLevel: true,
  progress: true,
  isNew: true,
  metadata: true,
});

export const insertTradingGoalSchema = createInsertSchema(tradingGoals).pick({
  userId: true,
  title: true,
  description: true,
  targetType: true,
  targetValue: true,
  startDate: true,
  endDate: true,
  isCompleted: true,
  completedAt: true,
  progress: true,
  badgeId: true,
  metadata: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertContextMemory = z.infer<typeof insertContextMemorySchema>;
export type InsertBrokerConnection = z.infer<typeof insertBrokerConnectionSchema>;
export type InsertTradingPosition = z.infer<typeof insertTradingPositionSchema>;
export type InsertEventLog = z.infer<typeof insertEventLogSchema>;
export type InsertAlertTrigger = z.infer<typeof insertAlertTriggerSchema>;
export type InsertAlertNotification = z.infer<typeof insertAlertNotificationSchema>;
export type InsertBadgeDefinition = z.infer<typeof insertBadgeDefinitionSchema>;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type InsertTradingGoal = z.infer<typeof insertTradingGoalSchema>;

export type User = typeof users.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type ContextMemory = typeof contextMemory.$inferSelect;
export type BrokerConnection = typeof brokerConnections.$inferSelect;
export type TradingPosition = typeof tradingPositions.$inferSelect;
export type EventLog = typeof eventLogs.$inferSelect;
export type AlertTrigger = typeof alertTriggers.$inferSelect;
export type AlertNotification = typeof alertNotifications.$inferSelect;
export type BadgeDefinition = typeof badgeDefinitions.$inferSelect;
export type UserBadge = typeof userBadges.$inferSelect;
export type TradingGoal = typeof tradingGoals.$inferSelect;
