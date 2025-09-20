import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixSpecificPrice() {
  try {
    console.log('Fixing Half Peri-Peri Chicken price...');
    
    await prisma.periPeriItem.update({
      where: { id: 'cmfez6h7n0001uk5shtrfqk1a' },
      data: { mealDealPrice: '9.95' }
    });

    const updated = await prisma.periPeriItem.findUnique({
      where: { id: 'cmfez6h7n0001uk5shtrfqk1a' }
    });

    console.log('✅ Updated price:', updated.mealDealPrice);
    
    // Check all prices now
    console.log('\n=== ALL PRICES ===');
    const allItems = await prisma.periPeriItem.findMany();
    allItems.forEach(item => {
      console.log(`${item.name}: Base £${item.basePrice}, Meal £${item.mealDealPrice}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixSpecificPrice();
