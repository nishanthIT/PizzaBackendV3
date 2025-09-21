import prisma from "./src/lib/prisma.js";

async function cleanupAllData() {
  try {
    console.log("🗑️ Starting complete data cleanup...");

    // Delete in order to respect foreign key constraints
    console.log("📋 Deleting order-related data...");
    
    // Delete order toppings and ingredients first
    const deletedOrderToppings = await prisma.orderToppings.deleteMany({});
    console.log(`   ✅ Deleted ${deletedOrderToppings.count} order toppings`);
    
    const deletedOrderIngredients = await prisma.orderIngredients.deleteMany({});
    console.log(`   ✅ Deleted ${deletedOrderIngredients.count} order ingredients`);
    
    // Delete order items
    const deletedOrderItems = await prisma.orderItem.deleteMany({});
    console.log(`   ✅ Deleted ${deletedOrderItems.count} order items`);
    
    // Delete orders
    const deletedOrders = await prisma.order.deleteMany({});
    console.log(`   ✅ Deleted ${deletedOrders.count} orders`);

    console.log("🛒 Deleting cart-related data...");
    
    // Delete cart toppings and ingredients first
    const deletedCartToppings = await prisma.cartToppings.deleteMany({});
    console.log(`   ✅ Deleted ${deletedCartToppings.count} cart toppings`);
    
    const deletedCartIngredients = await prisma.cartIngredients.deleteMany({});
    console.log(`   ✅ Deleted ${deletedCartIngredients.count} cart ingredients`);
    
    // Delete cart items
    const deletedCartItems = await prisma.cartItem.deleteMany({});
    console.log(`   ✅ Deleted ${deletedCartItems.count} cart items`);
    
    // Delete carts
    const deletedCarts = await prisma.cart.deleteMany({});
    console.log(`   ✅ Deleted ${deletedCarts.count} carts`);

    console.log("🍕 Deleting menu-related data...");
    
    // Delete combo items
    const deletedComboItems = await prisma.comboItem.deleteMany({});
    console.log(`   ✅ Deleted ${deletedComboItems.count} combo items`);
    
    // Delete combo pizzas
    const deletedComboPizzas = await prisma.comboPizza.deleteMany({});
    console.log(`   ✅ Deleted ${deletedComboPizzas.count} combo pizzas`);
    
    // Delete combo offers
    const deletedComboOffers = await prisma.comboOffers.deleteMany({});
    console.log(`   ✅ Deleted ${deletedComboOffers.count} combo offers`);
    
    // Delete combo style items
    const deletedComboStyleItems = await prisma.comboStyleItem.deleteMany({});
    console.log(`   ✅ Deleted ${deletedComboStyleItems.count} combo style items`);
    
    // Delete peri peri items
    const deletedPeriPeriItems = await prisma.periPeriItem.deleteMany({});
    console.log(`   ✅ Deleted ${deletedPeriPeriItems.count} peri peri items`);
    
    // Delete other items
    const deletedOtherItems = await prisma.otherItem.deleteMany({});
    console.log(`   ✅ Deleted ${deletedOtherItems.count} other items`);
    
    // Delete default toppings and ingredients
    const deletedDefaultToppings = await prisma.defaultToppings.deleteMany({});
    console.log(`   ✅ Deleted ${deletedDefaultToppings.count} default toppings`);
    
    const deletedDefaultIngredients = await prisma.defaultIngredients.deleteMany({});
    console.log(`   ✅ Deleted ${deletedDefaultIngredients.count} default ingredients`);
    
    // Delete pizzas
    const deletedPizzas = await prisma.pizza.deleteMany({});
    console.log(`   ✅ Deleted ${deletedPizzas.count} pizzas`);
    
    // Delete toppings and ingredients lists
    const deletedToppingsList = await prisma.toppingsList.deleteMany({});
    console.log(`   ✅ Deleted ${deletedToppingsList.count} toppings from list`);
    
    const deletedIngredientsList = await prisma.ingredientsList.deleteMany({});
    console.log(`   ✅ Deleted ${deletedIngredientsList.count} ingredients from list`);
    
    // Delete categories
    const deletedCategories = await prisma.category.deleteMany({});
    console.log(`   ✅ Deleted ${deletedCategories.count} categories`);

    console.log("👥 Cleaning up user data...");
    
    // Delete users (keeping admins)
    const deletedUsers = await prisma.user.deleteMany({});
    console.log(`   ✅ Deleted ${deletedUsers.count} users`);

    console.log("\n🎉 Complete data cleanup finished successfully!");
    console.log("📊 Summary of deleted data:");
    console.log(`   - Orders: ${deletedOrders.count}`);
    console.log(`   - Order Items: ${deletedOrderItems.count}`);
    console.log(`   - Carts: ${deletedCarts.count}`);
    console.log(`   - Cart Items: ${deletedCartItems.count}`);
    console.log(`   - Pizzas: ${deletedPizzas.count}`);
    console.log(`   - Other Items: ${deletedOtherItems.count}`);
    console.log(`   - Combo Offers: ${deletedComboOffers.count}`);
    console.log(`   - Combo Style Items: ${deletedComboStyleItems.count}`);
    console.log(`   - Categories: ${deletedCategories.count}`);
    console.log(`   - Users: ${deletedUsers.count}`);
    console.log(`   - Toppings: ${deletedToppingsList.count}`);
    console.log(`   - Ingredients: ${deletedIngredientsList.count}`);

    console.log("\n✨ Your database is now clean and ready for fresh data!");
    
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Confirmation prompt
const readline = await import('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('⚠️  WARNING: This will delete ALL menu data, orders, carts, and users!\nType "DELETE ALL DATA" to confirm: ', (answer) => {
  if (answer === 'DELETE ALL DATA') {
    cleanupAllData()
      .then(() => {
        console.log("🎯 Cleanup completed successfully!");
        process.exit(0);
      })
      .catch((error) => {
        console.error("💥 Fatal error:", error);
        process.exit(1);
      })
      .finally(() => {
        rl.close();
      });
  } else {
    console.log("❌ Cleanup cancelled. No data was deleted.");
    rl.close();
    process.exit(0);
  }
});
