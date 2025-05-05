import mongoose from "mongoose";
import Playlist from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create a new playlist

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    throw new ApiError(400, "Name and description are required");
  }

  const newPlaylist = await Playlist.create({
    owner: req.user._id,
    name,
    description,
  });

  if (!newPlaylist) {
    throw new ApiError(500, "Failed to create playlist");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, newPlaylist, "Playlist created successfully"));
});

// Get all playlists of a user

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const playlists = await Playlist.find({ owner: userId }).populate("videos");

  if (!playlists) {
    throw new ApiError(404, "No playlists found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlists, "Playlists retrieved successfully"));
});

// Get a playlist by ID

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId || !mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid or missing playlist ID");
  }

  const playlist = await Playlist.findById(playlistId).populate("videos");

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist retrieved successfully"));
});

// Add a video to a playlist

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId || !mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid or missing playlist ID");
  }
  if (!videoId || !mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid or missing video ID");
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $addToSet: { videos: videoId } },
    { new: true }
  );

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        id: playlist._id,
        name: playlist.name,
        videos: playlist.videos,
      },
      "Video added to playlist successfully"
    )
  );
});

// Remove a video from a playlist

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId || !mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid or missing playlist ID");
  }
  if (!videoId || !mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid or missing video ID");
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $pull: { videos: videoId } },
    { new: true }
  );

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        id: playlist._id,
        name: playlist.name,
        videos: playlist.videos,
      },
      "Video removed from playlist successfully"
    )
  );
});

// Delete a playlist

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId || !mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid or missing playlist ID");
  }

  const deletePlaylist = await Playlist.findByIdAndDelete(playlistId);

  if (!deletePlaylist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

// Update a playlist details

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!playlistId || !mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid or missing playlist ID");
  }
  if (!name || !description) {
    throw new ApiError(400, "Name and description are required");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {$set: { name, description }},
    { new: true }
  );

  if (!updatedPlaylist) {
	 throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
	 .json(
		new ApiResponse(
		  200,
		  updatedPlaylist,
		  "Playlist updated successfully"
		)
	 );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
