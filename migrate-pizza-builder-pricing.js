import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migratePizzaBuilderPricing() {
  try {
    console.log('🔄 Starting Pizza Builder pricing migration...');

    // Get all pizza builder deals with existing sizePricing data
    const deals = await prisma.pizzaBuilderDeal.findMany({
      select: {
        id: true,
        name: true,
        sizePricing: true
      }
    });

    console.log(`📊 Found ${deals.length} pizza builder deals to migrate`);

    for (const deal of deals) {
      try {
        let sizePricing = deal.sizePricing;
        
        // Parse sizePricing if it's a string
        if (typeof sizePricing === 'string') {
          try {
            sizePricing = JSON.parse(sizePricing);
          } catch (e) {
            console.warn(`⚠️  Could not parse sizePricing for deal ${deal.name}: ${e.message}`);
            continue;
          }
        }

        // Extract individual prices from the JSON
        const smallPrice = sizePricing?.Small || sizePricing?.small || null;
        const mediumPrice = sizePricing?.Medium || sizePricing?.medium || null;
        const largePrice = sizePricing?.Large || sizePricing?.large || null;

        console.log(`🔄 Migrating deal: ${deal.name}`);
        console.log(`   Small: £${smallPrice}, Medium: £${mediumPrice}, Large: £${largePrice}`);

        // Update the deal with individual price fields
        // Note: We're adding the new fields while keeping the old sizePricing for now
        const updateData = {};
        if (smallPrice !== null && smallPrice !== undefined) {
          updateData.smallPrice = parseFloat(smallPrice);
        }
        if (mediumPrice !== null && mediumPrice !== undefined) {
          updateData.mediumPrice = parseFloat(mediumPrice);
        }
        if (largePrice !== null && largePrice !== undefined) {
          updateData.largePrice = parseFloat(largePrice);
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.$executeRaw`
            UPDATE "pizza_builder_deals" 
            SET 
              "smallPrice" = ${updateData.smallPrice || null},
              "mediumPrice" = ${updateData.mediumPrice || null},
              "largePrice" = ${updateData.largePrice || null}
            WHERE id = ${deal.id}
          `;
          
          console.log(`✅ Successfully migrated deal: ${deal.name}`);
        } else {
          console.log(`⚠️  No valid pricing found for deal: ${deal.name}`);
        }

      } catch (error) {
        console.error(`❌ Error migrating deal ${deal.name}:`, error.message);
      }
    }

    console.log('✅ Pizza Builder pricing migration completed!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migratePizzaBuilderPricing()
  .then(() => {
    console.log('🎉 Migration script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });