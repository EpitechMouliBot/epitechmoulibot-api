import express from "express";
import { verifyToken, verifyAuth } from '../../../token';
import { decryptAllCookies } from '../../../crypto';
import dbManager from '../../../index';

const routeUser = express.Router();

routeUser.get("/all", verifyToken, async (req: any, res: express.Response) => {
    if (!verifyAuth(req, res, false)) {
        !res.headersSent ? res.status(403).json({ msg: "Authorization denied" }) : 0;
        return;
    }

    dbManager.getAllUsers()
        .then((result) => {
            decryptAllCookies(result);
            res.send(result);
        }
        ).catch((err) => {
            res.status(500).json({ msg: "Internal server error" });
        });
});

routeUser.get("/status/:status", verifyToken, async (req: any, res: express.Response) => {
    if (!verifyAuth(req, res, false)) {
        !res.headersSent ? res.status(403).json({ msg: "Authorization denied" }) : 0;
        return;
    }

    dbManager.getUserByStatus(req.params['status'])
        .then((result) => {
            decryptAllCookies(result);
            res.send(result);
        }
        ).catch((err) => {
            res.status(500).json({ msg: "Internal server error" });
        });
});

export default routeUser;
