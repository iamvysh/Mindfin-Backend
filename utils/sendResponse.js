const sendResponse = (res, status, data, config) => {
    return res.status(status).send({ success: true, data, ...config });
};

export default sendResponse;