'use server';

import prisma from './db';
import { welcomeMessages } from '@/utils/welcome-messages';

async function ensureUserExists(clerkId, { email, firstName, lastName }) {
  try {
    let user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      console.log(`Creating new user record for Clerk ID: ${clerkId}`, {
        email,
        firstName,
        lastName
      });
      
      user = await prisma.user.create({
        data: {
          clerkId,
          email,
          firstName: firstName || null,
          lastName: lastName || null,
        }
      });
      console.log(`Created user: ${JSON.stringify(user)}`);
    }

    return user;
  } catch (error) {
    console.error('Error ensuring user exists:', {
      error: error.message,
      code: error.code,
      clerkId,
      email,
      firstName,
      lastName,
      stack: error.stack
    });
    throw error;
  }
}

export async function saveThought({ userId, personName, message, userDetails }) {
  if (!userId || !userDetails?.email) {
    console.error('Missing required user data:', { userId, userDetails });
    return { 
      success: false, 
      error: 'Missing required user data',
      details: 'User ID and email are required'
    };
  }

  try {
    console.log('Attempting to save thought:', {
      userId,
      personName,
      messageLength: message?.length,
      userDetails: {
        ...userDetails,
        email: userDetails.email.slice(0, 3) + '***' // Log partial email for privacy
      }
    });

    // First ensure user exists with all details
    const user = await ensureUserExists(userId, userDetails);
    console.log('User record:', { 
      id: user.id, 
      clerkId: user.clerkId 
    });

    const savedThought = await prisma.savedThought.create({
      data: {
        personName,
        message,
        user: {
          connect: { id: user.id }
        }
      }
    });

    console.log('Successfully saved thought:', {
      thoughtId: savedThought.id,
      userId: user.id,
      personName: savedThought.personName
    });

    return { success: true, data: savedThought };
  } catch (error) {
    console.error('Failed to save thought:', {
      error: error.message,
      code: error.code,
      userId,
      personName,
      stack: error.stack,
      cause: error.cause,
      name: error.name,
      type: error.type
    });

    // Check for specific error types
    if (error.code === 'P2002') {
      return {
        success: false,
        error: 'Database constraint violation',
        details: 'A unique constraint was violated'
      };
    }

    if (error.code === 'P2025') {
      return {
        success: false,
        error: 'Record not found',
        details: 'The user record could not be found'
      };
    }

    return { 
      success: false, 
      error: 'Failed to save thought',
      details: error.message
    };
  }
}

export async function getThoughtsByUserId(clerkId) {
  try {
    console.log('Fetching thoughts for user:', { clerkId });

    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      console.log('User not found in database:', { clerkId });
      return { success: false, error: 'User not found' };
    }

    const thoughts = await prisma.savedThought.findMany({
      where: {
        userId: user.id,
        isArchived: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Successfully fetched thoughts:', {
      userId: user.id,
      thoughtCount: thoughts.length
    });

    return { success: true, data: thoughts };
  } catch (error) {
    console.error('Failed to fetch thoughts:', {
      error: error.message,
      code: error.code,
      clerkId,
      stack: error.stack
    });
    return { 
      success: false, 
      error: 'Failed to fetch thoughts',
      details: error.message
    };
  }
}

export async function initializeWelcomeThoughts() {
  const count = await prisma.welcomeThought.count();
  
  if (count === 0) {
    console.log('Initializing welcome thoughts from file...');
    
    try {
      const thoughts = welcomeMessages.map(msg => ({
        senderUserId: 'system',  // or specific user ID
        firstName: msg.firstName,
        lastName: msg.lastName,
        email: msg.email || null,
        role: msg.role,
        message: msg.message
      }));

      await prisma.welcomeThought.createMany({
        data: thoughts
      });

      console.log(`Successfully initialized ${thoughts.length} welcome thoughts`);
    } catch (error) {
      console.error('Failed to initialize welcome thoughts:', error);
    }
  }
}

export async function getWelcomeThought(firstName, lastName) {
  // Helper function to match names with wildcards
  const matchesName = (pattern, name) => {
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return name.startsWith(prefix);
    }
    return pattern === name;
  };

  try {
    const welcomeThoughts = await prisma.welcomeThought.findMany({
      where: {
        OR: [
          { firstName: firstName },
          { firstName: firstName + '*' },
          { firstName: { startsWith: firstName } }
        ],
        lastName: lastName
      }
    });

    const match = welcomeThoughts.find(thought => 
      matchesName(thought.firstName, firstName) && 
      thought.lastName === lastName
    );

    if (match) {
      return {
        role: match.role,
        content: match.message,
        skipContext: true
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch welcome thought:', error);
    return null;
  }
} 