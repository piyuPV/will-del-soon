from flask import Flask, Response, render_template_string, request, redirect, url_for
import cv2
import mediapipe as mp
import os
from bicep.app import BicepPoseAnalysis
from squat.app import analyze_foot_knee_placement, extract_important_keypoints as extract_squat_keypoints
from lunges.app import LungeAnalysis, calculate_angle
from plank.detection import extract_important_keypoints as extract_plank_keypoints
import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model
import pickle
import json

app = Flask(__name__)

# Initialize MediaPipe
mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose

# Global variables for video capture
cap = None
current_exercise = None

# Get the absolute path of the current directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, 'models')

# Load all models with proper path handling
models = {}
scalers = {}

try:
    # Create models directory if it doesn't exist
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    # Try loading bicep model
    try:
        models['bicep'] = load_model(os.path.join(MODELS_DIR, 'bicep', 'bicep_dp.keras'))
        with open(os.path.join(MODELS_DIR, 'bicep', 'input_scaler.pkl'), "rb") as f:
            scalers['bicep'] = pickle.load(f)
    except Exception as e:
        print(f"Warning: Could not load bicep model: {e}")
        models['bicep'] = None

    # Try loading squat model
    try:
        with open(os.path.join(MODELS_DIR, 'squat', 'LR_model.pkl'), "rb") as f:
            models['squat'] = pickle.load(f)
    except Exception as e:
        print(f"Warning: Could not load squat model: {e}")
        models['squat'] = None

    # Try loading lunge model
    try:
        models['lunge'] = load_model(os.path.join(MODELS_DIR, 'lunges', 'lunge.keras'))
        with open(os.path.join(MODELS_DIR, 'lunges', 'input_scaler.pkl'), "rb") as f:
            scalers['lunge'] = pickle.load(f)
    except Exception as e:
        print(f"Warning: Could not load lunge model: {e}")
        models['lunge'] = None

    # Try loading plank model
    try:
        models['plank'] = load_model(os.path.join(MODELS_DIR, 'plank', 'plank.keras'))
        with open(os.path.join(MODELS_DIR, 'plank', 'input_scaler.pkl'), "rb") as f:
            scalers['plank'] = pickle.load(f)
    except Exception as e:
        print(f"Warning: Could not load plank model: {e}")
        models['plank'] = None

except Exception as e:
    print(f"Error in model loading setup: {e}")

def generate_frames():
    global cap, current_exercise
    
    if not cap:
        cap = cv2.VideoCapture(0)
    
    pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)
    
    # Initialize exercise-specific variables
    if current_exercise == '1':  # Bicep
        left_arm = BicepPoseAnalysis("right", 120, 90, 60, 40, 0.65)
        right_arm = BicepPoseAnalysis("left", 120, 90, 60, 40, 0.65)
    elif current_exercise == '2':  # Lunges
        left_lunge = LungeAnalysis()
        right_lunge = LungeAnalysis()
    elif current_exercise == '4':  # Squat
        counter = 0
        current_stage = ""

    while True:
        success, frame = cap.read()
        if not success:
            break

        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(frame)
        frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)

        if not results.pose_landmarks:
            continue

        try:
            landmarks = results.pose_landmarks.landmark
            
            if current_exercise == '1':  # Bicep
                # Process bicep curl
                left_angles = left_arm.analyze_pose(landmarks, frame)
                right_angles = right_arm.analyze_pose(landmarks, frame)
                
                cv2.putText(frame, f"Left: {right_arm.counter}", (20, 50), 
                           cv2.FONT_HERSHEY_COMPLEX, 1.0, (255, 255, 255), 2)
                cv2.putText(frame, f"Right: {left_arm.counter}", (250, 50), 
                           cv2.FONT_HERSHEY_COMPLEX, 1.0, (255, 255, 255), 2)

            elif current_exercise == '2':  # Lunges
                # Process lunges
                left_hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x, landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
                left_knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x, landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
                left_ankle = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x, landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]
                
                left_knee_angle = calculate_angle(left_hip, left_knee, left_ankle)
                left_lunge.update(left_knee_angle)
                
                cv2.putText(frame, f"Lunges: {left_lunge.counter}", (20, 50),
                           cv2.FONT_HERSHEY_COMPLEX, 1.0, (255, 255, 255), 2)

            elif current_exercise == '3':  # Plank
                # Process plank
                keypoints = extract_plank_keypoints(results)
                X = pd.DataFrame([keypoints], columns=['label'])
                X = plank_scaler.transform(X)
                prediction = plank_model.predict(X)
                pose_type = "Correct" if np.argmax(prediction) == 0 else "Incorrect"
                
                cv2.putText(frame, f"Plank: {pose_type}", (20, 50),
                           cv2.FONT_HERSHEY_COMPLEX, 1.0, (255, 255, 255), 2)

            elif current_exercise == '4':  # Squat
                # Process squat
                analyzed_results = analyze_foot_knee_placement(
                    results, current_stage,
                    [1.2, 2.8],
                    {
                        "up": [0.5, 1.0],
                        "middle": [0.7, 1.0],
                        "down": [0.7, 1.1]
                    },
                    0.6
                )
                
                cv2.putText(frame, f"Squats: {counter}", (20, 50),
                           cv2.FONT_HERSHEY_COMPLEX, 1.0, (255, 255, 255), 2)

            # Draw pose landmarks
            mp_drawing.draw_landmarks(
                frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS,
                mp_drawing.DrawingSpec(color=(244, 117, 66), thickness=2, circle_radius=2),
                mp_drawing.DrawingSpec(color=(245, 66, 230), thickness=2, circle_radius=1)
            )

        except Exception as e:
            print(f"Error: {e}")

        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/')
def index():
    # Only show exercises with loaded models
    available_exercises = []
    if models['bicep'] is not None:
        available_exercises.append(('1', 'Bicep Curls'))
    if models['lunge'] is not None:
        available_exercises.append(('2', 'Lunges'))
    if models['plank'] is not None:
        available_exercises.append(('3', 'Plank'))
    if models['squat'] is not None:
        available_exercises.append(('4', 'Squats'))

    return render_template_string("""
        <h1>Exercise Selection</h1>
        {% if exercises %}
            <form action="/select" method="post">
                <select name="exercise">
                    {% for value, name in exercises %}
                        <option value="{{ value }}">{{ name }}</option>
                    {% endfor %}
                </select>
                <input type="submit" value="Start Exercise">
            </form>
        {% else %}
            <p>No exercise models are currently available. Please check model files.</p>
        {% endif %}
    """, exercises=available_exercises)

@app.route('/select', methods=['POST'])
def select_exercise():
    global current_exercise, cap
    current_exercise = request.form['exercise']
    if cap:
        cap.release()
        cap = None
    return redirect(url_for('video'))

@app.route('/video')
def video():
    exercise_names = {
        '1': 'Bicep Curls',
        '2': 'Lunges',
        '3': 'Plank',
        '4': 'Squats'
    }
    return render_template_string("""
        <h1>{{ exercise }} Analysis</h1>
        <img src="{{ url_for('video_feed') }}">
        <br>
        <a href="/">Back to Selection</a>
    """, exercise=exercise_names.get(current_exercise, 'Unknown'))

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                   mimetype='multipart/x-mixed-replace; boundary=frame')

@app.teardown_appcontext
def cleanup(exception=None):
    global cap
    if cap:
        cap.release()

if __name__ == '__main__':
    app.run(debug=True)
