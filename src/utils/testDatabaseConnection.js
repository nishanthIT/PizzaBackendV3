// Database connection test utility
// Run this to test database connectivity before cart operations

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function testDatabaseConnection() {
  try {
    console.log("🔄 Testing database connection...");
    
    // Simple query to test connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Database connection successful:", result);
    
    // Test if Pizza Builder fields exist in CartItem
    try {
      const cartItemFields = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'CartItem' 
        AND column_name IN ('additionalToppingCost', 'maxToppings')
        ORDER BY column_name;
      `;
      
      if (cartItemFields.length === 2) {
        console.log("✅ Pizza Builder cart fields exist:", cartItemFields);
      } else {
        console.log("⚠️ Pizza Builder cart fields missing. Current fields:", cartItemFields);
        console.log("   Please run the migration: manual_add_pizza_builder_cart_fields.sql");
      }
    } catch (schemaError) {
      console.log("⚠️ Could not check Pizza Builder fields:", schemaError.message);
    }
    
    return { connected: true, error: null };
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    return { connected: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDatabaseConnection().then(result => {
    process.exit(result.connected ? 0 : 1);
  });
}