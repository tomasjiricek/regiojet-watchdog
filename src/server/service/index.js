const express = require('express');
const routes = require('./routes');

const app = express();

function initApp() {
    app.all('*', (_, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
        next();
    });

    app.use('/', routes);
}

module.exports = {
    app,
    initApp
};
