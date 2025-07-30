import salaryEventModel from "../../model/salaryEventModel.js";
import CustomError from "../../utils/customError.js";
import sendResponse from "../../utils/sendResponse.js";



export const createSalaryEvent = async (req, res, next) => {
    const { employee, type, amount, reason, effectiveFrom } = req.body;

    if (!employee || !type || !amount || !effectiveFrom) {
        return next(new CustomError("Missing required fields", 400));
    }

    const newEvent = await salaryEventModel.create({
        employee,
        type,
        amount,
        reason,
        effectiveFrom
    });

    sendResponse(res, 201, newEvent);
};

export const getAllSalaryEvents = async (req, res, next) => {
    const events = await salaryEventModel.find().populate("employee", "firstName lastName email");
    sendResponse(res, 200, events);
};

export const getSalaryEventsByEmployee = async (req, res, next) => {
    const { id } = req.params;
    const events = await salaryEventModel.find({ employee: id });
    sendResponse(res, 200, events);
};

export const updateSalaryEvent = async (req, res, next) => {
    const { id } = req.params;
    const updated = await salaryEventModel.findByIdAndUpdate(id, req.body, { new: true });

    if (!updated) return next(new CustomError("Salary event not found", 404));
    sendResponse(res, 200, updated);
};

export const deleteSalaryEvent = async (req, res, next) => {
    const { id } = req.params;
    const deleted = await salaryEventModel.findByIdAndDelete(id);
    if (!deleted) return next(new CustomError("Event not found", 404));

    sendResponse(res, 200, { message: "Event deleted successfully" });
};