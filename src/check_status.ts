import dbManager from '.';
import { refreshMyEpitechToken } from './get_token';
// import { asyncSleep } from './utils';

async function getUserListByStatus(status: string) {
    try {
        const userList = await dbManager.getUserByStatus(status);
        return { success: true, data: userList };
    } catch (error) {
        return { success: false, error: error };
    }
}

export async function checkStatusUsers(status: string) {
    const rspList = await getUserListByStatus(status);

    if (rspList.success != false && rspList.data !== undefined) {
        const userList = rspList.data;
        for (let i = 0, len = userList.length; i < len; ++i) {
            const content = await refreshMyEpitechToken(userList[i]['cookies']);
            if (content === "token_error") {
                dbManager.updateUser(userList[i]['id'], "cookies_status = 'expired'");
            } else {
                dbManager.updateUser(userList[i]['id'], "cookies_status = 'ok'");
            }
        }
    }
}

export async function handleAllUserStatus() {
    console.log("?????");
    await checkStatusUsers("wait");
    await checkStatusUsers("new");
}
