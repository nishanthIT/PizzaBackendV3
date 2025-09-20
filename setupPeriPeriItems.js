import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupPeriPeriItems() {
  try {
    console.log('Setting up Peri Peri items with proper structure...');

    // Common sauce options for all Peri Peri items
    const sauces = JSON.stringify([
      "Periperi Medium",
      "Periperi Hot", 
      "BBQ",
      "Lemon and Herbs",
      "Mango and Lime"
    ]);

    const periPeriItems = [
      {
        name: "Quarter Peri-Peri Chicken",
        description: "Quarter chicken marinated in peri peri sauce, grilled to your favourite spiciness",
        basePrice: 4.50,
        mealDealPrice: 7.50,
        sideCount: 1,
        drinkCount: 1,
        itemType: "quarter",
        availableSauces: sauces,
        imageUrl: "peri-quarter.png"
      },
      {
        name: "Half Peri-Peri Chicken", 
        description: "Half chicken marinated in peri peri sauce, grilled to your favourite spiciness",
        basePrice: 6.95,
        mealDealPrice: 9.95,
        sideCount: 1,
        drinkCount: 1,
        itemType: "half",
        availableSauces: sauces,
        imageUrl: "peri-half.png"
      },
      {
        name: "Whole Peri-Peri Chicken",
        description: "Whole chicken marinated in peri peri sauce, grilled to your favourite spiciness", 
        basePrice: 12.50,
        mealDealPrice: 17.95,
        sideCount: 2,
        drinkCount: 2,
        itemType: "whole",
        availableSauces: sauces,
        imageUrl: "peri-whole.png"
      },
      {
        name: "8 pieces Grilled Chicken Wings",
        description: "8 pieces of chicken wings grilled to your favourite spiciness",
        basePrice: 4.95,
        mealDealPrice: 7.95,
        sideCount: 1,
        drinkCount: 1,
        itemType: "wings",
        availableSauces: sauces,
        imageUrl: "peri-wings.png"
      }
    ];

    // Clean up any existing peri peri items
    await prisma.periPeriItem.deleteMany();

    // Create new items
    for (const item of periPeriItems) {
      const created = await prisma.periPeriItem.create({
        data: item
      });
      console.log(`✅ Created: ${created.name}`);
      console.log(`   - Base price: £${created.basePrice}`);
      console.log(`   - Meal deal: £${created.mealDealPrice} (${created.sideCount} side${created.sideCount > 1 ? 's' : ''} + ${created.drinkCount} drink${created.drinkCount > 1 ? 's' : ''})`);
    }

    // Show all items
    const allItems = await prisma.periPeriItem.findMany();
    console.log(`\n📋 Total Peri Peri items created: ${allItems.length}`);

    console.log('\n🎉 Peri Peri items setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up Peri Peri items:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupPeriPeriItems();
