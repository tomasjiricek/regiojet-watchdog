const path = require('path');

const DATA_PATH = path.resolve(__dirname, '../../data');

const PATHS = {
    DB_STORAGE_PATH: path.join(DATA_PATH, 'db-storage.sqlite'),
    SECRETS: path.join(DATA_PATH, 'secrets.json'),
    USERS: path.join(DATA_PATH, 'users.json'),
    WATCHERS: path.join(DATA_PATH, 'watchers.json'),
    WEB_PUSH_SUBSCRIPTIONS: path.join(DATA_PATH, 'web-push-subscriptions.json')
};

module.exports = {
    PATHS,
    HTTP_STATUS_NO_FREE_SEATS: 400,
    MESSAGE_NO_FREE_SEATS: 'Sedadla již nejsou k dispozici'
};