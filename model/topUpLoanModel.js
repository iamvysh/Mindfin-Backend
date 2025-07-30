import mongoose from "mongoose";

const topUpLoanSchema = new mongoose.Schema({
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: "leads", required: true },
  type: { type: String, enum: ["Personal", "Business"], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  cibilScore: { type: Number },
  remarks: String,
}, { timestamps: true });

export default mongoose.model("TopUpLoan", topUpLoanSchema);