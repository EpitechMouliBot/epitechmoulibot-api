import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import express from "express";
import dbManager from '../../../index';
import { checkEmail, checkPassword, generateRandomString } from '../../../utils';
import { encryptString } from '../../../crypto';

const routeRegister = express.Router();

function error_handling_register(req: express.Request) {
    if (!req.body.hasOwnProperty('email')) {
        return false;
    }
    if (!req.body.hasOwnProperty('password')) {
        return false;
    }
    if (!req.body.hasOwnProperty('cookies')) {
        return false;
    }
    if (!checkEmail(req.body["email"]) || !checkPassword(req.body['password']))
        return false;
    return true;
}

routeRegister.post("/", async (req: express.Request, res: express.Response) => {
    if (!error_handling_register(req)) {
        res.status(400).json({ msg: "Bad parameter" });
        return;
    }
    const passwordHash = bcrypt.hashSync(req.body['password']);
    const cookiesHash = encryptString(req.body['cookies']);


    dbManager.getUserByEmail(req.body["email"])
        .then((result2) => {
            if (result2 && result2[0]) {
                res.status(418).json({ msg: "Account already exists" });
                return;
            }

            dbManager.insertUser(req.body["email"], passwordHash, cookiesHash, generateRandomString(10))
                .then((result1) => {
                    dbManager.getUserByEmail(req.body["email"])
                        .then((result) => {
                            if (!result || !result[0]) {
                                res.status(400).json({ msg: "Invalid Credentials" });
                            } else {
                                if (process.env.SECRET) {
                                    let token = jwt.sign({ id: `${result[0].id}` }, process.env.SECRET, { expiresIn: '40w' });
                                    res.status(201).json({ token: token, id: result[0].id });
                                } else {
                                    res.status(500).json({ msg: "Internal server error" });
                                }
                            }
                        }
                        ).catch((err) => {
                            res.status(500).json({ msg: "Internal server error", err: err });
                        });
                }
                ).catch((err) => {
                    res.status(500).json({ msg: "Internal server error2", err: err });
                });
        }
        ).catch((err) => {
            res.status(500).json({ msg: "Internal server error3", err: err });
        });

});

export default routeRegister;
