const asyncHandler = (requestHandler) => {
   return (req, res, next) => {
      Promise
         .resolve(requestHandler(req, res, next))
         .catch((err) => next(err));
   }
};

export { asyncHandler };


/*

// This is a utility function that wraps an async function and handles errors in a consistent way. It takes a function as an argument and returns a new function that calls the original function and catches any errors that occur. If an error occurs, it sends a JSON response with the error message and status code.

const asyncHandler = (fn) => async (req, res, next) => {
   try {
      await fn(req, res, next);
   } catch (err) {
      res.status(err.status || 500).json({
         success: false,
         message: err.message || 'Internal Server Error'
      })
   }
}
*/
