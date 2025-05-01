import mongoose from 'mongoose';
import { Comment } from '../models/comment.model';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

// Fetch all comments for a video

const getVideoComments = asyncHandler(async (req, res) => {
   const {videoId} = req.params
   const {page = 1, limit = 10} = req.query

   if (!videoId || !mongoose.isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid video ID or video not found");
   }

   const aggregate = Comment.aggregate([
      {
         $match: { video: new mongoose.Types.ObjectId(videoId) }
      },
      {
         $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",
            pipeline: [
               {
                  $project: {
                     username: 1,
                     avatar: 1,
                  }
               }
            ]
         }
      },
      {
         $unwind: "$owner"
      },
      {
         $project: {
            _id: 1,
            content: 1,
            createdAt: 1,
            updatedAt: 1,
            owner: 1
         }
      },
      {
         $sort: { createdAt: -1 }
      }
   ])

   const options = {
      page: parseInt(page),
      limit: parseInt(limit),
   }

   const comments = await Comment.aggregatePaginate(aggregate, options)

   return res
      .status(200)
      .json(new ApiResponse(200, comments, "Comments fetched successfully"))

})

// Add a comment to a video

const addComment = asyncHandler(async (req, res) => {
   const { videoId } = req.params;
   const { content } = req.body;

   if (!videoId || !mongoose.isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid video ID or video not found");
   }

   if (!content) {
      throw new ApiError(400, "Comment content is required");
   }

   const newComment = await Comment.create({
      owner: req.user._id,
      content,
      video: videoId,
   })

   if (!newComment) {
      throw new ApiError(500, "Failed to add comment");
   }

   return res
      .status(201)
      .json(new ApiResponse(201, newComment, "Comment added successfully"));
})

// Update a comment

const updateComment = asyncHandler(async (req, res) => {
   const { commentId } = req.params;
   const { content } = req.body;

   if (!commentId || !mongoose.isValidObjectId(commentId)) {
      throw new ApiError(400, "Invalid or missing comment ID");
   }

   if (!content) {
      throw new ApiError(400, "Comment content is required");
   }

   const updatedComment = await Comment.findOneAndUpdate(
      { _id: commentId, owner: req.user._id },
      { content },
      { new: true }
   )

   if (!updatedComment) {
      throw new ApiError(404, "Comment not found or you are not the owner of this comment");
   }

   return res
      .status(200)
      .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
})

// Delete a comment

const deleteComment = asyncHandler(async (req, res) => {
   const { commentId } = req.params;

   if (!commentId || !mongoose.isValidObjectId(commentId)) {
      throw new ApiError(400, "Invalid or missing comment ID");
   }

   const deletedComment = await Comment.findOneAndDelete({
      _id: commentId,
      owner: req.user._id,
   })

   if (!deletedComment) {
      throw new ApiError(404, "Comment not found or you are not the owner of this comment");
   }

   return res
      .status(200)
      .json(new ApiResponse(200, deletedComment, "Comment deleted successfully"));
})

export {
   getVideoComments, 
   addComment, 
   updateComment,
   deleteComment
}