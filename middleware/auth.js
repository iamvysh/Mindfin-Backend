import CustomError from "../utils/customError.js";
import JwtService from "../utils/jwtService.js";




export const primaryValidater = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next(new CustomError("unAuthorized", 401));
    }

    const token = authHeader.split(" ")[1];
    const { _id, email, type } = await JwtService.verify(token);

    req.user = { _id, email, type };
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
