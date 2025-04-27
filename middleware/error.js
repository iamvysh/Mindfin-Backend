const middleError = async (err, req, res, next) => {
    console.log('error',err)
    err.message = err.message || 'Internal Server Error'
    err.statusCode = err.statusCode || 500;

    res.status(err.statusCode).json({
        message: err.message,
        success: false
    })
}

export default middleError