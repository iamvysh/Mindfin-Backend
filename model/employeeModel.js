import { Schema, model } from "mongoose";

const employee = new Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: Number, required: true, unique: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    profileImg: { type: [String], required: true },
    DOB: { type: Date, required: true },
    maritalStatus: { type: String, enum: ["MARRIED", "SINGLE"], required: true },
    gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"], required: true },
    nationality: { type: String, required: true },
    familyMember: { type: String, required: true },
    emergencyNumber: { type: String, required: true },
    aadharNumber: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    address: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    zipCode: { type: Number, required: true },
    employeeId: { type: String, required: true },
    userName: { type: String, required: true },
    employeeType: {
        type: String,
        enum: ["PERMANENT", "TEMPORARY", "INTERN", "NOTICEPERIOD"],
        required: true,
    },
    branch: [
        {
            type: Schema.Types.ObjectId,
            ref: "branch",
            required: true,
        },
    ],
    designation: { type: Schema.Types.ObjectId, ref: "designation", required: true },
    workingDays: { type: String, required: true },
    workingHours: { type: String, required: true },
    jobType: {
        type: String,
        enum: ["REMOTE", "WFH", "HYBRID"],
        required: true,
    },
    dateOfJoin: { type: Date },
    dateOfLeave: { type: Date },
    officeLocation: { type: String },
    salary: { type: Number, required: true },
    salaryStartDate: { type: Date },
    salaryEndDate: { type: Date },
    attendanceLocation: { type: String, required: true },
    bankName: { type: String, required: true },
    bankBranchName: { type: String, required: true },
    accountName: { type: String, required: true },
    accountNo: { type: String, required: true },
    IFSC: { type: String, required: true },
    SWIFT: { type: String, required: true },
    IBAN: { type: String, required: true },
    bioMetricIp: { type: String },
    appointmentLetter: [String],
    salarySlip: [String],
    relievingLetter: [String],
    experienceLetter: [String],
    aadharCard: { type: [String], required: true },
    panCard: { type: [String], required: true },
    password: { type: String },
    isDeleted: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
}, { timestamps: true });

export default model("employee", employee);