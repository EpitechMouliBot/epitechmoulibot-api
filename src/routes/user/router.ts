import express from 'express';
import routeUser from './user';
import routeStatus from './status';
import routeUserId from './user_id';

const userRouter = express.Router();

userRouter.use('/', routeUser);
userRouter.use('/id', routeUserId);
userRouter.use('/status', routeStatus);

export default userRouter;
