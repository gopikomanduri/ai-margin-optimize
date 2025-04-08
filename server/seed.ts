import { db } from './db';
import { users, alertTriggers, alertNotifications } from '@shared/schema';

// Import eq operator from drizzle-orm
import { eq, sql } from 'drizzle-orm';

/**
 * Seeds the database with initial data
 */
async function seedDatabase() {
  console.log('Seeding database...');
  
  // Check if default user already exists
  const existingUser = await db.select().from(users).where(eq(users.username, 'trader'));
  
  let userId = 1;
  
  if (existingUser.length === 0) {
    // Create a default user
    const result = await db.insert(users).values({
      username: "trader",
      password: "password",
      name: "Trader",
      email: "trader@example.com",
      preferences: {
        riskLevel: "moderate",
        tradingStyle: "swing",
        favoriteStocks: ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"],
      },
      createdAt: new Date(),
    }).returning();
    
    userId = result[0].id;
    console.log('Default user created with ID:', userId);
  } else {
    userId = existingUser[0].id;
    console.log('Default user already exists with ID:', userId);
  }
  
  // Check if we already have alerts for this user
  const existingAlerts = await db.select({ count: sql<number>`count(*)` }).from(alertTriggers).where(eq(alertTriggers.userId, userId));
  
  if (existingAlerts[0].count === 0) {
    // Create sample alerts
    const sampleAlerts = [
      {
        userId,
        symbol: "AAPL",
        alertType: "price",
        condition: "above",
        value: "180.00",
        active: true,
        notifyVia: "app",
        name: "AAPL Price Rise Alert",
        description: "Alert when Apple stock rises above $180",
        cooldownMinutes: 60,
        createdAt: new Date()
      },
      {
        userId,
        symbol: "MSFT",
        alertType: "price",
        condition: "below",
        value: "320.00",
        active: true,
        notifyVia: "app",
        name: "MSFT Price Drop Alert",
        description: "Alert when Microsoft stock falls below $320",
        cooldownMinutes: 60,
        createdAt: new Date()
      },
      {
        userId,
        symbol: "TSLA",
        alertType: "technical",
        condition: "below",
        value: "30",
        timeframe: "1d",
        indicator: "rsi",
        active: true,
        notifyVia: "all",
        name: "TSLA RSI Oversold Alert",
        description: "Alert when Tesla's RSI falls below 30 (oversold)",
        cooldownMinutes: 120,
        createdAt: new Date()
      },
      {
        userId,
        symbol: "AMZN",
        alertType: "volume",
        condition: "above",
        value: "15000000",
        active: true,
        notifyVia: "email",
        name: "AMZN High Volume Alert",
        description: "Alert when Amazon's trading volume exceeds 15M",
        cooldownMinutes: 240,
        createdAt: new Date()
      },
      {
        userId,
        symbol: "GOOGL",
        alertType: "technical",
        condition: "crosses",
        value: "0",
        timeframe: "1d",
        indicator: "macd",
        active: true,
        notifyVia: "app",
        name: "GOOGL MACD Crossover",
        description: "Alert when Google's MACD line crosses signal line",
        cooldownMinutes: 1440,
        createdAt: new Date()
      }
    ];
    
    const alertInsertResult = await db.insert(alertTriggers).values(sampleAlerts).returning();
    console.log(`Created ${alertInsertResult.length} sample alerts`);
    
    // Create sample notifications (some triggered alerts)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const threeHoursAgo = new Date();
    threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);
    
    const sampleNotifications = [
      {
        triggerId: alertInsertResult[0].id,
        userId,
        symbol: "AAPL",
        triggeredAt: yesterday,
        triggerValue: "182.50",
        message: "AAPL price has risen above $180.00 to $182.50",
        status: "delivered" as const,
        notificationChannel: "app" as const
      },
      {
        triggerId: alertInsertResult[2].id,
        userId,
        symbol: "TSLA",
        triggeredAt: threeHoursAgo,
        triggerValue: "28.5",
        message: "TSLA RSI has fallen below 30 to 28.5 (oversold condition)",
        status: "delivered" as const,
        notificationChannel: "app" as const
      }
    ];
    
    const notificationInsertResult = await db.insert(alertNotifications).values(sampleNotifications).returning();
    console.log(`Created ${notificationInsertResult.length} sample notifications`);
  } else {
    console.log(`User already has ${existingAlerts[0].count} alerts`);
  }
}

// If this is the main module (direct execution)
const isMainModule = import.meta.url.endsWith(process.argv[1]);

if (isMainModule) {
  // Run the seed function
  seedDatabase()
    .then(() => {
      console.log('Database seeding complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding database:', error);
      process.exit(1);
    });
}

// Export for use in other modules
export default seedDatabase;