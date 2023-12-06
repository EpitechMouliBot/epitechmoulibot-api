import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import express from "express";
import dbManager from '../../index';
import { checkEmail, checkPassword } from '../../utils';

const routeLogin = express.Router();

function error_handling_login(req: express.Request) {
    if (!req.body.hasOwnProperty('email'))
        return false;
    if (!req.body.hasOwnProperty('password'))
        return false;
    if (!checkEmail(req.body["email"]) || !checkPassword(req.body['password']))
        return false;
    return true;
}

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Authenticate and log in to an existing account.
 *     description: Authenticate and log in to an existing user account.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             example:
 *               token: "your_access_token"
 *               id: "user_id"
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             example:
 *               msg: "Invalid Credentials"
 *       403:
 *         description: Forbidden, token is not valid
 *         content:
 *           application/json:
 *             example:
 *               msg: "Token is not valid"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               msg: "Internal server error"
 */

routeLogin.post("/", async (req: express.Request, res: express.Response) => {
    if (!error_handling_login(req)) {
        res.status(400).json({ msg: "Invalid Credentials" });
        return;
    }
    dbManager.checkUserCredentials(req.body["email"], req.body['password'])
        .then((result) => {
            if (!result || !result[0]) {
                res.status(400).json({ msg: "Invalid Credentials" });
            } else if (bcrypt.compareSync(req.body['password'], result[0].password)) {
                if (process.env.SECRET) {
                    const token = jwt.sign({ id: `${result[0].id}` }, process.env.SECRET, { expiresIn: '40w' });
                    res.status(201).json({ token, id: result[0].id });
                } else {
                    res.status(500).json({ msg: "Internal server error" });
                }
            } else
                res.status(403).json({ msg: "Token is not valid" });
        }
        ).catch((err) => {
            res.status(500).json({ msg: "Internal server error", err: err });
        });
});

export default routeLogin;
