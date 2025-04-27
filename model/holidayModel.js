import { Schema, model } from "mongoose";


const holiday = new Schema ({


   
    holidayDate:{
        type:Date,
        },
    holidayName:{
        type:String
    }
   

})

export default model("holiday", holiday);    

