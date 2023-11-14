import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import express from "express";
import { con } from '../../../index';
import { checkEmail, checkPassword } from '../../../utils';
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
    con.query(`SELECT * FROM user WHERE email = "${req.body["email"]}";`, function (err, rows: any[]) {
        if (err) {
            res.status(500).json({ msg: "Internal server error" });
            // log.error("Internal server error");
            // log.debug(err, false);
            return;
        }
        if (rows[0] !== undefined) {
            res.status(418).json({ msg: "Account already exists" });
            return;
        }
        con.query(`INSERT INTO user(email, password, cookies) VALUES("${req.body["email"]}", "${passwordHash}", '${cookiesHash}')`, function (err2, result) {
            if (err2) {
                res.status(500).json({ msg: "Internal server error" });
                // log.error("Internal server error");
                // log.debug(err2, false);
                return;
            }
            con.query(`SELECT * FROM user WHERE email = "${req.body["email"]}";`, function (err3, rows: any[]) {
                if (err3) {
                    res.status(500).json({ msg: "Internal server error" });
                    // log.error("Internal server error");
                    // log.debug(err3, false);
                } else if (rows !== undefined && rows[0] !== undefined) {
                    if (process.env.SECRET) {
                        let token = jwt.sign({ id: `${rows[0].id}` }, process.env.SECRET, { expiresIn: '40w' });
                        res.status(201).json({ token: token, id: rows[0].id });
                    } else {
                        res.status(500).json({ msg: "Internal server error" });
                    }
                } else
                    res.sendStatus(404);
            });
        });
    });
});

export default routeRegister;
