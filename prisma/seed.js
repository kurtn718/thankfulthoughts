const { PrismaClient } = require('@prisma/client');
const { welcomeMessages } = require('../utils/welcome-messages');

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.welcomeThought.count();
  
  if (count === 0) {
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

    console.log('First thought example:', thoughts[0]);

    await prisma.welcomeThought.createMany({
      data: thoughts
    });

    console.log(`Seeded ${thoughts.length} welcome thoughts`);
  } else {
    console.log('Welcome thoughts already exist, skipping seed');
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