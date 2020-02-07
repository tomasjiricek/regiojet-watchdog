export const API_URL = {
    DESTINATIONS: '/api/destinations',
    ROUTE_SEARCH: '/api/route/search',
    ROUTE_DETAIL: '/api/route/',
};

export const CLASSES = {
    C0: 'Standard',
    C1: 'Relax',
    C2: 'Business',
    TRAIN_LOW_COST: 'Low cost'
};


export const GMT_TIMEZONE = new Date().toTimeString().replace(/.*GMT([\+\-][0-9]{2})([0-9]{2}).*/, '$1:$2');
