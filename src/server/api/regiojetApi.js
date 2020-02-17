/** 
 * Example search URL:
 * https://brn-ybus-pubapi.sa.cz/restapi/routes/search/simple
 *     ?departureDate=2020-01-31
 *     &tariffs=REGULAR
 *     &fromLocationId=372825000&fromLocationType=STATION
 *     &toLocationId=372842002&toLocationType=CITY
 * 
 * Example route detail URL
 * https://brn-ybus-pubapi.sa.cz/restapi/routes/<ID>/simple
 *     ?fromStationId=372825000
 *     &toStationId=372825004
 *     &routeId=5140462188
 *     &tariffs=REGULAR
 */

const https = require('https');
const url = require('url');

const Api = require('./Api');
const { RJApiRequestError } = require('../../common/ErrorTypes');

const CLASSES = {
    C0: 'Standard',
    C1: 'Relax',
    C2: 'Business',
    TRAIN_LOW_COST: 'Low cost'
};

const STATIC_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36',
    'X-Application-Origin': 'web',
    'X-Currency': 'CZK',
    'X-Lang': 'cs'
}

const GMT_TIMEZONE = new Date().toTimeString().replace(/.*GMT([\+\-][0-9]{2})([0-9]{2}).*/, '$1:$2');

function getDestinations() {
    const destinationsUrl = Api.getUrlObject('destinations');
    return getHttpsRequestPromise(destinationsUrl, (resolve, reject, error, data) => {
        if (error !== null) {
            return reject(error);
        }

        resolve(data);
    });
}

function getHttpsRequestPromise(requestOptions, callback) {
    return new Promise((resolve, reject) => {
        const request = https.get(requestOptions, responseProcessor.bind(null, callback.bind(null, resolve, reject)));
        request.on('error', () => {
            reject(new RJApiRequestError('Request failed'));
        });
    });
}

function getTrainRoutes(date, departureStationId, departureStationType, arrivalStationId, arrivalStationType, minDeparture, maxDeparture) {
    const fromLocation = { id: departureStationId, type: departureStationType };
    const toLocation = { id: arrivalStationId, type: arrivalStationType };
    const minDepartureTime = new Date(`${date}T${minDeparture || '00:00'}${GMT_TIMEZONE}`).getTime();
    const maxDepartureTime = new Date(`${date}T${maxDeparture || '23:59'}${GMT_TIMEZONE}`).getTime();
    const requestOptions = buildRoutesSearchOptions(date, fromLocation, toLocation);

    return getHttpsRequestPromise(requestOptions, (resolve, reject, error, data) => {
        if (error !== null) {
            return reject(error);
        }

        resolve(
            data.routes.filter((route) => {
                const departureTime = new Date(route.departureTime).getTime();
                return departureTime >= minDepartureTime && departureTime <= maxDepartureTime;
            })
        );
    });
}

function getRouteDetails(routeId, fromStationId, toStationId) {
    const requestOptions = buildRouteDetailOptions(routeId, fromStationId, toStationId);
    return getHttpsRequestPromise(requestOptions, (resolve, reject, error, data) => {
        if (error !== null) {
            return reject(error);
        }

        resolve(data);
    });
}

function responseProcessor(callback, res) {
    const { statusCode } = res;

    let rawData = Buffer.from('');

    res.on('data', (chunk) => {
        rawData = Buffer.concat([rawData, Buffer.from(chunk)]);
    })

    res.on('end', () => {
        try {
            const data = JSON.parse(rawData.toString());
            statusCode === 200 
                ? callback(null, data) 
                : callback(new RJApiRequestError(`Request ended with code ${statusCode}`, { error: data, statusCode }));
        } catch (error) {
            callback(new RJApiRequestError(`Invalid received JSON. ${error.message}`, { error, statusCode }));
        }
    })

    res.on('error', (error) => {
        callback(new RJApiRequestError(error.message, { error, statusCode }));
    });
}

function buildRouteDetailOptions(routeId, fromStationId, toStationId) {
    const urlObject = Api.getUrlObject('routeDetail', {
        urlArguments: {
            routeId
        },
        query: {
            fromStationId,
            toStationId,
            routeId,
            tariffs: 'REGULAR'
        }
    });
    return {
        ...urlObject,
        headers: STATIC_HEADERS
    };
}

function buildRoutesSearchOptions(date, locationFrom, locationTo) {
    const urlObject = Api.getUrlObject('routeSearch', {
        query: {
            departureDate: date,
            tariffs: 'REGULAR',
            fromLocationId: locationFrom.id,
            fromLocationType: locationFrom.type,
            toLocationId: locationTo.id,
            toLocationType: locationTo.type
        }
    });
    return {
        ...urlObject,
        headers: STATIC_HEADERS
    };
}

function parsePriceClasses(priceClasses) {
    let message = '';
    priceClasses.forEach((priceClass) => {
        const { actionPrice, creditPrice, freeSeatsCount, price, seatClassKey } = priceClass;
        const classPrice = actionPrice || creditPrice || price;
        message += `\t ${CLASSES[seatClassKey]}, ${freeSeatsCount} free seats, ${classPrice},- Kc\n`;
    });

    return message;
}

module.exports = {
    getDestinations,
    getTrainRoutes,
    getRouteDetails
};