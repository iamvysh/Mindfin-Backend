import express from "express";
import { tryCatchMiddleware } from "../utils/tryCatch.js";
import { assignLeadToEmployee, getAllTelecallers, getBranchTelecallerLeadCounts, getLeadCountsByMonthAndDesignation, getMonthlyLeadCountsByDesignation } from "../controller/admin/adminController.js";
import { primaryValidater } from "../middleware/auth.js";
// import {  getAllTelecallers, getBranchTelecallerLeadCounts, getLeadCountsByMonthAndDesignation, getMonthlyLeadCountsByDesignation } from "../controller/admin/admin.js";
const router = express.Router();


router.get("/get-all-telecallers",primaryValidater,tryCatchMiddleware(getAllTelecallers))   //✅
router.put("/assign-lead",tryCatchMiddleware(assignLeadToEmployee)) //✅
router.get("/get-monthly-leads-data",primaryValidater,tryCatchMiddleware(getMonthlyLeadCountsByDesignation)) //✅
router.get("/get-leads-data",primaryValidater,tryCatchMiddleware(getLeadCountsByMonthAndDesignation)) //✅
router.get("/get-assined-info",primaryValidater,tryCatchMiddleware(getBranchTelecallerLeadCounts)) //✅   


export default router;