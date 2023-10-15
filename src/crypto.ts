import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const algorithm = 'aes-256-cbc';

export function encryptString(text: any) {
    const iv = crypto.randomBytes(16);
    if (process.env.SECRET) {
        let cipher = crypto.createCipheriv(algorithm, Buffer.from(process.env.SECRET, 'utf8'), iv);
        return JSON.stringify({ i: iv.toString('hex'), e: Buffer.concat([cipher.update(text), cipher.final()]).toString('hex') });
    } else {
        throw new Error("SECRET environment variable is not defined.");
    }
}

export function decryptString(text: any) {
    text = JSON.parse(text);
    if (process.env.SECRET) {
        let decipher = crypto.createDecipheriv(algorithm, Buffer.from(process.env.SECRET, 'utf8'), Buffer.from(text.i, 'hex'));
        return Buffer.concat([decipher.update(Buffer.from(text.e, 'hex')), decipher.final()]).toString();
    } else {
        throw new Error("SECRET environment variable is not defined.");
    }
}

export function decryptAllCookies(rows: any[]) {
    rows.forEach((element) => {
        if (element.cookies)
            element.cookies = decryptString(element.cookies);
    });
}
