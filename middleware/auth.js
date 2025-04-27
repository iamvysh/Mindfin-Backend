import CustomError from "../utils/customError.js";
import JwtService from "../utils/jwtService.js";




export const primaryValidater = async (req, res, next) => {
    try {
        // get header
        const authHeader = req.headers.authorization;
   console.log(authHeader);
   
        if (!authHeader) {
            return next(new CustomError("unAuthorized", 401))
        }

        // get token
        const token = authHeader.split(' ')[1]
        console.log(token),"token";
        

        const { _id, email, type, branch } = await JwtService.verify(token)

        // if (!isAdmin) {
        //     return next(new CustomError("unAuthorized", 401))
        // }

        // set id & email
        req.user = {
            _id,
            email,
            type,
            branch
        }

        next();
    } catch (err) {
        return next(new CustomError("unAuthorized", 401))
    }
}




export const PermittedToSuperAdminAndHR = (req, res, next) => {
    try {
      const { type } = req.user;
  
      // Check if user type is SUPERADMIN
  
      if (type === "SUPERADMIN" || type === "HR") {
        next();
      }
      else {
        return next(
          new CustomError(
            "Unauthorized: You are not authorized to access this route",
            401
          )
        );
      }
  
    } catch (err) {
      return next(new CustomError("Unauthorized", 401));
    }
  };