const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPeriItems() {
  try {
    // Check for Peri items in OtherItem table
    const otherItems = await prisma.otherItem.findMany({
      where: {
        name: {
          contains: 'Peri',
          mode: 'insensitive'
        }
      }
    });

    // Check PeriPeriItem table
    const periItems = await prisma.periPeriItem.findMany();

    console.log('=== OtherItems with "Peri" in name ===');
    console.log(JSON.stringify(otherItems, null, 2));
    
    console.log('\n=== PeriPeriItems ===');
    console.log(JSON.stringify(periItems, null, 2));

    // Also check all OtherItems to see what's there
    const allOtherItems = await prisma.otherItem.findMany();
    console.log('\n=== All OtherItems ===');
    console.log(JSON.stringify(allOtherItems, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPeriItems();
