import { Schema, model } from "mongoose";

const leadHistorySchema = new Schema({
  lead: {
    type: Schema.Types.ObjectId,
    ref: "leads",
    required: true,
  },
  status: {
    type: String,
    enum: ["INPROGRESS", "PENDING", "CLOSED", "DROPPED"],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  scheduledDate: {
    type: Date,
  },
  scheduledTime: {
    type: String,
  },
  remarks: {
    type: String,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "employee",
  },
}, {
  timestamps: true,
});

export default model("leadHistory", leadHistorySchema);
