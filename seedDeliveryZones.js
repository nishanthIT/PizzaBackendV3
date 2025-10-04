import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDeliveryZones() {
  try {
    console.log('🌱 Seeding delivery zones...');
    
    // Check if zones already exist
    const existingZones = await prisma.deliveryZone.count();
    
    if (existingZones > 0) {
      console.log('⚠️ Delivery zones already exist. Skipping seed.');
      return;
    }
    
    // Create default zones
    const defaultZones = [
      {
        name: 'Zone 1 (0-2 miles)',
        minDistance: 0,
        maxDistance: 2,
        charge: 2.95,
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'Zone 2 (2-3 miles)',
        minDistance: 2,
        maxDistance: 3,
        charge: 3.95,
        isActive: true,
        sortOrder: 2
      },
      {
        name: 'Zone 3 (3-4 miles)',
        minDistance: 3,
        maxDistance: 4,
        charge: 4.95,
        isActive: true,
        sortOrder: 3
      }
    ];
    
    const createdZones = await prisma.deliveryZone.createMany({
      data: defaultZones
    });
    
    console.log(`✅ Created ${createdZones.count} delivery zones`);
    
    // Create default delivery settings
    const existingSettings = await prisma.deliverySettings.count();
    
    if (existingSettings === 0) {
      await prisma.deliverySettings.create({
        data: {
          maxDeliveryDistance: 4,
          isDeliveryEnabled: true
        }
      });
      console.log('✅ Created delivery settings');
    }
    
    console.log('🎉 Delivery zones seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding delivery zones:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedDeliveryZones();