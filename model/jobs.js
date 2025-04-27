import { Schema, model } from "mongoose";


const jobs = new Schema ({


    branch:{
        type: Schema.Types.ObjectId,
        ref: "branch" 
        },
    designation:{
        type: Schema.Types.ObjectId,
        ref: "designation" 
    },
    jobTitle:{
        type:String
    },
    description:{
        type:String
    },
    jobType:{
        type:String,
        enum:["WFH","WFO","HYBRID"]
    } ,  
    isPublished:{
        type:Boolean,
        default:false
    },
    noOfVacancies:{
        type:Number
    },
    jobStatus: { 
        type: String,
        enum: ["ACTIVE", "COMPLETED"],
        default: "ACTIVE"
    },
    publishedDate : {
        type:Date
    },
    salaryAmount:{
        type:String
    }
    


})

export default model("jobs", jobs);    

