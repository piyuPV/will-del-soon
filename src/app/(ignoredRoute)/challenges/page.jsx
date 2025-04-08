"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trophy } from "lucide-react";
import { toast } from 'react-hot-toast';

const preBuiltChallenges = [
  {
    _id: "1",
    name: "30-Day Pushup Challenge",
    description: "Complete 100 pushups every day for 30 days. Track your progress and compete with others to build upper body strength.",
    target: "100 pushups per day",
    isPublic: true,
    maxParticipants: 50,
    participants: [],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: "active"
  },
  {
    _id: "2",
    name: "5K Run Challenge",
    description: "Run 5 kilometers in under 30 minutes. Perfect for improving cardiovascular health and endurance.",
    target: "5 kilometers in 30 minutes",
    isPublic: true,
    maxParticipants: 30,
    participants: [],
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    status: "active"
  }
];

export default function ChallengesPage() {
  const router = useRouter();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const response = await fetch('/api/challenges');
      const data = await response.json();
      if (response.ok) {
        setChallenges(data.length > 0 ? data : preBuiltChallenges);
      } else {
        setChallenges(preBuiltChallenges);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast.error('Failed to load challenges');
      setChallenges(preBuiltChallenges);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChallenge = async (challengeId) => {
    try {
      const response = await fetch('/api/challenges/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ challengeId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join challenge');
      }

      toast.success('Successfully joined the challenge!');
      fetchChallenges(); // Refresh the challenges list
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#3E2723]">Challenges</h1>
        <Button 
          onClick={() => router.push('/challenges/create')}
          className="flex items-center gap-2 bg-[#795548] hover:bg-[#5D4037] text-white"
        >
          <Plus className="h-4 w-4" />
          Create Challenge
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#795548]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {challenges.map((challenge) => (
            <Card key={challenge._id} className="hover:shadow-lg transition-shadow border-2 border-[#3E2723] bg-white">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-[#795548]" />
                  <CardTitle className="text-[#3E2723]">{challenge.name}</CardTitle>
                </div>
                <CardDescription className="text-[#5D4037]">{challenge.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-[#795548]">
                    Target: {challenge.target}
                  </p>
                  <p className="text-sm text-[#795548]">
                    {challenge.participants.length} / {challenge.maxParticipants} participants
                  </p>
                  <p className="text-sm text-[#795548]">
                    Ends: {new Date(challenge.endDate).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  className="border-2 border-[#3E2723] text-[#3E2723] hover:bg-[#F9ECCC]"
                  onClick={() => router.push(`/challenges/${challenge._id}`)}
                >
                  View Details
                </Button>
                <Button
                  variant="outline"
                  className="border-2 border-[#3E2723] text-[#3E2723] hover:bg-[#F9ECCC]"
                  onClick={() => handleJoinChallenge(challenge._id)}
                >
                  Join Challenge
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 