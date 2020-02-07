const request = (pathName, query) => {
    const url = new URL(pathName, window.location.origin);
    if (query !== null) {
        Object.keys(query).forEach((key) => {
            url.searchParams.append(key, query[key]);
        });
    }
    return fetch(url);
}

export default request;
