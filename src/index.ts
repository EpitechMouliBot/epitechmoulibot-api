import express from "express";
import bodyParser from "body-parser";
import mysql from "mysql2";

import { infinitLoopForUserStatus } from './check_status';
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

export const con = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});

const checkEnvironment = () => {
    const requiredEnvVars = [
        'MYSQL_DATABASE',
        'HOST_NAME',
        'PORT',
        'MYSQL_HOST',
        'MYSQL_USER',
        'MYSQL_PASSWORD',
        'API_DB_HOST',
        'API_DB_TOKEN',
        'SECRET',
        'OTHER_APP_TOKEN',
        'RELAY_HOST'
    ];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    if (missingEnvVars.length > 0) {
        console.error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
        process.exit(84);
    }
}

(async () => {
    checkEnvironment();

    con.connect(function (err) {
        if (err) throw new Error(`Failed to connect to database ${process.env.MYSQL_DATABASE}`);
        // log.success("Connecté à la base de données " + process.env.MYSQL_DATABASE);
    });

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

    infinitLoopForUserStatus(); // a voir si je garde ou get dans chaque request du relay // voir si on fait bien le test deja quand le mec créé son compte ou refresh les cookies
})();
