const { PrismaClient } = require('@prisma/client');
const { welcomeMessages } = require('../utils/welcome-messages');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed process...');
  
  try {
    // First, delete all existing records
    console.log('Cleaning existing welcome thoughts...');
    await prisma.welcomeThought.deleteMany({});
    console.log('Successfully cleared welcome thoughts table');

    // Then seed with new data
    console.log('Seeding welcome thoughts...');
    
    const thoughts = welcomeMessages.map(msg => {
      if (!msg.firstName || !msg.lastName) {
        console.warn('Invalid message data:', msg);
        return null;
      }
      
      return {
        senderUserId: 'system',
        firstName: msg.firstName,
        lastName: msg.lastName,
        email: msg.email || null,
        role: msg.role || 'system',
        message: msg.message
      };
    })
    .filter(Boolean);

    if (thoughts.length === 0) {
      console.error('No valid thoughts to seed');
      return;
    }

    console.log(`Preparing to seed ${thoughts.length} thoughts`);
    console.log('First thought example:', thoughts[0]);

    await prisma.welcomeThought.createMany({
      data: thoughts
    });

    console.log(`Successfully seeded ${thoughts.length} welcome thoughts`);
  } catch (error) {
    console.error('Seed failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Failed to seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 