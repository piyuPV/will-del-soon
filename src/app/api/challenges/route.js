import { NextResponse } from 'next/server';
import { getUserIdFromToken } from '../userChat/route';
import Challenge from '@/model/challenge.model';
import  connectDB  from '@/lib/initializeDB';

export async function GET(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const userId = getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch public challenges and challenges the user has joined
    const challenges = await Challenge.find({
      $or: [
        { isPublic: true },
        { 'participants.user': userId },
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