import { Schema, model } from "mongoose";


const bank = new Schema ({


   
    name:{
        type:String,
        },
    city:{
        type:String
     },
    area:{
        type:String
     },
    logo:{
        type:[String]
     },
     isDeleted:{
        type:Boolean,
        default:false
     }
   

})

export default model("bank", bank);    

