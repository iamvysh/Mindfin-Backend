import express from "express";
import { tryCatchMiddleware } from "../utils/tryCatch.js";
import { primaryValidater } from "../middleware/auth.js";
import { getAllTelecallers } from "../controller/admin/adminController.js";
import { addBankDetails, addFollowUp, deleteBankDetail, deleteFollowUp, exportCreditManagerLeads, getAllBankDetails, getBankDetailById, getFilteredCreditManagerLeads, getFollowUpById, getFollowUpsByBankDetail, getLeadsForCreditManagerForBankDetails, updateBankDetail, updateFollowUp, updateLeadStatus } from "../controller/creditManager/creditManagerController.js";
import { getALeadByID, updateLead } from "../controller/leads/leadController.js";
import { getAllCreditManagersWithLeadCount } from "../controller/teleCaller/teleCallerController.js";
const router = express.Router();


router.get("/get-all-branchwise-telecallers",primaryValidater,tryCatchMiddleware(getAllTelecallers))  //✅ 
router.get("/get-all-credit-manager-lead",primaryValidater,tryCatchMiddleware(getFilteredCreditManagerLeads))  //✅ 
router.get("/export-credit-manager-leads",primaryValidater,tryCatchMiddleware(exportCreditManagerLeads))  //✅ 
router.get("/get-lead/:id",tryCatchMiddleware(getALeadByID))  //✅ 
router.put("/update-credit-manager-lead/:id",primaryValidater,tryCatchMiddleware(updateLead)) //✅ 
router.put("/update-lead-status/:leadId",primaryValidater,tryCatchMiddleware(updateLeadStatus)) //✅ 
router.post("/add-bank-entry",primaryValidater,tryCatchMiddleware(addBankDetails)) //✅
router.get("/get-all-bank-details/:id", tryCatchMiddleware(getAllBankDetails)); //✅
router.get("/get-a-bank/:id", tryCatchMiddleware(getBankDetailById)); //✅
router.put("/update-bank-details/:id",tryCatchMiddleware(updateBankDetail)); //✅
router.delete("/delete-bank/:id",tryCatchMiddleware(deleteBankDetail)); //✅
router.post("/add-followup", tryCatchMiddleware(addFollowUp)) //✅
router.get("/bank/:bankDetailId", tryCatchMiddleware( getFollowUpsByBankDetail)); //✅
router.get("/get-a-bank-follow-up/:id", tryCatchMiddleware(getFollowUpById)); //✅
router.put("/bank/:id", tryCatchMiddleware( updateFollowUp)); //✅
router.delete("/bank/:id",tryCatchMiddleware( deleteFollowUp)); //✅
router.get("/get-credit-manager/bank-leads",primaryValidater,tryCatchMiddleware(getLeadsForCreditManagerForBankDetails)) //✅


export default router;