    import { Schema, model } from "mongoose";


    const candidate = new Schema ({


        appliedFor:{
            type: Schema.Types.ObjectId,
            ref: "jobs"
            },
        AppliedDate:{
            type:Date,
            },
        name:{
            type:String
        },
        email:{
            type:String
        },
        phone:{
            type:String
        },
        type:{
            type:String,
            enum:["WFH","WFO"]
        },
        resume:{
            type:[String]
        },
        applicationStatus:{
            type:String,
            enum:["INPROGRESS","SELECTED","REJECTED"]
        }

    })

    export default model("candidate", candidate);    

