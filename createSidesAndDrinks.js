import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createSidesAndDrinks() {
  try {
    console.log("Creating sides and drinks categories and items...");

    // First, let's check if categories exist
    let sidesCategory = await prisma.category.findFirst({
      where: { name: { contains: "side", mode: "insensitive" } }
    });

    let drinksCategory = await prisma.category.findFirst({
      where: { name: { contains: "drink", mode: "insensitive" } }
    });

    // Create categories if they don't exist
    if (!sidesCategory) {
      sidesCategory = await prisma.category.create({
        data: {
          name: "Sides",
          description: "Side dishes and accompaniments"
        }
      });
      console.log("Created Sides category:", sidesCategory.id);
    }

    if (!drinksCategory) {
      drinksCategory = await prisma.category.create({
        data: {
          name: "Drinks",
          description: "Beverages and drinks"
        }
      });
      console.log("Created Drinks category:", drinksCategory.id);
    }

    // Define sides to create
    const sides = [
      { name: "Chips", price: 2.5, imageUrl: "chips.png" },
      { name: "Coleslaw", price: 2.0, imageUrl: "coleslaw.png" },
      { name: "Corn on the Cob", price: 2.5, imageUrl: "corn.png" },
      { name: "Rice", price: 2.0, imageUrl: "rice.png" },
      { name: "Beans", price: 2.0, imageUrl: "beans.png" },
      { name: "Mashed Potato", price: 2.5, imageUrl: "mashed-potato.png" },
      { name: "Garden Salad", price: 3.0, imageUrl: "salad.png" }
    ];

    // Define drinks to create
    const drinks = [
      { name: "Coca Cola", price: 1.5, imageUrl: "cola.png" },
      { name: "Pepsi", price: 1.5, imageUrl: "pepsi.png" },
      { name: "Sprite", price: 1.5, imageUrl: "sprite.png" },
      { name: "Orange Juice", price: 2.0, imageUrl: "orange-juice.png" },
      { name: "Water", price: 1.0, imageUrl: "water.png" },
      { name: "Lemonade", price: 1.8, imageUrl: "lemonade.png" },
      { name: "Iced Tea", price: 1.8, imageUrl: "iced-tea.png" }
    ];

    // Create side items
    console.log("Creating side items...");
    const createdSides = [];
    for (const side of sides) {
      const existingSide = await prisma.otherItem.findFirst({
        where: { 
          name: side.name,
          categoryId: sidesCategory.id
        }
      });

      if (!existingSide) {
        const createdSide = await prisma.otherItem.create({
          data: {
            name: side.name,
            description: `Delicious ${side.name.toLowerCase()}`,
            imageUrl: side.imageUrl,
            price: side.price,
            categoryId: sidesCategory.id
          }
        });
        createdSides.push(createdSide);
        console.log(`Created side: ${side.name} (ID: ${createdSide.id})`);
      } else {
        console.log(`Side already exists: ${side.name} (ID: ${existingSide.id})`);
        createdSides.push(existingSide);
      }
    }

    // Create drink items
    console.log("Creating drink items...");
    const createdDrinks = [];
    for (const drink of drinks) {
      const existingDrink = await prisma.otherItem.findFirst({
        where: { 
          name: drink.name,
          categoryId: drinksCategory.id
        }
      });

      if (!existingDrink) {
        const createdDrink = await prisma.otherItem.create({
          data: {
            name: drink.name,
            description: `Refreshing ${drink.name.toLowerCase()}`,
            imageUrl: drink.imageUrl,
            price: drink.price,
            categoryId: drinksCategory.id
          }
        });
        createdDrinks.push(createdDrink);
        console.log(`Created drink: ${drink.name} (ID: ${createdDrink.id})`);
      } else {
        console.log(`Drink already exists: ${drink.name} (ID: ${existingDrink.id})`);
        createdDrinks.push(existingDrink);
      }
    }

    console.log("\\n=== SIDES ===");
    createdSides.forEach(side => {
      console.log(`${side.name}: ${side.id}`);
    });

    console.log("\\n=== DRINKS ===");
    createdDrinks.forEach(drink => {
      console.log(`${drink.name}: ${drink.id}`);
    });

    console.log("\\nSides and drinks created successfully!");
    
  } catch (error) {
    console.error("Error creating sides and drinks:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createSidesAndDrinks();