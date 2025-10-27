import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkSpecialOffers() {
  try {
    const offers = await prisma.specialOffer.findMany();
    console.log('Special Offers in database:');
    console.log(JSON.stringify(offers, null, 2));
    
    const activeOffers = offers.filter(offer => offer.isActive);
    console.log('\nActive Special Offers:');
    console.log(JSON.stringify(activeOffers, null, 2));
  } catch (error) {
    console.error('Error fetching special offers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpecialOffers();