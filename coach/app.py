from flask import Flask, request, jsonify
import google.generativeai as genai
import speech_recognition as sr
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Configure your Gemini API key
genai.configure(api_key="AIzaSyBpG3h0wfcp390kgNBZhb8sXsZoqbQDkos")

# Initialize the model
model = genai.GenerativeModel("gemini-1.5-pro-latest")

# User context to remember preferences
user_context = {
    "diet": None,
    "allergies": [],
    "goal": None
}

# Update the fitness prompt to be more specific
fitness_prompt = """You are a helpful and proactive AI Fitness Coach specializing in nutrition and meal planning.
Your job is to:
1. First gather essential information:
   - Dietary preferences (e.g. vegan, vegetarian, non-veg)
   - Allergies (e.g. lactose, nuts, gluten)
   - Fitness goals (e.g. weight loss, muscle gain, endurance)
   - Meal preferences (small/large meals)
   - Activity level

2. Once you have all required information, ALWAYS provide:
   - A detailed meal plan with specific portions
   - Calorie and macro breakdown
   - Specific food items and quantities
   - Sample recipes
   - Shopping list

Respond in a friendly and context-aware manner. When sufficient information is gathered, 
automatically proceed to provide the complete plan without asking more questions.
"""

# Start a persistent Gemini chat session
chat_session = model.start_chat(history=[
    {"role": "user", "parts": [fitness_prompt]}
])

def speech_to_text(audio_file):
    recognizer = sr.Recognizer()
    try:
        # Add support for different audio formats
        if audio_file.endswith('.wav'):
            with sr.AudioFile(audio_file) as source:
                audio = recognizer.record(source)
        else:
            return None
            
        # Adjust recognition settings
        text = recognizer.recognize_google(audio, language='en-US')
        return text
    except sr.UnknownValueError:
        return None
    except sr.RequestError:
        print("Could not request results from speech recognition service")
        return None
    except Exception as e:
        print(f"Error in speech recognition: {str(e)}")
        return None

# Chat endpoint
@app.route("/chat", methods=["POST"])
def chat():
    try:
        # Get message from either audio or text input
        if 'audio' in request.files:
            audio_file = request.files['audio']
            transcript = request.form.get('transcript')  # Get transcript from form data
            
            if audio_file and transcript:
                # Use the transcript directly if available
                message = transcript
            else:
                # Fallback to audio processing if no transcript
                filename = secure_filename(audio_file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                audio_file.save(filepath)
                message = speech_to_text(filepath)
                os.remove(filepath)
                
            if not message:
                return jsonify({"response": "Could not understand the audio. Please try again."})
        else:
            data = request.get_json()
            message = data.get("message", "").strip()

        if not message:
            return jsonify({"response": "Please enter a message or speak clearly."})

        # Add a prompt to generate concrete plan if enough context is available
        if any(keyword in message.lower() for keyword in ['lightly', 'moderately', 'very active', 'sedentary']):
            message += "\nPlease provide a detailed meal plan now with specific portions, calories, and a shopping list."

        # Use Gemini with full context
        response = chat_session.send_message(message)
        return jsonify({"response": response.text})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"response": "Something went wrong while processing your input."})

if __name__ == "__main__":
    app.run(debug=True)
