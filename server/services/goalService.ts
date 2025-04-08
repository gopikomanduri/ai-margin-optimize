import { TradingGoal, InsertTradingGoal, TradingPosition } from "@shared/schema";
import { storage } from "../storage";
import { createEventLog } from "./eventService";
import { checkGoalForBadges } from "./badgeService";

/**
 * Create a new trading goal for a user
 */
export async function createGoal(goal: InsertTradingGoal): Promise<TradingGoal> {
  const newGoal = await storage.createTradingGoal(goal);
  
  // Log goal creation
  await createEventLog({
    userId: goal.userId,
    eventType: 'goal_created',
    details: {
      goalId: newGoal.id,
      title: newGoal.title,
      targetType: newGoal.targetType,
      targetValue: newGoal.targetValue
    }
  });
  
  return newGoal;
}

/**
 * Update an existing trading goal
 */
export async function updateGoal(id: number, goal: Partial<InsertTradingGoal>): Promise<TradingGoal> {
  const updatedGoal = await storage.updateTradingGoal(id, goal);
  
  // Log goal update
  await createEventLog({
    userId: updatedGoal.userId,
    eventType: 'goal_updated',
    details: {
      goalId: updatedGoal.id,
      title: updatedGoal.title,
      changes: Object.keys(goal)
    }
  });
  
  return updatedGoal;
}

/**
 * Mark a trading goal as completed
 */
export async function completeGoal(id: number): Promise<TradingGoal> {
  const completedGoal = await storage.completeTradingGoal(id);
  
  // Log goal completion
  await createEventLog({
    userId: completedGoal.userId,
    eventType: 'goal_completed',
    details: {
      goalId: completedGoal.id,
      title: completedGoal.title,
      completedAt: completedGoal.completedAt
    }
  });
  
  // Check if any badges should be awarded for goal completion
  await checkGoalForBadges(completedGoal.userId, completedGoal);
  
  return completedGoal;
}

/**
 * Get all trading goals for a user
 */
export async function getUserGoals(userId: number, isCompleted?: boolean): Promise<TradingGoal[]> {
  return await storage.getTradingGoals(userId, isCompleted);
}

/**
 * Get a single trading goal by ID
 */
export async function getGoal(id: number): Promise<TradingGoal | undefined> {
  return await storage.getTradingGoal(id);
}

/**
 * Update progress on trading goals based on a trading position
 * This should be called whenever a position is updated or closed
 */
export async function updateGoalProgress(userId: number, position: TradingPosition): Promise<void> {
  // Only process closed trades
  if (position.status !== 'closed' || !position.exitPrice || !position.pnl) {
    return;
  }
  
  // Get active (not completed) goals for the user
  const activeGoals = await storage.getTradingGoals(userId, false);
  
  // Get all positions to calculate progress
  const allPositions = await storage.getTradingPositions(userId);
  const closedPositions = allPositions.filter(p => p.status === 'closed' && p.exitPrice && p.pnl);
  
  // For each goal, check if it should be updated based on this position
  for (const goal of activeGoals) {
    let shouldUpdate = false;
    let currentProgress: any = goal.progress || {};
    let isGoalCompleted = false;
    
    switch (goal.targetType) {
      case 'trade_count':
        // Trading count goal - count number of trades
        const targetCount = parseInt(goal.targetValue);
        currentProgress.currentCount = closedPositions.length;
        shouldUpdate = true;
        isGoalCompleted = currentProgress.currentCount >= targetCount;
        break;
        
      case 'profit_target':
        // Profit target goal - sum total profits
        const targetProfit = parseFloat(goal.targetValue);
        const totalProfit = closedPositions.reduce((sum, pos) => 
          sum + (pos.pnl ? parseFloat(pos.pnl) : 0), 0);
        currentProgress.currentProfit = totalProfit;
        shouldUpdate = true;
        isGoalCompleted = totalProfit >= targetProfit;
        break;
        
      case 'win_rate':
        // Win rate goal - calculate percentage of winning trades
        const targetWinRate = parseFloat(goal.targetValue);
        if (closedPositions.length >= 5) { // Require at least 5 trades for win rate goal
          const winners = closedPositions.filter(p => p.pnl && parseFloat(p.pnl) > 0);
          const winRate = (winners.length / closedPositions.length) * 100;
          currentProgress.currentWinRate = winRate;
          currentProgress.winCount = winners.length;
          currentProgress.totalCount = closedPositions.length;
          shouldUpdate = true;
          isGoalCompleted = winRate >= targetWinRate;
        }
        break;
        
      case 'consecutive_profits':
        // Consecutive profits goal - check for streak
        const targetStreak = parseInt(goal.targetValue);
        const orderedPositions = [...closedPositions].sort(
          (a, b) => new Date(b.exitDate!).getTime() - new Date(a.exitDate!).getTime()
        );
        
        let currentStreak = 0;
        for (const pos of orderedPositions) {
          if (pos.pnl && parseFloat(pos.pnl) > 0) {
            currentStreak++;
          } else {
            break; // Streak is broken
          }
        }
        
        currentProgress.currentStreak = currentStreak;
        shouldUpdate = true;
        isGoalCompleted = currentStreak >= targetStreak;
        break;
        
      case 'specific_symbol':
        // Goal for trading a specific symbol
        const targetSymbol = goal.targetValue;
        if (position.symbol === targetSymbol) {
          currentProgress.tradesWithSymbol = (currentProgress.tradesWithSymbol || 0) + 1;
          shouldUpdate = true;
          const targetTrades = goal.progress ? (goal.progress as any).targetTrades || 1 : 1;
          isGoalCompleted = currentProgress.tradesWithSymbol >= targetTrades;
        }
        break;
    }
    
    if (shouldUpdate) {
      // Update the goal's progress
      await storage.updateTradingGoal(goal.id, {
        progress: currentProgress
      });
      
      // If goal is completed, mark it as such
      if (isGoalCompleted && !goal.isCompleted) {
        await completeGoal(goal.id);
      }
    }
  }
}

/**
 * Create default trading goals for a new user
 */
export async function createDefaultGoals(userId: number): Promise<TradingGoal[]> {
  const today = new Date();
  const oneMonthLater = new Date();
  oneMonthLater.setMonth(today.getMonth() + 1);
  
  const defaultGoals: InsertTradingGoal[] = [
    {
      userId,
      title: 'Complete 5 Trades',
      description: 'Execute and close 5 trades to build experience',
      targetType: 'trade_count',
      targetValue: '5',
      startDate: today.toISOString().split('T')[0],
      endDate: oneMonthLater.toISOString().split('T')[0],
      isCompleted: false,
      progress: { currentCount: 0 },
      metadata: {}
    },
    {
      userId,
      title: 'Achieve 55% Win Rate',
      description: 'Maintain a win rate of at least 55% across your trades',
      targetType: 'win_rate',
      targetValue: '55',
      startDate: today.toISOString().split('T')[0],
      endDate: oneMonthLater.toISOString().split('T')[0],
      isCompleted: false,
      progress: { currentWinRate: 0, winCount: 0, totalCount: 0 },
      metadata: {}
    },
    {
      userId,
      title: '3 Profitable Trades in a Row',
      description: 'Achieve 3 consecutive profitable trades',
      targetType: 'consecutive_profits',
      targetValue: '3',
      startDate: today.toISOString().split('T')[0],
      endDate: oneMonthLater.toISOString().split('T')[0],
      isCompleted: false,
      progress: { currentStreak: 0 },
      metadata: {}
    }
  ];
  
  const createdGoals: TradingGoal[] = [];
  
  // Create each default goal
  for (const goal of defaultGoals) {
    const createdGoal = await createGoal(goal);
    createdGoals.push(createdGoal);
  }
  
  return createdGoals;
}