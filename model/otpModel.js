import { Schema, model } from "mongoose";

const otpModel = new Schema({
    // phone: {
    //     type: Number
    // },
    email: {
        type: String
    },
    otp: {
        type: String
    },
    // type: {
    //     type: String,
    // },
    // purpose: {
    //     type: Number,
    //     enum: [0, 1, 2, 3]
    // },
    createdAt: { type: Date, default: Date.now, index: { expires: 300 } },
})

export default model("otp", otpModel);