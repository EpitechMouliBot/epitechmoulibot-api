import express from 'express';
import routeLogin from './relay/relay';
import userRouter from './user/router';
import authRouter from './auth/router';

const apiRouter = express.Router();

apiRouter.use('/relay', routeLogin);
apiRouter.use('/user', userRouter);
apiRouter.use('/auth', authRouter);

export default apiRouter;
