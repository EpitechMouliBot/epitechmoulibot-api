import express from "express";
import bcrypt from "bcryptjs";
import axios, { AxiosRequestConfig } from "axios";
import { verifyToken, verifyAuth } from '../../../token';
import { decryptAllCookies } from '../../../crypto';
import { con } from '../../../index';
import { encryptString } from '../../../crypto';
import { is_num } from '../../../utils';

const routeUserId = express.Router();

async function executeRelayRequest(method: any, endpoint: string, body = {}) {
    const host: any = process.env.HOST_NAME;
    const port: any = process.env.PORT;
    const res = await axios({
        method: method,
        url: `http://${host}:${port}` + endpoint,
        // headers: {
        //     "Authorization": "Bearer " + process.env.API_DB_TOKEN,
        // },
        data: body
    }).catch(e => e.response);
    if (res === undefined)
        return (false);
    return res;
}

function addProperty(queryString: string, property: string, value: string) {
    if (queryString.length > 0)
        queryString += ", ";
    queryString += `${property} = '${value}'`;
    return queryString;
}

function getUpdateQueryString(req: express.Request) {
    let updateQueryString = "";

    if (req.body.hasOwnProperty('password')) {
        const passwordHash = bcrypt.hashSync(req.body.password);
        updateQueryString = addProperty(updateQueryString, 'password', passwordHash);
    }
    if (req.body.hasOwnProperty('cookies')) {
        const cookiesHash = encryptString(req.body.cookies);
        updateQueryString = addProperty(updateQueryString, 'cookies', cookiesHash);
    }
    if (req.body.hasOwnProperty('email')) {
        updateQueryString = addProperty(updateQueryString, 'email', req.body.email);
        updateQueryString = addProperty(updateQueryString, 'cookies_status', 'wait');
    }
    if (req.body.hasOwnProperty('cookies_status') && !req.body.hasOwnProperty('email'))
        updateQueryString = addProperty(updateQueryString, 'cookies_status', req.body.cookies_status);
    if (req.body.hasOwnProperty('user_id'))
        updateQueryString = addProperty(updateQueryString, 'user_id', req.body.user_id);
    if (req.body.hasOwnProperty('channel_id'))
        updateQueryString = addProperty(updateQueryString, 'channel_id', req.body.channel_id);
    if (req.body.hasOwnProperty('last_testRunId'))
        updateQueryString = addProperty(updateQueryString, 'last_testRunId', req.body.last_testRunId);
    if (req.body.hasOwnProperty('discord_status'))
        updateQueryString = addProperty(updateQueryString, 'discord_status', req.body.discord_status);
    return updateQueryString;
}

routeUserId.get("/user/id/:id", verifyToken, async (req: any, res: express.Response) => {
    if (!verifyAuth(req, res, true)) {
        !res.headersSent ? res.status(403).json({ msg: "Authorization denied" }) : 0;
        return;
    }
    const queryString = (req.token === process.env.OTHER_APP_TOKEN) ? `*` : `id, email, user_id, channel_id, cookies_status, discord_status, created_at`;
    con.query(`SELECT ${queryString} FROM user WHERE id = "${req.params.id}" OR email = "${req.params.id}";`, function (err, rows: any[]) {
        if (err) {
            res.status(500).json({ msg: "Internal server error" });
            // log.error("Internal server error");
            // log.debug(err, false);
        } else if (rows[0]) {
            decryptAllCookies(rows);
            res.send(rows[0]);
        } else
            res.sendStatus(404);
    });
});

routeUserId.put("/user/id/:id", verifyToken, async (req: any, res: express.Response) => {
    if (!is_num(req.params.id)) {
        res.status(400).json({ msg: "Bad parameter" });
        return;
    }
    if (!verifyAuth(req, res, true)) {
        !res.headersSent ? res.status(403).json({ msg: "Authorization denied" }) : 0;
        return;
    }

    const updateQueryString = getUpdateQueryString(req);
    if (updateQueryString.length === 0) {
        res.status(400).json({ msg: "Bad parameter" });
        return;
    }

    con.query(`SELECT email FROM user WHERE id = ${req.params.id}`, (err1, oldRows: any[]) => {
        if (err1) {
            res.status(500).json({ msg: "Internal server error" });
            // log.error("Internal server error");
            // log.debug(err1, false);
        } else if (oldRows[0]) {
            con.query(`UPDATE user SET ${updateQueryString} WHERE id = "${req.params.id}";`, (err2, result: any) => {
                if (err2) {
                    res.status(500).json({ msg: "Internal server error" });
                    // log.error("Internal server error");
                    // log.debug(err2, false);
                } else if (result.affectedRows > 0) {
                    const selectQueryString = (req.token === process.env.OTHER_APP_TOKEN) ? `*` : `id, email, user_id, channel_id, cookies_status, discord_status, created_at`;
                    con.query(`SELECT ${selectQueryString} FROM user WHERE id = "${req.params.id}";`, (err3, newRows: any) => {
                        if (err3) {
                            res.status(500).json({ msg: "Internal server error" });
                            // log.error("Internal server error");
                            // log.debug(err3, false);
                        } else {
                            if (req.body.hasOwnProperty('email'))
                                executeRelayRequest('DELETE', `/account/delete/${oldRows[0].email}`);
                            decryptAllCookies(newRows);
                            res.status(200).send(newRows[0]);
                        }
                    });
                } else
                    res.sendStatus(404);
            });
        } else
            res.sendStatus(404);
    });
});

routeUserId.delete("/user/id/:id", verifyToken, async (req: express.Request, res: express.Response) => {
    if (!is_num(req.params.id)) {
        res.status(400).json({ msg: "Bad parameter" });
        return;
    }
    if (!verifyAuth(req, res, true)) {
        !res.headersSent ? res.status(403).json({ msg: "Authorization denied" }) : 0;
        return;
    }
    con.query(`SELECT email FROM user WHERE id = ${req.params.id}`, function (err, rows: any[]) {
        if (err) {
            res.status(500).json({ msg: "Internal server error" })
            // log.error("Internal server error");
            // log.debug(err, false);
        } else {
            con.query(`DELETE FROM user WHERE id = "${req.params.id}";`, function (err2, result: any) {
                if (err2) {
                    res.status(500).json({ msg: "Internal server error" });
                    // log.error("Internal server error");
                    // log.debug(err2, false);
                } else if (rows[0] && result.affectedRows !== 0) {
                    executeRelayRequest('DELETE', `/account/delete/${rows[0].email}`);
                    res.status(200).json({ msg: `Successfully deleted record number: ${req.params.id}` });
                } else
                    res.sendStatus(404);
            });
        }
    });
});

export default routeUserId;
