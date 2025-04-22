import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware';
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from '../controllers/subscription.controller';

const router = Router();

router.use(verifyJWT);

router
   .route('/channel/:channelId')
   .get(getSubscribedChannels)
   .patch(toggleSubscription);

router.route('/user/:subscriberId').get(getUserChannelSubscribers);

export default router;