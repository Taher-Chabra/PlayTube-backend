import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.modle.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken || req.header("Authorization")?.split(" ")[1]; // or .replace("Bearer ", "")

    if (!token) {
      throw new ApiError(401, "Unauthorized request, no token provided");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Unauthorized request, invalid token");
    }

    // Attach the user to the request object for further use in the route handlers
    req.user = user;
    next();
  } catch (error) {
      throw new ApiError(
         401,
         error?.message || "Invalid access token"
      );
  }
});
