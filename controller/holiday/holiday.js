import holidayModel from "../../model/holidayModel.js";
import CustomError from "../../utils/customError.js";
import sendResponse from "../../utils/sendResponse.js";





export const createHoliday = async (req, res, next) => {
    const { holidayDate, holidayName } = req.body;

    let exists = await holidayModel.findOne({ holidayDate, holidayName });

    if (exists) {
        return next(new CustomError("Holiday with the same name and date already exists", 400));
    }

    const newHoliday = await holidayModel.create(req.body);
    sendResponse(res, 200, newHoliday);
};

// export const getAllHolidays = async (req, res, next) => {
//     const { page = 1, limit = 10, name,filterType } = req.query;


//     const currentDate = new Date();


//     const filter = name ? { holidayName: { $regex: name, $options: "i" } } : {};
   
//     if (filterType === 'past') {
//         filter.holidayDate = { $lt: currentDate };
//     } else if (filterType === 'upcoming') {
//         filter.holidayDate = { $gte: currentDate };
//     }


//     const holidays = await holidayModel.find(filter)
//         .skip((page - 1) * limit)
//         .limit(parseInt(limit));

//     sendResponse(res, 200, holidays);
// };

export const getAllHolidays = async (req, res, next) => {
      const { page = 1, limit = 10, name, filterType } = req.query;
  
      const currentDate = new Date();
  
      const filter = {};
  
      if (name) {
        filter.holidayName = { $regex: name, $options: "i" };
      }
  
      if (filterType === 'past') {
        filter.holidayDate = { $lt: currentDate };
      } else if (filterType === 'upcoming') {
        filter.holidayDate = { $gte: currentDate };
      }
  
      const total = await holidayModel.countDocuments(filter); // total count
  
      const holidays = await holidayModel.find(filter)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ holidayDate: 1 }); // optional: sort by date ascending
  
      const totalPages = Math.ceil(total / limit);
  
      sendResponse(res, 200, {
        holidays,
        pagination: {
          total,
          totalPages,
          currentPage: parseInt(page),
        
        }
      });
   
  }
  


export const getHolidayById = async (req, res, next) => {
    const holiday = await holidayModel.findById(req.params.id);

    if (!holiday) {
        return next(new CustomError("Holiday not found", 404));
    }

    sendResponse(res, 200, holiday);
};

export const updateHoliday = async (req, res, next) => {
    const updatedHoliday = await holidayModel.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!updatedHoliday) {
        return next(new CustomError("Holiday not found", 404));
    }

    sendResponse(res, 200, updatedHoliday);
};

export const deleteHoliday = async (req, res, next) => {
    const deletedHoliday = await holidayModel.findByIdAndDelete(req.params.id);

    if (!deletedHoliday) {
        return next(new CustomError("Holiday not found", 404));
    }

    sendResponse(res, 200, { message: "Holiday deleted successfully" });
};