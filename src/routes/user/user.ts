import express from "express";
import { verifyToken, verifyAuth } from '../../token';
import { decryptAllCookies } from '../../crypto';
import dbManager from '../../index';

const routeUser = express.Router();

/**
 * @swagger
 * /user/all:
 *   get:
 *     tags:
 *       - User
 *     summary: Get information for all users.
 *     description: Get information for all users (requires authentication).
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successful retrieval of user information
 *         content:
 *           application/json:
 *             example:
 *               // Provide an example response if available
 *       403:
 *         description: Authorization denied
 *         content:
 *           application/json:
 *             example:
 *               msg: "Authorization denied"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               msg: "Internal server error"
 */
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
            res.status(500).json({ msg: "Internal server error", err: err });
        });
});

export default routeUser;
