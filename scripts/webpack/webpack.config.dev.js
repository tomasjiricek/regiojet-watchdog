const WEBPACK_CONFIG_BASE = require('./webpack.config.base');

module.exports = {
    ...WEBPACK_CONFIG_BASE,
    devtool: 'source-map',
    mode: 'development',
    watch: true
};
