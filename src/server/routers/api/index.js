const express = require('express');

const { getDestinations } = require('../../api/regiojetApi');
const { authorizeDevice, isDeviceAuthorized, isPasswordValid } = require('../../utils/masterLogin');
const expressError = require('../expressError');
const routeRouter = require('./routeRouter');
const userRouter = require('./userRouter');
const watchdogRouter = require('./watchdogRouter');

const router = express.Router();
router.use(express.json());

router.use('/route', routeRouter);
router.use('/user', userRouter);
router.use('/watchdog', watchdogRouter);

router.post('/master-login', (req, res) => {
    res.set('Content-Type', 'application/json');
    isPasswordValid(req.body.password)
        .then((data) => {
            authorizeDevice(req.body.deviceId);
            res.status(200).send({ status: 'OK', data });
        })
        .catch((error) => expressError(res, { statusCode: 403, error }));

});

router.get('/destinations', (req, res) => {
    res.set('Content-Type', 'application/json');
    isDeviceAuthorized(req.query.deviceId)
        .then(() => {
            getDestinations()
                .then((data) => res.status(200).send({ status: 'OK', data }))
                .catch((error) => expressError(res, { statusCode: 500, error }));
        })
        .catch((error) => expressError(res, { statusCode: 403, error }))

});

router.get('/is-authorized', (req, res) => {
    res.set('Content-Type', 'application/json');
    let { deviceId } = req.query;

    if (!deviceId) {
        return expressError(res, 'Missing mandatory params: deviceId');
    }

    isDeviceAuthorized(deviceId)
        .then(() => res.status(200).send({ status: 'OK', data: { authorized: true } }))
        .catch((error) => expressError(res, { statusCode: error.code || 500, error }));

});

module.exports = router;
