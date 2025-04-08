


import mongoose from "mongoose";

let isConnected = false;
export default async function connectDB() {
    if(isConnected) {
        console.log("Connection available to DB");
        return;
    }
    try {
        console.log(process.env.MONGODB_URI, process.env.DB_NAME);
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: process.env.DB_NAME,
        });      
        isConnected = true;  
        console.log("Connecting to DB");
    } catch (error) {
        console.log(error)
    }
};