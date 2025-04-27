import { Schema, model } from "mongoose";


const designation = new Schema ({


      
    designation:{
        type:String,
        unique: true, 

    },
    isDeleted:{
        type:Boolean,
        default:false
    }


},{
    timestamps: true 
})

export default model("designation", designation);  