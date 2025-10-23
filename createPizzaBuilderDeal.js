import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createPizzaBuilderDeal() {
  try {
    // Pizza category ID
    const pizzaCategoryId = 'cmfsfgo1f0005aqq58z1gu7s0';

    // Get all active toppings
    const toppings = await prisma.toppingsList.findMany({
      where: { status: true }
    });

    const toppingNames = toppings.map(t => t.name);
    console.log('Available toppings:', toppingNames);

    // Create the Pizza Builder deal
    const pizzaBuilderDeal = await prisma.pizzaBuilderDeal.create({
      data: {
        name: 'Build Your Own Pizza with 4 Toppings',
        description: 'Create your perfect pizza! Choose your base, sauce, size and pick any 4 toppings.',
        imageUrl: 'pizza-builder-default.png',
        maxToppings: 4,
        displayCategoryId: pizzaCategoryId,
        availableBases: ['Thin Crust', 'Deep Pan', 'Stuffed Crust'],
        availableSizes: ['MEDIUM', 'LARGE', 'SUPER_SIZE'],
        availableSauces: ['Tomato Sauce', 'BBQ Sauce', 'White Sauce', 'Garlic Butter'],
        availableToppings: toppingNames.length > 0 ? toppingNames : [
          'Pepperoni',
          'Mushrooms',
          'Onions',
          'Peppers',
          'Ham',
          'Chicken',
          'Beef',
          'Sausage',
          'Bacon',
          'Olives',
          'Sweetcorn',
          'Pineapple',
          'Jalapeños',
          'Spinach'
        ],
        sizePricing: {
          MEDIUM: 12.99,
          LARGE: 15.99,
          SUPER_SIZE: 18.99
        },
        isActive: true
      }
    });

    console.log('✅ Pizza Builder Deal created successfully!');
    console.log('Deal ID:', pizzaBuilderDeal.id);
    console.log('Name:', pizzaBuilderDeal.name);
    console.log('Category:', pizzaCategoryId);
    console.log('Active:', pizzaBuilderDeal.isActive);
    console.log('\n📍 View it at: http://localhost:3001/menu-pizza');

  } catch (error) {
    console.error('❌ Error creating Pizza Builder deal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createPizzaBuilderDeal();
