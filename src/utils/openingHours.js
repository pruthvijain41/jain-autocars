// Compute whether the showroom is currently open and when it next opens/closes.
// Hours are expressed in 24h "HH:MM" format.

const DEFAULT_HOURS = {
    // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    0: { open: '10:00', close: '17:00' },
    1: { open: '09:00', close: '20:00' },
    2: { open: '09:00', close: '20:00' },
    3: { open: '09:00', close: '20:00' },
    4: { open: '09:00', close: '20:00' },
    5: { open: '09:00', close: '20:00' },
    6: { open: '09:00', close: '20:00' },
};

const toMinutes = (hhmm) => {
    if (!hhmm || !hhmm.includes(':')) return null;
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
};

const formatTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
};

export const getShowroomStatus = (now = new Date(), hours = DEFAULT_HOURS) => {
    const day = now.getDay();
    const minsNow = now.getHours() * 60 + now.getMinutes();
    const today = hours[day];

    if (today) {
        const open = toMinutes(today.open);
        const close = toMinutes(today.close);
        if (open != null && close != null && minsNow >= open && minsNow < close) {
            return {
                isOpen: true,
                label: `Open now`,
                detail: `Closes at ${formatTime(close)}`,
            };
        }
        if (open != null && minsNow < open) {
            return {
                isOpen: false,
                label: 'Closed',
                detail: `Opens at ${formatTime(open)}`,
            };
        }
    }

    // Find next open day (could be tomorrow or later)
    for (let i = 1; i <= 7; i++) {
        const nextDay = (day + i) % 7;
        const nextHours = hours[nextDay];
        if (nextHours) {
            const open = toMinutes(nextHours.open);
            if (open != null) {
                const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][nextDay];
                return {
                    isOpen: false,
                    label: 'Closed',
                    detail: `Opens ${i === 1 ? 'tomorrow' : dayName} at ${formatTime(open)}`,
                };
            }
        }
    }

    return { isOpen: false, label: 'Closed', detail: null };
};
