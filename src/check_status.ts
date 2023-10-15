import { refreshMyEpitechToken } from './get_token';
import { executeBDDApiRequest } from './api';
import { asyncSleep } from './utils';

export async function checkStatusUsers(status: string) {
    const rspList = await executeBDDApiRequest("/user/status/", status, 'GET', {});
    if (rspList !== undefined && rspList.data !== undefined) {
        const userList = rspList.data;
        for (let i = 0, len = userList.length; i < len; ++i) {
            const content = await refreshMyEpitechToken(userList[i]['cookies']);
            if (content === "token_error") {
                await executeBDDApiRequest("/user/id/", JSON.stringify(userList[i]['id']), 'PUT', { 'cookies_status': 'expired' });
            } else {
                await executeBDDApiRequest("/user/id/", JSON.stringify(userList[i]['id']), 'PUT', { 'cookies_status': 'ok' });
            }
        }
    }
}

export async function infinitLoopForUserStatus() {
    while (true) {
        await checkStatusUsers("wait");
        await checkStatusUsers("new");
        await asyncSleep((1000 * 60) * 5);
    }
}
