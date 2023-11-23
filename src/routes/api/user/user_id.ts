import express from "express";
import bcrypt from "bcryptjs";
import axios, { AxiosRequestConfig } from "axios";
import { verifyToken, verifyAuth } from '../../../token';
import { decryptAllCookies } from '../../../crypto';
import dbManager from '../../../index';
import { encryptString } from '../../../crypto';
import { is_num } from '../../../utils';

const routeUserId = express.Router();

// async function executeRelayRequest(method: any, endpoint: string, body = {}) {
//     const host: any = process.env.HOST_NAME;
//     const port: any = process.env.PORT;
//     const res = await axios({
//         method: method,
//         url: `http://${host}:${port}` + endpoint,
//         // headers: {
//         //     "Authorization": "Bearer " + process.env.API_DB_TOKEN,
//         // },
//         data: body
//     }).catch(e => e.response);
//     if (res === undefined)
//         return (false);
//     return res;
// }

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

routeUserId.get("/:id", verifyToken, async (req: any, res: express.Response) => {
    if (!verifyAuth(req, res, true)) {
        !res.headersSent ? res.status(403).json({ msg: "Authorization denied" }) : 0;
        return;
    }

    dbManager.getUserByEmailOrId(req.token, req.params.id)
        .then((result) => {
            if (!result || !result[0]) {
                res.sendStatus(404);
            } else {
                decryptAllCookies(result);
                res.send(result[0]);
            }
        }
        ).catch((err) => {
            res.status(500).json({ msg: "Internal server error", err: err });
        });
});

routeUserId.put("/:id", verifyToken, async (req: any, res: express.Response) => {
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

    dbManager.getUserByEmailOrId(req.token, req.params.id)
        .then((result) => {
            if (!result || !result[0]) {
                res.sendStatus(404);
            } else {
                dbManager.updateUser(req.params.id, updateQueryString)
                    .then((result1) => {
                        if (result1.affectedRows > 0) {
                            dbManager.getUserByEmailOrId(req.token, req.params.id)
                                .then((result2) => {
                                    if (!result2 || !result2[0]) {
                                        res.sendStatus(404);
                                    } else {
                                        // if (req.body.hasOwnProperty('email'))
                                        // executeRelayRequest('DELETE', `/account/delete/${oldRows[0].email}`);
                                        decryptAllCookies(result2);
                                        res.status(200).send(result2[0]);
                                    }
                                }
                                ).catch((err2) => {
                                    res.status(500).json({ msg: "Internal server error", err: err2 });
                                });
                        } else
                            res.sendStatus(404)
                    }
                    ).catch((err1) => {
                        res.status(500).json({ msg: "Internal server error", err: err1 });
                    });
            }
        }
        ).catch((err) => {
            res.status(500).json({ msg: "Internal server error", err: err });
        });
});

routeUserId.delete("/:id", verifyToken, async (req: express.Request, res: express.Response) => {
    if (!is_num(req.params.id)) {
        res.status(400).json({ msg: "Bad parameter" });
        return;
    }
    if (!verifyAuth(req, res, true)) {
        !res.headersSent ? res.status(403).json({ msg: "Authorization denied" }) : 0;
        return;
    }
    dbManager.getUserById(req.params.id)
        .then((result) => {
            dbManager.deleteUser(req.params.id)
                .then((result1) => {
                    if (!result[0] && result1.affectedRows === 1) {
                        res.status(200).json({ msg: `Successfully deleted record number: ${req.params.id}` });
                    } else
                        res.sendStatus(404);
                }
                ).catch((err1) => {
                    res.status(500).json({ msg: "Internal server error", err: err1 });
                });
        }
        ).catch((err) => {
            res.status(500).json({ msg: "Internal server error", err: err });
        });
});

export default routeUserId;
