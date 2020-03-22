const express = require('express');

const { getDestinations, getRouteDetails, getTrainRoutes } = require('../api/regiojetApi');
const { HTTP_STATUS_NO_FREE_SEATS, MESSAGE_NO_FREE_SEATS } = require('../../common/constants');
const { authorizeDevice, isDeviceAuthorized, isPasswordValid } = require('../utils/masterLogin');
const { findUserByToken, getUserByAuthData, registerUser } = require('../utils/user');
const { saveSubscription } = require('../utils/pushNotification');
const { watchRoute, unwatchRoute } = require('../utils/watcher');

function _sendError(response, data) {
    if (!(data instanceof Object)) {
        data = { error: { message: data } };
    }
    data.statusCode = data.statusCode || 500;
    response.status(data.statusCode).send({ status: 'ERROR', data });
}

const router = express.Router();
router.use(express.json());

router.post('/user-login', (req, res) => {
    res.set('Content-Type', 'application/json');
    const { body } = req;

    try {
        const decodedData = Buffer.from(body.token, 'base64');
        const authData = JSON.parse(decodedData.toString());

        getUserByAuthData(authData)
            .then((data) => res.status(200).send({ status: 'OK', data }))
            .catch((error) => _sendError(res, { statusCode: error.code || 500, error }));

    } catch(_) {
        return _sendError(res, { statusCode: 500, error: { message: 'Invalid data structure' } })
    }
});

router.post('/user-verify', (req, res) => {
    res.set('Content-Type', 'application/json');
    const { body: { userToken = null } } = req;

    findUserByToken(userToken)
        .then((data) => res.status(200).send({ status: 'OK', data }))
        .catch((error) => _sendError(res, { statusCode: error.code || 500, error }));

});

router.post('/user-register', (req, res) => {
    res.set('Content-Type', 'application/json');
    const { body } = req;

    try {
        const decodedData = Buffer.from(body.token, 'base64');
        const authData = JSON.parse(decodedData.toString());

        registerUser(authData)
            .then((data) => res.status(200).send({ status: 'OK', data }))
            .catch((error) => _sendError(res, { statusCode: error.code || 500, error }));

    } catch(_) {
        return _sendError(res, { statusCode: 400, error: { message: 'Invalid data structure' } })
    }
});

router.post('/user-push-subscribe', (req, res) => {
    res.set('Content-Type', 'application/json');
    const { body: { userToken = null, subscription = null } } = req;

    if (!userToken || !(subscription instanceof Object)) {
        return _sendError(res, { statusCode: 400, error: { message: 'Invalid data structure' } });
    }

    findUserByToken(userToken)
        .then((data) => isDeviceAuthorized(data.deviceId))
        .then(() => saveSubscription(userToken, subscription))
        .then(() => res.status(200).send({ status: 'OK' }))
        .catch((error) => _sendError(res, { statusCode: error.code || 500, error }));

});

router.post('/master-login', (req, res) => {
    res.set('Content-Type', 'application/json');
    isPasswordValid(req.body.password)
        .then((data) => {
            authorizeDevice(req.body.deviceId);
            res.status(200).send({ status: 'OK', data });
        })
        .catch((error) => _sendError(res, { statusCode: 403, error }));

});

router.get('/destinations', (req, res) => {
    res.set('Content-Type', 'application/json');
    isDeviceAuthorized(req.query.deviceId)
        .then(() => {
            getDestinations()
                .then((data) => res.status(200).send({ status: 'OK', data }))
                .catch((error) => _sendError(res, { statusCode: 500, error }));
        })
        .catch((error) => _sendError(res, { statusCode: 403, error }))

});

router.get('/is-authorized', (req, res) => {
    res.set('Content-Type', 'application/json');
    let { deviceId } = req.query;

    if (!deviceId) {
        return _sendError(res, 'Missing mandatory params: deviceId');
    }

    isDeviceAuthorized(deviceId)
        .then(() => res.status(200).send({ status: 'OK', data: { authorized: true } }))
        .catch((error) => _sendError(res, { statusCode: error.code || 500, error }));

});

router.get('/route/search', (req, res) => {
    res.set('Content-Type', 'application/json');

    const { departureStationId, departureStationType, arrivalStationId, arrivalStationType, deviceId } = req.query;
    let { date, minDeparture, maxDeparture } = req.query;

    if (!departureStationId || !arrivalStationId || !departureStationType || !arrivalStationType) {
        return _sendError(res, {
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
                .catch((error) => _sendError(res, { statusCode: 500, error }));
        })
        .catch((error) => _sendError(res, { statusCode: 403, error }))

});

router.get('/route/:routeId([0-9]+)/detail', (req, res) => {
    res.set('Content-Type', 'application/json');

    const {
        params: { routeId },
        query: { deviceId, stationIdFrom, stationIdTo }
    } = req;

    if (!stationIdFrom || !stationIdTo) {
        return _sendError(res, { statusCode: 400, error: { message: 'Missing mandatory params: stationIdFrom, stationIdTo' } });
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
                    _sendError(res, { statusCode: httpStatusCode, error });
                });
            })
        .catch((error) => _sendError(res, { statusCode: 403, error }))

});

router.post('/watchdog/watch', (req, res) => {
    res.set('Content-Type', 'application/json');
    const { body: { userToken = null, route = null } } = req;

    if (!userToken || !(route instanceof Object) || !route.id) {
        return _sendError(res, { statusCode: 400, error: { message: 'Invalid data structure' } });
    }

    findUserByToken(userToken)
        .then((data) => isDeviceAuthorized(data.deviceId))
        .then(() => watchRoute(userToken, route))
        .then(() => res.status(200).send({ status: 'OK' }))
        .catch((error) => _sendError(res, { statusCode: error.code || 403, error }));
});

router.post('/watchdog/unwatch', (req, res) => {
    res.set('Content-Type', 'application/json');
    const { body: { userToken = null, route = null } } = req;

    if (!userToken || !(route instanceof Object) || !route.id) {
        return _sendError(res, { statusCode: 400, error: { message: 'Invalid data structure' } });
    }

    findUserByToken(userToken)
        .then((data) => isDeviceAuthorized(data.deviceId))
        .then(() => unwatchRoute(userToken, route))
        .then(() => res.status(200).send({ status: 'OK' }))
        .catch((error) => _sendError(res, { statusCode: error.code || 403, error }));
});

module.exports = router;
