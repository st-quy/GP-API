module.exports = {
  success(data = null, message = 'Success', status = 200) {
    return { status, message, data };
  },

  error(message = 'Error', status = 500) {
    return { status, message, data: null };
  },

  badRequest(message = 'Bad request') {
    return { status: 400, message, data: null };
  },

  notFound(message = 'Not found') {
    return { status: 404, message, data: null };
  },
};
