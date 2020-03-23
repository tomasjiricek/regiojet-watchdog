const express = require('express');

const { isDeviceAuthorized } = require('../../utils/masterLogin');
const { findUserByToken, getUserByAuthData, registerUser } = require('../../utils/user');
const { saveSubscription } = require('../../utils/pushNotification');
const expressError = require('../expressError');

const router = express.Router();
router.use(express.json());

router.post('/login', (req, res) => {
    res.set('Content-Type', 'application/json');
    const { body } = req;

    try {
        const decodedData = Buffer.from(body.token, 'base64');
        const authData = JSON.parse(decodedData.toString());

        getUserByAuthData(authData)
            .then((data) => res.status(200).send({ status: 'OK', data }))
            .catch((error) => expressError(res, { statusCode: error.code || 500, error }));

    } catch(_) {
        return expressError(res, { statusCode: 500, error: { message: 'Invalid data structure' } })
    }
});

router.post('/verify', (req, res) => {
    res.set('Content-Type', 'application/json');
    const { body: { userToken = null } } = req;

    findUserByToken(userToken)
        .then((data) => res.status(200).send({ status: 'OK', data }))
        .catch((error) => expressError(res, { statusCode: error.code || 500, error }));

});

router.post('/register', (req, res) => {
    res.set('Content-Type', 'application/json');
    const { body } = req;

    try {
        const decodedData = Buffer.from(body.token, 'base64');
        const authData = JSON.parse(decodedData.toString());

        registerUser(authData)
            .then((data) => res.status(200).send({ status: 'OK', data }))
            .catch((error) => expressError(res, { statusCode: error.code || 500, error }));

    } catch(_) {
        return expressError(res, { statusCode: 400, error: { message: 'Invalid data structure' } })
    }
});

router.post('/push-subscribe', (req, res) => {
    res.set('Content-Type', 'application/json');
    const { body: { userToken = null, subscription = null } } = req;

    if (!userToken || !(subscription instanceof Object)) {
        return expressError(res, { statusCode: 400, error: { message: 'Invalid data structure' } });
    }

    findUserByToken(userToken)
        .then((data) => isDeviceAuthorized(data.deviceId))
        .then(() => saveSubscription(userToken, subscription))
        .then(() => res.status(200).send({ status: 'OK' }))
        .catch((error) => expressError(res, { statusCode: error.code || 500, error }));

});

module.exports = router;
