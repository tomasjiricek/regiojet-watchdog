const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const USERS_PATH = path.join(__dirname, '../../data/users.json');

function getRandomDeviceId() {
    return crypto.randomBytes(35).toString('base64').replace(/[^a-z0-9]/gi, '');
}

function getUserByAuthData(authData) {
    return new Promise((resolve, reject) => {
        if (!isAuthDataValid(authData)) {
            reject({ code: 500, message: 'Invalid data' });
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

function findUserByToken(token) {
    return new Promise((resolve, reject) => {
        fs.readFile(USERS_PATH, {}, (err, data) => {
            if (err) {
                createUsersFile();
                reject({ code: 403, message: 'User not found' });
                return;
            }
            try {
                const users = JSON.parse(data);
                if (users[token]) {
                    resolve(users[token]);
                    return;
                }
            } catch (_) {
                createUsersFile();
            }
            reject({ code: 403, message: 'User not found' });
        });
    });
}

function registerUser(authData) {
    return new Promise((resolve, reject) => {
        if (!isAuthDataValid(authData)) {
            reject({ code: 500, message: 'Invalid data' });
            return;
        }

        const { selectedImageIndex, size, pattern } = authData;
        const data = `C${pattern.join(':')}S${size}I${selectedImageIndex}`;
        const token = crypto.createHmac('sha256', 'RJ').update(data).digest('hex');

        fs.readFile(USERS_PATH, {}, (err, data) => {
            if (err) {
                return;
            }

            let users = {};

            try {
                users = JSON.parse(data);
            } catch (_) {}

            if (users[token] !== undefined) {
                reject({ code: 500, message: 'Failed to register the user.'});
                return;
            }

            users[token] = {
                deviceId: getRandomDeviceId(),
                registered: new Date().getTime(),
                token
            };

            fs.writeFile(USERS_PATH, JSON.stringify(users), (err) => {
                if (err) {
                    reject({ code: 500, message: 'Failed to register the user. Try again later.' });
                    return;
                }
                resolve(users[token]);
            });
        });
    });
}

function createUsersFile() {
    fs.writeFile(USERS_PATH, JSON.stringify({}), () => {});
}

module.exports = {
    findUserByToken,
    getUserByAuthData,
    registerUser
};
