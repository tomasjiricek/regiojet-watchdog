const sqlite = require('sqlite3');

const { PATHS } = require('../../common/constants');

const db = new sqlite.Database(PATHS.DB_STORAGE_PATH);

const ROUTE_COLUMNS_MAP = { // Keep the order as is, it's important for transformation when watching new route
    route_id: 'routeId',
    arrival_station_id: 'arrivalStationId',
    arrival_station_name: 'arrivalStationName',
    arrival_time: 'arrivalTime',
    departure_station_id: 'departureStationId',
    departure_station_name: 'departureStationName',
    departure_time: 'departureTime',
    free_seats_count: 'freeSeatsCount',
    transfers_count: 'transfersCount',
    travel_time: 'travelTime',
    vehicle_types: 'JSON:vehicleTypes',
};

const ROUTE_COLUMNS_MAP_REVERSE = {};
Object.keys(ROUTE_COLUMNS_MAP).forEach((key) => {
    ROUTE_COLUMNS_MAP_REVERSE[ROUTE_COLUMNS_MAP[key]] = key;
});

const SQL = {
    GET_ALL_WATCHERS:
        `
        SELECT a.*, b.token as user_token
        FROM watched_routes a
        INNER JOIN users b ON a.user_id = b.id
        `,
    GET_WATCHED_ROUTES:
        `
        SELECT a.*
        FROM watched_routes a
        INNER JOIN users b ON a.user_id = b.id
        WHERE b.token = ?
        `,
    UPDATE_ROUTE_SEATS: 'UPDATE watched_routes SET free_seats_count = ? WHERE id = ?',
    UNWATCH_ROUTE:
        `
        DELETE FROM watched_routes
        WHERE user_id IN (
            SELECT id FROM users WHERE token = ?
        ) AND route_id = ? AND arrival_station_id = ? AND departure_station_id = ?
        `,
    WATCH_ROUTE:
        `
        INSERT INTO watched_routes (user_id, route_id, arrival_station_id, arrival_station_name,
            arrival_time, departure_station_id, departure_station_name, departure_time,
            free_seats_count, transfers_count, travel_time, vehicle_types)

            SELECT id, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? FROM users WHERE token = ?
        `
};

function transformRouteDataFromSql(data) {
    const route = {};
    Object.keys(data).forEach((key) => {
        if (ROUTE_COLUMNS_MAP[key]) {
            const isJson = ROUTE_COLUMNS_MAP[key].indexOf('JSON:') === 0;
            const columnName = isJson ? ROUTE_COLUMNS_MAP[key].substr(5) : ROUTE_COLUMNS_MAP[key];
            route[columnName] = isJson ? JSON.parse(data[key]) : data[key];
        }
    });
    return route;
}

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

function getWatchedRoutes(userToken) {
    return new Promise((resolve, reject) => {
        const routes = [];
        db.each(
            SQL.GET_WATCHED_ROUTES,
            [userToken],
            (err, row) => {
                if (!err && row) {
                    routes.push(transformRouteDataFromSql(row));
                }
            },
            (err) => {
                if (err) {
                    console.error('Failed to get watched routes:', err);
                    reject({ code: 500, message: 'Failed to get watched routes.' });
                    return;
                }
                resolve(routes);
            }
        );
    });
}

function getAllWatchedRoutes() {
    return new Promise((resolve, reject) => {
        const watchers = [];
        db.each(
            SQL.GET_ALL_WATCHERS,
            (err, row) => {
                if (!err && row) {
                    const route = transformRouteDataFromSql(row);
                    route.id = row.id;
                    const token = row.user_token;
                    watchers.push({ token, route });
                }
            },
            (err) => {
                if (err) {
                    console.error('Failed to get all watched routes:', err);
                    reject({ code: 500, message: 'Failed to get all watcher routes.' });
                    return;
                }
                resolve(watchers);
            }
        );
    });
}

function isRouteDataValid(route) {
    if (!(route instanceof Object)) {
        return false;
    }

    for (const key in route) {
        if (!route.hasOwnProperty(key)) {
            continue;
        }

        const isJson = route[key] instanceof Object;

        if (isJson && !ROUTE_COLUMNS_MAP_REVERSE[`JSON:${key}`]) {
            return false;
        }

        if (!isJson && !ROUTE_COLUMNS_MAP_REVERSE[key]) {
            return false;
        }
    }

    return true;
}

function unwatchRoute(userToken, route = {}) {
    return new Promise((resolve, reject) => {
        const { arrivalStationId = null, departureStationId = null, routeId = null } = route;

        if (!arrivalStationId || !departureStationId || !routeId || !userToken) {
            reject({ code: 400, message: 'Invalid data structure.' });
            return;
        }

        db.run(SQL.UNWATCH_ROUTE, [userToken, routeId, arrivalStationId, departureStationId], (err) => {
            if (err) {
                console.error('Failed to unwatch route:', err);
                reject({ code: 500, message: 'Failed to unwatch the route.' });
                return;
            }
            resolve();
        });
    });
}

function updateRouteSeats(id, freeSeatsCount) {
    return new Promise((resolve, reject) => {
        db.run(SQL.UPDATE_ROUTE_SEATS, [freeSeatsCount, id], (err) => {
            if (err) {
                console.error('Failed to update route seats:', err);
                reject({ code: 500, message: 'Failed to update the route seats.' });
                return;
            }
            resolve();
        });
    });
}

function watchRoute(userToken, route) {
    return new Promise((resolve, reject) => {
        if (!isRouteDataValid(route)) {
            reject({ code: 400, message: 'Invalid data structure.' });
            return;
        }

        const routeValues = transformRouteDataToSqlValuesArray(route);

        db.run(SQL.WATCH_ROUTE, [...routeValues, userToken], (err) => {
            if (err) {
                console.error('Failed to watch route:', err);
                reject({ code: 500, message: 'Failed to watch the route.' });
                return;
            }
            resolve();
        });
    });
}

module.exports = {
    getAllWatchedRoutes,
    getWatchedRoutes,
    unwatchRoute,
    updateRouteSeats,
    watchRoute
};
