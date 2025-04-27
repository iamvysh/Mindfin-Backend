import employeeModel from "../../model/employeeModel.js";
import sendResponse from "../../utils/sendResponse.js";
import designationModal from "../../model/designationModel.js"






export const  getAllDepartmentEmployees = async (req,res,next)=>{

    const {type,branch} = req.user

     const { name } = req.query;

     const query = { isDeleted: false };

     if (name) {
         query.$or = [
             { firstName: { $regex: name, $options: "i" } },
             { lastName: { $regex: name, $options: "i" } }
         ];
     }

     if (type === "HR") {
        query.branch = branch;
    }

     // Fetch all employees based on the query
     const employees = await employeeModel.find(query).populate("designation","designation").select("_id firstName lastName profileImg designation");

     sendResponse(res,200,employees)
}

export const departmentSpecificEmployees = async (req,res,next) =>{
    console.log("yaar");
    
    const {type,branch} = req.user

    const { designation, status, page = 1, limit = 10,name } = req.query;

        const query = { isDeleted: false };

        if (designation) {
            query.designation = designation;
        }
        
        if (name) {
            query.$or = [
                { firstName: { $regex: name, $options: "i" } },
                { lastName: { $regex: name, $options: "i" } }
            ];
        }
   

        if (status) {
            query.status = status.toUpperCase(); 
        }

        if (type === "HR") {
            query.branch = branch;
        }

        const skip = (page - 1) * limit;
        const totalDocuments = await employeeModel.countDocuments(query);
        const totalPages = Math.ceil(totalDocuments / limit);

        console.log(query,"cury");
        

        // Fetch all employees based on the query with pagination
        const employees = await employeeModel.find(query).populate("branch designation")
            .skip(skip)
            .limit(Number(limit));

        const designationName = await designationModal.findById(designation).select("designation")
  
        console.log(designationName);
        

            sendResponse(res,200, {
                employees, totalDocuments,
                totalPages,page,limit,
                designation:designationName
            })
}




