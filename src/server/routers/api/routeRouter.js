const express = require('express');

const { getRouteDetails, getTrainRoutes } = require('../../api/regiojetApi');
const { HTTP_STATUS_NO_FREE_SEATS, MESSAGE_NO_FREE_SEATS } = require('../../../common/constants');
const { isDeviceAuthorized } = require('../../utils/masterLogin');
const expressError = require('../expressError');

function isValidStationData(station) {
    return station && station instanceof Object && station.id && station.isCity !== undefined;
}

const router = express.Router();
router.use(express.json());

router.post('/search', (req, res) => {
    res.set('Content-Type', 'application/json');

    const {
        body: {
            arrivalStation = null,
            date = new Date().toISOString().split('T')[0],
            departureStation = null,
            deviceId = null,
            minDeparture = '00:00',
            maxDeparture = '23:59'
        } = {},
    } = req;

    if (!isValidStationData(departureStation) || !isValidStationData(arrivalStation)) {
        return expressError(res, {
            statusCode: 400,
            error: { message: 'Invalid data structure' }
        });
    }

    isDeviceAuthorized(deviceId)
        .then(() => {
            getTrainRoutes(date, departureStation, arrivalStation, minDeparture, maxDeparture)
                .then((data) => res.status(200).send({ status: 'OK', data }))
                .catch((error) => expressError(res, { statusCode: 500, error }));
        })
        .catch((error) => expressError(res, { statusCode: 403, error }))

});

router.get('/:routeId([0-9]+)/detail', (req, res) => {
    res.set('Content-Type', 'application/json');

    const {
        params: { routeId },
        query: { deviceId, stationIdFrom, stationIdTo }
    } = req;

    if (!stationIdFrom || !stationIdTo) {
        return expressError(res, { statusCode: 400, error: { message: 'Missing mandatory params: stationIdFrom, stationIdTo' } });
    }

    isDeviceAuthorized(deviceId)
        .then(() => {
            getRouteDetails(routeId, stationIdFrom, stationIdTo)
                .then((data) => res.status(200).send({ status: 'OK', data }))
                .catch((error) => {
                    let httpStatusCode = 500;
                    if (error.name === "RJApiError" && error.httpDetails instanceof Object) {
                        const { httpDetails: { error: remoteError, statusCode } } = error;
                        if (statusCode === 400 && remoteError.message === MESSAGE_NO_FREE_SEATS) {
                            httpStatusCode = HTTP_STATUS_NO_FREE_SEATS;
                        }
                    }
                    expressError(res, { statusCode: httpStatusCode, error });
                });
            })
        .catch((error) => expressError(res, { statusCode: 403, error }))

});

module.exports = router;
