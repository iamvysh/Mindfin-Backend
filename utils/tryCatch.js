import CustomError from "./customError.js";

export const tryCatchMiddleware = (handler) => {
    return async (req, res, next) => {
      try {
        await handler(req, res, next);

      } catch (error) {
        console.error(error);
        return next(new CustomError(error))
      }
    };
  };