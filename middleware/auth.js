import CustomError from "../utils/customError.js";
import JwtService from "../utils/jwtService.js";
import employeeModel from "../model/employeeModel.js";


export const primaryValidater = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next(new CustomError("unAuthorized", 401));
    }

    const token = authHeader.split(" ")[1];
    const { _id, email, type, branch } = await JwtService.verify(token);
    const user = await employeeModel.findById(_id).select("_id email type branch");
    if (!user) {
      return next(new CustomError("User not found", 404));
    }

    req.user = {
      _id: user._id,
      email: user.email,
      type: user.type,
      branch: user.branch
    };

    next();
  } catch (err) {
    return next(new CustomError("unAuthorized", 401));
  }
};


export const PermittedToSuperAdminAndHR = (req, res, next) => {
  const { type } = req.user || {};

  if (type === "SUPERADMIN" || type === "HR") {
    return next();
  }

  return next(new CustomError("Unauthorized: You are not authorized to access this route", 401));
};
