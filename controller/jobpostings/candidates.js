import candidateModel from "../../model/candidateModel.js";
import CustomError from "../../utils/customError.js";
import sendResponse from "../../utils/sendResponse.js";






export const createCandidate = async (req, res, next) => {
    const { email, phone, appliedFor } = req.body;

    let exists = await candidateModel.findOne({ email, phone, appliedFor });
    if (exists) {
        return next(new CustomError("Candidate has already applied for this job", 400));
    }

    const newCandidate = await candidateModel.create(req.body);
    sendResponse(res, 200, newCandidate);
};

// export const getAllCandidates = async (req, res) => {
//     const { name, page = 1, limit = 10 } = req.query;
//     const filter = name ? { name: { $regex: name, $options: "i" } } : {};
    
//     const candidates = await candidateModel.find(filter)
//         .populate("appliedFor")
//         .skip((page - 1) * limit)
//         .limit(parseInt(limit));
    
//     const total = await candidateModel.countDocuments(filter);
    
//     sendResponse(res, 200, { candidates, total, page: parseInt(page), limit: parseInt(limit) });
// };

// export const getAllCandidates = async (req, res) => {
//     const { type, branch } = req.user; // assuming this comes from middleware
//     const { name, page = 1, limit = 10 } = req.query;

//     // Basic name filtering
//     const filter = name ? { name: { $regex: name, $options: "i" } } : {};

//     // If user is HR, we restrict to candidates whose applied job is from the HR's branch
//     let jobMatch = {};
//     if (type === 'HR') {
//         jobMatch = { branch: branch };
//     }

//         // Fetch candidates with filters and populate the applied job
//         const candidates = await candidateModel.find(filter)
//             .populate({
//                 path: "appliedFor",
//                 match: jobMatch,
//                 populate: [
//                     { path: "branch" },
//                     { path: "designation" }
//                 ]
//             })
//             .skip((page - 1) * limit)
//             .limit(parseInt(limit));

//         // Remove candidates whose appliedFor is null due to the branch mismatch (if HR)
//         const filteredCandidates = candidates.filter(c => c.appliedFor !== null);

//         // Total count of matching candidates (with branch filter if HR)
//         const total = filteredCandidates.length;

//         sendResponse(res, 200, {
//             candidates: filteredCandidates,
//             total,
//             page: parseInt(page),
//             limit: parseInt(limit)
//         });
   
// };

export const getAllCandidates = async (req, res, next) => {
    try {
      const { type, branch } = req.user;
      const { name, page = 1, limit = 10 } = req.query;
  
      const nameFilter = name ? { name: { $regex: name, $options: "i" } } : {};
  
      let jobMatch = {};
      if (type === "HR") {
        jobMatch.branch = branch;
      }
  
      const candidates = await candidateModel
        .find(nameFilter)
        .sort({createdAt:-1})
        .populate({
          path: "appliedFor",
          match: jobMatch,
          populate: [
            { path: "branch" },
            { path: "designation" },
          ],
        });
  
      // Filter out candidates whose appliedFor is null
      const filteredCandidates = candidates.filter(c => c.appliedFor !== null);
  
      const totalCandidate = filteredCandidates.length;
      const totalPage = Math.ceil(totalCandidate / limit);
      const currentPage = parseInt(page);
  
      // Apply pagination manually
      const paginatedCandidates = filteredCandidates.slice(
        (currentPage - 1) * limit,
        currentPage * limit
      );
  
      sendResponse(res, 200, {
        candidates: paginatedCandidates,
        totalCandidate,
        totalPage,
        currentPage,
      });
    } catch (error) {
      next(error);
    }
  };
  

export const getCandidateById = async (req, res, next) => {
    const { id } = req.params;
    const candidate = await candidateModel.findById(id)
    .populate({
        path: "appliedFor",
        populate: [
            { path: "branch" },
            { path: "designation" }
        ]
    });
        
    if (!candidate) {
        return next(new CustomError("Candidate not found", 404));
    }
    
    sendResponse(res, 200, candidate);
};

export const updateCandidate = async (req, res, next) => {
    const { id } = req.params;
    const updatedCandidate = await candidateModel.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!updatedCandidate) {
        return next(new CustomError("Candidate not found", 404));
    }
    
    sendResponse(res, 200, updatedCandidate);
};

export const deleteCandidate = async (req, res, next) => {
    const { id } = req.params;
    const deletedCandidate = await candidateModel.findByIdAndDelete(id);
    
    if (!deletedCandidate) {
        return next(new CustomError("Candidate not found", 404));
    }
    
    sendResponse(res, 200, { message: "Candidate deleted successfully" });
};