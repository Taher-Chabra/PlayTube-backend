import mongoose from 'mongoose';
import { Tweet } from '../models/tweet.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// create a tweet

const createTweet = asyncHandler(async (req, res) => {
   const { content } = req.body;
   if (!content) {
      throw new ApiError(400, "Content is required");
   }

   const tweet = await Tweet.create(
      {
         content,
         owner: req.user._id,
      }
   )

   if (!tweet) {
      throw new ApiError(500, "Failed to create tweet");
   }

   return res
      .status(201)
      .json(new ApiResponse(201, tweet, "Tweet created successfully"));
})

// get all tweets of a user

const getUserTweets = asyncHandler(async (req, res) => { 
   const { userId } = req.params;
   if (!userId || !mongoose.isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid or missing user ID");
   }

   const userTweets = await Tweet
      .find({ owner: userId })
      .populate("owner", "fullName username avatar")

   if (userTweets.length === 0) {
      throw new ApiError(404, "No tweets found for this user");
   }

   return res
      .status(200)
      .json(new ApiResponse(200, userTweets, "User tweets fetched successfully"));
})

// update a tweet

const updateTweet = asyncHandler(async (req, res) => {
   const { tweetId } = req.params;
   const { content } = req.body;

   if (!tweetId || !mongoose.isValidObjectId(tweetId)) {
      throw new ApiError(400, "Invalid or missing tweet ID");
   }
   if (!content) {
      throw new ApiError(400, "Content is required");
   }

   const updatedTweet = await Tweet.findOneAndUpdate(
      { _id: tweetId, owner: req.user._id },
      { content },
      { new: true }
   )

   if (!updatedTweet) {
      throw new ApiError(404, "Tweet not found or you are not the owner of this tweet");
   }

   return res
      .status(200)
      .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
})

const deleteTweet = asyncHandler(async (req, res) => {
   const { tweetId } = req.params;

   if (!tweetId || !mongoose.isValidObjectId(tweetId)) {
      throw new ApiError(400, "Invalid or missing tweet ID");
   }

   const deletedTweet = await Tweet.findByIdAndDelete(
      { _id: tweetId, owner: req.user._id }
   )

   if (!deletedTweet) {
      throw new ApiError(404, "Tweet not found or you are not the owner of this tweet");
   }

   return res
      .status(200)
      .json(new ApiResponse(200, {}, "Tweet deleted successfully"));

})

export {
   createTweet,
   getUserTweets,
   updateTweet,
   deleteTweet
}