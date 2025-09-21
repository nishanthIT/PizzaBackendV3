import prisma from "./src/lib/prisma.js";

const toppingsData = [
  { name: "Pepperoni", price: 0.50 },
  { name: "Mozzarella", price: 0.50 },
  { name: "Tomato", price: 0.30 },
  { name: "Ham", price: 0.60 },
  { name: "Mushrooms", price: 0.40 },
  { name: "Black Olives", price: 0.40 },
  { name: "Mixed Peppers", price: 0.40 },
  { name: "Red Onion", price: 0.30 },
  { name: "Sweetcorn", price: 0.30 },
  { name: "Green Chilli", price: 0.30 },
  { name: "Spiced Beef", price: 0.70 },
  { name: "Hot Green Pepper", price: 0.35 },
  { name: "Green Peppers", price: 0.35 },
  { name: "Pineapple", price: 0.40 },
  { name: "Spinach", price: 0.40 },
  { name: "Egg", price: 0.50 },
  { name: "Garlic Oil", price: 0.25 },
  { name: "Gran Forma Cheese", price: 0.60 },
  { name: "BBQ Base", price: 0.30 },
  { name: "BBQ Chicken", price: 0.70 },
  { name: "Bacon", price: 0.60 },
  { name: "Red Pepper", price: 0.35 },
  { name: "Onion", price: 0.30 },
  { name: "Beef", price: 0.70 },
  { name: "Sausage", price: 0.60 },
  { name: "Peri Chicken", price: 0.70 },
  { name: "Tandoori Chicken", price: 0.70 },
  { name: "Jalapeno", price: 0.35 },
  { name: "Tuna", price: 0.70 },
  { name: "Prawns", price: 0.80 },
  { name: "Anchovies", price: 0.50 },
  { name: "Capers", price: 0.30 },
  { name: "Asparagus", price: 0.50 },
  { name: "Fresh Tomato", price: 0.35 }
];

async function addToppingsOnly() {
  try {
    console.log("🧄 Starting toppings import...");

    let toppingsCreated = 0;
    let toppingsUpdated = 0;

    for (const toppingData of toppingsData) {
      const existingTopping = await prisma.toppingsList.findFirst({
        where: { name: toppingData.name }
      });

      if (existingTopping) {
        await prisma.toppingsList.update({
          where: { id: existingTopping.id },
          data: { 
            price: toppingData.price,
            status: true 
          }
        });
        toppingsUpdated++;
        console.log(`  🔄 Updated: ${toppingData.name} - £${toppingData.price}`);
      } else {
        await prisma.toppingsList.create({
          data: {
            name: toppingData.name,
            price: toppingData.price,
            status: true
          }
        });
        toppingsCreated++;
        console.log(`  ✅ Created: ${toppingData.name} - £${toppingData.price}`);
      }
    }

    console.log(`\n🎉 Toppings import completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`   - Toppings created: ${toppingsCreated}`);
    console.log(`   - Toppings updated: ${toppingsUpdated}`);
    console.log(`   - Total toppings processed: ${toppingsCreated + toppingsUpdated}`);

    // Display final toppings count
    const totalToppings = await prisma.toppingsList.count();
    console.log(`   - Total toppings in database: ${totalToppings}`);

  } catch (error) {
    console.error("❌ Error importing toppings:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
addToppingsOnly()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
