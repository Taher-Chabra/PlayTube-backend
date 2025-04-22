import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.modle.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Function to generate access and refresh tokens

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

   const user = await User.findOne(
      { $or: [{ username }, { email }] }
   );

   if (!user) {
      throw new ApiError(404, "User does not exist");
   }

   const isPasswordCorrect = await user.comparePassword(password);

   if (!isPasswordCorrect) {
      throw new ApiError(401, "Invalid password");
   }

   const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

   const loggedInUser = await User
      .findById(user._id)
      .select("-password -refreshToken");

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
            user: loggedInUser, 
            accessToken, 
            refreshToken
         }, 
         "User logged in successful"
      ));
});

// Logout user

const logoutUser = asyncHandler(async (req, res) => {
   const userId = req.user._id

   // remove refresh token from the database
   await User.findByIdAndUpdate(
      userId,
      {
         $unset : {
            refreshToken: 1
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

// Refresh access token if it is expired or used

const refreshAccessToken = asyncHandler(async (req, res) => {
   const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

   if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
   }

   try {
      const decodedToken = jwt.verify(
         incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET,
      )
   
      const user = await User.findById(decodedToken?._id)
   
      if (!user) {
         throw new ApiError(401, "Invalid refresh token");
      }
   
      if (user.refreshToken !== incomingRefreshToken) {
         throw new ApiError(401, "Refresh token is expired or used");
      }
   
      // generate new access and refresh token
      const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id);
   
      const options = {
         httpOnly: true,
         secure: true,
      }
   
      return res
         .status(200)
         .cookie("accessToken", accessToken, options)
         .cookie("refreshToken", newRefreshToken, options)
         .json(
            new ApiResponse(
               200, 
               { accessToken, newRefreshToken }, 
               "Access token refreshed successfully"
            )
         );
   } catch (error) {
      throw new ApiError(401, error?.message || "Invalid refresh token");
   }
});

// change current user password

const changeCurrentPassword = asyncHandler(async (req, res) => {
   const { oldPassword, newPassword } = req.body

   const user = await User.findById(req.user?._id)
   const isPasswordCorrect = await user.comparePassword(oldPassword);

   if (!isPasswordCorrect) {
      throw new ApiError(400, "Invalid password");
   }

   user.password = newPassword;
   await user.save({ validateBeforeSave: false });

   return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password changed successfully"));
});

// Get current user

const getCurrentUser = asyncHandler(async (req, res) => {
   return res
      .status(200)
      .json(new ApiResponse(
         200, 
         req.user, 
         "Current user fetched successfully"
      ));
});

// update user account details

const updateAccountDetails = asyncHandler(async (req, res) => {
   const { fullName, username, email } = req.body;

   if (!fullName || !email || !username) {
      throw new ApiError(400, "All fields are required");
   }
   const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
            fullName,
            username: username.toLowerCase(),
            email
         }
      },
      { new: true }
   ).select("-password");

   return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "User account updated successfully"));
});

// update user avatar

const updateUserAvatar = asyncHandler(async (req, res) => {
   const avatarLocalPath = req.file?.path;

   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is missing");
   }

   // delete old avatar from cloudinary
   const currentAvatar = req.user?.avatar;
   if (currentAvatar) {
      const publicId = currentAvatar.split("/").pop().split(".")[0];
      await deleteFromCloudinary(publicId);
   }

   const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath);

   if (!uploadedAvatar.url) {
      throw new ApiError(400, "Error while uploading avatar to cloudinary");
   }

   const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            avatar: uploadedAvatar.url
         }
      },
      { new: true }
   )

   return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));

});

// update user coverImage

const updateUserCoverImage = asyncHandler(async (req, res) => {
   const coverImageLocalPath = req.file?.path;

   if (!coverImageLocalPath) {
      throw new ApiError(400, "Cover Image file is missing");
   }

   // delete old cover image from cloudinary
   const currentCoverImage = req.user?.coverImage;
   if (currentCoverImage) {
      const publicId = currentCoverImage.split("/").pop().split(".")[0];
      await deleteFromCloudinary(publicId);
   }

   const uploadedCoverImage = await uploadOnCloudinary(coverImageLocalPath);

   if (!uploadedCoverImage.url) {
      throw new ApiError(400, "Error while uploading Cover Image to cloudinary");
   }

   const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            coverImage: uploadedCoverImage.url
         }
      },
      { new: true }
   )

   return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "Cover Image updated successfully"));

});

// Get user channel profile

const getUserChannelProfile = asyncHandler(async (req, res) => {
   const { username } = req.params;
   if (!username?.trim) {
      throw new ApiError(400, "Username is missing");
   }

   const channel = await User.aggregate([
      {
         $match: {
            username: username.toLowerCase()
         }
      },
      {
         $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
         }
      },
      {
         $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo"
         }
      },
      {
         $addFields: {
            subscribersCount: {
               $size: "$subscribers"
            },
            channelsSubscribedToCount: {
               $size: "$subscribedTo"
            },
            isSubscribed: {
               $cond: {
                  if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                  then: true,
                  else: false
               }
            }
         }
      },
      {
         $project: {
            fullName: 1,
            username: 1,
            subscribersCount: 1,
            channelsSubscribedToCount: 1,
            isSubscribed: 1,
            avatar: 1,
            coverImage: 1,
            email: 1,
         }
      }
   ])
   console.log(channel);
   if (!channel?.length) {
      throw new ApiError(404, "Channel does not exist");
   }

   return res
      .status(200)
      .json(new ApiResponse(200, channel[0], "User channel fetched successfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
   const user = await User.aggregate([
      {
         $match: {
            _id: new mongoose.Types.ObjectId(req.user._id)
         }
      },
      {
         $lookup: {
            from: "videos",
            localField: "watchHistory",
            foreignField: "_id",
            as: "watchHistory",
            pipeline: [
               {
                  $lookup: {
                     from: "users",
                     localField: "owner",
                     foreignField: "_id",
                     as: "owner",
                     pipeline: [
                        {
                           $project: {
                              fullName: 1,
                              username: 1,
                              avatar: 1,
                           }
                        }
                     ]
                  }
               },
               {
                  $addFields: {
                     owner: {
                        $first: "$owner"
                     }
                  }
               }
            ]
         }
      }

   ])

   return res
      .status(200)
      .json(new ApiResponse(200, user[0]?.watchHistory, "Watch history fetched successfully"));
});

export { 
   registerUser,
   loginUser,
   logoutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage,
   getUserChannelProfile,
   getWatchHistory,
};