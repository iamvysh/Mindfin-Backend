import express from "express";
import { tryCatchMiddleware } from "../utils/tryCatch.js";
import { createBranch, deleteBranch, getAllBranches, getBranchById, updateBranch } from "../controller/branch/branch.js";
import { createDesignation, deleteDesignation, getAllDesignations, getDesignationById, updateDesignation } from "../controller/designation/designation.js";
import { createTax, deleteTax, getAllTaxes, getTaxById, updateTax } from "../controller/payrolls/taxType.js";
const router = express.Router();






//branches

router.post("/add-branch",tryCatchMiddleware(createBranch))
router.get("/get-all-branch",tryCatchMiddleware(getAllBranches))
router.get("/get-a-branch/:id",tryCatchMiddleware(getBranchById))
router.put("/update-branch/:id",tryCatchMiddleware(updateBranch))
router.put("/delete-branch/:id",tryCatchMiddleware(deleteBranch))

//designation

router.post("/add-designation",tryCatchMiddleware(createDesignation))
router.get("/get-all-desigantions",tryCatchMiddleware(getAllDesignations))
router.get("/get-a-designation/:id",tryCatchMiddleware(getDesignationById))
router.put("/update-designation/:id",tryCatchMiddleware(updateDesignation))
router.put("/delete-designation/:id",tryCatchMiddleware(deleteDesignation))


//tax

router.post("/create-tax",tryCatchMiddleware(createTax))
router.get("/get-all-tax",tryCatchMiddleware(getAllTaxes))
router.get("/get-tax/:id",tryCatchMiddleware(getTaxById))
router.put("/update-tax/:id",tryCatchMiddleware(updateTax))
router.delete("/delete-tax/:id",tryCatchMiddleware(deleteTax))



export default router;