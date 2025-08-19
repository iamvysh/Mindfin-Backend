import mongoose from "mongoose";
import moment from "moment-timezone";
import Leads from "../../model/leadsModel.js";
import sendResponse from "../../utils/sendResponse.js";
import CustomError from "../../utils/customError.js";
import designationModel from "../../model/designationModel.js";
import employeeModel from "../../model/employeeModel.js";
import leadHistoryModel from "../../model/leadHistoryModel.js";


export const getFilteredLeadsToTeleCaller = async (req, res, next) => {
  try {
    let { date, status, name, page = 1, limit = 10, sortBy = "assignedDate", order = "desc" } = req.query;
    const { branch, _id: assignedTo } = req.user;

    if (!branch?.length || !assignedTo) {
      return next(new CustomError("Branch and user ID are required", 400));
    }

    // --- Prepare filters ---
    const filters = {
      branch: { $in: branch.map(b => new mongoose.Types.ObjectId(b)) },
      assignedTo: new mongoose.Types.ObjectId(assignedTo)
    };

    if (status) filters.status = status;
    if (name) filters.leadName = { $regex: name, $options: "i" };
    if (date) {
      const timezone = "Asia/Kolkata";
      const startOfDay = moment.tz(date, timezone).startOf("day").toDate();
      const endOfDay = moment.tz(date, timezone).endOf("day").toDate();
      filters.assignedDate = { $gte: startOfDay, $lte: endOfDay };
    }

    // --- Pagination & sorting ---
    page = Math.max(1, parseInt(page));
    limit = Math.max(1, Math.min(parseInt(limit), 100));
    const skip = (page - 1) * limit;

    const sortOptions = {
      leadName: { leadName: order === "asc" ? 1 : -1 },
      loanAmount: { loanAmount: order === "asc" ? 1 : -1 },
      assignedDate: { assignedDate: order === "asc" ? 1 : -1 },
      createdAt: { createdAt: order === "asc" ? 1 : -1 }
    };
    const sortCriteria = sortOptions[sortBy] || { assignedDate: -1 };

    // --- Query ---
    const [leads, total] = await Promise.all([
      Leads.find(filters)
        .populate("loanType", "loanName")
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit)
        .lean(),
      Leads.countDocuments(filters)
    ]);

    const totalPages = Math.ceil(total / limit);

    // --- Response metadata ---
    const meta = {
      total,
      totalPages,
      page,
      pageLeads: leads.length,
      isFirst: page === 1,
      isLast: page === totalPages || totalPages === 0,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };

    return sendResponse(res, 200, { ...meta, leads });
  } catch (error) {
    next(error);
  }
};

export const exportLeadToTeleCaller = async (req, res, next) => {
  try {
    const { branch: branchArray, _id: assignedTo } = req.user;
    const { date, status, name } = req.query;

    const branch = Array.isArray(branchArray) ? branchArray[0] : branchArray;

    if (!branch || !mongoose.Types.ObjectId.isValid(branch)) {
      return next(new CustomError("Valid branch ID is required", 400));
    }
    if (!assignedTo || !mongoose.Types.ObjectId.isValid(assignedTo)) {
      return next(new CustomError("Valid user ID is required", 400));
    }

    const filters = {
      branch: new mongoose.Types.ObjectId(branch),
      assignedTo: new mongoose.Types.ObjectId(assignedTo),
    };
    if (status) {
      filters.status = status;
    }
    if (name) {
      filters.leadName = { $regex: name, $options: "i" };
    }
    if (date) {
      const timezone = "Asia/Kolkata";
      const startOfDay = moment.tz(date, timezone).startOf("day").toDate();
      const endOfDay = moment.tz(date, timezone).endOf("day").toDate();
      filters.assignedDate = { $gte: startOfDay, $lte: endOfDay };
    }

    // Fetch all matching leads
    const leads = await Leads.find(filters).sort({ assignedDate: -1 });

    return sendResponse(res, 200, leads);
  } catch (error) {
    next(error);
  }
};

export const getAllCreditManagersWithLeadCount = async (req, res, next) => {
  try {
    const branchId = req.user.branch;

    const creditManagerDesignation = await designationModel.findOne({
      designation: "CREDITMANAGER",
    });
    if (!creditManagerDesignation) {
      return next(new CustomError("Credit Manager designation not found", 404));
    }

    const creditManagers = await employeeModel.find({
      designation: creditManagerDesignation._id,
      branch: branchId,
      isDeleted: false,
    });

    const todayStart = moment.tz("Asia/Kolkata").startOf("day").toDate();
    const todayEnd = moment.tz("Asia/Kolkata").endOf("day").toDate();

    const results = await Promise.all(
      creditManagers.map(async (manager) => {
        const leadCount = await Leads.countDocuments({
          creditManger: manager._id,
          creditManagerAssignedDate: {
            $gte: todayStart,
            $lte: todayEnd,
          },
        });

        return {
          _id: manager._id,
          name: `${manager.firstName} ${manager.lastName}`,
          email: manager.email,
          phone: manager.phone,
          designation: "Credit Manager",
          totalTodayAssignedLeads: leadCount,
        };
      })
    );

    return sendResponse(res, 200, results);
  } catch (error) {
    next(new CustomError(error.message || "Internal Server Error", 500));
  }
};

export const assignCreditManagerToLead = async (req, res, next) => {
  try {
    const { leadId, creditManger } = req.body;

    if (!leadId || !creditManger) {
      return next(new CustomError("leadId and creditManger are required", 400));
    }

    const lead = await Leads.findById(leadId);

    if (!lead) {
      return next(new CustomError("Lead not found", 404));
    }

    // Update credit manager and assignment date
    lead.creditManger = creditManger;
    lead.creditManagerAssignedDate = new Date();

    await lead.save();

    return sendResponse(res, 200, lead);
  } catch (error) {
    next(new CustomError(error.message || "Internal Server Error", 500));
  }
};

export const createLeadHistory = async (req, res, next) => {

  const { leadId, status, description, scheduledDate, scheduledTime, remarks } = req.body;
  const employeeId = req.user._id;

  if (!leadId || !status || !description) {
    return next(new CustomError("leadId, status, and description are required", 400));
  }

  const leadHistory = await leadHistoryModel.create({
    lead: leadId,
    status,
    description,
    scheduledDate,
    scheduledTime,
    remarks,
    createdBy: employeeId,
  });
  const latestHistory = await leadHistoryModel.findOne({ lead: leadId }).sort({ createdAt: -1, _id: -1 }).limit(1).lean();
  if (!latestHistory) {
    throw new CustomError("Failed to retrieve lead history", 500);
  }

  const lead = await Leads.findByIdAndUpdate(leadId, { status: latestHistory.status }, { new: true, runValidators: true });
  if (!lead) {
    throw new CustomError("Lead not found", 404);
  }

  return sendResponse(res, 201, { lead, leadHistory });
};

export const getLeadHistories = async (req, res, next) => {
  const { id } = req.params;

  const leadExists = await Leads.exists({ _id: id });
  if (!leadExists) {
    throw new CustomError("Lead not found", 404);
  }
  const histories = await leadHistoryModel.find({ lead: id }).populate("lead", "leadName phone status loanType").populate("createdBy", "firstName lastName email").sort({ createdAt: -1 });

  return sendResponse(res, 200, histories);
};

export const updateLeadHistory = async (req, res, next) => {
  const { id } = req.params;
  const { status, description, scheduledDate, scheduledTime, remarks } = req.body;

  const updateData = {};
  if (status !== undefined) updateData.status = status;
  if (description !== undefined) updateData.description = description;
  if (scheduledDate !== undefined) updateData.scheduledDate = scheduledDate;
  if (scheduledTime !== undefined) updateData.scheduledTime = scheduledTime;
  if (remarks !== undefined) updateData.remarks = remarks;

  if (Object.keys(updateData).length === 0) {
    throw new CustomError("At least one field must be provided for update", 400);
  }

  const updatedHistory = await leadHistoryModel.findByIdAndUpdate( id, updateData, { new: true, runValidators: true });
  if (!updatedHistory) {
    throw new CustomError("Lead history not found", 404);
  }

  const latestHistory = await leadHistoryModel.findOne({ lead: updatedHistory.lead }).sort({ createdAt: -1, _id: -1 }).limit(1).lean();
  if (!latestHistory) {
    throw new CustomError("Failed to retrieve lead history", 500);
  }
  const updatedLead = await Leads.findByIdAndUpdate( updatedHistory.lead, { status: latestHistory.status }, { new: true, runValidators: true });

  return sendResponse(res, 200, { updatedHistory, updatedLead });
};

export const deleteLeadHistory = async (req, res, next) => {
  const { id } = req.params;
  const deletedHistory = await leadHistoryModel.findByIdAndDelete(id);

  if (!deletedHistory) {
    throw new CustomError("Lead history not found", 404);
  }

  return sendResponse(res, 200, { message: "Lead history deleted successfully", deletedId: id });
};

export const getAssignedLeadStats = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const userId = req.user._id;
    const branchId = req.user.branch;

    const timezone = "Asia/Kolkata"; // change if needed
    const now = moment.tz(timezone);

    const targetMonth = month ? parseInt(month) - 1 : now.month(); // 0-indexed
    const targetYear = year ? parseInt(year) : now.year();

    const startDate = moment.tz({ year: targetYear, month: targetMonth, day: 1 }, timezone).startOf("day");
    const isCurrentMonth = targetMonth === now.month() && targetYear === now.year();
    const endDate = isCurrentMonth ? now.endOf("day") : moment(startDate).endOf("month");


    console.log();

    const stats = await Leads.aggregate([
      {
        $match: {
          assignedTo: new mongoose.Types.ObjectId(userId),
          branch: new mongoose.Types.ObjectId(branchId),
          assignedDate: {
            $gte: startDate.toDate(),
            $lte: endDate.toDate(),
          },
        },
      },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: "$assignedDate" },
            month: { $month: "$assignedDate" },
            year: { $year: "$assignedDate" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: "$_id.year",
              month: "$_id.month",
              day: "$_id.day",
            },
          },
          count: 1,
          _id: 0,
        },
      },
    ]);

    return sendResponse(res, 200, stats);
  } catch (error) {
    next(error);
  }
};

export const getAssignedLeadsByStatus = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const timezone = "Asia/Kolkata"; // or dynamically from req.user.timezone
    const userId = req.user._id;
    const branchId = req.user.branch;

    const now = moment.tz(timezone);
    const targetMonth = month ? parseInt(month) - 1 : now.month(); // moment is 0-based
    const targetYear = year ? parseInt(year) : now.year();

    const startDate = moment.tz({ year: targetYear, month: targetMonth, day: 1 }, timezone).startOf("day");
    const isCurrentMonth = targetMonth === now.month() && targetYear === now.year();
    const endDate = isCurrentMonth ? now.endOf("day") : moment(startDate).endOf("month");

    const statusCounts = await Leads.aggregate([
      {
        $match: {
          assignedTo: new mongoose.Types.ObjectId(userId),
          branch: new mongoose.Types.ObjectId(branchId),
          assignedDate: {
            $gte: startDate.toDate(),
            $lte: endDate.toDate(),
          },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          status: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    return sendResponse(res, 200, statusCounts);
  } catch (error) {
    next(error);
  }
};

