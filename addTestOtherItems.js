import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addTestOtherItems() {
  try {
    console.log('Adding test other items with sauce support...');

    // First, let's get or create a category for chicken items
    let category = await prisma.category.findFirst({
      where: { name: "Chicken" }
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: "Chicken",
          description: "Delicious chicken items"
        }
      });
    }

    console.log("Category:", category);

    // Check if Peri Peri Chicken already exists
    const existing = await prisma.otherItem.findFirst({
      where: { name: "Peri Peri Chicken" }
    });

    if (!existing) {
      // Create Peri Peri Chicken with sauce options
      const periPeriChicken = await prisma.otherItem.create({
        data: {
          name: "Peri Peri Chicken",
          description: "Spicy grilled chicken with your choice of sauce",
          price: 12.99,
          imageUrl: "dummy.png",
          categoryId: category.id,
          availableSauces: JSON.stringify([
            "Periperi Medium",
            "Periperi Hot", 
            "BBQ",
            "Lemon and Herbs",
            "Mango and Lime"
          ])
        }
      });

      console.log("Created Peri Peri Chicken:", periPeriChicken);
    } else {
      // Update existing item to add sauce support
      const updated = await prisma.otherItem.update({
        where: { id: existing.id },
        data: {
          availableSauces: JSON.stringify([
            "Periperi Medium",
            "Periperi Hot", 
            "BBQ",
            "Lemon and Herbs",
            "Mango and Lime"
          ])
        }
      });
      console.log("Updated existing Peri Peri Chicken with sauce options:", updated);
    }

    // Get all other items to show current state
    const allItems = await prisma.otherItem.findMany({
      include: {
        category: true
      }
    });

    console.log("\nAll other items:");
    allItems.forEach(item => {
      console.log(`- ${item.name}: £${item.price}`);
      if (item.availableSauces) {
        const sauces = JSON.parse(item.availableSauces);
        console.log(`  Sauces: ${sauces.join(", ")}`);
      }
    });

    console.log("✅ Test other items with sauce support created successfully!");

  } catch (error) {
    console.error("❌ Error creating test items:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestOtherItems();
