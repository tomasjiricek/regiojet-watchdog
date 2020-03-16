const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const MASTER_PASSWORD = 'fb0cb9bcd4a1b61a56196d7148696bd689200800478fcfb8c9963aaa7daeb365'; // Watch-dog1

const DATA_PATH = path.join(__dirname, '../../../data');
const AUTHORIZED_DEVICES_PATH = path.join(DATA_PATH, 'authorized-devices.json');

function isPasswordValid(password) {
    return new Promise((resolve, reject) => {
        const passwordHash = crypto.createHmac('sha256', 'RJ').update(password).digest('hex');
        passwordHash === MASTER_PASSWORD ? resolve('Success') : reject('Invalid password');
    });
}

function isDeviceAuthorized(deviceId) {
    return new Promise((resolve, reject) => {
        fs.readFile(AUTHORIZED_DEVICES_PATH, {}, (err, data) => {
            if (err) {
                reject({ code: 500, message: 'Failed to load file with authorized devices' });
                return;
            }
            try {
                const authorizedDevices = JSON.parse(data);
                if (authorizedDevices[deviceId]) {
                    resolve();
                    return;
                }
            } catch (_) {}
            reject({ code: 403, message: 'Not authorized' });
        });
    });
}


function authorizeDevice(deviceId) {
    fs.readFile(AUTHORIZED_DEVICES_PATH, {}, (err, data) => {
        if (err) {
            return;
        }
        let authorizedDevices = {};
        try {
            authorizedDevices = JSON.parse(data);
        } catch (_) {}
        authorizedDevices[deviceId] = { timestamp: new Date().getTime() };
        fs.writeFile(AUTHORIZED_DEVICES_PATH, JSON.stringify(authorizedDevices), () => {});
    });
}

module.exports = {
    authorizeDevice,
    isDeviceAuthorized,
    isPasswordValid
};
