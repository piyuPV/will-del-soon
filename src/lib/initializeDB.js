// import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGODB_URI;


// const connectDB = async () => {
//     try {
//         console.log(MONGO_URI);
//         await mongoose.connect(MONGO_URI);
//         console.log("Connected to MongoDB");
//     } catch (error) {
//         console.log(error);
//     }
// };


// export default connectDB;


// import { MongoClient } from 'mongodb';

// const MONGO_URI = process.env.MONGODB_URI;

// let client;
// let db;

// if (process.env.NODE_ENV === 'development') {
//     if (!(global)._mongoClientPromise) {
//         (global)._mongoClientPromise = MongoClient.connect(MONGO_URI);
//     }
//     client = await (global)._mongoClientPromise;
//     console.log("Connected to MongoDB");
// } else {
//     client = await MongoClient.connect(MONGO_URI);
//     console.log("Connected to MongoDB");
// }

// db = client.db();

// export default db;


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