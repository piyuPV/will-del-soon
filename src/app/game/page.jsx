"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Lock } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

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
      { number: 1, stars: 0, required: 10, unlocked: true },
      { number: 2, stars: 0, required: 20, unlocked: false },
      { number: 3, stars: 0, required: 30, unlocked: false },
      { number: 4, stars: 0, required: 40, unlocked: false },
      { number: 5, stars: 0, required: 50, unlocked: false },
    ]
  }
];

export default function GamePage() {
  const [games, setGames] = useState(initialGames);
  const [error, setError] = useState(null);

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

  const handleLevelStart = (gameId, level) => {
    try {
      setError(null);
      const game = games.find(g => g.id === gameId);
      const levelData = game.levels[level - 1];

      // Format URL to match exercise page expectations
      const baseUrl = 'http://localhost:8080';
      const searchParams = new URLSearchParams();
      
      // Set the workout type radio button value
      if (gameId === 'pushup') {
        searchParams.set('type', 'pushup');
        searchParams.set('exercise', 'pushups');
      } else {
        searchParams.set('type', 'squat');
        searchParams.set('exercise', 'squats');
      }
      
      // Add level and target reps
      searchParams.set('level', level.toString());
      searchParams.set('target', levelData.required.toString());
      
      // Redirect to exercise page
      window.location.href = `${baseUrl}?${searchParams.toString()}`;
    } catch (err) {
      console.error('Error starting exercise:', err);
      setError('Unable to start exercise. Please try again later.');
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-[#5C4033]">
        <AppSidebar className="h-screen flex-shrink-0" />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[calc(100vw-280px)] mx-auto px-4 py-6">
            {/* Header Section */}
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-white">GAMIFICATION</h1>
              <p className="text-gray-300 text-sm mt-1">Master each level to unlock new challenges</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-100 px-4 py-2 rounded-lg mb-4">
                {error}
              </div>
            )}

            {/* Game Cards Stack */}
            <div className="space-y-4">
              {games.map((game) => (
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
                            className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              level.unlocked 
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
                                className={`w-3 h-3 ${
                                  star <= level.stars ? 'text-[#FFD700]' : 'text-[#5C4033]'
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
                          {game.levels.reduce((sum, level) => sum + level.stars, 0)}/15
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleLevelStart(game.id, game.currentLevel)}
                      className="px-4 py-2 bg-[#A0522D] hover:bg-[#8B4513] rounded-lg text-white text-sm font-bold transition-colors whitespace-nowrap"
                    >
                      CONTINUE LEVEL {game.currentLevel}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
} 