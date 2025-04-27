import branchModel from '../../model/branchModel.js';
import CustomError from '../../utils/customError.js';
import sendResponse from '../../utils/sendResponse.js';




export const createBranch = async (req, res, next) => {
  const { name, location } = req.body;

  // Check if the branch with the same name already exists
  const existingBranch = await branchModel.findOne({ name });
  if (existingBranch) {
    return next(new CustomError("Branch with this name already exists", 400));
  }

  // Create a new branch
  const branch = new branchModel({ name, location });
  await branch.save();
  sendResponse(res, 201, branch);
};

export const getAllBranches = async (req, res, next) => {
  // Fetch all branches that are not deleted
  const branches = await branchModel.find({ isDeleted: false });
  sendResponse(res, 200, branches);
};

export const getBranchById = async (req, res, next) => {
  const { id } = req.params;

  // Check if the branch exists and is not deleted
  const branch = await branchModel.findById(id);
  if (!branch || branch.isDeleted) {
    return next(new CustomError("Branch not found or deleted", 404));
  }

  sendResponse(res, 200, branch);
};

export const updateBranch = async (req, res, next) => {
  const { id } = req.params;
  const { name, location } = req.body;

  // Check if the branch exists and is not deleted
  const branch = await branchModel.findById(id);
  if (!branch || branch.isDeleted) {
    return next(new CustomError("Branch not found or deleted", 404));
  }

  // Check if the new name already exists for another branch
  if (name) {
    const existingBranch = await branchModel.findOne({ name });
    if (existingBranch && existingBranch._id.toString() !== branch._id.toString()) {
      return next(new CustomError("Branch with this name already exists", 400));
    }
  }

  // Update the branch
  await branchModel.findByIdAndUpdate(id, { name, location });
  sendResponse(res, 200, { message: "Branch updated successfully" });
};

export const deleteBranch = async (req, res, next) => {
  const { id } = req.params;

  // Check if the branch exists and is not deleted
  const branch = await branchModel.findById(id);
  if (!branch || branch.isDeleted) {
    return next(new CustomError("Branch not found or already deleted", 404));
  }

  // Soft delete the branch
  await branchModel.findByIdAndUpdate(id, { isDeleted: true });
  sendResponse(res, 200, { message: "Branch deleted successfully" });
};

