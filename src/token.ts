import jwt from "jsonwebtoken";

import express from "express";
import dbManager from "./index";

export function verifyToken(req: any, res: express.Response, next: express.NextFunction) {
    const bearerHeader = req.headers['authorization'];

    if (typeof (bearerHeader) !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        req.token = bearerToken;

        if (req.token === process.env.OTHER_APP_TOKEN) {
            next();
            return;
        }
        try {
            if (process.env.SECRET) {
                const decoded = jwt.verify(req.token, process.env.SECRET) as jwt.JwtPayload;
                if (!decoded || typeof decoded.id !== 'string') {
                    res.status(403).json({ msg: "Invalid token payload" });
                    return;
                }
                dbManager.checkTokenValidity(decoded.id)
                    .then((result) => {
                        if (result)
                            next();
                        else
                            res.status(403).json({ msg: "Token is not valid" });
                    }
                    ).catch((err) => {
                        res.status(500).json({ msg: "Internal server error" });
                    });
            } else {
                res.status(403).json({ msg: "Secret is not valid" });
            }
        } catch (err) {
            res.status(403).json({ msg: "Token is not valid" });
        }
    } else {
        res.status(403).json({ msg: "No token, authorization denied" });
    }
}

export function get_id_with_token(req: any, res: express.Response) {
    try {
        if (process.env.SECRET) {
            const decoded = jwt.verify(req.token, process.env.SECRET) as jwt.JwtPayload;
            if (decoded && typeof decoded.id === 'string') {
                return decoded.id;
            } else {
                res.status(403).json({ msg: "Invalid token payload" });
            }
        } else {
            res.status(403).json({ msg: "Secret is not valid" });
        }
    } catch (err) {
        res.status(403).json({ msg: "Token is not valid" });
    }
    return -1;
}

export function verifyAuth(req: any, res: any, verifId: boolean) {
    if (req.token === process.env.OTHER_APP_TOKEN)
        return true;

    if (verifId) {
        let token_id = get_id_with_token(req, res);
        if (token_id === -1)
            return false;
        return token_id === req.params.id;
    }
    return false;
}
