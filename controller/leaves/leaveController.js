import moment from "moment-timezone";
import transport from "../../config/nodemailer.js";
import employeeModel from "../../model/employeeModel.js";
import leavesModel from "../../model/leavesModel.js";
import CustomError from "../../utils/customError.js";
import { leaveApprovel, leaveReject } from "../../utils/emailTemplate.js";
import sendResponse from "../../utils/sendResponse.js";



export const createLeave = async (req, res, next) => {
  
  const { employee, leaveType, startDate, endDate, duration, reason, supportingDoc, leaveStatus } = req.body;
  if (!employee || !leaveType || !startDate || !endDate || !duration || !reason || !supportingDoc || !leaveStatus) {
    return next(new CustomError("Missing required fields!", 400));
  }
  let exists = await leavesModel.findOne({ employee, startDate });
  if (exists) {
    return next(new CustomError("Leave already exists for this employee on this date!", 400));
  }

  const newLeave = await leavesModel.create({ employee, leaveType, startDate, endDate, duration, reason, supportingDoc, leaveStatus, decisionMadeBy: req.user?._id });
  sendResponse(res, 200, newLeave);
};

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

export const updateLeave = async (req, res, next) => {
  const { _id } = req.user;
  const { id } = req.params;
  let updateData = req.body;

  // Check if the leave exists
  const leave = await leavesModel.findById(id).populate('employee');
  if (!leave) {
    return next(new CustomError("Leave not found", 404));
  }

  // Check for conflicting leaves
  const exists = await leavesModel.findOne({
    _id: { $ne: id },
    employee: updateData.employee,
    startDate: updateData.startDate,
    endDate: updateData.endDate,
  });

  if (exists) {
    return next(new CustomError("Leave already exists for this employee and date range", 400));
  }

  const prevStatus = leave?.leaveStatus;
  const newStatus = updateData?.leaveStatus;

  // Set decision maker only if status is being updated
  if (newStatus === "APPROVED" || newStatus === "REJECTED") {
    updateData.decisionMadeBy = _id;
  }

  // Update the leave
  const updatedLeave = await leavesModel
    .findByIdAndUpdate(id, updateData, { new: true })
    .populate("decisionMadeBy");

  // Send email notification if status changed
  if (prevStatus !== newStatus && (newStatus === "APPROVED" || newStatus === "REJECTED")) {
    const formattedStartDate = moment(updateData?.startDate).format("D - MM - YYYY");
    const formattedEndDate = moment(updateData?.endDate).format("D - MM - YYYY");
    const officer = await employeeModel.findById(_id).populate("designation");
    const employeeEmail = leave?.employee?.professionalEmail;

    await transport.sendMail({
      from: process.env.SMTP_MAIL,
      to: employeeEmail,
      subject: `Your Leave Request has been ${newStatus}`,
      headers: `From: ${process.env.SMTP_MAIL}`,
      html:
        newStatus === "APPROVED"
          ? leaveApprovel({
            employeename: leave?.employee?.firstName,
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            Officername: officer?.firstName,
            officerDesignation: officer?.designation?.designation,
          })
          : leaveReject({
            employeename: leave?.employee?.firstName,
            startDate: formattedStartDate,
            Officername: officer?.firstName,
            officerDesignation: officer?.designation?.designation,
          }),
    });
  }

  sendResponse(res, 200, updatedLeave);
};

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

export const getLeaveSummary = async (req, res) => {
  //   const  employeeId  = req.params.id;
  const { _id } = req.user

  // Set timezone (you can change 'Asia/Kolkata' to your desired one)
  const timezone = "Asia/Kolkata";

  const currentYearStart = moment.tz(timezone).startOf('year').toDate(); // Jan 1
  const currentYearEnd = moment.tz(timezone).endOf('year').toDate(); // Dec 31

  // Fetch all APPROVED leaves for the employee in the current year
  const leaves = await leavesModel.find({
    // employee: employeeId,
    employee: _id,
    leaveStatus: "APPROVED",
    startDate: { $gte: currentYearStart, $lte: currentYearEnd }
  });

  let usedPaid = 0;
  let usedSick = 0;

  // Sum the leave durations
  leaves.forEach((leave) => {
    if (leave.leaveType === "PAID") {
      usedPaid += leave.duration;
    } else if (leave.leaveType === "SICK") {
      usedSick += leave.duration;
    }
  });

  const totalPaid = 18;
  const totalSick = 2;

  const availablePaid = Math.max(totalPaid - usedPaid, 0);
  const availableSick = Math.max(totalSick - usedSick, 0);

  let data = {
    totalLeaves: totalPaid + totalSick,
    usedLeaves: usedPaid + usedSick,
    availableLeaves: availablePaid + availableSick,
    paid: {
      total: totalPaid,
      used: usedPaid,
      available: availablePaid
    },
    sick: {
      total: totalSick,
      used: usedSick,
      available: availableSick
    }
  };

  sendResponse(res, 200, data)

};

export const getLeavesByType = async (req, res) => {

  //   const employeeId  = req.params.id;
  const { _id } = req.user
  const { type, limit } = req.query; // e.g. ?type=upcoming&limit=20
  const timezone = "Asia/Kolkata";

  const parsedLimit = parseInt(limit) || 10;
  const now = moment.tz(timezone).toDate();

  //   let query = { employee: employeeId };
  let query = { employee: _id };
  let sortOption = {};

  if (type === "upcoming") {
    query.startDate = { $gt: now };
    sortOption = { startDate: 1 }; // ascending
  } else if (type === "past") {
    query.startDate = { $lte: now };
    sortOption = { startDate: -1 }; // descending
  } else {
    return res.status(400).json({ message: "Invalid type. Use 'upcoming' or 'past'." });
  }

  const leaves = await leavesModel.find(query)
    .sort(sortOption)
    .limit(parsedLimit)
    .lean();

  //   return res.status(200).json({
  //     leaves,
  //     type,
  //     limit: parsedLimit,
  //     page: 1
  //   });
  sendResponse(res, 200, {
    leaves,
    type,
    limit: parsedLimit,
    page: 1
  })

};

export const AddLeave = async (req, res, next) => {
  const { _id } = req.user

  const { leaveType, startDate, endDate, duration, reason } = req.body;

  // Check if a leave with the same employee and dates already exists
  let exists = await leavesModel.findOne({
    employee: _id,
    startDate,
    // endDate
  });

  if (exists) {
    return next(new CustomError("Leave already exists for this  date range", 400));
  }

  const newLeave = await leavesModel.create({
    ...req.body,
    employee: _id
  });

  sendResponse(res, 200, newLeave);
};