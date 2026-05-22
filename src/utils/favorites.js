// localStorage helpers for buyer-side persistence.
// Two lists: favorites (heart) and compare bin.

const FAVORITES_KEY = 'jain:favorites';
const COMPARE_KEY = 'jain:compare';
const COMPARE_MAX = 3;

const readList = (key) => {
    try {
        const v = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(v) ? v : [];
    } catch (_) {
        return [];
    }
};

const writeList = (key, list) => {
    try { localStorage.setItem(key, JSON.stringify(list)); } catch (_) { /* ignore */ }
    // Fire a storage event for other tabs / listeners
    try { window.dispatchEvent(new CustomEvent('jain:storage', { detail: { key } })); } catch (_) { /* ignore */ }
};

export const getFavorites = () => readList(FAVORITES_KEY);
export const isFavorite = (carId) => getFavorites().includes(carId);
export const toggleFavorite = (carId) => {
    const cur = getFavorites();
    const next = cur.includes(carId) ? cur.filter(id => id !== carId) : [carId, ...cur];
    writeList(FAVORITES_KEY, next);
    return next.includes(carId);
};

export const getCompare = () => readList(COMPARE_KEY);
export const isInCompare = (carId) => getCompare().includes(carId);
export const toggleCompare = (carId) => {
    const cur = getCompare();
    if (cur.includes(carId)) {
        writeList(COMPARE_KEY, cur.filter(id => id !== carId));
        return false;
    }
    if (cur.length >= COMPARE_MAX) {
        return null; // signal max reached
    }
    writeList(COMPARE_KEY, [...cur, carId]);
    return true;
};
export const clearCompare = () => writeList(COMPARE_KEY, []);
export const clearFavorites = () => writeList(FAVORITES_KEY, []);
export const COMPARE_LIMIT = COMPARE_MAX;
