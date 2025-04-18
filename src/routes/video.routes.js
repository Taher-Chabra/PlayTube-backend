import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  incrementViewCount,
  publishAVideo,
  togglePublishStatus,
  updateVideoDetails,
  updateVideoThumbnail,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/")
  .get(getAllVideos)
  .post(
    upload.fields([
      {
        name: "videoFile",
        maxCount: 1,
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    publishAVideo
  );

router
  .route("/:videoId")
  .get(getVideoById)
  .delete(deleteVideo)
  .patch(upload.single("thumbnail"), updateVideoDetails);

router
  .route('/:videoId/thumbnail')
  .patch(upload.single("thumbnail"), updateVideoThumbnail);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

router.route('/:videoId/view').patch(incrementViewCount);

export default router;
