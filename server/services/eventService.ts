import { EventLog, InsertEventLog } from "@shared/schema";
import { storage } from "../storage";

/**
 * Creates an event log for tracking user actions and system events
 * 
 * @param log Event data to be recorded
 * @returns The created event log
 */
export async function createEventLog(log: InsertEventLog): Promise<EventLog> {
  return await storage.createEventLog(log);
}

/**
 * Get recent event logs for a user
 * 
 * @param userId User ID to fetch logs for
 * @param limit Maximum number of logs to return (default 50)
 * @returns Array of event logs
 */
export async function getRecentEventLogs(userId: number, limit: number = 50): Promise<EventLog[]> {
  return await storage.getEventLogs(userId, limit);
}

/**
 * Get event logs filtered by type
 * 
 * @param userId User ID to fetch logs for
 * @param eventType Type of events to retrieve (e.g., 'badge_awarded', 'trade_executed')
 * @param limit Maximum number of logs to return (default 20)
 * @returns Array of filtered event logs
 */
export async function getEventLogsByType(userId: number, eventType: string, limit: number = 20): Promise<EventLog[]> {
  const logs = await storage.getEventLogs(userId, 100); // Get more logs than needed to filter
  return logs
    .filter(log => log.eventType === eventType)
    .slice(0, limit);
}

/**
 * Get event logs related to badges (awarded or upgraded)
 * 
 * @param userId User ID to fetch badge events for
 * @param limit Maximum number of logs to return (default 20)
 * @returns Array of badge-related event logs
 */
export async function getBadgeEvents(userId: number, limit: number = 20): Promise<EventLog[]> {
  const logs = await storage.getEventLogs(userId, 100); // Get more logs than needed to filter
  return logs
    .filter(log => log.eventType === 'badge_awarded' || log.eventType === 'badge_upgrade')
    .slice(0, limit);
}

/**
 * Get event logs related to trading goals (created, updated, completed)
 * 
 * @param userId User ID to fetch goal events for
 * @param limit Maximum number of logs to return (default 20)
 * @returns Array of goal-related event logs
 */
export async function getGoalEvents(userId: number, limit: number = 20): Promise<EventLog[]> {
  const logs = await storage.getEventLogs(userId, 100); // Get more logs than needed to filter
  return logs
    .filter(log => 
      log.eventType === 'goal_created' || 
      log.eventType === 'goal_updated' || 
      log.eventType === 'goal_completed'
    )
    .slice(0, limit);
}