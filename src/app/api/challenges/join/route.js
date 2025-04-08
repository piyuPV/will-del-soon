import { NextResponse } from 'next/server';
import { getUserIdFromToken } from '../../userChat/route';
import Challenge from '@/model/challenge.model';
import connectDB from '@/lib/initializeDB';

export async function POST(req) {
  try {
    await connectDB();
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { challengeId } = await req.json();

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const userId = getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is already a participant
    const isParticipant = challenge.participants.some(
      p => p.user.toString() === userId.toString()
    );

    if (isParticipant) {
      return NextResponse.json({ error: 'Already joined this challenge' }, { status: 400 });
    }

    // Check if challenge is full
    if (challenge.participants.length >= challenge.maxParticipants) {
      return NextResponse.json({ error: 'Challenge is full' }, { status: 400 });
    }

    // Initialize level progress for new participant
    const initialLevelProgress = challenge.levels.map((level, index) => ({
      levelNumber: level.number,
      stars: 0,
      unlocked: index === 0, // Only first level is unlocked initially
      bestAttempt: {
        reps: 0,
        completedAt: null
      },
      attempts: []
    }));

    // Add user to participants with proper initialization
    challenge.participants.push({
      user: userId,
      joinedAt: new Date(),
      currentLevel: 1,
      totalStars: 0,
      levelProgress: initialLevelProgress
    });

    await challenge.save();

    return NextResponse.json({ 
      message: 'Successfully joined challenge',
      challenge: {
        id: challenge._id,
        name: challenge.name,
        currentLevel: 1,
        totalStars: 0,
        levels: initialLevelProgress
      }
    });
  } catch (error) {
    console.error('Error joining challenge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}