import { Schema, model } from "mongoose";

const payRoll = new Schema({
  paymentName: {
    type: String,
  },
  designation: {
    type: Schema.Types.ObjectId,
    ref: "designation",
  },
  generatedDate: {
    type: Date,
  },
  paymentMonth: {
    type: String,
  },
  paymentYear: {
    type: String,
  },
  branch: {
    type: Schema.Types.ObjectId,
    ref: "branch",
  },
});

export default model("payRoll", payRoll);
