import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addSamplePizzaSizes() {
  try {
    console.log('Adding sample pizza sizes...');

    const pizzas = await prisma.pizza.findMany();
    
    const sampleSizes = {
      MEDIUM: 8.99,
      LARGE: 11.99,
      SUPER_SIZE: 15.99
    };

    for (const pizza of pizzas) {
      // Adjust prices based on pizza name for variety
      let adjustedSizes = { ...sampleSizes };
      
      if (pizza.name.includes('Margherita')) {
        adjustedSizes = { MEDIUM: 7.50, LARGE: 8.50, SUPER_SIZE: 11.95 };
      } else if (pizza.name.includes('Hawaiian')) {
        adjustedSizes = { MEDIUM: 8.75, LARGE: 9.95, SUPER_SIZE: 12.95 };
      } else if (pizza.name.includes('American')) {
        adjustedSizes = { MEDIUM: 7.95, LARGE: 8.95, SUPER_SIZE: 12.50 };
      }

      console.log(`Setting sizes for ${pizza.name}:`, adjustedSizes);

      await prisma.pizza.update({
        where: { id: pizza.id },
        data: { sizes: adjustedSizes }
      });
    }

    console.log('Sample pizza sizes added successfully!');

  } catch (error) {
    console.error('Error adding sample sizes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSamplePizzaSizes();
