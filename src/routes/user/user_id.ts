import express from "express";
import bcrypt from "bcryptjs";
import axios, { AxiosRequestConfig } from "axios";
import { verifyToken, verifyAuth } from '../../token';
import { decryptAllCookies } from '../../crypto';
import dbManager from '../../index';
import { encryptString } from '../../crypto';
import { is_num } from '../../utils';

const routeUserId = express.Router();

function addProperty(queryString: string, property: string, value: string) {
    if (queryString.length > 0)
        queryString += ", ";
    queryString += `${property} = '${value}'`;
    return queryString;
}

function getUpdateQueryString(req: express.Request) {
    let updateQueryString = "";

    if (req.body.hasOwnProperty('email')) {
        updateQueryString = addProperty(updateQueryString, 'email', req.body.email);
        updateQueryString = addProperty(updateQueryString, 'cookies_status', 'wait');
    }
    if (req.body.hasOwnProperty('password')) {
        const passwordHash = bcrypt.hashSync(req.body.password);
        updateQueryString = addProperty(updateQueryString, 'password', passwordHash);
    }
    if (req.body.hasOwnProperty('discord_user_id')) {
        updateQueryString = addProperty(updateQueryString, 'discord_user_id', req.body.discord_user_id);
    }
    if (req.body.hasOwnProperty('discord_channel_id')) {
        updateQueryString = addProperty(updateQueryString, 'discord_channel_id', req.body.discord_channel_id);
    }
    if (req.body.hasOwnProperty('phone_topic')) {
        updateQueryString = addProperty(updateQueryString, 'phone_topic', req.body.phone_topic);
    }
    if (req.body.hasOwnProperty('last_testRunId'))
        updateQueryString = addProperty(updateQueryString, 'last_testRunId', req.body.last_testRunId);
    if (req.body.hasOwnProperty('cookies_status') && !req.body.hasOwnProperty('email'))
        updateQueryString = addProperty(updateQueryString, 'cookies_status', req.body.cookies_status);
    if (req.body.hasOwnProperty('discord_status'))
        updateQueryString = addProperty(updateQueryString, 'discord_status', req.body.discord_status);
    if (req.body.hasOwnProperty('phone_status'))
        updateQueryString = addProperty(updateQueryString, 'phone_status', req.body.phone_status);
    if (req.body.hasOwnProperty('email_status'))
        updateQueryString = addProperty(updateQueryString, 'email_status', req.body.email_status);
    if (req.body.hasOwnProperty('cookies')) {
        const cookiesHash = encryptString(req.body.cookies);
        updateQueryString = addProperty(updateQueryString, 'cookies', cookiesHash);
    }
    return updateQueryString;
}
/**
 * @swagger
 * /user/id/{id}:
 *   get:
 *     tags:
 *       - User
 *     summary: Get information for a specific user by ID.
 *     description: Get information for a specific user by ID (requires authentication).
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the user to retrieve.
 *         schema:
 *           type: string
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
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               msg: "Internal server error"
 */
routeUserId.get("/:id", verifyToken, async (req: any, res: express.Response) => {
    if (!verifyAuth(req, res, true)) {
        !res.headersSent ? res.status(403).json({ msg: "Authorization denied" }) : 0;
        return;
    }

    dbManager.getUserByEmailOrId(req.token, req.params.id)
        .then((result) => {
            if (!result || !result[0]) {
                res.sendStatus(404);
            } else {
                decryptAllCookies(result);
                res.send(result[0]);
            }
        }
        ).catch((err) => {
            res.status(500).json({ msg: "Internal server error", err: err });
        });
});

/**
 * @swagger
 * /user/id/{id}:
 *   put:
 *     tags:
 *       - User
 *     summary: Update a user by ID.
 *     description: Update a user by ID (requires authentication).
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the user to update.
 *         schema:
 *           type: string
 *       - in: body
 *         name: body
 *         required: true
 *         description: The updated user information.
 *         schema:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *             password:
 *               type: string
 *             discord_user_id:
 *               type: string
 *             discord_channel_id:
 *               type: string
 *             phone_topic:
 *               type: string
 *             last_testRunId:
 *               type: string
 *             cookies_status:
 *               type: string
 *             discord_status:
 *               type: string
 *             phone_status:
 *               type: string
 *             email_status:
 *               type: string
 *             cookies:
 *               type: string
 *     responses:
 *       200:
 *         description: Successful update of the user
 *         content:
 *           application/json:
 *             example:
 *               // Provide an example response if available
 *       400:
 *         description: Bad request, invalid parameter
 *         content:
 *           application/json:
 *             example:
 *               msg: "Bad parameter"
 *       403:
 *         description: Authorization denied
 *         content:
 *           application/json:
 *             example:
 *               msg: "Authorization denied"
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               msg: "Internal server error"
 */
routeUserId.put("/:id", verifyToken, async (req: any, res: express.Response) => {
    if (!is_num(req.params.id)) {
        res.status(400).json({ msg: "Bad parameter" });
        return;
    }
    if (!verifyAuth(req, res, true)) {
        !res.headersSent ? res.status(403).json({ msg: "Authorization denied" }) : 0;
        return;
    }

    const updateQueryString = getUpdateQueryString(req);
    if (updateQueryString.length === 0) {
        res.status(400).json({ msg: "Bad parameter" });
        return;
    }

    dbManager.getUserByEmailOrId(req.token, req.params.id)
        .then((result) => {
            if (!result || !result[0]) {
                res.sendStatus(404);
            } else {
                dbManager.updateUser(req.params.id, updateQueryString)
                    .then((result1) => {
                        if (result1.affectedRows > 0) {
                            dbManager.getUserByEmailOrId(req.token, req.params.id)
                                .then((result2) => {
                                    if (!result2 || !result2[0]) {
                                        res.sendStatus(404);
                                    } else {
                                        decryptAllCookies(result2);
                                        res.status(200).send(result2[0]);
                                    }
                                }
                                ).catch((err2) => {
                                    res.status(500).json({ msg: "Internal server error", err: err2 });
                                });
                        } else
                            res.sendStatus(404)
                    }
                    ).catch((err1) => {
                        res.status(500).json({ msg: "Internal server error", err: err1 });
                    });
            }
        }
        ).catch((err) => {
            res.status(500).json({ msg: "Internal server error", err: err });
        });
});

/**
 * @swagger
 * /user/id/{id}:
 *   delete:
 *     tags:
 *       - User
 *     summary: Delete a user by ID.
 *     description: Delete a user by ID (requires authentication).
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the user to delete.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful deletion of the user
 *         content:
 *           application/json:
 *             example:
 *               msg: "Successfully deleted record number: {id}"
 *       400:
 *         description: Bad request, invalid parameter
 *         content:
 *           application/json:
 *             example:
 *               msg: "Bad parameter"
 *       403:
 *         description: Authorization denied
 *         content:
 *           application/json:
 *             example:
 *               msg: "Authorization denied"
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               msg: "Internal server error"
 */
routeUserId.delete("/:id", verifyToken, async (req: express.Request, res: express.Response) => {
    if (!is_num(req.params.id)) {
        res.status(400).json({ msg: "Bad parameter" });
        return;
    }
    if (!verifyAuth(req, res, true)) {
        !res.headersSent ? res.status(403).json({ msg: "Authorization denied" }) : 0;
        return;
    }
    dbManager.getUserById(req.params.id)
        .then((result) => {
            dbManager.deleteUser(req.params.id)
                .then((result1) => {
                    if (!result[0] && result1.affectedRows === 1) {
                        res.status(200).json({ msg: `Successfully deleted record number: ${req.params.id}` });
                    } else
                        res.sendStatus(404);
                }
                ).catch((err1) => {
                    res.status(500).json({ msg: "Internal server error", err: err1 });
                });
        }
        ).catch((err) => {
            res.status(500).json({ msg: "Internal server error", err: err });
        });
});

export default routeUserId;
