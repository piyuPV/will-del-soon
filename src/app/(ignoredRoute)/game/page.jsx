"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Star, Lock } from 'lucide-react';

// Initial game data
const initialGames = [
  {
    id: 'pushup',
    title: 'PUSHUP MASTER',
    description: 'Perfect your pushup form and challenge yourself to new records',
    currentLevel: 1,
    levels: [
      { number: 1, stars: 0, required: 10, unlocked: true },
      { number: 2, stars: 0, required: 20, unlocked: false },
      { number: 3, stars: 0, required: 30, unlocked: false },
      { number: 4, stars: 0, required: 40, unlocked: false },
      { number: 5, stars: 0, required: 50, unlocked: false },
    ]
  },
  {
    id: 'squat',
    title: 'SQUAT MASTER',
    description: 'Master the perfect squat form and build lower body strength',
    currentLevel: 1,
    levels: [
      { number: 1, stars: 0, required: 5, unlocked: true },
      { number: 2, stars: 0, required: 10, unlocked: false },
      { number: 3, stars: 0, required: 20, unlocked: false },
      { number: 4, stars: 0, required: 30, unlocked: false },
      { number: 5, stars: 0, required: 40, unlocked: false },
    ]
  }
];

const pariticipatedGames = async () => {
  try {
    const response = await fetch('/api/games', {method: 'GET' });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data.challenges

  } catch (error) {
    console.error('Error fetching games:', error);
    throw new Error('Failed to fetch games');
  }
}

export default function GamePage() {
  const router = useRouter();
  const [games, setGames] = useState(initialGames);
  const [error, setError] = useState(null);


  const {data: gamesData, isPending} = useQuery({
    queryKey: ['games'],
    queryFn: pariticipatedGames,
  })

  console.log(gamesData)

    // Load saved progress from localStorage on mount
    useEffect(() => {
      const savedProgress = localStorage.getItem('gameProgress');
      if (savedProgress) {
        try {
          setGames(JSON.parse(savedProgress));
        } catch (err) {
          console.error('Error loading saved progress:', err);
          localStorage.removeItem('gameProgress'); // Clear invalid data
        }
      }
    }, []);

  // Check URL parameters for completed exercise
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const completedExercise = params.get('completed');
    const completedReps = parseInt(params.get('reps'), 10);
    const exerciseId = params.get('exercise')?.replace('s', ''); // Remove 's' from 'pushups' or 'squats'

    if (completedExercise && completedReps && exerciseId) {
      updateGameProgress(exerciseId, completedReps);
      // Clear URL parameters
      window.history.replaceState({}, '', '/game');
    }
  }, []);

  // Calculate stars based on reps completed
  const calculateStars = (completed, required) => {
    if (completed >= required * 1.5) return 3;
    if (completed >= required * 1.2) return 2;
    if (completed >= required) return 1;
    return 0;
  };

  // Update game progress when exercise is completed
  const updateGameProgress = (gameId, completedReps) => {
    setGames(prevGames => {
      const updatedGames = prevGames.map(game => {
        if (game.id === gameId) {
          const currentLevel = game.levels[game.currentLevel - 1];
          if (completedReps >= currentLevel.required) {
            // Calculate stars earned
            const stars = calculateStars(completedReps, currentLevel.required);

            // Update current level stars and unlock next level
            const updatedLevels = game.levels.map((level, index) => {
              if (index === game.currentLevel - 1) {
                return { ...level, stars };
              }
              if (index === game.currentLevel) {
                return { ...level, unlocked: true };
              }
              return level;
            });

            // Move to next level if available
            const nextLevel = Math.min(game.currentLevel + 1, game.levels.length);

            return {
              ...game,
              currentLevel: nextLevel,
              levels: updatedLevels
            };
          }
        }
        return game;
      });

      // Save progress to localStorage
      try {
        localStorage.setItem('gameProgress', JSON.stringify(updatedGames));
      } catch (err) {
        console.error('Error saving progress:', err);
      }
      return updatedGames;
    });
  };

  const handleLevelStart = (game, level) => {
    try {
      setError(null);
      const levelData = game.levels[level - 1];
      console.log(levelData, "LEVELDATA ------", levelData, "LEVEL ------", level, "GAME ------", game._id)
      // Determine the server URL based on exercise type
      let baseUrl;
      const exerciseType = game.exerciseType;
      
      switch (exerciseType) {
        case 'pushup':
          baseUrl = `http://localhost:3000?gamechallenge=${game._id}&reps=${levelData.required}&level=${level}`; // Pushup server
          break;
        case 'squat':
          baseUrl = `http://localhost:3001?gamechallenge=${game._id}&reps=${levelData.required}&level=${level}`; // Squat server
          break;
        case 'bicep':
          baseUrl = `http://localhost:3002?gamechallenge=${game._id}&reps=${levelData.required}&level=${level}`; // Bicep server
          break;
        default:
          baseUrl = 'http://localhost:3000'; // Default fallback
      }
      
      router.push(baseUrl); // Redirect to the appropriate server URL
      // Format URL to match exercise page expectations
      // const searchParams = new URLSearchParams();
  
      // // Set the workout type and exercise
      // searchParams.set('type', exerciseType);
      // searchParams.set('exercise', `${exerciseType}s`); // Add 's' for plural form
  
      // // Add level, target reps and challenge ID
      // searchParams.set('level', level.toString());
      // searchParams.set('target', levelData.required.toString());
      // searchParams.set('challengeId', game.id); // Include actual challenge ID
  
      // // Redirect to exercise page
      // window.location.href = `${baseUrl}?${searchParams.toString()}`;
    } catch (err) {
      console.error('Error starting exercise:', err);
      setError('Unable to start exercise. Please try again later.');
    }
  };

  return (
    <div className="mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-brown">GAMIFICATION</h1>
        <p className="text-[#8B4513] text-sm mt-1">Master each level to unlock new challenges</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-100 px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Game Cards Stack */}
      <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {!isPending && gamesData.map((game) => (
          <div
            key={game.id}
            className="bg-[#8B4513] rounded-lg overflow-hidden p-4"
          >
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">{game.title}</h2>
              <p className="text-gray-300 text-sm mt-1">{game.description}</p>
            </div>

            {/* Level Path */}
            <div className="relative py-8">
              {/* Path Line */}
              <div className="absolute top-1/2 left-4 right-4 h-1 bg-[#FFD700] -translate-y-1/2 z-0" />

              {/* Levels */}
              <div className="relative z-10 flex justify-between items-center px-4">
                {game.levels.map((level) => (
                  <div key={level.number} className="flex flex-col items-center">
                    <motion.button
                      whileHover={level.unlocked ? { scale: 1.05 } : {}}
                      whileTap={level.unlocked ? { scale: 0.95 } : {}}
                      onClick={() => level.unlocked && handleLevelStart(game.id, level.number)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${level.unlocked
                          ? 'bg-[#8B4513] cursor-pointer'
                          : 'bg-[#5C4033] cursor-not-allowed'
                        } border-2 border-[#FFD700] relative mb-2`}
                    >
                      <span className="text-lg font-bold text-white">{level.number}</span>
                      {!level.unlocked && (
                        <Lock className="absolute text-[#FFD700] w-4 h-4 -top-1 -right-1" />
                      )}
                    </motion.button>

                    {/* Stars */}
                    <div className="flex gap-0.5 mb-1">
                      {[1, 2, 3].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${star <= level.stars ? 'text-[#FFD700]' : 'text-[#5C4033]'
                            }`}
                          fill={star <= level.stars ? '#FFD700' : 'none'}
                        />
                      ))}
                    </div>

                    {/* Required Score */}
                    <span className="text-xs text-gray-300">
                      {level.required} reps
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Info */}
            <div className="mt-4 flex justify-between items-center bg-[#5C4033] p-3 rounded-lg">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <Trophy className="w-5 h-5 mx-auto mb-1 text-[#FFD700]" />
                  <div className="text-xs text-gray-300">Current Level</div>
                  <div className="text-lg font-bold text-white">{game.currentLevel}</div>
                </div>
                <div className="text-center">
                  <Star className="w-5 h-5 mx-auto mb-1 text-[#FFD700]" fill="#FFD700" />
                  <div className="text-xs text-gray-300">Total Stars</div>
                  <div className="text-lg font-bold text-white">
                    {game.levels.reduce((sum, level) => sum + level.stars, 0)}/{game.levels.length * 3}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleLevelStart(game, game.currentLevel)}
                className="px-4 py-2 bg-[#A0522D] hover:bg-[#8B4513] rounded-lg text-white text-sm font-bold transition-colors whitespace-nowrap"
              >
                CONTINUE LEVEL {game.currentLevel}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>

  );
} 