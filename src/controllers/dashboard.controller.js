import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

// Get channel stats

const getChannelStats = asyncHandler(async (req, res) => {
   const channelId = req.user._id

   const [totalLikes, totalSubscribers, totalVideosAndViews] = await Promise.all([
      Like.countDocuments({ likedBy: channelId }),
      Subscription.countDocuments({ channel: channelId }),
      Video.aggregate([
         {
            $match: {
               owner: new mongoose.Types.ObjectId(channelId),
            }
         },
         {
            $group: {
               _id: null,
               totalVideos: { $sum: 1 },
               totalViews: { $sum: "$views" },
            }
         },
         {
            $project: {
               _id: 0,
               totalVideos: 1,
               totalViews: 1,
            }
         },
      ])
   ])

   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            {
               totalLikes,
               totalSubscribers,
               totalVideos: totalVideosAndViews[0]?.totalVideos || 0,
               totalViews: totalVideosAndViews[0]?.totalViews || 0,
            },
            "Channel stats retrieved successfully"
         )
      )
})

// Get all the videos uploaded by the channel

const getChannelVideos = asyncHandler(async (req, res) => {
   const channelId = req.user._id
   
   const allVideos = await Video.find({ owner: channelId });

   if (!allVideos) {
      throw new ApiError(404, "No videos found")
   }

   return res
      .status(200)
      .json(new ApiResponse(200, allVideos, "Videos retrieved successfully"))
})

export {
   getChannelStats,
   getChannelVideos
}