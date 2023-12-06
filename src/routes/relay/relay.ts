import express from "express";
import { refreshMyEpitechToken } from '../../get_token';
import { executeEpitestRequest } from '../../api';
import dbManager from "../..";
import { decryptString } from "../../crypto";

const relayRouter = express.Router();

async function getUserListByStatus(status: string) {
    try {
        const userList = await dbManager.getUserByStatus(status, "id, email, cookies");
        return { success: true, data: userList };
    } catch (error) {
        return { success: false, error: error };
    }
}

/**
 * @swagger
 * /relay/{userEmail}/epitest/{path}:
 *   get:
 *     tags:
 *       - Relay
 *     summary: Get information from Epitech API using user's credentials.
 *     description: Get information from the Epitech API using the user's credentials.
 *     parameters:
 *       - in: path
 *         name: userEmail
 *         required: true
 *         description: The email of the user.
 *         schema:
 *           type: string
 *       - in: path
 *         name: path
 *         required: true
 *         description: The path for the Epitech API request.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful Epitech API request
 *         content:
 *           application/json:
 *             example:
 *               // Epitech API response
 *       401:
 *         description: Unauthorized, user credentials are invalid
 *         content:
 *           application/json:
 *             example:
 *               message: "Unauthorized"
 *       404:
 *         description: User not found or Epitech API resource not found
 *         content:
 *           application/json:
 *             example:
 *               message: "User not found"
 *       410:
 *         description: Cookies are expired
 *         content:
 *           application/json:
 *             example:
 *               message: "Cookies are expired"
 *       500:
 *         description: Internal server error or Relay error
 *         content:
 *           application/json:
 *             example:
 *               message: "Internal server error"
 */
relayRouter.get('/:userEmail/epitest/*', async (req, res) => {
    try {
        const userList = await getUserListByStatus('ok');
        if (userList.success === false) {
            res.status(404).send({ message: "User not found" });
            return;
        }

        const userInfo = Array.isArray(userList.data) ? userList.data.find((user: any) => user['email'] === req.params['userEmail']) : undefined;
        if (!userInfo) {
            res.status(404).send({ message: "User not found" });
            return;
        }
        if (userInfo.cookies)
            userInfo.cookies = decryptString(userInfo.cookies);
        let content = await executeEpitestRequest(req, req.params['userEmail']);
        if (content.status === 401) {
            const token = await refreshMyEpitechToken(userInfo['cookies']);
            if (token == "token_error") {
                dbManager.updateUser(userInfo['id'], "cookies_status = 'expired'");

                res.status(410).send({ message: "Cookies are expired" });
                return;
            } else {
                content = await executeEpitestRequest(req, token);
            }
        }
        res.status(content.status).send(content.data);
    } catch (error) {
        console.log(error);
        res.status(500).send("Relay error");
    }
});

export default relayRouter;
