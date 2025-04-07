import mediapipe as mp
import cv2
import numpy as np
import pandas as pd
import pickle
import json
import warnings
import os
warnings.filterwarnings('ignore')
from tensorflow.keras.models import load_model

# Get the absolute path of the current directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'lunges', 'lunge.keras')
SCALER_PATH = os.path.join(BASE_DIR, 'models', 'lunges', 'input_scaler.pkl')

# Load model
try:
    DL_model = load_model(MODEL_PATH)
except Exception as e:
    print(f"Warning: Could not load lunge model: {e}")
    DL_model = None

# Drawing helpers
mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose

# Constants
IMPORTANT_LMS = [
    "NOSE",
    "LEFT_SHOULDER",
    "RIGHT_SHOULDER",
    "LEFT_HIP",
    "RIGHT_HIP",
    "LEFT_KNEE",
    "RIGHT_KNEE",
    "LEFT_ANKLE",
    "RIGHT_ANKLE",
    "LEFT_HEEL",
    "RIGHT_HEEL",
    "LEFT_FOOT_INDEX",
    "RIGHT_FOOT_INDEX",
]

HEADERS = ["label"]
for lm in IMPORTANT_LMS:
    HEADERS += [f"{lm.lower()}_x", f"{lm.lower()}_y", f"{lm.lower()}_z", f"{lm.lower()}_v"]

class LungeAnalysis:
    def __init__(self):
        self.counter = 0
        self.stage = "up"  # up or down
        self.last_knee_angle = 0

    def update(self, knee_angle):
        if knee_angle > 150 and self.stage == "down":
            self.stage = "up"
            self.counter += 1
        elif knee_angle < 90 and self.stage == "up":
            self.stage = "down"
        self.last_knee_angle = knee_angle

def calculate_angle(a, b, c):
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians*180.0/np.pi)
    if angle > 180.0:
        angle = 360-angle
    return angle

def rescale_frame(frame, percent=50):
    width = int(frame.shape[1] * percent/ 100)
    height = int(frame.shape[0] * percent/ 100)
    dim = (width, height)
    return cv2.resize(frame, dim, interpolation=cv2.INTER_AREA)

def extract_important_keypoints(results, important_landmarks: list) -> list:
    landmarks = results.pose_landmarks.landmark
    data = []
    for lm in important_landmarks:
        keypoint = landmarks[mp_pose.PoseLandmark[lm].value]
        data.append([keypoint.x, keypoint.y, keypoint.z, keypoint.visibility])
    return np.array(data).flatten().tolist()

def main():
    # Load input scaler
    with open(SCALER_PATH, "rb") as f:
        input_scaler = pickle.load(f)

    cap = cv2.VideoCapture(0)  # Use 0 for webcam or provide video path
    
    # Initialize parameters
    VISIBILITY_THRESHOLD = 0.65
    POSTURE_ERROR_THRESHOLD = 0.95
    posture = 0  # 0 for Correct, 1 for Leaning

    # Initialize lunge counters
    left_lunge = LungeAnalysis()
    right_lunge = LungeAnalysis()

    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        while cap.isOpened():
            ret, image = cap.read()
            if not ret:
                break

            # Change display size 
            image = rescale_frame(image, 75)
            video_dimensions = [image.shape[1], image.shape[0]]

            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False
            results = pose.process(image)

            if not results.pose_landmarks:
                print("No human found")
                continue

            image.flags.writeable = True
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

            mp_drawing.draw_landmarks(
                image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS,
                mp_drawing.DrawingSpec(color=(244, 117, 66), thickness=2, circle_radius=2),
                mp_drawing.DrawingSpec(color=(245, 66, 230), thickness=2, circle_radius=1)
            )

            try:
                landmarks = results.pose_landmarks.landmark

                # Calculate knee angles
                left_hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x, landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
                left_knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x, landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
                left_ankle = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x, landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]
                
                right_hip = [landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].y]
                right_knee = [landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].y]
                right_ankle = [landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].y]

                left_knee_angle = calculate_angle(left_hip, left_knee, left_ankle)
                right_knee_angle = calculate_angle(right_hip, right_knee, right_ankle)

                # Update counters
                left_lunge.update(left_knee_angle)
                right_lunge.update(right_knee_angle)
                
                # Extract keypoints for posture detection
                row = extract_important_keypoints(results, IMPORTANT_LMS)
                X = pd.DataFrame([row], columns=HEADERS[1:])
                X = pd.DataFrame(input_scaler.transform(X))

                # Make prediction
                prediction = DL_model.predict(X)
                predicted_class = np.argmax(prediction, axis=1)[0]
                prediction_probability = round(max(prediction.tolist()[0]), 2)

                if prediction_probability >= POSTURE_ERROR_THRESHOLD:
                    posture = predicted_class

                # Create JSON output
                output_data = {
                    "posture": {
                        "status": "Correct" if posture == 0 else "Leaning",
                        "confidence": prediction_probability
                    },
                    "counts": {
                        "left_lunge": left_lunge.counter,
                        "right_lunge": right_lunge.counter
                    },
                    "angles": {
                        "left_knee": round(left_knee_angle, 2),
                        "right_knee": round(right_knee_angle, 2)
                    }
                }

                # Print JSON output
                print(json.dumps(output_data, indent=2))

                # Status box
                cv2.rectangle(image, (0, 0), (1200, 80), (245, 117, 16), -1)

                # Display posture and counts
                posture_text = "Correct Form" if posture == 0 else "Leaning Form"
                cv2.putText(image, f"Lunge Posture: {posture_text}", (20, 50), 
                           cv2.FONT_HERSHEY_COMPLEX, 1.2, (255, 255, 255), 2)
                cv2.putText(image, f"L: {left_lunge.counter} | R: {right_lunge.counter}", (600, 50),
                           cv2.FONT_HERSHEY_COMPLEX, 1.0, (255, 255, 255), 2)
                cv2.putText(image, f"Conf: {prediction_probability:.2f}", (900, 50),
                           cv2.FONT_HERSHEY_COMPLEX, 1.0, (255, 255, 255), 2)

            except Exception as e:
                print(f"Error: {e}")

            cv2.imshow("Lunge Form Analysis", image)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        cap.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
