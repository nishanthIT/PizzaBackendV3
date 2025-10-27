import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function migratePizzaBuilderPricing() {
  try {
    console.log('🔄 Starting Pizza Builder pricing migration...');
    
    const deals = await prisma.pizzaBuilderDeal.findMany();
    console.log(`📊 Found ${deals.length} pizza builder deals to migrate`);
    
    for (const deal of deals) {
      console.log(`🔄 Migrating deal: ${deal.name}`);
      
      let smallPrice = null;
      let mediumPrice = null;
      let largePrice = null;
      
      // Parse existing sizePricing JSON if it exists
      if (deal.sizePricing && typeof deal.sizePricing === 'object') {
        const pricing = deal.sizePricing;
        
        // Map the pricing to our new individual fields
        smallPrice = pricing.SMALL || null;
        mediumPrice = pricing.MEDIUM || null;
        largePrice = pricing.LARGE || null;
        
        // Handle SUPER_SIZE as large if LARGE doesn't exist
        if (!largePrice && pricing.SUPER_SIZE) {
          largePrice = pricing.SUPER_SIZE;
        }
        
        console.log(`   Small: £${smallPrice}, Medium: £${mediumPrice}, Large: £${largePrice}`);
        
        // Update the deal with new pricing fields
        await prisma.pizzaBuilderDeal.update({
          where: { id: deal.id },
          data: {
            smallPrice: smallPrice ? parseFloat(smallPrice) : null,
            mediumPrice: mediumPrice ? parseFloat(mediumPrice) : null,
            largePrice: largePrice ? parseFloat(largePrice) : null,
          }
        });
        
        console.log(`✅ Migrated pricing for: ${deal.name}`);
      } else {
        console.log(`⚠️  No valid pricing found for deal: ${deal.name}`);
        // Set default prices or leave as null - you can customize this
        await prisma.pizzaBuilderDeal.update({
          where: { id: deal.id },
          data: {
            smallPrice: null,
            mediumPrice: null,
            largePrice: null,
          }
        });
      }
    }
    
    console.log('✅ Pizza Builder pricing migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('🎉 Migration script completed successfully!');
  }
}

migratePizzaBuilderPricing();