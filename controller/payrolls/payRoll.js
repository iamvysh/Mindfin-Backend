import payRollModel from "../../model/payRollModel.js";
import CustomError from "../../utils/customError.js";
import sendResponse from "../../utils/sendResponse.js";





export const getAllPayRolls = async (req, res, next) => {

    //   const {branch,type} =req.user

    //     const { page = 1, limit = 10 } = req.query;
    //     const payRolls = await payRollModel.find().populate("designation designation")
    //         .skip((page - 1) * limit)
    //         .limit(Number(limit));
    //     const total = await payRollModel.countDocuments();

    //     sendResponse(res, 200, { payRolls, total, page: Number(page), limit: Number(limit) });
    const { branch, type } = req.user;
    const { page = 1, limit = 10 } = req.query;

    // If user is HR, only fetch payrolls from their own branch
    const filter = type === 'HR' ? { branch } : {};

    const payRolls = await payRollModel
      .find(filter)
      .populate("designation","designation")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await payRollModel.countDocuments(filter);

    sendResponse(res, 200, {
      payRolls,
      total,
      page: Number(page),
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

// export const createPayRoll = async (req, res, next) => {

//     const {type,branch} = req.user
        
//         const { paymentName, designation, paymentMonth, paymentYear } = req.body;
        
//         const existingPayRoll = await payRollModel.findOne({ paymentName, designation, paymentMonth, paymentYear,branch });
//         if (existingPayRoll) {
//             return next(new CustomError("Payroll entry already exists for this month and year", 400));
//         }
        
//         const newPayRoll = await payRollModel.create(req.body);
//         sendResponse(res, 200, newPayRoll);
   
// };

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
        const { id } = req.params;
        const updatedPayRoll = await payRollModel.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedPayRoll) {
            return next(new CustomError("Payroll record not found", 400));
        }
        sendResponse(res, 200, updatedPayRoll);
    
};

export const deletePayRoll = async (req, res, next) => {
        const { id } = req.params;
        const deletedPayRoll = await payRollModel.findByIdAndDelete(id);

        if (!deletedPayRoll) {
            return next(new CustomError("Payroll record not found", 400));
        }
        sendResponse(res, 200, { message: "Payroll record deleted successfully" });
    
};
