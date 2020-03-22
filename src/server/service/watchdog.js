const fs = require('fs');

const { WatchdogError } = require('../../common/ErrorTypes');
const { HTTP_STATUS_NO_FREE_SEATS, MESSAGE_NO_FREE_SEATS, PATHS } = require('../../common/constants');
const { getRouteDetails } = require('../api/regiojetApi');
const { getWatchedRouteIndex } = require('../utils/watcher');
const { notifyUser } = require('../utils/pushNotification');

function createWatchersFile() {
    fs.writeFile(PATHS.WATCHERS, JSON.stringify({}), () => {});
}

function getCzechDateAndTime(dateString) {
    const date = new Date(dateString);
    let hours = date.getHours();
    let minutes = date.getMinutes();

    if (hours < 10) {
        hours = `0${hours}`;
    }

    if (minutes < 10) {
        minutes = `0${minutes}`;
    }

    return `${date.getDate()}. ${date.getMonth() + 1}. - ${hours}:${minutes}`;
}

function editWatchedRouteProps(userToken, routeId, props) {
    return new Promise((resolve, reject) => {
        fs.readFile(PATHS.WATCHERS, (err, data) => {
            let watchers = {};

            if (err) {
                reject(new WatchdogError('Failed to load watched routes.'));
                return;
            }

            try {
                watchers = JSON.parse(data);
            } catch (error) {
                reject(new WatchdogError('Failed to parse watched routes.'));
                return;
            }

            const watcher = watchers[userToken];
            const watchedRouteIndex = getWatchedRouteIndex(watcher.routes, routeId);

            if (watchedRouteIndex !== null) {
                watcher.routes[watchedRouteIndex] = { ...watcher.routes[watchedRouteIndex], ...props };
                fs.writeFile(PATHS.WATCHERS, JSON.stringify(watchers), (err) => {
                    if (err) {
                        reject(new WatchdogError('Failed to edit route props.'));
                        return;
                    }
                    resolve();
                });
            } else {
                reject(new WatchdogError('The route is not watched.'));
            }
        });
    });
}

function getWatchers() {
    return new Promise((resolve, reject) => {
        fs.readFile(PATHS.WATCHERS, (err, data) => {
            if (err) {
                createWatchersFile();
                reject(new WatchdogError('Failed to load watched routes.'));
                return;
            }

            try {
                const watchers = JSON.parse(data);
                resolve(watchers);
            } catch (error) {
                reject(new WatchdogError('Failed to parse watched routes.'));
            }
        });
    });
}

function checkRoutesOfWatcher({ token, routes }) {
    routes.forEach((route) => {
        checkUserRouteSeatsChanged(token, route)
            .then((freeSeatsCount) => {
                editWatchedRouteProps(token, route.id, { freeSeatsCount }).catch((error) => {
                    console.error('Error while editing props:', error);
                });
            })
            .catch(() => {
                // Nothing to catch
            });
    });
}

function checkUserRouteSeatsChanged(token, route) {
    const {
        arrivalStation: { fullname: arrivalStation },
        arrivalStationId,
        departureStation: { fullname: departureStation },
        departureStationId,
        departureTime,
        id: routeId,
        freeSeatsCount = 0
    } = route;

    const date = getCzechDateAndTime(departureTime);
    return getRouteDetails(routeId, departureStationId, arrivalStationId)
        .then((data) => {
            const { freeSeatsCount: currentFreeSeatsCount } = data;

            if (currentFreeSeatsCount > freeSeatsCount && freeSeatsCount === 0) {
                console.log(`Should notify user about free seats (${date}, ${departureStation} -> ${arrivalStation}, ${freeSeatsCount} seats)`);
                notifyUser(token, {
                    message: constructNotificationMessage({
                        arrivalStation, currentFreeSeatsCount, date, departureStation
                    })
                }).catch((error) => {
                    console.error('Failed to notify user.', error);
                });
            } else {
                return Promise.reject();
            }

            return Promise.resolve(currentFreeSeatsCount);
        })
        .catch((error) => {
            if (error && error.name === 'RJApiRequestError') {
                const { httpDetails: { error: { message }, statusCode } } = error;

                if (message === MESSAGE_NO_FREE_SEATS && statusCode === HTTP_STATUS_NO_FREE_SEATS) {
                    if (freeSeatsCount > 0) {
                        notifyUser(token, {
                            message: constructNotificationMessage({ arrivalStation, date, departureStation })
                        }).catch((error) => {
                            console.info('Failed to notify user:', error);
                        });
                        return Promise.resolve(0);
                    }
                    return Promise.reject();
                }
            }
            return Promise.reject(error);
        });
}

function constructNotificationMessage({
    arrivalStation,
    currentFreeSeatsCount = 0,
    date,
    departureStation,
}) {
    const action = currentFreeSeatsCount > 0
        ? `se právě uvolnila místa (${currentFreeSeatsCount})!`
        : `právě byla obsazena všechna místa!`;

    return `Ve vlaku ${departureStation} -> ${arrivalStation} ze dne ${date}, ${action}`;
}

function checkRoutesOFAllWatchers() {
    getWatchers()
        .then((watchers) => {
            Object.keys(watchers).forEach((userToken) => {
                checkRoutesOfWatcher(watchers[userToken]);
            })
        });
}

module.exports = {
    checkRoutesOFAllWatchers
};
