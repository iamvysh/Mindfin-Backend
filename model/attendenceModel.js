import { Schema, model } from "mongoose";




const attendence = new Schema ({


    employee:{
        type: Schema.Types.ObjectId,
        ref: "employee" 
       },
    checkIn:{
        type:Date,
        // enum:["DATAENTRY","HR","SALES","CREDITMANAGER","BRANCHMANAGER"]
          },
    checkOut:{
        type:Date
    },
    status:{
        type:String,
        enum:["ONTIME","LATE","ABSENT","HALFDAY"]
    },
    workingHours:{
        type:String,
    } ,  
    // shift:{
    //     type:String,
    //     enum:["DAY","NIGHT"]

    // },
   
    


},{ timestamps: true })

export default model("attendence", attendence);