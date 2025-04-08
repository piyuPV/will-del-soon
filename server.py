from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import json
import mediapipe as mp
import cv2
import numpy as np
from bicep.app import BicepPoseAnalysis, calculate_angle, mp_pose
import base64

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Initialize pose detection
mp_drawing = mp.solutions.drawing_utils

# Constants from bicep/app.py
VISIBILITY_THRESHOLD = 0.65
STAGE_UP_THRESHOLD = 90
STAGE_DOWN_THRESHOLD = 120
PEAK_CONTRACTION_THRESHOLD = 60
LOOSE_UPPER_ARM_ANGLE_THRESHOLD = 40

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    # Initialize pose detection
    pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)
    
    # Initialize analyzers for both arms
    left_arm_analysis = BicepPoseAnalysis(
        "left", STAGE_DOWN_THRESHOLD, STAGE_UP_THRESHOLD,
        PEAK_CONTRACTION_THRESHOLD, LOOSE_UPPER_ARM_ANGLE_THRESHOLD,
        VISIBILITY_THRESHOLD
    )
    
    right_arm_analysis = BicepPoseAnalysis(
        "right", STAGE_DOWN_THRESHOLD, STAGE_UP_THRESHOLD,
        PEAK_CONTRACTION_THRESHOLD, LOOSE_UPPER_ARM_ANGLE_THRESHOLD,
        VISIBILITY_THRESHOLD
    )

    try:
        while True:
            # Receive the base64 encoded image
            data = await websocket.receive_text()
            image_data = json.loads(data)
            image_base64 = image_data['image']
            
            # Decode base64 image
            image_bytes = base64.b64decode(image_base64.split(',')[1])
            nparr = np.frombuffer(image_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Convert to RGB
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(image)

            if not results.pose_landmarks:
                await websocket.send_json({"error": "No human found"})
                continue

            # Process landmarks
            landmarks = results.pose_landmarks.landmark
            
            # Analyze both arms
            left_angles = left_arm_analysis.analyze_pose(landmarks, frame)
            right_angles = right_arm_analysis.analyze_pose(landmarks, frame)

            # Create response data
            response_data = {
                "left_counter": left_arm_analysis.counter,
                "right_counter": right_arm_analysis.counter,
                "left_errors": left_arm_analysis.detected_errors,
                "right_errors": right_arm_analysis.detected_errors,
                "left_angles": left_angles,
                "right_angles": right_angles,
                "stage": left_arm_analysis.stage  # Using left arm as primary reference
            }

            # Send the analysis results
            await websocket.send_json(response_data)

    except Exception as e:
        print(f"Error: {e}")
    finally:
        pose.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 