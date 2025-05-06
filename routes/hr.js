import express from "express";
import { addEmployee, branchSelection, changeProfilePic, deleteEmployee, editEmployee, forgotPassword, generatePassword, getAllEmployees, getALLEmployeesForPayRoll, getCumulativeAttendances, getCumulativeEmployeeLeaves, getEmployeeById, loginEmployee, reSendOtpForgotPassword, reSendOtpGeneratePassword, resetPasswordEmployee, verifyGeneratePassword, verifyOtp, whoAmI } from "../controller/employee/employee.js";
import { tryCatchMiddleware } from "../utils/tryCatch.js";
import { createPayRoll, deletePayRoll, getAllPayRolls, getPayRollById, updatePayRoll } from "../controller/payrolls/payRoll.js";
import { createPaySlip, deletePaySlip, getAllPaySlips, getEmployeeCounts, getMonthlySalaryTotals, getPaySlipById, updatePaySlip } from "../controller/payrolls/paySlip.js";
import { createJob, deleteJob, getAllJobs, getAllJobsforModal, getJobById, updateJob, updatePublish } from "../controller/jobpostings/jobsController.js";
import { createCandidate, deleteCandidate, getAllCandidates, getCandidateById, updateCandidate } from "../controller/jobpostings/candidates.js";
import { departmentSpecificEmployees, getAllDepartmentEmployees } from "../controller/department/department.js";
import { createHoliday, deleteHoliday, getAllHolidays, getHolidayById, updateHoliday } from "../controller/holiday/holiday.js";
import { createLeave, deleteLeave, getAllLeaves, getLeaveById, updateLeave } from "../controller/leaves/leaveController.js";
import { calculateMonthlyAttendance, createAttendance, deleteAttendance, getAllAttendance, getAttendanceById, updateAttendance } from "../controller/attedence/attendence.js";
import { getBranchData, getCustomDateDetails, getTodaysAttendanceDetailsForDashboard, getWeeklyAttendanceGraph } from "../controller/dashboard/dashboard.js";
import { PermittedToSuperAdminAndHR, primaryValidater } from "../middleware/auth.js";
import { downLoadBlob, upload } from "../controller/upload/upload.js";
const router = express.Router();




router.post("/generate-password",tryCatchMiddleware(generatePassword))
router.post("/verify-generate-password",tryCatchMiddleware(verifyGeneratePassword))
router.post("/reset-the-password",tryCatchMiddleware(resetPasswordEmployee))
router.post("/forgot-password",tryCatchMiddleware(forgotPassword))
router.post("/verify-otp",tryCatchMiddleware(verifyOtp))
router.post("/resent-otp/generate-password",tryCatchMiddleware(reSendOtpGeneratePassword))
router.post("/resent-otp/forgot-password",tryCatchMiddleware(reSendOtpForgotPassword))
router.get("/getUser",primaryValidater, tryCatchMiddleware(whoAmI))

//auth

router.post("/login",tryCatchMiddleware(loginEmployee))
router.post("/branch-login",tryCatchMiddleware(branchSelection))




//employee

router.post("/add-employee",tryCatchMiddleware(addEmployee))
router.get("/get-all-employees",primaryValidater,tryCatchMiddleware(getAllEmployees))
router.get("/get-details-employee/:id",tryCatchMiddleware(getEmployeeById))
router.put("/edit-employee/:id",tryCatchMiddleware(editEmployee))
router.put("/delete-employee/:id",tryCatchMiddleware(deleteEmployee))
router.get("/get-cumulative-attetence/:id",tryCatchMiddleware(getCumulativeAttendances))
router.get("/get-cumulative-leaves/:employeeId",tryCatchMiddleware(getCumulativeEmployeeLeaves))


//payroll

router.get('/get-employeesForPayroll',primaryValidater,tryCatchMiddleware(getALLEmployeesForPayRoll))
router.post('/create-pay-roll',primaryValidater,tryCatchMiddleware(createPayRoll))
router.get("/get-all-pay-roll",primaryValidater,tryCatchMiddleware(getAllPayRolls))
router.get("/get-payroll/:id",tryCatchMiddleware(getPayRollById))
router.put("/update-payroll/:id",tryCatchMiddleware(updatePayRoll))
router.delete("/delete-payroll/:id",tryCatchMiddleware(deletePayRoll))
router.get("/get-employee-count",primaryValidater,tryCatchMiddleware(getEmployeeCounts))
router.get("/get-salary-details",primaryValidater,tryCatchMiddleware(getMonthlySalaryTotals))


//pay slip

router.post('/create-pay-slip',tryCatchMiddleware(createPaySlip))
router.get("/get-all-pay-slip",primaryValidater,tryCatchMiddleware(getAllPaySlips))
router.get("/get-payslip/:id",tryCatchMiddleware(getPaySlipById))
router.put("/update-payslip/:id",tryCatchMiddleware(updatePaySlip))
router.delete("/delete-payslip/:id",tryCatchMiddleware(deletePaySlip))



// jobs

router.post("/create-job",primaryValidater,tryCatchMiddleware(createJob))
router.get("/get-all-jobs",primaryValidater,tryCatchMiddleware(getAllJobs))
router.get("/get-job/:id",tryCatchMiddleware(getJobById))
router.put("/update-job/:id",tryCatchMiddleware(updateJob))
router.delete("/delete-job/:id",tryCatchMiddleware(deleteJob))
router.put("/update-publish/:id",tryCatchMiddleware(updatePublish))
router.get("/get-all-jobs-for-modal",primaryValidater,tryCatchMiddleware(getAllJobsforModal))


//candidates

router.post("/create-candidates",tryCatchMiddleware(createCandidate))
router.get("/get-all-candidates",primaryValidater,tryCatchMiddleware(getAllCandidates))
router.get("/get-a-candidate/:id",tryCatchMiddleware(getCandidateById))
router.put("/update-candidate/:id",tryCatchMiddleware(updateCandidate))
router.delete("/delete-candidate/:id",tryCatchMiddleware(deleteCandidate))

//department 

router.get("/get-all-department",primaryValidater,tryCatchMiddleware(getAllDepartmentEmployees))
router.get("/get-department-employees",primaryValidater,tryCatchMiddleware(departmentSpecificEmployees))


//holiday

router.post("/create-holiday",tryCatchMiddleware(createHoliday))
router.get("/get-all-holidays",tryCatchMiddleware(getAllHolidays))
router.get("/get-a-holiday/:id",tryCatchMiddleware(getHolidayById))
router.put("/update-holiday/:id",tryCatchMiddleware(updateHoliday))
router.delete("/delete-holiday/:id",tryCatchMiddleware(deleteHoliday))


//leaves

router.post("/create-leave",tryCatchMiddleware(createLeave))
router.get("/get-all-leaves",primaryValidater,tryCatchMiddleware(getAllLeaves))
router.get("/get-leave/:id",tryCatchMiddleware(getLeaveById))
router.put("/update-leave/:id",primaryValidater,tryCatchMiddleware(updateLeave))
router.delete("/delete-leave/:id",tryCatchMiddleware(deleteLeave))


//attendence


router.post("/create-attendence",tryCatchMiddleware(createAttendance))
router.get("/get-all-attendence",primaryValidater,tryCatchMiddleware(getAllAttendance))
router.get("/get-attendence/:id",tryCatchMiddleware(getAttendanceById))
router.put("/update-attendence/:id",tryCatchMiddleware(updateAttendance))
router.delete("/delete-attendence/:id",tryCatchMiddleware(deleteAttendance))
router.get("/get-monthly-attendence",primaryValidater,tryCatchMiddleware(calculateMonthlyAttendance))



//dashboard

router.get("/get-branch-data",primaryValidater,PermittedToSuperAdminAndHR,tryCatchMiddleware(getBranchData))
router.get("/get-weekly-atendence",primaryValidater,PermittedToSuperAdminAndHR,tryCatchMiddleware(getWeeklyAttendanceGraph))
router.get("/custom-dates",primaryValidater,PermittedToSuperAdminAndHR,tryCatchMiddleware(getCustomDateDetails))
router.get("/todays-attendence",primaryValidater,PermittedToSuperAdminAndHR,tryCatchMiddleware(getTodaysAttendanceDetailsForDashboard))


//settings

router.put(`/change-image/:id`,tryCatchMiddleware(changeProfilePic))


//upload files

router.post("/uploadFile",upload)
router.get("/download-file",downLoadBlob)

export default router;