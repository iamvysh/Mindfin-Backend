
import mongoose from 'mongoose';
import attendenceModel from '../../model/attendenceModel.js';
import candidateModel from '../../model/candidateModel.js';
import employeeModel from '../../model/employeeModel.js';
import holidayModel from '../../model/holidayModel.js';
import JobModel from "../../model/jobs.js"
import CustomError from '../../utils/customError.js';
import sendResponse from '../../utils/sendResponse.js';
import moment from "moment-timezone";

 



export const getBranchData = async (req, res, next) => {
    try {
        const { branch, type } = req.user;

        
        const timezone = "Asia/Kolkata";
        const today = moment().tz(timezone).startOf('day').toDate();

        let employeeFilter = {};
        let jobFilter = {};
        let attendanceFilter = { createdAt: { $gte: today } };
        let candidateFilter = {};

        if (type === "HR") {
            employeeFilter.branch = branch;
            jobFilter.branch = branch;
            attendanceFilter["employee.branch"] = branch;
        }

        const totalEmployees = await employeeModel.countDocuments(employeeFilter);
        const totalApplicants = await candidateModel.countDocuments({ appliedFor: { $in: await JobModel.find(jobFilter).distinct("_id") } });
        const totalPresent = await attendenceModel.countDocuments({ 
            ...attendanceFilter, 
            status: { $in: ["ONTIME", "LATE", "HALFDAY"] }
        });
        const totalAbsents = totalEmployees - totalPresent;
        const jobs = await JobModel.find(jobFilter);

        res.status(200).json({
            totalEmployees,
            totalApplicants,
            totalPresent,
            totalAbsents,
            jobs
        });
    } catch (error) {
        console.error("Error fetching branch data:", error);
        res.status(500).json({ message: "Server error" });
    }
};



// export const getWeeklyAttendanceGraph = async (req, res, next) => {
//     try {
//         const { branch, type } = req.user;
//         // const timezone = "Asia/Kolkata"; 
//         // const today = moment().tz(timezone).startOf('day');

//         // let employeeFilter = {};
//         // let attendanceFilter = {
//         //     createdAt: { $gte: moment(today).subtract(6, "days").toDate(), $lte: today.toDate() }
//         // };

//         const today = moment.utc().startOf('day'); 
//          let employeeFilter = {};
//          let attendanceFilter = {
//   createdAt: {
//     $gte: moment.utc(today).subtract(6, "days").toDate(), // 6 days ago in UTC
//     $lte: moment.utc().endOf('day').toDate()// today in UTC
//   }
// };

//         if (type === "HR") {
//             employeeFilter = { branch: branch };
//             attendanceFilter = { ...attendanceFilter, "employee.branch": branch };
//         }

//         const totalEmployees = await employeeModel.countDocuments(employeeFilter);
//         console.log(attendanceFilter,"myre");
        
//         const attendanceData = await attendenceModel.aggregate([
//             {
//                 $match: attendanceFilter
//             },
//             {
//                 $group: {
//                     _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//                     totalPresent: {
//                         $sum: {
//                             $cond: [{ $in: ["$status", ["ONTIME", "LATE"]] }, 1, 0]
//                         }
//                     },
//                     totalHalfDay: {
//                         $sum: {
//                             $cond: [{ $eq: ["$status", "HALFDAY"] }, 1, 0]
//                         }
//                     },
//                     totalLeave: {
//                         $sum: {
//                             $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0]
//                         }
//                     }
//                 }
//             },
//             {
//                 $sort: { _id: 1 }
//             }
//         ]);

//         // Format response
//         const graphData = [];

//         console.log(attendanceData,"amo");
        
//         for (let i = 6; i >= 0; i--) {
//             const date = moment(today).subtract(i, "days").format("YYYY-MM-DD");
//             const data = attendanceData.find(d => d._id === date);

//             const present = data ? data.totalPresent : 0;
//             const halfDay = data ? data.totalHalfDay : 0;
//             const leave = data ? data.totalLeave : totalEmployees - present - halfDay;

//             graphData.push({
//                 date,
//                 attendance: (present / totalEmployees) * 100 || 0,
//                 halfDay: (halfDay / totalEmployees) * 100 || 0,
//                 leave: (leave / totalEmployees) * 100 || 0
//             });
//         }


//         console.log(graphData);
        
//         res.status(200).json(graphData);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "Server error" });
//     }
// };

// export const getWeeklyAttendanceGraph = async (req, res, next) => {
//     try {
//         const { branch, type } = req.user;

//         // Define UTC start and end times
//         const startUTC = moment.utc().startOf('day').subtract(6, 'days').set({ hour: 5, minute: 30 }).toDate();
//         const endUTC = moment.utc().endOf('day').toDate();

//         let employeeFilter = {};
//         let attendanceFilter = {
//             createdAt: {
//                 $gte: startUTC,
//                 $lte: endUTC
//             }
//         };

//         if (type === "HR") {
//             employeeFilter = { branch };
//             attendanceFilter = { ...attendanceFilter, "employee.branch": branch };
//         }

//         const totalEmployees = await employeeModel.countDocuments(employeeFilter);

//         const attendanceData = await attendenceModel.aggregate([
//             {
//                 $match: attendanceFilter
//             },
//             {
//                 $group: {
//                     _id: {
//                         $dateToString: {
//                             format: "%Y-%m-%d",
//                             date: "$createdAt"
//                         }
//                     },
//                     totalPresent: {
//                         $sum: {
//                             $cond: [{ $in: ["$status", ["ONTIME", "LATE"]] }, 1, 0]
//                         }
//                     },
//                     totalHalfDay: {
//                         $sum: {
//                             $cond: [{ $eq: ["$status", "HALFDAY"] }, 1, 0]
//                         }
//                     },
//                     totalLeave: {
//                         $sum: {
//                             $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0]
//                         }
//                     }
//                 }
//             },
//             { $sort: { _id: 1 } }
//         ]);

//         const graphData = [];

//         for (let i = 6; i >= 0; i--) {
//             const date = moment.utc().subtract(i, 'days').format("YYYY-MM-DD");
//             const data = attendanceData.find(d => d._id === date);

//             const present = data ? data.totalPresent : 0;
//             const halfDay = data ? data.totalHalfDay : 0;
//             const leave = data ? data.totalLeave : totalEmployees - present - halfDay;

//             graphData.push({
//                 date,
//                 attendance: (present / totalEmployees) * 100 || 0,
//                 halfDay: (halfDay / totalEmployees) * 100 || 0,
//                 leave: (leave / totalEmployees) * 100 || 0
//             });
//         }

//         res.status(200).json(graphData);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "Server error" });
//     }
// };



export const getWeeklyAttendanceGraph = async (req, res, next) => {
  try {
    const { branch, type } = req.user;

    // Define UTC start and end times
    const startUTC = moment.utc().startOf("day").subtract(6, "days").set({ hour: 5, minute: 30 }).toDate();
    const endUTC = moment.utc().endOf("day").toDate();

    let employeeFilter = {};
    if (type === "HR") {
      employeeFilter = { branch };
    }

    const totalEmployees = await employeeModel.countDocuments(employeeFilter);

    const attendanceData = await attendenceModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startUTC,
            $lte: endUTC
          }
        }
      },
      {
        $lookup: {
          from: "employees", // use the actual collection name
          localField: "employee",
          foreignField: "_id",
          as: "employee"
        }
      },
      {
        $unwind: "$employee"
      },
      ...(type === "HR"
        ? [
            {
              $match: {
                "employee.branch": { $in: [new mongoose.Types.ObjectId(branch)] } // branch is array in employee model
              }
            }
          ]
        : []),
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          totalPresent: {
            $sum: {
              $cond: [{ $in: ["$status", ["ONTIME", "LATE"]] }, 1, 0]
            }
          },
          totalHalfDay: {
            $sum: {
              $cond: [{ $eq: ["$status", "HALFDAY"] }, 1, 0]
            }
          },
          totalLeave: {
            $sum: {
              $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const graphData = [];

    for (let i = 6; i >= 0; i--) {
      const date = moment.utc().subtract(i, "days").format("YYYY-MM-DD");
      const data = attendanceData.find((d) => d._id === date);

      const present = data ? data.totalPresent : 0;
      const halfDay = data ? data.totalHalfDay : 0;
      const leave = data ? data.totalLeave : totalEmployees - present - halfDay;

      graphData.push({
        date,
        attendance: totalEmployees ? (present / totalEmployees) * 100 : 0,
        halfDay: totalEmployees ? (halfDay / totalEmployees) * 100 : 0,
        leave: totalEmployees ? (leave / totalEmployees) * 100 : 0
      });
    }

    res.status(200).json(graphData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



export const getCustomDateDetails = async (req, res, next) => {
    try {
        const { date, endDate } = req.query; // Expecting single date or range
        console.log(date, "fs");

        const { branch, type } = req.user;
        console.log(branch, type, "OOMBBB");

        const startDate = moment.utc(date).startOf("day").toDate();
        const end = endDate ? moment.utc(endDate).endOf("day").toDate() : moment.utc(date).endOf("day").toDate();

        console.log(startDate, end, "dfvdf");

        let employeeIds = [];
        if (type === "HR") {
            // Fetch employee IDs based on the branch filter
            const employees = await employeeModel.find({ branch: branch }).select('_id');
            employeeIds = employees.map(employee => employee._id);
        }

        console.log(employeeIds, "employeeIds....");

        // Fetch leave records
        const leaves = await attendenceModel.find({
            employee: { $in: employeeIds },
            createdAt: { $gte: startDate, $lte: end },
            status: "ABSENT",
        }).populate("employee","firstName lastName profileImg");

        // Fetch special holidays
        const holidays = await holidayModel.find({
            holidayDate: { $gte: startDate, $lte: end },
        });

        // Fetch birthdays (ignoring the year)
        const birthdays = await employeeModel.find({
            branch: branch,
            $expr: {
                $and: [
                    { $eq: [{ $dayOfMonth: "$DOB" }, moment.utc(date).date()] },
                    { $eq: [{ $month: "$DOB" }, moment.utc(date).month() + 1] }
                ]
            }
        }).select("firstName lastName DOB profileImg");

        res.status(200).json({
            leaves,
            holidays,
            birthdays,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};


export const getTodaysAttendanceDetailsForDashboard = async (req, res, next) => {
    try {
        const { type, branch } = req.user;
        const todayStart = moment().startOf('day').toDate();
        const todayEnd = moment().endOf('day').toDate();

        let attendanceFilter = {
            createdAt: { $gte: todayStart, $lte: todayEnd }
        };

        if (type === "HR") {
            // Fetch employee IDs based on the branch filter
            const employees = await employeeModel.find({ branch: { $in: branch } }).select('_id');
            const employeeIds = employees.map(employee => employee._id);

            // Update the attendance filter to include only these employee IDs
            attendanceFilter = {
                ...attendanceFilter,
                employee: { $in: employeeIds }
            };
        }


        console.log(attendanceFilter,"af");
        

        // Fetch today's attendance details (limit to 12 documents)
        const attendanceDetails = await attendenceModel.find(attendanceFilter)
            // .populate('employee',)
            .populate({
                path: "employee",
                populate: [
                    // { path: "branch" },
                    { path: "designation" }
                ]
            })
            .limit(12);
  
            console.log(attendanceDetails,"attendanceDetails");
            



        // Count total late and on-time entries
        const attendanceCounts = await attendenceModel.aggregate([
            {
                $match: attendanceFilter
            },
            {
                $group: {
                    _id: null,
                    totalLate: { $sum: { $cond: [{ $eq: ["$status", "LATE"] }, 1, 0] } },
                    totalOnTime: { $sum: { $cond: [{ $eq: ["$status", "ONTIME"] }, 1, 0] } }
                }
            }
        ]);

        const totalLate = attendanceCounts.length > 0 ? attendanceCounts[0].totalLate : 0;
        const totalOnTime = attendanceCounts.length > 0 ? attendanceCounts[0].totalOnTime : 0;

        res.status(200).json({
            attendanceDetails,
            totalLate,
            totalOnTime
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};