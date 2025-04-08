'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Mic, Bot, SendHorizonal, X, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Input } from './ui/input';

export const fetchChatHistory = async () => {
  try {
    const response = await fetch('/api/userChat', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const data = await response.json();
    return data.messages || []; // Ensure we return an array
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return []; // Return empty array on error
  }
}

export const sendQuery= async (query) => {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_PY_URL;

    // Make sure we're not adding an extra /chat if it's already in the URL
    const chatEndpoint = backendUrl.endsWith('/chat') ? backendUrl : `${backendUrl}/chat`;

    console.log('Sending message to backend:',chatEndpoint, query);
    const response = await fetch(chatEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({message:query}),  
    });

    if (!response.ok) {
      console.error('Backend response not OK:', {
        status: response.status,
        statusText: response.statusText,
        url: chatEndpoint
      });
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      throw new Error(`Failed to get response from AI backend: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Backend response:', data);
    return data.response || "Sorry, I couldn't process your request at this time.";
  } catch (error) {
    console.error('Chat error:', error);
    toast.error('Failed to get response');
  }
}

export default function MentorChatBot() {
  const queryClient = useQueryClient();
  const [isRecording, setIsRecording] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [microphoneAvailable, setMicrophoneAvailable] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const chatRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const streamRef = useRef(null);
  const recordedDataRef = useRef([]);


  const {data:userBotMessages, isPending} = useQuery({
    queryKey: ['userChat'],
    queryFn: fetchChatHistory,
  })

  // Check microphone availability when component mounts
  useEffect(() => {
    async function checkMicrophone() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasMicrophone = devices.some(device => device.kind === 'audioinput');
        setMicrophoneAvailable(hasMicrophone);
        
        if (!hasMicrophone) {
          toast.error('No microphone detected');
        }
      } catch (err) {
        console.error('Error checking microphone:', err);
        setMicrophoneAvailable(false);
        toast.error('Could not access microphone');
      }
    }
    
    checkMicrophone();
  }, []);

  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // Close chatbot when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (chatRef.current && !chatRef.current.contains(event.target) && isOpen) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Clean up audio resources when component unmounts
  useEffect(() => {
    return () => {
      if (isRecording) {
        cleanupAudioResources();
      }
    };
  }, [isRecording]);

  const cleanupAudioResources = () => {
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const startRecording = useCallback(async () => {
    if (!microphoneAvailable) {
      toast.error('No microphone available');
      return;
    }
    try {
      console.log('Starting recording...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          sampleSize: 16,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;
      // Create AudioContext for processing

      if (stream.getAudioTracks().length === 0) {
        throw new Error('No audio tracks available');
      }

      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      let recordedData = [];

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Check audio levels to verify microphone is working
        const sum = inputData.reduce((acc, val) => acc + Math.abs(val), 0);
        const avg = sum / inputData.length;
        
        if (avg > 0.01) { // Arbitrary threshold to detect non-silence
          audioDetected = true;
          silenceCounter = 0;
        } else {
          silenceCounter++;
        }
        
        // If we've had too much silence, warn the user
        if (silenceCounter > 50 && !audioDetected) {
          toast.warning('No audio detected. Is your microphone working?', {
            id: 'mic-check',
          });
        }
        
        // Store the audio data
        recordedDataRef.current = recordedDataRef.current.concat(Array.from(inputData));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      // mediaRecorderRef.current = {
      //   stop: async () => {
      //     source.disconnect();
      //     processor.disconnect();
      //     stream.getTracks().forEach(track => track.stop());

      //     // Convert recorded data to WAV
      //     const wavData = new Int16Array(recordedData.length);
      //     for (let i = 0; i < recordedData.length; i++) {
      //       const s = Math.max(-1, Math.min(1, recordedData[i]));
      //       wavData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      //     }

      //     // Create WAV header
      //     const wavHeader = new ArrayBuffer(44);
      //     const view = new DataView(wavHeader);

      //     // "RIFF" chunk descriptor
      //     writeString(view, 0, 'RIFF');
      //     view.setUint32(4, 36 + wavData.length * 2, true);
      //     writeString(view, 8, 'WAVE');

      //     // "fmt " sub-chunk
      //     writeString(view, 12, 'fmt ');
      //     view.setUint32(16, 16, true);
      //     view.setUint16(20, 1, true);                     // PCM format
      //     view.setUint16(22, 1, true);                     // Mono channel
      //     view.setUint32(24, 16000, true);                 // Sample rate
      //     view.setUint32(28, 16000 * 2, true);            // Byte rate
      //     view.setUint16(32, 2, true);                     // Block align
      //     view.setUint16(34, 16, true);                    // Bits per sample

      //     // "data" sub-chunk
      //     writeString(view, 36, 'data');
      //     view.setUint32(40, wavData.length * 2, true);

      //     // Create WAV blob
      //     const wavBlob = new Blob([wavHeader, wavData.buffer], { type: 'audio/wav' });

      //     // Create URL for playback
      //     const audioUrl = URL.createObjectURL(wavBlob);
      //     setAudioUrl(audioUrl);

      //     // Send to server for analysis
      //     const formData = new FormData();
      //     formData.append('file', wavBlob, 'recording.wav');

      //     try {
      //       setLoading(true);
      //       console.log(formData.get('file'));
      //       // const response = await axios.post('http://127.0.0.1:5000/analyze', formData, {
      //       //   headers: {
      //       //     'Content-Type': 'multipart/form-data',
      //       //   },
      //       // });

      //       if (response.data.error) {
      //         setError(response.data.error);
      //       } else {
      //         setAnalysisData(response.data);
      //       }
      //     } catch (error) {
      //       console.error('Error analyzing recording:', error);
      //       setError('Failed to analyze recording: ' + error.message);
      //     } finally {
      //       setLoading(false);
      //     }

      //     audioContext.close();
      //     setIsRecording(false);
      //   }
      // };

      setIsRecording(true);
      setError(null);

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not start recording: ' + err.message);
      setIsRecording(false);
      toast.error('Could not access microphone');
      cleanupAudioResources();
    }
  }, [microphoneAvailable, isRecording]);

  const stopRecording = useCallback(async () => {
    if (isRecording) {
      try {
        setIsRecording(false);
        
        // Get the recorded data
        const recordedData = recordedDataRef.current;
        
        if (recordedData.length === 0) {
          toast.error('No audio recorded');
          cleanupAudioResources();
          return;
        }
        
        // Convert recorded data to WAV
        const wavData = new Int16Array(recordedData.length);
        for (let i = 0; i < recordedData.length; i++) {
          const s = Math.max(-1, Math.min(1, recordedData[i]));
          wavData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        // Create WAV header
        const wavHeader = new ArrayBuffer(44);
        const view = new DataView(wavHeader);
        
        // "RIFF" chunk descriptor
        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + wavData.length * 2, true);
        writeString(view, 8, 'WAVE');
        
        // "fmt " sub-chunk
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);                     // PCM format
        view.setUint16(22, 1, true);                     // Mono channel
        view.setUint32(24, 16000, true);                 // Sample rate
        view.setUint32(28, 16000 * 2, true);            // Byte rate
        view.setUint16(32, 2, true);                     // Block align
        view.setUint16(34, 16, true);                    // Bits per sample
        
        // "data" sub-chunk
        writeString(view, 36, 'data');
        view.setUint32(40, wavData.length * 2, true);
        
        // Create WAV blob
        const wavBlob = new Blob([wavHeader, wavData.buffer], { type: 'audio/wav' });
        
        // Create URL for playback
        const audioUrl = URL.createObjectURL(wavBlob);
        setAudioUrl(audioUrl);
        
        // Send to server for analysis
        const formData = new FormData();
        formData.append('file', wavBlob, 'recording.wav');
        
        try {
          setLoading(true);
          console.log('Sending audio to backend');
          
          // Uncomment this section and replace with your actual API endpoint
          const response = await fetch('http://127.0.0.1:5000/analyze', {
            method: 'POST',
            body: formData,
          });
          
          const data = await response.json();
          
          if (data.error) {
            setError(data.error);
            toast.error(data.error);
          } else {
            setAnalysisData(data);
            
            // If there's a transcription, add it to the chat
            if (data.transcription) {
              const userMessage = {
                text: data.transcription,
                isUser: true,
                timestamp: new Date()
              };
              
              setMessages(prev => [...prev, userMessage]);
              
              // Get AI response for the transcription
              await handleChatbotResponse(data.transcription);
            }
          }
        } catch (error) {
          console.error('Error analyzing recording:', error);
          setError('Failed to analyze recording: ' + error.message);
          toast.error('Failed to process audio');
        } finally {
          setLoading(false);
        }
        
      } finally {
        cleanupAudioResources();
      }
    }
  }, [isRecording]);

  const [messages, setMessages] = useState([]);
  // const[transcript, setTranscript] = useState('');
  const [input, setInput] = useState('');

  const chatContainerRef = useRef(null);

  const chatMutation = useMutation({
    mutationFn: sendQuery,
    onSuccess: (response) => {
      // Add both user message and bot response to the messages array
      const newMessages = [
        { text: textInput, isUser: true },
        { text: response, isUser: false }
      ];
      
      // Update the messages in the query client
      queryClient.setQueryData(['userChat'], (old) => {
        const currentMessages = Array.isArray(old) ? old : [];
        return [...currentMessages, ...newMessages];
      });
      
      setTextInput('');
    },
    onSettled: () => {
      // This ensures scrolling happens after DOM updates
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  });

  const handleSend = async () => {
    if(!textInput.trim()){
      toast.warning('Please enter a message');
      return;
    }
    try {
      chatMutation.mutateAsync(textInput)
    } catch (error) {
      console.error('Error sending message:', error);
      
    }
    
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(scrollToBottom, [messages]);

  const clearMessages = async () => {
    try {
      const response = await fetch('/api/userChat', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clear messages');
      }

      // Clear messages in the UI
      queryClient.setQueryData(['userChat'], []);
      toast.success('Messages cleared');
    } catch (error) {
      console.error('Error clearing messages:', error);
      toast.error('Failed to clear messages');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {!isOpen ? (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="bg-[#3E2723] hover:bg-[#5D4037] p-4 rounded-lg border-4 border-[#5D4037] shadow-[4px_4px_0_#3E2723] text-[#FFD54F] flex items-center justify-center font-pixel transition-transform duration-200"
          aria-label="Open chat"
        >
          <Bot size={24} />
        </motion.button>
      ) : (
        <motion.div
          ref={chatRef}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-[#F9ECCC] rounded-none border-4 border-[#3E2723] shadow-[8px_8px_0_#3E2723] w-[320px] h-[500px] flex flex-col overflow-hidden font-pixel"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-[#795548] border-b-4 border-[#3E2723] text-[#FFD54F] shadow-[0_4px_0_#3E2723]">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <h2 className="text-lg font-bold tracking-wide uppercase">Mentor Bot</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearMessages}
                className="p-1 rounded hover:bg-[#5D4037] transition-colors"
                title="Clear messages"
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-[#5D4037] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          
          {/* Chat Messages Area */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#F9ECCC]"
            style={{
              backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          >
            {!isPending && userBotMessages?.length === 0 ? (
              <div className="text-center text-[#5D4037] my-8 px-4 py-3 border-2 border-[#5D4037] bg-[#F9ECCC] shadow-[2px_2px_0_#3E2723]">
                Ask me anything about your fitness quest!
              </div>
            ) : (
              !isPending && Array.isArray(userBotMessages) && userBotMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 border-2 whitespace-pre-wrap ${message.isUser
                      ? 'bg-[#FF6D00] border-[#3E2723] text-[#3E2723] font-semibold shadow-[2px_2px_0_#3E2723]'
                      : 'bg-[#795548] border-[#3E2723] text-[#FFD54F] shadow-[2px_2px_0_#3E2723]'
                    }`}
                  >
                    {message.text.split('**').map((part, i) => 
                      i % 2 === 0 ? (
                        part
                      ) : (
                        <span key={i} className="font-bold">
                          {part}
                        </span>
                      )
                    )}
                  </div>
                </div>
              ))
            )}

            {isPending && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 bg-[#795548] border-2 border-[#3E2723] text-[#FFD54F] shadow-[2px_2px_0_#3E2723]">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-[#FFD54F] animate-bounce"></div>
                    <div className="w-3 h-3 bg-[#FFD54F] animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-3 h-3 bg-[#FFD54F] animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Section */}
          <div className="p-3 border-t-4 border-[#3E2723] bg-[#795548]">
            <div className="flex items-center gap-2">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={loading || microphoneAvailable === false}
                className={`p-2 border-2 border-[#3E2723] shadow-[2px_2px_0_#3E2723] transition-colors ${
                  isRecording
                    ? 'bg-[#FF6D00] text-[#3E2723] animate-pulse'
                    : microphoneAvailable === false
                      ? 'bg-[#8D6E63] text-[#3E2723] cursor-not-allowed opacity-50'
                      : 'bg-[#F9ECCC] text-[#3E2723] hover:bg-[#FFECB3]'
                }`}
                title={microphoneAvailable === false ? "Microphone not available" : "Record audio"}
              >
                <Mic size={18} />
              </button>
              
              <Input
                type="text"
                disabled={isRecording || chatMutation.isPending}
                value={textInput || ''}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1 p-2 border-2 border-[#3E2723] bg-[#F9ECCC] shadow-[2px_2px_0_#3E2723] placeholder-[#8D6E63] text-[#3E2723] focus:outline-none focus:ring-0 focus:border-[#3E2723]"
              />
              
              <button
                onClick={handleSend}
                disabled={!textInput.trim() || isRecording || loading}
                className={`p-2 border-2 border-[#3E2723] shadow-[2px_2px_0_#3E2723] ${
                  !textInput.trim() || isRecording || loading
                    ? 'bg-[#8D6E63] text-[#3E2723] cursor-not-allowed opacity-50'
                    : 'bg-[#FF6D00] text-[#3E2723] hover:bg-[#F57C00]'
                }`}
              >
                <SendHorizonal size={18} />
              </button>
            </div>

            {isRecording && (
              <div className="mt-2 text-center text-sm text-[#FF6D00] font-medium bg-[#3E2723] border border-[#5D4037] p-1">
                RECORDING... CLICK MIC TO STOP
              </div>
            )}

            {error && (
              <div className="mt-2 text-center text-sm text-[#FF6D00] font-medium bg-[#3E2723] border border-[#5D4037] p-1">
                {error}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
