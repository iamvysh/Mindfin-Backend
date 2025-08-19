import { Schema, model } from "mongoose";

const leads = new Schema({
  leadName: {
    type: String,
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },
  alternativePhone: {
    type: String,
  },
  location: {
    type: String,
  },
  loanType: {
    type: Schema.Types.ObjectId,
    ref: "loanType",
  },
  loanAmount: {
    type: Number,
  },
  LeadCreatedDate: {
    type: Date,
    default: Date.now
  },
  branch: {
    type: Schema.Types.ObjectId,
    ref: "branch",
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "employee",
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: "employee",
  },
  assignedDate: {
    type: Date,
  },
  creditManger: {
    type: Schema.Types.ObjectId,
    ref: "employee",
  },
  creditManagerAssignedDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ["INPROGRESS", "PENDING", "CLOSED", "DROPPED"],
    default: "PENDING"
  },
  document: [
    {
      name: { type: String },
      url: { type: String },
    },
  ],
  panCard: {
    type: String,
  },
  dateOfBirth: {
    type: Date
  }
});

export default model("leads", leads);
