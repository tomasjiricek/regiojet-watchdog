const sqlite = require('sqlite3');
const { PATHS } = require('../../src/common/constants');
const authorizedDevices = require('../../data/authorized-devices.json');
const users = require('../../data/users.json');
const watchedRoutes = require('../../data/watchers.json');
const pushNotifications = require('../../data/web-push-subscriptions.json');

const db = new sqlite.Database(PATHS.DB_STORAGE_PATH);

const ROUTE_COLUMNS_MAP = { // Keep the order as is, it's important for transformation when watching new route
    route_id: 'id',
    arrival_time: 'arrivalTime',
    departure_time: 'departureTime',
    free_seats_count: 'freeSeatsCount',
    transfers_count: 'transfersCount',
    travel_time: 'travelTime',
    vehicle_types: 'JSON:vehicleTypes',
};

function transformRouteDataToSqlValuesArray(data) {
    const values = [];
    Object.values(ROUTE_COLUMNS_MAP).forEach((columnNameRaw) => {
        const isJson = columnNameRaw.indexOf('JSON:') === 0;
        const columnName = isJson ? columnNameRaw.substr(5) : columnNameRaw;
        if (data.hasOwnProperty(columnName)) {
            values.push(isJson ? JSON.stringify(data[columnName]) : data[columnName]);
        }
    });

    return values;
}

Object.keys(authorizedDevices).forEach((deviceId) => {
    db.run(
        'INSERT INTO authorized_devices (device_id) VALUES (?)',
        [deviceId],
        (err) => {
            if (err) {
                console.error('AutborizedDevicesPushError', err);
            }
        }
    );
});

Object.values(users).forEach(({ token, deviceId }, index) => {
    const userId = index + 1;
    db.run(
        'INSERT INTO users (id, token, device_id) VALUES (?, ?, ?)',
        [userId, token, deviceId],
        (err) => {
            if (err) {
                console.error('UsersPushError', err);
                return;
            }

            insertPushNotifications(userId, token);
            insertWatchedRoutes(userId, token);
        }
    );
});

function insertPushNotifications(userId, token) {
    const subscriptions = pushNotifications[token].subscriptions;
    if (!subscriptions) {
        console.log('No pushNotifications for', userId, '|', token);
        return;
    }

    subscriptions.forEach((subscription) => {
        const subscriptionData = [
            subscription.endpoint,
            subscription.keys.p256dh,
            subscription.keys.auth
        ];
        db.run(
            'INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)',
            [userId, ...subscriptionData],
            (err) => {
                if (err) {
                    console.error('PushSubscriptionsPushError', err);
                }
            }
        );
    });
}

function insertWatchedRoutes(userId, token) {
    const routes = watchedRoutes[token].routes;
    if (!routes) {
        console.log('No routes for', userId, '|', token);
        return;
    }

    routes.forEach((route) => {
        const routeData = transformRouteDataToSqlValuesArray(route);
        const specialRouteData = [
            route.arrivalStation.id,
            route.arrivalStation.fullname,
            route.departureStation.id,
            route.departureStation.fullname
        ];
        db.run(
            `
            INSERT INTO watched_routes (user_id, route_id, arrival_time, departure_time, free_seats_count,
                transfers_count, travel_time, vehicle_types, arrival_station_id, arrival_station_name,
                departure_station_id, departure_station_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [userId, ...routeData, ...specialRouteData],
            (err) => {
                if (err) {
                    console.error('WatchedRoutesPushError', err);
                }
            }
        );
    });
}