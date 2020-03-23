function expressError(response, data) {
    if (!(data instanceof Object)) {
        data = { error: { message: data } };
    }
    data.statusCode = data.statusCode || 500;
    response.status(data.statusCode).send({ status: 'ERROR', data });
}

module.exports = expressError;
