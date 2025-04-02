//This class is used to create a custom error object for API responses.
// It extends the built-in Error class and includes properties for status code, message, success, and errors.
// The constructor takes these properties as arguments and sets them on the instance. It also captures the stack trace if no stack is provided. This class can be used to standardize error handling in an API by providing a consistent structure for error responses.

class ApiError extends Error {
   constructor(
      statusCode,
      message = "Something went wrong",
      errors = [],
      stack = ""
   ) {
      super(message)
      this.statusCode = statusCode
      this.data = null
      this.message = message
      this.success = false
      this.errors = errors

      if (stack) {
         this.stack = stack
      } else {
         Error.captureStackTrace(this, this.constructor)
      }
   }
}

export { ApiError };