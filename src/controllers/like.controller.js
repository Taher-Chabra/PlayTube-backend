import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "express-async-handler";

// toggle like on video

const toggleVideoLike = asyncHandler(async (req, res) => {
   const {videoId} = req.params

   if (!videoId || !mongoose.isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid video ID")
   }

   const video = await Video.findById(videoId)
   if (!video) {
      throw new ApiError(404, "Video not found")
   }

   const existingLike = await Like.findOne({
      contentType: "video",
      contentId: videoId,
      likedBy: req.user._id,
   });

   // if like exists, delete it (unlike)

   if (existingLike) {
      await Like.findByIdAndDelete(existingLike._id);
      return res
         .status(200)
         .json(new ApiResponse(200, {}, "Video unliked successfully"));
   }

   // if like does not exist, create it (like)

   const newLike = await Like.create({
      contentType: "video",
      contentId: videoId,
      likedBy: req.user._id,
   });

   if (!newLike) {
      throw new ApiError(500, "Failed to like video")
   }

   return res
      .status(201)
      .json(new ApiResponse(201, newLike, "Video liked successfully"));
})

// toggle like on comment

const toggleCommentLike = asyncHandler(async (req, res) => {
   const {commentId} = req.params

   if (!commentId || !mongoose.isValidObjectId(commentId)) {
      throw new ApiError(400, "Invalid comment ID")
   }

   const comment = await Comment.findById(commentId)
   if (!comment) {
      throw new ApiError(404, "Comment not found")
   }

   const existingLike = await Like.findOne({
      contentType: "comment",
      contentId: commentId,
      likedBy: req.user._id,
   });

   // if like exists, delete it (unlike)
   if (existingLike) {
      await Like.findByIdAndDelete(existingLike._id);
      return res
         .status(200)
         .json(new ApiResponse(200, {}, "Comment unliked successfully"));
   }

   // if like does not exist, create it (like)
   const newLike = await Like.create({
      contentType: "comment",
      contentId: commentId,
      likedBy: req.user._id,
   });

   if (!newLike) {
      throw new ApiError(500, "Failed to like comment")
   }

   return res
      .status(201)
      .json(new ApiResponse(201, newLike, "Comment liked successfully"));
})

// toggle like on tweet

const toggleTweetLike = asyncHandler(async (req, res) => {
   const {tweetId} = req.params
   
   if (!tweetId || !mongoose.isValidObjectId(tweetId)) {
      throw new ApiError(400, "Invalid tweet ID")
   }

   const tweet = await Tweet.findById(tweetId)
   if (!tweet) {
      throw new ApiError(404, "Tweet not found")
   }

   const existingLike = await Like.findOne({
      contentType: "tweet",
      contentId: tweetId,
      likedBy: req.user._id,
   });

   // if like exists, delete it (unlike)
   if (existingLike) {
      await Like.findByIdAndDelete(existingLike._id);
      return res
         .status(200)
         .json(new ApiResponse(200, {}, "Tweet unliked successfully"));
   }

   // if like does not exist, create it (like)
   const newLike = await Like.create({
      contentType: "tweet",
      contentId: tweetId,
      likedBy: req.user._id,
   });

   if (!newLike) {
      throw new ApiError(500, "Failed to like tweet")
   }

   return res
      .status(201)
      .json(new ApiResponse(201, newLike, "Tweet liked successfully"));
})

// get all liked videos

const getLikedVideos = asyncHandler(async (req, res) => {
   const likedVideos = await Like.find({
      contentType: "video",
      likedBy: req.user._id,
   }).populate("contentId");

   if (!likedVideos) {
      throw new ApiError(404, "No liked videos found")
   }

   return res
      .status(200)
      .json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"));
})

// get all liked tweets

const getLikedTweets = asyncHandler(async (req, res) => {
   const likedTweets = await Like.find({
      contentType: "tweet",
      likedBy: req.user._id,
   }).populate("contentId");

   if (!likedTweets) {
      throw new ApiError(404, "No liked tweets found")
   }

   return res
      .status(200)
      .json(new ApiResponse(200, likedTweets, "Liked tweets fetched successfully"));
})

export {
   toggleCommentLike,
   toggleTweetLike,
   toggleVideoLike,
   getLikedVideos,
   getLikedTweets
}