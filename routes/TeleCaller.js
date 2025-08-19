import express from "express";
import { tryCatchMiddleware } from "../utils/tryCatch.js";
import { primaryValidater } from "../middleware/auth.js";
import { assignCreditManagerToLead, deleteLeadHistory, exportLeadToTeleCaller, getAllCreditManagersWithLeadCount, getAssignedLeadsByStatus, getAssignedLeadStats, getFilteredLeadsToTeleCaller, getLeadHistories, updateLeadHistory, createLeadHistory } from "../controller/teleCaller/teleCallerController.js";
import { deleteLead, updateLead } from "../controller/leads/leadController.js";
import { getAllLoanTypes } from "../controller/loanType/loanTypeontroller.js";
import { uploadTelecallerLeads } from "../controller/upload/upload.js";
const router = express.Router();



router.get("/get-all-telecaller-leads", primaryValidater, tryCatchMiddleware(getFilteredLeadsToTeleCaller)) //✅ 
router.get("/export-telecaller-leads", primaryValidater, tryCatchMiddleware(exportLeadToTeleCaller)) //✅
router.put("/update-telecaller-lead/:id", primaryValidater, tryCatchMiddleware(updateLead))//✅
router.post("/upload-docs", tryCatchMiddleware(uploadTelecallerLeads))  // upload telecaller lead documents //✅
router.get("/get-all-credit-managers", primaryValidater, tryCatchMiddleware(getAllCreditManagersWithLeadCount))
router.put("/assign-lead-to-credit-manager", tryCatchMiddleware(assignCreditManagerToLead)) //✅
router.post("/add-lead-history", primaryValidater, tryCatchMiddleware(createLeadHistory))
router.get("/get-all-lead-Histories/:id", primaryValidater, tryCatchMiddleware(getLeadHistories))
router.put("/update-lead-history/:id", primaryValidater, tryCatchMiddleware(updateLeadHistory))
router.delete("/delete-lead-history/:id", primaryValidater, tryCatchMiddleware(deleteLeadHistory))
router.get("/get-tele-caller-statics", primaryValidater, tryCatchMiddleware(getAssignedLeadStats)) //✅
router.get("/get-status-wise-status", primaryValidater, tryCatchMiddleware(getAssignedLeadsByStatus)) //✅
router.get("/get-all-loan-types", primaryValidater, tryCatchMiddleware(getAllLoanTypes)) //✅


export default router;