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
    const { branch, _id: assignedTo } = req.user;
    const { date, status, name, page = 1, limit = 10 } = req.query;

    // Validate user context
    if (!branch || !assignedTo) {
      return next(new CustomError("Branch and user ID are required", 400));
    }

    // Initialize filters
    const filters = {
      branch: new mongoose.Types.ObjectId(branch),
      assignedTo: new mongoose.Types.ObjectId(assignedTo),
    };

    // Filter by status
    if (status) {
      filters.status = status;
    }

    // Partial name search
    if (name) {
      filters.leadName = { $regex: name, $options: "i" };
    }

    // Filter by exact AssignedDate (start and end of the day in IST)
    if (date) {
      const timezone = "Asia/Kolkata";
      const startOfDay = moment.tz(date, timezone).startOf("day").toDate();
      const endOfDay = moment.tz(date, timezone).endOf("day").toDate();
      filters.AssignedDate = { $gte: startOfDay, $lte: endOfDay };
    }

    // Pagination values
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const perPage = parseInt(limit);

    // Query and count
    const [leads, total] = await Promise.all([
      Leads.find(filters)
        .sort({ AssignedDate: -1 })
        .skip(skip)
        .limit(perPage),
      Leads.countDocuments(filters),
    ]);

    // Response
    return sendResponse(res, 200, {
      total,
      page: parseInt(page),
      limit: perPage,
      totalPages: Math.ceil(total / perPage),
      leads,
    });
  } catch (error) {
    next(error);
  }
};

export const exportLeadToTeleCaller = async (req, res, next) => {
  try {
    const { branch, _id: assignedTo } = req.user;
    const { date, status, name } = req.query;

    // Ensure required user context
    if (!branch || !assignedTo) {
      return next(new CustomError("Branch and user ID are required", 400));
    }

    // Build filters
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
      filters.AssignedDate = { $gte: startOfDay, $lte: endOfDay };
    }

    // Fetch all matching leads
    const leads = await Leads.find(filters).sort({ AssignedDate: -1 });

    return sendResponse(res, 200, leads);
  } catch (error) {
    next(error);
  }
};

export const getAllCreditManagersWithLeadCount = async (req, res, next) => {
  try {
    const branchId = req.user.branch;

    // Step 1: Find the Designation ID for "Credit Manager"
    const creditManagerDesignation = await designationModel.findOne({
      designation: "Credit Manager",
    });

    if (!creditManagerDesignation) {
      return next(new CustomError("Credit Manager designation not found", 404));
    }

    // Step 2: Get all credit managers in that branch
    const creditManagers = await employeeModel.find({
      designation: creditManagerDesignation._id,
      branch: branchId,
      isDeleted: false,
    });

    // Step 3: Today's start and end time in Asia/Kolkata timezone
    const todayStart = moment.tz("Asia/Kolkata").startOf("day").toDate();
    const todayEnd = moment.tz("Asia/Kolkata").endOf("day").toDate();

    // Step 4: Map each manager to include today's lead count
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

export const updateLeadStatusAndCreateHistory = async (req, res, next) => {
  try {
    const { leadId, status, description, scheduledDate, scheduledTime, remarks } = req.body;
    const employeeId = req.user._id;

    if (!leadId || !status || !description) {
      return next(new CustomError("leadId, status, and description are required", 400));
    }


    console.log(leadId, "id");

    // 1. Find and update lead status
    const lead = await Leads.findById(leadId);

    console.log(lead, "llll");

    if (!lead) {
      return next(new CustomError("Lead not found", 404));
    }

    lead.status = status;
    await lead.save();

    // 2. Create lead history entry
    const leadHistory = await leadHistoryModel.create({
      lead: leadId,
      status, // this is the new updated status
      description,
      scheduledDate,
      scheduledTime,
      remarks,
      createdBy: employeeId,
    });

    return sendResponse(res, 200, {
      lead,
      leadHistory,
    });
  } catch (error) {
    next(new CustomError(error.message || "Internal Server Error", 500));
  }
};

export const getRecentLeadHistories = async (req, res, next) => {
  try {
    const { id } = req.params
    // Fetch latest lead histories (e.g., last 20, sorted by newest first)
    const histories = await leadHistoryModel.find({ lead: id })
      .populate("lead", "leadName phone status loanType") // populate selected lead fields
      .populate("createdBy", "firstName lastName email")   // optional: show who created the history
      .sort({ createdAt: -1 }) // newest first
    // .limit(20);             

    return sendResponse(res, 200, histories);
  } catch (error) {
    next(new CustomError(error.message || "Failed to fetch lead histories", 500));
  }
};

export const updateLeadHistory = async (req, res, next) => {
  const { id } = req.params; // leadHistory ID
  const updateData = req.body;

  const updatedHistory = await leadHistoryModel.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!updatedHistory) {
    return next(new CustomError("Lead history not found", 404));

  }

  return sendResponse(res, 200, updatedHistory);


};

export const deleteLeadHistory = async (req, res, next) => {
  try {
    const { id } = req.params; // leadHistory ID

    const deletedHistory = await leadHistoryModel.findByIdAndDelete(id);

    if (!deletedHistory) {
      return next(new CustomError("Lead history not found", 404));
    }

    return sendResponse(res, 200, { message: "Lead history deleted successfully" });
  } catch (error) {
    next(error); // forward unexpected errors to the global error handler
  }
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
          AssignedDate: {
            $gte: startDate.toDate(),
            $lte: endDate.toDate(),
          },
        },
      },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: "$AssignedDate" },
            month: { $month: "$AssignedDate" },
            year: { $year: "$AssignedDate" },
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
          AssignedDate: {
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