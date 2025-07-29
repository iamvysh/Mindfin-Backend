import { Schema, model } from "mongoose";

const branchSchema = new Schema({
    name: {
        type: String,
        required: true // e.g. "ICICI - Andheri West"
    },
    location: {
        type: String,
        required: true // e.g. "Mumbai, Maharashtra"
    },
    bankName: {
        type: String,
        required: true // e.g. "ICICI"
    },
    branchCode: {
        type: String,
        unique: true, // e.g. "ICICI456"
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export default model("branch", branchSchema);
