// import { NextResponse } from 'next/server';
// import { connectToDB } from '@/lib/db';
// import Challenge from '@/model/challenge.model';

// const preBuiltChallenges = [
//   {
//     name: "30-Day Pushup Challenge",
//     description: "Complete 100 pushups every day for 30 days. Track your progress and compete with others to build upper body strength.",
//     target: "100 pushups per day",
//     isPublic: true,
//     maxParticipants: 50,
//     endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
//     participants: [],
//     status: "active"
//   },
//   {
//     name: "5K Run Challenge",
//     description: "Run 5 kilometers in under 30 minutes. Perfect for improving cardiovascular health and endurance.",
//     target: "5 kilometers in 30 minutes",
//     isPublic: true,
//     maxParticipants: 30,
//     endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
//     participants: [],
//     status: "active"
//   }
// ];

// export async function POST() {
//   try {
//     await connectToDB();

//     // Clear existing challenges
//     await Challenge.deleteMany({});

//     // Insert pre-built challenges
//     const challenges = await Challenge.insertMany(preBuiltChallenges);

//     return NextResponse.json({ 
//       message: 'Challenges seeded successfully',
//       challenges 
//     });
//   } catch (error) {
//     console.error('Error seeding challenges:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// } 