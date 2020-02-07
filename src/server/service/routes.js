const express = require('express');
const path = require('path');

const { getDestinations, getRouteDetails, getTrainRoutes } = require('../api/regiojetApi');

const { HTTP_STATUS_NO_FREE_SEATS, MESSAGE_NO_FREE_SEATS } = require('../../common/constants');

function _sendError(response, data) {
    if (!(data instanceof Object)) {
        data = { data };
    }
    data.statusCode = data.statusCode || 500;
    response.status(data.statusCode).send({ status: 'ERROR', data });
}

const apiRouter = express.Router();

apiRouter.get('/destinations', (_, res) => {
    res.set('Content-Type', 'application/json');
    getDestinations()
        .then((data) => res.status(200).send({ status: 'OK', data }))
        .catch((error) => _sendError(res, { statusCode: 500, error }));

});

apiRouter.get('/route/search', (req, res) => {
    res.set('Content-Type', 'application/json');

    const { departureStationId, arrivalStationId } = req.query;
    let { date, minDeparture, maxDeparture } = req.query;

    if (!departureStationId || !arrivalStationId) {
        return _sendError(res, 'Missing mandatory params: departureStationId, arrivalStationId');
    }

    date = date || new Date().toISOString().split('T')[0];

    getTrainRoutes(date, departureStationId, arrivalStationId, minDeparture, maxDeparture)
        .then((data) => res.status(200).send({ status: 'OK', data }))
        .catch((error) => _sendError(res, { statusCode: 500, error }));

});

apiRouter.get('/route/:routeId([0-9]+)/detail', (req, res) => {
    res.set('Content-Type', 'application/json');

    const { 
        params: { routeId },
        query: { stationIdFrom, stationIdTo }
    } = req;

    if (!stationIdFrom || !stationIdTo) {
        return _sendError(res, 'Missing mandatory params: stationIdFrom, stationIdTo');
    }

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
});

const router = express.Router();
router.use('/', express.static(path.join(__dirname, '../../../dist')));
router.use('/api/', apiRouter);

module.exports = router;
