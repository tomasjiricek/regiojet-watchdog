const sqlite = require('sqlite3');
const webpush = require('web-push');

const { PATHS } = require('../../common/constants');
const secrets = require(PATHS.SECRETS);

const db = new sqlite.Database(PATHS.DB_STORAGE_PATH);

const SQL = {
    GET_SUBSCRIBED:
        `
        SELECT COUNT(a.id) as subscriptions_count
        FROM push_subscriptions a
        INNER JOIN users b ON a.user_id = b.id
        WHERE b.token = ? AND a.endpoint = ?
        `,
    GET_SUBSCRIPTIONS:
        `
        SELECT a.endpoint, a.p256dh, a.auth, b.token AS userToken
        FROM push_subscriptions a
        INNER JOIN users b ON a.user_id = b.id
        WHERE userToken = ?
        `,
    SUBSCRIBE:
        `
        INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
            SELECT id, ?, ?, ?
            FROM users
            WHERE token = ?
        `,
    UNSUBSCRIBE:
        `
        DELETE FROM push_subscriptions
        WHERE user_id IN (
            SELECT id FROM users WHERE token = ?
        ) AND endpoint = ?
        `
};

const HTTP_ERROR_UNSUBSCRIBED_OR_EXPIRED = 410;
const WEB_PUSH_OPTIONS = {
    TTL: 600 // Time To Live in seconds
};

webpush.setVapidDetails(
    'mailto:tjiricek11@gmail.com',
    secrets.webPushPublicKey,
    secrets.webPushPrivateKey
);

function findSubscriptionsByToken(token) {
    return new Promise((resolve, reject) => {
        const subscriptions = [];
        db.each(
            SQL.GET_SUBSCRIPTIONS,
            [token],
            (err, row) => {
                if (!err) {
                    subscriptions.push(row);
                }
            },
            (err) => {
                if (err) {
                    console.error('Failed to fetch subscriptions from database:', err);
                    reject({ code: 500, message: 'Failed to get subscriptions.' });
                    return;
                }
                resolve(subscriptions);
            }
        );
    });
}


function isSubscribed(userToken, subscription) {
    return new Promise((resolve, reject) => {
        if (!isSubscriptionDataValid(subscription)) {
            reject({ code: 400, message: 'Invalid data structure' });
            return;
        }

        const { endpoint } = subscription;
        db.get(SQL.GET_SUBSCRIBED, [userToken, endpoint], (err, row) => {
            if (err) {
                console.error('Failed to check subscription:', err);
                reject({ code: 500, message: 'Failed to check subscription existence.' });
                return;
            }

            resolve(row.subscriptions_count > 0);
        });
    });
}

function isSubscriptionDataValid(subscription) {
    return (
        subscription instanceof Object && subscription.endpoint && subscription.keys instanceof Object &&
        subscription.keys.auth && subscription.keys.p256dh
    );
}

function unsubscribeUser(userToken, subscription) {
    return new Promise((resolve, reject) => {
        if (!isSubscriptionDataValid(subscription)) {
            reject({ code: 400, message: 'Invalid data structure' });
            return;
        }

        const { endpoint } = subscription;
        db.run(SQL.UNSUBSCRIBE, [userToken, endpoint], (err) => {
            if (err) {
                console.error('Failed to unsibscribe user:', err);
                reject({ code: 500, message: 'Failed to unsubscribe' });
                return;
            }
            resolve();
        });
    });
}

function notifyUser(token, notificationData) {
    const data = { ...WEB_PUSH_OPTIONS, ...notificationData };
    return findSubscriptionsByToken(token)
        .then((subscriptions) => {
            subscriptions.forEach((subscription) => {
                sendNotification(subscription, data).catch((err) => {
                    console.warn('Failed to notify user:', err);
                });
            });
        });
}

function saveSubscription(userToken, subscription) {
    return new Promise((resolve, reject) => {
        isSubscribed(userToken, subscription)
            .then((subscriptionExists) => {
                if (subscriptionExists) {
                    resolve();
                    return;
                }

                const { endpoint, keys: { auth, p256dh } } = subscription;
                db.run(SQL.SUBSCRIBE, [endpoint, p256dh, auth, userToken], (err) => {
                    if (err) {
                        console.error('Failed to save subscription:', err);
                        reject({ code: 500, message: 'Failed to subscribe' });
                        return;
                    }
                    resolve();
                });
            })
            .catch((err) => reject(err));
    });
}

function sendNotification({ userToken, ...subscription }, { message, id, ...options }) {
    return webpush.sendNotification(subscription, JSON.stringify({ message, id }), options)
        .catch((error) => {
            if (error.statusCode === HTTP_ERROR_UNSUBSCRIBED_OR_EXPIRED) {
                return unsubscribeUser(userToken, subscription);
            }
            return Promise.reject(error);
        });
}

module.exports = {
    notifyUser,
    saveSubscription,
    unsubscribeUser
};
