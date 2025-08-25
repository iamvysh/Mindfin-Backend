import CustomError from '../../utils/customError.js';
import sendResponse from '../../utils/sendResponse.js';
import Leads from "../../model/leadsModel.js";
import mongoose from 'mongoose';
import moment from "moment-timezone";
import bankModel from '../../model/bankModel.js';
import followUpModel from '../../model/followUpModel.js';
import TopUpLoan from "../../model/topUpLoanModel.js";



export const getFilteredCreditManagerLeads = async (req, res, next) => {
  try {
    let { teleCaller, status, date, search, loanType, page = 1, limit = 5, sortBy = "assignedDate", order = "desc" } = req.query;
    const { branch, _id: creditManagerId } = req.user;

    if (!branch?.length || !creditManagerId) {
      return next(new CustomError("Branch and Credit Manager ID are required", 400));
    }

    // --- Prepare filters ---
    const filters = {
      creditManger: new mongoose.Types.ObjectId(creditManagerId),
      branch: { $in: branch.map(b => new mongoose.Types.ObjectId(b)) }
    };

    if (teleCaller) filters.assignedTo = new mongoose.Types.ObjectId(teleCaller);
    if (status) filters.status = status;
    if (search) filters.leadName = { $regex: search, $options: "i" };

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

    // --- Base pipeline for filtering ---
    const basePipeline = [
      { $match: filters },
      {
        $lookup: {
          from: "loantypes",
          localField: "loanType",
          foreignField: "_id",
          as: "loanType"
        }
      },
      { $unwind: { path: "$loanType", preserveNullAndEmptyArrays: true } }
    ];

    // Apply loanType filter if present
    if (loanType) {
      basePipeline.push({
        $match: { "loanType.loanName": { $regex: `^${loanType}$`, $options: "i" } }
      });
    }

    // --- Data retrieval pipeline ---
    const dataPipeline = [
      ...basePipeline,
      {
        $lookup: {
          from: "employees",
          localField: "assignedTo",
          foreignField: "_id",
          as: "assignedTo"
        }
      },
      { $unwind: { path: "$assignedTo", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "employees",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy"
        }
      },
      { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "employees",
          localField: "creditManger",
          foreignField: "_id",
          as: "creditManger"
        }
      },
      { $unwind: { path: "$creditManger", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "branches",
          localField: "branch",
          foreignField: "_id",
          as: "branch"
        }
      },
      { $unwind: { path: "$branch", preserveNullAndEmptyArrays: true } },
      // Add bank details lookup
      {
        $lookup: {
          from: "bankdetails",
          localField: "_id",
          foreignField: "lead",
          as: "bankDetails"
        }
      },
      // Add bank name lookup within bank details
      {
        $lookup: {
          from: "banks",
          localField: "bankDetails.bankName",
          foreignField: "_id",
          as: "allBanks"
        }
      },
      // Project all fields from lead model + limited employee fields + bank details
      {
        $project: {
          // Include all lead fields
          leadName: 1,
          email: 1,
          phone: 1,
          alternativePhone: 1,
          location: 1,
          loanAmount: 1,
          LeadCreatedDate: 1,
          assignedDate: 1,
          creditManagerAssignedDate: 1,
          status: 1,
          document: 1,
          panCard: 1,
          dateOfBirth: 1,
          createdAt: 1,
          updatedAt: 1,
          __v: 1,

          // Include populated fields with limited employee data
          loanType: 1,
          branch: 1,
          creditManger: {
            $cond: [
              "$creditManger",
              {
                _id: "$creditManger._id",
                firstName: "$creditManger.firstName",
                lastName: "$creditManger.lastName"
              },
              null
            ]
          },
          assignedTo: {
            $cond: [
              "$assignedTo",
              {
                _id: "$assignedTo._id",
                firstName: "$assignedTo.firstName",
                lastName: "$assignedTo.lastName"
              },
              null
            ]
          },
          createdBy: {
            $cond: [
              "$createdBy",
              {
                _id: "$createdBy._id",
                firstName: "$createdBy.firstName",
                lastName: "$createdBy.lastName"
              },
              null
            ]
          },

          // Process bank details
          bankDetails: {
            $map: {
              input: "$bankDetails",
              as: "bd",
              in: {
                // Include all bank detail fields
                _id: "$$bd._id",
                bankerName: "$$bd.bankerName",
                phone: "$$bd.phone",
                emailId: "$$bd.emailId",
                loanAmountRequested: "$$bd.loanAmountRequested",
                rateOfInterest: "$$bd.rateOfInterest",
                pf: "$$bd.pf",
                tenure: "$$bd.tenure",
                insuranceAmount: "$$bd.insuranceAmount",
                loanType: "$$bd.loanType",
                scheduledDate: "$$bd.scheduledDate",
                followUpDate: "$$bd.followUpDate",
                status: "$$bd.status",
                document: "$$bd.document",
                remarks: "$$bd.remarks",
                createdAt: "$$bd.createdAt",
                updatedAt: "$$bd.updatedAt",
                // Add bank name
                bankName: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$allBanks",
                        as: "bank",
                        cond: { $eq: ["$$bank._id", "$$bd.bankName"] }
                      }
                    },
                    0
                  ]
                }
              }
            }
          }
        }
      },
      // Clean up bank name field
      {
        $addFields: {
          bankDetails: {
            $map: {
              input: "$bankDetails",
              as: "bd",
              in: {
                $mergeObjects: [
                  "$$bd",
                  { bankName: "$$bd.bankName.name" }
                ]
              }
            }
          }
        }
      },
      { $sort: sortCriteria },
      { $skip: skip },
      { $limit: limit }
    ];

    // --- Count pipeline ---
    const countPipeline = [
      ...basePipeline,
      { $count: "total" }
    ];

    const [leads, countResult] = await Promise.all([
      Leads.aggregate(dataPipeline),
      Leads.aggregate(countPipeline)
    ]);

    const total = countResult[0]?.total || 0;
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
      match.assignedDate = { $gte: startOfDay, $lte: endOfDay };
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
      .sort({ assignedDate: -1 });

    return sendResponse(res, 200, {
      data: leads,
      total: leads.length,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLeadStatus = async (req, res) => {

  const { leadId } = req.params;
  const { status } = req.body;

  console.log(leadId, "idd");


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

  return sendResponse(res, 200, updatedLead)


};



// bank details
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
};

export const getAllBankDetails = async (req, res, next) => {
  try {
    const { id } = req.params
    const bankDetails = await bankModel.find({ lead: id }).populate("lead bankName loanType");
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



// follow up
export const addFollowUp = async (req, res, next) => {
  try {
    const {
      bankDetail,
      loanAmountRequested,
      rateOfInterest,
      pf,
      tenure,
      insuranceAmount,
      date,
      followUpDate,
      status,
      remarks,
    } = req.body;

    const validStatuses = ["Confirmed", "In Progress", "Declined"];

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

//fetch cibil score
// export const fetchCibilScore = async (req, res, next) => {
//   try {
//     const { panCard, dateOfBirth } = req.body;

//     if (!panCard || !dateOfBirth) {
//       return next(new CustomError("PAN card and DOB are required", 400));
//     }

//     // Mock CIBIL score logic (replace with real API later)
//     const score = Math.floor(Math.random() * (850 - 650 + 1)) + 650;

//     return sendResponse(res, 200, {
//       cibilScore: score,
//       remarks: score >= 750 ? "Excellent" : "Average",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export const fetchCibilScore = async (req, res, next) => {
  try {
    const { leadId } = req.params;

    // 1. Find the lead in DB
    const lead = await Leads.findById(leadId);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // 2. Extract panCard & dateOfBirth from DB
    const { panCard, dateOfBirth } = lead;
    if (!panCard || !dateOfBirth) {
      return res.status(400).json({ message: "Lead does not have PAN or DOB" });
    }

    // 3. Instead of calling real CIBIL API, mock the score
    const mockScore = 750; // can change this for testing

    // 4. Send the score
    res.json({
      leadId,
      leadName: lead.leadName,
      panCard,
      dateOfBirth,
      cibilScore: mockScore,
      message: "Mock CIBIL score fetched successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error checking CIBIL score", error: error.message });
  }
};


//top-up-api's
export const createTopUpLoan = async (req, res, next) => {
  try {
    const { applicant, type, amount, cibilScore, remarks } = req.body;

    if (!["Personal", "Business"].includes(type)) {
      return next(new CustomError("Invalid loan type", 400));
    }

    const loan = await TopUpLoan.create({ applicant, type, amount, cibilScore, remarks });

    return sendResponse(res, 201, loan);
  } catch (error) {
    next(error);
  }
};

export const getTopUpLoansByApplicant = async (req, res, next) => {
  try {
    const { applicantId } = req.params;

    const loans = await TopUpLoan.find({ applicant: applicantId });

    return sendResponse(res, 200, loans);
  } catch (error) {
    next(error);
  }
};

export const getTopUpLoanById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const loan = await TopUpLoan.findById(id);

    if (!loan) {
      return next(new CustomError("Top-up loan not found", 404));
    }

    return sendResponse(res, 200, loan);
  } catch (error) {
    next(error);
  }
};

export const updateTopUpLoan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, status } = req.body;

    if (type && !["Personal", "Business"].includes(type)) {
      return next(new CustomError("Invalid loan type", 400));
    }

    if (status && !["Pending", "Approved", "Rejected"].includes(status)) {
      return next(new CustomError("Invalid status value", 400));
    }

    const updated = await TopUpLoan.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return next(new CustomError("Top-up loan not found or update failed", 404));
    }

    return sendResponse(res, 200, updated);
  } catch (error) {
    next(error);
  }
};

export const deleteTopUpLoan = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await TopUpLoan.findByIdAndDelete(id);

    if (!deleted) {
      return next(new CustomError("Top-up loan not found", 404));
    }

    return sendResponse(res, 200, { message: "Top-up loan deleted successfully" });
  } catch (error) {
    next(error);
  }
};



////Graph data representation
export const getCreditManagerStats = async (req, res, next) => {
  try {
    const creditMangerId = req.user._id;

    const totalLeads = await Leads.countDocuments({ creditManger: creditMangerId });
    const closedLeads = await Leads.countDocuments({ creditManger: creditMangerId, status: "CLOSED" });
    const avgCibil = await TopUpLoan.aggregate([
      { $match: { applicant: { $exists: true } } },
      { $group: { _id: null, avgScore: { $avg: "$cibilScore" } } },
    ]);

    return sendResponse(res, 200, {
      totalLeads,
      closedLeads,
      avgCibilScore: avgCibil[0]?.avgScore || 0,
    });
  } catch (error) {
    next(error);
  }
};

