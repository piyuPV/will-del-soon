import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  exerciseType: {
    type: String,
    required: true,
    enum: ['pushup', 'squat', 'other'], // Add constraints for exercise types
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  maxParticipants: {
    type: Number,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active',
  },
  
  // Challenge structure (levels, requirements)
  levels: [
    {
      number: {
        type: Number,
        required: true
      },
      required: {
        type: Number,
        required: true,  // Required reps to complete level
      },
      starThresholds: {
        oneStar: { type: Number }, // e.g., 100% of required
        twoStars: { type: Number }, // e.g., 120% of required
        threeStars: { type: Number }, // e.g., 150% of required
      }
    }
  ],
  
  // Consolidated participant data with progress
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    currentLevel: {
      type: Number,
      default: 1
    },
    totalStars: {
      type: Number,
      default: 0
    },
    levelProgress: [
      {
        levelNumber: {
          type: Number,
          required: true
        },
        stars: {
          type: Number,
          default: 0,
          min: 0,
          max: 3
        },
        unlocked: {
          type: Boolean,
          default: false
        },
        bestAttempt: {
          reps: Number,
          completedAt: Date
        },
        attempts: [
          {
            reps: Number,
            completedAt: {
              type: Date,
              default: Date.now
            },
            starsEarned: Number
          }
        ]
      }
    ]
  }],
}, {
  timestamps: true,
});

// Compound index for efficient participant lookup
challengeSchema.index({ 'participants.user': 1 });

// Helper method to calculate stars based on reps and required
challengeSchema.methods.calculateStars = function(reps, levelNumber) {
  const level = this.levels.find(l => l.number === levelNumber);
  if (!level) return 0;
  
  if (reps >= level.starThresholds.threeStars) return 3;
  if (reps >= level.starThresholds.twoStars) return 2;
  if (reps >= level.starThresholds.oneStar) return 1;
  return 0;
};

// Helper method to get a user's progress in this challenge
challengeSchema.methods.getUserProgress = function(userId) {
  return this.participants.find(p => p.user.toString() === userId.toString());
};

export default mongoose.models.Challenge || mongoose.model('Challenge', challengeSchema);