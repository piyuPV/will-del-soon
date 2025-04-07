"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import VideoStreamer from '@/components/VideoStreamer'
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
  // const videoRef = useRef(null)
  // const streamRef = useRef(null)
  // const wsRef = useRef(null)

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

  // Start webcam and analysis
  // const startAnalysis = async () => {
  //   try {
  //     console.log('Starting webcam...')
  //     // Get webcam stream
  //     const stream = await navigator.mediaDevices.getUserMedia({
  //       video: { width: 640, height: 480 }
  //     })

  //     streamRef.current = stream
  //     videoRef.current.srcObject = stream

  //     // Connect to WebSocket server
  //     const ws = new WebSocket('ws://localhost:8000/posture-analysis')
  //     wsRef.current = ws

  //     ws.onopen = () => {
  //       console.log('Connected to Python backend')
  //       setIsAnalyzing(true)

  //       // Send exercise type to backend
  //       ws.send(JSON.stringify({
  //         type: 'exercise_selection',
  //         exercise: selectedExercise.id
  //       }))

  //       // Start sending frames
  //       sendVideoFrames()
  //     }

  //     ws.onmessage = (event) => {
  //       const data = JSON.parse(event.data)

  //       if (data.type === 'feedback') {
  //         setFeedback(data.message)
  //       } else if (data.type === 'rep_count') {
  //         setRepCount(data.count)
  //       }
  //     }

  //     ws.onclose = () => {
  //       console.log('Connection closed')
  //       stopAnalysis()
  //     }

  //     ws.onerror = (error) => {
  //       console.error('WebSocket error:', error)
  //       setError('Failed to connect to the analysis server.')
  //       stopAnalysis()
  //     }
  //   } catch (error) {
  //     console.error('Error starting webcam:', error)
  //     setError(`Error: ${error.message || 'Could not access webcam'}`)
  //     stopAnalysis()
  //   }
  // }

  // // Function to send video frames to backend
  // const sendVideoFrames = () => {
  //   const canvas = document.createElement('canvas')
  //   canvas.width = 640
  //   canvas.height = 480
  //   const ctx = canvas.getContext('2d')

  //   const sendFrame = () => {
  //     if (videoRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN && isAnalyzing) {
  //       // Draw current video frame to canvas
  //       ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

  //       // Convert canvas to blob and send to backend
  //       canvas.toBlob((blob) => {
  //         wsRef.current.send(blob)

  //         // Schedule next frame
  //         requestAnimationFrame(sendFrame)
  //       }, 'image/jpeg', 0.7) // Medium quality JPEG for performance
  //     }
  //   }

  //   sendFrame()
  // }

  // // Stop analysis and cleanup
  // const stopAnalysis = () => {
  //   setIsAnalyzing(false)

  //   // Close WebSocket connection
  //   if (wsRef.current) {
  //     wsRef.current.close()
  //     wsRef.current = null
  //   }

  //   // Stop webcam stream
  //   if (streamRef.current) {
  //     streamRef.current.getTracks().forEach(track => track.stop())
  //     streamRef.current = null
  //   }

  //   // Clear video source
  //   if (videoRef.current) {
  //     videoRef.current.srcObject = null
  //   }
  // }

  // // Cleanup on unmount
  // useEffect(() => {
  //   return () => {
  //     stopAnalysis()
  //   }
  // }, [])

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
      ) : (
        <VideoStreamer
          icon={selectedExercise.icon}
          name={selectedExercise.name}
          setSelectedExercise={() => setSelectedExercise(null)}
        />
      )}
    </div>
  )
}

export default PosturePage