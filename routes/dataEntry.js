import express from "express";
import { tryCatchMiddleware } from "../utils/tryCatch.js";
import { primaryValidater } from "../middleware/auth.js";
import { bulkUploadLeads, deleteLead, exportLeads, getALeadByID, getAllLeads, updateLead } from "../controller/leads/leadController.js";
const router = express.Router();


router.post("/add-leads",primaryValidater,tryCatchMiddleware(bulkUploadLeads))
router.get("/get-all-leads",primaryValidater,tryCatchMiddleware(getAllLeads))
router.get("/get-a-lead/:id",primaryValidater,tryCatchMiddleware(getALeadByID))
router.put("/update-a-lead/:id",primaryValidater,tryCatchMiddleware(updateLead))
router.delete("/delete-a-lead/:id",primaryValidater,tryCatchMiddleware(deleteLead))
router.get("/export-lead",primaryValidater,tryCatchMiddleware(exportLeads))



export default router;