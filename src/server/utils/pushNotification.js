const fs = require('fs');
const path = require('path');
const webpush = require('web-push');

const DATA_PATH = path.join(__dirname, '../../../data');
const WEB_PUSH_SUBSCRIPTIONS_PATH = path.join(DATA_PATH, 'web-push-subscriptions.json');
const secrets = require(path.join(DATA_PATH, 'secrets.json'));

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
        fs.readFile(WEB_PUSH_SUBSCRIPTIONS_PATH, {}, (err, data) => {
            if (err) {
                createWebPushSubscriptionsFile();
                reject({ code: 404, message: 'Not found' });
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
            reject({ code: 404, message: 'Not found' });
        });
    });
}

function unsubscribeUser(userToken, subscription) {
    return new Promise((resolve, reject) => {
        fs.readFile(WEB_PUSH_SUBSCRIPTIONS_PATH, {}, (err, data) => {
            if (err) {
                createWebPushSubscriptionsFile();
                reject({ code: 404, message: 'Not found' });
                return;
            }

            try {
                const subscribers = JSON.parse(data);
                if (!subscribers[userToken]) {
                    reject({ code: 404, message: 'Not found' });
                    return;
                }

                const subscriber = subscribers[token];
                subscriber.subscriptions = subscriber.subscriptions.filter((value) => (
                    value.endpoint !== subscription.endpoint
                ));

                fs.writeFile(WEB_PUSH_SUBSCRIPTIONS_PATH, JSON.stringify(subscribers), (err) => {
                    if (err) {
                        reject({ code: 500, message: 'Failed to delete invalid subscription'});
                        return;
                    }
                    resolve();
                });

            } catch (_) {
                createWebPushSubscriptionsFile();
                reject({ code: 404, message: 'Not found' });
            }
        });
    });
}

function notifyUser(token, notificationData) {
    const data = { ...WEB_PUSH_OPTIONS, ...notificationData };
    return findSubscriberByToken(token)
        .then((subscriber) => {
            subscriber.subscriptions.forEach((subscription) => {
                sendNotification(token, subscription, data);
            })
        });
}

function sendNotification(userToken, subscription, data) {
    const { message, ...options } = data;
    webpush.sendNotification(subscription, message, options)
        .catch((error) => {
            if (error.statusCode === HTTP_ERROR_UNSUBSCRIBED_OR_EXPIRED) {
                unsubscribeUser(userToken, subscription);
            }
        });
}

function createWebPushSubscriptionsFile() {
    fs.writeFile(WEB_PUSH_SUBSCRIPTIONS_PATH, JSON.stringify({}), () => {});
}

module.exports = {
    notifyUser,
    unsubscribeUser,
};
