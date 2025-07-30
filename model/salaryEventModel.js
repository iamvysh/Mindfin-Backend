// models/salaryEvent.js
import { Schema, model } from "mongoose";

const salaryEvent = new Schema({
    employee: {
        type: Schema.Types.ObjectId,
        ref: "employee",
        required: true,
    },
    type: {
        type: String,
        enum: ["HIKE", "BONUS"],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    reason: {
        type: String,
    },
    effectiveFrom: {
        type: Date,
        required: true,
    }
}, { timestamps: true });

export default model("salaryEvent", salaryEvent);
