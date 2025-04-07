import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isUser: { type: Boolean, default: false }, // true if user message, false if bot message
  timestamp: { type: Date, default: Date.now }
});

const chatSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true  // Add index for faster queries
  },
  messages: [messageSchema],
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Update lastUpdated timestamp when messages are added
chatSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.lastUpdated = Date.now();
  }
  next();
});

// Method to add a new message to the chat
chatSchema.methods.addMessage = function(text, isUser) {
  this.messages.push({
    text,
    isUser,
    timestamp: new Date()
  });
  return this.save();
};

// Static method to get or create a chat for a user
chatSchema.statics.getOrCreateChat = async function(userId) {
  let chat = await this.findOne({ userId });
  if (!chat) {
    chat = new this({
      userId,
      messages: [
        {
          text: "Hello! I'm your fitness mentor. How can I help you today?",
          isUser: false,
          timestamp: new Date()
        }
      ]
    });
    await chat.save();
  }
  return chat;
};

const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);
export default Chat;