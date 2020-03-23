const fs = require('fs');

const { findUserByToken } = require('./src/server/utils/user');
const { PATHS } = require('./src/common/constants');

const token = process.argv.slice(2).join(' ');
if (!token) {
    return console.error('No token passed');
}

function deleteAuthorizedDevice(deviceId) {
    fs.readFile(PATHS.AUTHORIZED_DEVICES, (err, data) => {
        if (err) {
            return console.error('Failed to load authorized devices');
        }

        let json = null;
        try {
            json = JSON.parse(data);
        } catch (_) {
            return console.error('Failed to parse authorized devices');
        }

        const { [deviceId]: deletedData, ...newJson } = json;
        console.info('Deleting authorized device:', JSON.stringify({ [deviceId]: deletedData }));

        fs.writeFile(PATHS.AUTHORIZED_DEVICES, JSON.stringify(newJson), (err) => {
            if (err) {
                console.error('Failed to rewrite file with authorized devices.', err);
            }
        });
    });
}

function deletePushSubscriptions(token) {
    fs.readFile(PATHS.WEB_PUSH_SUBSCRIPTIONS, (err, data) => {
        if (err) {
            return console.error('Failed to load web push subscriptions');
        }

        let json = null;
        try {
            json = JSON.parse(data);
        } catch (_) {
            return console.error('Failed to parse web push subscriptions');
        }

        const { [token]: deletedData, ...newJson } = json;
        console.info('Deleting web push subscriptions for:', token);

        fs.writeFile(PATHS.WEB_PUSH_SUBSCRIPTIONS, JSON.stringify(newJson), (err) => {
            if (err) {
                console.error('Failed to rewrite file with web push subscriptions.', err);
            }
        });
    });
}

function deleteUserData(token) {
    fs.readFile(PATHS.USERS, (err, data) => {
        if (err) {
            return console.error('Failed to load users');
        }

        let json = null;
        try {
            json = JSON.parse(data);
        } catch (_) {
            return console.error('Failed to parse users');
        }

        const { [token]: deletedData, ...newJson } = json;
        console.info('Deleting user:', token);

        fs.writeFile(PATHS.USERS, JSON.stringify(newJson), (err) => {
            if (err) {
                console.error('Failed to rewrite file with users.', err);
            }
        });
    });
}

function deleteWatchedRoutes(token) {
    fs.readFile(PATHS.WATCHERS, (err, data) => {
        if (err) {
            return console.error('Failed to load watchers');
        }

        let json = null;
        try {
            json = JSON.parse(data);
        } catch (_) {
            return console.error('Failed to parse watchers');
        }

        const { [token]: deletedData, ...newJson } = json;
        console.info('Deleting watched routes for:', token);

        fs.writeFile(PATHS.WATCHERS, JSON.stringify(newJson), (err) => {
            if (err) {
                console.error('Failed to rewrite file with watchers.', err);
            }
        });
    });
}

findUserByToken(token)
    .then((data) => {
        const { deviceId } = data;
        deleteAuthorizedDevice(deviceId);
        deletePushSubscriptions(token);
        deleteUserData(token);
        deleteWatchedRoutes(token);
    })
    .catch((err) => {
        console.log('Error', JSON.stringify(err));
    });
