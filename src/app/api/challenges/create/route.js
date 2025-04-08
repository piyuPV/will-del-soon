import { NextResponse } from 'next/server';
import Challenge from '@/model/challenge.model';
import connectDB from '@/lib/initializeDB';
import { getUserIdFromToken } from '../../userChat/route';

export async function POST(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const {
      name,
      description,
      exerciseType,
      isPublic,
      maxParticipants,
      endDate,
      levels, // Array of level objects with number, required reps
    } = await req.json();

    const userId = getUserIdFromToken(req);

    // Prepare levels with star thresholds
    const preparedLevels = levels.map(level => ({
      number: level.number,
      required: level.required,
      starThresholds: {
        oneStar: level.required,                   // 100% of required
        twoStars: Math.floor(level.required * 1.2), // 120% of required
        threeStars: Math.floor(level.required * 1.5) // 150% of required
      }
    }));

    // Initialize first level progress for creator
    const initialLevelProgress = preparedLevels.map((level, index) => ({
      levelNumber: level.number,
      stars: 0,
      unlocked: index === 0, // Only first level is unlocked initially
      bestAttempt: {
        reps: 0,
        completedAt: null
      },
      attempts: []
    }));

    const challenge = new Challenge({
      name,
      description,
      exerciseType,
      isPublic,
      maxParticipants,
      createdBy: userId,
      endDate: new Date(endDate),
      levels: preparedLevels,
      participants: [{
        user: userId,
        joinedAt: new Date(),
        currentLevel: 1,
        totalStars: 0,
        levelProgress: initialLevelProgress
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