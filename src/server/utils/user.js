const crypto = require('crypto');
const sqlite = require('sqlite3');

const { PATHS } = require('../../common/constants');

const db = new sqlite.Database(PATHS.DB_STORAGE_PATH);

const SQL = {
    GET_USER_DATA: 'SELECT token, device_id AS deviceId FROM users WHERE token = ?',
    REGISTER: 'INSERT INTO users (token, device_id) VALUES (?, ?)'
};

function findUserByToken(token) {
    return new Promise((resolve, reject) => {
        db.get(SQL.GET_USER_DATA, [token], (err, row) => {
            if (err) {
                console.error('Failed to get user data by token:', err);
                reject({ code: 500, message: 'Faield to find user in database' });
                return;
            }
            if (!row) {
                reject({ code: 403, message: 'User not found' });
                return;
            }
            resolve(row);
        });
    });
}

function getRandomDeviceId() {
    return crypto.randomBytes(35).toString('base64').replace(/[^a-z0-9]/gi, '');
}

function getUserByAuthData(authData) {
    return new Promise((resolve, reject) => {
        if (!isAuthDataValid(authData)) {
            reject({ code: 400, message: 'Invalid data structure' });
            return;
        }

        const { selectedImageIndex, size, pattern } = authData;
        const data = `C${pattern.join(':')}S${size}I${selectedImageIndex}`;
        const token = crypto.createHmac('sha256', 'RJ').update(data).digest('hex');

        findUserByToken(token)
            .then((data) => resolve(data))
            .catch((error) => reject(error));
    });
}

function isAuthDataValid({ selectedImageIndex = null, size = null, pattern = null}) {
    return (selectedImageIndex === null || size === null || pattern === null
        || isNaN(selectedImageIndex) || isNaN(size) || !(pattern instanceof Array)
        || pattern.length === 0);
}

function registerUser(authData) {
    return new Promise((resolve, reject) => {
        if (!isAuthDataValid(authData)) {
            reject({ code: 400, message: 'Invalid data structure' });
            return;
        }

        const { selectedImageIndex, size, pattern } = authData;
        const data = `C${pattern.join(':')}S${size}I${selectedImageIndex}`;
        const token = crypto.createHmac('sha256', 'RJ').update(data).digest('hex');
        const deviceId = getRandomDeviceId();

        findUserByToken(token)
            .then(() => reject({ code: 500, message: 'Failed to register the user.' }))
            .catch((err) => {
                if (err.code === 500) {
                    reject({ code: 500, message: 'Failed to register the user, please try again later.' });
                    return;
                }

                db.run(SQL.REGISTER, [token, deviceId], (err) => {
                    if (err) {
                        console.error('Failed to register user:', err);
                        reject({ code: 500, message: 'Failed to register the user, please try again later.' });
                        return;
                    }
                    resolve({ token, deviceId });
                });
            });
    });
}

module.exports = {
    findUserByToken,
    getUserByAuthData,
    registerUser
};
