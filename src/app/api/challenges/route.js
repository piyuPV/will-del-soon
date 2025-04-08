import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import Challenge from '@/model/challenge';
import { connectToDB } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDB();

    // Fetch public challenges and challenges the user has joined
    const challenges = await Challenge.find({
      $or: [
        { isPublic: true },
        { 'participants.user': session.user.id }
      ]
    })
    .populate('createdBy', 'name')
    .populate('participants.user', 'name')
    .sort({ createdAt: -1 });

    return NextResponse.json(challenges);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 