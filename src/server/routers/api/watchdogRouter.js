const express = require('express');

const { isDeviceAuthorized } = require('../../utils/masterLogin');
const { findUserByToken } = require('../../utils/user');
const { getWatchedRoutes, watchRoute, unwatchRoute } = require('../../utils/watcher');
const expressError = require('../expressError');

const router = express.Router();
router.use(express.json());

router.post('/routes', (req, res) => {
    res.set('Content-Type', 'application/json');
    const { body: { userToken = null } } = req;

    if (!userToken) {
        return expressError(res, { statusCode: 400, error: { message: 'Missing mandatory params: userToken' } });
    }

    findUserByToken(userToken)
        .then((data) => isDeviceAuthorized(data.deviceId))
        .then(() => getWatchedRoutes(userToken))
        .then((data) => res.status(200).send({ status: 'OK', data }))
        .catch((error) => expressError(res, { statusCode: error.code || 403, error }));
});

router.post('/watch', (req, res) => {
    res.set('Content-Type', 'application/json');
    const { body: { userToken = null, route = null } } = req;

    if (!userToken || !(route instanceof Object)) {
        return expressError(res, { statusCode: 400, error: { message: 'Invalid data structure' } });
    }

    findUserByToken(userToken)
        .then((data) => isDeviceAuthorized(data.deviceId))
        .then(() => watchRoute(userToken, route))
        .then(() => res.status(200).send({ status: 'OK' }))
        .catch((error) => expressError(res, { statusCode: error.code || 403, error }));
});

router.post('/unwatch', (req, res) => {
    res.set('Content-Type', 'application/json');
    const { body: { userToken = null, route = null } } = req;

    if (!userToken || !(route instanceof Object)) {
        return expressError(res, { statusCode: 400, error: { message: 'Invalid data structure' } });
    }

    findUserByToken(userToken)
        .then((data) => isDeviceAuthorized(data.deviceId))
        .then(() => unwatchRoute(userToken, route))
        .then(() => res.status(200).send({ status: 'OK' }))
        .catch((error) => expressError(res, { statusCode: error.code || 403, error }));
});

module.exports = router;
