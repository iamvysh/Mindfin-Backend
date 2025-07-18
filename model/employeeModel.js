import { Schema, model } from "mongoose";

const employee = new Schema({
    firstName: String,
    lastName: String,
    phone: {
        type: Number
    },
    email: {
        type: String,
        required: true
    },
    profileImg: {
        type: [String]
    },
    DOB: {
        type: Date
    },
    maritalStatus: {
        type: String,
        enum: ["MARRIED", "SINGLE"]

    },
    gender: {
        type: String,
        enum: ["MALE", "FEMALE", "OTHER"]

    },
    nationality: {
        type: String,
    },
    familyMember: {
        type: String,
    },
    emergencyNumber: {
        type: String,
    },
    aadharNumber: {
        type: String,
    },
    bloodgroup: {
        type: String,
    },
    address: {
        type: String,
    },
    state: {
        type: String,
    },
    city: {
        type: String,
    },
    zipCode: {
        type: Number,
    },
    employeeId: {
        type: String,
    },
    userName: {
        type: String,
    },
    employeeType: {
        type: String,
        enum: ["PERMENENT", "TEMPORARARY", "INTERN", "NOTICEPERIOD"],

    },
    professionalEmail: {
        type: String,
    },
    branch: [
        {
            type: Schema.Types.ObjectId,
            ref: "branch"
        }
    ],
    designation: {
        type: Schema.Types.ObjectId,
        ref: "designation"
    },
    workingDays: {
        type: String
    },
    workingHours: {
        type: String
    },
    dateOfJoin: {
        type: Date
    },
    dateOfLeave: {
        type: Date
    },
    jobType: {
        type: String,
        enum: ["REMOTE", "WFH", "HYBRID"]
    },
    officeLocation: {
        type: String
    },
    salary: {
        type: Number
    },
    salaryStartDate: {
        type: Date
    },
    salaryEndDate: {
        type: Date
    },
    bankName: {
        type: String
    },
    bankBranchName: {
        type: String
    },
    accountName: {
        type: String
    },
    accountNo: {
        type: String
    },
    IFSC: {
        type: String
    },
    SWIFT: {
        type: String
    },
    IBAN: {
        type: String
    },
    attendenceLoacation: {
        type: String
    },
    bioMetricIp: {
        type: String
    },
    appointmentLetter: {
        type: [String]

    },
    salarySlip: {
        type: [String]

    },
    relivingLetter: {
        type: [String]

    },
    experienceLetter: {
        type: [String]
    },
    aadharCard: {
        type: [String]

    },
    panCard: {
        type: [String]

    },
    password: {
        type: String
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });


export default model("employee", employee);