import payRollModel from "../../model/payRollModel.js";
import CustomError from "../../utils/customError.js";
import sendResponse from "../../utils/sendResponse.js";





export const getAllPayRolls = async (req, res, next) => {


  const { branch, type } = req.user;
  const { page = 1, limit = 10 } = req.query;

  // If user is HR, only fetch payrolls from their own branch
  const filter = type === 'HR' ? { branch } : {};

  const payRolls = await payRollModel
    .find(filter)
    .sort({ createdAt: -1 })
    .populate("designation", "designation")
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await payRollModel.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);

  sendResponse(res, 200, {
    payRolls,
    total,
    totalPages,
    currentPage: Number(page),
    limit: Number(limit),
  })
};

export const getPayRollById = async (req, res, next) => {
  const { id } = req.params;
  const payRoll = await payRollModel.findById(id);

  if (!payRoll) {
    return next(new CustomError("Payroll record not found", 400));
  }
  sendResponse(res, 200, payRoll);

};

export const createPayRoll = async (req, res, next) => {

  const { type, branch: userBranch } = req.user;
  const {
    paymentName,
    designation,
    paymentMonth,
    paymentYear,
    branch: bodyBranch,
  } = req.body;

  const branch = type === 'HR' ? userBranch : bodyBranch;

  if (!branch) {
    return next(new CustomError("Branch is required", 400));
  }

  const existingPayRoll = await payRollModel.findOne({
    paymentName,
    designation,
    paymentMonth,
    paymentYear,
    branch,
  });

  if (existingPayRoll) {
    return next(
      new CustomError("Payroll entry already exists for this month and year", 400)
    );
  }

  const newPayRoll = await payRollModel.create({
    ...req.body,
    branch,
  });

  sendResponse(res, 200, newPayRoll);

};

export const updatePayRoll = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { designation, branch, paymentMonth, paymentYear } = req.body;

    // Check for existing record with same designation, branch, month, and year, excluding current one
    const existing = await payRollModel.findOne({
      _id: { $ne: id }, // Exclude the document being updated
      designation,
      branch,
      paymentMonth,
      paymentYear,
    });

    if (existing) {
      return next(
        new CustomError(
          "Payroll with this designation, branch, month, and year already exists.",
          400
        )
      );
    }

    // Proceed to update if no conflict
    const updatedPayRoll = await payRollModel.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updatedPayRoll) {
      return next(new CustomError("Payroll record not found", 400));
    }

    sendResponse(res, 200, updatedPayRoll);
  } catch (error) {
    next(error);
  }
};

export const deletePayRoll = async (req, res, next) => {
  const { id } = req.params;
  const deletedPayRoll = await payRollModel.findByIdAndDelete(id);

  if (!deletedPayRoll) {
    return next(new CustomError("Payroll record not found", 400));
  }
  sendResponse(res, 200, { message: "Payroll record deleted successfully" });

};
