const crypto = require('crypto');
const sqlite = require('sqlite3').verbose();

const { PATHS } = require('../../common/constants');

const db = new sqlite.Database(PATHS.DB_STORAGE_PATH);
const MASTER_PASSWORD = 'fb0cb9bcd4a1b61a56196d7148696bd689200800478fcfb8c9963aaa7daeb365'; // Watch-dog1

const SQL = {
    AUTHORIZE: 'INSERT INTO authorized_devices (device_id) VALUES (?)',
    GET_AUTHORIZED: 'SELECT id FROM authorized_devices WHERE device_id = ?'
}

function isPasswordValid(password) {
    return new Promise((resolve, reject) => {
        const passwordHash = crypto.createHmac('sha256', 'RJ').update(password).digest('hex');
        if (passwordHash !== MASTER_PASSWORD) {
            return reject({ code: 403, message: 'Invalid password' });
        }
        resolve();
    });
}

function isDeviceAuthorized(deviceId) {
    return new Promise((resolve, reject) => {
        db.get(SQL.GET_AUTHORIZED, [deviceId], (err, row) => {
            if (err) {
                console.error('Failed to check authorized device | ID:', deviceId, '| Error:', err.message);
                return reject({ code: 500, message: 'Failed to execute the request' });
            }
            if (!row) {
                return reject({ code: 403, message: 'Not authorized' });
            }
            resolve();
        });
    });
}


function authorizeDevice(deviceId) {
    return new Promise((resolve, reject) => {
        db.run(SQL.AUTHORIZE, [deviceId], (err) => {
            if (err) {
                console.error('Failed to authorize device | ID:', deviceId, '| Error:', err.message);
                return reject({ code: 500, message: 'Failed to authorize the device'});
            }
            resolve();
        });
    });
}

module.exports = {
    authorizeDevice,
    isDeviceAuthorized,
    isPasswordValid
};
