import { Schema, model } from "mongoose";





const leads = new Schema({

    leadName:{
        type:String 
    },
    // leadName:{
    //     type:String
    // },
    email:{
        type:String
    },
    phone:{
        type:String
    },
    alternativePhone:{
        type:String
    },
    location:{
        type:String
    },
    loanType:{
        type:String
    },
    loanAmount:{
        type:Number
    },
    LeadCreatedDate:{
        type:Date
    },
    branch:{
        type:Schema.Types.ObjectId,
        ref:"branch"
    },
    createdBy:{
         type:Schema.Types.ObjectId,
         ref:"employee"
    },
    status:{
        type:String,
        enum:["INPROCESS","ELIGIBLE","RNR","REJECTED"]
    }
   
    

})


export default model("leads", leads);    
