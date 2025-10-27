import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkPizzaBuilderData() {
  try {
    console.log('🔍 Checking existing Pizza Builder data...\n');
    
    const deals = await prisma.pizzaBuilderDeal.findMany();
    
    console.log(`📊 Found ${deals.length} pizza builder deals:\n`);
    
    deals.forEach((deal, index) => {
      console.log(`${index + 1}. ${deal.name}`);
      console.log(`   ID: ${deal.id}`);
      console.log(`   Description: ${deal.description || 'None'}`);
      console.log(`   Max Toppings: ${deal.maxToppings}`);
      console.log(`   Available Sizes: ${JSON.stringify(deal.availableSizes)}`);
  console.log(`   Size Pricing: ${JSON.stringify(deal.sizePricing)}`);
  console.log(`   Medium Price: ${deal.mediumPrice}`);
  console.log(`   Large Price: ${deal.largePrice}`);
  console.log(`   Super Size Price: ${deal.superSizePrice}`);
      console.log(`   Is Active: ${deal.isActive}`);
      console.log(`   Created: ${deal.createdAt}`);
      console.log('   ---');
    });
    
  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPizzaBuilderData();