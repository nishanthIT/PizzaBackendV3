import prisma from "./src/lib/prisma.js";

const menuData = {
  categories: [
    {
      name: "SIDES",
      description: "Delicious side dishes to complement your meal"
    },
    {
      name: "DESSERTS", 
      description: "Sweet treats to finish your meal"
    },
    {
      name: "STARTERS",
      description: "Perfect appetizers to start your dining experience"
    },
    {
      name: "SALADS",
      description: "Fresh and healthy salad options"
    }
  ],
  items: {
    SIDES: [
      {
        name: "Chips (V)",
        description: "Fried Chips or Peri Peri Chips",
        price: 2.75,
        imageUrl: null
      },
      {
        name: "Spicy Rice (V)",
        description: "Chopped onions, jalapeño & red peppers with our spiced sauce",
        price: 2.75,
        imageUrl: null
      },
      {
        name: "Coleslaw (V)",
        description: "Our house made crunchy coleslaw of white cabbage, carrot, red onion and parsley with spice in a rich and creamy dressing",
        price: 2.75,
        imageUrl: null
      }
    ],
    DESSERTS: [
      {
        name: "Chocolate Fudge Cake",
        description: "Our home baked cake",
        price: 2.95,
        imageUrl: null
      },
      {
        name: "Vanilla Cheese Cake",
        description: "Delicious vanilla flavored cheesecake",
        price: 3.50,
        imageUrl: null
      },
      {
        name: "Ben & Jerry's",
        description: "Strawberry Cheesecake, Vanilla or Cookie Dough",
        price: 5.95,
        imageUrl: null
      }
    ],
    STARTERS: [
      {
        name: "Bruschetta (V)",
        description: "Freshly baked bread with garlic butter and topped with chopped tomato, red onion, pesto and fresh basil",
        price: 5.95,
        imageUrl: null
      },
      {
        name: "Baked Dough Balls (V) 8 pieces",
        description: "Served with garlic butter",
        price: 2.75,
        imageUrl: null
      },
      {
        name: "Baked Cheesy Dough Balls (V) 8 pieces",
        description: "Served with garlic butter",
        price: 4.00,
        imageUrl: null
      },
      {
        name: "Baked Cheesy Pepperoni Dough Balls 8 pieces",
        description: "Served with garlic butter",
        price: 5.00,
        imageUrl: null
      },
      {
        name: "Garlic Bread (V) 8 pieces",
        description: "Freshly baked bread with garlic butter",
        price: 2.75,
        imageUrl: null
      },
      {
        name: "Cheesy Garlic Bread (V) 8 pieces",
        description: "Freshly baked bread with mozzarella and garlic butter",
        price: 3.75,
        imageUrl: null
      },
      {
        name: "Mozzarella and Tomato Salad (V)(N)",
        description: "Baby mozzarella, fresh tomato, black olives and pesto",
        price: 5.25,
        imageUrl: null
      },
      {
        name: "Mozzarella and Tomato Salad with Avocado (V)(N)",
        description: "Avocado, baby mozzarella, fresh tomato, black olives and pesto",
        price: 6.25,
        imageUrl: null
      },
      {
        name: "Marinated Olives (V)",
        description: "Delicious marinated olives",
        price: 3.25,
        imageUrl: null
      },
      {
        name: "Garlic Mushrooms (V)",
        description: "Closed cup mushrooms cooked in garlic butter served with baked dough balls",
        price: 6.95,
        imageUrl: null
      },
      {
        name: "Potato Wedges (V)",
        description: "Deep fried served with mayonnaise or ketchup",
        price: 4.50,
        imageUrl: null
      },
      {
        name: "Calamari 8 pieces",
        description: "Crispy calamari rings served with a slice of lemon & caesar dressing",
        price: 5.95,
        imageUrl: null
      },
      {
        name: "Mixed Salad (V)",
        description: "Mixed leaves, fresh tomato and cucumber with house dressing",
        price: 3.50,
        imageUrl: null
      }
    ],
    SALADS: [
      {
        name: "Pollo",
        description: "Warm grilled chicken, goats cheese, black olives, red pepper, fresh tomato and croutons with mixed leaves, dressing and dough sticks",
        price: 9.95,
        imageUrl: null
      },
      {
        name: "Chicken Caesar",
        description: "Warm grilled chicken, anchovies, croutons and gran forma cheese with cos lettuce, caesar dressing and dough sticks",
        price: 10.50,
        imageUrl: null
      }
    ]
  }
};

async function importMenuItems() {
  try {
    console.log("🚀 Starting menu import...");

    // First, create categories
    console.log("📁 Creating categories...");
    const categoryMap = new Map();
    
    for (const categoryData of menuData.categories) {
      console.log(`Creating category: ${categoryData.name}`);
      
      // Check if category already exists
      const existingCategory = await prisma.category.findFirst({
        where: { name: categoryData.name }
      });

      let category;
      if (existingCategory) {
        console.log(`Category ${categoryData.name} already exists, updating...`);
        category = await prisma.category.update({
          where: { id: existingCategory.id },
          data: {
            description: categoryData.description
          }
        });
      } else {
        category = await prisma.category.create({
          data: categoryData
        });
      }
      
      categoryMap.set(categoryData.name, category.id);
      console.log(`✅ Category ${categoryData.name} created/updated with ID: ${category.id}`);
    }

    // Then, create items for each category
    console.log("🍽️ Creating menu items...");
    let totalItemsCreated = 0;
    let totalItemsUpdated = 0;

    for (const [categoryName, items] of Object.entries(menuData.items)) {
      const categoryId = categoryMap.get(categoryName);
      
      if (!categoryId) {
        console.error(`❌ Category ${categoryName} not found!`);
        continue;
      }

      console.log(`\n📝 Processing ${items.length} items for category: ${categoryName}`);
      
      for (const itemData of items) {
        try {
          // Check if item already exists
          const existingItem = await prisma.otherItem.findFirst({
            where: { 
              name: itemData.name,
              categoryId: categoryId
            }
          });

          if (existingItem) {
            console.log(`Updating existing item: ${itemData.name}`);
            await prisma.otherItem.update({
              where: { id: existingItem.id },
              data: {
                description: itemData.description,
                price: itemData.price,
                imageUrl: itemData.imageUrl
              }
            });
            totalItemsUpdated++;
          } else {
            console.log(`Creating new item: ${itemData.name}`);
            await prisma.otherItem.create({
              data: {
                ...itemData,
                categoryId: categoryId
              }
            });
            totalItemsCreated++;
          }
          
          console.log(`  ✅ ${itemData.name} - £${itemData.price}`);
        } catch (itemError) {
          console.error(`❌ Error processing item ${itemData.name}:`, itemError.message);
        }
      }
    }

    console.log("\n🎉 Import completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - Categories processed: ${menuData.categories.length}`);
    console.log(`   - New items created: ${totalItemsCreated}`);
    console.log(`   - Existing items updated: ${totalItemsUpdated}`);
    console.log(`   - Total items processed: ${totalItemsCreated + totalItemsUpdated}`);

    // Display final counts by category
    console.log("\n📈 Items per category:");
    for (const [categoryName, items] of Object.entries(menuData.items)) {
      const categoryId = categoryMap.get(categoryName);
      const count = await prisma.otherItem.count({
        where: { categoryId: categoryId }
      });
      console.log(`   - ${categoryName}: ${count} items`);
    }

  } catch (error) {
    console.error("❌ Error importing menu items:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importMenuItems()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
