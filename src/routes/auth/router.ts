import express from 'express';
import routeLogin from './login';
import routeRegister from './register';

const authRouter = express.Router();

authRouter.use('/login', routeLogin);
authRouter.use('/register', routeRegister);

export default authRouter;
