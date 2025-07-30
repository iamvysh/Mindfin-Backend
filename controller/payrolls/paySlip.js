import mongoose from "mongoose";
import employeeModel from "../../model/employeeModel.js";
import paySlipModal from "../../model/paySlipModal.js";
import salaryEventModel from "../../model/salaryEventModel.js";
import CustomError from "../../utils/customError.js";
import sendResponse from "../../utils/sendResponse.js";



export const getAllPaySlips = async (req, res, next) => {
  const { type, branch } = req.user;
  const { page = 1, limit = 10, search = "", designation } = req.query;
  const skip = (page - 1) * limit;
  const query = {};

  let employeeFilter = {
    isDeleted: false,
  };

  if (search) {
    employeeFilter.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } }
    ];
  }
  if (type === 'HR' && branch) {
    employeeFilter.branch = branch;
  }
  if (designation) {
    employeeFilter.designation = designation;
  }

  const employees = await employeeModel.find(employeeFilter).select('_id');
  const employeeIds = employees.map(emp => emp._id);
  query.employee = { $in: employeeIds.length > 0 ? employeeIds : [null] };


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
    .sort({ createdAt: -1 })
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
  try {
    const { employee, month, year } = req.body;

    const isExist = await paySlipModal.findOne({ employee, month, year });
    if (isExist) {
      return next(new CustomError("Payslip already exists for this employee", 400));
    }

    const emp = await employeeModel.findById(employee);
    if (!emp) return next(new CustomError("Employee not found", 404));

    // Step 1: Fetch salary events (BONUS/HIKE) that are effective in this month
    const events = await salaryEventModel.find({
      employee,
      effectiveFrom: {
        $lte: new Date(`${month} 31, ${year}`),
      },
    });

    let hikeAmount = 0;
    let bonusAmount = 0;
    events.forEach(event => {
      if (event.type === "HIKE") hikeAmount += event.amount;
      if (event.type === "BONUS") bonusAmount += event.amount;
    });

    // Step 2: Calculate final salary fields
    const {
      salary = 0,
      housingAllowence = 0,
      transportAllowence = 0,
      utilityAllowence = 0,
      productivityAllowence = 0,
      communicationAllowence = 0,
      inconvenienceAllowence = 0,
    } = req.body; // can also fetch from a config

    const finalBasicSalary = salary + hikeAmount;
    const grossSalary =
      finalBasicSalary +
      housingAllowence +
      transportAllowence +
      utilityAllowence +
      productivityAllowence +
      communicationAllowence +
      inconvenienceAllowence +
      bonusAmount;

    const totalDeduction = req.body.totalDeduction || 0;
    const taxAmount = req.body.taxAmount || 0;
    const employeePension = req.body.employeePension || 0;

    const netSalary = grossSalary - (totalDeduction + taxAmount + employeePension);

    // Step 3: Create the payslip
    const newPaySlip = await paySlipModal.create({
      employee,
      title: req.body.title,
      level: req.body.level,
      basicSalary: finalBasicSalary,
      housingAllowence,
      transportAllowence,
      utilityAllowence,
      productivityAllowence,
      communicationAllowence,
      inconvenienceAllowence,
      hikeAmount,
      bonusAmount,
      grossSalary,
      tax: req.body.tax,
      taxAmount,
      employeePension,
      totalDeduction,
      netSalary,
      month,
      year,
    });

    sendResponse(res, 200, newPaySlip);
  } catch (err) {
    next(err);
  }
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

export const getEmployeeCounts = async (req, res, next) => {
  const { type, branch } = req.user;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Build the match condition dynamically
  const matchConditions = {
    isDeleted: false,
  };

  console.log(type, branch, "pp");

  // If the user is HR, limit to only employees in the same branch
  if (type === "HR" && branch) {
    matchConditions.branch = { $in: [new mongoose.Types.ObjectId(branch)] };
  }

  console.log(matchConditions, "mc");

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