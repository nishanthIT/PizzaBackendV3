import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkDeals() {
  try {
    const deals = await prisma.pizzaBuilderDeal.findMany({
      select: {
        id: true,
        name: true,
        maxToppings: true,
        isActive: true
      }
    });
    
    console.log('Available Pizza Builder Deals:');
    deals.forEach((deal, i) => {
      console.log(`${i+1}. ${deal.name}`);
      console.log(`   ID: ${deal.id}`);
      console.log(`   maxToppings: ${deal.maxToppings}`);
      console.log(`   Active: ${deal.isActive}`);
      console.log('');
    });
    
    console.log('URLs to test different deals:');
    deals.forEach(deal => {
      console.log(`${deal.name} (${deal.maxToppings} toppings): /product-details?id=PIZZA_ID&pizzaBuilder=true&dealId=${deal.id}`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkDeals();