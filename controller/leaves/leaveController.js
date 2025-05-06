import moment from "moment-timezone";
import transport from "../../config/nodemailer.js";
import employeeModel from "../../model/employeeModel.js";
import leavesModel from "../../model/leavesModel.js";
import CustomError from "../../utils/customError.js";
import { leaveApprovel, leaveReject } from "../../utils/emailTemplate.js";
import sendResponse from "../../utils/sendResponse.js";
import { loadEnv } from "../../config/envConfig.js";


loadEnv()



export const createLeave = async (req, res, next) => {
    const { employee, leaveType, startDate, endDate, duration, reason, supporingDoc } = req.body;

    // Check if a leave with the same employee and dates already exists
    let exists = await leavesModel.findOne({
        employee,
        startDate,
        // endDate
    });

    if (exists) {
        return next(new CustomError("Leave already exists for this employee and date range", 400));
    }

    const newLeave = await leavesModel.create(req.body);
    sendResponse(res, 200, newLeave);
};

// Get all leaves with search by name and pagination
// export const getAllLeaves = async (req, res, next) => {
//     // const { name, page = 1, limit = 10 } = req.query;
//     const {type,branch} = req.user

//     const { name, status, page = 1, limit = 10 } = req.query;


//  let employeeIds = [];
//     if (name) {
//         const employees = await employeeModel.find({
//             $or: [
//                 { firstName: { $regex: name, $options: 'i' } },
//                 { lastName: { $regex: name, $options: 'i' } }
//             ]
//         });      
//           console.log(employees,"mbo");
        
//         if (employees.length === 0) {
//            employeeIds = [];
//         }
//         employeeIds = employees.map(employee => employee._id);
//     }

//     const query = {};
//     if (employeeIds.length > 0) {
//         query.employee = { $in: employeeIds };
//     }
   
//     // const query = {};
//     // if (name) {
//     //     query.employee = { $regex: name, $options: 'i' }; // Assuming employee has a name field
//     // }
//     if (status) {
//         query.leaveStatus = { $regex: status, $options: 'i' }; // Case-insensitive search for status
//     }

//     console.log(query,"query");
    

//         const leaves = await leavesModel.find(query)
//             .populate('employee') 
//             .skip((page - 1) * limit)
//             .limit(Number(limit));

//         const total = await leavesModel.countDocuments(query);
//         const totalPages = Math.ceil(total / limit);

//         sendResponse(res, 200, {
//             data: leaves,
//             pagination: {
//                 page,
//                 limit,
//                 total,
//                 totalPages
//             }
//         });
    
// };


// export const getAllLeaves = async (req, res, next) => {
//     const { type, branch } = req.user;
//     const { name, status, page = 1, limit = 10 } = req.query;

//     let query = {};
//     let employeeIds = [];

//     // Step 1: Filter by name if provided
//     if (name) {
//         const nameFilter = {
//             $or: [
//                 { firstName: { $regex: name, $options: 'i' } },
//                 { lastName: { $regex: name, $options: 'i' } }
//             ]
//         };

//         // Apply branch filter for HR while searching by name
//         if (type === 'HR') {
//             nameFilter.branch = branch;
//         }

//         const employees = (await employeeModel.find(nameFilter))
//         .populate("branch")
//         .populate("designation");
//         employeeIds = employees.map(emp => emp._id);

//         // If no matching employees found, return empty result
//         if (employeeIds.length === 0) {
//             return sendResponse(res, 200, {
//                 data: [],
//                 pagination: {
//                     page,
//                     limit,
//                     total: 0,
//                     totalPages: 0
//                 }
//             });
//         }

//         query.employee = { $in: employeeIds };
//     }

//     // Step 2: If type is HR and no name filter applied
//     if (type === 'HR' && !name) {
//         const employees = await employeeModel.find({ branch: branch });
//         employeeIds = employees.map(emp => emp._id);

//         query.employee = { $in: employeeIds };
//     }

//     // Step 3: Status filter if provided
//     if (status) {
//         query.leaveStatus = { $regex: status, $options: 'i' };
//     }

//         const leaves = await leavesModel.find(query)
//             .populate('employee')
//             .skip((page - 1) * limit)
//             .limit(Number(limit));

//         const total = await leavesModel.countDocuments(query);
//         const totalPages = Math.ceil(total / limit);

//         sendResponse(res, 200, {
//             data: leaves,
//             pagination: {
//                 page: Number(page),
//                 limit: Number(limit),
//                 total,
//                 totalPages
//             }
//         });
   
// };

export const getAllLeaves = async (req, res, next) => {
        const { type, branch } = req.user;
        const { name, status, page = 1, limit = 10 } = req.query;

        let query = {};
        let employeeQuery = { isDeleted: false };

        // 👤 If user is HR, restrict to their branch
        if (type === "HR") {
            employeeQuery.branch = branch;
        }

        // 🔍 Filter by employee name if provided
        if (name) {
            employeeQuery.$or = [
                { firstName: { $regex: name, $options: "i" } },
                { lastName: { $regex: name, $options: "i" } }
            ];
        }

        // 📦 Get relevant employees
        const employees = await employeeModel.find(employeeQuery).select("_id");
        const employeeIds = employees.map(emp => emp._id);

        if (employeeIds.length > 0) {
            query.employee = { $in: employeeIds };
        } else if (name) {
            // name is provided, but no employee matched => return empty
            return sendResponse(res, 200, {
                data: [],
                pagination: {
                    page,
                    limit,
                    total: 0,
                    totalPages: 0
                }
            });
        }

        // 🏷️ Filter by leave status if provided
        if (status) {
            query.leaveStatus = { $regex: status, $options: "i" };
        }

        // 📥 Fetch leaves with population
        const leaves = await leavesModel.find(query)
            .populate({
                path: "employee",
                populate: [
                    { path: "branch" },
                    { path: "designation" }
                ]
            })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await leavesModel.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        sendResponse(res, 200, {
            data: leaves,
            pagination: {
                currentPage: Number(page),
                limit: Number(limit),
                total,
                totalPages
            }
        });

    
};



// Get a single leave by ID
export const getLeaveById = async (req, res, next) => {
    const { id } = req.params;

        const leave = await leavesModel.findById(id)
        // .populate('employee'); 
        .populate({
            path: "employee",
            populate: [
                { path: "branch" },
                { path: "designation" }
            ]
        })
        if (!leave) {
            return next(new CustomError("Leave not found", 404));
        }

        sendResponse(res, 200, leave);
   
};


// Update a leave by ID
export const updateLeave = async (req, res, next) => {

    const {_id} = req.user
    const { id } = req.params;
    const updateData = req.body;
    
 
        // Check if the leave exists
        const leave = await leavesModel.findById(id).populate('employee');
        if (!leave) {
            return next(new CustomError("Leave not found", 404));
        }

        // Check if the updated leave conflicts with existing leaves
        let exists = await leavesModel.findOne({
            _id: { $ne: id }, // Exclude the current leave being updated
            employee: updateData.employee,
            startDate: updateData.startDate,
            endDate: updateData.endDate
        });

        if (exists) {
            return next(new CustomError("Leave already exists for this employee and date range", 400));
        }


           // Step 2: Detect status change
           const prevStatus = leave?.leaveStatus;
           const newStatus = updateData?.leaveStatus;
           const employeeEmail = exists?.employee?.professionalEmail;
        //    const employeeEmail = exists?.employee?.email;
        //    const employeeEmail = 'iamvyshnav99@gmail.com';

          

        // Update the leave
        const updatedLeave = await leavesModel.findByIdAndUpdate(id, updateData, { new: true }).populate("decisionMadeBy");

        
        if (
            prevStatus !== newStatus &&
            (newStatus === "APPROVED" || newStatus === "REJECTED")
        ){

            const formattedStartDate = moment(updateData?.startDate).format("D - MM - YYYY");
            const formattedEndDate = moment(updateData?.endDate).format("D - MM - YYYY");
            const officer = await employeeModel.findById(_id).populate("designation")

            await transport.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: employeeEmail,
            headers: `From: ${process.env.NODEMAILER_EMAIL}`,
            subject: `Your Leave Request has been ${newStatus}`,
            html:
            
            newStatus === "APPROVED"
            ? 
            leaveApprovel({
                employeename: leave?.employee?.firstName,
                startDate: formattedStartDate,
                endDate: formattedEndDate,
                Officername: officer?.firstName,
                officerDesignation: officer?.designation?.designation
              })
            // leaveApprovel(leave?.employee?.firstName,formattedStartDate,formattedEndDate,officer?.firstName,officer?.designation?.designation)
            : 
            leaveReject({
                employeename: leave?.employee?.firstName,
                startDate: formattedStartDate,
                // endDate: formattedEndDate,
                Officername: officer?.firstName,
                officerDesignation: officer?.designation?.designation
              })
            // leaveReject(leave?.employee?.firstName,formattedStartDate,officer?.firstName,officer?.designation?.designation),
        });

        }

        sendResponse(res, 200, updatedLeave);



    
};


// Delete a leave by ID
export const deleteLeave = async (req, res, next) => {
    const { id } = req.params;

        // Check if the leave exists
        const leave = await leavesModel.findById(id);
        if (!leave) {
            return next(new CustomError("Leave not found", 404));
        }

        // Delete the leave
        await leavesModel.findByIdAndDelete(id);
        sendResponse(res, 200, { message: "Leave deleted successfully" });
    
};