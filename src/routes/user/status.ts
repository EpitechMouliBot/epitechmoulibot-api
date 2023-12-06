import express from "express";
import { verifyToken, verifyAuth } from '../../token';
import { decryptAllCookies } from '../../crypto';
import dbManager from '../../index';

const routeStatus = express.Router();

/**
 * @swagger
 * /user/status/{status}:
 *   get:
 *     tags:
 *       - User
 *     summary: Get information for users with a specific status.
 *     description: Get information for users with a specific status (requires authentication).
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         description: The status of the users to retrieve.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful retrieval of user information with the specified status
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
routeStatus.get("/:status", verifyToken, async (req: any, res: express.Response) => {
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
            res.status(500).json({ msg: "Internal server error", err: err });
        });
});

export default routeStatus;
