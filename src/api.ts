import axios from 'axios';
import express from "express";

require('dotenv').config();

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
