import express from "express";
import bodyParser from "body-parser";

import { checkStatusUsers } from './check_status';
import { asyncSleep } from './utils';
import relayRouter from './routes/relay';
import routeLogin from './routes/api/auth/login';
import routeRegister from './routes/api/auth/register'
import routeUser from './routes/api/user/user';
import routeUserId from './routes/api/user/user_id'

require('dotenv').config();
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.json());

async function infinitLoopForUserStatus() {
    while (true) {
        await checkStatusUsers("wait");
        await checkStatusUsers("new");
        await asyncSleep((1000 * 60 ) * 5);
    }
}

(async () => {
    infinitLoopForUserStatus(); // a voir si je garde ou get dans chaque request du relay // voir si on fait bien le test deja quand le mec créé son compte ou refresh les cookies

    app.use('/relay', relayRouter);
    app.use('/api/auth/register', routeRegister);
    app.use('/api/auth/login', routeLogin);
    app.use('/api/user/user', routeUser);
    app.use('/api/user/user_id', routeUserId);

    app.get("/", (req, res) => {
        res.send("epitechmoulibot-api online");
    });
    const host: any = process.env.HOST_NAME;
    const port: any = process.env.PORT;
    app.listen(port, host, () => {
        console.log(`epitechmoulibot-api started at http://${host}:${port}`);
    });
})();
