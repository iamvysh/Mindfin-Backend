import { Schema, model } from "mongoose";

const employee = new Schema({
    firstName: String,
    lastName: String,
    // "2FA": {
    //     type: Boolean,
    //     default: true
    // },
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
    DOB:{
        type:Date
    },
    maritalStatus:{
        type:String,
        enum:["MARRIED","SINGLE"]

    },
    gender:{
        type:String,
        enum:["MALE","FEMALE","OTHER"]

    },
    nationality:{
        type:String,
    },
    familyMember:{
        type:String,
    },
    emergencyNumber:{
        type:String,
    },
    aadharNumber:{
        type:String,
    },
    bloodgroup:{
        type:String,
    },
    address:{
        type:String,
    },
    state:{
        type:String,
    },
    city:{
        type:String,
    },
    zipCode:{
        type:Number,
    },
    employeeId:{
        type:String,
    },
    userName:{
        type:String,
    },
    employeeType:{
        type:String,
        enum: ["PERMENENT","TEMPORARARY","INTERN","NOTICEPERIOD"],

    },
    professionalEmail:{
        type:String,
    },
    // branch:{
    //     type:[String],
    // },
    branch: [
        {
          type: Schema.Types.ObjectId,
          ref: "branch" 
        }
      ],
    designation:{
        type: Schema.Types.ObjectId,
        ref: "designation" 
    },
    workingDays:{
        type:String
    },
    workingHours:{
        type:String
    },
    dateOfJoin:{
        type:Date
    },
    dateOfLeave:{
        type:Date
    },
    jobType:{
        type:String,
        enum:["REMOTE","WFH","HYBRID"]
    },
    officeLocation:{
        type:String
    },
    salary:{
        type:Number
    },
    salaryStartDate:{
        type:Date
    },
    salaryEndDate:{
        type:Date
    },
    bankName:{
      type:String
    },
    bankBranchName:{
      type:String
    },
    accountName:{
      type:String
    },
    accountNo:{
      type:String
    },
    IFSC:{
      type:String
    },
    SWIFT:{
      type:String
    },
    IBAN:{
      type:String
    },
    attendenceLoacation:{
        type:String
    },
    bioMetricIp:{
        type:String
    },
    appointmentLetter:{
        type: [String]

    },
    salarySlip:{
        type: [String]

    },
    relivingLetter:{
        type: [String]

    },
    experienceLetter:{
        type: [String]
    },
    aadharCard:{
        type: [String]

    },
    panCard:{
        type: [String]

    },
    password: {
        type: String
    },

    // type: {
    //     type: String,
    //     default: "ADMIN",
    //     enum: ["SUPERADMIN", "ADMIN","SALES","MANAGER"]
    // },
    // status: {
    //     type: String,
    //     enum: ["PERMENENT","TEMPORARARY","INTERN","NOTICEPERIOD"],
    // },
    isDeleted:{
        type:Boolean,
        default:false
    },
    // countryCode: {
    //     type: String,
    //     default: "+91"
    // },
    // resetPasswordToken: {
    //     type: String
    // },
    // resetPasswordExpires: {
    //     type: Date,
    // },
    // address: {
    //     city: {
    //         type: String,
    //     },
    //     state: {
    //         type: String
    //     },
    //     country: {
    //         type: String
    //     }
    // }
    
}, { timestamps: true })


    export default model("employee", employee);