import JobModel from "../../model/jobs.js"
import CustomError from "../../utils/customError.js";
import sendResponse from "../../utils/sendResponse.js";




// Create a new job
export const createJob = async (req, res, next) => {

  const { type, branch } = req.user;



        const {designation,jobType,jobTitle} = req.body

        let exisits = await JobModel.findOne({branch,designation,jobType,jobTitle,jobStatus:"ACTIVE"})

        if(exisits){
            return next(new CustomError("same job role for same branch is already active",400))
        }


        const newJob = await JobModel.create({ ...req.body, branch });
        sendResponse(res, 200, newJob);
   
};

// Get all jobs with filtering and pagination
// export const getAllJobs = async (req, res, next) => {
//         const { jobStatus, page = 1, limit = 10 } = req.query;

//         const filter = {};
//         if (jobStatus) {
//             filter.jobStatus = jobStatus;
//         }

//         const jobs = await JobModel.find(filter)
//             .skip((page - 1) * limit)
//             .limit(Number(limit));

//         const totalJobs = await JobModel.countDocuments(filter);

//         sendResponse(res, 200, {
//             totalJobs,
//             currentPage: Number(page),
//             totalPages: Math.ceil(totalJobs / limit),
//             jobs,
//         });
   
// };

export const getAllJobs = async (req, res, next) => {
      const { type, branch: userBranch } = req.user;
      const { jobStatus, page = 1, limit = 12,designation } = req.query;
  
      const filter = {};
  
      // If HR, restrict jobs to their branch
      if (type === 'HR') {
        filter.branch = userBranch;
      }
  
      // Apply jobStatus filter if provided
      if (jobStatus) {
        filter.jobType = jobStatus;
      }

      if(designation){
        filter.designation = designation
      }
  
      const jobs = await JobModel.find(filter).populate("branch designation")
        .skip((page - 1) * limit)
        .limit(Number(limit));
  
      const totalJobs = await JobModel.countDocuments(filter);
  
      sendResponse(res, 200, {
        totalJobs,
        currentPage: Number(page),
        totalPages: Math.ceil(totalJobs / limit),
        jobs,
      });
    
  };
  
  export const getAllJobsforModal = async (req, res, next) => {
    try {
      const { type, branch: userBranch } = req.user;
  
      const filter = {};
  
      // If HR, restrict jobs to their branch
      if (type === 'HR') {
        filter.branch = userBranch;
      }
  
      const jobs = await JobModel.find(filter).populate("branch designation");
  
      sendResponse(res, 200, 
        jobs,
      );
    } catch (error) {
      next(error);
    }
  };
  

// Get a single job by ID
export const getJobById = async (req, res, next) => {
        const job = await JobModel.findById(req.params.id).populate("branch designation")
        if (!job) {
            return next(new CustomError("Job not found", 404));
        }
        sendResponse(res, 200, job);
    
};

// Update a job
export const updateJob = async (req, res, next) => {
        const updatedJob = await JobModel.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!updatedJob) {
            return next(new CustomError("Job not found", 404));
        }

        sendResponse(res, 200, updatedJob);
   
};

// Delete a job
export const deleteJob = async (req, res, next) => {
        const deletedJob = await JobModel.findByIdAndDelete(req.params.id);
        if (!deletedJob) {
            return next(new CustomError("Job not found", 404));
        }
        sendResponse(res, 200, { message: "Job deleted successfully" });
   
};

export const updatePublish = async (req,res,next)=>{
  const {id} = req.params

  const updateStatus = await JobModel.findByIdAndUpdate(id,{$set:{isPublished:true,publishedDate:Date.now()}},{new:true})

  if (!updateStatus) {
    return next(new CustomError("Job not found with this ID", 404));
  }
  
  sendResponse(res,200,updateStatus)

}