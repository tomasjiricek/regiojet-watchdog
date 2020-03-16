var webpush = require('web-push');
const secrets = require('./data/secrets.json');
const subscriptions = require('./data/web-push-subscriptions.json');

var payload = 'Test message triggered manually by Node.JS script';

var options = {
  TTL: 60
};

const token = process.argv.slice(2).join(' ');
if (!token) {
    return console.error('No token passed');
}

if (!subscriptions[token]) {
    return console.error('User subscription not found');
}

webpush.setVapidDetails(
  'mailto:tjiricek11@gmail.com',
  secrets.webPushPublicKey,
  secrets.webPushPrivateKey
);

subscriptions[token].subscriptions.forEach((subscription) => {
    webpush.sendNotification(subscription, payload, options)
        .then((d) => { console.log(d); })
        .catch((e) => { console.error(e); });
});
