import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// toggle subscription (subscribe/unsubscribe)

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId || !isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid or missing channel ID");
  }

   const existingSubscription = await Subscription.findOne({
      channel: channelId,
      subscriber: req.user._id,
   });

   // if subscription exists, delete it (unsubscribe)
   if (existingSubscription) {
      await Subscription.findByIdAndDelete(existingSubscription._id);
      return res
         .status(200)
         .json(new ApiResponse(200, {}, "Unsubscribed successfully"));
   }

   // if subscription does not exist, create it (subscribe)
   const newSubscription = await Subscription.create({
      channel: channelId,
      subscriber: req.user._id,
   });

   return res
      .status(201)
      .json(new ApiResponse(201, newSubscription, "Subscribed successfully"));
});

// get subscribers of a channel

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId || !isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid or missing channel ID");
  }

  const susbcribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
      },
    },
    {
      $unwind: "$subscriber",
    },
    {
      $project: {
        subscriberId: "$subscriber._id",
        username: "$subscriber.username",
        fullName: "$subscriber.fullName",
        avatar: "$subscriber.avatar",
        createdAt: 1,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  if (!susbcribers?.length) {
    throw new ApiError(404, "No subscribers found for this channel");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, susbcribers[0], "Subscribers fetched successfully")
    );
});

// get subscribed channels of a user

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!subscriberId || !isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid or missing subscriber ID");
  }

  const subscribedChannels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribedTo",
      },
    },
    {
      $unwind: "$channel",
    },
    {
      $project: {
        channelId: "$channel._id",
        username: "$channel.username",
        fullName: "$channel.fullName",
        avatar: "$channel.avatar",
        createdAt: 1,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  if (!subscribedChannels?.length) {
    throw new ApiError(404, "No subscribed channels found for this user");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels[0],
        "Subscribed channels fetched successfully"
      )
    );
});

export {
   toggleSubscription, 
   getUserChannelSubscribers, 
   getSubscribedChannels 
  };
