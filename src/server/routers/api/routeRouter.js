const express = require('express');

const { getRouteDetails, getTrainRoutes } = require('../../api/regiojetApi');
const { HTTP_STATUS_NO_FREE_SEATS, MESSAGE_NO_FREE_SEATS } = require('../../../common/constants');
const { isDeviceAuthorized } = require('../../utils/masterLogin');
const expressError = require('../expressError');

const router = express.Router();

router.get('/search', (req, res) => {
    res.set('Content-Type', 'application/json');

    const { departureStationId, departureStationType, arrivalStationId, arrivalStationType, deviceId } = req.query;
    let { date, minDeparture, maxDeparture } = req.query;

    if (!departureStationId || !arrivalStationId || !departureStationType || !arrivalStationType) {
        return expressError(res, {
            statusCode: 400,
            error: {
                message: 'Missing mandatory params: departureStationId, departureStationType, arrivalStationId, arrivalStationType'
            }
        });
    }

    date = date || new Date().toISOString().split('T')[0];

    isDeviceAuthorized(deviceId)
        .then(() => {
            getTrainRoutes(
                date,
                departureStationId,
                departureStationType,
                arrivalStationId,
                arrivalStationType,
                minDeparture,
                maxDeparture
            )
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
