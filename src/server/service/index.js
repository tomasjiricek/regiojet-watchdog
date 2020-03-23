const express = require('express');
const apiRouter = require('../routers/api');
const compression = require('compression');

const { checkRoutesOFAllWatchers } = require('./watchdog');

const WATCHDOG_CHECK_INTERVAL = 20000;
const app = express();

function initApp(isDevMode = false) {
    app.use(compression());

    app.all('*', (_, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
        next();
    });

    if (isDevMode) {
        app.use('/', require('../routers/static'));
        app.use('/api', apiRouter);
    } else {
        app.use('/', apiRouter);
    }

    setInterval(checkRoutesOFAllWatchers, WATCHDOG_CHECK_INTERVAL);
}

module.exports = {
    app,
    initApp
};
