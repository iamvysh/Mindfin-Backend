

const errorHandler = (err, req, res, next) => {

    console.error(`[${new Date().toISOString()}] Error:`, {
        message: err.message,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
        path: req.path,
        method: req.method,
        statusCode: err.statusCode || 500
    });

    // CORS errors
    if (err.message.includes('CORS')) {
        return res.status(403).json({
            success: false,
            message: 'Not allowed by CORS policy'
        });
    }

    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 ? 'Internal Server Error' : (err.message || 'Something went wrong');

    res.status(statusCode).json({
        success: false,
        message: message,
        ...(process.env.NODE_ENV !== 'production' && { 
            stack: err.stack,
            path: req.path,
            method: req.method 
        })
    });
};

export default errorHandler;


