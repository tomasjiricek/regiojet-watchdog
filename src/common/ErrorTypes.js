class ApiError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor)
    }
}

class RJApiRequestError extends ApiError {
    constructor(message, httpDetails) {
        super(message);
        this.name = this.constructor.name;
        this.httpDetails = httpDetails;
        Error.captureStackTrace(this, this.constructor)
    }
}

class WatchdogError extends ApiError {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor)
    }
}

module.exports = {
    ApiError,
    RJApiRequestError,
    WatchdogError
};