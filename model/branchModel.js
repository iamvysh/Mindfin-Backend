import { Schema, model } from "mongoose";

const branchSchema = new Schema({
    name: {
        type: String,
        required: true 
    },
    location: {
        type: String,
        required: true 
    },
    bankName: {
        type: String,
        required: true 
    },
    branchCode: {
        type: String,
        unique: true,
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
