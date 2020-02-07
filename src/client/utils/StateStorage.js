let storageKey;

class StateStorage {
    constructor(_storageKey) {
        storageKey = _storageKey;
    }

    load() {
        const jsonData = window.localStorage.getItem(storageKey);
        try {
            return JSON.parse(jsonData);
        } catch (e) {
            console.error('Failed to load state.');
        }
        return null;
    }

    save(data) {
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save state.');
        }
    }
}

export default new StateStorage('stateStorage');
