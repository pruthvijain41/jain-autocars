import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export const DEFAULT_SHOWROOM_INFO = {
    name: 'Jain Autocars',
    address: '480, Chithrabhanu Rd, Kuvempu Nagara,\nMysuru, Karnataka 570023',
    phone: '+91 99866 19282',
    email: 'crsurajjain@gmail.com',
    hoursText: 'Mon - Sat: 9:00 AM - 8:00 PM\nSun: 10:00 AM - 5:00 PM',
    mapEmbed: 'https://maps.google.com/maps?q=Jain+Autocars+Mysore&t=&z=15&ie=UTF8&iwloc=&output=embed',
    hours: null, // optional structured hours for openingHours util
    social: {
        facebook: '',
        instagram: '',
        whatsapp: '',
    },
};

// Singleton doc id we use for the shared showroom info.
export const SHOWROOM_INFO_DOC_ID = 'primary';

export const fetchShowroomInfo = async () => {
    try {
        const snap = await getDoc(doc(db, 'showroomInfo', SHOWROOM_INFO_DOC_ID));
        if (snap.exists()) {
            return { ...DEFAULT_SHOWROOM_INFO, ...snap.data() };
        }
    } catch (err) {
        console.error('Error fetching showroom info:', err);
    }
    return DEFAULT_SHOWROOM_INFO;
};
