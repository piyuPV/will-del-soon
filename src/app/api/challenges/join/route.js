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

    const { challengeId } = await req.json();
    await connectToDB();

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Check if user is already a participant
    const isParticipant = challenge.participants.some(
      p => p.user.toString() === session.user.id
    );

    if (isParticipant) {
      return NextResponse.json({ error: 'Already joined this challenge' }, { status: 400 });
    }

    // Check if challenge is full
    if (challenge.participants.length >= challenge.maxParticipants) {
      return NextResponse.json({ error: 'Challenge is full' }, { status: 400 });
    }

    // Add user to participants
    challenge.participants.push({
      user: session.user.id,
      progress: 0,
    });

    await challenge.save();

    return NextResponse.json({ message: 'Successfully joined challenge' });
  } catch (error) {
    console.error('Error joining challenge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 