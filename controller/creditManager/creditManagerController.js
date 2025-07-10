import CustomError from '../../utils/customError.js';
import sendResponse from '../../utils/sendResponse.js';
import Leads from "../../model/leadsModel.js"
import mongoose from 'mongoose';
import moment from "moment-timezone";
import bankModel from '../../model/bankModel.js';
import followUpModel from '../../model/followUpModel.js';


// export const getFilteredCreditManagerLeads = async (req, res, next) => {
//   try {
//     const userId = req.user._id;
//     const branchId = req.user.branch;
//     const { teleCaller, status, date,search, page = 1, limit = 10 } = req.query;

//     const timezone = "Asia/Kolkata";
//     const match = {
//       creditManger: userId,
//       branch: branchId,
//     };

//     // Optional Filters
//     if (teleCaller) {
//       match.assignedTo = teleCaller;
//     }

//     if (status) {
//       match.status = status;
//     }

//     if (date) {
//       const startOfDay = moment.tz(date, timezone).startOf("day").toDate();
//       const endOfDay = moment.tz(date, timezone).endOf("day").toDate();
//       match.AssignedDate = { $gte: startOfDay, $lte: endOfDay };
//     }

//     if (search) {
//     match.leadName = { $regex: search, $options: "i" };
//     }

//     const pageNum = parseInt(page);
//     const pageSize = parseInt(limit);
//     const skip = (pageNum - 1) * pageSize;

//     const [leads, totalCount] = await Promise.all([
//       Leads.find(match)
//         .populate("assignedTo", "name email phone")
//         .populate("createdBy", "name email")
//         .populate("creditManger", "name email")
//         .populate("branch", "name")
//         .skip(skip)
//         .limit(pageSize)
//         .sort({ AssignedDate: -1 }),

//       Leads.countDocuments(match),
//     ]);

//     return sendResponse(res, 200, {
//       data: leads,
//       pagination: {
//         total: totalCount,
//         page: pageNum,
//         limit: pageSize,
//         totalPages: Math.ceil(totalCount / pageSize),
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// };


// adjust the path accordingly



// if loan Type is Personal Loan  add loanType is Personal Loan for Business Business Loan

export const getFilteredCreditManagerLeads = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const branchId = req.user.branch;
    const { teleCaller, status, date, search, loanType, page = 1, limit = 10 } = req.query;

    const timezone = "Asia/Kolkata";

    const matchStage = {
     creditManger: new mongoose.Types.ObjectId(userId),
     branch: new mongoose.Types.ObjectId(branchId),
    };

    if (teleCaller) {
      matchStage.assignedTo = teleCaller;
    }

    if (status) {
      matchStage.status = status;
    }

    if (date) {
      const startOfDay = moment.tz(date, timezone).startOf("day").toDate();
      const endOfDay = moment.tz(date, timezone).endOf("day").toDate();
      matchStage.AssignedDate = { $gte: startOfDay, $lte: endOfDay };
    }

    if (search) {
      matchStage.leadName = { $regex: search, $options: "i" };
    }

    const pageNum = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNum - 1) * pageSize;

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "loantypes",
          localField: "loanType",
          foreignField: "_id",
          as: "loanType",
        },
      },
      { $unwind: "$loanType" },
    ];

    // If loanType name is provided, filter on it
    if (loanType) {
      pipeline.push({
        $match: {
          "loanType.loanName": loanType, // e.g., "Personal Loan"
        },
      });
    }

    // Continue lookups for other references
    pipeline.push(
      {
        $lookup: {
          from: "employees",
          localField: "assignedTo",
          foreignField: "_id",
          as: "assignedTo",
        },
      },
      {
        $unwind: {
          path: "$assignedTo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
        },
      },
      {
        $unwind: {
          path: "$createdBy",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "creditManger",
          foreignField: "_id",
          as: "creditManger",
        },
      },
      {
        $unwind: {
          path: "$creditManger",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "branches",
          localField: "branch",
          foreignField: "_id",
          as: "branch",
        },
      },
      {
        $unwind: {
          path: "$branch",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $sort: { AssignedDate: -1 } },
      { $skip: skip },
      { $limit: pageSize }
    );

    // Clone pipeline for count without skip/limit
    const countPipeline = [...pipeline];
    countPipeline.push({ $count: "total" });

    const [leads, countResult] = await Promise.all([
      Leads.aggregate(pipeline),
      Leads.aggregate(countPipeline),
    ]);

    const totalCount = countResult.length > 0 ? countResult[0].total : 0;

    return sendResponse(res, 200, {
      data: leads,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
};


export const exportCreditManagerLeads = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const branchId = req.user.branch;
    const { teleCaller, status, date, search } = req.query;

    const timezone = "Asia/Kolkata";
    const match = {
      creditManger: userId,
      branch: branchId,
    };

    // Optional Filters
    if (teleCaller) {
      match.assignedTo = teleCaller;
    }

    if (status) {
      match.status = status;
    }

    if (date) {
      const startOfDay = moment.tz(date, timezone).startOf("day").toDate();
      const endOfDay = moment.tz(date, timezone).endOf("day").toDate();
      match.AssignedDate = { $gte: startOfDay, $lte: endOfDay };
    }

    // Search by leadName only
    if (search) {
      match.leadName = { $regex: search, $options: "i" };
    }

    const leads = await Leads.find(match)
      .populate("assignedTo", "name email phone")
      .populate("createdBy", "name email")
      .populate("creditManger", "name email")
      .populate("branch", "name")
      .sort({ AssignedDate: -1 });

    return sendResponse(res, 200, {
      data: leads,
      total: leads.length,
    });
  } catch (error) {
    next(error);
  }
}


export const updateLeadStatus = async (req, res) => {

    const { leadId } = req.params;
    const { status } = req.body;

    console.log(leadId,"idd");
    

    // Validate allowed statuses
    const validStatuses = ["INPROGRESS", "PENDING", "CLOSED", "DROPPED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Update the lead status
    const updatedLead = await Leads.findByIdAndUpdate(
      leadId,
      { status },
      { new: true }
    );

    if (!updatedLead) {
            return next(new CustomError("Lead not found", 400));
    }

    // res.status(200).json({
    //   message: "Lead status updated successfully",
    //   data: updatedLead,
    // });

    return sendResponse(res,200,updatedLead)

  
};



export const addBankDetails = async (req, res, next) => {
  try {
    const {
      lead,
      bankName,
      bankerName,
      phone,
      emailId,
      loanAmountRequested,
      rateOfInterest,
      pf,
      tenure,
      insuranceAmount,
      loanType,
      scheduledDate,
      followUpDate,
      status,
      document,
      remarks,
    } = req.body;

    const validStatus = ["Confirmed", "In Progress", "Declined"];
    // const validLoanType = ["Home", "Car", "Personal", "Other"];

    if (!validStatus.includes(status)) {
      // return res.status(400).json({ message: "Invalid status value" });
                  return next(new CustomError("Invalid status value", 400));

    }


    // if (!validLoanType.includes(loanType)) {
    //   // return res.status(400).json({ message: "Invalid loan type" });
    //         return next(new CustomError("Invalid loan type", 400));

    // }

    const newBankDetails = await bankModel.create({
      lead,
      bankName,
      bankerName,
      phone,
      emailId,
      loanAmountRequested,
      rateOfInterest,
      pf,
      tenure,
      insuranceAmount,
      loanType,
      scheduledDate,
      followUpDate,
      status,
      document,
      remarks,
    });

    if (!newBankDetails) {
      return next(new CustomError("Failed to create bank details entry", 400));
    }

    return sendResponse(res, 201, newBankDetails);
  } catch (error) {
    next(error);
  }
}

export const getAllBankDetails = async (req, res, next) => {
  try {
    const {id} = req.params
    const bankDetails = await bankModel.find({lead:id}).populate("lead bankName loanType");
    return sendResponse(res, 200, bankDetails);
  } catch (error) {
    next(error);
  }
};


export const getBankDetailById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bankDetail = await bankModel.findById(id).populate("lead bankName loanType");

    if (!bankDetail) {
      return next(new CustomError("Bank detail not found", 404));
    }

    return sendResponse(res, 200, bankDetail);
  } catch (error) {
    next(error);
  }
};


export const updateBankDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedDetail = await bankModel.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedDetail) {
      return next(new CustomError("Bank detail not found or update failed", 404));
    }

    return sendResponse(res, 200, updatedDetail);
  } catch (error) {
    next(error);
  }
};

export const deleteBankDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedDetail = await bankModel.findByIdAndDelete(id);

    if (!deletedDetail) {
      return next(new CustomError("Bank detail not found", 404));
    }

    return sendResponse(res, 200, { message: "Bank detail deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const addFollowUp = async (req, res, next) => {
  try {
    const {
      bankDetail,
      loanAmountRequested,
      rateOfInterest,
      pf,
      tenure,
      insuranceAmount,
      loanType,
      date,
      followUpDate,
      status,
      remarks,
    } = req.body;

    // Validate loanType and status manually (optional - already handled by schema enum)
    // const validLoanTypes = ["Home", "Car", "Personal", "Other"];
    const validStatuses = ["Confirmed", "In Progress", "Declined"];

    // if (!validLoanTypes.includes(loanType)) {
    //   return next(new CustomError("Invalid loan type", 400));
    // }

    if (!validStatuses.includes(status)) {
      return next(new CustomError("Invalid status", 400));
    }

    const followUp = await followUpModel.create({
      bankDetail,
      loanAmountRequested,
      rateOfInterest,
      pf,
      tenure,
      insuranceAmount,
      loanType,
      date,
      followUpDate,
      status,
      remarks,
    });

    if (!followUp) {
      return next(new CustomError("Failed to create follow-up entry", 400));
    }

    return sendResponse(res, 201, followUp);
  } catch (error) {
    next(error);
  }
};

export const getFollowUpsByBankDetail = async (req, res, next) => {
  try {
    const { bankDetailId } = req.params;

    const followUps = await followUpModel.find({ bankDetail: bankDetailId }).populate("loanType").sort({ createdAt: -1 });

    return sendResponse(res, 200, followUps);
  } catch (error) {
    next(error);
  }
};

export const getFollowUpById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const followUp = await followUpModel.findById(id).populate("bankDetail loanType");

    if (!followUp) {
      return next(new CustomError("Follow-up not found", 404));
    }

    return sendResponse(res, 200, followUp);
  } catch (error) {
    next(error);
  }
};


export const updateFollowUp = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updated = await followUpModel.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return next(new CustomError("Follow-up not found or update failed", 404));
    }

    return sendResponse(res, 200, updated);
  } catch (error) {
    next(error);
  }
};


export const deleteFollowUp = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await followUpModel.findByIdAndDelete(id);

    if (!deleted) {
      return next(new CustomError("Follow-up not found", 404));
    }

    return sendResponse(res, 200, { message: "Follow-up deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// export const getLeadsForCreditManagerForBankDetails = async (req, res,next) => {
//   try {
//     const { search, status, creditManagerAssignedDate, leadId } = req.query;

//     const creditManagerId = req.user._id;
//     const branchId = req.user.branch;

//     // Build lead query
//     const leadQuery = {
//       creditManger: creditManagerId,
//       branch: branchId,
//     };

//     if (leadId && mongoose.Types.ObjectId.isValid(leadId)) {
//       leadQuery._id = leadId;
//     }

//     if (status) {
//       leadQuery.status = status;
//     }

//     if (creditManagerAssignedDate) {
//       const date = new Date(creditManagerAssignedDate);
//       const nextDay = new Date(date);
//       nextDay.setDate(nextDay.getDate() + 1);

//       leadQuery.creditManagerAssignedDate = {
//         $gte: date,
//         $lt: nextDay,
//       };
//     }

//     if (search) {
//       leadQuery.leadName = { $regex: search, $options: "i" };
//     }

//     // Fetch leads
//     const leads = await Leads.find(leadQuery)
//       .populate("branch")
//       .populate("createdBy", "name")
//       .populate("assignedTo", "name")
//       .populate("creditManger", "name")
//       .lean();

//     // For each lead, check confirmed bank
//     const enrichedLeads = await Promise.all(
//       leads.map(async (lead) => {
//         const confirmedBank = await bankModel.findOne({
//           lead: lead._id,
//           status: "Confirmed",
//         }).lean();

//         return {
//           ...lead,
//           confirmedBankDetails: confirmedBank || null,
//           hasConfirmedBank: !!confirmedBank,
//         };
//       })
//     );

//     res.status(200).json({ success: true, leads: enrichedLeads });
//   } catch (error) {
//     console.error("Error fetching leads:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };



export const getLeadsForCreditManagerForBankDetails = async (req, res, next) => {
  try {
    const {
      search,
      status,
      creditManagerAssignedDate,
      leadId,
      page = 1,
      limit = 10,
    } = req.query;

    const creditManagerId = req.user._id;
    const branchId = req.user.branch;

    const leadQuery = {
      creditManger: creditManagerId,
      branch: branchId,
    };

    if (leadId && mongoose.Types.ObjectId.isValid(leadId)) {
      leadQuery._id = leadId;
    }

    if (status) {
      leadQuery.status = status;
    }

    if (creditManagerAssignedDate) {
      const date = new Date(creditManagerAssignedDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      leadQuery.creditManagerAssignedDate = {
        $gte: date,
        $lt: nextDay,
      };
    }

    if (search) {
      leadQuery.leadName = { $regex: search, $options: "i" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const total = await Leads.countDocuments(leadQuery);

    const leads = await Leads.find(leadQuery)
      .populate("branch")
      .populate("createdBy", "name")
      .populate("assignedTo", "name")
      .populate("creditManger", "name")
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const enrichedLeads = await Promise.all(
      leads.map(async (lead) => {
        const confirmedBank = await bankModel.findOne({
          lead: lead._id,
          status: "Confirmed",
        }).lean();

        return {
          ...lead,
          confirmedBankDetails: confirmedBank || null,
          hasConfirmedBank: !!confirmedBank,
        };
      })
    );

    return sendResponse(res, 200, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      leads: enrichedLeads,
    });
  } catch (error) {
    next(error);
  }
};