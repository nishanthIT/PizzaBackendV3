import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createTestComboStyleItem() {
  try {
    console.log("Creating test combo style item...");

    // First, get or create a category
    let category = await prisma.category.findFirst({
      where: {
        name: {
          contains: "Chicken",
          mode: "insensitive"
        }
      }
    });

    if (!category) {
      // Create a Chicken category if it doesn't exist
      category = await prisma.category.create({
        data: {
          name: "Chicken",
          description: "Delicious chicken items"
        }
      });
      console.log("Created Chicken category:", category);
    } else {
      console.log("Found existing category:", category);
    }

    // Create the combo style item
    const comboStyleItem = await prisma.comboStyleItem.create({
      data: {
        name: "Peri-Peri Chicken",
        description: "Succulent chicken marinated in our signature peri-peri sauce, grilled to perfection",
        categoryId: category.id,
        sizePricing: {
          "quarter": {
            "basePrice": 4.50,
            "mealDealPrice": 7.50
          },
          "half": {
            "basePrice": 8.00,
            "mealDealPrice": 12.00
          },
          "whole": {
            "basePrice": 15.00,
            "mealDealPrice": 20.00
          },
          "wings": {
            "basePrice": 6.00,
            "mealDealPrice": 9.50
          }
        },
        availableSauces: [
          "Periperi Medium",
          "Periperi Hot", 
          "BBQ",
          "Lemon and Herbs",
          "Mango and Lime",
          "Extra Hot",
          "Mild",
          "Garlic"
        ],
        mealDealConfig: {
          "quarter": {
            "sideCount": 1,
            "drinkCount": 1
          },
          "half": {
            "sideCount": 2,
            "drinkCount": 1
          },
          "whole": {
            "sideCount": 2,
            "drinkCount": 2
          },
          "wings": {
            "sideCount": 1,
            "drinkCount": 1
          }
        },
        isActive: true,
        imageUrl: "peri-peri-chicken.jpg"
      },
      include: {
        category: true
      }
    });

    console.log("Successfully created combo style item:", comboStyleItem);

    // Create some test sides in a sides category
    let sidesCategory = await prisma.category.findFirst({
      where: {
        name: {
          contains: "Sides",
          mode: "insensitive"
        }
      }
    });

    if (!sidesCategory) {
      sidesCategory = await prisma.category.create({
        data: {
          name: "Sides",
          description: "Delicious side dishes"
        }
      });
    }

    // Create test sides
    const sides = [
      { name: "Chips", price: 2.50 },
      { name: "Coleslaw", price: 2.00 },
      { name: "Corn on the Cob", price: 2.50 },
      { name: "Rice", price: 2.00 },
      { name: "Beans", price: 2.00 }
    ];

    for (const side of sides) {
      const existingSide = await prisma.otherItem.findFirst({
        where: { name: side.name }
      });

      if (!existingSide) {
        await prisma.otherItem.create({
          data: {
            name: side.name,
            price: side.price,
            categoryId: sidesCategory.id,
            imageUrl: `${side.name.toLowerCase().replace(/\s+/g, '-')}.jpg`
          }
        });
        console.log(`Created side: ${side.name}`);
      }
    }

    // Create some test drinks in a drinks category
    let drinksCategory = await prisma.category.findFirst({
      where: {
        name: {
          contains: "Drinks",
          mode: "insensitive"
        }
      }
    });

    if (!drinksCategory) {
      drinksCategory = await prisma.category.create({
        data: {
          name: "Drinks",
          description: "Refreshing beverages"
        }
      });
    }

    // Create test drinks
    const drinks = [
      { name: "Coca Cola", price: 1.50 },
      { name: "Pepsi", price: 1.50 },
      { name: "Sprite", price: 1.50 },
      { name: "Orange Juice", price: 2.00 },
      { name: "Water", price: 1.00 }
    ];

    for (const drink of drinks) {
      const existingDrink = await prisma.otherItem.findFirst({
        where: { name: drink.name }
      });

      if (!existingDrink) {
        await prisma.otherItem.create({
          data: {
            name: drink.name,
            price: drink.price,
            categoryId: drinksCategory.id,
            imageUrl: `${drink.name.toLowerCase().replace(/\s+/g, '-')}.jpg`
          }
        });
        console.log(`Created drink: ${drink.name}`);
      }
    }

    console.log("\n✅ Test combo style item system setup completed!");
    console.log("\nYou can now:");
    console.log("1. Visit /menu-pizza to see the combo style item in the Chicken category");
    console.log("2. Click on it to go to /combo-style-menu");
    console.log("3. Select a size and meal deal option");
    console.log("4. Choose sides and drinks for meal deals");
    console.log("5. Add to cart");

  } catch (error) {
    console.error("Error creating test combo style item:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestComboStyleItem();