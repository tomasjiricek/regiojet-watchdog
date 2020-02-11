const request = (pathName, query) => {
    const controller = new AbortController();
    const url = new URL(pathName, window.location.origin);
    if (query instanceof Object) {
        Object.keys(query).forEach((key) => {
            url.searchParams.append(key, query[key]);
        });
    }
    return {
        abort: () => controller.abort(),
        send: (fetchOptions) => fetch(url, { ...fetchOptions, signal: controller.signal })
    };
}

export default request;
