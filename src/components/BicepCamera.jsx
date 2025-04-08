import React, { useRef, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card } from '@/components/ui/card';

const BicepCamera = ({ setSelectedExercise }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [repCount, setRepCount] = useState({ left: 0, right: 0 });
  const [posture, setPosture] = useState('Correct');
  const [errors, setErrors] = useState({ left: {}, right: {} });

  // Start webcam
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    } catch (error) {
      console.error('Error accessing webcam:', error);
    }
  };

  // Start streaming
  const startStreaming = () => {
    setIsStreaming(true);
    startWebcam();
  };

  // Stop streaming
  const stopStreaming = () => {
    setIsStreaming(false);
    const tracks = videoRef.current?.srcObject?.getTracks();
    tracks?.forEach(track => track.stop());
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="lg:w-2/3">
        <div className="bg-gray-100 rounded-lg overflow-hidden aspect-video relative">
          {!isStreaming && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">💪</div>
                <h3 className="text-xl font-semibold mb-2">Bicep Curls</h3>
                <p className="mb-4 text-gray-600">Ready to analyze your form</p>
                <Button
                  onClick={startStreaming}
                  className="bg-green-600 hover:bg-green-700 text-white transition-colors"
                >
                  Start
                </Button>
              </div>
            </div>
          )}
          <video ref={videoRef} width={320} height={240} className={`w-full h-full object-cover ${!isStreaming ? 'opacity-30' : ''}`} />
          <canvas ref={canvasRef} width={320} height={240} style={{ display: 'none' }} />
          
          {/* Overlay video in bottom right corner */}
          {isStreaming && (
            <div className="absolute bottom-4 right-4 w-48 h-32 bg-black rounded-lg overflow-hidden">
              <video
                src="/bicep.mp4"
                autoPlay
                loop
                muted
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
        {isStreaming && (
          <div className="mt-4 flex justify-center">
            <Button
              onClick={stopStreaming}
              className="bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              Stop Streaming
            </Button>
          </div>
        )}
      </div>

      <div className="lg:w-1/3">
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Real-time Analysis</h3>

          {isStreaming ? (
            <div>
              <div className="mb-6">
                <h4 className="text-lg font-medium">Rep Count</h4>
                <div className="flex justify-between mt-2">
                  <div>
                    <p className="text-sm text-gray-500">Left Arm</p>
                    <div className="text-4xl font-bold text-green-600">{repCount.left}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Right Arm</p>
                    <div className="text-4xl font-bold text-green-600">{repCount.right}</div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-medium">Posture</h4>
                <div className={`text-2xl font-bold mt-2 ${posture === 'Correct' ? 'text-green-600' : 'text-red-600'}`}>
                  {posture}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium mb-2">Feedback</h4>
                {feedback ? (
                  <p className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                    {feedback}
                  </p>
                ) : (
                  <p className="text-gray-500">Waiting for analysis...</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-gray-500">
              <p>Start the analysis to see real-time feedback on your form and count your reps.</p>
              <p className="mt-4">Make sure you position yourself properly in the frame!</p>
            </div>
          )}
        </Card>

        <div className="mt-6">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              stopStreaming();
              setSelectedExercise();
            }}
          >
            Choose Different Exercise
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BicepCamera; 