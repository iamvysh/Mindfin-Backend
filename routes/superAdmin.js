import express from "express";
import { tryCatchMiddleware } from "../utils/tryCatch.js";
import { primaryValidater, PermittedToSuperAdminAndHR } from "../middleware/auth.js";
import { createBranch, deleteBranch, getAllBranches, getBranchById, updateBranch } from "../controller/branch/branch.js";
import { createDesignation, deleteDesignation, getAllDesignations, getDesignationById, updateDesignation } from "../controller/designation/designation.js";
import { createTax, deleteTax, getAllTaxes, getTaxById, updateTax } from "../controller/payrolls/taxType.js";
import { createBank, deleteBank, getAllBanks, getBankById, updateBank } from "../controller/bank/bankController.js";
import { createLoanType, deleteLoanType, getAllLoanTypes, getLoanTypeById, updateLoanType } from "../controller/loanType/loanTypeontroller.js";
import { createSalaryEvent, getAllSalaryEvents, getSalaryEventsByEmployee, updateSalaryEvent, deleteSalaryEvent } from '../controller/payrolls/salaryEvent.js';
import { getAllSalaryDefinitions, getSalaryDefinitionsById, createSalaryDefinitions, updateSalaryDefinitions, deleteSalaryDefinitions } from "../controller/payrolls/salaryDefinition.js";

const router = express.Router();


// Branches
router.post("/add-branch", tryCatchMiddleware(createBranch))
router.get("/get-all-branch", tryCatchMiddleware(getAllBranches))
router.get("/get-a-branch/:id", tryCatchMiddleware(getBranchById))
router.put("/update-branch/:id", tryCatchMiddleware(updateBranch))
router.put("/delete-branch/:id", tryCatchMiddleware(deleteBranch))


// Designation
router.post("/add-designation", tryCatchMiddleware(createDesignation))
router.get("/get-all-desigantions", tryCatchMiddleware(getAllDesignations))
router.get("/get-a-designation/:id", tryCatchMiddleware(getDesignationById))
router.put("/update-designation/:id", tryCatchMiddleware(updateDesignation))
router.put("/delete-designation/:id", tryCatchMiddleware(deleteDesignation))


// Tax
router.post("/create-tax", tryCatchMiddleware(createTax))
router.get("/get-all-tax", primaryValidater, tryCatchMiddleware(getAllTaxes))
router.get("/get-tax/:id", tryCatchMiddleware(getTaxById))
router.put("/update-tax/:id", tryCatchMiddleware(updateTax))
router.delete("/delete-tax/:id", tryCatchMiddleware(deleteTax))


// Bank
router.post("/create-bank", tryCatchMiddleware(createBank))
router.get("/get-all-banks", tryCatchMiddleware(getAllBanks))
router.get("/get-a-bank/:id", tryCatchMiddleware(getBankById))
router.put("/update-a-bank/:id", tryCatchMiddleware(updateBank))
router.delete("/delete-bank/:id", tryCatchMiddleware(deleteBank))


// loan Type
router.post("/add-loan-type", tryCatchMiddleware(createLoanType))
router.get("/get-all-loan-type", tryCatchMiddleware(getAllLoanTypes))
router.get("/get-a-loan-type/:id", tryCatchMiddleware(getLoanTypeById))
router.put("/update-loan-type/:id", tryCatchMiddleware(updateLoanType))
router.delete("/delete-loan-type/:id", tryCatchMiddleware(deleteLoanType))


// Salary Event
router.post("/create-salary-event", tryCatchMiddleware(createSalaryEvent));
router.get("/get-all-salary-event", tryCatchMiddleware(getAllSalaryEvents));
router.get("/get-salary-event/:id", tryCatchMiddleware(getSalaryEventsByEmployee));
router.put("/update-salary-event/:id", tryCatchMiddleware(updateSalaryEvent));
router.delete("/delete-salary-event/:id", tryCatchMiddleware(deleteSalaryEvent));


// Salary Definition
router.get("/get-all-salary-def", PermittedToSuperAdminAndHR, tryCatchMiddleware(getAllSalaryDefinitions));
router.get("/get-salary-def/:id", PermittedToSuperAdminAndHR, tryCatchMiddleware(getSalaryDefinitionsById));
router.post("/add-salary-def", PermittedToSuperAdminAndHR, tryCatchMiddleware(createSalaryDefinitions));
router.put("/update-salary-def/:id", PermittedToSuperAdminAndHR, tryCatchMiddleware(updateSalaryDefinitions));
router.delete("/delete-salary-def/:id", PermittedToSuperAdminAndHR, tryCatchMiddleware(deleteSalaryDefinitions));


export default router;