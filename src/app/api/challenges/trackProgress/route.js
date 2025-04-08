import { NextResponse } from 'next/server';
import Challenge from '@/model/challenge.model';
import connectDB from '@/lib/initializeDB';
import { getUserIdFromToken } from '../../userChat/route';

export async function POST(req) {
  try {
    // const token = req.cookies.get('token')?.value;
    // if (!token) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    await connectDB();

    const {
      challengeId,
      levelNumber,
      reps
    } = await req.json();

    const userId = getUserIdFromToken(req);

    // Find the challenge
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Find the user in participants
    const participantIndex = challenge.participants.findIndex(p => 
      p.user.toString() === userId.toString()
    );

    if (participantIndex === -1) {
      return NextResponse.json({ error: 'User not participating in this challenge' }, { status: 403 });
    }

    // Calculate stars earned
    const stars = challenge.calculateStars(reps, levelNumber);
    
    // Find the level in the challenge
    const level = challenge.levels.find(l => l.number === levelNumber);
    if (!level) {
      return NextResponse.json({ error: 'Level not found' }, { status: 404 });
    }

    // Update user progress
    const participant = challenge.participants[participantIndex];
    
    // Find level progress index
    const levelProgressIndex = participant.levelProgress.findIndex(lp => 
      lp.levelNumber === levelNumber
    );
    
    if (levelProgressIndex === -1) {
      return NextResponse.json({ error: 'Level progress not found' }, { status: 404 });
    }
    
    const levelProgress = participant.levelProgress[levelProgressIndex];
    
    // Add attempt
    levelProgress.attempts.push({
      reps,
      completedAt: new Date(),
      starsEarned: stars
    });
    
    // Update best attempt if applicable
    if (!levelProgress.bestAttempt.reps || reps > levelProgress.bestAttempt.reps) {
      levelProgress.bestAttempt = {
        reps,
        completedAt: new Date()
      };
    }
    
    // Update stars if new score is better
    if (stars > levelProgress.stars) {
      // Calculate new total stars
      const oldStars = levelProgress.stars;
      const starDifference = stars - oldStars;
      
      levelProgress.stars = stars;
      participant.totalStars += starDifference;
    }
    
    // Unlock next level if applicable
    if (stars > 0 && levelNumber < challenge.levels.length) {
      const nextLevelProgress = participant.levelProgress.find(lp => 
        lp.levelNumber === levelNumber + 1
      );
      
      if (nextLevelProgress) {
        nextLevelProgress.unlocked = true;
      }
      
      // Advance current level if needed
      if (participant.currentLevel === levelNumber) {
        participant.currentLevel = levelNumber + 1;
      }
    }
    
    await challenge.save();
    
    return NextResponse.json({
      message: 'Progress updated successfully',
      stars,
      totalStars: participant.totalStars,
      currentLevel: participant.currentLevel
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}