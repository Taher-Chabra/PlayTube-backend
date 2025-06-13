import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware';
import { getLikedTweets, getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike } from '../controllers/like.controller';

const router = Router();

router.use(verifyJWT);

router.route('/toggle/video/:videoId').post(toggleVideoLike);
router.route('/toggle/comment/:commentId').post(toggleCommentLike);
router.route('/toggle/tweet/:tweetId').post(toggleTweetLike);
router.route('/videos').get(getLikedVideos);
router.route('/tweets').get(getLikedTweets);

export default router;