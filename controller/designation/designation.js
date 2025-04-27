import designationModel from '../../model/designationModel.js';
import CustomError from '../../utils/customError.js';
import sendResponse from '../../utils/sendResponse.js';


export const createDesignation = async (req, res, next) => {
  const { designation } = req.body;

  // Check if the designation with the same name already exists
  const existingDesignation = await designationModel.findOne({ designation });
  if (existingDesignation) {
    return next(new CustomError("Designation with this name already exists", 400));
  }

  // Create a new designation
  const newDesignation = new designationModel({ designation });
  await newDesignation.save();
  sendResponse(res, 201, newDesignation);
};

export const getAllDesignations = async (req, res, next) => {
  // Fetch all designations that are not deleted
  const designations = await designationModel.find({ isDeleted: false });
  sendResponse(res, 200, designations);
};

export const getDesignationById = async (req, res, next) => {
  const { id } = req.params;

  // Check if the designation exists and is not deleted
  const designation = await designationModel.findById(id);
  if (!designation || designation.isDeleted) {
    return next(new CustomError("Designation not found or deleted", 404));
  }

  sendResponse(res, 200, designation);
};

export const updateDesignation = async (req, res, next) => {
  const { id } = req.params;
  const { designation } = req.body;

  // Check if the designation exists and is not deleted
  const existingDesignation = await designationModel.findById(id);
  if (!existingDesignation || existingDesignation.isDeleted) {
    return next(new CustomError("Designation not found or deleted", 404));
  }

  // Check if the new designation name already exists for another designation
  if (designation) {
    const duplicateDesignation = await designationModel.findOne({ designation });
    if (duplicateDesignation && duplicateDesignation._id.toString() !== existingDesignation._id.toString()) {
      return next(new CustomError("Designation with this name already exists", 400));
    }
  }

  // Update the designation
  await designationModel.findByIdAndUpdate(id, { designation });
  sendResponse(res, 200, { message: "Designation updated successfully" });
};

export const deleteDesignation = async (req, res, next) => {
  const { id } = req.params;

  // Check if the designation exists and is not deleted
  const designation = await designationModel.findById(id);
  if (!designation || designation.isDeleted) {
    return next(new CustomError("Designation not found or already deleted", 404));
  }

  // Soft delete the designation
  await designationModel.findByIdAndUpdate(id, { isDeleted: true });
  sendResponse(res, 200, { message: "Designation deleted successfully" });
};