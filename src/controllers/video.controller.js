import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

// Fetch all videos

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const matchStage = { isPublished: true };

  if (isValidObjectId(userId)) {
    matchStage.owner = new mongoose.Types.ObjectId(userId);
  }

  if (query) {
    matchStage.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  const aggregate = Video.aggregate([
    {
      $match: matchStage,
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
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$owner",
    },
    {
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        thumbnail: 1,
        videoFile: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        createdAt: 1,
        updatedAt: 1,
        owner: "$owner",
      },
    },
  ]);

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const videos = await Video.aggregatePaginate(aggregate, options);

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

// Publish a video

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  
  if (title.trim() === "" || description.trim() === "") {
    throw new ApiError(400, "Title and description are required");
  }

  const videoFileLocalPath = req.files?.videoFile[0]?.path;
  let thumbnailLocalPath;

  if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
   thumbnailLocalPath = req.files.thumbnail[0].path;
  }

  if (!videoFileLocalPath) {
   throw new ApiError(400, "Video file is required");
  }

  const uploadedVideo = await uploadOnCloudinary(videoFileLocalPath);
  const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!uploadedVideo) {
    throw new ApiError(500, "Failed to upload video to cloudinary");
  }

  const video = await Video.create({
   title: title.trim(),
   description: description.trim(),
   videoFile: uploadedVideo.url,
   thumbnail: uploadedThumbnail.url || "",
   duration: uploadedVideo.duration,
   owner: req.user._id,
  });

  if (!video) {
    throw new ApiError(500, "Failed to create video document");
  }

  return res
   .status(201)
   .json(new ApiResponse(201, video, "Video published successfully"));
});

// Fetch a video by ID

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId){
    throw new ApiError(400, "Video ID is required");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
        isPublished: true,
      },
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
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$owner",
    },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        thumbnail: 1,
        videoFile: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        createdAt: 1,
        updatedAt: 1,
        owner: "$owner",
      },
    },
  ]);

  if (!video?.length) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video fetched successfully"));
});

// Increment view count

const incrementViewCount = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  if (req?.user?.watchHistory?.includes(videoId)) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "View already counted"));
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId, 
    {
      $inc: { views: 1 }
    },
    { new: true }
  );

  req.user.watchHistory.push(videoId);
  await req.user.save()

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "View count incremented"));
});

// Update video details

const updateVideoDetails = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this video");
  }

  video.title = title.trim();
  video.description = description.trim();

  await video.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video details updated successfully"));

});

// Update video thumbnail

const updateVideoThumbnail = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const thumbnailLocalPath = req.file?.path;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this video");
  }

  const currentThumbnail = video.thumbnail;
  if (currentThumbnail) {
    const publicId = currentThumbnail.split("/").pop().split(".")[0];
    await deleteFromCloudinary(publicId);
  }

  const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!uploadedThumbnail) {
    throw new ApiError(500, "Failed to upload thumbnail to cloudinary");
  }
  video.thumbnail = uploadedThumbnail.url;
  await video.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Thumbnail updated successfully"));

});

// Delete video

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this video");
  }

  const publicId = video.videoFile.split("/").pop().split(".")[0];
  const deleteResult = await deleteFromCloudinary(publicId);

  if (deleteResult?.result === "not found") {
    throw new ApiError(404, "Video not found on cloudinary");
  }

  const updatedVideo = await Video.findByIdAndDelete(videoId);

  if (!updatedVideo) {
    throw new ApiError(500, "Failed to delete video document");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

// Toggle publish status

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this video");
  }

  video.isPublished = !video.isPublished;
  await video.save({ validateBeforeSave: false });

  const statusMessage = video.isPublished
  ? "Video published"
  : "Video unpublished";

  return res
    .status(200)
    .json(new ApiResponse(200, video, statusMessage));
});

export {
  getAllVideos,
  publishAVideo,
  incrementViewCount,
  getVideoById,
  updateVideoDetails,
  updateVideoThumbnail,
  deleteVideo,
  togglePublishStatus,
};
