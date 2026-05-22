import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import {
    Car, MessageSquare, Star, Calendar, Eye, BadgeCheck,
    ArrowRight, ArrowUpRight, AlertCircle, Download,
    Plus, Upload, FileText, Users,
} from 'lucide-react';

const TONES = {
    champagne: { icon: '#B8956A', icon_bg: 'rgba(184,149,106,0.12)', bar: '#B8956A', label_color: '#9A7748' },
    ok: { icon: '#1f6b46', icon_bg: 'rgba(31,107,70,0.10)', bar: '#1f6b46', label_color: '#1f6b46' },
    info: { icon: '#2a4b7c', icon_bg: 'rgba(42,75,124,0.10)', bar: '#2a4b7c', label_color: '#2a4b7c' },
    warn: { icon: '#8a5a17', icon_bg: 'rgba(180,120,30,0.12)', bar: '#b4781e', label_color: '#8a5a17' },
    alert: { icon: '#8b1f1f', icon_bg: 'rgba(139,31,31,0.10)', bar: '#8b1f1f', label_color: '#8b1f1f' },
    muted: { icon: '#5C5A52', icon_bg: 'rgba(14,14,12,0.06)', bar: '#5C5A52', label_color: '#5C5A52' },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const RANGES = [
    { id: '1', label: 'Today', days: 1 },
    { id: '7', label: '7 days', days: 7 },
    { id: '30', label: '30 days', days: 30 },
    { id: 'ytd', label: 'YTD', days: null },
];

const Eyebrow = ({ children, dark = false }) => (
    <div className={`font-mono text-[10.5px] uppercase tracking-[0.2em] ${dark ? 'text-ivory/55' : 'text-ink-faint'}`}>
        — {children}
    </div>
);

const KPICard = ({ k, href }) => {
    const t = TONES[k.tone];
    const Icon = k.icon;
    const Wrap = href ? Link : 'button';
    const wrapProps = href ? { to: href } : { type: 'button' };
    return (
        <Wrap
            {...wrapProps}
            className="group lift relative block text-left rounded-3xl border border-ink/10 bg-white/65 p-6 overflow-hidden w-full"
        >
            <div className="absolute top-0 left-0 h-full w-[3px]" style={{ background: t.bar }} />
            <div className="flex items-start justify-between">
                <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: t.icon_bg, color: t.icon }}
                >
                    <Icon size={17} />
                </div>
                <div className="w-8 h-8 rounded-full border border-ink/10 flex items-center justify-center text-ink-muted group-hover:bg-ink group-hover:text-ivory group-hover:border-ink transition-colors">
                    <ArrowRight size={13} />
                </div>
            </div>
            <div className="mt-6 flex items-baseline gap-2 flex-wrap">
                <div className="font-display text-[56px] sm:text-[72px] leading-none tracking-tightest num text-ink">
                    {k.num}
                </div>
                {k.delta && (
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: t.label_color }}>
                        {k.delta}
                    </div>
                )}
            </div>
            <div className="mt-2 text-[14px] font-medium text-ink">{k.title}</div>
            <div className="text-[12.5px] text-ink-muted mt-0.5">{k.sub}</div>
        </Wrap>
    );
};

const Banner = ({ tone, icon: Icon, title, body, action }) => {
    const t = TONES[tone];
    return (
        <div
            className="rounded-3xl border p-5 md:p-6 flex items-start gap-5 flex-wrap"
            style={{ background: t.icon_bg, borderColor: 'rgba(14,14,12,0.10)' }}
        >
            <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.6)', color: t.icon, border: `1px solid ${t.bar}33` }}
            >
                <Icon size={17} />
            </div>
            <div className="min-w-0 flex-1">
                <div className="font-display text-[24px] md:text-[28px] leading-tight text-ink">{title}</div>
                <p className="text-[13.5px] text-ink-muted leading-relaxed mt-1.5 max-w-2xl">{body}</p>
            </div>
            {action}
        </div>
    );
};

const ListCard = ({ kicker, title, italic, icon: Icon, action, children }) => (
    <section className="rounded-3xl border border-ink/10 bg-white/55 p-6 md:p-7">
        <div className="flex items-end justify-between flex-wrap gap-3">
            <div>
                <Eyebrow>{kicker}</Eyebrow>
                <h3 className="font-display text-[26px] md:text-[32px] leading-tight tracking-tightest mt-2 flex items-center gap-2 text-ink">
                    {Icon && <Icon size={18} className="text-champagne-deep" />}
                    {title} {italic && <em className="italic text-champagne not-italic-fallback" style={{ fontStyle: 'italic' }}>{italic}</em>}
                </h3>
            </div>
            {action}
        </div>
        <div className="mt-5 divide-y divide-ink/10">{children}</div>
    </section>
);

const CarRow = ({ car, idx }) => {
    const tone = '#1c1c19';
    return (
        <Link
            to={`/car/${car.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 py-3.5 hover:bg-ivory-soft/60 rounded-lg -mx-2 px-2 transition-colors"
        >
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint num shrink-0 w-6">
                {String(idx + 1).padStart(2, '0')}
            </span>
            <div
                className="w-14 h-14 rounded-xl overflow-hidden shrink-0 relative"
                style={{ background: `repeating-linear-gradient(135deg, ${tone} 0 8px, #1c1c19 8px 16px)` }}
            >
                {car.imageUrls?.[0] ? (
                    <img src={car.imageUrls[0]} alt={car.model} className="w-full h-full object-cover" />
                ) : (
                    <div className="absolute inset-0 flex items-end justify-start p-1.5">
                        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-champagne/70">
                            {car.make}
                        </span>
                    </div>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-[14px] truncate text-ink">
                    {car.make} <span className="text-ink-muted">·</span> {car.model}
                </div>
                <div className="text-[11.5px] text-ink-muted num mt-0.5">
                    ₹{(Number(car.price || 0) / 100000).toFixed(2)}L · listing #{car.id.slice(-6)}
                </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[12px] text-ink-muted shrink-0">
                <Eye size={12} /> <span className="num">{car.views || 0}</span>
            </div>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-muted">
                <ArrowUpRight size={13} />
            </span>
        </Link>
    );
};

const InquiryRow = ({ inq }) => {
    const initial = (inq.name || '?').charAt(0).toUpperCase();
    const ts = inq.createdAt?.seconds || inq.submittedAt?.seconds;
    const when = ts ? relativeTime(ts * 1000) : '';
    const fresh = (inq.status || 'new') === 'new';
    return (
        <Link
            to="/admin/inquiries"
            className="group flex items-start gap-3 py-3.5 hover:bg-ivory-soft/60 rounded-lg -mx-2 px-2 transition-colors"
        >
            <div className="w-10 h-10 rounded-full bg-ink text-ivory font-display text-[16px] flex items-center justify-center shrink-0">
                {initial}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-medium text-ink">{inq.name || 'Unknown'}</span>
                    {fresh && (
                        <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] px-1.5 py-0.5 rounded bg-[#b4781e]/15 text-[#8a5a17] border border-[#b4781e]/25">
                            New
                        </span>
                    )}
                    {when && (
                        <span className="ml-auto text-[11.5px] text-ink-faint num shrink-0">{when}</span>
                    )}
                </div>
                <p className="text-[13px] text-ink-muted leading-snug mt-1 line-clamp-2">{inq.message}</p>
            </div>
        </Link>
    );
};

function relativeTime(ms) {
    const diff = Date.now() - ms;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return new Date(ms).toLocaleDateString();
}

const ActivityChart = ({ inquiriesSeries, drivesSeries }) => {
    const W = 760, H = 200, P = 24;
    const inq = inquiriesSeries;
    const td = drivesSeries;
    const max = Math.max(1, ...inq, ...td) + 2;
    const x = (i) => P + (i * (W - P * 2) / Math.max(1, inq.length - 1));
    const y = (v) => H - P - (v / max) * (H - P * 2);
    const path = (arr) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');
    const area = (arr) => `${path(arr)} L ${x(arr.length - 1)} ${H - P} L ${x(0)} ${H - P} Z`;
    return (
        <div className="mt-5 -mx-2">
            <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full h-auto">
                <defs>
                    <linearGradient id="inqFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#0E0E0C" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#0E0E0C" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {[0, 1, 2, 3].map((i) => (
                    <line
                        key={i}
                        x1={P}
                        x2={W - P}
                        y1={P + i * ((H - P * 2) / 3)}
                        y2={P + i * ((H - P * 2) / 3)}
                        stroke="#0E0E0C"
                        strokeOpacity="0.08"
                    />
                ))}
                <path d={area(inq)} fill="url(#inqFill)" />
                <path d={path(inq)} fill="none" stroke="#0E0E0C" strokeWidth="2" />
                <path d={path(td)} fill="none" stroke="#B8956A" strokeWidth="2" strokeDasharray="3 4" />
                <circle cx={x(inq.length - 1)} cy={y(inq[inq.length - 1] || 0)} r="4" fill="#0E0E0C" />
                <circle cx={x(td.length - 1)} cy={y(td[td.length - 1] || 0)} r="4" fill="#B8956A" />
                {Array.from({ length: 7 }).map((_, i) => {
                    const idx = Math.floor(i * (inq.length - 1) / 6);
                    const d = new Date();
                    d.setDate(d.getDate() - (inq.length - 1 - idx));
                    return (
                        <text
                            key={i}
                            x={x(idx)}
                            y={H + 14}
                            fontSize="9"
                            fontFamily="Geist Mono, ui-monospace"
                            fill="#8A8678"
                            textAnchor="middle"
                        >
                            {DAYS[d.getDay()]}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
};

const exportCarsCsv = (cars) => {
    const escapeCsv = (v) => {
        if (v == null) return '';
        const s = String(v);
        if (s.includes('"') || s.includes(',') || s.includes('\n')) {
            return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
    };
    const headers = ['id', 'make', 'model', 'year', 'price', 'status', 'fuelType', 'transmission', 'kilometers', 'views'];
    const rows = [headers.join(',')].concat(
        cars.map((c) => headers.map((h) => escapeCsv(c[h] ?? c[h === 'kilometers' ? 'mileage' : ''])).join(','))
    );
    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cars-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
};

const AdminDashboardPage = () => {
    const [cars, setCars] = useState([]);
    const [inquiries, setInquiries] = useState([]);
    const [testimonials, setTestimonials] = useState([]);
    const [testDrives, setTestDrives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rangeId, setRangeId] = useState('7');
    const [user, setUser] = useState(null);
    const [now, setNow] = useState(new Date());
    const navigate = useNavigate();

    useEffect(() => {
        const unsubAuth = auth.onAuthStateChanged((u) => setUser(u));
        return () => unsubAuth();
    }, []);

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [carsSnap, inquiriesSnap, testimonialsSnap, testDrivesSnap] = await Promise.all([
                    getDocs(collection(db, 'cars')),
                    getDocs(query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'), limit(100))).catch(() =>
                        getDocs(query(collection(db, 'inquiries'), orderBy('submittedAt', 'desc'), limit(100)))
                    ),
                    getDocs(collection(db, 'testimonials')),
                    getDocs(collection(db, 'testDrives')).catch(() => ({ docs: [] })),
                ]);

                setCars(carsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
                setInquiries(inquiriesSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
                setTestimonials(testimonialsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
                setTestDrives((testDrivesSnap.docs || []).map((d) => ({ id: d.id, ...d.data() })));
            } catch (err) {
                console.error('Dashboard data error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const range = useMemo(() => RANGES.find((r) => r.id === rangeId) || RANGES[1], [rangeId]);

    const stats = useMemo(() => {
        const nowMs = Date.now();
        const cutoff = (() => {
            if (range.days != null) return nowMs - range.days * 24 * 60 * 60 * 1000;
            return new Date(new Date().getFullYear(), 0, 1).getTime();
        })();

        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() / 1000;
        const soldThisMonth = cars.filter(
            (c) => c.status === 'Sold' && (c.createdAt?.seconds || 0) >= monthStart
        ).length;

        const newInquiries = inquiries.filter((i) => {
            const ts = (i.createdAt?.seconds || i.submittedAt?.seconds || 0) * 1000;
            return (i.status || 'new') === 'new' && ts >= cutoff;
        }).length;

        const totalInquiriesAll = inquiries.length;
        const inquiryDeltas = (() => {
            const since = inquiries.filter((i) => {
                const ts = (i.createdAt?.seconds || i.submittedAt?.seconds || 0) * 1000;
                return ts >= cutoff;
            }).length;
            const priorCutoff = cutoff - (nowMs - cutoff);
            const priorCount = inquiries.filter((i) => {
                const ts = (i.createdAt?.seconds || i.submittedAt?.seconds || 0) * 1000;
                return ts >= priorCutoff && ts < cutoff;
            }).length;
            if (!priorCount) return since ? '+ new' : null;
            const pct = Math.round(((since - priorCount) / priorCount) * 100);
            return `${pct >= 0 ? '+' : ''}${pct}% vs prev.`;
        })();

        return {
            totalCars: cars.length,
            available: cars.filter((c) => (c.status || 'Available') === 'Available').length,
            sold: cars.filter((c) => c.status === 'Sold').length,
            soldThisMonth,
            newInquiries,
            inquiryDeltas,
            pendingTestimonials: testimonials.filter((t) => !t.approved).length,
            pendingTestDrives: testDrives.filter((t) => (t.status || 'pending') === 'pending').length,
            totalInquiriesAll,
        };
    }, [cars, inquiries, testimonials, testDrives, range]);

    const topViewed = useMemo(
        () =>
            cars
                .filter((c) => c.status !== 'Sold' && (c.views || 0) > 0)
                .sort((a, b) => (b.views || 0) - (a.views || 0))
                .slice(0, 5),
        [cars]
    );

    const recentInquiries = useMemo(() => inquiries.slice(0, 5), [inquiries]);

    const activitySeries = useMemo(() => {
        const days = Math.min(Math.max(range.days || 30, 7), 30);
        const buckets = Array.from({ length: days }, () => ({ inq: 0, td: 0 }));
        const startMs = Date.now() - days * 24 * 60 * 60 * 1000;
        inquiries.forEach((i) => {
            const ts = (i.createdAt?.seconds || i.submittedAt?.seconds || 0) * 1000;
            if (ts >= startMs) {
                const idx = Math.floor((ts - startMs) / (24 * 60 * 60 * 1000));
                if (idx >= 0 && idx < days) buckets[idx].inq += 1;
            }
        });
        testDrives.forEach((d) => {
            const ts = (d.createdAt?.seconds || d.submittedAt?.seconds || 0) * 1000;
            if (ts >= startMs) {
                const idx = Math.floor((ts - startMs) / (24 * 60 * 60 * 1000));
                if (idx >= 0 && idx < days) buckets[idx].td += 1;
            }
        });
        return {
            inquiriesSeries: buckets.map((b) => b.inq),
            drivesSeries: buckets.map((b) => b.td),
        };
    }, [inquiries, testDrives, range]);

    const greeting = (() => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    })();

    const firstName = (user?.displayName || user?.email?.split('@')[0] || 'Admin').split(' ')[0];

    const KPI = [
        {
            id: 'avail',
            icon: Car,
            num: stats.available,
            title: 'Cars available',
            sub: `${stats.totalCars} total in inventory`,
            tone: 'champagne',
            delta: stats.totalCars > 0 ? `${stats.totalCars - stats.available} sold/reserved` : null,
            href: '/admin/cars',
        },
        {
            id: 'sold',
            icon: BadgeCheck,
            num: stats.soldThisMonth,
            title: 'Sold this month',
            sub: `${stats.sold} total sold`,
            tone: 'ok',
            delta: null,
            href: '/admin/cars',
        },
        {
            id: 'inq',
            icon: MessageSquare,
            num: stats.newInquiries,
            title: `New inquiries (${range.label.toLowerCase()})`,
            sub: 'awaiting first response',
            tone: 'info',
            delta: stats.inquiryDeltas,
            href: '/admin/inquiries',
        },
        {
            id: 'rev',
            icon: Star,
            num: stats.pendingTestimonials,
            title: 'Pending testimonials',
            sub: 'awaiting moderation',
            tone: 'warn',
            delta: null,
            href: '/admin/testimonials',
        },
    ];

    const quickActions = [
        { i: Plus, l: 'Add new car', to: '/admin/cars?new=1' },
        { i: Upload, l: 'Upload photos', to: '/admin/cars' },
        { i: Calendar, l: 'Schedule drive', to: '/admin/test-drives' },
        { i: Star, l: 'Moderate reviews', to: '/admin/testimonials' },
        { i: FileText, l: 'View inquiries', to: '/admin/inquiries' },
        { i: Users, l: 'Showroom info', to: '/admin/settings' },
    ];

    return (
        <div className="px-4 lg:px-8 py-6 lg:py-10">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                    <Eyebrow>{greeting}, {firstName}</Eyebrow>
                    <h1 className="font-display text-[44px] md:text-[64px] leading-[0.95] tracking-tightest mt-2 text-ink">
                        Dashboard.
                    </h1>
                    <p className="mt-2 text-[14px] text-ink-muted max-w-xl">
                        Snapshot of inventory, inquiries, and activity. Updated{' '}
                        <span className="num">
                            {now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                        </span>{' '}
                        · auto-refreshing every minute.
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {RANGES.map((b) => {
                        const on = rangeId === b.id;
                        return (
                            <button
                                key={b.id}
                                type="button"
                                onClick={() => setRangeId(b.id)}
                                className={`px-3.5 py-2 rounded-full text-[12.5px] border transition-colors ${
                                    on ? 'bg-ink text-ivory border-ink' : 'border-ink/15 text-ink hover:border-ink/40'
                                }`}
                            >
                                {b.label}
                            </button>
                        );
                    })}
                    <button
                        type="button"
                        onClick={() => exportCarsCsv(cars)}
                        disabled={!cars.length}
                        className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3.5 py-2 text-[12.5px] text-ink hover:bg-ink hover:text-ivory transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={13} /> Export
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin w-8 h-8 border-4 border-ink border-t-transparent rounded-full mx-auto" />
                </div>
            ) : (
                <>
                    <div className="mt-8 grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        {KPI.map((k) => (
                            <KPICard key={k.id} k={k} href={k.href} />
                        ))}
                    </div>

                    {stats.pendingTestDrives > 0 && (
                        <div className="mt-6">
                            <Banner
                                tone="warn"
                                icon={Calendar}
                                title={`${stats.pendingTestDrives} test drive ${stats.pendingTestDrives === 1 ? 'request' : 'requests'} awaiting confirmation.`}
                                body="Confirm or reschedule with customers. Quick responses keep momentum and avoid lost leads."
                                action={
                                    <button
                                        type="button"
                                        onClick={() => navigate('/admin/test-drives')}
                                        className="inline-flex items-center gap-2 rounded-full bg-ink text-ivory px-4 py-2 text-[13px] hover:bg-champagne-deep transition-colors"
                                    >
                                        Review queue <ArrowRight size={13} />
                                    </button>
                                }
                            />
                        </div>
                    )}

                    <div className="mt-6 grid lg:grid-cols-2 gap-4">
                        <ListCard
                            kicker={`Engagement · ${range.label.toLowerCase()}`}
                            title="Top viewed"
                            italic="cars."
                            icon={Eye}
                            action={
                                <Link to="/admin/cars" className="link-u text-[12.5px] inline-flex items-center gap-1.5 text-ink">
                                    View all <ArrowUpRight size={12} />
                                </Link>
                            }
                        >
                            {topViewed.length === 0 ? (
                                <div className="py-8 text-center text-[13px] text-ink-muted">No view data yet.</div>
                            ) : (
                                topViewed.map((c, i) => <CarRow key={c.id} car={c} idx={i} />)
                            )}
                        </ListCard>

                        <ListCard
                            kicker="Just in"
                            title="Recent"
                            italic="inquiries."
                            icon={MessageSquare}
                            action={
                                <Link to="/admin/inquiries" className="link-u text-[12.5px] inline-flex items-center gap-1.5 text-ink">
                                    View all <ArrowUpRight size={12} />
                                </Link>
                            }
                        >
                            {recentInquiries.length === 0 ? (
                                <div className="py-8 text-center text-[13px] text-ink-muted">No inquiries yet.</div>
                            ) : (
                                recentInquiries.map((q) => <InquiryRow key={q.id} inq={q} />)
                            )}
                        </ListCard>
                    </div>

                    <div className="mt-6 grid lg:grid-cols-3 gap-4">
                        <section className="lg:col-span-2 rounded-3xl border border-ink/10 bg-white/55 p-6 md:p-7">
                            <div className="flex items-end justify-between flex-wrap gap-3">
                                <div>
                                    <Eyebrow>This {range.label.toLowerCase()}</Eyebrow>
                                    <h3 className="font-display text-[26px] md:text-[32px] leading-tight tracking-tightest mt-2 text-ink">
                                        Activity <em className="italic text-champagne">at a glance.</em>
                                    </h3>
                                </div>
                                <div className="flex items-center gap-3 text-[11.5px] font-mono uppercase tracking-[0.16em] text-ink-faint">
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-ink" /> Inquiries
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-champagne" /> Test drives
                                    </span>
                                </div>
                            </div>
                            <ActivityChart {...activitySeries} />
                        </section>

                        <section className="rounded-3xl border border-ink/10 bg-ink text-ivory p-6 md:p-7 flex flex-col">
                            <Eyebrow dark>Shortcuts</Eyebrow>
                            <h3 className="font-display text-[26px] md:text-[32px] leading-tight tracking-tightest mt-2">
                                Quick <em className="italic text-champagne">actions.</em>
                            </h3>
                            <div className="mt-5 grid grid-cols-2 gap-2.5 flex-1 content-start">
                                {quickActions.map((a) => {
                                    const Icon = a.i;
                                    return (
                                        <Link
                                            key={a.l}
                                            to={a.to}
                                            className="rounded-2xl border border-ivory/15 bg-ivory/5 hover:bg-ivory hover:text-ink px-3.5 py-3 text-[13px] text-left transition-colors flex items-center gap-2"
                                        >
                                            <Icon size={13} /> {a.l}
                                        </Link>
                                    );
                                })}
                            </div>
                            <div className="mt-5 pt-5 border-t border-ivory/10 text-[11.5px] text-ivory/55">
                                Tip — use the search box in the sidebar to jump to cars or inquiries fast.
                            </div>
                        </section>
                    </div>

                    {stats.totalCars > 0 && stats.available === 0 && (
                        <div className="mt-6">
                            <Banner
                                tone="alert"
                                icon={AlertCircle}
                                title="No cars available."
                                body="All cars are sold or reserved. Add new inventory to keep the site fresh — customer engagement drops sharply after 48 hours of stale listings."
                                action={
                                    <Link
                                        to="/admin/cars?new=1"
                                        className="inline-flex items-center gap-2 rounded-full bg-ink text-ivory px-4 py-2 text-[13px] hover:bg-champagne-deep transition-colors"
                                    >
                                        Add inventory <Plus size={13} />
                                    </Link>
                                }
                            />
                        </div>
                    )}

                    <div className="mt-10 text-center text-[11.5px] text-ink-faint font-mono uppercase tracking-[0.2em]">
                        End of feed · last sync{' '}
                        {now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminDashboardPage;
