const fs = require('fs');
const path = require('path');

const WATCHERS_PATH = path.join(__dirname, '../../../data', 'watchers.json');

function createWatchersFile() {
    fs.writeFile(WATCHED_ROUTES_PATH, JSON.stringify({}), () => {});
}

function isRouteWatched(watchedRoutes, route) {
    for (const item of watchedRoutes) {
        if (!(item instanceof Object)) {
            continue;
        }

        if (route.id === item.id) {
            return true;
        }
    }
    return false;
}

function unwatchRoute(userToken, route) {
    return new Promise((resolve, reject) => {
        fs.readFile(WATCHERS_PATH, (err, data) => {
            let watchers = {};

            if (err) {
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

            if (isRouteWatched(watcher.routes, route)) {
                watcher.routes = watcher.routes.filter((item) => (
                    item.id !== route.id
                ));
                fs.writeFile(WATCHERS_PATH, JSON.stringify(watchers), (err) => {
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
        fs.readFile(WATCHERS_PATH, (err, data) => {
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

            if (!isRouteWatched(watcher.routes, route)) {
                watcher.routes.push(route);
                fs.writeFile(WATCHERS_PATH, JSON.stringify(watchers), (err) => {
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
    unwatchRoute,
    watchRoute
};