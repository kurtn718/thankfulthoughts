import { getAuth } from '@clerk/nextjs/server';
import prisma from '@/utils/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const auth = getAuth(request);
    const { userId: clerkId } = auth;

    if (!clerkId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 9;
    const search = searchParams.get('search') || '';

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Build where clause
    const where = {
      userId: user.id,
      isArchived: false,
      ...(search && {
        OR: [
          { personName: { contains: search, mode: 'insensitive' } },
          { message: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    // Get total count for pagination
    const total = await prisma.savedThought.count({ where });

    // Get thoughts with pagination
    const thoughts = await prisma.savedThought.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: thoughts,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    });

  } catch (error) {
    console.error('Failed to fetch thoughts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch thoughts' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const auth = getAuth(request);
    const { userId: clerkId } = auth;

    if (!clerkId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const thoughtId = searchParams.get('id');

    if (!thoughtId) {
      return NextResponse.json(
        { success: false, error: 'Thought ID is required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify ownership and delete
    const thought = await prisma.savedThought.findFirst({
      where: {
        id: thoughtId,
        userId: user.id
      }
    });

    if (!thought) {
      return NextResponse.json(
        { success: false, error: 'Thought not found' },
        { status: 404 }
      );
    }

    await prisma.savedThought.delete({
      where: { id: thoughtId }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Failed to delete thought:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete thought' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const auth = getAuth(request);
    const { userId: clerkId } = auth;

    if (!clerkId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const thoughtId = searchParams.get('id');
    const data = await request.json();

    if (!thoughtId) {
      return NextResponse.json(
        { success: false, error: 'Thought ID is required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify ownership and update
    const thought = await prisma.savedThought.findFirst({
      where: {
        id: thoughtId,
        userId: user.id
      }
    });

    if (!thought) {
      return NextResponse.json(
        { success: false, error: 'Thought not found' },
        { status: 404 }
      );
    }

    const updatedThought = await prisma.savedThought.update({
      where: { id: thoughtId },
      data: {
        personName: data.personName,
        message: data.message
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedThought
    });

  } catch (error) {
    console.error('Failed to update thought:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update thought' },
      { status: 500 }
    );
  }
} 