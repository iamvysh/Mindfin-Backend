import { Schema, model } from "mongoose";


const branch = new Schema ({


      
    name:{
        type:String,
    },
    location:{
        type:String,
    },
    isDeleted:{
        type:Boolean,
        default:false
    }


},{
    timestamps: true 
})

export default model("branch", branch);  