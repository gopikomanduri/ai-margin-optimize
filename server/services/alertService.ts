/**
 * Alert Service
 * 
 * This service manages the creation, checking, and triggering of user alerts 
 * for various market conditions, such as price movements, technical indicators, etc.
 */
import { db } from "../db";
import { storage } from "../storage";
import { eq, and, gt, lt, lte, gte, ne, isNull, isNotNull } from "drizzle-orm";
import { 
  AlertTrigger, 
  InsertAlertTrigger, 
  alertTriggers, 
  AlertNotification, 
  InsertAlertNotification, 
  alertNotifications 
} from "@shared/schema";

// Interface for price data used to check alerts
interface PriceData {
  symbol: string;
  price: number;
  timestamp: Date;
  high?: number;
  low?: number;
  open?: number;
  volume?: number;
}

interface TechnicalIndicatorData {
  symbol: string;
  indicator: string;
  value: number;
  timestamp: Date;
  timeframe: string;
}

/**
 * Fetch active alerts for a specific user
 */
export async function getAlertsByUser(userId: number): Promise<AlertTrigger[]> {
  return db.select().from(alertTriggers).where(and(
    eq(alertTriggers.userId, userId),
    eq(alertTriggers.active, true)
  ));
}

/**
 * Fetch all alerts for a specific symbol
 */
export async function getAlertsBySymbol(symbol: string): Promise<AlertTrigger[]> {
  return db.select().from(alertTriggers).where(and(
    eq(alertTriggers.symbol, symbol),
    eq(alertTriggers.active, true)
  ));
}

/**
 * Create a new alert trigger
 */
export async function createAlert(alertData: InsertAlertTrigger): Promise<AlertTrigger> {
  const [newAlert] = await db.insert(alertTriggers).values(alertData).returning();
  return newAlert;
}

/**
 * Update an existing alert
 */
export async function updateAlert(id: number, userId: number, alertData: Partial<InsertAlertTrigger>): Promise<AlertTrigger | null> {
  // Ensure user can only update their own alerts
  const [updatedAlert] = await db.update(alertTriggers)
    .set(alertData)
    .where(and(
      eq(alertTriggers.id, id),
      eq(alertTriggers.userId, userId)
    ))
    .returning();
  
  return updatedAlert || null;
}

/**
 * Delete an alert
 */
export async function deleteAlert(id: number, userId: number): Promise<boolean> {
  // Soft delete by setting active to false
  const [result] = await db.update(alertTriggers)
    .set({ active: false })
    .where(and(
      eq(alertTriggers.id, id),
      eq(alertTriggers.userId, userId)
    ))
    .returning();
  
  return !!result;
}

/**
 * Get alerts history/notifications for a user
 */
export async function getAlertNotifications(userId: number, limit = 50): Promise<AlertNotification[]> {
  return db.select().from(alertNotifications)
    .where(eq(alertNotifications.userId, userId))
    .orderBy(alertNotifications.triggeredAt)
    .limit(limit);
}

/**
 * Create a notification when an alert is triggered
 */
export async function createAlertNotification(notificationData: InsertAlertNotification): Promise<AlertNotification> {
  const [newNotification] = await db.insert(alertNotifications).values(notificationData).returning();
  return newNotification;
}

/**
 * Check if the given price data triggers any alerts for the symbol
 */
export async function checkPriceAlerts(priceData: PriceData): Promise<AlertTrigger[]> {
  // Get all active price alerts for this symbol
  const alerts = await db.select().from(alertTriggers).where(and(
    eq(alertTriggers.symbol, priceData.symbol),
    eq(alertTriggers.active, true),
    eq(alertTriggers.alertType, 'price')
  ));

  const triggeredAlerts: AlertTrigger[] = [];

  for (const alert of alerts) {
    let triggered = false;
    const { condition, value } = alert;
    const thresholdValue = parseFloat(value);
    
    // Check if the current price matches the alert condition
    switch (condition) {
      case 'above':
        triggered = priceData.price > thresholdValue;
        break;
      case 'below':
        triggered = priceData.price < thresholdValue;
        break;
      case 'percent_change':
        // For percent_change alerts, we would need previous price data
        // This is a simplified implementation
        if (priceData.open) {
          const percentChange = ((priceData.price - priceData.open) / priceData.open) * 100;
          triggered = Math.abs(percentChange) >= thresholdValue;
        }
        break;
      case 'crosses':
        // For 'crosses' alerts, we would need previous price data
        // This is a simplified implementation where we check if the current price is close to the threshold
        triggered = Math.abs(priceData.price - thresholdValue) / thresholdValue < 0.001;
        break;
    }

    // Check cooldown period
    if (triggered) {
      const now = new Date();
      // Use nullish coalescing to provide a default value of 60 if cooldownMinutes is null
      const cooldownMinutes = alert.cooldownMinutes ?? 60;
      
      // If lastTriggered is null or cooldown period has passed, we can trigger
      if (!alert.lastTriggered || 
          (now.getTime() - new Date(alert.lastTriggered).getTime()) > (cooldownMinutes * 60 * 1000)) {
        
        // Update last triggered time
        await db.update(alertTriggers)
          .set({ lastTriggered: now })
          .where(eq(alertTriggers.id, alert.id));
        
        // Add to triggered alerts list
        triggeredAlerts.push(alert);
        
        // Create a notification
        await createAlertNotification({
          triggerId: alert.id,
          userId: alert.userId,
          symbol: alert.symbol,
          triggerValue: priceData.price.toString(),
          message: generateAlertMessage(alert, priceData.price),
          status: 'delivered',
          notificationChannel: alert.notifyVia,
        });
      }
    }
  }

  return triggeredAlerts;
}

/**
 * Check if the given technical indicator data triggers any alerts
 */
export async function checkTechnicalAlerts(indicatorData: TechnicalIndicatorData): Promise<AlertTrigger[]> {
  // Get all active technical alerts for this symbol, indicator and timeframe
  const alerts = await db.select().from(alertTriggers).where(and(
    eq(alertTriggers.symbol, indicatorData.symbol),
    eq(alertTriggers.active, true),
    eq(alertTriggers.alertType, 'technical'),
    eq(alertTriggers.indicator, indicatorData.indicator),
    eq(alertTriggers.timeframe, indicatorData.timeframe)
  ));

  const triggeredAlerts: AlertTrigger[] = [];

  for (const alert of alerts) {
    let triggered = false;
    const { condition, value } = alert;
    const thresholdValue = parseFloat(value);
    
    // Check if the current indicator value matches the alert condition
    switch (condition) {
      case 'above':
        triggered = indicatorData.value > thresholdValue;
        break;
      case 'below':
        triggered = indicatorData.value < thresholdValue;
        break;
      case 'crosses':
        // For 'crosses' alerts, we would need previous indicator value
        // This is a simplified implementation where we check if the current value is close to the threshold
        triggered = Math.abs(indicatorData.value - thresholdValue) / thresholdValue < 0.01;
        break;
    }

    // Check cooldown period
    if (triggered) {
      const now = new Date();
      // Use nullish coalescing to provide a default value of 60 if cooldownMinutes is null
      const cooldownMinutes = alert.cooldownMinutes ?? 60;
      
      // If lastTriggered is null or cooldown period has passed, we can trigger
      if (!alert.lastTriggered || 
          (now.getTime() - new Date(alert.lastTriggered).getTime()) > (cooldownMinutes * 60 * 1000)) {
        
        // Update last triggered time
        await db.update(alertTriggers)
          .set({ lastTriggered: now })
          .where(eq(alertTriggers.id, alert.id));
        
        // Add to triggered alerts list
        triggeredAlerts.push(alert);
        
        // Create a notification
        await createAlertNotification({
          triggerId: alert.id,
          userId: alert.userId,
          symbol: alert.symbol,
          triggerValue: indicatorData.value.toString(),
          message: generateTechnicalAlertMessage(alert, indicatorData.value),
          status: 'delivered',
          notificationChannel: alert.notifyVia,
        });
      }
    }
  }

  return triggeredAlerts;
}

/**
 * Generate a user-friendly message for price alerts
 */
function generateAlertMessage(alert: AlertTrigger, currentPrice: number): string {
  const symbol = alert.symbol;
  const thresholdValue = parseFloat(alert.value);
  
  let message = `${alert.name}: ${symbol} `;
  
  switch (alert.condition) {
    case 'above':
      message += `is now above ${thresholdValue} (Current: ${currentPrice.toFixed(2)})`;
      break;
    case 'below':
      message += `is now below ${thresholdValue} (Current: ${currentPrice.toFixed(2)})`;
      break;
    case 'percent_change':
      message += `has changed by ${thresholdValue}% or more (Current: ${currentPrice.toFixed(2)})`;
      break;
    case 'crosses':
      message += `has crossed the ${thresholdValue} level (Current: ${currentPrice.toFixed(2)})`;
      break;
    default:
      message += `alert triggered at ${currentPrice.toFixed(2)}`;
  }
  
  if (alert.description) {
    message += `. ${alert.description}`;
  }
  
  return message;
}

/**
 * Generate a user-friendly message for technical indicator alerts
 */
function generateTechnicalAlertMessage(alert: AlertTrigger, currentValue: number): string {
  const symbol = alert.symbol;
  const thresholdValue = parseFloat(alert.value);
  const indicator = alert.indicator?.toUpperCase() || 'Indicator';
  const timeframe = alert.timeframe || '';
  
  let message = `${alert.name}: ${symbol} ${timeframe} ${indicator} `;
  
  switch (alert.condition) {
    case 'above':
      message += `is now above ${thresholdValue} (Current: ${currentValue.toFixed(2)})`;
      break;
    case 'below':
      message += `is now below ${thresholdValue} (Current: ${currentValue.toFixed(2)})`;
      break;
    case 'crosses':
      message += `has crossed the ${thresholdValue} level (Current: ${currentValue.toFixed(2)})`;
      break;
    default:
      message += `alert triggered at ${currentValue.toFixed(2)}`;
  }
  
  if (alert.description) {
    message += `. ${alert.description}`;
  }
  
  return message;
}