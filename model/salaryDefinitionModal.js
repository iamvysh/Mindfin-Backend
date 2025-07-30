import { Schema, model } from "mongoose";



const salaryDefinition = new Schema({

    designation: {
        type: Schema.Types.ObjectId,
        ref: "designation"
    },
    basicSalary: {
        type: Number
    },
    allowence: {
        type: Number
    },
    grossSalary: {
        type: Number
    },
    deduction: {
        type: Number
    },
    netSalary: {
        type: Number
    }
}, { timestamps: true })


export default model("salaryDefinition", salaryDefinition);