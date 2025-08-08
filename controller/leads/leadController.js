import CustomError from '../../utils/customError.js';
import sendResponse from '../../utils/sendResponse.js';
import Leads from "../../model/leadsModel.js"
import loanTypeModel from '../../model/loanTypeModel.js';


export const bulkUploadLeads = async (req, res, next) => {
  try {
    const { branch, _id } = req.user;
    const leadsData = req.body;

    if (!Array.isArray(leadsData)) {
      return next(new CustomError('Request body must be an array of leads'));
    }

    // 1. Extract all emails, phones, and loanTypes from leads
    const emails = leadsData.map(lead => lead.email).filter(Boolean);
    const phones = leadsData.map(lead => lead.phone).filter(Boolean);
    const loanTypeNames = [
      ...new Set(leadsData.map(lead => lead.loanType).filter(Boolean))
    ];

    // 2. Get all matching loanTypes from DB
    const loanTypes = await loanTypeModel.find({
      loanName: { $in: loanTypeNames },
      isDeleted: false,
    });

    // 3. Create loanTypeMap { "Home Loan": ObjectId("...") }
    const loanTypeMap = {};
    loanTypes.forEach(type => {
      loanTypeMap[type.loanName.toLowerCase()] = type._id;
    });

    // 4. Check for missing loan types
    const missingLoanTypes = loanTypeNames.filter(
      name => !loanTypeMap[name.toLowerCase()]
    );
    if (missingLoanTypes.length > 0) {
      return next(
        new CustomError(
          `Missing loan types in DB: ${missingLoanTypes.join(", ")}`,
          400
        )
      );
    }

    // 5. Find existing leads by email/phone
    const existingLeads = await Leads.find({
      $or: [{ email: { $in: emails } }, { phone: { $in: phones } }],
    });

    const existingEmails = new Set(existingLeads.map(lead => lead.email));
    const existingPhones = new Set(existingLeads.map(lead => lead.phone));

    const uniqueLeads = [];
    const duplicateLeads = [];

    leadsData.forEach(lead => {
      const isDuplicate =
        existingEmails.has(lead.email) || existingPhones.has(lead.phone);

      const mappedLoanType = loanTypeMap[lead.loanType?.toLowerCase()];

      if (!mappedLoanType) {
        duplicateLeads.push({ ...lead, reason: "Invalid loan type" });
        return;
      }

      const formattedLead = {
        ...lead,
        loanType: mappedLoanType,
        branch: branch,
        createdBy: _id,
      };

      if (isDuplicate) {
        duplicateLeads.push(lead);
      } else {
        uniqueLeads.push(formattedLead);
      }
    });

    // Insert only unique leads
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
    const { type, branch, _id } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { search, date } = req.query;
    

    // Build base query object based on user type
    let query = {};

    if (type === 'DATAENTRY') {
        
        query = {
            branch: branch,
            createdBy: _id
        };
    } else if (type === 'ADMIN') {
        query = {
            branch: branch
        };
    } else if (type === 'SUPERADMIN') {
        query = {}; // No restrictions
    }

    // Add search condition if provided
    if (search) {
        query.leadName = { $regex: search, $options: 'i' };
    }

    // Add date filtering if provided
    if (date) {
        const filterDate = new Date(date);
        const nextDay = new Date(filterDate);
        nextDay.setDate(nextDay.getDate() + 1);

        query.LeadCreatedDate = {
            $gte: filterDate,
            $lt: nextDay
        };
    }


    try {
        const totalLeads = await Leads.countDocuments(query);
        const leads = await Leads.find(query)
            .populate("loanType")
            .skip(skip)
            .limit(limit)
            .sort({ LeadCreatedDate: -1 });

            

        const totalPages = Math.ceil(totalLeads / limit);

        sendResponse(res, 200, {
            leads,
            pagination: {
                currentPage: page,
                totalPages,
                totalLeads,
                leadsPerPage: limit
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getALeadByID = async (req,res,next) => {
    const {id} = req.params

    const lead = await Leads.findById(id)
    .populate("loanType")
    
    if(!lead){
        return next(new CustomError('Lead not found'))
    }

    sendResponse(res,200,lead)
}

export const updateLead = async (req,res,next) => {
    const {id} = req.params
    // const {leadName,email,phone,alternativePhone,branch,status,source,assignedTo} = req.body

    const lead = await Leads.findByIdAndUpdate(id,{$set:{...req.body}},{new:true})
    
    if(!lead){
        return next(new CustomError('Lead not found'))
    }

    sendResponse(res,200,lead)
}       

export const deleteLead = async (req,res,next) => {
    const {id} = req.params

    const lead = await Leads.findByIdAndDelete(id)
    
    if(!lead){
        return next(new CustomError('Lead not found'))
    }

    sendResponse(res,200,lead)
}       

export const exportLeads = async (req, res, next) => {
    const { type, branch, _id } = req.user;
    const { search, date } = req.query;
     

    console.log(search, date ,"ooooo");
    
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

        if (!leads ) {
            return next(new CustomError('Leads not found'));
        }

        sendResponse(res, 200, leads);
    
};


