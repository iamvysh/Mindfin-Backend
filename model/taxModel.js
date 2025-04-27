import { Schema, model } from "mongoose";


const tax = new Schema ({     
    taxType:{
        type:String,
        // unique: true, 
    },
    branch:{
            type: Schema.Types.ObjectId,
            ref: "branch" 
            },
    value:{
        type:Number,
    }
},{
    timestamps: true 
})

export default model("tax", tax);  