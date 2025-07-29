import employeeModel from "../../model/employeeModel.js";
import CustomError from "../../utils/customError.js";
import sendResponse from "../../utils/sendResponse.js";
import transport from "../../config/nodemailer.js";
import otpModel from "../../model/otpModel.js";
import otpGenerator from "otp-generator";
import { comparePassword, hashPassword } from "../../utils/hashPass.js";
import { decryptData, encryptData } from "../../utils/cryptr.js";
import { trusted } from "mongoose";
import attendenceModel from "../../model/attendenceModel.js";
import leavesModel from "../../model/leavesModel.js";
import JwtService from "../../utils/jwtService.js";
import { Otp, welcomeEmployee } from "../../utils/emailTemplate.js";
import sendMail from '../../utils/sendMail.js';
import bcrypt from 'bcrypt';


export const addEmployee = async (req, res, next) => {

    const { firstName, lastName, email, phone, password, employeeId } = req.body;

    const employeeExists = await employeeModel.findOne({ email });
    if (employeeExists) {
        return next(new CustomError("Employee with this email already exists!", 400));
    }

    const existingOtp = await otpModel.findOne({ email });
    if (existingOtp) {
        const now = new Date();
        const otpCreatedAt = new Date(existingOtp.createdAt);
        const diffMs = now - otpCreatedAt;
        const diffMinutes = diffMs / (1000 * 60);

        if (diffMinutes < 5) {
            return sendResponse(res, 200, "An OTP has already been sent to your email.");
        } else {
            await otpModel.deleteMany({ email: email });
        }
    }
    const OTP = otpGenerator.generate(4, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
    });
    const encryptedOtp = await hashPassword(OTP);
    await otpModel.create({ email: email, otp: encryptedOtp });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newEmployee = new employeeModel({
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        designation: "68888585c08e287ca1800bc1",
        employeeId
    });
    await newEmployee.save();

    const msg = `
    <div style="font-family: 'Roboto', sans-serif; width: 100%;">
        <div style="background: #5AB2FF; padding: 10px 20px; border-radius: 3px; border: none">
           <a href="" style="font-size:1.6em; color: white; text-decoration:none; font-weight:600">KINGSTER</a>
        </div>
        <p>Hello ${firstName} ${lastName}!</p>
        <p>Thank you for choosing Kingster. Use the following OTP to complete your Sign Up procedure. This OTP is valid for 2 minutes.</p>
        <div style="display: flex; align-items: center; justify-content: center; width: 100%;">
           <div style="background: #5AB2FF; color: white; width: fit-content; border-radius: 3px; padding: 5px 10px; font-size: 1.4em;">${OTP}</div>
        </div>
        <p>Thanks,<br>Kingster Team</p>
        <p>
            You can contact us at our office located at 1st Floor, Swathanthriya Samara Smrithi Bhavan, Nandavanam Road, Palayam (P.O), Thiruvananthapuram, Kerala - 695033, or reach us via phone at +91-811 199 5931 or email at info@kingster.edu.in.<br>
            © 2024 Kingster Education. All rights reserved.
        </p>
    </div>`;

    await sendMail(email, 'Account Authorization', msg);
    sendResponse(res, 200, "OTP sent to your email.");
};

export const verifyOtp = async (req, res, next) => {
    const { otp, email } = req.body;

    const otpHolder = await otpModel.findOne({ email });
    if (!otpHolder) {
        return next(new CustomError("Oops! Otp got expired!", 400));
    }

    const validUser = await comparePassword(otp, otpHolder?.otp);

    if (!validUser) {
        return next(new CustomError("Invalid otp entered!", 400));
    }
    await otpModel.deleteMany({ email });
    await employeeModel.updateOne({ email }, { $set: { isVerified: true } });

    sendResponse(res, 200, 'Otp verificication successfull.');
};

export const loginEmployee = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const employeeDoc = await employeeModel.findOne({ email }).populate("designation", "designation");
        if (!employeeDoc) {
            return next(new CustomError("Employee doesn't exist!", 404));
        }
        const isMatch = await bcrypt.compare(password, employeeDoc.password);
        if (!isMatch) {
            return next(new CustomError("Email or password is incorrect!", 400));
        }
        if (!employeeDoc.isVerified) {
            return next(new CustomError("Please verify your email before logging in!", 403));
        }
        const employee = employeeDoc.toObject();
        delete employee.password;
        const tokenPayload = {
            _id: employee._id,
            email: employee.email,
            type: employee.designation?.designation,
        };

        if (employee?.designation?.designation === "SUPERADMIN") {
            tokenPayload.branch = employee.branch?.[0] || null;
            const token = await JwtService.sign(tokenPayload);
            return sendResponse(res, 200, { token, employee });
        }
        if (employee.branch?.length > 1) {
            const populatedBranches = await employeeModel.findOne({ email }).populate("branch", "name");
            return sendResponse(res, 200, { isMultipleBranch: true, branches: populatedBranches.branch });
        }

        tokenPayload.branch = employee.branch?.[0];
        const token = await JwtService.sign(tokenPayload);
        return sendResponse(res, 200, { token, employee });

    } catch (error) {
        next(error);
    }
};




// export const generatePassword = async (req, res, next) => {


//     const { email } = req.body

//     let isEmployeeExist = await employeeModel.findOne({ email })

//     if (!isEmployeeExist) {
//         return next(new CustomError("employee not found", 400))
//     }

//     let name = isEmployeeExist?.firstName


//     const OTP = otpGenerator.generate(4, {
//         digits: true,
//         lowerCaseAlphabets: false,
//         upperCaseAlphabets: false,
//         specialChars: false,
//     });

//     const encryptedOtp = await hashPassword(OTP);

//     const existingOtp = await otpModel.findOne({ email: isEmployeeExist?.email });
//     if (existingOtp) {
//         return sendResponse(res, 200, "OTP sent successfully");
//     }

//     await otpModel.create({
//         email: email,
//         otp: encryptedOtp,
//     });

//     // Split OTP into individual digits
//     const otpDigits = OTP.split("");





//     await transport.sendMail({
//         from: process.env.SMTP_MAIL,
//         to: email,
//         headers: `From: ${process.env.SMTP_MAIL}`,
//         subject: "Account Authorization",
//         html: Otp({ name, otpDigits }),
//     });




//     // res.cookie("email", isEmployeeExist?.email, { httpOnly: true });
//     res.cookie("email", isEmployeeExist?.email, { secure: true, sameSite: 'None' });



//     sendResponse(res, 200, isEmployeeExist?.email)
// }

// export const verifyGeneratePassword = async (req, res, next) => {

//     const { otp, email } = req.body

//     const otpHolder = await otpModel.findOne({ email });

//     if (!otpHolder) {
//         return next(new CustomError("Oops! Otp got expired", 400))
//     }

//     const validUser = await comparePassword(otp, otpHolder?.otp);

//     if (!validUser) {
//         return next(new CustomError("Invalid otp entered", 400));
//     }
//     await otpModel.deleteMany({ email });

//     sendResponse(res, 200, 'otp verificication successfull')
// }

export const resetPasswordEmployee = async (req, res, next) => {



    const { email, password, confirmPassword } = req.body;

    let isExist = await employeeModel.findOne({ email });

    if (!isExist) {
        return next(new CustomError("employee does not exist", 404));
    }



    if (password !== confirmPassword) {
        return next(new CustomError("Password does not match.", 400));
    }

    const savedPassword = await encryptData(isExist?.password)

    if (savedPassword === password) {
        return next(new CustomError("New password cannot be the same as the current password.", 400))

    }

    const hashedPassword = await encryptData(password)

    isExist.password = hashedPassword

    await isExist.save()

    sendResponse(res, 200, 'Password reset successfull')




}

export const forgotPassword = async (req, res, next) => {
    const { email } = req.body


    let isEmployeeExist = await employeeModel.findOne({ professionalEmail: email })
    // let isEmployeeExist = await employeeModel.findOne({email})

    if (!isEmployeeExist) {
        return next(new CustomError("employee not found", 400))
    }

    let name = isEmployeeExist.firstName

    const OTP = otpGenerator.generate(4, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
    });

    const encryptedOtp = await hashPassword(OTP);

    // const existingOtp = await otpModel.findOne({ email: isEmployeeExist?.email });
    const existingOtp = await otpModel.findOne({ email: isEmployeeExist?.professionalEmail });
    if (existingOtp) {
        return sendResponse(res, 200, "OTP sent successfully");
    }

    await otpModel.create({
        email: email,
        otp: encryptedOtp,
    });

    // Split OTP into individual digits
    const otpDigits = OTP.split("");





    await transport.sendMail({
        from: process.env.SMTP_MAIL,
        to: email,
        headers: `From: ${process.env.SMTP_MAIL}`,
        subject: "Account Authorization",
        html: Otp({ name, otpDigits }),

    });





    sendResponse(res, 200, email)
}

export const reSendOtpForgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body

        if (!email) {
            return next(new CustomError("email is required"))
        }
        await otpModel.deleteMany({ email })

        let isEmployeeExist = await employeeModel.findOne({ professionalEmail: email })
        //  let isEmployeeExist = await employeeModel.findOne({email})

        if (!isEmployeeExist) {
            return next(new CustomError("employee not found", 400))
        }

        let name = isEmployeeExist.firstName

        const OTP = otpGenerator.generate(4, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false,
        });

        const encryptedOtp = await hashPassword(OTP);

        await otpModel.create({
            email: email,
            otp: encryptedOtp,
        });

        const otpDigits = OTP.split("");

        // HTML Template with dynamic OTP


        // Send email
        await transport.sendMail({
            from: process.env.SMTP_MAIL,
            to: email,
            headers: `From: ${process.env.SMTP_MAIL}`,
            subject: "Account Authorization",
            html: Otp({ name, otpDigits }),

        });

        sendResponse(res, 200, email);


    } catch (error) {

        return next(new CustomError(error.message));

    }
}

export const reSendOtpGeneratePassword = async (req, res, next) => {
    try {
        const { email } = req.body

        if (!email) {
            return next(new CustomError("email is required"))
        }
        await otpModel.deleteMany({ email })

        let isEmployeeExist = await employeeModel.findOne({ professionalEmail: email })
        //  let isEmployeeExist = await employeeModel.findOne({email})

        if (!isEmployeeExist) {
            return next(new CustomError("employee not found", 400))
        }

        let name = isEmployeeExist.firstName

        const OTP = otpGenerator.generate(4, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false,
        });

        const encryptedOtp = await hashPassword(OTP);

        await otpModel.create({
            email: email,
            otp: encryptedOtp,
        });

        const otpDigits = OTP.split("");

        // HTML Template with dynamic OTP


        // Send email
        await transport.sendMail({
            from: process.env.SMTP_MAIL,
            to: email,
            headers: `From: ${process.env.SMTP_MAIL}`,
            subject: "Account Authorization",
            html: Otp({ name, otpDigits }),

        });

        sendResponse(res, 200, email);


    } catch (error) {

        return next(new CustomError(error.message));

    }
}

export const getAllEmployees = async (req, res, next) => {

    console.log("hy from employees");

    const { type, branch } = req.user;
    const { designation, status, name, page = 1, limit = 10 } = req.query;

    const filter = { isDeleted: false };

    // If user is HR, filter by branch
    if (type === "HR" && branch) {
        filter.branch = branch;
    }

    if (designation) {
        filter.designation = designation;
    }

    if (status) {
        filter.employeeType = status;
    }

    if (name) {
        filter.$or = [
            { firstName: { $regex: name, $options: "i" } },
            { lastName: { $regex: name, $options: "i" } }
        ];
    }

    const employees = await employeeModel.find(filter)
        .populate("branch")
        .populate("designation")
        .skip(parseInt((page - 1) * limit))
        .limit(parseInt(limit));

    const totalEmployees = await employeeModel.countDocuments(filter);

    sendResponse(res, 200, {
        totalEmployees,
        currentPage: Number(page),
        totalPages: Math.ceil(totalEmployees / limit),
        employees
    });

};

export const getALLEmployeesForPayRoll = async (req, res, next) => {
    const { type, branch } = req.user;

    const filter = { isDeleted: false };


    if (type === "HR" && branch) {
        filter.branch = branch;
    }

    const employees = await employeeModel.find(filter)
        .select("firstName lastName")

    sendResponse(res, 200, employees)

}

export const getEmployeeById = async (req, res, next) => {
    const { id } = req.params
    console.log(id, "ied");


    const employee = await employeeModel.findById(id).populate("branch designation")

    if (!employee) {
        return next(new CustomError("Employee not found", 400))
    }

    sendResponse(res, 200, employee)

}

export const editEmployee = async (req, res, next) => {

    const body = req.body

    const { id } = req.params

    const employee = await employeeModel.findByIdAndUpdate(id, { $set: body }, { new: true })

    if (!employee) {
        return next(new CustomError("Employee not found", 400))
    }

    sendResponse(res, 200, employee)

}

export const deleteEmployee = async (req, res, next) => {

    const { id } = req.params

    const deleteEmployee = await employeeModel.findByIdAndUpdate(id, { $set: { isDeleted: true } }, { new: true })
    //  const deleteEmployee = 
    if (!deleteEmployee) {
        return next(new CustomError("Employee not found", 400))

    }
    sendResponse(res, 200, deleteEmployee)

}

export const updateBioEmployee = async (req, res, next) => {



    const { _id } = req.user;

    // Assign req.body to a variable
    //   const updateData = req.body;

    const { email, phone } = req.body

    console.log(email, phone);


    const isEmailExist = await employeeModel.findOne({
        email: { $regex: new RegExp(`^${email}$`, "i") },
        _id: { $ne: _id },
    });

    if (isEmailExist) {
        return next(new CustomError("Email is already in use"));
    }

    const isPhoneExist = await employeeModel.findOne({
        phone: Number(phone), // Convert `phone` to a number
        _id: { $ne: _id },
    });

    if (isPhoneExist) {
        return next(new CustomError("Phone is already in use"));
    }

    const existngAdmin = await employeeModel.findById(_id)


    if (email !== existngAdmin?.email || Number(phone) !== Number(existngAdmin?.phone)) {
        // Generate 4-digit OTP
        const OTP = otpGenerator.generate(4, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false,
        });

        const encryptedOtp = await hashPassword(OTP);

        const existingOtp = await otpModel.findOne({ email: existngAdmin.email });

        if (existingOtp) {
            return sendResponse(res, 200, "OTP sent successfully");
        }

        await otpModel.create({
            email: existngAdmin?.email,
            otp: encryptedOtp,
        });

        // Split OTP into individual digits
        const otpDigits = OTP.split("");

        // HTML Template with dynamic OTP
        const htmlContent = `
     <!DOCTYPE html>
     <html lang="en">
     <head>
         <meta charset="UTF-8">
         <meta name="viewport" content="width=device-width, initial-scale=1.0">
         <title>Verification Code Email</title>
         <style>
             body { font-family: Inter, Figtree SF Pro Display; background-color: #EEF3F6; margin: 0; padding: 0; }
             .container { width: 100%; display: flex; justify-content: center; padding: 20px 0; }
             .email-content { width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); overflow: hidden; }
             .header { background-color: #EEF3F6; padding: 20px; text-align: center; }
             .header h1 { margin: 0; font-size: 24px; color: #1E1E1E; font-weight: 900; }
             .main-content { padding: 20px; text-align: left; }
             .main-content h2 { font-size: 24px; color: #121A26; margin-bottom: 10px; font-weight: 700; }
             .main-content p { color: #384860; margin: 10px 0; font-size: 16px; }
             .verification-code { display: flex; justify-content: center; gap: 10px; margin: 20px 0; } /* Adjusted gap */
             .verification-code div { font-size: 40px; font-weight: 700; color: #121A26; border: 1px solid #2969FF; padding: 8px 12px; border-radius: 5px; width: 40px; text-align: center; background-color: #F8FAFC; } /* Adjusted padding */
             .footer { padding: 20px; background-color: #EEF3F6; text-align: left; color: #202B3C; font-size: 14px; }
         </style>
     </head>
     <body>
         <div class="container">
             <div class="email-content">
                 <div class="header"><h1>MINDFIN</h1></div>
                 <div class="main-content">
                     <h2>Confirm Verification Code</h2>
                     <p>Hi User,</p>
                     <p>This is your verification code:</p>
                     <div class="verification-code">
                         <div>${otpDigits[0]}</div>
                         <div>${otpDigits[1]}</div>
                         <div>${otpDigits[2]}</div>
                         <div>${otpDigits[3]}</div>
                     </div>
                     <p>Whether you're here for your brand, for a cause, or just for fun — welcome! This code will only be valid for the next 5 minutes.</p>
                     <p>Thanks,<br>Mindfin Team</p>
                 </div>
                
             </div>
         </div>
     </body>
     </html>
 `;
        // Send email
        await transport.sendMail({
            from: process.env.SMTP_MAIL,
            to: existngAdmin?.email,
            headers: `From: ${process.env.SMTP_MAIL}`,
            subject: "OTP verification",
            html: htmlContent,
        });

        return sendResponse(res, 200, { message: "Otp sent successfully" });


    }

    const updateUser = await employeeModel.findByIdAndUpdate(
        _id,
        {
            $set: {
                ...req.body
            }
        },
        { new: true, returnDocument: true }
    )

    return sendResponse(res, 200, { message: "Update Successfull", data: updateUser });


}

export const verifyEditProfileOtp = async (req, res, next) => {

    const { _id } = req.user;

    const { OTP } = req.body;

    console.log("req.body", req.body)

    const user = await employeeModel.findById(_id)

    if (!user) {
        return next(new CustomError("No admin found"));
    }

    const otpHolder = await otpModel.findOne({
        email: user?.email
    })

    if (!otpHolder) {
        return next(new CustomError("Oops! Otp got expired", 400))
    }

    const validUser = await comparePassword(OTP, otpHolder.otp);

    if (!validUser) {
        return next(new CustomError("Invalid otp entered", 400));
    }

    await otpModel.deleteMany({ email: user?.email });

    const updatedData = await employeeModel.findByIdAndUpdate(
        _id,
        {
            $set: {
                ...req.body
            }
        },
        { new: true, returnDocument: true }
    )

    return sendResponse(res, 200, { message: "Update successful", data: updatedData });

}

export const getCumulativeAttendances = async (req, res, next) => {

    const { id } = req.params; // Get employee ID from request params
    // const { page = 1, limit = 10 } = req.query; // Pagination parameters

    // const pageNumber = parseInt(page);
    // const limitNumber = parseInt(limit);
    // const skip = (pageNumber - 1) * limitNumber;

    // Check if the employee exists
    const employee = await employeeModel.findById(id);
    if (!employee) {
        return next(new CustomError("Employee not found", 404));
    }

    // Fetch attendance records with pagination
    const attendances = await attendenceModel
        .find({ employee: id })
        .sort({ createdAt: -1 }) // Sort by latest check-in first
    // .skip(skip)
    // .limit(limitNumber);

    // Get total count for pagination
    // const totalCount = await attendenceModel.countDocuments({ employee: id });

    return sendResponse(res, 200, {
        message: "Cumulative attendance fetched successfully",
        data: attendances,
        // pagination: {
        //     total: totalCount,
        //     page: pageNumber,
        //     limit: limitNumber,
        //     totalPages: Math.ceil(totalCount / limitNumber),
        // }
    });

}

export const getCumulativeEmployeeLeaves = async (req, res, next) => {
    const { employeeId } = req.params;
    // const { page = 1, limit = 10 } = req.query;

    // Ensure page and limit are numbers
    // const pageNumber = parseInt(page, 10);
    // const limitNumber = parseInt(limit, 10);

    // Fetch leaves with pagination
    const leaves = await leavesModel
        .find({ employee: employeeId })
        .sort({ createdAt: -1 })
    // .skip((pageNumber - 1) * limitNumber)
    // .limit(limitNumber);

    // Get total count for pagination metadata
    // const totalLeaves = await leavesModel.countDocuments({ employee: employeeId });

    return sendResponse(res, 200, {
        message: "Cumulative leave fetched successfully",
        data: leaves,
        // pagination: {
        //     total: totalLeaves,
        //     currentPage: pageNumber,
        //     totalPages: Math.ceil(totalLeaves / limitNumber),
        // },
    });

};

export const branchSelection = async (req, res, next) => {

    const { email, branch } = req.body;
    console.log(email, branch, "beee");

    const employee = await employeeModel.findOne({ professionalEmail: email }).populate("designation", "designation");
    // const employee = await employeeModel.findOne({ email:email }).populate("designation","designation");
    if (!employee) {
        return next(new CustomError("Employee not found", 404));
    }

    if (!employee.branch.includes(branch)) {
        return next(new CustomError("Invalid branch selection", 400));
    }

    // Generate token for selected branch


    // const token = jwt.sign(
    //     {
    //         email: employee.professionalEmail,
    //         _id: employee._id,
    //         designation: employee.designation,
    //         branch,
    //     },
    //     process.env.JWT_SECRET,
    //     { expiresIn: "1d" }
    // );

    const token = await JwtService.sign({ _id: employee._id, email: email, type: employee?.designation?.designation, branch: branch })
    employee.password = null
    return sendResponse(res, 200, { token, employee })

    // res.cookie("token", token, { httpOnly: true });
    // sendResponse(res, 200, { token });

};

export const whoAmI = async (req, res, next) => {

    console.log("hi");

    const { _id } = req.user

    const employee = await employeeModel.findById(_id).populate("branch designation")

    sendResponse(res, 200, employee)
}

export const changeProfilePic = async (req, res, next) => {

    const body = req.body

    const { id } = req.params



    const employee = await employeeModel.findByIdAndUpdate(id, { $set: body }, { new: true })

    if (!employee) {
        return next(new CustomError("Employee not found", 400))
    }

    sendResponse(res, 200, employee)

}

export const loginToMobile = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // console.log();

        // Check if employee exists
        const employee = await employeeModel.findOne({ professionalEmail: email }).populate("designation", "designation");
        // const employee = await employeeModel.findOne({ email:email }).populate("designation","designation");
        console.log(employee?.designation?.designation, "logged");

        if (!employee) {
            return next(new CustomError("Invalid credentials", 401));
        }


        const Password = await decryptData(employee?.password)

        // Check password (assuming plain text, use bcrypt in real case)
        if (Password !== password) {
            return next(new CustomError("Invalid credentials", 401));
        }

        // if (employee?.designation?.designation === 'SUPERADMIN'){

        const token = await JwtService.sign({ _id: employee._id, email: email, type: employee?.designation?.designation, branch: employee?.branch[0] || null })
        employee.password = null
        return sendResponse(res, 200, { token, employee })

        // }

        //     // Check branch count
        //     if (employee.branch.length > 1) {
        //        console.log("hyyyy");

        //   let  populateBranches = await employeeModel.findOne({ professionalEmail:email }).populate("branch","name")
        // //   let  populateBranches = await employeeModel.findOne({ email:email }).populate("branch","name")

        //         // res.cookie("professionalEmail", employee.professionalEmail, { httpOnly: true });
        //         // res.cookie("employeeId", employee._id.toString(), { httpOnly: true });
        //         return sendResponse(res, 200, {
        //             isMultipleBranch: true,
        //             branches: populateBranches.branch,
        //         });
        //     }

        //     // Generate token for single branch


        //     const token = await JwtService.sign({ _id: employee._id, email:email, type: employee?.designation?.designation, branch: employee?.branch[0] })


        //     employee.password=null
        //     return sendResponse(res, 200, { token, employee })
    } catch (error) {
        next(error);
    }
};


