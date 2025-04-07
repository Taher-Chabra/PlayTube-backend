import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.modle.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const registerUser = asyncHandler(async (req, res) => {
   // get user details from the frontend
   const { username, password, fullName, email,  } = req.body;
   
   // Validate user details
   if (
      [username, password, fullName, email].some((field) => field?.trim() === "")
   ) {
      throw new ApiError(400, "All fields are required");
   }

   // Check if the user already exists
   const existedUser = await User.findOne({
      $or: [{ username }, { email }]
   });

   if (existedUser) {
      throw new ApiError(409, "User with these credentials already exists");
   }

   //check for avatar and cover image
   const avatarLocalPath = req.files?.avatar[0]?.path;

   let coverImageLocalPath;
   if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files.coverImage[0].path;

   }

   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required");
   }

   // upload the avatar and cover image to cloudinary
   const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath);
   const uploadedCoverImage = await uploadOnCloudinary(coverImageLocalPath);

   if (!uploadedAvatar) {
      throw new ApiError(400, "Failed to upload avatar");
   }

   // create user obeject - entry in the database
   const user = await User.create({
      fullName,
      username: username.toLowerCase(),
      email,
      password,
      avatar: uploadedAvatar.url,
      coverImage: uploadedCoverImage?.url || "",

   });

   // check if user is created successfully
   const createdUser = await User.findById(user._id).select("-password -refreshToken");

   if (!createdUser) {
      throw new ApiError(500, "Failed to create user");
   }

   // return success response
   return res.status(201).json(
      new ApiResponse(200, createdUser, "User created successfully")
   )
});

export { registerUser };