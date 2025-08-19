import { Schema, model } from "mongoose";


const loanType = new Schema({
    loanName: {
        type: String,
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
})

export default model("loanType", loanType);

