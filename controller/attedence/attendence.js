import attendanceModel from "../../model/attendenceModel.js"
import employeeModel from "../../model/employeeModel.js";
import holidayModel from "../../model/holidayModel.js";
import CustomError from "../../utils/customError.js";
import sendResponse from "../../utils/sendResponse.js";
import moment from "moment-timezone";



export const createAttendance = async (req, res, next) => {
    const { employee, checkIn } = req.body;

    // Parse the check-in time in IST and construct the full date
    const now = moment().tz("Asia/Kolkata");
    console.log(now, "now");

    const checkInIST = moment.tz(`${now.format("YYYY-MM-DD")} ${checkIn}`, "Asia/Kolkata").toDate();

    console.log(checkInIST, "checkInIST");

    // Standard check-in time: 9:00 AM IST
    const standardCheckIn = moment.tz(`${now.format("YYYY-MM-DD")} 09:00`, "Asia/Kolkata").toDate();


    console.log(standardCheckIn, "standardCheckIn");

    // Determine attendance status
    const status = checkInIST <= standardCheckIn ? "ONTIME" : "LATE";

    // Save the initial attendance record
    const newAttendance = await attendanceModel.create({
        employee,
        checkIn: checkInIST,
        status
    });

    sendResponse(res, 200, newAttendance)
    // res.status(201).json(newAttendance);

};

export const createAttendanceByPhoto = async (req, res, next) => {
    const { _id } = req.user;
    const { checkIn, location } = req.body;

    // Current IST date and time
    const now = moment().tz("Asia/Kolkata");

    // Construct full check-in datetime in IST
    const checkInIST = moment.tz(`${now.format("YYYY-MM-DD")} ${checkIn}`, "Asia/Kolkata").toDate();

    // Get start and end of the current day in IST for date-based comparison
    const startOfDay = moment.tz(now.format("YYYY-MM-DD"), "Asia/Kolkata").startOf('day').toDate();
    const endOfDay = moment.tz(now.format("YYYY-MM-DD"), "Asia/Kolkata").endOf('day').toDate();

    // Check if attendance already exists for this employee today
    const existing = await attendanceModel.findOne({
        employee: _id,
        checkIn: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existing) {
        return sendResponse(res, 400, null, "Attendance already recorded for today");
    }

    // Standard check-in time: 9:00 AM IST
    const standardCheckIn = moment.tz(`${now.format("YYYY-MM-DD")} 09:00`, "Asia/Kolkata").toDate();

    // Determine status
    const status = checkInIST <= standardCheckIn ? "ONTIME" : "LATE";

    // Save attendance
    const newAttendance = await attendanceModel.create({
        employee: _id,
        checkIn: checkInIST,
        status,
        location
    });

    return sendResponse(res, 200, newAttendance, "Attendance marked successfully");


};

export const checkOutAttendance = async (req, res, next) => {
    const { _id } = req.user;
    const { checkOut, location, } = req.body;

    // Get current date in IST
    const now = moment().tz("Asia/Kolkata");

    // Parse checkout time in IST
    const checkOutIST = moment.tz(`${now.format("YYYY-MM-DD")} ${checkOut}`, "Asia/Kolkata").toDate();

    const startOfDay = moment.tz(now.format("YYYY-MM-DD"), "Asia/Kolkata").startOf("day").toDate();
    const endOfDay = moment.tz(now.format("YYYY-MM-DD"), "Asia/Kolkata").endOf("day").toDate();

    // Find today's attendance for the employee
    const attendance = await attendanceModel.findOne({
        employee: _id,
        // employee: employee,
        checkIn: { $gte: startOfDay, $lte: endOfDay }
    });

    if (!attendance) {
        return sendResponse(res, 404, null, "No check-in found for today");
    }

    // Calculate working hours
    const checkInMoment = moment(attendance.checkIn);
    const checkOutMoment = moment(checkOutIST);
    const duration = moment.duration(checkOutMoment.diff(checkInMoment));
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    const workingHours = `${hours}h ${minutes}m`;

    // Optional: update status to HALFDAY if worked less than 4 hours
    let status = attendance.status;
    if (hours < 4) {
        status = "HALFDAY";
    }

    // Update attendance record
    attendance.checkOut = checkOutIST;
    attendance.workingHours = workingHours;
    attendance.status = status;
    if (location) {
        attendance.location = location; // optionally update if needed
    }
    await attendance.save();

    return sendResponse(res, 200, attendance);


};

export const getTodaysAttendanceForEmployee = async (req, res, next) => {

    const { _id } = req.user
    const now = moment().tz("Asia/Kolkata");

    const startOfDay = moment.tz(now.format("YYYY-MM-DD"), "Asia/Kolkata").startOf('day').toDate();
    const endOfDay = moment.tz(now.format("YYYY-MM-DD"), "Asia/Kolkata").endOf('day').toDate();

    // const attendanceRecords = await attendanceModel.find({
    //     checkIn: { $gte: startOfDay, $lte: endOfDay }
    // }).populate("employee"); // optional: populate employee details

    const attendanceRecords = await attendanceModel.find({
        // employee: id,
        employee: _id,
        checkIn: { $gte: startOfDay, $lte: endOfDay }
    });

    return sendResponse(res, 200, attendanceRecords);

};

export const getPaginatedAttendance = async (req, res, next) => {
    // try {
    const { _id } = req.user; // Logged-in user
    // const { id } = req.params; // Logged-in user
    const { limit = 20 } = req.query; // Default limit is 20

    const attendanceRecords = await attendanceModel
        .find({ employee: _id })
        // .find({ employee: id })
        .sort({ createdAt: -1 }) // Most recent first
        .limit(parseInt(limit))
        .lean();

    return sendResponse(res, 200, attendanceRecords);
    // } catch (error) {
    //     return sendResponse(res, 500, null, "Failed to fetch attendance records");
    // }
};

export const getAllAttendance = async (req, res, next) => {
    const { type, branch } = req.user;
    const { name, status, page = 1, limit = 10 } = req.query;

    console.log(name, "ban");


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

    console.log(query, "att");

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
                employeeId: emp?.employeeId,
                totalWorkedDays: attendance ? attendance?.totalWorkedDays : 0,
                totalAbsentDays: attendance ? attendance?.totalAbsentDays : 0
            };
        });

        const Data = {
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
            data: Data
        });

    } catch (error) {
        console.error("Error fetching employee worked days:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const getMonthlyAttendanceForEmployee = async (req, res, next) => {
    try {
        const { _id } = req.user; // logged-in employee
        const { month, year } = req.query;

        // Use provided month/year or default to current
        const targetMonth = month ? parseInt(month) - 1 : moment().month(); // 0-indexed
        const targetYear = year ? parseInt(year) : moment().year();

        // Get start and end of the month in IST
        const startOfMonth = moment.tz({ year: targetYear, month: targetMonth, day: 1 }, "Asia/Kolkata")
            .startOf("month")
            .toDate();

        const endOfMonth = moment.tz({ year: targetYear, month: targetMonth, day: 1 }, "Asia/Kolkata")
            .endOf("month")
            .toDate();

        // Fetch attendances based on createdAt timestamp
        const records = await attendanceModel.find({
            employee: _id,
            createdAt: {
                $gte: startOfMonth,
                $lte: endOfMonth,
            },
        }).sort({ createdAt: -1 });

        return sendResponse(res, 200, records, "Monthly attendance fetched successfully");
    } catch (error) {
        return sendResponse(res, 500, null, "Failed to fetch monthly attendance");
    }
};