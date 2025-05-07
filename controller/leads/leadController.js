import CustomError from '../../utils/customError.js';
import sendResponse from '../../utils/sendResponse.js';
import Leads from '../model/leadsModel.js';

export const bulkUploadLeads = async (req, res,next) => {

        const {type,branch} = req.user
        const leadsData = req.body;

        // Validate if the request body is an array
        if (!Array.isArray(leadsData)) {
            
            return next(new CustomError('Request body must be an array of leads'));
        }

        // Add current date to each lead
        const leadsWithDate = leadsData.map(lead => ({
            ...lead,
            branch: branch
        }));

        // Insert multiple leads
        const insertedLeads = await Leads.insertMany(leadsWithDate);

       
         sendResponse(res,200,insertedLeads)
   
}; 


export const getAllLeads = async (req,res,next) => {
        const {type, branch} = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { search, date } = req.query;

        // Build query object
        let query = type === 'SUPERADMIN' ? {} : {branch: branch};

        // Add search by leadName if provided
        if (search) {
            query.leadName = { $regex: search, $options: 'i' }; // Case-insensitive search
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
        
        // Get total count for pagination
        const totalLeads = await Leads.countDocuments(query);
        
        // Get paginated leads
        const leads = await Leads.find(query)
            .skip(skip)
            .limit(limit)
            .sort({ LeadCreatedDate: -1 }); // Sort by creation date, newest first

        // Calculate total pages
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
   
}

export const getALeadByID = async (req,res,next) => {
    const {id} = req.params

    const lead = await Leads.findById(id)
    
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

export const exportLeads = async (req,res,next) => {
    const {type, branch} = req.user;
    const { search, date } = req.query;

    // Build query object
    let query = type === 'SUPERADMIN' ? {} : {branch: branch};

    const leads = await Leads.find(query)           
            .sort({ LeadCreatedDate: -1 }); 
        
    if(!leads){ 
        return next(new CustomError('Leads not found'))
    }

    sendResponse(res,200,leads) 
}   



