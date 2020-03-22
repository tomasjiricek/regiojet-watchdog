const fs = require('fs');

const { PATHS } = require('../../common/constants');

function createWatchersFile() {
    fs.writeFile(PATHS.WATCHERS, JSON.stringify({}), () => {});
}

function getWatchedRouteIndex(watchedRoutes, route) {
    const { arrivalStationId, departureStationId, id: routeId } = route;
    for (let i = 0; i < watchedRoutes.length; i++) {
        const item = watchedRoutes[i];

        if (!(item instanceof Object)) {
            continue;
        }

        if (
            routeId === item.id &&
            arrivalStationId === item.arrivalStationId &&
            departureStationId === item.departureStationId
        ) {
            return i;
        }
    }
    return null;
}

function unwatchRoute(userToken, route) {
    return new Promise((resolve, reject) => {
        fs.readFile(PATHS.WATCHERS, (err, data) => {
            let watchers = {};

            if (err) {
                createWatchersFile();
                reject({ code: 500, message: 'Failed to load watched routes.' });
                return;
            }

            try {
                watchers = JSON.parse(data);
            } catch (error) {
                reject({ code: 500, message: 'Failed to parse watched routes.' });
                return;
            }

            if (watchers[userToken] === undefined) {
                reject({ code: 410, message: 'No watched routes.' });
                return;
            }

            const watcher = watchers[userToken];
            const watchedRouteIndex = getWatchedRouteIndex(watcher.routes, route);

            if (watchedRouteIndex !== null) {
                watcher.routes.splice(watchedRouteIndex, 1);
                fs.writeFile(PATHS.WATCHERS, JSON.stringify(watchers), (err) => {
                    if (err) {
                        reject({ code: 500, message: 'Failed to unwatch the route.' });
                        return;
                    }
                    resolve();
                });
            } else {
                reject({ code: 410, message: 'The route is not watched.' });
            }

        });
    });
}

function watchRoute(userToken, route) {
    return new Promise((resolve, reject) => {
        fs.readFile(PATHS.WATCHERS, (err, data) => {
            let watchers = { [userToken]: { token: userToken, routes: [] } };

            if (!err) {
                try {
                    watchers = JSON.parse(data);
                } catch (error) {
                    // Nothing to catch
                }
            }

            if (watchers[userToken] === undefined) {
                watchers[userToken] = { token: userToken, routes: [] };
            }

            const watcher = watchers[userToken];
            const watchedRouteIndex = getWatchedRouteIndex(watcher.routes, route);

            if (watchedRouteIndex === null) {
                watcher.routes.push(route);
                fs.writeFile(PATHS.WATCHERS, JSON.stringify(watchers), (err) => {
                    if (err) {
                        reject({ code: 500, message: 'Failed to watch the route' });
                        return;
                    }
                    resolve();
                });
            } else {
                reject({ code: 400, message: 'The route is already watched.' });
            }

        });
    });
}

module.exports = {
    getWatchedRouteIndex,
    unwatchRoute,
    watchRoute
};
