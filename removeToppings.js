import prisma from "./src/lib/prisma.js";

async function removeToppings() {
  try {
    console.log("🗑️ Starting topping removal...");

    // First, get all toppings to see what we have
    const allToppings = await prisma.toppingsList.findMany();
    console.log(`📊 Found ${allToppings.length} toppings in database`);

    if (allToppings.length === 0) {
      console.log("✅ No toppings found to remove");
      return;
    }

    // Remove all default toppings first (due to foreign key constraints)
    console.log("🔗 Removing default topping relations...");
    const deletedDefaultToppings = await prisma.defaultToppings.deleteMany({});
    console.log(`✅ Removed ${deletedDefaultToppings.count} default topping relations`);

    // Remove all cart toppings
    console.log("🛒 Removing cart topping relations...");
    const deletedCartToppings = await prisma.cartToppings.deleteMany({});
    console.log(`✅ Removed ${deletedCartToppings.count} cart topping relations`);

    // Now remove all toppings
    console.log("🧄 Removing all toppings...");
    const deletedToppings = await prisma.toppingsList.deleteMany({});
    console.log(`✅ Removed ${deletedToppings.count} toppings`);

    console.log("\n🎉 Topping removal completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - Default toppings removed: ${deletedDefaultToppings.count}`);
    console.log(`   - Cart toppings removed: ${deletedCartToppings.count}`);
    console.log(`   - Toppings removed: ${deletedToppings.count}`);

    // Verify removal
    const remainingToppings = await prisma.toppingsList.count();
    console.log(`   - Remaining toppings: ${remainingToppings}`);

  } catch (error) {
    console.error("❌ Error removing toppings:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the removal
removeToppings()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
