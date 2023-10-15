import express from "express";
import { verifyToken, verifyAuth } from '../../../token';
import { decryptAllCookies } from '../../../crypto';
import { con } from '../../../index';

const routeUser = express.Router();

routeUser.get("/user", verifyToken, async (req: any, res: express.Response) => {
    if (!verifyAuth(req, res, false)) {
        !res.headersSent ? res.status(403).json({ msg: "Authorization denied" }) : 0;
        return;
    }
    const queryString = (req.token === process.env.OTHER_APP_TOKEN) ? `*` : `id, email, user_id, channel_id, cookies_status, discord_status, created_at`;
    con.query(`SELECT ${queryString} FROM user;`, function (err, rows: any[]) {
        if (err) {
            res.status(500).json({ msg: "Internal server error" });
            // log.error("Internal server error");
            // log.debug(err, false);
        } else {
            decryptAllCookies(rows);
            res.send(rows);
        }
    });
});

routeUser.get("/user/status/:status", verifyToken, async (req: any, res: express.Response) => {
    if (!verifyAuth(req, res, false)) {
        !res.headersSent ? res.status(403).json({ msg: "Authorization denied" }) : 0;
        return;
    }
    const queryString = (req.token === process.env.OTHER_APP_TOKEN) ? `*` : `id, email, user_id, channel_id, cookies_status, discord_status, created_at`;
    con.query(`SELECT ${queryString} FROM user WHERE cookies_status = "${req.params.status}";`, function (err, rows: any[]) {
        if (err) {
            res.status(500).json({ msg: "Internal server error" });
            // log.error("Internal server error");
            // log.debug(err, false);
        } else {
            decryptAllCookies(rows);
            res.send(rows);
        }
    });
});

export default routeUser;
