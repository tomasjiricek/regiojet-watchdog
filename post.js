const { notifyUser } = require('./src/server/utils/pushNotification');

var notificationData = {
    message: 'Test message triggered manually by Node.JS script',
    TTL: 3600,
};

const token = process.argv.slice(2).join(' ');
if (!token) {
    return console.error('No token passed');
}

notifyUser(token, notificationData);
