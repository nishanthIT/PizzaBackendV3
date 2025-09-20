import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function createTestComboStyleItem() {
  try {
    // First, get a category (let's use the first one available)
    const categories = await prisma.category.findMany();
    
    if (categories.length === 0) {
      console.error('No categories found. Please create a category first.');
      return;
    }

    const category = categories[0]; // Use first available category
    console.log('Using category:', category.name);

    // Create a test Peri Peri Chicken combo style item
    const comboStyleItem = await prisma.comboStyleItem.create({
      data: {
        name: "Peri Peri Chicken",
        description: "Delicious grilled chicken marinated in peri peri sauce, available in different sizes with optional meal deals",
        imageUrl: "peri-peri-chicken.png",
        categoryId: category.id,
        sizePricing: {
          quarter: { basePrice: 4.50, mealDealPrice: 7.50 },
          half: { basePrice: 6.95, mealDealPrice: 9.95 },
          whole: { basePrice: 12.50, mealDealPrice: 17.95 },
          wings: { basePrice: 4.95, mealDealPrice: 7.95 }
        },
        availableSauces: [
          "Periperi Medium",
          "Periperi Hot", 
          "BBQ",
          "Lemon and Herbs",
          "Mango and Lime"
        ],
        availableSides: [
          "side-1", // Chips
          "side-2", // Coleslaw
          "side-3", // Corn on the Cob
          "side-4", // Rice
          "side-5"  // Beans
        ],
        availableDrinks: [
          "drink-1", // Coca Cola
          "drink-2", // Pepsi
          "drink-3", // Sprite
          "drink-4", // Orange Juice
          "drink-5"  // Water
        ],
        mealDealConfig: {
          quarter: { sideCount: 1, drinkCount: 1 },
          half: { sideCount: 1, drinkCount: 1 },
          whole: { sideCount: 2, drinkCount: 2 },
          wings: { sideCount: 1, drinkCount: 1 }
        },
        isActive: true
      }
    });

    console.log('✅ Test ComboStyleItem created successfully!');
    console.log('ID:', comboStyleItem.id);
    console.log('Name:', comboStyleItem.name);
    console.log('Category:', category.name);
    console.log('Size Pricing:', JSON.stringify(comboStyleItem.sizePricing, null, 2));

  } catch (error) {
    console.error('❌ Error creating test ComboStyleItem:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestComboStyleItem();
