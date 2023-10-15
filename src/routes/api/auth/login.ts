import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import express from "express";
import { con } from '../../../index';

const routeLogin = express.Router();

function error_handling_login(req: express.Request) {
    if (!req.body.hasOwnProperty('email')) {
        return false;
    }
    if (!req.body.hasOwnProperty('password')) {
        return false;
    }
    return true;
}

routeLogin.post("/login", async (req: express.Request, res: express.Response) => {
    if (!error_handling_login(req)) {
        res.status(400).json({ msg: "Invalid Credentials" });
        return;
    }
    con.query(`SELECT * FROM user WHERE email = "${req.body.email}";`, function (err, rows: any[]) {
        if (err) {
            res.status(500).json({ msg: "Internal server error" });
        } else if (rows[0] === undefined) {
            res.status(400).json({ msg: "Invalid Credentials" });
        } else if (bcrypt.compareSync(req.body.password, rows[0].password)) {
            if (process.env.SECRET) {
                let token = jwt.sign({ id: `${rows[0].id}` }, process.env.SECRET, { expiresIn: '40w' });
                res.status(201).json({ token, id: rows[0].id });
            } else {
                res.status(500).json({ msg: "Internal server error - Missing SECRET" });
            }
        } else {
            res.status(400).json({ msg: "Invalid Credentials" });
        }
    });
});

export default routeLogin;
