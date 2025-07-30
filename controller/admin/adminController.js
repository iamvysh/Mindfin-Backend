import CustomError from '../../utils/customError.js';
import sendResponse from '../../utils/sendResponse.js';
import Leads from "../../model/leadsModel.js"
import employeeModel from '../../model/employeeModel.js';
import designationModel from '../../model/designationModel.js';
import mongoose from 'mongoose';





export const getAllTelecallers = async(req,res,next)=>{

     const { branch } = req.user;

     console.log(branch,"branch");
     

        if (!branch) {
            return next(new CustomError("Branch ID is missing in the user object", 400));
        }

        const telecallers = await employeeModel.find({
            branch: new mongoose.Types.ObjectId(branch),
            // branch: branch,
            isDeleted: false
        })
        .populate({
            path: 'designation',
            match: { designation: 'Tele caller' } // match the designation name
        });
         

        // console.log(telecallers,"telecallers");
        


        // Filter out employees whose designation was not matched
        const filteredTelecallers = telecallers.filter(emp => emp.designation !== null);

        return sendResponse(res, 200, filteredTelecallers);
}

export const assignLeadToEmployee = async (req, res, next) => {
        const { leadId, employeeId } = req.body;

        // Validate inputs
        if (!leadId || !employeeId) {
            return next(new CustomError("leadId and employeeId are required", 400));
        }

        // Ensure valid MongoDB ObjectIds
        if (!mongoose.Types.ObjectId.isValid(leadId) || !mongoose.Types.ObjectId.isValid(employeeId)) {
            return next(new CustomError("Invalid leadId or employeeId", 400));
        }

        // Find and update the lead
        const updatedLead = await Leads.findByIdAndUpdate(
            leadId,
            { assignedTo: employeeId ,AssignedDate: new Date()},
            { new: true }
        ).populate('assignedTo', 'firstName lastName email'); // optional: show assigned employee info

        if (!updatedLead) {
            return next(new CustomError("Lead not found", 404));
        }

        return sendResponse(res, 200,updatedLead);
   
};

export const getMonthlyLeadCountsByDesignation = async (req, res, next) => {
    // try {
    //     // Get current month range
    //     const now = new Date();
    //     const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    //     const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    //     // Step 1: Find IDs of desired designations
    //     const designationsToTrack = ["Admin", "Data entry", "Digital Marketing"];

    //     const designationDocs = await designationModel.find({
    //         designation: { $in: designationsToTrack }
    //     });

    //     const designationMap = {};
    //     designationDocs.forEach(d => {
    //         designationMap[d._id.toString()] = d.designation;
    //     });

    //     const designationIds = designationDocs.map(d => d._id);

    //     // Step 2: Aggregate leads created this month by users with those designations
    //     const results = await Leads.aggregate([
    //         {
    //             $match: {
    //                 LeadCreatedDate: {
    //                     $gte: startOfMonth,
    //                     $lte: endOfMonth
    //                 }
    //             }
    //         },
    //         {
    //             $lookup: {
    //                 from: "employees",
    //                 localField: "createdBy",
    //                 foreignField: "_id",
    //                 as: "creator"
    //             }
    //         },
    //         { $unwind: "$creator" },
    //         {
    //             $match: {
    //                 "creator.designation": { $in: designationIds }
    //             }
    //         },
    //         {
    //             $group: {
    //                 _id: "$creator.designation",
    //                 totalLeads: { $sum: 1 }
    //             }
    //         }
    //     ]);

    //     // Step 3: Map back to readable designation names
    //     const leadCounts = {};
    //     designationsToTrack.forEach(d => {
    //         leadCounts[d] = 0; // default to 0
    //     });

    //     results.forEach(r => {
    //         const designationId = r._id.toString();
    //         const readableName = designationMap[designationId];
    //         if (readableName) {
    //             leadCounts[readableName] = r.totalLeads;
    //         }
    //     });

    //     return sendResponse(res, 200, leadCounts);
    // } catch (err) {
    //     next(err);
    // }

      try {
        const { branch } = req.user;

        if (!branch) {
            return next(new CustomError("Branch ID is required", 400));
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const designationsToTrack = ["Admin", "Data entry", "Digital Marketing"];

        // Step 1: Get designation IDs
        const designationDocs = await designationModel.find({
            designation: { $in: designationsToTrack }
        });

        const designationMap = {};
        designationDocs.forEach(d => {
            designationMap[d._id.toString()] = d.designation;
        });

        const designationIds = designationDocs.map(d => d._id);

        // Step 2: Aggregate leads created this month in the given branch
        const results = await Leads.aggregate([
            {
                $match: {
                    LeadCreatedDate: { $gte: startOfMonth, $lte: endOfMonth },
                    branch: new  mongoose.Types.ObjectId(branch)
                }
            },
            {
                $lookup: {
                    from: "employees",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "creator"
                }
            },
            { $unwind: "$creator" },
            {
                $match: {
                    "creator.designation": { $in: designationIds }
                }
            },
            {
                $group: {
                    _id: "$creator.designation",
                    totalLeads: { $sum: 1 }
                }
            }
        ]);

        // Step 3: Map results back to readable designation names
        const leadCounts = {};
        designationsToTrack.forEach(d => {
            leadCounts[d] = 0;
        });

        results.forEach(r => {
            const designationId = r._id.toString();
            const readableName = designationMap[designationId];
            if (readableName) {
                leadCounts[readableName] = r.totalLeads;
            }
        });

        return sendResponse(res, 200,leadCounts);
    } catch (err) {
        next(err);
    }
}

export const getLeadCountsByMonthAndDesignation = async (req, res, next) => {
    try {
        const { month, year } = req.query;
        const { branch } = req.user;

        if (!branch) {
            return next(new CustomError("Branch ID is required", 400));
        }

        // Get current date if not provided
        const now = new Date();
        const selectedMonth = month ? parseInt(month) - 1 : now.getMonth(); // JS months are 0-indexed
        const selectedYear = year ? parseInt(year) : now.getFullYear();

        const startOfMonth = new Date(selectedYear, selectedMonth, 1);
        const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

        const designationsToTrack = ["Admin", "Data entry", "Digital Marketing"];


        // Find designations from DB
        const designationDocs = await designationModel.find({
            designation: { $in: designationsToTrack }
        });

        const designationMap = {};
        designationDocs.forEach(d => {
            designationMap[d._id.toString()] = d.designation;
        });

        const designationIds = designationDocs.map(d => d._id);

        // Aggregate
        const results = await Leads.aggregate([
            {
                $match: {
                    LeadCreatedDate: {
                        $gte: startOfMonth,
                        $lte: endOfMonth
                    },              
                   branch: new mongoose.Types.ObjectId(branch)

                }
            },
            {
                $lookup: {
                    from: "employees",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "creator"
                }
            },
            { $unwind: "$creator" },
            {
                $match: {
                    "creator.designation": { $in: designationIds }
                }
            },
            {
                $group: {
                    _id: "$creator.designation",
                    totalLeads: { $sum: 1 }
                }
            }
        ]);

        // Prepare response object
        const leadCounts = {};
        designationsToTrack.forEach(d => {
            leadCounts[d] = 0; // default to 0
        });

        results.forEach(r => {
            const designationId = r._id.toString();
            const readable = designationMap[designationId];
            if (readable) {
                leadCounts[readable] = r.totalLeads;
            }
        });

        return sendResponse(
            res,
            200,
            leadCounts
        );
    } catch (err) {
        next(err);
    }
};

export const getBranchTelecallerLeadCounts = async (req, res, next) => {
    try {

        const {branch}  = req.user
        const { month, year } = req.query;

        if (!branch) {
            return next(new CustomError("Branch ID is required", 400));
        }

        // Compute month boundaries
        const now = new Date();
        const selectedMonth = month ? parseInt(month) - 1 : now.getMonth();
        const selectedYear = year ? parseInt(year) : now.getFullYear();

        const startOfMonth = new Date(selectedYear, selectedMonth, 1);
        const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

        // Step 1: Get TELECALLER designation ID
        const telecallerDesignation = await designationModel.findOne({
            designation: "Tele caller"
        });

        if (!telecallerDesignation) {
            return next(new CustomError("TELECALLER designation not found", 404));
        }

        // Step 2: Get all telecallers in that branch
        const telecallers = await employeeModel.find({
            designation: telecallerDesignation._id,
            branch: branch,
            isDeleted: false
        });

        const telecallerIds = telecallers.map(e => e._id);

        if (telecallerIds.length === 0) {
            return sendResponse(res, 200, true, "No telecallers found for this branch", []);
        }

        // Step 3: Aggregate lead counts per telecaller
        const leadCounts = await Leads.aggregate([
            {
                $match: {
                    assignedTo: { $in: telecallerIds },
                    AssignedDate: {
                        $gte: startOfMonth,
                        $lte: endOfMonth
                    }
                }
            },
            {
                $group: {
                    _id: "$assignedTo",
                    leadCount: { $sum: 1 }
                }
            }
        ]);

        // Step 4: Combine telecaller data with lead counts
        const leadCountMap = {};
        leadCounts.forEach(l => {
            leadCountMap[l._id.toString()] = l.leadCount;
        });

        const result = telecallers.map(emp => ({
            _id: emp._id,
            name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
            email: emp.email,
            leadCount: leadCountMap[emp._id.toString()] || 0
        }));

        return sendResponse(
            res,
            200,
          
            result
        );
    } catch (err) {
        next(err);
    }
};