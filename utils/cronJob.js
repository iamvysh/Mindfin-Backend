import cron from "node-cron";
import moment from "moment-timezone";
import employeeModel from "../model/employeeModel.js";
import attendenceModel from "../model/attendenceModel.js";



export const markAbsent = () =>{


    // Set the timezone to Indian Standard Time (IST)
    const IST_TIMEZONE = "Asia/Kolkata";
    
    // Cron job to mark absent employees at 5:35 PM IST every day
    cron.schedule("35 17 * * *", async () => {
            // cron.schedule('*/1 * * * *', async () => {   

                try {
                    console.log("Running attendance cron job...");
        
                    const todayStart = moment().tz(IST_TIMEZONE).startOf("day").toDate();
                    const todayEnd = moment().tz(IST_TIMEZONE).endOf("day").toDate();
        
                    // Find all employees
                    const employees = await employeeModel.find({ isDeleted: false });
        
                    for (const employee of employees) {
                        // Check if the employee has already been marked absent today
                        const attendance = await attendenceModel.findOne({
                            employee: employee._id,
                            checkIn: { $gte: todayStart, $lte: todayEnd },
                        });
        
                        const alreadyAbsent = await attendenceModel.findOne({
                            employee: employee._id,
                            status: "ABSENT",
                            checkIn: null,
                            checkOut: null,
                            createdAt: { $gte: todayStart, $lte: todayEnd }
                        });
        
                        if (!attendance && !alreadyAbsent) {
                            // Mark as absent only if not already marked
                            await attendenceModel.create({
                                employee: employee._id,
                                status: "ABSENT",
                                checkIn: null,
                                checkOut: null,
                                workingHours: "0",
                            });
                            console.log(`Marked Absent: ${employee.firstName} ${employee.lastName}`);
                        }
                    }
                } catch (error) {
                    console.error("Error in attendance cron job:", error);
                }
            }, {
                scheduled: true,
                timezone: IST_TIMEZONE,
            });
        
            console.log("Cron job scheduled to run at 5:35 PM IST daily.");

}

