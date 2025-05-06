    import { Schema, model } from "mongoose";

    const leave = new Schema ({


        employee:{
            type: Schema.Types.ObjectId,
            ref: "employee" 
        },
        leaveType:{
            type:String,
            // enum:["DATAENTRY","HR","SALES","CREDITMANAGER","BRANCHMANAGER"]
        },
        startDate:{
            type:Date
        },
        endDate:{
            type:Date
        },
        duration:{
            type:Number,
        } ,  
        reason:{
            type:String,
        },
        supporingDoc:{
            type:["String"]
        },
        leaveStatus: {
            type: String,
            enum: ["APPROVED", "PENDING","REJECTED"],
            // default: "ACTIVE"
        },
        decisionMadeBy:{
            type: Schema.Types.ObjectId,
            ref: "employee" 
        },
        


    },{
        timestamps: true 
    })

    export default model("leave", leave);    
