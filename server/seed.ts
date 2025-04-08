import { db } from './db';
import { users } from '@shared/schema';

// Import eq operator from drizzle-orm
import { eq } from 'drizzle-orm';

/**
 * Seeds the database with initial data
 */
async function seedDatabase() {
  console.log('Seeding database...');
  
  // Check if default user already exists
  const existingUser = await db.select().from(users).where(eq(users.username, 'trader'));
  
  if (existingUser.length === 0) {
    // Create a default user
    await db.insert(users).values({
      username: "trader",
      password: "password",
      name: "Trader",
      email: "trader@example.com",
      preferences: {
        riskLevel: "moderate",
        tradingStyle: "swing",
        favoriteStocks: ["HDFCBANK", "INFY", "RELIANCE"],
      },
      createdAt: new Date(),
    });
    console.log('Default user created');
  } else {
    console.log('Default user already exists');
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