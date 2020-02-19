const express = require('express');
const apiRouter = require('./apiRouter');

const app = express();

function initApp(isDevMode = false) {
    app.all('*', (_, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
        next();
    });

    if (isDevMode) {
        app.use('/', require('./staticRouter'));
        app.use('/api/', apiRouter);
    } else {
        app.use('/', apiRouter);
    }
}

module.exports = {
    app,
    initApp
};
