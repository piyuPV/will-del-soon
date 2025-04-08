"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import VideoStreamer from '@/components/VideoStreamer'
import BicepCamera from '@/components/BicepCamera'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

const exercises = [
  { id: 'deadlift', name: 'Deadlift', icon: '🏋️‍♂️' },
  { id: 'pushups', name: 'Push Ups', icon: '💪' },
  { id: 'biceps', name: 'Bicep Curls', icon: '💪' },
  { id: 'squats', name: 'Squats', icon: '🦵' },
  { id: 'lunges', name: 'Lunges', icon: '🏃‍♂️' },
  { id: 'plank', name: 'Plank', icon: '🧘‍♂️' }
]

function PosturePage() {
  const [selectedExercise, setSelectedExercise] = useState(null)
  const router = useRouter()

  // Handle exercise selection
  const selectExercise = (exercise) => {
    if (exercise.id === 'pushups' || exercise.id === 'squats') {
      // Redirect to localhost:8080 with exercise parameter
      const exerciseName = exercise.id;
      window.location.href = `http://localhost:8080?exercise=${exerciseName}`;
      return;
    }
    // For other exercises, continue with the normal flow
    setSelectedExercise(exercise)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-start">Posture Analysis</h1>

      {!selectedExercise ? (
        <div>
          <h2 className="text-lg text-neutral-600 mb-6">Select an exercise to analyze:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exercises.map(exercise => (
              <motion.div
                key={exercise.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => selectExercise(exercise)}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{exercise.icon}</div>
                    <div>
                      <h3 className="text-lg font-medium">{exercise.name}</h3>
                      <p className="text-sm text-gray-500">Click to analyze</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      ) : selectedExercise.id === 'biceps' ? (
        <BicepCamera setSelectedExercise={setSelectedExercise} />
      ) : (
        <VideoStreamer
          icon={selectedExercise.icon}
          name={selectedExercise.name}
          setSelectedExercise={setSelectedExercise}
        />
      )}
    </div>
  )
}

export default PosturePage