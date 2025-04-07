import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    picture: { type: String, required: false },
    gender: { type: String, required: false },
    weight: { type: Number, required: false },
    height: { type: Number, required: false },
    bloodGroup: { type: String, required: false },
    dob: { type: Date, required: false },
    allergies: { type: String, required: false },
    phone: { type: String, required: false },
    emergencyContact: { type: String, required: false },
    steps: { type: Number, default: 0, required: false },
    caloriesBurned: { type: Number, default: 0, required: false },
    sleepHours: { type: Number, default: 0, required: false },
    dailyGoalProgress: { type: Number, default: 0, required: false },
},
    {
        'timestamps': true
    });


const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;