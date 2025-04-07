import speech_recognition as sr
import requests
import tempfile
import os

def record_and_send():
    recognizer = sr.Recognizer()
    
    with sr.Microphone(sample_rate=16000) as source:
        # Adjust recognition settings for better sensitivity
        recognizer.dynamic_energy_threshold = True  # Enable dynamic threshold
        recognizer.energy_threshold = 150  # Lower threshold to detect softer speech
        recognizer.dynamic_energy_adjustment_damping = 0.15
        recognizer.dynamic_energy_ratio = 1.5
        recognizer.pause_threshold = 0.6  # Shorter pause for more natural speech
        
        print("\nAdjusting for ambient noise... (speak normally)...")
        recognizer.adjust_for_ambient_noise(source, duration=3)  # Longer adjustment
        
        print("\nListening... Speak now...")
        
        try:
            audio = recognizer.listen(source, timeout=10, phrase_time_limit=15)
            print("Voice detected! Transcribing...")
            
            try:
                transcript = recognizer.recognize_google(audio, language='en-US', show_all=True)
                if not transcript:
                    print("\nNo speech detected - please speak more clearly")
                    return
                    
                # Get the most confident result
                if isinstance(transcript, dict) and 'alternative' in transcript:
                    text = transcript['alternative'][0]['transcript']
                else:
                    text = transcript
                print("\nTranscript:", text)
                
                # Save and send audio
                with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
                    wav_data = audio.get_wav_data(convert_rate=16000)
                    temp_audio.write(wav_data)
                    temp_audio_path = temp_audio.name
            
                try:
                    with open(temp_audio_path, 'rb') as audio_file:
                        files = {'audio': ('recording.wav', audio_file, 'audio/wav')}
                        response = requests.post('http://localhost:5000/chat', 
                                              files=files,
                                              data={'transcript': text})  # Send transcript as well
                    
                    if response.status_code == 200:
                        print("\nBot:", response.json()['response'])
                    else:
                        print(f"\nServer Error: {response.status_code}")
                
                except requests.exceptions.RequestException as e:
                    print(f"\nConnection Error: {str(e)}")
                finally:
                    os.unlink(temp_audio_path)

        except sr.UnknownValueError:
            print("\nCould not understand audio - please speak more clearly and try again")
        except sr.RequestError as e:
            print(f"\nNetwork or API error: {e}")
        except sr.WaitTimeoutError:
            print("\nNo speech detected - timeout")
        except KeyboardInterrupt:
            print("\nRecording stopped by user")
        except Exception as e:
            print(f"\nError: {str(e)}")
        
        print("\nReady for next recording...")

if __name__ == "__main__":
    print("Starting voice chat test... (Press Ctrl+C to exit)")
    try:
        while True:
            try:
                record_and_send()
            except KeyboardInterrupt:
                print("\nExiting...")
                break
    except Exception as e:
        print(f"Fatal error: {str(e)}")
