import { NextResponse } from "next/server";
import connectDB from "@/lib/initializeDB";
import Challenge from '@/model/challenge.model';
import { getUserIdFromToken } from "../userChat/route";

export async function GET(req) {
    try {
        await connectDB();
        const token = req.cookies.get("token")?.value;
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = getUserIdFromToken(req);
        if (!userId) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        // Find challenges where the user is a participant
        const participantChallenges = await Challenge.find({
            'participants.user': userId
        }).select({
            'name': 1,
            'description': 1,
            'exerciseType': 1,
            'levels': 1,
            'status': 1,
            'participants': {
                $elemMatch: { user: userId }
            }
        });
        
        if (!participantChallenges || participantChallenges.length === 0) {
            return NextResponse.json({ challenges: [] }, { status: 200 });
        }

        // Transform the data to fit the game format needed by frontend
        const formattedChallenges = participantChallenges.map(challenge => {
            const userProgress = challenge.participants[0]; // This contains only the matched participant due to $elemMatch
            
            // Format the levels data
            const formattedLevels = challenge.levels.map(level => {
                const userLevelProgress = userProgress.levelProgress?.find(
                    p => p.levelNumber === level.number
                ) || { stars: 0, unlocked: level.number === 1 };
                
                return {
                    number: level.number,
                    stars: userLevelProgress.stars || 0,
                    required: level.required,
                    unlocked: userLevelProgress.unlocked || false
                };
            });
            
            return {
                id: challenge._id,
                title: challenge.name.toUpperCase(),
                description: challenge.description,
                currentLevel: userProgress.currentLevel || 1,
                exerciseType: challenge.exerciseType,
                status: challenge.status,
                levels: formattedLevels
            };
        });

        return NextResponse.json({ 
            challenges: formattedChallenges 
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching challenges:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}