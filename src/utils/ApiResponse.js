// This file defines the ApiResponse class, which is used to standardize API responses in the application.
// It has a constructor that takes a status code, data, and an optional message. The class also has a success property that indicates whether the response was successful based on the status code.

class ApiResponse {
   constructor(
      statusCode,
      data,
      message = "Success",
   ) {
      this.statusCode = statusCode
      this.data = data
      this.message = message
      this.success = statusCode < 400
   }
}

export { ApiResponse };