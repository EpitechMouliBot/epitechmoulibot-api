import express from "express";
import { refreshMyEpitechToken } from '../get_token';
import { executeEpitestRequest, executeBDDApiRequest } from '../api';

const relayRouter = express.Router();

relayRouter.get('/:userEmail/epitest/*', async (req, res) => {
    const userList = await executeBDDApiRequest("/user/status/", "ok", 'GET', {}); // a voir si on fait pas un checl recurent tout les X temps dans le main comme actuellement ou juste faire ça chaque fois
    const userInfo = userList.data.find((user: any) => user['email'] === req.params['userEmail']);

    try {
        let content = await executeEpitestRequest(req, req.params['userEmail']);
        if (content.status === 401) {
            if (userInfo) {
                const token = await refreshMyEpitechToken(userInfo['cookies']);
                if (token == "token_error") {
                    await executeBDDApiRequest("/user/id/", JSON.stringify(userInfo['id']), 'PUT', { 'cookies_status': 'expired' })
                    res.status(410).send({ message: "Cookies are expired" });
                    // removeRouteFromEmail(req.params['userEmail']);
                    return;
                } else {
                    content = await executeEpitestRequest(req, token);
                }
            } else {
                res.status(404).send({ message: "User not found" });
                return;
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