import mongoose from "mongoose";
import employeeModel from "../../model/employeeModel.js";
import paySlipModal from "../../model/paySlipModal.js";
import CustomError from "../../utils/customError.js";
import sendResponse from "../../utils/sendResponse.js";





// export const getAllPaySlips = async (req, res, next) => {
//         const { page = 1, limit = 10 } = req.query;
//         const paySlips = await paySlipModal.find().populate("tax")
//             .skip((page - 1) * limit)
//             .limit(Number(limit));
//         const total = await paySlipModal.countDocuments();

//         sendResponse(res, 200, { paySlips, total, page: Number(page), limit: Number(limit) });
   
// };



// export const getAllPaySlips = async (req, res, next) => {
//         const { type, branch } = req.user;
//         const { page = 1, limit = 10, search = "" } = req.query;

//         const skip = (page - 1) * limit;
//         const query = {};

//         // If user is HR, filter employees based on their branch
//         if (type === 'HR' && branch) {
//             // First, find employees under this HR branch
//             const employees = await employeeModel.find({
//                 branch: branch, // Match the ObjectId of the branch
//                 isDeleted: false,
//                 $or: [
//                     { firstName: { $regex: search, $options: "i" } },
//                     { lastName: { $regex: search, $options: "i" } }
//                 ]
//             }).select('_id');

//             const employeeIds = employees.map(emp => emp._id);
//             query.employee = { $in: employeeIds };
//         } else if (search) {
//             // For non-HR users with search
//             const employees = await employeeModel.find({
//                 isDeleted: false,
//                 $or: [
//                     { firstName: { $regex: search, $options: "i" } },
//                     { lastName: { $regex: search, $options: "i" } }
//                 ]
//             }).select('_id');

//             const employeeIds = employees.map(emp => emp._id);
//             query.employee = { $in: employeeIds };
//         }

//         const paySlips = await paySlipModal.find(query)
//             .populate({
//                 path: 'employee',
//                 select: 'firstName lastName branch',
//                 populate: { path: 'branch', select: 'name' }
//             })
//             .populate("tax")
//             .skip(skip)
//             .limit(Number(limit));

//         const total = await paySlipModal.countDocuments(query);

//         sendResponse(res, 200, { paySlips, total, page: Number(page), limit: Number(limit) });

   
// };

export const getAllPaySlips = async (req, res, next) => {
    const { type, branch } = req.user;
    const { page = 1, limit = 10, search = "", designation } = req.query;

    const skip = (page - 1) * limit;
    const query = {};

    let employeeFilter = {
        isDeleted: false,
    };

    // Apply search filter if provided
    if (search) {
        employeeFilter.$or = [
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } }
        ];
    }

    // Apply branch filter if user is HR
    if (type === 'HR' && branch) {
        employeeFilter.branch = branch;
    }

    // Apply designation filter if provided
    if (designation) {
        employeeFilter.designation = designation;
    }

    // Get matching employee IDs
    const employees = await employeeModel.find(employeeFilter).select('_id');
    const employeeIds = employees.map(emp => emp._id);

    // if (employeeIds.length > 0) {
    //     // query.employee = { $in: employeeIds };
    //     query.employee = { $in: employeeIds.length > 0 ? employeeIds : [null] };

    // }

    query.employee = { $in: employeeIds.length > 0 ? employeeIds : [null] };


    // console.log(query,"cori");
    
    const paySlips = await paySlipModal.find(query)
        .populate({
            path: 'employee',
            select: 'firstName lastName branch designation employeeType employeeId profileImg professionalEmail',
            populate: [
                { path: 'branch', select: 'name' },
                { path: 'designation', select: 'designation' }
            ]
        })
        .populate("tax")
        .sort({createdAt:-1})
        .skip(skip)
        .limit(Number(limit));

    const total = await paySlipModal.countDocuments(query);
    const totalPages = Math.ceil(total / limit);


    sendResponse(res, 200, {
        paySlips,
        total,
        totalPages,
        currentPage: Number(page),
        limit: Number(limit)
    });
};




export const getPaySlipById = async (req, res, next) => {
        const { id } = req.params;
        const paySlip = await paySlipModal.findById(id).populate("tax").populate({
            path: 'employee',
            select: 'firstName lastName branch designation employeeType employeeId profileImg professionalEmail',
            populate: [
                { path: 'branch', select: 'name' },
                { path: 'designation', select: 'designation' }
            ]
        });

        if (!paySlip) {
            return next(new CustomError("Pay slip record not found", 400));
        }
        sendResponse(res, 200, paySlip);
    
};

export const createPaySlip = async (req, res, next) => {
        
    const {employee,month,year} = req.body

       const isExist = await paySlipModal.findOne({employee,month,year})

     if (isExist){
        return next(new CustomError("payslip already exisit for this employee",400))
     }


        const newPaySlip = await paySlipModal.create(req.body);
        sendResponse(res, 200, newPaySlip);
   
};

export const updatePaySlip = async (req, res, next) => {
        const { id } = req.params;
        const updatedPaySlip = await paySlipModal.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedPaySlip) {
            return next(new CustomError("Pay slip record not found", 400));
        }
        sendResponse(res, 200, updatedPaySlip);
   
};

export const deletePaySlip = async (req, res, next) => {
        const { id } = req.params;
        const deletedPaySlip = await paySlipModal.findByIdAndDelete(id);

        if (!deletedPaySlip) {
            return next(new CustomError("Pay slip record not found", 400));
        }
        sendResponse(res, 200, { message: "Pay slip record deleted successfully" });
    
};


// export const getEmployeeCounts = async (req, res,next) => {

//     const { type, branch } = req.user;
//     // Define the date range for new employees (e.g., last 30 days)
//         const thirtyDaysAgo = new Date();
//         thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

//         // Aggregate query to get the counts
//         const counts = await employeeModel.aggregate([
//             {
//                 $match: { isDeleted: false } // Exclude deleted employees
//             },
//             {
//                 $group: {
//                     _id: null,
//                     totalEmployees: { $sum: 1 },
//                     newEmployees: {
//                         $sum: {
//                             $cond: [{ $gte: ["$dateOfJoin", thirtyDaysAgo] }, 1, 0]
//                         }
//                     },
//                     maleEmployees: {
//                         $sum: {
//                             $cond: [{ $eq: ["$gender", "MALE"] }, 1, 0]
//                         }
//                     },
//                     femaleEmployees: {
//                         $sum: {
//                             $cond: [{ $eq: ["$gender", "FEMALE"] }, 1, 0]
//                         }
//                     }
//                 }
//             }
//         ]);

//         // Extract the counts from the aggregation result
//         const result = counts[0] || {
//             totalEmployees: 0,
//             newEmployees: 0,
//             maleEmployees: 0,
//             femaleEmployees: 0
//         };

//         sendResponse(res,200,result)

   
// };



export const getEmployeeCounts = async (req, res, next) => {
      const { type, branch } = req.user;
  
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
      // Build the match condition dynamically
      const matchConditions = {
        isDeleted: false,
      };
  
      console.log(type,branch,"pp");
      
      // If the user is HR, limit to only employees in the same branch
      if (type === "HR" && branch) {
        matchConditions.branch = { $in: [new mongoose.Types.ObjectId(branch)] };
    }
  
      console.log(matchConditions,"mc");
      
      const counts = await employeeModel.aggregate([
        {
          $match: matchConditions,
        },
        {
          $group: {
            _id: null,
            totalEmployees: { $sum: 1 },
            newEmployees: {
              $sum: {
                $cond: [{ $gte: ["$dateOfJoin", thirtyDaysAgo] }, 1, 0],
              },
            },
            maleEmployees: {
              $sum: {
                $cond: [{ $eq: ["$gender", "MALE"] }, 1, 0],
              },
            },
            femaleEmployees: {
              $sum: {
                $cond: [{ $eq: ["$gender", "FEMALE"] }, 1, 0],
              },
            },
          },
        },
      ]);
  
      const result = counts[0] || {
        totalEmployees: 0,
        newEmployees: 0,
        maleEmployees: 0,
        femaleEmployees: 0,
      };
  
      sendResponse(res, 200, result);
    
  };
  

// export const getMonthlySalaryTotals = async (req, res,next) => {
//         // Get the current month and year

//         const {type,branch} = req.user
//         const now = new Date();
//         const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//         const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

//         // Aggregate query to get the total amounts for the current month
//         const totals = await paySlipModal.aggregate([
//             {
//                 $match: {
//                     createdAt: {
//                         $gte: startOfMonth,
//                         $lte: endOfMonth
//                     }
//                 }
//             },
//             {
//                 $group: {
//                     _id: null,
//                     totalNetSalary: { $sum: "$netSalary" },
//                     totalGrossSalary: { $sum: "$grossSalary" },
//                     totalTax: { $sum: "$taxAmount" }
//                 }
//             }
//         ]);

//         // Extract the totals from the aggregation result
//         const result = totals[0] || {
//             totalNetSalary: 0,
//             totalGrossSalary: 0,
//             totalTax: 0
//         };

//         sendResponse(res,200,result)

    
// };





// export const getMonthlySalaryTotals = async (req, res, next) => {
//   const { type, branch } = req.user;

//   const now = new Date();
//   const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//   const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

//   const matchStage = {
//     createdAt: {
//       $gte: startOfMonth,
//       $lte: endOfMonth
//     }
//   };

//   const pipeline = [
//     {
//       $match: matchStage
//     },
//     {
//       $lookup: {
//         from: "employees", 
//         localField: "employee",
//         foreignField: "_id",
//         as: "employeeData"
//       }
//     },
//     {
//       $unwind: "$employeeData"
//     }
//   ];

//   if (type === 'HR') {
//     pipeline.push({
//       $match: {
//         "employeeData.branch": { $in: [new mongoose.Types.ObjectId(branch)] } // Ensure `branch` is an ObjectId if needed
//       }
//     });
//   }

//   pipeline.push({
//     $group: {
//       _id: null,
//       totalNetSalary: { $sum: "$netSalary" },
//       totalGrossSalary: { $sum: "$grossSalary" },
//       totalTax: { $sum: "$taxAmount" }
//     }
//   });

//   const totals = await paySlipModal.aggregate(pipeline);

//   const result = totals[0] || {
//     totalNetSalary: 0,
//     totalGrossSalary: 0,
//     totalTax: 0
//   };

//   sendResponse(res, 200, result);
// };


export const getMonthlySalaryTotals = async (req, res, next) => {
  const { type, branch } = req.user;

  const now = new Date();
  const currentMonth = now.toLocaleString("default", { month: "long" }); // e.g., "May"
  const currentYear = now.getFullYear();

  const matchStage = {
    month: currentMonth,
    year: currentYear
  };

  const pipeline = [
    {
      $match: matchStage
    },
    {
      $lookup: {
        from: "employees",
        localField: "employee",
        foreignField: "_id",
        as: "employeeData"
      }
    },
    {
      $unwind: "$employeeData"
    }
  ];

  if (type === "HR") {
    pipeline.push({
      $match: {
        "employeeData.branch": {
          $in: [new mongoose.Types.ObjectId(branch)]
        }
      }
    });
  }

  pipeline.push({
    $group: {
      _id: null,
      totalNetSalary: { $sum: "$netSalary" },
      totalGrossSalary: { $sum: "$grossSalary" },
      totalTax: { $sum: "$taxAmount" }
    }
  });

  try {
    const totals = await paySlipModal.aggregate(pipeline);

    const result = totals[0] || {
      totalNetSalary: 0,
      totalGrossSalary: 0,
      totalTax: 0
    };

    sendResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
};