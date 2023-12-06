import express from "express";
import bodyParser from "body-parser";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

import { handleAllUserStatus } from './check_status';
import apiRouter from './routes/router';

import DatabaseManager from './callDatabase';

const ONE_MINUTE_IN_MS = 60 * 1000;

require('dotenv').config();
const app = express();

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Documentation',
            version: '1.0.0',
            description: 'Documentation for epitechmoulibot API',
        },
        tags: [
            {
                name: 'Auth',
                description: 'Endpoints for user authentication',
            },
            {
                name: 'User',
                description: 'Endpoints for user information',
            },
            {
                name: 'Relay',
                description: 'Endpoints for relaying requests to other services',
            },
        ],
    },
    apis: ['./src/routes/**/*.ts'],
};

const specs = swaggerJsdoc(options);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

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

    app.use('/', apiRouter);

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
