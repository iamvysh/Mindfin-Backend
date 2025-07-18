import { Schema, model } from "mongoose";

const otpModel = new Schema({
    email: {
        type: String
    },
    otp: {
        type: String
    },
    createdAt: { 
        type: Date, 
        default: Date.now, 
        index: { expires: 300 } 
    }
});

export default model("otp", otpModel);