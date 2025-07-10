import loanTypeModel from "../../model/loanTypeModel.js";
import CustomError from "../../utils/customError.js";
import sendResponse from "../../utils/sendResponse.js";






// Create LoanType
export const createLoanType = async (req, res, next) => {
  try {
    const { loanName } = req.body;

    const alreadyExists = await loanTypeModel.findOne({ loanName, isDeleted: false });
    if (alreadyExists) {
      return next(new CustomError("Loan type already exists", 400));
    }

    const loanType = await loanTypeModel.create({ loanName });
    // res.status(201).json({ success: true, data: loanType });
    sendResponse(res,200,loanType)
  } catch (err) {
    next(err);
  }
};

// Get All LoanTypes with Pagination
export const getAllLoanTypes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [loanTypes, total] = await Promise.all([
      loanTypeModel.find({ isDeleted: false }).skip(skip).limit(limit),
      loanTypeModel.countDocuments({ isDeleted: false }),
    ]);

    // res.status(200).json({
    //   success: true,
    //   total,
    //   page,
    //   pages: Math.ceil(total / limit),
    //   data: loanTypes,
    // });

    sendResponse(res,200,{
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: loanTypes,
    })
  } catch (err) {
    next(err);
  }
};

// Get Single LoanType by ID
export const getLoanTypeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const loanType = await loanTypeModel.findOne({ _id: id, isDeleted: false });
    if (!loanType) {
      return next(new CustomError("Loan type not found", 404));
    }

    // res.status(200).json({ success: true, data: loanType });

    sendResponse(res,200,loanType)
  } catch (err) {
    next(err);
  }
};

// Update LoanType
export const updateLoanType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { loanName } = req.body;

    const existing = await loanTypeModel.findOne({
      _id: { $ne: id },
      loanName,
      isDeleted: false,
    });

    if (existing) {
      return next(new CustomError("Another loan type with this name exists", 400));
    }

    const updated = await loanTypeModel.findByIdAndUpdate(id, { loanName }, { new: true });

    if (!updated || updated.isDeleted) {
      return next(new CustomError("Loan type not found or deleted", 404));
    }

    // res.status(200).json({ success: true, data: updated });

    sendResponse(res,200,updated)
  } catch (err) {
    next(err);
  }
};

// Delete LoanType (Soft Delete)
export const deleteLoanType = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await loanTypeModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!deleted) {
      return next(new CustomError("Loan type not found", 404));
    }

    // res.status(200).json({ success: true, message: "Loan type deleted" });
    sendResponse(res,200,deleted)
  } catch (err) {
    next(err);
  }
};