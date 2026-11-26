const sendResponse = (res, statusCode, message, data = null, pagination = null) => {
  const payload = {
    success: statusCode >= 200 && statusCode < 400,
    message,
  };
  if (data !== null) payload.data = data;
  if (pagination !== null) payload.pagination = pagination;
  return res.status(statusCode).json(payload);
};

module.exports = { sendResponse };
