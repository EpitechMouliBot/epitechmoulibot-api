import mysql from "mysql2";

require('dotenv').config();

class DatabaseManager {
    private con: mysql.Connection;

    constructor() {
        this.con = mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
        });

        this.con.connect((err) => {
            if (err) {
                console.error('Error connecting to the database:', err);
                throw err;
            }
            console.log('Successfully connected to the database');
        });
    }

    public closeConnection(): void {
        this.con.end();
        console.log('Disconnecting from the MySQL database');
    }

    // FUNCTIONS

    public getAllUsers(): Promise<any[]> {
        const queryString = 'id, email, discord_user_id, discord_channel_id, phone_topic, last_testRunId, cookies_status, discord_status, phone_status, email_status, created_at';
        const query = `SELECT ${queryString} FROM user;`;

        return new Promise((resolve, reject) => {
            this.con.query(query, (err, rows: any[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    public getUserByEmail(email: string): Promise<any[]> {
        const queryString = '*';
        const query = `SELECT ${queryString} FROM user WHERE email = ${email};`;

        return new Promise((resolve, reject) => {
            this.con.query(query, (err, rows: any[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    public getUserById(email: string): Promise<any[]> {
        const queryString = '*';
        const query = `SELECT ${queryString} FROM user WHERE email = ${email};`;

        return new Promise((resolve, reject) => {
            this.con.query(query, (err, rows: any[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    public getUserByEmailOrId(token: string, str: string): Promise<any[]> {
        const queryString = (token === process.env.OTHER_APP_TOKEN) ? '*' : 'id, email, discord_user_id, discord_channel_id, phone_topic, last_testRunId, cookies_status, discord_status, phone_status, email_status, created_at';
        const query = `SELECT ${queryString} FROM user WHERE id = "${str}" OR email = "${str}";`;

        return new Promise((resolve, reject) => {
            this.con.query(query, (err, rows: any[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    public getUserByStatus(status: string): Promise<any[]> {
        const queryString = 'id, email, discord_user_id, discord_channel_id, phone_topic, last_testRunId, cookies_status, discord_status, phone_status, email_status, created_at';
        const query = `SELECT ${queryString} FROM user WHERE cookies_status = "${status}";`;

        return new Promise((resolve, reject) => {
            this.con.query(query, [status], (err, rows: any[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    public insertUser(email: string, passwordHash: string, cookiesHash: string, phoneTopic: string): Promise<any> {
        const query = `INSERT INTO user(email, password, cookies, phone_topic) VALUES("${email}", "${passwordHash}", "${cookiesHash}", "${phoneTopic}")`;

        return new Promise((resolve, reject) => {
            this.con.query(query, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    public updateUser(id: string, updateQueryString: string): Promise<any> {
        const query = `UPDATE user SET ${updateQueryString} WHERE id = ${id};`;

        return new Promise((resolve, reject) => {
            this.con.query(query, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    public deleteUser(id: string): Promise<any> {
        const query = `DELETE FROM user WHERE id = ${id};`;

        return new Promise((resolve, reject) => {
            this.con.query(query, [id], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    public checkTokenValidity(decodedId: string): Promise<any[]> {
        const queryString = 'id';
        const query = `SELECT ${queryString} FROM user WHERE id = "${decodedId}";`;

        return new Promise((resolve, reject) => {
            this.con.query(query, function (err: any, rows: any[]) {
                if (err) {
                    reject(err);
                } else if (rows[0] && rows[0].id == decodedId)
                    resolve(rows);
                else
                    reject("Token is not valid");
            });
        })
    }

    public checkUserCredentials(email: string, password: string): Promise<any[]> {
        const queryString = '*';
        const query = `SELECT ${queryString} FROM user WHERE email = "${email}";`;

        return new Promise((resolve, reject) => {
            this.con.query(query, [email], (err, rows: any[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
}

export default DatabaseManager;
