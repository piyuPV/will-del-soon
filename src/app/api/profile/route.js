import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import User from "@/model/user.model";
import connectDB from "@/lib/initializeDB";


export async function GET(request) {
    try {
        await connectDB();
        const token = request.cookies.get('token')?.value;
        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development-only';
        const decoded = jwt.verify(token, jwtSecret);
        const userId = decoded.userId;

        if (!userId) {
            return NextResponse.json({ message: "User ID is required" }, { status: 400 });
        }

        const user = await User.findById(userId)
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user, { status: 200 });

    } catch (error) {
        console.log("error: ", error);
        return NextResponse.json({ error: error || "Unknown Error" }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        await connectDB();

        // Get token from cookie
        const token = request.cookies.get('token')?.value;
        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Verify and decode the token
        const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development-only';

        try {
            // Extract userId from the token payload
            const decoded = jwt.verify(token, jwtSecret);
            const userId = decoded.userId;

            // Get update data from request body
            const updateData = await request.json();
            console.log("Update data:", updateData);
            // Find the user and update
            const updatableFields = [
                'name', 'gender', 'weight', 'height', 'bloodGroup',
                'dob', 'allergies', 'phone', 'emergencyContact',
                'steps', 'caloriesBurned', 'sleepHours', 'dailyGoalProgress'
            ];

            // Build update object with only allowed fields
            const updateObj = {};
            updatableFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    updateObj[field] = updateData[field];
                }
            });

            // Update the user
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $set: updateObj },
                { new: true } // Return updated document
            );

            if (!updatedUser) {
                return NextResponse.json({ message: "User not found" }, { status: 404 });
            }

            // Return updated user data
            const userData = updatedUser.toObject();
            delete userData.password; // Remove password field if it exists

            return NextResponse.json(userData, { status: 200 });

        } catch (jwtError) {
            console.error("JWT verification error:", jwtError);
            return NextResponse.json({ message: "Invalid token" }, { status: 401 });
        }

    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json({ error: error.message || "Unknown Error" }, { status: 500 });
    }
}