import bankPrototypeModal from "../../model/bankPrototypeModal.js";
import CustomError from "../../utils/customError.js";
import sendResponse from "../../utils/sendResponse.js";








export const createBank = async (req, res, next) => {
  const { name, city, area, logo } = req.body;

  // Check for existing bank with same name, city, and area
  const existingBank = await bankPrototypeModal.findOne({ name, city, area, isDeleted: false });
  if (existingBank) {
    return next(
      new CustomError("Bank with the same name, city, and area already exists", 400)
    );
  }

  const bank = new bankPrototypeModal({ name, city, area, logo });
  await bank.save();
  sendResponse(res, 201, bank);
};


export const getAllBanks = async (req, res, next) => {
  try {
    const banks = await bankPrototypeModal.find({ isDeleted: false });
    sendResponse(res, 200, banks);
  } catch (error) {
    next(error);
  }
};


export const getBankById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const bank = await bankPrototypeModal.findById(id);
    if (!bank || bank.isDeleted) {
      return next(new CustomError("Bank not found or deleted", 404));
    }

    sendResponse(res, 200, bank);
  } catch (error) {
    next(error);
  }
};



export const updateBank = async (req, res, next) => {
  const { id } = req.params;
  const { name, city, area, logo } = req.body;

  // Check if the bank exists and is not deleted
  const bank = await bankPrototypeModal.findById(id);
  if (!bank || bank.isDeleted) {
    return next(new CustomError("Bank not found or deleted", 404));
  }

  // Check if another bank exists with the same name, city, and area (excluding this bank)
  const duplicateBank = await bankPrototypeModal.findOne({
    _id: { $ne: id },
    name,
    city,
    area,
    isDeleted: false,
  });

  if (duplicateBank) {
    return next(
      new CustomError("Another bank with the same name, city, and area already exists", 400)
    );
  }

  // Perform update
  const updatedBank = await bankPrototypeModal.findByIdAndUpdate(
  id,
  { $set: { ...req.body } },
  { new: true }
);

if (!updatedBank) {
  return next(new CustomError("Bank update failed", 400));
}

sendResponse(res, 200, { message: "Bank updated successfully", bank: updatedBank });

};


export const deleteBank = async (req, res, next) => {
  try {
    const { id } = req.params;

    const bank = await bankPrototypeModal.findById(id);
    if (!bank || bank.isDeleted) {
      return next(new CustomError("Bank not found or already deleted", 404));
    }

    await bankPrototypeModal.findByIdAndUpdate(id, { isDeleted: true });
    sendResponse(res, 200, { message: "Bank deleted successfully" });
  } catch (error) {
    next(error);
  }
};

