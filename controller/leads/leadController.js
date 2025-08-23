import CustomError from '../../utils/customError.js';
import sendResponse from '../../utils/sendResponse.js';
import Leads from "../../model/leadsModel.js"
import loanTypeModel from '../../model/loanTypeModel.js';


export const bulkUploadLeads = async (req, res, next) => {
  try {
    const { branch, _id } = req.user;
    const leadsData = req.body;

    if (!Array.isArray(leadsData)) {
      return next(new CustomError("Request body must be an array of leads"));
    }

    // 1. Extract emails, phones, and loanTypeIds
    const emails = leadsData.map(l => l.email).filter(Boolean);
    const phones = leadsData.map(l => l.phone).filter(Boolean);
    const loanTypeIds = [
      ...new Set(leadsData.map(l => l.loanType).filter(Boolean))
    ];

    // 2. Validate loanTypes in DB
    const loanTypes = await loanTypeModel.find({
      _id: { $in: loanTypeIds },
      isDeleted: false,
    });

    const validLoanTypeIds = new Set(loanTypes.map(t => t._id.toString()));

    // 3. Check for missing loanTypes
    const missingLoanTypes = loanTypeIds.filter(id => !validLoanTypeIds.has(id));
    if (missingLoanTypes.length > 0) {
      return next(
        new CustomError(
          `Invalid loanType ids: ${missingLoanTypes.join(", ")}`,
          400
        )
      );
    }

    // 4. Check for duplicates by email/phone
    const existingLeads = await Leads.find({
      $or: [{ email: { $in: emails } }, { phone: { $in: phones } }],
    });

    const existingEmails = new Set(existingLeads.map(l => l.email));
    const existingPhones = new Set(existingLeads.map(l => l.phone));

    const uniqueLeads = [];
    const duplicateLeads = [];

    leadsData.forEach(lead => {
      const isDuplicate =
        existingEmails.has(lead.email) || existingPhones.has(lead.phone);

      if (!validLoanTypeIds.has(lead.loanType)) {
        duplicateLeads.push({ ...lead, reason: "Invalid loan type id" });
        return;
      }

      const formattedLead = {
        ...lead,
        branch,
        createdBy: _id,
      };

      if (isDuplicate) {
        duplicateLeads.push({ ...lead, reason: "Duplicate lead" });
      } else {
        uniqueLeads.push(formattedLead);
      }
    });

    // 5. Insert only unique leads
    const insertedLeads =
      uniqueLeads.length > 0 ? await Leads.insertMany(uniqueLeads) : [];

    return sendResponse(res, 200, {
      insertedLeads,
      duplicateLeads,
      hasDuplicates: duplicateLeads.length > 0,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllLeads = async (req, res, next) => {
  try {
    let { search, date, status, page = 1, limit = 10, sortBy = "LeadCreatedDate", order = "desc" } = req.query;
    const { type, branch, _id } = req.user;

    // --- Prepare filters based on role ---
    let query = {};
    if (type === "DATAENTRY") {
      query = { branch, createdBy: _id };
    } else if (type === "ADMIN") {
      query = { branch };
    } else if (type === "SUPERADMIN") {
      query = {}; // unrestricted
    }

    // --- Search by leadName ---
    if (search) {
      query.leadName = { $regex: search, $options: "i" };
    }

    // --- Status filter ---
    if (status) query.status = status;

    // --- Date filter ---
    if (date) {
      const timezone = "Asia/Kolkata";
      const startOfDay = moment.tz(date, timezone).startOf("day").toDate();
      const endOfDay = moment.tz(date, timezone).endOf("day").toDate();
      query.LeadCreatedDate = { $gte: startOfDay, $lte: endOfDay };
    }

    // --- Pagination setup ---
    page = Math.max(1, parseInt(page));
    limit = Math.max(1, Math.min(parseInt(limit), 100));
    const skip = (page - 1) * limit;

    // --- Sorting options ---
    const sortOptions = {
      leadName: { leadName: order === "asc" ? 1 : -1 },
      loanAmount: { loanAmount: order === "asc" ? 1 : -1 },
      LeadCreatedDate: { LeadCreatedDate: order === "asc" ? 1 : -1 },
      createdAt: { createdAt: order === "asc" ? 1 : -1 }
    };
    const sortCriteria = sortOptions[sortBy] || { LeadCreatedDate: -1 };

    // --- Query ---
    const [leads, total] = await Promise.all([
      Leads.find(query)
        .populate("loanType", "loanName")
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit)
        .lean(),
      Leads.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    // --- Meta response ---
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

export const getALeadByID = async (req, res, next) => {

  const { id } = req.params;
  const lead = await Leads.findById(id).populate("loanType", "loanName").populate("assignedTo", "firstName lastName").lean();
  if (!lead) {
    return next(new CustomError("Lead not found!"));
  }
  if (lead.loanType) lead.loanType = lead.loanType.loanName;
  if (lead.assignedTo) lead.assignedTo = `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`;

  sendResponse(res, 200, lead);
};

export const updateLead = async (req, res, next) => {
  const { id } = req.params;
  const { loanType, ...updateData } = req.body;

  if (loanType) {
    const loanTypeExists = await loanTypeModel.findOne({
      _id: loanType,
      isDeleted: false,
    });
    if (!loanTypeExists) {
      return next(new CustomError("Invalid loan type id", 400));
    }
    updateData.loanType = loanType;
  }

  const lead = await Leads.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  ).populate("loanType", "loanName");

  if (!lead) {
    return next(new CustomError("Lead not found"));
  }

  const leadObj = lead.toObject();
  if (leadObj.loanType && typeof leadObj.loanType === "object") {
    leadObj.loanType = leadObj.loanType.loanName;
  }

  sendResponse(res, 200, leadObj, { message: "Lead updated successfully." });
};

export const deleteLead = async (req, res, next) => {
  const { id } = req.params

  const lead = await Leads.findByIdAndDelete(id)

  if (!lead) {
    return next(new CustomError('Lead not found'))
  }

  sendResponse(res, 200, lead);
};

export const deleteAllLeads = async (req, res, next) => {
  const result = await Leads.deleteMany({});

  if (result.deletedCount === 0) {
    return next(new CustomError('No leads found to delete'));
  }

  sendResponse(res, 200, { success: true, deletedCount: result.deletedCount });
};

export const exportLeads = async (req, res, next) => {
  const { type, branch, _id } = req.user;
  const { search, date } = req.query;


  console.log(search, date, "ooooo");

  // Base query object based on user type
  let query = {};

  if (type === 'Data entry') {
    query = {
      branch: branch,
      createdBy: _id
    };
  } else if (type === 'Admin') {
    query = {
      branch: branch
    };
  } else if (type === 'SUPERADMIN') {
    query = {}; // No restrictions
  }

  // Add search filter
  if (search) {
    query.leadName = { $regex: search, $options: 'i' };
  }

  // Add date filter
  // if (date) {
  //     const filterDate = new Date(date);
  //     const nextDay = new Date(filterDate);
  //     nextDay.setDate(nextDay.getDate() + 1);

  //     query.LeadCreatedDate = {
  //         $gte: filterDate,
  //         $lt: nextDay
  //     };
  // }
  if (date && date !== 'null' && date !== '') {
    const filterDate = new Date(date);
    if (!isNaN(filterDate)) { // Check for valid date
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);

      query.LeadCreatedDate = {
        $gte: filterDate,
        $lt: nextDay
      };
    }
  }

  const leads = await Leads.find(query).populate("loanType").sort({ LeadCreatedDate: -1 });

  if (!leads) {
    return next(new CustomError('Leads not found'));
  }

  sendResponse(res, 200, leads);

};


