import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkDuplicatePeriItems() {
  try {
    console.log('=== CHECKING FOR DUPLICATE PERI PERI ITEMS ===\n');
    
    // Check OtherItems with "peri" in name
    console.log('1. OTHER ITEMS (containing "peri"):');
    const otherItems = await prisma.otherItem.findMany({
      where: {
        name: {
          contains: 'peri',
          mode: 'insensitive'
        }
      }
    });
    
    if (otherItems.length === 0) {
      console.log('   No Peri items found in OtherItem table');
    } else {
      otherItems.forEach(item => {
        console.log(`   ID: ${item.id}`);
        console.log(`   Name: ${item.name}`);
        console.log(`   Price: ${item.price}`);
        console.log(`   Category: ${item.categoryId}`);
        console.log('   ---');
      });
    }
    
    // Check PeriPeriItems
    console.log('\n2. PERI PERI ITEMS (dedicated table):');
    const periPeriItems = await prisma.periPeriItem.findMany();
    
    if (periPeriItems.length === 0) {
      console.log('   No items found in PeriPeriItem table');
    } else {
      periPeriItems.forEach(item => {
        console.log(`   ID: ${item.id}`);
        console.log(`   Name: ${item.name}`);
        console.log(`   Base Price: ${item.basePrice}`);
        console.log(`   Meal Deal Price: ${item.mealDealPrice}`);
        console.log(`   Item Type: ${item.itemType}`);
        console.log('   ---');
      });
    }
    
    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`OtherItems with "peri": ${otherItems.length}`);
    console.log(`PeriPeriItems: ${periPeriItems.length}`);
    
    if (otherItems.length > 0 && periPeriItems.length > 0) {
      console.log('\n⚠️  ISSUE: You have Peri Peri items in BOTH tables!');
      console.log('This is causing duplicates on the frontend.');
      console.log('\nSOLUTION: Remove old Peri Peri items from OtherItem table');
    }
    
  } catch (error) {
    console.error('Error checking items:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicatePeriItems();
