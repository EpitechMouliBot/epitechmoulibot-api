import express from "express";
import bodyParser from "body-parser";

import relayRouter from './routes/relay';
import { handleAllUserStatus } from './check_status';
import routeLogin from './routes/api/auth/login';
import routeRegister from './routes/api/auth/register'
import routeUser from './routes/api/user/user';
import routeUserId from './routes/api/user/user_id'

import DatabaseManager from './callDatabase';

const ONE_MINUTE_IN_MS = 60 * 1000;

require('dotenv').config();
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.json());

const checkEnvironment = () => {
    const requiredEnvVars = [
        'MYSQL_DATABASE',
        'HOST_NAME',
        'PORT',
        'MYSQL_HOST',
        'MYSQL_USER',
        'MYSQL_PASSWORD',
        'API_DB_TOKEN',
        'SECRET',
        'OTHER_APP_TOKEN',
    ];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    if (missingEnvVars.length > 0) {
        console.error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
        process.exit(84);
    }
}

function scheduleTask(task: () => void, interval: number) {
    task();
    setInterval(task, interval);
}

checkEnvironment();
const dbManager = new DatabaseManager();

(async () => {

    app.use('/relay', relayRouter);
    app.use('/api/auth/register', routeRegister);
    app.use('/api/auth/login', routeLogin);
    app.use('/api/user', routeUser);
    app.use('/api/user', routeUserId);

    app.get("/", (req, res) => {
        res.send("epitechmoulibot-api online");
    });
    const host: any = process.env.HOST_NAME;
    const port: any = process.env.PORT;
    app.listen(port, host, () => {
        console.log(`epitechmoulibot-api started at http://${host}:${port}`);
    });

    scheduleTask(() => handleAllUserStatus(), ONE_MINUTE_IN_MS * 10);
})();

export default dbManager;
