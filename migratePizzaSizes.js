import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migratePizzaSizes() {
  try {
    console.log('Starting pizza size migration...');

    // First, let's see what sizes exist in the current data
    const pizzas = await prisma.pizza.findMany({
      select: { id: true, name: true, sizes: true }
    });

    console.log('Current pizzas and their sizes:');
    pizzas.forEach(pizza => {
      console.log(`${pizza.name}: ${JSON.stringify(pizza.sizes)}`);
    });

    // Update pizza sizes from SMALL/MEDIUM/LARGE to MEDIUM/LARGE/SUPER_SIZE
    for (const pizza of pizzas) {
      const oldSizes = typeof pizza.sizes === 'string' ? JSON.parse(pizza.sizes) : pizza.sizes;
      const newSizes = {};

      if (oldSizes.SMALL) {
        newSizes.MEDIUM = oldSizes.SMALL;
      }
      if (oldSizes.MEDIUM) {
        newSizes.LARGE = oldSizes.MEDIUM;
      }
      if (oldSizes.LARGE) {
        newSizes.SUPER_SIZE = oldSizes.LARGE;
      }

      console.log(`Updating ${pizza.name} sizes:`, oldSizes, '->', newSizes);

      await prisma.pizza.update({
        where: { id: pizza.id },
        data: { sizes: newSizes }
      });
    }

    // Update existing combo pizza sizes
    const comboPizzas = await prisma.comboPizza.findMany();
    console.log(`Found ${comboPizzas.length} combo pizzas to update`);

    for (const comboPizza of comboPizzas) {
      let newSize = comboPizza.size;
      
      switch (comboPizza.size) {
        case 'SMALL':
          newSize = 'MEDIUM';
          break;
        case 'MEDIUM':
          newSize = 'LARGE';
          break;
        case 'LARGE':
          newSize = 'SUPER_SIZE';
          break;
      }

      if (newSize !== comboPizza.size) {
        console.log(`Updating combo pizza size: ${comboPizza.size} -> ${newSize}`);
        await prisma.comboPizza.update({
          where: { id: comboPizza.id },
          data: { size: newSize }
        });
      }
    }

    // Update existing combo items sizes
    const comboItems = await prisma.comboItem.findMany();
    console.log(`Found ${comboItems.length} combo items to update`);

    for (const comboItem of comboItems) {
      if (comboItem.size) {
        let newSize = comboItem.size;
        
        switch (comboItem.size) {
          case 'SMALL':
            newSize = 'MEDIUM';
            break;
          case 'MEDIUM':
            newSize = 'LARGE';
            break;
          case 'LARGE':
            newSize = 'SUPER_SIZE';
            break;
        }

        if (newSize !== comboItem.size) {
          console.log(`Updating combo item size: ${comboItem.size} -> ${newSize}`);
          await prisma.comboItem.update({
            where: { id: comboItem.id },
            data: { size: newSize }
          });
        }
      }
    }

    console.log('Pizza size migration completed successfully!');

  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migratePizzaSizes();
