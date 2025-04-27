import attendanceModel from "../../model/attendenceModel.js"
import employeeModel from "../../model/employeeModel.js";
import holidayModel from "../../model/holidayModel.js";
import CustomError from "../../utils/customError.js";
import sendResponse from "../../utils/sendResponse.js";
import moment from "moment-timezone";
import mongoose from "mongoose";






export const createAttendance = async (req, res, next) => {
        const { employee, checkIn } = req.body;

        // Parse the check-in time in IST and construct the full date
        const now = moment().tz("Asia/Kolkata");
        console.log(now,"now");
        
        const checkInIST = moment.tz(`${now.format("YYYY-MM-DD")} ${checkIn}`, "Asia/Kolkata").toDate();
        
        console.log(checkInIST,"checkInIST");

        // Standard check-in time: 9:00 AM IST
        const standardCheckIn = moment.tz(`${now.format("YYYY-MM-DD")} 09:00`, "Asia/Kolkata").toDate();


        console.log(standardCheckIn,"standardCheckIn");

        // Determine attendance status
        const status = checkInIST <= standardCheckIn ? "ONTIME" : "LATE";

        // Save the initial attendance record
        const newAttendance = await attendanceModel.create({
            employee,
            checkIn: checkInIST,
            status
        });

        sendResponse(res,200,newAttendance)
        // res.status(201).json(newAttendance);
   
};





// export const getAllAttendance = async (req, res, next) => {
//         const { name, status, page = 1, limit = 10 } = req.query;
//         const query = {};

//         // Get today's date in IST
//         const today = moment().tz("Asia/Kolkata").startOf("day").toDate();
//         const tomorrow = moment().tz("Asia/Kolkata").endOf("day").toDate();

//         // Filter attendance for today only
//         query.checkIn = { $gte: today, $lte: tomorrow };

//         // Search by employee name
//         if (name) {
//             const employees = await employeeModel.find({
//                 $or: [
//                     { firstName: { $regex: name, $options: "i" } },
//                     { lastName: { $regex: name, $options: "i" } },
//                 ],
//             });

//             const employeeIds = employees.map((employee) => employee._id);
//             if (employeeIds.length > 0) {
//                 query.employee = { $in: employeeIds };
//             } else {
//                 query.employee = null; // No matching employee
//             }
//         }

//         // Filter by status (ONTIME/LATE)
//         if (status) {
//             query.status = status.toUpperCase();
//         }

//         // Pagination settings
//         const pageNumber = parseInt(page);
//         const pageSize = parseInt(limit);
//         const skip = (pageNumber - 1) * pageSize;

//         // Fetch attendance records with filtering and pagination
//         const attendanceRecords = await attendanceModel
//             .find(query)
//             .populate("employee")
//             .skip(skip)
//             .limit(pageSize);

//         // Total count for pagination
//         const totalRecords = await attendanceModel.countDocuments(query);
//         const totalPages = Math.ceil(totalRecords / pageSize);

//         res.status(200).json({
//             data: attendanceRecords,
//             totalRecords,
//             totalPages,
//             currentPage: pageNumber,
//         });
    
// };


export const getAllAttendance = async (req, res, next) => {
    const { type, branch } = req.user;
    const { name, status, page = 1, limit = 10 } = req.query;

    console.log(name,"ban");
    

    const query = {};

    // Get today's date in IST
    const today = moment().tz("Asia/Kolkata").startOf("day").toDate();
    const tomorrow = moment().tz("Asia/Kolkata").endOf("day").toDate();
    query.createdAt = { $gte: today, $lte: tomorrow };

    // Build employee query
    const employeeQuery = {
        isDeleted: false,
    };

    // HR should only see employees in their branch
    if (type === 'HR' && branch) {
        employeeQuery.branch = branch;
    }

    // Filter by employee name
    if (name) {
        employeeQuery.$or = [
            { firstName: { $regex: name, $options: "i" } },
            { lastName: { $regex: name, $options: "i" } },
        ];
    }

    // Get employees matching the filters
    const employees = await employeeModel.find(employeeQuery);
    const employeeIds = employees.map(emp => emp._id);

    if (employeeIds.length > 0) {
        query.employee = { $in: employeeIds };
    } else {
        query.employee = null; // Ensures no records are returned
    }

    // Filter by attendance status
    if (status) {
        query.status = status.toUpperCase();
    }

    // Pagination
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;
     
    console.log(query,"att");
    
    // Fetch attendance records
    const attendanceRecords = await attendanceModel
        .find(query)
        // .populate("employee")
        .populate({
            path: 'employee',
            select: 'profileImg firstName lastName designation employeeType',
            populate: {
                path: 'designation',
                model: 'designation',
            },
        })
        .skip(skip)
        .limit(pageSize);

    const totalRecords = await attendanceModel.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / pageSize);

    res.status(200).json({
        data: attendanceRecords,
        totalRecords,
        totalPages,
        currentPage: pageNumber,
    });
};


export const getAttendanceById = async (req, res, next) => {
    const { id } = req.params;

        const attendance = await attendanceModel.findById(id).populate('employee');
        if (!attendance) {
            return next(new CustomError("Attendance record not found", 404));
        }
        sendResponse(res, 200, attendance);
    
};

// export const updateAttendance = async (req, res, next) => {
//     const { id } = req.params;
//     const updateData = req.body;

//         const attendance = await attendanceModel.findById(id);
//         if (!attendance) {
//             return next(new CustomError("Attendance record not found", 404));
//         }

//         // Ensure checkIn and checkOut are in Indian Standard Time (IST)
//         if (updateData.checkIn) {
//             const checkInIST = new Date(updateData.checkIn).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
//             updateData.checkIn = new Date(checkInIST);
//         }

//         if (updateData.checkOut) {
//             const checkOutIST = new Date(updateData.checkOut).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
//             updateData.checkOut = new Date(checkOutIST);
//         }

//         const updatedAttendance = await attendanceModel.findByIdAndUpdate(id, updateData, { new: true });
//         sendResponse(res, 200, updatedAttendance);
    
// };


export const updateAttendance = async (req, res, next) => {
    const { id } = req.params;
    const updateData = req.body;

    const attendance = await attendanceModel.findById(id);
    if (!attendance) {
        return next(new CustomError("Attendance record not found", 404));
    }

    const now = moment().tz("Asia/Kolkata");

    // Ensure checkIn and checkOut are in IST
    if (updateData.checkIn) {
        // Append today's date to the given check-in time
        const checkInIST = moment.tz(`${now.format("YYYY-MM-DD")} ${updateData.checkIn}`, "Asia/Kolkata");

        if (!checkInIST.isValid()) {
            return next(new CustomError("Invalid check-in date format", 400));
        }

        updateData.checkIn = checkInIST.toDate();
    }

    if (updateData.checkOut) {
        // Append today's date to the given check-out time
        const checkOutIST = moment.tz(`${now.format("YYYY-MM-DD")} ${updateData.checkOut}`, "Asia/Kolkata");

        if (!checkOutIST.isValid()) {
            return next(new CustomError("Invalid check-out date format", 400));
        }

        updateData.checkOut = checkOutIST.toDate();
    }

    // Define standard check-in time for ONTIME/LATE status
    const standardCheckIn = moment.tz(`${now.format("YYYY-MM-DD")} 09:00`, "Asia/Kolkata").toDate();
    if (updateData.checkIn) {
        updateData.status = updateData.checkIn <= standardCheckIn ? "ONTIME" : "LATE";
    }

    const updatedAttendance = await attendanceModel.findByIdAndUpdate(id, updateData, { new: true });

    sendResponse(res, 200, updatedAttendance);
};




export const deleteAttendance = async (req, res, next) => {
    const { id } = req.params;

        const attendance = await attendanceModel.findById(id);
        if (!attendance) {
            return next(new CustomError("Attendance record not found", 404));
        }

        await attendanceModel.findByIdAndDelete(id);
        sendResponse(res, 200, { message: "Attendance record deleted successfully" });
   
};

// export const calculateMonthlyAttendance = async (req, res, next) => {
//     const { year, month } = req.query; // month is 0-11 for Jan-Dec

//         // Calculate total days in the month
//         const totalDays = new Date(year, month + 1, 0).getDate();

//         // Calculate number of Sundays in the month
//         let sundays = 0;
//         for (let day = 1; day <= totalDays; day++) {
//             const date = new Date(year, month, day);
//             if (date.getDay() === 0) { // 0 represents Sunday
//                 sundays++;
//             }
//         }

//         // Get holidays in the month
//         const holidays = await holidayModel.find({
//             holidayDate: {
//                 $gte: new Date(year, month, 1),
//                 $lte: new Date(year, month + 1, 0)
//             }
//         });

//         const holidayCount = holidays.length;

//         // Calculate total working days
//         const totalWorkingDays = totalDays - sundays - holidayCount;

//         // Get attendance records for the month
//         const attendanceRecords = await attendanceModel.find({
//             checkIn: {
//                 $gte: new Date(year, month, 1),
//                 $lte: new Date(year, month + 1, 0)
//             }
//         });

//         // Calculate attendance statistics
//         let totalPresent = 0;
//         let totalAbsent = 0;
//         let totalLate = 0;
//         let totalHalfDay = 0;

//         attendanceRecords.forEach(record => {
//             switch (record.status) {
//                 case 'ONTIME':
//                     totalPresent++;
//                     break;
//                 case 'LATE':
//                     totalLate++;
//                     break;
//                 case 'ABSENT':
//                     totalAbsent++;
//                     break;
//                 case 'HALFDAY':
//                     totalHalfDay++;
//                     break;
//             }
//         });

//         const monthlyAttendance = {
//             year,
//             month,
//             totalDays,
//             sundays,
//             holidayCount,
//             totalWorkingDays,
//             totalPresent,
//             totalAbsent,
//             totalLate,
//             totalHalfDay
//         };

//         sendResponse(res, 200, monthlyAttendance);
    
// };


// export const calculateMonthlyAttendance = async (req, res) => {
//         const { month, year, name } = req.query;

//         if (!month || !year) {
//             return res.status(400).json({ message: "Month and year are required", success: false });
//         }

//         const startDate = moment(`${year}-${month}-01`).startOf("month");
//         const endDate = moment(startDate).endOf("month");

//         // Get all holidays in the month
//         const holidays = await holidayModel.find({
//             holidayDate: { $gte: startDate.toDate(), $lte: endDate.toDate() }
//         }).select("holidayDate");

//         // Convert holiday dates to an array
//         const holidayDates = holidays.map(h => moment(h.holidayDate).format("YYYY-MM-DD"));

//         // Generate all valid working days (excluding Sundays and holidays)
//         let totalWorkingDays = 0;
//         for (let date = moment(startDate); date.isBefore(endDate) || date.isSame(endDate); date.add(1, "days")) {
//             if (date.day() !== 0 && !holidayDates.includes(date.format("YYYY-MM-DD"))) { 
//                 totalWorkingDays++;
//             }
//         }

//         // Get employee IDs if a search by name is provided
//         let employeeIds = [];
//         if (name) {
//             const employees = await employeeModel.find({
//                 $or: [
//                     { firstName: { $regex: name, $options: "i" } },
//                     { lastName: { $regex: name, $options: "i" } }
//                 ]
//             }).select("_id");

//             employeeIds = employees.map(emp => emp._id);
//         }

//         // Query attendance records within the month
//         const matchCondition = {
//             checkIn: { $gte: startDate.toDate(), $lte: endDate.toDate() }
//         };
//         if (employeeIds.length > 0) {
//             matchCondition.employee = { $in: employeeIds };
//         }

//         const attendanceRecords = await attendanceModel.aggregate([
//             { $match: matchCondition },
//             { 
//                 $group: { 
//                     _id: "$employee", 
//                     workedDays: { $sum: 1 } 
//                 } 
//             },
//             {
//                 $lookup: {
//                     from: "employees",
//                     localField: "_id",
//                     foreignField: "_id",
//                     as: "employeeDetails"
//                 }
//             },
//             { $unwind: "$employeeDetails" },
//             { 
//                 $project: { 
//                     _id: 0, 
//                     employeeId: "$_id",
//                     firstName: "$employeeDetails.firstName",
//                     lastName: "$employeeDetails.lastName",
//                     workedDays: 1,
//                     totalWorkingDays: totalWorkingDays
//                 } 
//             }
//         ]);


//         sendResponse(res,200,attendanceRecords)
//         // return res.status(200).json({ success: true, data: attendanceRecords });

    
// };


// export const calculateMonthlyAttendance = async (req, res) => {
//     try {
//         const { name, month, year, page = 1, limit = 10 } = req.query;

//         // Validate month and year
//         if (!month || !year) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Month and year are required.",
//             });
//         }

//         const startDate = moment(`${year}-${month}-01`).startOf("month");
//         const endDate = moment(startDate).endOf("month");

//         // Find holidays within the month
//         const holidays = await holidayModel.find({
//             holidayDate: { $gte: startDate.toDate(), $lte: endDate.toDate() },
//         }).select("holidayDate -_id");

//         const holidayDates = holidays.map((h) => moment(h.holidayDate).format("YYYY-MM-DD"));

//         // Calculate total working days (excluding Sundays & holidays)
//         let totalWorkingDays = 0;
//         let currentDate = startDate.clone();
//         while (currentDate.isSameOrBefore(endDate)) {
//             if (currentDate.day() !== 0 && !holidayDates.includes(currentDate.format("YYYY-MM-DD"))) {
//                 totalWorkingDays++;
//             }
//             currentDate.add(1, "day");
//         }

//         let employeeFilter = {};
//         if (name) {
//             const employees = await employeeModel.find({
//                 $or: [
//                     { firstName: { $regex: name, $options: "i" } },
//                     { lastName: { $regex: name, $options: "i" } },
//                 ],
//             }).select("_id");

//             const employeeIds = employees.map((emp) => emp._id);
//             if (employeeIds.length === 0) {
//                 return res.json({ success: true, employees: [], totalWorkingDays });
//             }

//             employeeFilter = { employee: { $in: employeeIds } };
//         }
//        console.log(employeeFilter,"name");
       
//         // Aggregate total worked days for employees (excluding ABSENT status)
//         const employees = await employeeModel.aggregate([
//             {
//                 $lookup: {
//                     from: "attendences",
//                     localField: "_id",
//                     foreignField: "employee",
//                     as: "attendance",
//                 },
//             },
//             {
//                 $match: employeeFilter,
//             },
//             {
//                 $project: {
//                     _id: 1,
//                     firstName: 1,
//                     lastName: 1,
//                     totalWorkedDays: {
//                         $size: {
//                             $filter: {
//                                 input: "$attendance",
//                                 as: "att",
//                                 cond: {
//                                     $and: [
//                                         { $gte: ["$$att.checkIn", startDate.toDate()] },
//                                         { $lte: ["$$att.checkIn", endDate.toDate()] },
//                                         { $ne: ["$$att.status", "ABSENT"] },
//                                     ],
//                                 },
//                             },
//                         },
//                     },
//                 },
//             },
//             {
//                 $skip: (page - 1) * limit,
//             },
//             {
//                 $limit: parseInt(limit),
//             },
//         ]);

//         return res.json({
//             success: true,
//             totalWorkingDays,
//             employees,
//             pagination: {
//                 currentPage: Number(page),
//                 totalPages: Math.ceil(employees.length / limit),
//             },
//         });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ success: false, message: "Server error." });
//     }
// }

// export const calculateMonthlyAttendance = async (req, res) => {
//     try {
//         const { name, month, year, page = 1, limit = 10 } = req.query;

//         let employeeIds = [];

//         // Search employees by name
//         if (name) {
//             const employees = await employeeModel.find({
//                 $or: [
//                     { firstName: { $regex: name, $options: "i" } },
//                     { lastName: { $regex: name, $options: "i" } }
//                 ]
//             });

//             employeeIds = employees.map((employee) => employee._id);
//             if (employeeIds.length === 0) {
//                 return res.status(404).json({
//                     success: false,
//                     message: "No employees found with the given name."
//                 });
//             }
//         }

//         // Get total working days (excluding Sundays & holidays)
//         const firstDay = moment.tz(`${year}-${month}-01`, "Asia/Kolkata");
//         const lastDay = firstDay.clone().endOf("month");

//         // Get all Sundays
//         let totalWorkingDays = 0;
//         for (let day = firstDay.clone(); day.isBefore(lastDay); day.add(1, "day")) {
//             if (day.isoWeekday() !== 7) { // Skip Sundays (isoWeekday 7 = Sunday)
//                 totalWorkingDays++;
//             }
//         }

//         // Get holidays in the given month
//         const holidays = await holidayModel.find({
//             holidayDate: {
//                 $gte: firstDay.toDate(),
//                 $lte: lastDay.toDate()
//             }
//         });

//         totalWorkingDays -= holidays.length;

//         // Build query
//         const query = {
//             checkIn: { $gte: firstDay.toDate(), $lte: lastDay.toDate() },
//             status: { $ne: "ABSENT" } // Exclude ABSENT records
//         };

//         if (employeeIds.length > 0) {
//             query.employee = { $in: employeeIds };
//         }

//         // Fetch attendance records with pagination
//         const skip = (page - 1) * limit;
//         const attendanceRecords = await attendanceModel
//             .find(query)
//             .populate("employee", "firstName lastName")
//             .skip(skip)
//             .limit(parseInt(limit));

//         // Count total records
//         const totalRecords = await attendanceModel.countDocuments(query);

//         res.json({
//             success: true,
//             totalWorkingDays,
//             totalWorkedDays: attendanceRecords.length,
//             employees: attendanceRecords,
//             pagination: {
//                 currentPage: Number(page),
//                 totalPages: Math.ceil(totalRecords / limit),
//                 totalRecords
//             }
//         });
//     } catch (error) {
//         console.error("Error fetching attendance:", error);
//         res.status(500).json({
//             success: false,
//             message: "Server Error"
//         });
//     }
// };





// export const calculateMonthlyAttendance = async (req, res) => {
//     try {
//         const { month, year, search, page = 1, limit = 10 } = req.query;

//         const startDate = moment(`${year}-${month}-01`).startOf("month");
//         const endDate = moment(startDate).endOf("month");

//         // Get holidays in the selected month
//         const holidays = await holidayModel.find({
//             holidayDate: { $gte: startDate.toDate(), $lte: endDate.toDate() }
//         }).countDocuments();

//         // Calculate total working days (Excluding Sundays and Holidays)
//         const totalDaysInMonth = endDate.date();
//         const totalSundays = Array.from({ length: totalDaysInMonth }, (_, i) =>
//             moment(startDate).add(i, "days").day()
//         ).filter(day => day === 0).length;

//         const totalWorkingDays = totalDaysInMonth - (totalSundays + holidays);

//         // Build search query
//         let employeeQuery = {};
//         if (search) {
//             employeeQuery = {
//                 $or: [
//                     { firstName: { $regex: search, $options: "i" } },
//                     { lastName: { $regex: search, $options: "i" } }
//                 ]
//             };
//         }

//         // Get all employees matching search
//         const employees = await employeeModel.find(employeeQuery, "_id firstName lastName");

//         console.log(employees,"emploo");
        
//         // Get attendance records excluding "ABSENT" status
//         const attendanceRecords = await attendanceModel.aggregate([
//             {
//                 $match: {
//                     checkIn: { $gte: startDate.toDate(), $lte: endDate.toDate() },
//                     status: { $ne: "ABSENT" }
//                 }
//             },
//             {
//                 $group: {
//                     _id: "$employee",
//                     totalWorkedDays: { $sum: 1 }
//                 }
//             }
//         ]);

//         // Map attendance to employees
//         const employeesWithWorkedDays = employees.map(emp => {
//             const attendance = attendanceRecords.find(att => String(att._id) === String(emp._id));
//             return {
//                 _id: emp._id,
//                 firstName: emp.firstName,
//                 lastName: emp.lastName,
//                 totalWorkedDays: attendance ? attendance.totalWorkedDays : 0
//             };
//         });

//         // Apply Pagination
//         const startIndex = (page - 1) * limit;
//         const paginatedEmployees = employeesWithWorkedDays.slice(startIndex, startIndex + limit);

//         res.status(200).json({
//             success: true,
//             totalWorkingDays,
//             employees: paginatedEmployees,
//             pagination: {
//                 currentPage: Number(page),
//                 totalPages: Math.ceil(employeesWithWorkedDays.length / limit)
//             }
//         });

//     } catch (error) {
//         console.error("Error fetching employee worked days:", error);
//         res.status(500).json({ success: false, message: "Internal Server Error" });
//     }
// };



// export const calculateMonthlyAttendance = async (req, res) => {
//     try {
//         const { month, year, search, page = 1, limit = 10 } = req.query;
//         const startDate = moment(`${year}-${month}-01`).startOf("month");
//         const endDate = moment(startDate).endOf("month");

//         // Get holidays in the selected month
//         const holidays = await holidayModel.countDocuments({
//             holidayDate: { $gte: startDate.toDate(), $lte: endDate.toDate() }
//         });

//         // Calculate total working days (Excluding Sundays and Holidays)
//         const totalDaysInMonth = endDate.date();
//         const totalSundays = Array.from({ length: totalDaysInMonth }, (_, i) =>
//             moment(startDate).add(i, "days").day()
//         ).filter(day => day === 0).length;
//         const totalWorkingDays = totalDaysInMonth - (totalSundays + holidays);

//         // Build search query for employees
//         let employeeQuery = {};
//         if (search) {
//             employeeQuery = {
//                 $or: [
//                     { firstName: { $regex: search, $options: "i" } },
//                     { lastName: { $regex: search, $options: "i" } }
//                 ]
//             };
//         }

//         // Get all employees matching search and count total records
//         const totalRecords = await employeeModel.countDocuments(employeeQuery);
//         const employees = await employeeModel.find(employeeQuery, "_id firstName lastName")
//             .skip((page - 1) * limit)
//             .limit(Number(limit));

//         // Get attendance records excluding "ABSENT" status
//         const attendanceRecords = await attendanceModel.aggregate([
//             {
//                 $match: {
//                     checkIn: { $gte: startDate.toDate(), $lte: endDate.toDate() },
//                     status: { $ne: "ABSENT" }
//                 }
//             },
//             {
//                 $group: {
//                     _id: "$employee",
//                     totalWorkedDays: { $sum: 1 }
//                 }
//             }
//         ]);

//         // Map attendance to employees
//         const employeesWithWorkedDays = employees.map(emp => {
//             const attendance = attendanceRecords.find(att => String(att._id) === String(emp._id));
//             return {
//                 _id: emp._id,
//                 firstName: emp.firstName,
//                 lastName: emp.lastName,
//                 totalWorkedDays: attendance ? attendance.totalWorkedDays : 0
//             };
//         });

//         res.status(200).json({
//             success: true,
//             totalWorkingDays,
//             employees: employeesWithWorkedDays,
//             pagination: {
//                 currentPage: Number(page),
//                 totalPages: Math.ceil(totalRecords / limit),
//                 totalRecords
//             }
//         });

//     } catch (error) {
//         console.error("Error fetching employee worked days:", error);
//         res.status(500).json({ success: false, message: "Internal Server Error" });
//     }
// };

// export const calculateMonthlyAttendance = async (req, res) => {
//     try {
//         const { type, branch: userBranchId } = req.user;
//         const { month, year, search, page = 1, limit = 10 } = req.query;

//         const startDate = moment(`${year}-${month}-01`).startOf("month");
//         const endDate = moment(startDate).endOf("month");

//         // Get holidays in the selected month
//         const holidays = await holidayModel.countDocuments({
//             holidayDate: { $gte: startDate.toDate(), $lte: endDate.toDate() }
//         });

//         // Calculate total working days (Excluding Sundays and Holidays)
//         const totalDaysInMonth = endDate.date();
//         const totalSundays = Array.from({ length: totalDaysInMonth }, (_, i) =>
//             moment(startDate).add(i, "days").day()
//         ).filter(day => day === 0).length;

//         const totalWorkingDays = totalDaysInMonth - (totalSundays + holidays);

//         // Build employee search query
//         let employeeQuery = {};

//         if (search) {
//             employeeQuery.$or = [
//                 { firstName: { $regex: search, $options: "i" } },
//                 { lastName: { $regex: search, $options: "i" } }
//             ];
//         }

//         // If user is HR, filter by their branch
//         if (type === "HR" && userBranchId) {
//             employeeQuery.branch = userBranchId;
//         }

//         // Get total matching employees
//         const totalRecords = await employeeModel.countDocuments(employeeQuery);

//         const employees = await employeeModel.find(employeeQuery, "_id firstName lastName")
//             .skip((page - 1) * limit)
//             .limit(Number(limit));

//         // Get attendance records excluding "ABSENT"
//         // const attendanceRecords = await attendanceModel.aggregate([
//         //     {
//         //         $match: {
//         //             checkIn: { $gte: startDate.toDate(), $lte: endDate.toDate() },
//         //             status: { $ne: "ABSENT" }
//         //         }
//         //     },
//         //     {
//         //         $group: {
//         //             _id: "$employee",
//         //             totalWorkedDays: { $sum: 1 }
//         //         }
//         //     }
//         // ]);

//         // Get attendance records including ABSENT and others
// const attendanceRecords = await attendanceModel.aggregate([
//     {
//       $match: {
//         checkIn: { $gte: startDate.toDate(), $lte: endDate.toDate() }
//       }
//     },
//     {
//       $group: {
//         _id: "$employee",
//         totalWorkedDays: {
//           $sum: {
//             $cond: [{ $ne: ["$status", "ABSENT"] }, 1, 0]
//           }
//         },
//         totalAbsentDays: {
//           $sum: {
//             $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0]
//           }
//         }
//       }
//     }
//   ]);
  

//         // Map attendance to employees
//         const employeesWithAttendance = employees.map(emp => {
//             const attendance = attendanceRecords.find(att => String(att._id) === String(emp._id));
//             return {
//               _id: emp._id,
//               firstName: emp.firstName,
//               lastName: emp.lastName,
//               totalWorkedDays: attendance ? attendance.totalWorkedDays : 0,
//               totalAbsentDays: attendance ? attendance.totalAbsentDays : 0
//             };
//           });
          

//         res.status(200).json({
//             success: true,
//             totalWorkingDays,
//             employees: employeesWithAttendance,
//             pagination: {
//                 currentPage: Number(page),
//                 totalPages: Math.ceil(totalRecords / limit),
//                 totalRecords
//             }
//         });

//     } catch (error) {
//         console.error("Error fetching employee worked days:", error);
//         res.status(500).json({ success: false, message: "Internal Server Error" });
//     }
// };


// export const calculateMonthlyAttendance = async (req, res) => {
//     try {
//         const { type, branch: userBranchId } = req.user;
//         let { month, year, search, page = 1, limit = 10 } = req.query;
//         console.log("hheheh");
        
//         // Use current year and month if not provided
//         const currentDate = moment();
//         year = year || currentDate.year();
//         month = month || currentDate.month() + 1; // month is 0-indexed in moment

//         const startDate = moment(`${year}-${month}-01`).startOf("month");
//         const endDate = moment(startDate).endOf("month");
//         console.log(startDate,endDate,"foomb");
        

//         // Count holidays
//         const holidays = await holidayModel.countDocuments({
//             holidayDate: { $gte: startDate.toDate(), $lte: endDate.toDate() }
//         });

//         // Count Sundays
//         const totalDaysInMonth = endDate.date();
//         const totalSundays = Array.from({ length: totalDaysInMonth }, (_, i) =>
//             moment(startDate).add(i, "days").day()
//         ).filter(day => day === 0).length;

//         const totalWorkingDays = totalDaysInMonth - (totalSundays + holidays);

//         // Search filter
//         let employeeQuery = {isDeleted:false};
//         if (search) {
//             employeeQuery.$or = [
//                 { firstName: { $regex: search, $options: "i" } },
//                 { lastName: { $regex: search, $options: "i" } }
//             ];
//         }

//         // HR filter by branch
//         if (type === "HR" && userBranchId) {
//             employeeQuery.branch = userBranchId;
//         }

//         const totalRecords = await employeeModel.countDocuments(employeeQuery);

//         const employees = await employeeModel.find(employeeQuery, "_id firstName lastName profileImg")
//             .skip((page - 1) * limit)
//             .limit(Number(limit));

//         // Attendance with worked & absent days
//         const attendanceRecords = await attendanceModel.aggregate([
//             {
//                 $match: {
//                     checkIn: { $gte: startDate.toDate(), $lte: endDate.toDate() }
//                 }
//             },
//             {
//                 $group: {
//                     _id: "$employee",
//                     totalWorkedDays: {
//                         $sum: {
//                             $cond: [{ $ne: ["$status", "ABSENT"] }, 1, 0]
//                         }
//                     },
//                     totalAbsentDays: {
//                         $sum: {
//                             $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0]
//                         }
//                     }
//                 }
//             }
//         ]);

//         const employeesWithAttendance = employees.map(emp => {
//             const attendance = attendanceRecords.find(att => String(att._id) === String(emp._id));
//             return {
//                 _id: emp._id,
//                 firstName: emp.firstName,
//                 lastName: emp.lastName,
//                 img:emp.profileImg,
//                 totalWorkedDays: attendance ? attendance.totalWorkedDays : 0,
//                 totalAbsentDays: attendance ? attendance.totalAbsentDays : 0
//             };
//         });

//         res.status(200).json({
//             success: true,
//             totalWorkingDays,
//             employees: employeesWithAttendance,
//             pagination: {
//                 currentPage: Number(page),
//                 totalPages: Math.ceil(totalRecords / limit),
//                 totalRecords
//             }
//         });

//     } catch (error) {
//         console.error("Error fetching employee worked days:", error);
//         res.status(500).json({ success: false, message: "Internal Server Error" });
//     }
// };


export const calculateMonthlyAttendance = async (req, res) => {
    try {
        const { type, branch: userBranchId } = req.user;
        let { month, year, search, page = 1, limit = 10 } = req.query;

        const currentDate = moment();
        year = parseInt(year) || currentDate.year();
        month = parseInt(month) || currentDate.month() + 1; // moment month is 0-indexed

        const startDate = moment(`${year}-${month}-01`).startOf("month");
        const endDate = moment(startDate).endOf("month");

        const holidays = await holidayModel.countDocuments({
            holidayDate: { $gte: startDate.toDate(), $lte: endDate.toDate() }
        });

        const totalDaysInMonth = endDate.date();
        const totalSundays = Array.from({ length: totalDaysInMonth }, (_, i) =>
            moment(startDate).add(i, "days").day()
        ).filter(day => day === 0).length;

        const totalWorkingDays = totalDaysInMonth - (totalSundays + holidays);

        let employeeQuery = { isDeleted: false };
        if (search) {
            employeeQuery.$or = [
                { firstName: { $regex: search, $options: "i" } },
                { lastName: { $regex: search, $options: "i" } }
            ];
        }

        if (type === "HR" && userBranchId) {
            employeeQuery.branch = userBranchId;
        }

        const totalRecords = await employeeModel.countDocuments(employeeQuery);

        const employees = await employeeModel.find(employeeQuery, "_id firstName lastName profileImg employeeId")
            .skip((page - 1) * limit)
            .limit(Number(limit));

        // const attendanceRecords = await attendanceModel.aggregate([
        //     {
        //         $match: {
        //             checkIn: { $gte: startDate.toDate(), $lte: endDate.toDate() }
        //         }
        //     },
        //     {
        //         $group: {
        //             _id: "$employee",
        //             totalWorkedDays: {
        //                 $sum: {
        //                     $cond: [{ $ne: ["$status", "ABSENT"] }, 1, 0]
        //                 }
        //             },
        //             totalAbsentDays: {
        //                 $sum: {
        //                     $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0]
        //                 }
        //             }
        //         }
        //     }
        // ]);

        const attendanceRecords = await attendanceModel.aggregate([
            {
                $match: {
                    $or: [
                        {
                            checkIn: { $gte: startDate.toDate(), $lte: endDate.toDate() }
                        },
                        {
                            checkIn: null,
                            createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() }
                        }
                    ]
                }
            },
            {
                $group: {
                    _id: "$employee",
                    totalWorkedDays: {
                        $sum: {
                            $cond: [{ $ne: ["$status", "ABSENT"] }, 1, 0]
                        }
                    },
                    totalAbsentDays: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0]
                        }
                    }
                }
            }
        ]);
        
        const employeesWithAttendance = employees.map(emp => {
            const attendance = attendanceRecords.find(att => String(att._id) === String(emp._id));
            return {
                _id: emp?._id,
                firstName: emp?.firstName,
                lastName: emp?.lastName,
                img: emp?.profileImg,
                employeeId:emp?.employeeId,
                totalWorkedDays: attendance ? attendance?.totalWorkedDays : 0,
                totalAbsentDays: attendance ? attendance?.totalAbsentDays : 0
            };
        });

        const Data ={
            selectedMonth: startDate.format("MMMM"),
            totalWorkingDays,
            employees: employeesWithAttendance,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(totalRecords / limit),
                totalRecords
            }
        }

        res.status(200).json({
            success: true,
            data:Data
        });

    } catch (error) {
        console.error("Error fetching employee worked days:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
