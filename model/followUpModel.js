import mongoose from "mongoose";
const { Schema } = mongoose;

const followUpSchema = new Schema({
  bankDetail: {
    type: Schema.Types.ObjectId,
    ref: "BankDetails",
    required: true,
  },
  loanAmountRequested: {
    type: Number,
    required: true,
  },
  rateOfInterest: {
    type: Number,
    required: true,
  },
  pf: {
    type: Number,
    required: false,
  },
  tenure: {
    type: String,
    required: true,
  },
  insuranceAmount: {
    type: Number,
    required: false,
  },
  loanType: {
    type: Schema.Types.ObjectId,
    ref: "loanType",
  },
  date: {
    type: Date,
    required: true,
  },
  followUpDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["Confirmed", "In Progress", "Declined"],
    required: true,
  },
  remarks: {
    type: String,
    required: false,
  },
}, { timestamps: true });

export default mongoose.model("FollowUp", followUpSchema);
