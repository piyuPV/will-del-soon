import mediapipe as mp
import cv2
import numpy as np
import pandas as pd
import pickle
import warnings
import os
warnings.filterwarnings('ignore')
from tensorflow.keras.models import load_model
import json

# Get the absolute path of the current directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Try to load model, but don't fail if not found
try:
    DL_model = load_model(os.path.join(BASE_DIR, 'models', 'bicep_dp.keras'))
except Exception as e:
    print(f"Warning: Could not load bicep model: {e}")
    DL_model = None

# Drawing helpers
mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose

# Constants
IMPORTANT_LMS = [
    "NOSE",
    "LEFT_SHOULDER",
    "RIGHT_SHOULDER",
    "RIGHT_ELBOW",
    "LEFT_ELBOW",
    "RIGHT_WRIST",
    "LEFT_WRIST",
    "LEFT_HIP",
    "RIGHT_HIP",
]

HEADERS = ["label"]
for lm in IMPORTANT_LMS:
    HEADERS += [f"{lm.lower()}_x", f"{lm.lower()}_y", f"{lm.lower()}_z", f"{lm.lower()}_v"]

def rescale_frame(frame, percent=50):
    width = int(frame.shape[1] * percent/ 100)
    height = int(frame.shape[0] * percent/ 100)
    dim = (width, height)
    return cv2.resize(frame, dim, interpolation=cv2.INTER_AREA)

def calculate_angle(point1: list, point2: list, point3: list) -> float:
    point1 = np.array(point1)
    point2 = np.array(point2)
    point3 = np.array(point3)

    angleInRad = np.arctan2(point3[1] - point2[1], point3[0] - point2[0]) - np.arctan2(point1[1] - point2[1], point1[0] - point2[0])
    angleInDeg = np.abs(angleInRad * 180.0 / np.pi)
    angleInDeg = angleInDeg if angleInDeg <= 180 else 360 - angleInDeg
    return angleInDeg

def extract_important_keypoints(results, important_landmarks: list) -> list:
    landmarks = results.pose_landmarks.landmark
    data = []
    for lm in important_landmarks:
        keypoint = landmarks[mp_pose.PoseLandmark[lm].value]
        data.append([keypoint.x, keypoint.y, keypoint.z, keypoint.visibility])
    return np.array(data).flatten().tolist()

class BicepPoseAnalysis:
    def __init__(self, side: str, stage_down_threshold: float, stage_up_threshold: float, peak_contraction_threshold: float, loose_upper_arm_angle_threshold: float, visibility_threshold: float):
        self.stage_down_threshold = stage_down_threshold
        self.stage_up_threshold = stage_up_threshold
        self.peak_contraction_threshold = peak_contraction_threshold
        self.loose_upper_arm_angle_threshold = loose_upper_arm_angle_threshold
        self.visibility_threshold = visibility_threshold

        self.side = side
        self.counter = 0
        self.stage = "down"
        self.is_visible = True
        self.detected_errors = {
            "LOOSE_UPPER_ARM": 0,
            "PEAK_CONTRACTION": 0,
        }

        self.loose_upper_arm = False
        self.peak_contraction_angle = 1000
        self.peak_contraction_frame = None

    def get_joints(self, landmarks) -> bool:
        side = self.side.upper()
        joints_visibility = [
            landmarks[mp_pose.PoseLandmark[f"{side}_SHOULDER"].value].visibility,
            landmarks[mp_pose.PoseLandmark[f"{side}_ELBOW"].value].visibility,
            landmarks[mp_pose.PoseLandmark[f"{side}_WRIST"].value].visibility
        ]
        
        is_visible = all([vis > self.visibility_threshold for vis in joints_visibility])
        self.is_visible = is_visible

        if not is_visible:
            return self.is_visible
        
        self.shoulder = [landmarks[mp_pose.PoseLandmark[f"{side}_SHOULDER"].value].x, landmarks[mp_pose.PoseLandmark[f"{side}_SHOULDER"].value].y]
        self.elbow = [landmarks[mp_pose.PoseLandmark[f"{side}_ELBOW"].value].x, landmarks[mp_pose.PoseLandmark[f"{side}_ELBOW"].value].y]
        self.wrist = [landmarks[mp_pose.PoseLandmark[f"{side}_WRIST"].value].x, landmarks[mp_pose.PoseLandmark[f"{side}_WRIST"].value].y]

        return self.is_visible

    def analyze_pose(self, landmarks, frame):
        self.get_joints(landmarks)

        if not self.is_visible:
            return (None, None)

        bicep_curl_angle = int(calculate_angle(self.shoulder, self.elbow, self.wrist))
        if bicep_curl_angle > self.stage_down_threshold:
            self.stage = "down"
        elif bicep_curl_angle < self.stage_up_threshold and self.stage == "down":
            self.stage = "up"
            self.counter += 1
        
        shoulder_projection = [self.shoulder[0], 1]
        ground_upper_arm_angle = int(calculate_angle(self.elbow, self.shoulder, shoulder_projection))

        if ground_upper_arm_angle > self.loose_upper_arm_angle_threshold:
            if not self.loose_upper_arm:
                self.loose_upper_arm = True
                self.detected_errors["LOOSE_UPPER_ARM"] += 1
        else:
            self.loose_upper_arm = False
        
        if self.stage == "up" and bicep_curl_angle < self.peak_contraction_angle:
            self.peak_contraction_angle = bicep_curl_angle
            self.peak_contraction_frame = frame
        elif self.stage == "down":
            if self.peak_contraction_angle != 1000 and self.peak_contraction_angle >= self.peak_contraction_threshold:
                self.detected_errors["PEAK_CONTRACTION"] += 1
            
            self.peak_contraction_angle = 1000
            self.peak_contraction_frame = None
        
        return (bicep_curl_angle, ground_upper_arm_angle)

def main():
    if DL_model is None:
        print("Error: Bicep model not loaded. Please ensure model file exists.")
        return

    # Load models
    with open("input_scaler.pkl", "rb") as f:
        input_scaler = pickle.load(f)
    
    # with open("./model/bicep_dp.pkl", "rb") as f:
    #     DL_model = pickle.load(f)

    cap = cv2.VideoCapture(0)  # Use 0 for webcam or provide video path

    # Initialize parameters
    VISIBILITY_THRESHOLD = 0.65
    STAGE_UP_THRESHOLD = 90
    STAGE_DOWN_THRESHOLD = 120
    PEAK_CONTRACTION_THRESHOLD = 60
    LOOSE_UPPER_ARM_ANGLE_THRESHOLD = 40
    POSTURE_ERROR_THRESHOLD = 0.95
    posture = 0

    # Initialize analyzers
    left_arm_analysis = BicepPoseAnalysis("right", STAGE_DOWN_THRESHOLD, STAGE_UP_THRESHOLD, 
                                         PEAK_CONTRACTION_THRESHOLD, LOOSE_UPPER_ARM_ANGLE_THRESHOLD, 
                                         VISIBILITY_THRESHOLD)
    
    right_arm_analysis = BicepPoseAnalysis("left", STAGE_DOWN_THRESHOLD, STAGE_UP_THRESHOLD,
                                          PEAK_CONTRACTION_THRESHOLD, LOOSE_UPPER_ARM_ANGLE_THRESHOLD,
                                          VISIBILITY_THRESHOLD)

    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        while cap.isOpened():
            ret, image = cap.read()
            if not ret:
                break

            # Change display size from 40 to 75 percent
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
                
                left_angles = left_arm_analysis.analyze_pose(landmarks, image)
                right_angles = right_arm_analysis.analyze_pose(landmarks, image)

                row = extract_important_keypoints(results, IMPORTANT_LMS)
                X = pd.DataFrame([row], columns=HEADERS[1:])
                X = pd.DataFrame(input_scaler.transform(X))

                prediction = DL_model.predict(X)
                predicted_class = np.argmax(prediction, axis=1)[0]
                prediction_probability = round(max(prediction.tolist()[0]), 2)

                if prediction_probability >= POSTURE_ERROR_THRESHOLD:
                    posture = predicted_class

                # Make status box larger and wider
                cv2.rectangle(image, (0, 0), (1200, 80), (245, 117, 16), -1)

                # Display counters and errors with adjusted positioning
                cv2.putText(image, f"Left: {right_arm_analysis.counter}", (20, 50), 
                            cv2.FONT_HERSHEY_COMPLEX, 1.0, (255, 255, 255), 2)
                cv2.putText(image, f"Right: {left_arm_analysis.counter}", (250, 50), 
                            cv2.FONT_HERSHEY_COMPLEX, 1.0, (255, 255, 255), 2)
                
                # Display posture prominently
                posture_text = "Correct" if posture == 0 else "Leaning"
                cv2.putText(image, f"Posture: {posture_text}", (600, 50),
                            cv2.FONT_HERSHEY_COMPLEX, 1.2, (255, 255, 255), 2)

                # Create output JSON
                output_data = {
                    "right_counter": right_arm_analysis.counter,
                    "left_counter": left_arm_analysis.counter,
                    "posture": posture_text,
                    "right_errors": right_arm_analysis.detected_errors,
                    "left_errors": left_arm_analysis.detected_errors
                }
                
                # Optional: Print JSON output
                print(json.dumps(output_data, indent=2))

            except Exception as e:
                print(f"Error: {e}")

            cv2.imshow("Bicep Curl Analysis", image)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        cap.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
