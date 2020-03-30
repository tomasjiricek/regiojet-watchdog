const fs = require('fs');

const { HTTP_STATUS_NO_FREE_SEATS, MESSAGE_NO_FREE_SEATS } = require('../../common/constants');
const { getRouteDetails } = require('../api/regiojetApi');
const { getAllWatchedRoutes, unwatchRoute, updateRouteSeats } = require('../utils/watcher');
const { notifyUser } = require('../utils/pushNotification');
const { getShortCzechDateAndTime } = require('../../common/utils/date');

function checkUserRouteSeatsChanged(token, route) {
    const {
        arrivalStationId,
        arrivalStationName,
        departureStationId,
        departureStationName,
        departureTime,
        routeId,
        freeSeatsCount = 0
    } = route;

    const date = getShortCzechDateAndTime(new Date(departureTime));
    return getRouteDetails(routeId, departureStationId, arrivalStationId)
        .then((data) => {
            const { freeSeatsCount: currentFreeSeatsCount } = data;

            if (currentFreeSeatsCount !== freeSeatsCount) {
                updateRouteSeats(route.id, currentFreeSeatsCount)
                    .catch(() => {
                        // No need to catch this
                    });
            }

            if (currentFreeSeatsCount > freeSeatsCount && freeSeatsCount === 0) {
                console.log(
                    `Should notify user about free seats (${date}, ${departureStationName} `
                        + `-> ${arrivalStationName}, ${currentFreeSeatsCount} seats)`
                );
                notifyUser(token, {
                    message: constructNotificationMessage({
                        arrivalStationName, currentFreeSeatsCount, date, departureStationName,
                    }),
                    id: `${routeId}${departureStationId}${arrivalStationId}`
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
                        updateRouteSeats(route.id, 0);
                        notifyUser(token, {
                            message: constructNotificationMessage({ arrivalStationName, date, departureStationName }),
                            id: `${routeId}${departureStationId}${arrivalStationId}`
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
    arrivalStationName,
    currentFreeSeatsCount = 0,
    date,
    departureStationName,
}) {
    const action = currentFreeSeatsCount > 0
        ? `se právě uvolnila místa (${currentFreeSeatsCount})!`
        : `právě byla obsazena všechna místa!`;

    return `Ve vlaku ${departureStationName} -> ${arrivalStationName} ze dne ${date}, ${action}`;
}

function checkRoutesOFAllWatchers() {
    getAllWatchedRoutes()
        .then((watchedRoutes) => {
            const currentTimestamp = new Date().getTime();

            watchedRoutes.forEach(({ token, route }) => {
                if (new Date(route.departureTime).getTime() < currentTimestamp) {
                    unwatchRoute(token, route)
                        .then(() => notifyUser(token, {
                            message: `Spoj z ${route.departureStationName} do ${route.arrivalStationName} `
                                + `ze dne ${getShortCzechDateAndTime(new Date(route.departureTime))} není k dispozici `
                                + `a byl smazán ze sledovaných.`,
                            id: `${route.routeId}${route.departureStationId}${route.arrivalStationId}`
                        }))
                        .catch((err) => {
                            console.error('Failed to unwatch expired route:', err, '| route:', route);
                        });
                    return;
                }

                checkUserRouteSeatsChanged(token, route)
                    .catch(() => {
                        // Nothing to catch
                    });
            })
        })
        .catch((error) => {
            console.error(error);
        });
}

module.exports = {
    checkRoutesOFAllWatchers
};
