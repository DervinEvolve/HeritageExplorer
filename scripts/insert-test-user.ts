import { db } from "../db";
import { users } from "@db/schema";

async function insertTestUser() {
  try {
    // Check if user with ID 1 already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, 1)
    });

    if (existingUser) {
      console.log("Test user already exists with ID 1:", existingUser);
      process.exit(0);
    }

    // Insert a test user
    const insertedUser = await db.insert(users).values({
      firebaseId: "test-user-id",
      name: "Demo User",
      email: "demo@example.com",
      interests: ["Ancient Civilizations", "Cultural Traditions", "Historical Artifacts"]
    }).returning();

    console.log("Test user created successfully:", insertedUser[0]);
  } catch (error) {
    console.error("Error inserting test user:", error);
    process.exit(1);
  }
}

// Run the function
insertTestUser();