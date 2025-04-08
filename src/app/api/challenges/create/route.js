import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import Challenge from '@/model/challenge';
import { connectToDB } from '@/lib/db';

export async function POST(req) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      name,
      description,
      target,
      isPublic,
      maxParticipants,
      endDate,
    } = await req.json();

    await connectToDB();

    const challenge = new Challenge({
      name,
      description,
      target,
      isPublic,
      maxParticipants,
      createdBy: session.user.id,
      endDate: new Date(endDate),
      participants: [{
        user: session.user.id,
        progress: 0,
      }],
    });

    await challenge.save();

    return NextResponse.json({ 
      message: 'Challenge created successfully',
      challengeId: challenge._id,
    });
  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 