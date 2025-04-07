import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.modle.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const generateAccessAndRefreshToken = async (userId) => {
   try {
      const user = await User.findById(userId);
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      // Save the refresh token in the database
      user.refreshToken = refreshToken;
      await user.save({validateBeforeSave: false});

      return { accessToken, refreshToken };
   } catch (error) {
      throw new ApiError(500, "Failed to generate access and refresh token");
   }
};

// Register a new user

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

// Login user 

const loginUser = asyncHandler(async (req, res) => {
   const { email, username, password } = req.body;

   if (!email && !username) {
      throw new ApiError(400, "Email or username is required");
   }

   const user = await User.findOne({
      $or: [{ username }, { email }]
   })

   if (!user) {
      throw new ApiError(404, "User does not exist");
   }

   const isPasswordCorrect = await user.comparePassword(password);

   if (!isPasswordCorrect) {
      throw new ApiError(401, "Invalid password");
   }

   const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

   const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

   const options = {
      httpOnly: true,
      secure: true,  
   }

   return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(new ApiResponse(200, 
         { 
            user: loggedInUser, accessToken, refreshToken
         }, 
         "User logged in successful"
      ));
});

const logoutUser = asyncHandler(async (req, res) => {
   const userId = req.user._id

   await User.findByIdAndUpdate(
      userId,
      {
         $set: {
            refreshToken: undefined
         }
      },
      { new: true }
   )

   const options = {
      httpOnly: true,
      secure: true,  
   }

   return res
      .status(200)
      .cookie("accessToken", options)
      .cookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export { 
   registerUser,
   loginUser,
   logoutUser
};