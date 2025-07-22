
import ErrorLog from '../model/ErrorLog.js';

export const logErrorToDB = async (err, req) => {
  try {
    const log = new ErrorLog({
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode || 500,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      user: req.user?._id || null,
      payload: {
        body: req.body,
        params: req.params,
        query: req.query,
      },
    });

    await log.save();
  } catch (logErr) {
    console.error('Failed to log error to DB:', logErr);
  }
};
