'use server';

import prisma from './db';

async function ensureUserExists(clerkId, { email, firstName, lastName }) {
  try {
    // First try to find by clerkId
    let user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (user) {
      // User exists with this clerkId - update their details if needed
      if (user.email !== email || user.firstName !== firstName || user.lastName !== lastName) {
        user = await prisma.user.update({
          where: { clerkId },
          data: {
            email,
            firstName: firstName || null,
            lastName: lastName || null,
          }
        });
      }
      return user;
    }

    // No user with this clerkId - check if email exists
    const existingUserWithEmail = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUserWithEmail) {
      console.warn('Email collision detected:', {
        email,
        existingClerkId: existingUserWithEmail.clerkId,
        newClerkId: clerkId
      });

      // Create user with a modified email to maintain uniqueness
      user = await prisma.user.create({
        data: {
          clerkId,
          email: `${email}.${clerkId.slice(0, 8)}`, // Append part of clerkId to email
          firstName: firstName || null,
          lastName: lastName || null,
        }
      });

      // Log the incident for monitoring
      console.log('Created user with modified email:', {
        originalEmail: email,
        modifiedEmail: user.email,
        clerkId
      });

      return user;
    }

    // Normal case - create new user
    user = await prisma.user.create({
      data: {
        clerkId,
        email,
        firstName: firstName || null,
        lastName: lastName || null,
      }
    });

    return user;
  } catch (error) {
    console.error('Error in ensureUserExists:', {
      error: error.message,
      code: error.code,
      clerkId,
      email: email?.slice(0, 3) + '***', // Log partial email for privacy
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