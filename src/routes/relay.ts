import express from "express";
import { refreshMyEpitechToken } from '../get_token';
import { executeEpitestRequest } from '../api';
import dbManager from "..";

const relayRouter = express.Router();

relayRouter.get('/', (req, res) => {
    res.send('relay endpoint');
});

async function getUserListByStatus(status: string) {
    try {
        const userList = await dbManager.getUserByStatus(status);
        return { success: true, data: userList };
    } catch (error) {
        return { success: false, error: error };
    }
}

relayRouter.get('/:userEmail/epitest/*', async (req, res) => {
    try {
        const userList = await getUserListByStatus('new');
        if (userList.success === false) {
            res.status(404).send({ message: "User not found" });
            return;
        }
        const userInfo = Array.isArray(userList.data) ? userList.data.find((user: any) => user['email'] === req.params['userEmail']) : undefined;
        if (!userInfo) {
            res.status(404).send({ message: "User not found" });
            return;
        }
        let content = await executeEpitestRequest(req, req.params['userEmail']);
        if (content.status === 401) {
            const token = await refreshMyEpitechToken(userInfo['cookies']);
            if (token == "token_error") {
                dbManager.updateUser(userInfo['id'], "cookies_status = 'expired'");

                res.status(410).send({ message: "Cookies are expired" });
                // removeRouteFromEmail(req.params['userEmail']);
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


// relayRouter.delete('/account/delete/:email', async (req, res) => {
//     // Ajoutez ici la logique de votre accountRoute
// });

export default relayRouter;

// async function accountRoute() {
//     app.delete("/account/delete/:email", async (req, res) => {
//         try {
//             const email = req.params.email;
//             if (email !== undefined) {
//                 if (removeRouteFromEmail(email) === 0)
//                     res.status(200).send({ message: "Route deleted" });
//                 else
//                     res.status(400).send({ message: "email not found" });
//             } else
//                 res.status(400).send({ message: "Bad argument" });
//         } catch (error) {
//             res.status(500).send("Relay error");
//         }
//     });
// }