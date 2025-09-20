import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixPricesPrecision() {
  try {
    console.log('=== FIXING PRICE PRECISION ISSUES ===\n');
    
    // Get all PeriPeri items
    const periPeriItems = await prisma.periPeriItem.findMany();
    
    for (const item of periPeriItems) {
      const currentMealPrice = parseFloat(item.mealDealPrice);
      const fixedMealPrice = Math.round(currentMealPrice * 100) / 100; // Round to 2 decimal places
      
      if (currentMealPrice !== fixedMealPrice) {
        console.log(`Fixing ${item.name}:`);
        console.log(`  Before: ${currentMealPrice}`);
        console.log(`  After:  ${fixedMealPrice}`);
        
        await prisma.periPeriItem.update({
          where: { id: item.id },
          data: { 
            mealDealPrice: fixedMealPrice.toString()
          }
        });
        console.log('  ✅ Updated\n');
      } else {
        console.log(`${item.name}: Price already correct (${fixedMealPrice})`);
      }
    }
    
    // Verify the fix
    console.log('\n=== VERIFICATION ===');
    const updatedItems = await prisma.periPeriItem.findMany();
    updatedItems.forEach(item => {
      console.log(`${item.name}: Base £${item.basePrice}, Meal Deal £${item.mealDealPrice}`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing prices:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixPricesPrecision();
