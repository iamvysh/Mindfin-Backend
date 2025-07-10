// models/leadHistory.js
import { Schema, model } from "mongoose";

const leadHistorySchema = new Schema({
  lead: {
    type: Schema.Types.ObjectId,
    ref: "leads",
    required: true,
  },
  status: {
    type: String,
    enum: ["INPROGRESS", "PENDING", "CLOSED", "DROPPED"], // Snapshot of lead's status
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
    type: String, // String for simplicity (e.g., "14:30")
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
