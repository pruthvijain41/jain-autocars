import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { Helmet } from 'react-helmet';
import { ArrowLeft, GitCompareArrows, X, Trash2, ArrowRight } from 'lucide-react';
import { getCompare, clearCompare, toggleCompare } from '../utils/favorites';

const SPECS = [
    { key: 'price', label: 'Price', highlight: true, format: (v) => v != null ? `₹${Number(v).toLocaleString('en-IN')}` : '—' },
    { key: 'year', label: 'Year' },
    { key: 'kmComputed', label: 'KM Driven', format: (v) => v != null ? `${Number(v).toLocaleString('en-IN')} km` : '—' },
    { key: 'fuelType', label: 'Fuel' },
    { key: 'transmission', label: 'Transmission' },
    { key: 'engineSize', label: 'Engine' },
    { key: 'bodyType', label: 'Body type' },
    { key: 'owner', label: 'Ownership' },
    { key: 'exteriorColor', label: 'Color' },
    { key: 'registrationState', label: 'Registration' },
    { key: 'insurance', label: 'Insurance' },
];

const ComparePage = () => {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);

    const refresh = async () => {
        const ids = getCompare();
        if (ids.length === 0) {
            setCars([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const docs = await Promise.all(
                ids.map(id => getDoc(doc(db, 'cars', id)).catch(() => null))
            );
            const data = docs
                .filter(d => d && d.exists())
                .map(d => {
                    const car = { id: d.id, ...d.data() };
                    car.kmComputed = car.kilometers ?? car.mileage;
                    return car;
                });
            setCars(data);
        } catch (err) {
            console.error('Error loading compare cars:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
        const handler = () => refresh();
        window.addEventListener('jain:storage', handler);
        return () => window.removeEventListener('jain:storage', handler);
    }, []);

    const removeCar = (id) => toggleCompare(id);

    const handleClear = () => {
        if (window.confirm('Clear all cars from comparison?')) clearCompare();
    };

    return (
        <div className="min-h-screen bg-ivory pt-24 pb-20">
            <Helmet>
                <title>Compare Cars · Jain Autocars</title>
            </Helmet>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link
                    to="/used-cars-in-mysore"
                    className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted hover:text-ink transition-colors"
                >
                    <ArrowLeft size={13} /> Back to inventory
                </Link>

                <div className="mt-4 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                    <div>
                        <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-faint">
                            — Side-by-side · <span className="num">{cars.length}</span> selected
                        </div>
                        <h1 className="font-display text-[44px] md:text-[64px] leading-[0.95] tracking-tightest mt-2 text-ink flex items-center gap-3 flex-wrap">
                            <span className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-ink text-champagne">
                                <GitCompareArrows size={20} />
                            </span>
                            Compare <em className="italic text-champagne">cars.</em>
                        </h1>
                        <p className="mt-2 text-[14px] text-ink-muted max-w-xl">
                            Lay out specifications side by side. Up to three cars from the inventory — remove any to
                            swap in another.
                        </p>
                    </div>

                    {cars.length > 0 && (
                        <button
                            onClick={handleClear}
                            className="inline-flex items-center gap-2 rounded-full border border-[#8b1f1f]/30 text-[#8b1f1f] px-4 py-2.5 text-[12.5px] hover:bg-[#8b1f1f] hover:text-white hover:border-[#8b1f1f] transition-colors whitespace-nowrap self-start"
                        >
                            <Trash2 size={13} /> Clear all
                        </button>
                    )}
                </div>

                <div className="mt-10">
                    {loading ? (
                        <div className="text-center py-24">
                            <div className="animate-spin w-8 h-8 border-4 border-ink border-t-transparent rounded-full mx-auto" />
                        </div>
                    ) : cars.length === 0 ? (
                        <div className="rounded-3xl border border-ink/10 bg-white/60 py-20 px-8 text-center">
                            <div className="mx-auto w-12 h-12 rounded-full border border-ink/15 flex items-center justify-center text-ink-muted">
                                <GitCompareArrows size={16} />
                            </div>
                            <div className="font-display text-[32px] md:text-[40px] leading-tight mt-4 text-ink">
                                Nothing to <em className="italic text-champagne">compare.</em>
                            </div>
                            <p className="text-[13.5px] text-ink-muted mt-2 max-w-md mx-auto">
                                Add cars to compare from the inventory by tapping the compare icon on any car card. You
                                can stack up to three side by side.
                            </p>
                            <Link
                                to="/used-cars-in-mysore"
                                className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink text-ivory px-5 py-2.5 text-[13px] hover:bg-champagne-deep transition-colors"
                            >
                                Browse inventory <ArrowRight size={13} />
                            </Link>
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-ink/10 bg-white shadow-[0_18px_50px_-30px_rgba(14,14,12,0.20)] overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[720px] border-separate border-spacing-0">
                                    <thead>
                                        <tr>
                                            <th className="sticky left-0 z-10 bg-white px-5 py-6 text-left align-bottom border-b border-ink/10 border-r border-ink/10 w-[180px]">
                                                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                                                    — Spec
                                                </span>
                                            </th>
                                            {cars.map((car) => (
                                                <th
                                                    key={car.id}
                                                    className="px-5 py-6 text-left align-bottom border-b border-ink/10 min-w-[260px]"
                                                >
                                                    <div className="relative">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeCar(car.id)}
                                                            className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/95 border border-ink/15 text-ink-muted hover:text-ink hover:bg-white flex items-center justify-center shadow-sm transition-colors"
                                                            title="Remove from compare"
                                                            aria-label="Remove from compare"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                        <div className="aspect-[16/10] bg-ivory-soft rounded-2xl overflow-hidden border border-ink/5">
                                                            {car.imageUrls?.[0] ? (
                                                                <img
                                                                    src={car.imageUrls[0]}
                                                                    alt={`${car.make} ${car.model}`}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-ink-faint text-[11px] font-mono uppercase tracking-[0.18em]">
                                                                    No photo
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="mt-4">
                                                            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                                                                {car.year || '—'} · {car.make || '—'}
                                                            </div>
                                                            <Link
                                                                to={`/car/${car.id}`}
                                                                className="block font-display text-[20px] md:text-[22px] leading-tight tracking-tightest mt-1 text-ink hover:text-champagne-deep transition-colors truncate"
                                                                title={`${car.make} ${car.model}`}
                                                            >
                                                                {car.model || 'Untitled'}
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {SPECS.map((spec, idx) => (
                                            <tr key={spec.key} className={idx % 2 === 1 ? 'bg-ivory-soft/40' : ''}>
                                                <td
                                                    className={`sticky left-0 z-10 px-5 py-4 align-top border-r border-ink/10 ${idx % 2 === 1 ? 'bg-ivory-soft/95' : 'bg-white'}`}
                                                >
                                                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                                                        {spec.label}
                                                    </span>
                                                </td>
                                                {cars.map((car) => {
                                                    const raw = car[spec.key];
                                                    const display = spec.format ? spec.format(raw) : raw;
                                                    const cellVal = display && display !== '—' ? display : '—';
                                                    const isEmpty = cellVal === '—';
                                                    return (
                                                        <td key={car.id} className="px-5 py-4 align-top">
                                                            {spec.highlight && !isEmpty ? (
                                                                <span className="font-display text-[20px] leading-none text-ink num">
                                                                    {cellVal}
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    className={`text-[13.5px] ${isEmpty ? 'text-ink-faint' : 'text-ink'}`}
                                                                >
                                                                    {cellVal}
                                                                </span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                        <tr className={SPECS.length % 2 === 1 ? 'bg-ivory-soft/40' : ''}>
                                            <td
                                                className={`sticky left-0 z-10 px-5 py-4 align-top border-r border-ink/10 ${SPECS.length % 2 === 1 ? 'bg-ivory-soft/95' : 'bg-white'}`}
                                            >
                                                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                                                    Features
                                                </span>
                                            </td>
                                            {cars.map((car) => (
                                                <td key={car.id} className="px-5 py-4 align-top">
                                                    {Array.isArray(car.features) && car.features.length > 0 ? (
                                                        <ul className="space-y-1.5">
                                                            {car.features.slice(0, 8).map((f, i) => (
                                                                <li
                                                                    key={i}
                                                                    className="text-[12.5px] text-ink-muted flex items-start gap-2"
                                                                >
                                                                    <span className="w-1 h-1 rounded-full bg-champagne mt-2 shrink-0" />
                                                                    <span>{f}</span>
                                                                </li>
                                                            ))}
                                                            {car.features.length > 8 && (
                                                                <li className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink-faint pt-1">
                                                                    +{car.features.length - 8} more
                                                                </li>
                                                            )}
                                                        </ul>
                                                    ) : (
                                                        <span className="text-[13.5px] text-ink-faint">—</span>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr>
                                            <td
                                                className="sticky left-0 z-10 px-5 py-5 align-top border-r border-ink/10 border-t border-ink/10 bg-white"
                                            />
                                            {cars.map((car) => (
                                                <td key={car.id} className="px-5 py-5 align-top border-t border-ink/10">
                                                    <Link
                                                        to={`/car/${car.id}`}
                                                        className="inline-flex items-center gap-1.5 rounded-full bg-ink text-ivory px-4 py-2 text-[12.5px] hover:bg-champagne-deep transition-colors whitespace-nowrap"
                                                    >
                                                        View details <ArrowRight size={13} />
                                                    </Link>
                                                </td>
                                            ))}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ComparePage;
