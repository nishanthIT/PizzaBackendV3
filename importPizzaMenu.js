import prisma from "./src/lib/prisma.js";

const pizzaData = {
  category: {
    name: "PIZZA",
    description: "Delicious pizzas made with fresh ingredients and baked to perfection"
  },
  
  // All unique toppings that appear in the pizza descriptions
  toppings: [
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
  ],

  pizzas: [
    {
      name: "American",
      description: "Pepperoni, mozzarella and tomato",
      sizes: { "medium": 8.95, "large": 12.50 },
      toppings: ["Pepperoni", "Mozzarella", "Tomato"]
    },
    {
      name: "American Hot",
      description: "Pepperoni, mozzarella, and tomato, with your choice of hot green or jalapeño peppers",
      sizes: { "medium": 9.50, "large": 12.95 },
      toppings: ["Pepperoni", "Mozzarella", "Tomato", "Hot Green Pepper", "Jalapeno"]
    },
    {
      name: "Margherita (V)",
      description: "Mozzarella and tomato",
      sizes: { "medium": 8.50, "large": 11.95 },
      toppings: ["Mozzarella", "Tomato"]
    },
    {
      name: "Romana",
      description: "Ham, closed cup mushrooms, black olives, mozzarella and tomato",
      sizes: { "medium": 9.50, "large": 12.95 },
      toppings: ["Ham", "Mushrooms", "Black Olives", "Mozzarella", "Tomato"]
    },
    {
      name: "Veggie Hot",
      description: "Mushrooms, mixed peppers, red onion, sweetcorn, green chilli, mozzarella and tomato",
      sizes: { "medium": 8.95, "large": 12.50 },
      toppings: ["Mushrooms", "Mixed Peppers", "Red Onion", "Sweetcorn", "Green Chilli", "Mozzarella", "Tomato"]
    },
    {
      name: "Spicy Beef",
      description: "Spiced beef, hot green pepper, green peppers, red onion, mozzarella and tomato",
      sizes: { "medium": 9.50, "large": 12.95 },
      toppings: ["Spiced Beef", "Hot Green Pepper", "Green Peppers", "Red Onion", "Mozzarella", "Tomato"]
    },
    {
      name: "Hawaiian",
      description: "Pineapple, ham, mozzarella and tomato",
      sizes: { "medium": 9.50, "large": 12.95 },
      toppings: ["Pineapple", "Ham", "Mozzarella", "Tomato"]
    },
    {
      name: "Fiorentina (V)",
      description: "Spinach, egg, mozzarella, tomato, black olives and garlic oil finished with gran forma cheese",
      sizes: { "medium": 9.50, "large": 12.95 },
      toppings: ["Spinach", "Egg", "Mozzarella", "Tomato", "Black Olives", "Garlic Oil", "Gran Forma Cheese"]
    },
    {
      name: "BBQ Chicken and Bacon",
      description: "BBQ base, BBQ chicken, bacon, red pepper, onion, pineapple",
      sizes: { "medium": 9.50, "large": 12.95 },
      toppings: ["BBQ Base", "BBQ Chicken", "Bacon", "Red Pepper", "Onion", "Pineapple"]
    },
    {
      name: "Meat Lovers",
      description: "Pepperoni, beef, sausage, bacon, ham, mozzarella and tomato",
      sizes: { "medium": 9.95, "large": 13.50 },
      toppings: ["Pepperoni", "Beef", "Sausage", "Bacon", "Ham", "Mozzarella", "Tomato"]
    },
    {
      name: "Chicken Delight",
      description: "Peri chicken, tandoori chicken, mixed peppers, red onion, jalapeno, mozzarella and tomato",
      sizes: { "medium": 9.50, "large": 12.95 },
      toppings: ["Peri Chicken", "Tandoori Chicken", "Mixed Peppers", "Red Onion", "Jalapeno", "Mozzarella", "Tomato"]
    },
    {
      name: "Frutti Di Mare",
      description: "Tuna, prawns, anchovies, capers, black olives, red onion, mozzarella, and tomato, with your choice of hot green or jalapeño peppers",
      sizes: { "medium": 9.95, "large": 13.50 },
      toppings: ["Tuna", "Prawns", "Anchovies", "Capers", "Black Olives", "Red Onion", "Mozzarella", "Tomato", "Hot Green Pepper", "Jalapeno"]
    },
    {
      name: "Verdura (V)",
      description: "Asparagus, closed cup mushrooms, red onion, black olives, red pepper, fresh tomato, mozzarella, tomato and garlic oil",
      sizes: { "medium": 9.50, "large": 12.95 },
      toppings: ["Asparagus", "Mushrooms", "Red Onion", "Black Olives", "Red Pepper", "Fresh Tomato", "Mozzarella", "Tomato", "Garlic Oil"]
    }
  ]
};

async function importToppings() {
  try {
    console.log("🧄 Starting toppings import...");

    let toppingsCreated = 0;
    let toppingsUpdated = 0;

    for (const toppingData of pizzaData.toppings) {
      const existingTopping = await prisma.toppingsList.findFirst({
        where: { name: toppingData.name }
      });

      let topping;
      if (existingTopping) {
        topping = await prisma.toppingsList.update({
          where: { id: existingTopping.id },
          data: { 
            price: toppingData.price,
            status: true 
          }
        });
        toppingsUpdated++;
        console.log(`  🔄 Updated: ${toppingData.name} - £${toppingData.price}`);
      } else {
        topping = await prisma.toppingsList.create({
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
    console.log(`� Summary:`);
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
importToppings()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
