const fs = require('fs');
const webpush = require('web-push');

const { PATHS } = require('../../common/constants');
const secrets = require(PATHS.SECRETS);

const HTTP_ERROR_UNSUBSCRIBED_OR_EXPIRED = 410;
const WEB_PUSH_OPTIONS = {
    TTL: 600 // Time To Live in seconds
};

webpush.setVapidDetails(
    'mailto:tjiricek11@gmail.com',
    secrets.webPushPublicKey,
    secrets.webPushPrivateKey
);

function findSubscriberByToken(token) {
    return new Promise((resolve, reject) => {
        fs.readFile(PATHS.WEB_PUSH_SUBSCRIPTIONS, {}, (err, data) => {
            if (err) {
                createWebPushSubscriptionsFile();
                reject({ code: 410, message: 'Not found' });
                return;
            }
            try {
                const subscribers = JSON.parse(data);
                if (subscribers[token]) {
                    resolve(subscribers[token]);
                    return;
                }
            } catch (_) {
                createWebPushSubscriptionsFile();
            }
            reject({ code: 410, message: 'Not found' });
        });
    });
}


function isSubscribed(userSubscriptions, subscription) {
    for (const item of userSubscriptions) {
        if (!(item instanceof Object)) {
            continue;
        }
        if (subscription.endpoint === item.endpoint) {
            return true;
        }
    }
    return false;
}

function unsubscribeUser(userToken, subscription) {
    return new Promise((resolve, reject) => {
        fs.readFile(PATHS.WEB_PUSH_SUBSCRIPTIONS, {}, (err, data) => {
            if (err) {
                createWebPushSubscriptionsFile();
                reject({ code: 410, message: 'Not found' });
                return;
            }

            try {
                const subscribers = JSON.parse(data);
                if (!subscribers[userToken]) {
                    reject({ code: 410, message: 'Not found' });
                    return;
                }

                const subscriber = subscribers[token];
                subscriber.subscriptions = subscriber.subscriptions.filter((value) => (
                    value.endpoint !== subscription.endpoint
                ));

                fs.writeFile(PATHS.WEB_PUSH_SUBSCRIPTIONS, JSON.stringify(subscribers), (err) => {
                    if (err) {
                        reject({ code: 500, message: 'Failed to delete invalid subscription'});
                        return;
                    }
                    resolve();
                });

            } catch (_) {
                createWebPushSubscriptionsFile();
                reject({ code: 410, message: 'Not found' });
            }
        });
    });
}

function notifyUser(token, notificationData) {
    const data = { ...WEB_PUSH_OPTIONS, ...notificationData };
    return findSubscriberByToken(token)
        .then((subscriber) => {
            subscriber.subscriptions.forEach((subscription) => {
                sendNotification(token, subscription, data)
                    .catch(() => {
                        // Failed
                    });
            });
        });
}

function saveSubscription(userToken, subscription) {
    return new Promise((resolve, reject) => {
        fs.readFile(PATHS.WEB_PUSH_SUBSCRIPTIONS, {}, (err, data) => {
            if (err) {
                createWebPushSubscriptionsFile();
                reject({ code: 500, message: 'Failed to load file with subscribers. Try again later.' });
                return;
            }

            let subscribers = {};

            try {
                subscribers = JSON.parse(data);
            } catch (_) {
                reject({ code: 500, message: 'Failed to parse file with subscribers' });
                return;
            }

            if (subscribers[userToken] === undefined) {
                subscribers[userToken] = { token: userToken, subscriptions: [] };
            }

            if (!isSubscribed(subscribers[userToken].subscriptions, subscription)) {
                subscribers[userToken].subscriptions.push(subscription);
                fs.writeFile(PATHS.WEB_PUSH_SUBSCRIPTIONS, JSON.stringify(subscribers), (err) => {
                    if (err) {
                        reject({ code: 500, message: 'Failed to subscribe the user.' });
                        return;
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    });
}

function sendNotification(userToken, subscription, data) {
    const { message, ...options } = data;
    return webpush.sendNotification(subscription, message, options)
        .catch((error) => {
            if (error.statusCode === HTTP_ERROR_UNSUBSCRIBED_OR_EXPIRED) {
                return unsubscribeUser(userToken, subscription);
            }
            return Promise.reject(error);
        });
}

function createWebPushSubscriptionsFile() {
    fs.writeFile(PATHS.WEB_PUSH_SUBSCRIPTIONS, JSON.stringify({}), () => {});
}

module.exports = {
    notifyUser,
    saveSubscription,
    unsubscribeUser
};
