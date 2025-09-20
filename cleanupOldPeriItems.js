import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanupOldPeriItems() {
  try {
    console.log('=== CLEANING UP OLD PERI PERI ITEMS ===\n');
    
    // Remove the old "Peri Peri Chicken" from OtherItem table
    const oldPeriItemId = 'cmfexb0px0002uk4ozx6x3dec';
    
    console.log(`Removing old Peri Peri item with ID: ${oldPeriItemId}`);
    
    const deletedItem = await prisma.otherItem.delete({
      where: {
        id: oldPeriItemId
      }
    });
    
    console.log('✅ Successfully removed old Peri Peri item:');
    console.log(`   Name: ${deletedItem.name}`);
    console.log(`   Price: ${deletedItem.price}`);
    console.log('');
    
    // Verify no more peri items in OtherItem table
    const remainingPeriItems = await prisma.otherItem.findMany({
      where: {
        name: {
          contains: 'peri',
          mode: 'insensitive'
        }
      }
    });
    
    if (remainingPeriItems.length === 0) {
      console.log('✅ No more Peri items found in OtherItem table');
    } else {
      console.log('⚠️  Still found Peri items in OtherItem table:');
      remainingPeriItems.forEach(item => {
        console.log(`   - ${item.name} (ID: ${item.id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error cleaning up items:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOldPeriItems();
