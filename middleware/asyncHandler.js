// handles async function errors and passes them to the error handling middleware
function asyncHandler(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = asyncHandler;
