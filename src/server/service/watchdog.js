const fs = require('fs');

const { HTTP_STATUS_NO_FREE_SEATS, MESSAGE_NO_FREE_SEATS, PATHS } = require('../../common/constants');
const { getRouteDetails } = require('../api/regiojetApi');
const { getAllWatchedRoutes, updateRouteSeats } = require('../utils/watcher');
const { notifyUser } = require('../utils/pushNotification');
const { getShortCzechDateAndTime } = require('../../common/utils/date');

function checkUserRouteSeatsChanged(token, route) {
    const {
        arrivalStationId,
        arrivalStationName: arrivalStation,
        departureStationId,
        departureStationName: departureStation,
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
                console.log(`Should notify user about free seats (${date}, ${departureStation} -> ${arrivalStation}, ${currentFreeSeatsCount} seats)`);
                notifyUser(token, {
                    message: constructNotificationMessage({
                        arrivalStation, currentFreeSeatsCount, date, departureStation,
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
                            message: constructNotificationMessage({ arrivalStation, date, departureStation }),
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
    getAllWatchedRoutes()
        .then((watchedRoutes) => {
            watchedRoutes.forEach(({ token, route }) => {
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
