const express = require('express');
const path = require('path');

const router = express.Router();

router.use('/static/sw.js', (_, res, next) => {
    res.append('Service-Worker-Allowed', '/');
    next();
});

router.use('/', express.static(path.join(__dirname, '../../../../dist'), ));

module.exports = router;
