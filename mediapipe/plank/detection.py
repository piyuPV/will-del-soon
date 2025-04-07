import mediapipe as mp
import cv2
import numpy as np
import pandas as pd
from tensorflow import keras
import pickle
import warnings
import os
warnings.filterwarnings('ignore')

# Drawing helpers
mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose

# Constants
IMPORTANT_LMS = [
    "NOSE", "LEFT_SHOULDER", "RIGHT_SHOULDER", "LEFT_ELBOW", "RIGHT_ELBOW",
    "LEFT_WRIST", "RIGHT_WRIST", "LEFT_HIP", "RIGHT_HIP", "LEFT_KNEE",
    "RIGHT_KNEE", "LEFT_ANKLE", "RIGHT_ANKLE", "LEFT_HEEL", "RIGHT_HEEL",
    "LEFT_FOOT_INDEX", "RIGHT_FOOT_INDEX"
]

HEADERS = ["label"]  # Label column
for lm in IMPORTANT_LMS:
    HEADERS += [f"{lm.lower()}_x", f"{lm.lower()}_y", f"{lm.lower()}_z", f"{lm.lower()}_v"]

def extract_important_keypoints(results) -> list:
    landmarks = results.pose_landmarks.landmark
    data = []
    for lm in IMPORTANT_LMS:
        keypoint = landmarks[mp_pose.PoseLandmark[lm].value]
        data.append([keypoint.x, keypoint.y, keypoint.z, keypoint.visibility])
    return np.array(data).flatten().tolist()

def rescale_frame(frame, percent=50):
    width = int(frame.shape[1] * percent/ 100)
    height = int(frame.shape[0] * percent/ 100)
    dim = (width, height)
    return cv2.resize(frame, dim, interpolation=cv2.INTER_AREA)

def get_class(prediction: float) -> str:
    return {
        0: "C",
        1: "H",
        2: "L",
    }.get(prediction)

# Get the absolute path of the current directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'plank', 'plank.keras')
SCALER_PATH = os.path.join(BASE_DIR, 'models', 'plank', 'input_scaler.pkl')

def run_detection(video_path, model_type='keras'):
    try:
        # Load models
        model = keras.models.load_model(MODEL_PATH)
        with open(SCALER_PATH, "rb") as f2:
            input_scaler = pickle.load(f2)
    except Exception as e:
        print(f"Error loading plank model: {e}")
        return

    cap = cv2.VideoCapture(video_path)
    current_stage = ""
    prediction_probability_threshold = 0.6

    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        while cap.isOpened():
            ret, image = cap.read()
            if not ret:
                break

            image = rescale_frame(image, 50)
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
                row = extract_important_keypoints(results)
                X = pd.DataFrame([row], columns=HEADERS[1:])
                X = pd.DataFrame(input_scaler.transform(X))

                if model_type == 'sklearn':
                    predicted_class = model.predict(X)[0]
                    predicted_class = get_class(predicted_class)
                    prediction_probability = model.predict_proba(X)[0]
                    prob_value = max(prediction_probability)
                else:
                    prediction = model.predict(X)
                    predicted_class = np.argmax(prediction, axis=1)[0]
                    prob_value = max(prediction[0])
                    
                # Determine current stage
                if prob_value >= prediction_probability_threshold:
                    if predicted_class in [0, "C"]:
                        current_stage = "Correct"
                    elif predicted_class in [2, "L"]:
                        current_stage = "Low back"
                    elif predicted_class in [1, "H"]:
                        current_stage = "High back"
                else:
                    current_stage = "Unknown"

                # Visualization
                cv2.rectangle(image, (0, 0), (550, 60), (245, 117, 16), -1)
                cv2.putText(image, "DETECTION", (95, 12), cv2.FONT_HERSHEY_COMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)
                cv2.putText(image, current_stage, (90, 40), cv2.FONT_HERSHEY_COMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)
                cv2.putText(image, "PROB", (15, 12), cv2.FONT_HERSHEY_COMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)
                cv2.putText(image, str(round(prob_value, 2)), (10, 40), cv2.FONT_HERSHEY_COMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)

            except Exception as e:
                print(f"Error: {e}")

            cv2.imshow("Plank Detection", image)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        cap.release()
        cv2.destroyAllWindows()
        for i in range(1, 5):  # Fix for MacOS
            cv2.waitKey(1)

if __name__ == "__main__":
    # VIDEO_PATH = "../../demo/plank_demo.mp4"
    # Use 'keras' for deep learning model or 'sklearn' for traditional ML model
    run_detection(0, model_type='keras')
