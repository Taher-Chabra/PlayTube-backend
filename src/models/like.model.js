import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
   contentType: {
      type: String,
      enum: ["video", "comment", "tweet"],
      required: true,
   },
   contentId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "contentType",
      required: true,
   },
   likedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
   }
}, { timestamps: true });

export const Like = mongoose.model("Like", likeSchema);