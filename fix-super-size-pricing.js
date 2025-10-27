import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixSuperSizePricing() {
  try {
    console.log('🔄 Fixing SUPER_SIZE pricing for Nishath deal...');
    
    // The Nishath deal has SUPER_SIZE with price 8.7 in the old data
    // Since SUPER_SIZE is larger than LARGE, we'll use it as the large price
    await prisma.pizzaBuilderDeal.update({
      where: { id: 'cmgyrcgh90001caso28y6v12e' },
      data: {
        largePrice: 8.7  // Using SUPER_SIZE price as the large price
      }
    });
    
    console.log('✅ Updated SUPER_SIZE pricing for Nishath deal');
    
  } catch (error) {
    console.error('❌ Error fixing SUPER_SIZE pricing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSuperSizePricing();