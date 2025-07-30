import salaryDefinitionModal from "../../model/salaryDefinitionModal.js";
import CustomError from "../../utils/customError.js";
import sendResponse from "../../utils/sendResponse.js";



export const getAllSalaryDefinitions = async (req, res, next) => {

        const salaries = await salaryDefinitionModal.find();
        sendResponse(res, 200, salaries);
   
};

export const getSalaryDefinitionsById = async (req, res, next) => {

        const { id } = req.params;
        const salary = await salaryDefinitionModal.findById(id);

        if (!salary) {
            return next(new CustomError("Salary record not found", 400));
        }
        sendResponse(res, 200, salary);
   
};

export const createSalaryDefinitions = async (req, res, next) => {

       const {designation} = req.body

       const exist = await salaryDefinitionModal.findOne({designation})

       if(exist){
        return next(new CustomError("Salary record with the same designation name is exists", 400));

       }

        const newSalary = await salaryDefinitionModal.create(req.body);
        sendResponse(res, 200, newSalary);
    
};

export const updateSalaryDefinitions = async (req, res, next) => {
        const { id } = req.params;
        const updatedSalary = await salaryDefinitionModal.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedSalary) {
            return next(new CustomError("Salary record not found", 400));
        }
        sendResponse(res, 200, updatedSalary);
    
};

export const deleteSalaryDefinitions = async (req, res, next) => {
        const { id } = req.params;
        const deletedSalary = await salaryDefinitionModal.findByIdAndDelete(id);

        if (!deletedSalary) {
            return next(new CustomError("Salary record not found", 400));
        }
        sendResponse(res, 200, { message: "Salary record deleted successfully" });
    
};