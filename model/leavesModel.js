import { Schema, model } from "mongoose";

const leave = new Schema({

    employee: {
        type: Schema.Types.ObjectId,
        ref: "employee"
    },
    leaveType: {
        type: String,
        enum: ["ANNUALLEAVE", "CASUALLEAVE", "SICKLEAVE", "OTHER"]
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    duration: {
        type: Number,
    },
    reason: {
        type: String,
    },
    supportingDoc: {
        type: ["String"]
    },
    leaveStatus: {
        type: String,
        enum: ["APPROVED", "PENDING", "REJECTED"]
    },
    decisionMadeBy: {
        type: Schema.Types.ObjectId,
        ref: "employee"
    }
}, { timestamps: true });

export default model("leave", leave);    
