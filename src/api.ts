require('dotenv').config();
import axios, { Method } from 'axios';
import express from "express";

export async function executeBDDApiRequest(endpoint: string, params: string, method: Method, body: object) {
    const host: any = process.env.HOST_NAME;
    const port: any = process.env.PORT;
    const res = await axios({
        method: method,
        url: `http://${host}:${port}` + endpoint + params,
        headers: {
            "Authorization": "Bearer " + process.env.API_DB_TOKEN,
        },
        data: body
    }).catch(e => e.response);
    return res;
}

export async function executeEpitestRequest(req: express.Request, token: string) {
    const res = await axios({
        baseURL: "https://api.epitest.eu/",
        url: req.params['0'],
        headers: {
            "Authorization": "Bearer " + token,
            "Origin": "my.epitech.eu"
        }
    }).catch(e => e.response);
    return res;
}
