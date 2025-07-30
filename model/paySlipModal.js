import { Schema, model } from "mongoose";

const paySlip = new Schema({
  employee: {
    type: Schema.Types.ObjectId,
    ref: "employee",
  },
  title: {
    type: String,
  },
  level: {
    type: String,
  },
  basicSalary: {
    type: Number,
  },
  housingAllowence: {
    type: Number,
  },
  transportAllowence: {
    type: Number,
  },
  utilityAllowence: {
    type: Number,
  },
  productivityAllowence: {
    type: Number,
  },
  communicationAllowence: {
    type: Number,
  },
  inconvenienceAllowence: {
    type: Number,
  },
  hikeAmount: {
    type: Number,
    default: 0,
  },
  bonusAmount: {
    type: Number,
    default: 0,
  },
  grossSalary: {
    type: Number,
  },
  tax: {
    type: Schema.Types.ObjectId,
    ref: "tax",
  },
  taxAmount:{
    type: Number,

  },
  employeePension: {
    type: Number,
  },
  netSalary: {
    type: Number,
  },
  totalDeduction:{
    type: Number,

  },
  month: {
    type: String,
    enum: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
},{timestamps:true});

export default model("paySlip", paySlip);
