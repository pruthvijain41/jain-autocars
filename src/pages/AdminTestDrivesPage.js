import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    collection, getDocs, query, doc, deleteDoc, updateDoc, orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import {
    Calendar, Phone, Mail, User, Trash2, CheckCircle, XCircle,
    ExternalLink, MessageCircle, Clock, MapPin, Timer, AlertTriangle,
    ArrowRight, List, CalendarDays, RotateCcw, Check,
} from 'lucide-react';

const TD_STATUS = {
    pending: { l: 'Pending', text: '#8a5a17', bg: 'rgba(180,120,30,0.16)', dot: '#b4781e' },
    confirmed: { l: 'Confirmed', text: '#2a4b7c', bg: 'rgba(42,75,124,0.14)', dot: '#2a4b7c' },
    completed: { l: 'Completed', text: '#1f6b46', bg: 'rgba(31,107,70,0.12)', dot: '#1f6b46' },
    cancelled: { l: 'Cancelled', text: '#8b1f1f', bg: 'rgba(139,31,31,0.10)', dot: '#8b1f1f' },
};

const STATUS_TABS = [
    { id: 'all', l: 'All', tone: '#0E0E0C' },
    { id: 'pending', l: 'Pending', tone: '#b4781e' },
    { id: 'confirmed', l: 'Confirmed', tone: '#2a4b7c' },
    { id: 'completed', l: 'Completed', tone: '#1f6b46' },
    { id: 'cancelled', l: 'Cancelled', tone: '#8b1f1f' },
];

const StatusPill = ({ status }) => {
    const s = TD_STATUS[status] || TD_STATUS.pending;
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium border whitespace-nowrap"
            style={{ background: s.bg, color: s.text, borderColor: `${s.dot}33` }}
        >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
            {s.l}
        </span>
    );
};

const parseBookingDate = (item) => {
    if (!item.date) return null;
    const timeStr = (item.timeSlot || '').trim();
    let h = 9, m = 0;
    if (timeStr) {
        const match = timeStr.match(/(\d+)(?::(\d+))?\s*(AM|PM)?/i);
        if (match) {
            h = parseInt(match[1], 10) || 0;
            m = parseInt(match[2], 10) || 0;
            const period = (match[3] || '').toUpperCase();
            if (period === 'PM' && h < 12) h += 12;
            if (period === 'AM' && h === 12) h = 0;
        }
    }
    try {
        const d = new Date(item.date + 'T00:00:00');
        d.setHours(h, m, 0, 0);
        return d;
    } catch (_) {
        return null;
    }
};

const fmtDateTime = (d) => {
    if (!d) return { day: '—', date: '—', time: '—' };
    return {
        day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        time: d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }),
    };
};

const isSameDay = (a, b) =>
    a && b &&
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

const isToday = (d) => isSameDay(d, new Date());
const isTomorrow = (d) => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return isSameDay(d, t);
};

const relDay = (d) => {
    if (!d) return null;
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return null;
};

const BookingCard = ({ item, onStatus, onDelete }) => {
    const when = parseBookingDate(item);
    const { day, date, time } = fmtDateTime(when);
    const rel = relDay(when);
    const status = item.status || 'pending';
    const phoneDigits = (item.phone || '').replace(/[^+\d]/g, '');
    const waNumber = phoneDigits.startsWith('+') ? phoneDigits.slice(1) : phoneDigits;
    const idShort = item.id ? `td-${item.id.slice(0, 8)}` : '';

    return (
        <article className="rounded-3xl border border-ink/10 bg-white p-5 md:p-7 shadow-[0_18px_50px_-30px_rgba(14,14,12,0.20)]">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                    <StatusPill status={status} />
                    <div className="flex items-center gap-2 text-[14px] flex-wrap">
                        <Clock size={14} className="text-ink-muted" />
                        <span className="font-medium num text-ink">{day}, {date}</span>
                        <span className="text-ink-faint">·</span>
                        <span className="font-medium num text-ink">{time}</span>
                        {rel && (
                            <span className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-champagne text-ink px-2 py-0.5 text-[10.5px] font-medium">
                                <span className="w-1 h-1 rounded-full bg-ink" />
                                {rel}
                            </span>
                        )}
                    </div>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">{idShort}</div>
            </div>

            <div className="mt-5 grid lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-4">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <User size={15} className="text-ink-muted" />
                            <span className="font-display text-[24px] leading-tight text-ink">
                                {item.name || 'Unknown'}
                            </span>
                        </div>
                        <div className="mt-1.5 flex items-center flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-ink-muted">
                            {item.phone && (
                                <span className="inline-flex items-center gap-1.5 num">
                                    <Phone size={12} /> {item.phone}
                                </span>
                            )}
                            {item.email && (
                                <span className="inline-flex items-center gap-1.5">
                                    <Mail size={12} /> {item.email}
                                </span>
                            )}
                        </div>
                    </div>

                    {item.carName && (
                        <div className="text-[14px]">
                            <span className="text-ink-muted">For:</span>{' '}
                            {item.carId ? (
                                <Link
                                    to={`/car/${item.carId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="link-u"
                                    style={{ color: '#2a4b7c' }}
                                >
                                    {item.carName}
                                </Link>
                            ) : (
                                <span className="text-ink">{item.carName}</span>
                            )}
                        </div>
                    )}

                    {(item.location || item.duration) && (
                        <div className="flex items-center flex-wrap gap-x-5 gap-y-2 text-[12.5px] text-ink-muted">
                            {item.location && (
                                <span className="inline-flex items-center gap-1.5">
                                    <MapPin size={12} /> {item.location}
                                </span>
                            )}
                            {item.duration && (
                                <span className="inline-flex items-center gap-1.5">
                                    <Timer size={12} /> {item.duration}
                                </span>
                            )}
                        </div>
                    )}

                    {item.notes && (
                        <div className="rounded-2xl bg-ivory-soft border border-ink/[0.08] px-4 py-3 text-[13px] leading-relaxed text-ink/80">
                            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint mb-1">
                                — Customer note
                            </div>
                            {item.notes}
                        </div>
                    )}
                </div>

                <div className="lg:col-span-4 flex lg:flex-col gap-2 flex-wrap content-start">
                    {phoneDigits && (
                        <a
                            href={`tel:${phoneDigits}`}
                            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded-full bg-ink text-ivory px-4 py-2.5 text-[13px] hover:bg-champagne-deep transition-colors whitespace-nowrap"
                        >
                            <Phone size={13} /> Call
                        </a>
                    )}
                    {waNumber && (
                        <a
                            href={`https://wa.me/${waNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded-full bg-[#0f7a3e] text-white px-4 py-2.5 text-[13px] hover:bg-[#0c6231] transition-colors whitespace-nowrap"
                        >
                            <MessageCircle size={13} /> WhatsApp
                        </a>
                    )}
                    {item.carId && (
                        <Link
                            to={`/car/${item.carId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-[13px] hover:opacity-90 transition-colors whitespace-nowrap"
                            style={{ borderColor: 'rgba(42,75,124,0.35)', color: '#2a4b7c' }}
                        >
                            <ExternalLink size={13} /> View car
                        </Link>
                    )}
                    {item.email && (
                        <a
                            href={`mailto:${item.email}`}
                            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 text-ink px-4 py-2.5 text-[13px] hover:bg-ink hover:text-ivory transition-colors whitespace-nowrap"
                        >
                            <Mail size={13} /> Email
                        </a>
                    )}
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-ink/10 flex items-center flex-wrap gap-2">
                {status === 'pending' && (
                    <>
                        <button
                            type="button"
                            onClick={() => onStatus('confirmed')}
                            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] border transition-colors whitespace-nowrap"
                            style={{ background: 'rgba(42,75,124,0.12)', color: '#2a4b7c', borderColor: 'rgba(42,75,124,0.30)' }}
                        >
                            <CheckCircle size={13} /> Confirm
                        </button>
                        <button
                            type="button"
                            onClick={() => onStatus('cancelled')}
                            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] border border-ink/15 text-ink-muted hover:bg-ink/5 transition-colors whitespace-nowrap"
                        >
                            <XCircle size={13} /> Cancel
                        </button>
                    </>
                )}
                {status === 'confirmed' && (
                    <>
                        <button
                            type="button"
                            onClick={() => onStatus('completed')}
                            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] border transition-colors whitespace-nowrap"
                            style={{ background: 'rgba(31,107,70,0.12)', color: '#1f6b46', borderColor: 'rgba(31,107,70,0.30)' }}
                        >
                            <CheckCircle size={13} /> Mark completed
                        </button>
                        <button
                            type="button"
                            onClick={() => onStatus('pending')}
                            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] border border-ink/15 text-ink-muted hover:bg-ink/5 transition-colors whitespace-nowrap"
                        >
                            <Calendar size={13} /> Reschedule
                        </button>
                        <button
                            type="button"
                            onClick={() => onStatus('cancelled')}
                            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] border border-ink/15 text-ink-muted hover:bg-ink/5 transition-colors whitespace-nowrap"
                        >
                            <XCircle size={13} /> Cancel
                        </button>
                    </>
                )}
                {status === 'completed' && (
                    <span className="inline-flex items-center gap-2 text-[12.5px] text-ink-muted">
                        <Check size={13} className="text-emerald-700" /> Completed · drive log saved
                    </span>
                )}
                {status === 'cancelled' && (
                    <button
                        type="button"
                        onClick={() => onStatus('pending')}
                        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] border border-ink/15 text-ink-muted hover:bg-ink/5 transition-colors whitespace-nowrap"
                    >
                        <RotateCcw size={13} /> Restore
                    </button>
                )}

                <button
                    type="button"
                    onClick={onDelete}
                    className="ml-auto inline-flex items-center gap-2 rounded-full border border-[#8b1f1f]/30 text-[#8b1f1f] px-4 py-2 text-[12.5px] hover:bg-[#8b1f1f] hover:text-white hover:border-[#8b1f1f] transition-colors whitespace-nowrap"
                >
                    <Trash2 size={13} /> Delete
                </button>
            </div>
        </article>
    );
};

const WeekStrip = ({ bookings }) => {
    const today = new Date();
    const start = new Date(today);
    const offset = (today.getDay() + 6) % 7;
    start.setDate(today.getDate() - offset);
    const days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const onThis = bookings.filter((b) => {
            const when = parseBookingDate(b);
            return when && isSameDay(when, d);
        });
        return { d, onThis };
    });

    return (
        <div className="rounded-2xl border border-ink/10 bg-white/55 overflow-hidden">
            <div className="grid grid-cols-7 divide-x divide-ink/10">
                {days.map(({ d, onThis }, i) => {
                    const dayN = d.toLocaleDateString('en-IN', { weekday: 'short' });
                    const dayD = d.getDate();
                    const tdy = isToday(d);
                    return (
                        <div key={i} className={`p-3 ${tdy ? 'bg-ivory-soft/70' : ''}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-faint">
                                        {dayN}
                                    </div>
                                    <div className={`font-display text-[22px] leading-none num mt-0.5 ${tdy ? 'text-champagne-deep' : 'text-ink'}`}>
                                        {String(dayD).padStart(2, '0')}
                                    </div>
                                </div>
                                {onThis.length > 0 && (
                                    <span className="num text-[10.5px] rounded-full bg-ink text-ivory px-1.5 py-0.5">
                                        {onThis.length}
                                    </span>
                                )}
                            </div>
                            <div className="mt-2 space-y-1 min-h-[44px]">
                                {onThis.slice(0, 2).map((b) => {
                                    const when = parseBookingDate(b);
                                    return (
                                        <div key={b.id} className="text-[10.5px] truncate text-ink-muted">
                                            <span className="num">
                                                {when ? when.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '—'}
                                            </span>
                                            {' · '}
                                            {(b.name || '?').split(' ')[0]}
                                        </div>
                                    );
                                })}
                                {onThis.length > 2 && (
                                    <div className="text-[10.5px] text-ink-faint">+ {onThis.length - 2} more</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const AdminTestDrivesPage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [view, setView] = useState('list');

    const fetchItems = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const snap = await getDocs(query(collection(db, 'testDrives'), orderBy('createdAt', 'desc')));
            setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error('Error fetching test drives:', err);
            setError('Could not load test drive bookings.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchItems(); }, [fetchItems]);

    const handleUpdateStatus = async (id, status) => {
        const previous = items;
        setItems(items.map((i) => (i.id === id ? { ...i, status } : i)));
        try {
            await updateDoc(doc(db, 'testDrives', id), { status });
        } catch (err) {
            console.error('Error updating test drive status:', err);
            setError('Could not update status.');
            setItems(previous);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this booking?')) return;
        try {
            await deleteDoc(doc(db, 'testDrives', id));
            setItems((prev) => prev.filter((i) => i.id !== id));
        } catch (err) {
            setError('Could not delete booking.');
        }
    };

    const counts = useMemo(
        () => ({
            all: items.length,
            pending: items.filter((i) => (i.status || 'pending') === 'pending').length,
            confirmed: items.filter((i) => i.status === 'confirmed').length,
            completed: items.filter((i) => i.status === 'completed').length,
            cancelled: items.filter((i) => i.status === 'cancelled').length,
        }),
        [items]
    );

    const filtered = useMemo(() => {
        let list = statusFilter === 'all'
            ? items.slice()
            : items.filter((i) => (i.status || 'pending') === statusFilter);
        list.sort((a, b) => {
            const da = parseBookingDate(a)?.getTime() || 0;
            const dbt = parseBookingDate(b)?.getTime() || 0;
            return da - dbt;
        });
        return list;
    }, [items, statusFilter]);

    return (
        <div className="px-4 lg:px-8 py-6 lg:py-10">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-faint">
                        — This week ·{' '}
                        <span className="num">{counts.pending + counts.confirmed}</span> upcoming
                    </div>
                    <h1 className="font-display text-[44px] md:text-[64px] leading-[0.95] tracking-tightest mt-2 text-ink">
                        Test drive <em className="italic text-champagne">bookings.</em>
                    </h1>
                    <p className="mt-2 text-[14px] text-ink-muted max-w-xl">
                        Confirm, reschedule, or cancel customer test drives. Pending bookings auto-expire after 24 hours
                        without a response — please action them in priority.
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start">
                    <div className="inline-flex items-center rounded-full border border-ink/15 bg-white/60 p-1">
                        {[
                            { id: 'list', l: 'List', icon: List },
                            { id: 'week', l: 'Week', icon: CalendarDays },
                        ].map((o) => {
                            const on = view === o.id;
                            const Icon = o.icon;
                            return (
                                <button
                                    key={o.id}
                                    type="button"
                                    onClick={() => setView(o.id)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] whitespace-nowrap transition-colors ${on ? 'bg-ink text-ivory' : 'text-ink'}`}
                                >
                                    <Icon size={12} /> {o.l}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {counts.pending > 0 && (
                <div
                    className="mt-7 rounded-2xl border p-4 md:p-5 flex items-start gap-4 flex-wrap"
                    style={{ background: 'rgba(180,120,30,0.10)', borderColor: 'rgba(180,120,30,0.25)' }}
                >
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(255,255,255,0.6)', color: '#8a5a17', border: '1px solid rgba(180,120,30,0.30)' }}
                    >
                        <AlertTriangle size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="font-display text-[22px] leading-tight text-ink">
                            {counts.pending} test drive{counts.pending > 1 ? 's' : ''} awaiting your confirmation.
                        </div>
                        <div className="text-[12.5px] text-ink-muted mt-1">
                            Customers expect a response within two hours. Tap "Confirm" on the card to update the
                            booking.
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setStatusFilter('pending')}
                        className="inline-flex items-center gap-2 rounded-full bg-ink text-ivory px-4 py-2 text-[12.5px] hover:bg-champagne-deep transition-colors whitespace-nowrap"
                    >
                        Review queue <ArrowRight size={13} />
                    </button>
                </div>
            )}

            <div className="mt-7 flex items-center gap-2 flex-wrap">
                {STATUS_TABS.map((t) => {
                    const on = statusFilter === t.id;
                    const n = counts[t.id] ?? 0;
                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setStatusFilter(t.id)}
                            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12.5px] whitespace-nowrap transition-colors ${on ? 'bg-ink text-ivory border-ink' : 'border-ink/15 text-ink hover:border-ink/40 bg-white/40'}`}
                        >
                            {t.l}
                            <span
                                className="num text-[10.5px] px-1.5 py-0.5 rounded-full"
                                style={{
                                    background: on ? 'rgba(255,255,255,0.18)' : `${t.tone}15`,
                                    color: on ? '#fff' : t.tone,
                                }}
                            >
                                {n}
                            </span>
                        </button>
                    );
                })}
            </div>

            {view === 'week' && (
                <div className="mt-6">
                    <WeekStrip bookings={items} />
                </div>
            )}

            {error && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-[13px]">
                    {error}
                </div>
            )}

            <div className="mt-6 space-y-4">
                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin w-8 h-8 border-4 border-ink border-t-transparent rounded-full mx-auto" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-2xl border border-ink/10 bg-white/60 py-20 px-8 text-center">
                        <div className="mx-auto w-12 h-12 rounded-full border border-ink/15 flex items-center justify-center text-ink-muted">
                            <Calendar size={14} />
                        </div>
                        <div className="font-display text-[28px] leading-tight mt-4 text-ink">
                            No bookings <em className="italic text-champagne">match.</em>
                        </div>
                        <div className="text-[13px] text-ink-muted mt-1">
                            {items.length === 0
                                ? 'No test drive bookings yet.'
                                : 'Try a different status filter.'}
                        </div>
                    </div>
                ) : (
                    filtered.map((item) => (
                        <BookingCard
                            key={item.id}
                            item={item}
                            onStatus={(s) => handleUpdateStatus(item.id, s)}
                            onDelete={() => handleDelete(item.id)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminTestDrivesPage;
