const request = (pathName, query) => {
    const controller = new AbortController();
    const url = new URL(pathName, window.location.origin);
    if (query instanceof Object) {
        Object.keys(query).forEach((key) => {
            url.searchParams.append(key, query[key]);
        });
    }
    let defaultOptions = { signal: controller.signal };
    const api = {
        abort: () => controller.abort(),
        usePost: (contentType = 'application/json') => {
            defaultOptions.method = 'POST';
            defaultOptions.headers = {
                'Content-Type': contentType
            };
            return api;
        },
        send: (fetchOptions) => fetch(url, { ...fetchOptions, ...defaultOptions }),
    };

    return api;
}

export default request;
