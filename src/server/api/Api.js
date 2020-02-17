const ApiHelper = require('./ApiHelper');
const apiMap = require('../../common/apiMap');
const api = new ApiHelper(apiMap);

module.exports = {
    getUrlObject: api.getApiUrlObject.bind(api)
};
