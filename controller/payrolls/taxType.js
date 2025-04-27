
import taxModel from "../../model/taxModel.js";
import CustomError from "../../utils/customError.js";
import sendResponse from "../../utils/sendResponse.js";


// CREATE Tax
export const createTax = async (req, res, next) => {
        const { taxType, branch, value } = req.body;

        // Check for duplicate
        const existingTax = await taxModel.findOne({ taxType, branch });
        if (existingTax) {
            return next(new CustomError("Tax with this type already exists for the branch", 400));
        }

        const newTax = await taxModel.create({ taxType, branch, value });
        sendResponse(res, 201, { message: "Tax created successfully", data: newTax });
    
};

// GET ALL Taxes
export const getAllTaxes = async (req, res, next) => {

    const {type,branch} = req.user
    let query = {};

    if (type === "HR") {
      query.branch = branch; 
    }

        const taxes = await taxModel.find(query).populate("branch");
        sendResponse(res, 200, { data: taxes });
   
};

// GET Tax by ID
export const getTaxById = async (req, res, next) => {
        const { id } = req.params;
        const tax = await taxModel.findById(id).populate("branch");

        if (!tax) {
            return next(new CustomError("Tax not found", 404));
        }

        sendResponse(res, 200, { data: tax });
    
};

// UPDATE Tax
export const updateTax = async (req, res, next) => {
        const { id } = req.params;
        const { taxType, branch, value } = req.body;

        // Check for duplicate taxType and branch combo
        const existingTax = await taxModel.findOne({ taxType, branch, _id: { $ne: id } });
        if (existingTax) {
            return next(new CustomError("Another tax with this type already exists for the branch", 400));
        }

        const updatedTax = await taxModel.findByIdAndUpdate(id, { taxType, branch, value }, { new: true });

        if (!updatedTax) {
            return next(new CustomError("Tax not found", 404));
        }

        sendResponse(res, 200, { message: "Tax updated successfully", data: updatedTax });
   
};

// DELETE Tax
export const deleteTax = async (req, res, next) => {
        const { id } = req.params;
        const deletedTax = await taxModel.findByIdAndDelete(id);

        if (!deletedTax) {
            return next(new CustomError("Tax record not found", 400));
        }

        sendResponse(res, 200, { message: "Tax record deleted successfully" });
   
};
