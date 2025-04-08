import { 
  BadgeDefinition, 
  InsertBadgeDefinition,
  InsertUserBadge, 
  TradingGoal, 
  UserBadge, 
  TradingPosition 
} from "@shared/schema";
import { storage } from "../storage";
import { createEventLog } from "../services/eventService";

export interface BadgeCondition {
  type: string;                   // 'trade_count', 'profit_target', 'win_rate', etc.
  target: number;                 // Numeric target to achieve
  timeframe?: string;             // Optional timeframe: 'day', 'week', 'month', 'all_time'
  extras?: Record<string, any>;   // Additional condition parameters
}

/**
 * Creates a standard badge definition in the system
 */
export async function createBadgeDefinition(badge: InsertBadgeDefinition): Promise<BadgeDefinition> {
  return await storage.createBadgeDefinition(badge);
}

/**
 * Awards a badge to a user if they don't already have it
 * or upgrades an existing badge if they've reached the next level
 */
export async function awardBadge(userId: number, badgeCode: string): Promise<UserBadge | null> {
  // Find the badge definition
  const badgeDefinition = await storage.getBadgeDefinitionByCode(badgeCode);
  
  if (!badgeDefinition) {
    console.error(`Badge with code ${badgeCode} not found`);
    return null;
  }
  
  // Check if user already has this badge
  const existingBadge = await getUserBadgeByDefinitionId(userId, badgeDefinition.id);
  
  if (existingBadge) {
    // User already has this badge, check if it can be upgraded
    if (existingBadge.currentLevel < badgeDefinition.maxLevel) {
      // Upgrade the badge
      const updatedBadge = await storage.updateUserBadge(existingBadge.id, {
        currentLevel: existingBadge.currentLevel + 1,
        isNew: true
      });
      
      // Log the badge upgrade
      await createEventLog({
        userId,
        eventType: 'badge_upgrade',
        details: {
          badgeId: badgeDefinition.id,
          badgeCode: badgeDefinition.code,
          badgeName: badgeDefinition.name,
          newLevel: updatedBadge.currentLevel
        }
      });
      
      return updatedBadge;
    }
    
    // Badge is already at max level
    return existingBadge;
  }
  
  // Create new badge for user
  const userBadge: InsertUserBadge = {
    userId,
    badgeId: badgeDefinition.id,
    currentLevel: 1,
    progress: {},
    isNew: true,
    metadata: {}
  };
  
  const newBadge = await storage.createUserBadge(userBadge);
  
  // Log the badge award
  await createEventLog({
    userId,
    eventType: 'badge_awarded',
    details: {
      badgeId: badgeDefinition.id,
      badgeCode: badgeDefinition.code,
      badgeName: badgeDefinition.name
    }
  });
  
  return newBadge;
}

/**
 * Helper function to get a user badge by badge definition ID
 */
export async function getUserBadgeByDefinitionId(userId: number, badgeId: number): Promise<UserBadge | undefined> {
  return await storage.getUserBadgeByBadgeId(userId, badgeId);
}

/**
 * Get all badges for a user
 */
export async function getUserBadges(userId: number): Promise<UserBadge[]> {
  return await storage.getUserBadges(userId);
}

/**
 * Mark a badge as seen (no longer new)
 */
export async function markBadgeAsSeen(badgeId: number): Promise<UserBadge> {
  return await storage.markUserBadgeAsSeen(badgeId);
}

/**
 * Check if trading position qualifies for any badge awards
 * Call this whenever a position is closed to check for potential badges
 */
export async function checkPositionForBadges(userId: number, position: TradingPosition): Promise<UserBadge[]> {
  const awardedBadges: UserBadge[] = [];
  
  // Only process closed trades
  if (position.status !== 'closed' || !position.exitPrice || !position.pnl) {
    return awardedBadges;
  }
  
  // Get all positions for the user
  const allPositions = await storage.getTradingPositions(userId);
  const closedPositions = allPositions.filter(p => p.status === 'closed' && p.exitPrice && p.pnl);
  
  // First Trade Badge
  if (closedPositions.length === 1) {
    const firstTradeBadge = await awardBadge(userId, 'first_trade');
    if (firstTradeBadge) {
      awardedBadges.push(firstTradeBadge);
    }
  }
  
  // Profitable Trade Badge
  const pnlValue = parseFloat(position.pnl);
  if (pnlValue > 0) {
    const profitableTradeBadge = await awardBadge(userId, 'profitable_trade');
    if (profitableTradeBadge) {
      awardedBadges.push(profitableTradeBadge);
    }
    
    // Large Profit Badge (over 10%)
    const entryValue = parseFloat(position.entryPrice) * position.quantity;
    const profitPercentage = (pnlValue / entryValue) * 100;
    
    if (profitPercentage >= 10) {
      const largeWinBadge = await awardBadge(userId, 'large_win');
      if (largeWinBadge) {
        awardedBadges.push(largeWinBadge);
      }
    }
  }
  
  // Trading Volume Badge
  const totalTrades = closedPositions.length;
  if (totalTrades >= 5) {
    const activeTradeBadge = await awardBadge(userId, 'active_trader');
    if (activeTradeBadge) {
      awardedBadges.push(activeTradeBadge);
    }
  }
  
  if (totalTrades >= 20) {
    const serialTradeBadge = await awardBadge(userId, 'serial_trader');
    if (serialTradeBadge) {
      awardedBadges.push(serialTradeBadge);
    }
  }
  
  // Win Rate Badge
  const winners = closedPositions.filter(p => p.pnl && parseFloat(p.pnl) > 0);
  const winRate = (winners.length / closedPositions.length) * 100;
  
  if (closedPositions.length >= 10 && winRate >= 60) {
    const winRateBadge = await awardBadge(userId, 'win_rate_champion');
    if (winRateBadge) {
      awardedBadges.push(winRateBadge);
    }
  }
  
  return awardedBadges;
}

/**
 * Check if goal achievement qualifies for any badge awards
 * Call this whenever a goal is completed
 */
export async function checkGoalForBadges(userId: number, goal: TradingGoal): Promise<UserBadge[]> {
  const awardedBadges: UserBadge[] = [];
  
  // Only process completed goals
  if (!goal.isCompleted) {
    return awardedBadges;
  }
  
  // Award Goal Achiever badge for completing a goal
  const goalBadge = await awardBadge(userId, 'goal_achiever');
  if (goalBadge) {
    awardedBadges.push(goalBadge);
  }
  
  // Check if there's a specific badge to award for this goal
  if (goal.badgeId) {
    const badgeDefinition = await storage.getBadgeDefinition(goal.badgeId);
    if (badgeDefinition && badgeDefinition.code) {
      const specificBadge = await awardBadge(userId, badgeDefinition.code);
      if (specificBadge) {
        awardedBadges.push(specificBadge);
      }
    }
  }
  
  // Get all goals for the user
  const completedGoals = await storage.getTradingGoals(userId, true);
  
  // Multiple Goals Badge
  if (completedGoals.length >= 3) {
    const multiGoalBadge = await awardBadge(userId, 'goal_master');
    if (multiGoalBadge) {
      awardedBadges.push(multiGoalBadge);
    }
  }
  
  return awardedBadges;
}

/**
 * Create and seed initial badge definitions for the system
 * This should be called during system setup
 */
export async function seedBadgeDefinitions(): Promise<void> {
  // Format for badges:
  // - code: unique identifier
  // - name: display name
  // - description: explains how to earn
  // - category: grouping (achievement, milestone, streak, performance)
  // - level: current tier (1, 2, 3...)
  // - maxLevel: max tier achievable 
  // - iconUrl: path to badge icon
  // - criteria: JSON with requirements
  // - points: value awarded to user

  const badges: InsertBadgeDefinition[] = [
    {
      code: 'first_trade',
      name: 'First Trade',
      description: 'Completed your first trade',
      category: 'milestone',
      level: 1,
      maxLevel: 1,
      iconUrl: '/assets/badges/first_trade.svg',
      criteria: { type: 'trade_count', target: 1 },
      points: 10,
      isActive: true,
    },
    {
      code: 'profitable_trade',
      name: 'Profitable Trade',
      description: 'Completed a trade with profit',
      category: 'achievement',
      level: 1,
      maxLevel: 1,
      iconUrl: '/assets/badges/profitable_trade.svg',
      criteria: { type: 'profit', target: 0.01 },
      points: 15,
      isActive: true,
    },
    {
      code: 'large_win',
      name: 'Large Win',
      description: 'Achieved a 10%+ profit on a single trade',
      category: 'achievement',
      level: 1,
      maxLevel: 3,
      iconUrl: '/assets/badges/large_win.svg',
      criteria: { type: 'profit_percentage', target: 10 },
      points: 30,
      isActive: true,
    },
    {
      code: 'active_trader',
      name: 'Active Trader',
      description: 'Completed 5 or more trades',
      category: 'milestone',
      level: 1,
      maxLevel: 1,
      iconUrl: '/assets/badges/active_trader.svg',
      criteria: { type: 'trade_count', target: 5 },
      points: 20,
      isActive: true,
    },
    {
      code: 'serial_trader',
      name: 'Serial Trader',
      description: 'Completed 20 or more trades',
      category: 'milestone',
      level: 1,
      maxLevel: 1,
      iconUrl: '/assets/badges/serial_trader.svg',
      criteria: { type: 'trade_count', target: 20 },
      points: 40,
      isActive: true,
    },
    {
      code: 'win_rate_champion',
      name: 'Win Rate Champion',
      description: 'Maintained a 60%+ win rate over at least 10 trades',
      category: 'performance',
      level: 1,
      maxLevel: 3,
      iconUrl: '/assets/badges/win_rate_champion.svg',
      criteria: { 
        type: 'win_rate', 
        target: 60,
        extras: { minimum_trades: 10 }
      },
      points: 50,
      isActive: true,
    },
    {
      code: 'goal_achiever',
      name: 'Goal Achiever',
      description: 'Completed a trading goal',
      category: 'achievement',
      level: 1,
      maxLevel: 1,
      iconUrl: '/assets/badges/goal_achiever.svg',
      criteria: { type: 'goal_completion', target: 1 },
      points: 25,
      isActive: true,
    },
    {
      code: 'goal_master',
      name: 'Goal Master',
      description: 'Completed 3 or more trading goals',
      category: 'achievement',
      level: 1,
      maxLevel: 3,
      iconUrl: '/assets/badges/goal_master.svg',
      criteria: { type: 'goal_completion', target: 3 },
      points: 50,
      isActive: true,
    },
    {
      code: 'risk_manager',
      name: 'Risk Manager',
      description: 'Set stop-loss orders on 5 consecutive trades',
      category: 'performance',
      level: 1,
      maxLevel: 1,
      iconUrl: '/assets/badges/risk_manager.svg',
      criteria: { 
        type: 'consistent_behavior', 
        target: 5,
        extras: { behavior: 'stop_loss' }
      },
      points: 30,
      isActive: true,
    },
    {
      code: 'profit_streak',
      name: 'Profit Streak',
      description: 'Achieved 3 profitable trades in a row',
      category: 'streak',
      level: 1,
      maxLevel: 3,
      iconUrl: '/assets/badges/profit_streak.svg',
      criteria: { type: 'consecutive_profits', target: 3 },
      points: 40,
      isActive: true,
    }
  ];
  
  // Check each badge if it exists already, only insert if it doesn't
  for (const badge of badges) {
    const existing = await storage.getBadgeDefinitionByCode(badge.code);
    if (!existing) {
      await storage.createBadgeDefinition(badge);
    }
  }
}