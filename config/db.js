import mongoose from "mongoose";
import { loadEnv } from "./envConfig.js";
// import dotenv from 'dotenv';

// dotenv.config();

loadEnv()




const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_URL)
        // await mongoose.connect("mongodb+srv://ayush0511:Ew00B5C30u0IyMpR@cluster0.bwh1eyh.mongodb.net/mindfin?retryWrites=true&w=majority")
        console.log("database connected successfully!")
    } catch (err) {
        console.log(err);
        
        console.log("failed to connect due to server error!")
    }
}

export default connectDB;