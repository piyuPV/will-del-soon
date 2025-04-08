import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/initializeDB";
import Chat from "@/model/chat.model";

// Helper to extract user ID from token
export const getUserIdFromToken = (request) => {
  const token = request.cookies.get('token')?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development-only';
    const decoded = jwt.verify(token, jwtSecret);
    return decoded.userId;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
};

// In-memory store for chat messages (in a real app, this would be a database)
let chatHistory = [];

// GET chat history
export async function GET(request) {
  try {
    await connectDB();
    
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    // Get or create chat history for user
    const chat = await Chat.getOrCreateChat(userId);
    
    return NextResponse.json({ messages: chat.messages }, { status: 200 });
    
  } catch (error) {
    console.error('Error getting chat history:', error);
    return NextResponse.json(
      { message: 'Failed to get chat history', error: error.message },
      { status: 500 }
    );
  }
}

// POST new message and get response
export async function POST(request) {
  try {
    await connectDB();
    
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    // Get request body
    const { message } = await request.json();
    if (!message) {
      return NextResponse.json({ message: "Message is required" }, { status: 400 });
    }
    
    console.log("Received message:", message);
    // Get or create chat history
    const chat = await Chat.getOrCreateChat(userId);
    
    // Add user message to history
    await chat.addMessage(message, true);
    
    // Get response from AI backend
    const backendUrl = process.env.NEXT_PUBLIC_PY_URL;

    // Make sure we're not adding an extra /chat if it's already in the URL
    const chatEndpoint = backendUrl.endsWith('/chat') ? backendUrl : `${backendUrl}/chat`;

    const response = await fetch(chatEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
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
    
    const aiData = await response.json();
    console.log('Backend response:', aiData);
    let botReply = aiData.response || "Sorry, I couldn't process your request at this time.";
    
    // Format the response to handle markdown-style formatting
    botReply = botReply
      .replace(/\*\*([^*]+)\*\*/g, (_, text) => `**${text}**`) // Keep bold text as is
      .replace(/\* /g, '\n* '); // Add newline before bullet points
    
    // Add bot response to history
    await chat.addMessage(botReply, false);
    
    return NextResponse.json({ 
      userMessage: message,
      botResponse: botReply,
      messages: chat.messages
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error processing chat message:', error);
    return NextResponse.json(
      { message: 'Failed to process chat message', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE chat history
export async function DELETE(request) {
  try {
    await connectDB();
    
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    // Get chat and clear messages
    const chat = await Chat.getOrCreateChat(userId);
    chat.messages = [];
    await chat.save();
    
    return NextResponse.json({ message: "Chat history cleared" }, { status: 200 });
    
  } catch (error) {
    console.error('Error clearing chat history:', error);
    return NextResponse.json(
      { message: 'Failed to clear chat history', error: error.message },
      { status: 500 }
    );
  }
}