import express from "express";
import { tryCatchMiddleware } from "../utils/tryCatch.js";
import { primaryValidater } from "../middleware/auth.js";
import { assignCreditManagerToLead, deleteLeadHistory, exportLeadToTeleCaller, getAllCreditManagersWithLeadCount, getAssignedLeadsByStatus, getAssignedLeadStats, getFilteredLeadsToTeleCaller, getRecentLeadHistories, updateLeadHistory, updateLeadStatusAndCreateHistory } from "../controller/teleCaller/teleCallerController.js";
import { deleteLead, updateLead } from "../controller/leads/leadController.js";
import { uploadTelecallerLeads } from "../controller/upload/upload.js";
const router = express.Router();




router.get("/get-all-telecaller-leads",primaryValidater,tryCatchMiddleware(getFilteredLeadsToTeleCaller)) //✅ 
router.get("/export-telecaller-leads",primaryValidater,tryCatchMiddleware(exportLeadToTeleCaller)) //✅
router.put("/update-telecaller-lead/:id",primaryValidater,tryCatchMiddleware(updateLead))//✅
router.post("/upload-docs",tryCatchMiddleware(uploadTelecallerLeads))  // upload telecaller lead documents //✅
router.get("/get-all-credit-managers",primaryValidater,tryCatchMiddleware(getAllCreditManagersWithLeadCount))
router.put("/assign-lead-to-credit-manager",tryCatchMiddleware(assignCreditManagerToLead)) //✅
router.post("/add-lead-history",primaryValidater,tryCatchMiddleware(updateLeadStatusAndCreateHistory)) //✅
router.get("/get-all-lead-Histories/:id",primaryValidater,tryCatchMiddleware(getRecentLeadHistories)) //✅
router.put("/update-lead-history/:id",tryCatchMiddleware(updateLeadHistory))
router.delete("/delete-lead-history/:id",tryCatchMiddleware(deleteLeadHistory))
router.get("/get-tele-caller-statics",primaryValidater,tryCatchMiddleware(getAssignedLeadStats)) //✅
router.get("/get-status-wise-status",primaryValidater,tryCatchMiddleware(getAssignedLeadsByStatus)) //✅
router.delete("/delete-a-lead",tryCatchMiddleware(deleteLead))  // common for tele-caller and credit-manager



export default router;