import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function createSpecialOffer() {
  try {
    // First, let's delete any existing special offers to start fresh
    await prisma.specialOffer.deleteMany();
    console.log('Cleared existing special offers');

    // Create the new special offer
    const specialOffer = await prisma.specialOffer.create({
      data: {
        title: "Pizza Deal Special",
        offerText: "50% OFF",
        price: 9.99,
        description: "Get 50% off on all pizzas this weekend!",
        orderUrl: "menu-pizza",
        isActive: true
      }
    });

    console.log('Special offer created successfully:');
    console.log(JSON.stringify(specialOffer, null, 2));

    // Verify the special offer was created
    const allOffers = await prisma.specialOffer.findMany();
    console.log('\nAll special offers in database:');
    console.log(JSON.stringify(allOffers, null, 2));

  } catch (error) {
    console.error('Error creating special offer:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSpecialOffer();