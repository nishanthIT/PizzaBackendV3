import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Environment check:');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL length:', process.env.DATABASE_URL?.length);
console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 20) + '...');

// Try different connection options
const configs = [
  {
    name: "Default (Pooled)",
    url: process.env.DATABASE_URL
  },
  {
    name: "Non-pooled", 
    url: process.env.DATABASE_URL?.replace('-pooler', '')
  },
  {
    name: "With timeout",
    url: process.env.DATABASE_URL + '&connect_timeout=30'
  }
];

async function testMultipleConnections() {
  for (const config of configs) {
    console.log(`\n🔄 Testing: ${config.name}`);
    console.log(`📍 URL: ${config.url?.substring(0, 50)}...`);
    
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: config.url
        }
      }
    });

    try {
      await prisma.$connect();
      console.log(`✅ ${config.name} - Connected successfully!`);
      
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      console.log(`📊 Query test passed:`, result);
      
      await prisma.$disconnect();
      console.log(`✅ ${config.name} - Connection works!`);
      break; // Stop at first successful connection
      
    } catch (error) {
      console.error(`❌ ${config.name} failed:`, error.message);
      await prisma.$disconnect();
    }
  }
}

testMultipleConnections();