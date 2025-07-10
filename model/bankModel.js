import mongoose from "mongoose";

const bankDetailsSchema = new mongoose.Schema({

   lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "leads",
    required: true,
  },
  bankName: {
    // type: String,
    // required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: "bank",
    required: true,
  },
  bankerName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  emailId: {
    type: String,
    required: true,
  },
  loanAmountRequested: {
    type: Number,
    required: true,
  },
  rateOfInterest: {
    type: Number, // use String if rates like "7.5%" are stored
    required: true,
  },
  pf: {
    type: Number, // PF = Processing Fee (assumed numeric)
    required: false,
  },
  tenure: {
    type: String, // Or Number, depending on format (e.g., "12 months")
    required: true,
  },
  insuranceAmount: {
    type: Number,
    required: false,
  },
  loanType: {
    // type: String,
    // enum: ["Home", "Car", "Personal", "Other"], // Adjust based on options
    // required: true,
   
       type:mongoose.Schema.Types.ObjectId,
       ref: "loanType",  
      
  },
  scheduledDate: {
    type: Date,
    required: false,
  },
  followUpDate: {
    type: Date,
    required: false,
  },
  status: {
    type: String,
    enum: ["Confirmed", "In Progress", "Declined"],
    required: true,
  },
   document: [
    {
      name: { type: String },
      url: { type: String },
    },
  ],
  remarks: {
    type: String,
  },
}, { timestamps: true });

export default mongoose.model("BankDetails", bankDetailsSchema);
