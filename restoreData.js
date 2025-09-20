import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function restoreAllData() {
  try {
    console.log('🔄 Restoring all data after database reset...');

    // 1. Create Categories first
    console.log('📁 Creating categories...');
    const categories = [
      { id: 'pizzas', name: 'Pizzas', description: 'Delicious hand-made pizzas' },
      { id: 'drinks', name: 'Drinks', description: 'Refreshing beverages' },
      { id: 'sides', name: 'Sides', description: 'Tasty side dishes' },
      { id: 'salads', name: 'Salads', description: 'Fresh healthy salads' },
      { id: 'desserts', name: 'Desserts', description: 'Sweet treats' },
      { id: 'burgers', name: 'Burgers', description: 'Gourmet burgers' },
      { id: 'seafood', name: 'Seafood', description: 'Fresh seafood dishes' }
    ];

    for (const category of categories) {
      await prisma.category.upsert({
        where: { id: category.id },
        update: {},
        create: category
      });
      console.log(`✅ Created category: ${category.name}`);
    }

    // 2. Create Pizzas with new size structure
    console.log('🍕 Creating pizzas...');
    const pizzas = [
      {
        name: 'Margherita',
        description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
        categoryId: 'pizzas',
        sizes: { MEDIUM: 7.50, LARGE: 8.50, SUPER_SIZE: 11.95 },
        imageUrl: 'margherita.png'
      },
      {
        name: 'Hawaiian',
        description: 'Ham, pineapple, and mozzarella cheese',
        categoryId: 'pizzas',
        sizes: { MEDIUM: 8.75, LARGE: 9.95, SUPER_SIZE: 12.95 },
        imageUrl: 'hawaiian.png'
      },
      {
        name: 'American',
        description: 'Pepperoni, mushrooms, and mozzarella',
        categoryId: 'pizzas',
        sizes: { MEDIUM: 7.95, LARGE: 8.95, SUPER_SIZE: 12.50 },
        imageUrl: 'american.png'
      },
      {
        name: 'American Hot',
        description: 'Spicy pepperoni, jalapeños, and mozzarella',
        categoryId: 'pizzas',
        sizes: { MEDIUM: 8.50, LARGE: 9.50, SUPER_SIZE: 12.95 },
        imageUrl: 'american-hot.png'
      },
      {
        name: 'Veggie Hot',
        description: 'Mixed vegetables with spicy sauce',
        categoryId: 'pizzas',
        sizes: { MEDIUM: 7.95, LARGE: 8.95, SUPER_SIZE: 12.50 },
        imageUrl: 'veggie-hot.png'
      },
      {
        name: 'Spicy Beef',
        description: 'Ground beef with spicy seasonings',
        categoryId: 'pizzas',
        sizes: { MEDIUM: 8.50, LARGE: 9.50, SUPER_SIZE: 12.95 },
        imageUrl: 'spicy-beef.png'
      },
      {
        name: 'Fiorentina (V)',
        description: 'Spinach, ricotta, and mozzarella - Vegetarian',
        categoryId: 'pizzas',
        sizes: { MEDIUM: 8.50, LARGE: 9.50, SUPER_SIZE: 12.50 },
        imageUrl: 'fiorentina.png'
      },
      {
        name: 'Romana',
        description: 'Anchovies, olives, capers, and mozzarella',
        categoryId: 'pizzas',
        sizes: { MEDIUM: 9.50, LARGE: 12.00, SUPER_SIZE: 14.95 },
        imageUrl: 'romana.png'
      }
    ];

    for (const pizza of pizzas) {
      await prisma.pizza.create({
        data: pizza
      });
      console.log(`✅ Created pizza: ${pizza.name}`);
    }

    // 3. Create Other Items
    console.log('🍔 Creating other items...');
    const otherItems = [
      { name: 'Coca Cola', description: 'Refreshing cola drink', price: 1.30, categoryId: 'drinks', imageUrl: 'cola.png' },
      { name: 'Garlic Bread (V)', description: 'Crispy garlic bread with herbs', price: 2.75, categoryId: 'sides', imageUrl: 'garlic-bread.png' },
      { name: 'Cheesy Garlic Bread (V)', description: 'Garlic bread with melted cheese', price: 3.75, categoryId: 'sides', imageUrl: 'cheesy-garlic-bread.png' },
      { name: 'Chips (V)', description: 'Golden crispy chips', price: 2.75, categoryId: 'sides', imageUrl: 'chips.png' },
      { name: 'Spicy Rice (V)', description: 'Aromatic spiced rice', price: 2.75, categoryId: 'sides', imageUrl: 'spicy-rice.png' },
      { name: 'Coleslaw (V)', description: 'Fresh mixed coleslaw', price: 2.75, categoryId: 'sides', imageUrl: 'coleslaw.png' },
      { name: 'Baked Dough Balls (V)', description: 'Soft baked dough balls', price: 2.75, categoryId: 'sides', imageUrl: 'dough-balls.png' },
      { name: 'Calamari', description: 'Crispy fried squid rings', price: 5.95, categoryId: 'seafood', imageUrl: 'calamari.png' },
      { name: 'Flame Grilled Chicken Fillet Burger', description: 'Juicy grilled chicken burger', price: 8.95, categoryId: 'burgers', imageUrl: 'chicken-burger.png' },
      { name: 'Gourmet Beef Burger', description: 'Premium beef burger', price: 9.95, categoryId: 'burgers', imageUrl: 'beef-burger.png' },
      { name: 'Veggie Burger', description: 'Plant-based burger', price: 7.95, categoryId: 'burgers', imageUrl: 'veggie-burger.png' },
      { name: 'Grilled Salmon', description: 'Fresh grilled salmon fillet', price: 11.95, categoryId: 'seafood', imageUrl: 'salmon.png' },
      { name: 'Grilled Seabass', description: 'Whole grilled seabass', price: 14.95, categoryId: 'seafood', imageUrl: 'seabass.png' },
      { name: 'Grilled Lamb Chops', description: 'Tender grilled lamb chops', price: 15.95, categoryId: 'sides', imageUrl: 'lamb-chops.png' },
      { name: 'Chocolate Fudge Cake', description: 'Rich chocolate fudge cake', price: 2.95, categoryId: 'desserts', imageUrl: 'chocolate-cake.png' },
      { name: 'Vanilla Cheese Cake', description: 'Creamy vanilla cheesecake', price: 3.50, categoryId: 'desserts', imageUrl: 'cheesecake.png' },
      { name: 'Ben & Jerry\'s', description: 'Premium ice cream', price: 5.95, categoryId: 'desserts', imageUrl: 'ice-cream.png' }
    ];

    for (const item of otherItems) {
      await prisma.otherItem.create({
        data: item
      });
      console.log(`✅ Created other item: ${item.name}`);
    }

    // 4. Create sample toppings
    console.log('🧀 Creating toppings...');
    const toppings = [
      { name: 'Extra Cheese', price: 1.50, status: true },
      { name: 'Pepperoni', price: 2.00, status: true },
      { name: 'Mushrooms', price: 1.25, status: true },
      { name: 'Ham', price: 2.25, status: true },
      { name: 'Pineapple', price: 1.25, status: true },
      { name: 'Olives', price: 1.50, status: true },
      { name: 'Bell Peppers', price: 1.25, status: true },
      { name: 'Onions', price: 1.00, status: true }
    ];

    for (const topping of toppings) {
      await prisma.toppingsList.create({
        data: topping
      });
      console.log(`✅ Created topping: ${topping.name}`);
    }

    // 5. Create sample ingredients
    console.log('🌿 Creating ingredients...');
    const ingredients = [
      { name: 'Tomato Sauce', price: 0.50, status: true },
      { name: 'Mozzarella Cheese', price: 1.00, status: true },
      { name: 'Fresh Basil', price: 0.75, status: true },
      { name: 'Olive Oil', price: 0.25, status: true },
      { name: 'Garlic', price: 0.50, status: true },
      { name: 'Oregano', price: 0.25, status: true }
    ];

    for (const ingredient of ingredients) {
      await prisma.ingredientsList.create({
        data: ingredient
      });
      console.log(`✅ Created ingredient: ${ingredient.name}`);
    }

    console.log('🎉 All data restored successfully!');
    console.log(`📊 Summary:`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Pizzas: ${pizzas.length}`);
    console.log(`   Other Items: ${otherItems.length}`);
    console.log(`   Toppings: ${toppings.length}`);
    console.log(`   Ingredients: ${ingredients.length}`);

  } catch (error) {
    console.error('❌ Error restoring data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreAllData();
