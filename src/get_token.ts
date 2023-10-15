import puppeteer from 'puppeteer';
import { restoreCookies } from './cookies';

async function getBrowser() {
    return await puppeteer.launch({
        executablePath: process.env.BROWSER_BINARY_PATH || undefined,
        product: process.env.BROWSER_TYPE as "chrome" | "firefox",
        args: process.env.BROWSER_ARGS?.split(" ") ?? [],
        headless: true,
    });
}

async function clickLoginButton(page: puppeteer.Page, loginBtnSelector: string) {
    await page.click(loginBtnSelector);
    await new Promise((resolve) => setTimeout(resolve, 200));
    await page.waitForNetworkIdle();
}

export async function refreshMyEpitechToken(cookiesJSON: string) {
    const loginBtnSelector = '[href^="https://login.microsoftonline.com/common/oauth2/authorize"]';
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
        await restoreCookies(page, cookiesJSON);
        await page.goto('https://my.epitech.eu');
        const loginButton = await page.$(loginBtnSelector);

        if (loginButton) {
            await clickLoginButton(page, loginBtnSelector);
            const url = page.mainFrame().url();
            if (url.startsWith("https://login.microsoftonline.com/")) {
                return ("token_error");
            }
        }
    } catch (ex) {
        await page.goto('https://my.epitech.eu');
        const loginButton = await page.$(loginBtnSelector);
        if (loginButton) {
            await browser.close();
            throw ex;
        }
    }
    const token = await page.evaluate(() => localStorage.getItem("argos-api.oidc-token"));
    await browser.close();
    if (typeof token !== "string")
        throw new Error("token not found");
    return token.substring(1, token.length - 1);
}
