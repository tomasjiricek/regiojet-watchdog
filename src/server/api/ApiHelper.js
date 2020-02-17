const url = require('url');
const { ApiError } = require('../../common/ErrorTypes');

class ApiHelper {
    constructor(apiMap) {
        this.apiMap = apiMap;
    }

    buildApiUrl(api, options) {
        const {
            urlTemplate,
            options: {
                urlArguments: apiUrlArguments,
                query: apiQuery
            }
        } = api;

        const { 
            urlArguments = {},
            query = {}
        } = options;

        if (!this.hasMandatoryArguments(apiUrlArguments, urlArguments)) {
            throw new ApiError(`Some mandatory URL arguments are missing. Please define all of them: ${apiUrlArguments.join(', ')}`);
        }

        if (!this.hasMandatoryArguments(apiQuery, query)) {
            throw new ApiError(`Some mandatory query props are missing. Please define all of them: ${apiQuery.join(', ')}`);
        }
        
        const processedUrl = this.processUrlTemplate(urlTemplate, urlArguments);
        return this.formatUrl(processedUrl, query);
    }

    formatUrl(urlBase, query) {
        return urlBase + url.format({ query });
    }

    getApiByName(name) {
        for (const api of this.apiMap) {
            if (api.name === name) {
                return api;
            }
        }

        throw new ApiError(`API definition '${name}' not found.`);
    }

    getApiUrlObject(name, options = {}) {
        const api = this.getApiByName(name);
        const apiUrl = this.buildApiUrl(api, options);
        return url.parse(apiUrl);
    }

    hasMandatoryArguments(args, data) {
        if (!(data instanceof Object)) {
            throw new ApiError(
                `Arguments must be a valid Object.\n`
                    + (args.length > 0 
                        ? `Expected object containing values for these keys:\n  ${args.join(', ')}\n`
                        : ''
                    )
                    + `Received type "${typeof(data)}" with this value:\n  ${JSON.stringify(data)}`
            );
        }

        for (const arg of args) {
            if (data[arg] === undefined) {
                return false;
            }
        }

        return true;
    }

    processUrlTemplate(urlTemplate, urlArguments) {
        let parsedUrl = urlTemplate;

        Object.keys(urlArguments).forEach((key) => {
            const regExp = new RegExp(`\$\{${key}\}`, 'g');
            parsedUrl = parsedUrl.replace(regExp, urlArguments[key]);
        });

        return parsedUrl;
    }
}

module.exports = ApiHelper;