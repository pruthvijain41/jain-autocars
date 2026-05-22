import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    collection, getDocs, query, doc, deleteDoc, updateDoc, writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import AdminCarForm from '../components/forms/AdminCarForm';
import {
    Plus, Search, Edit2, Trash2, X, Star, ChevronDown, Download,
    ArrowDownWideNarrow, Check, Eye, BadgeCheck,
} from 'lucide-react';

const FILTER_PILLS = [
    { id: 'all', label: 'All' },
    { id: 'Available', label: 'Available' },
    { id: 'Reserved', label: 'Reserved' },
    { id: 'Sold', label: 'Sold' },
    { id: 'featured', label: 'Featured' },
    { id: 'no-images', label: 'No images' },
];

const SORTS = [
    { id: 'newest', label: 'Newest first' },
    { id: 'priceLow', label: 'Price · low to high' },
    { id: 'priceHigh', label: 'Price · high to low' },
    { id: 'yearNew', label: 'Year · newest' },
    { id: 'kmLow', label: 'KMs · low to high' },
    { id: 'viewsHigh', label: 'Most viewed' },
];

const STATUS_STYLES = {
    Available: { bg: 'rgba(31,107,70,0.10)', text: '#1f6b46', dot: '#1f6b46' },
    Reserved: { bg: 'rgba(184,149,106,0.16)', text: '#9A7748', dot: '#B8956A' },
    Sold: { bg: 'rgba(139,31,31,0.10)', text: '#8b1f1f', dot: '#8b1f1f' },
};

const StatusBadge = ({ status }) => {
    const s = STATUS_STYLES[status] || STATUS_STYLES.Available;
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{ background: s.bg, color: s.text }}
        >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
            {status || 'Available'}
        </span>
    );
};

const Thumb = ({ car, size = 44 }) => {
    const tone = '#1c1c19';
    return (
        <div
            className="rounded-lg overflow-hidden shrink-0 relative"
            style={{
                width: size,
                height: Math.round(size * 0.78),
                background: car.imageUrls?.[0]
                    ? '#1c1c19'
                    : `repeating-linear-gradient(135deg, ${tone} 0 8px, #232320 8px 16px)`,
            }}
        >
            {car.imageUrls?.[0] ? (
                <img src={car.imageUrls[0]} alt={car.model} className="w-full h-full object-cover" />
            ) : (
                <div className="absolute inset-0 flex items-end justify-start p-1">
                    <span className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-champagne/70 leading-none">
                        {(car.make || '').split(' ')[0]}
                    </span>
                </div>
            )}
        </div>
    );
};

const escapeCsv = (v) => {
    if (v == null) return '';
    const s = String(v);
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
};

const downloadCsv = (filename, rows) => {
    const csv = rows.map((r) => r.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const formatLakh = (n) => {
    const v = Number(n) || 0;
    return (v / 100000).toFixed(2);
};

const formatAdded = (car) => {
    const ts = car.createdAt?.seconds;
    if (!ts) return '—';
    return new Date(ts * 1000).toLocaleDateString('en-IN', { month: 'short', day: '2-digit' });
};

const AdminCarsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [sortOpen, setSortOpen] = useState(false);
    const [selected, setSelected] = useState(new Set());
    const [isFormOpen, setIsFormOpen] = useState(searchParams.get('new') === '1');
    const [editingCar, setEditingCar] = useState(null);
    const [modalShown, setModalShown] = useState(false);

    const sortRef = useRef(null);

    const fetchCars = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const q = query(collection(db, 'cars'));
            const querySnapshot = await getDocs(q);
            const carsData = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            setCars(carsData);
        } catch (err) {
            setError('Error fetching cars. Please try again.');
            console.error('Error fetching cars:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCars();
    }, [fetchCars]);

    useEffect(() => {
        if (!sortOpen) return;
        const close = (e) => {
            if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
        };
        document.addEventListener('click', close);
        return () => document.removeEventListener('click', close);
    }, [sortOpen]);

    useEffect(() => {
        if (isFormOpen) {
            document.body.style.overflow = 'hidden';
            requestAnimationFrame(() => requestAnimationFrame(() => setModalShown(true)));
        } else {
            setModalShown(false);
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isFormOpen]);

    useEffect(() => {
        if (!isFormOpen) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') {
                setIsFormOpen(false);
                setEditingCar(null);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isFormOpen]);

    const handleAddNew = () => {
        setEditingCar(null);
        setIsFormOpen(true);
    };

    const handleEditCar = (car) => {
        setEditingCar(car);
        setIsFormOpen(true);
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setEditingCar(null);
        if (searchParams.get('new') === '1') {
            searchParams.delete('new');
            setSearchParams(searchParams, { replace: true });
        }
    };

    const handleCarUpdated = () => {
        fetchCars();
        handleFormClose();
    };

    const handleDeleteCar = useCallback(
        async (carId) => {
            if (window.confirm('Remove this listing? This cannot be undone.')) {
                try {
                    await deleteDoc(doc(db, 'cars', carId));
                    fetchCars();
                } catch (err) {
                    setError('Error deleting car.');
                    console.error('Error deleting car:', err);
                }
            }
        },
        [fetchCars]
    );

    const handleToggleFeatured = useCallback(async (car) => {
        const next = !car.featured;
        setCars((prev) => prev.map((c) => (c.id === car.id ? { ...c, featured: next } : c)));
        try {
            await updateDoc(doc(db, 'cars', car.id), { featured: next });
        } catch (err) {
            console.error('Error toggling featured:', err);
            setError('Could not update featured flag.');
            setCars((prev) => prev.map((c) => (c.id === car.id ? { ...c, featured: !next } : c)));
        }
    }, []);

    const counts = useMemo(
        () => ({
            all: cars.length,
            Available: cars.filter((c) => (c.status || 'Available') === 'Available').length,
            Reserved: cars.filter((c) => c.status === 'Reserved').length,
            Sold: cars.filter((c) => c.status === 'Sold').length,
            featured: cars.filter((c) => c.featured).length,
            'no-images': cars.filter((c) => !c.imageUrls || c.imageUrls.length === 0).length,
        }),
        [cars]
    );

    const filteredCars = useMemo(() => {
        const base = cars.filter((car) => {
            const matchesSearch = `${car.make || ''} ${car.model || ''} ${car.year || ''}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;
            if (filter === 'all') return true;
            if (filter === 'featured') return !!car.featured;
            if (filter === 'no-images') return !car.imageUrls || car.imageUrls.length === 0;
            return (car.status || 'Available') === filter;
        });

        return base.sort((a, b) => {
            if (sortBy === 'priceLow') return Number(a.price || 0) - Number(b.price || 0);
            if (sortBy === 'priceHigh') return Number(b.price || 0) - Number(a.price || 0);
            if (sortBy === 'yearNew') return Number(b.year || 0) - Number(a.year || 0);
            if (sortBy === 'kmLow')
                return Number(a.kilometers || a.mileage || 0) - Number(b.kilometers || b.mileage || 0);
            if (sortBy === 'viewsHigh') return Number(b.views || 0) - Number(a.views || 0);
            return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });
    }, [cars, searchTerm, filter, sortBy]);

    const allSelected = filteredCars.length > 0 && filteredCars.every((c) => selected.has(c.id));

    const toggleSelect = (carId) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(carId)) next.delete(carId);
            else next.add(carId);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (allSelected) setSelected(new Set());
        else setSelected(new Set(filteredCars.map((c) => c.id)));
    };

    const handleBulkDelete = async () => {
        if (selected.size === 0) return;
        if (!window.confirm(`Delete ${selected.size} selected ${selected.size === 1 ? 'car' : 'cars'}? This cannot be undone.`)) return;
        try {
            const batch = writeBatch(db);
            selected.forEach((id) => batch.delete(doc(db, 'cars', id)));
            await batch.commit();
            setSelected(new Set());
            fetchCars();
        } catch (err) {
            console.error('Bulk delete error:', err);
            setError('Bulk delete failed.');
        }
    };

    const handleBulkMarkSold = async () => {
        if (selected.size === 0) return;
        try {
            const batch = writeBatch(db);
            selected.forEach((id) => batch.update(doc(db, 'cars', id), { status: 'Sold' }));
            await batch.commit();
            setCars((prev) => prev.map((c) => (selected.has(c.id) ? { ...c, status: 'Sold' } : c)));
            setSelected(new Set());
        } catch (err) {
            console.error('Bulk status change error:', err);
            setError('Bulk status update failed.');
        }
    };

    const handleBulkToggleFeatured = async () => {
        if (selected.size === 0) return;
        try {
            const selectedCars = cars.filter((c) => selected.has(c.id));
            const allFeatured = selectedCars.every((c) => !!c.featured);
            const next = !allFeatured;
            const batch = writeBatch(db);
            selected.forEach((id) => batch.update(doc(db, 'cars', id), { featured: next }));
            await batch.commit();
            setCars((prev) => prev.map((c) => (selected.has(c.id) ? { ...c, featured: next } : c)));
        } catch (err) {
            console.error('Bulk featured toggle error:', err);
            setError('Bulk featured update failed.');
        }
    };

    const handleExportCsv = () => {
        const header = ['Year', 'Make', 'Model', 'Price', 'Kilometers', 'Fuel', 'Transmission', 'Owner', 'BodyType', 'Status', 'Featured', 'Views', 'CarId'];
        const rows = filteredCars.map((c) => [
            c.year,
            c.make,
            c.model,
            c.price,
            c.kilometers ?? c.mileage ?? '',
            c.fuelType,
            c.transmission,
            c.owner,
            c.bodyType,
            c.status || 'Available',
            c.featured ? 'Yes' : 'No',
            c.views || 0,
            c.id,
        ]);
        downloadCsv(`inventory-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows]);
    };

    const currentSort = SORTS.find((s) => s.id === sortBy) || SORTS[0];

    return (
        <div className="px-4 lg:px-8 py-6 lg:py-10">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-faint">— Inventory</div>
                    <h1 className="font-display text-[44px] md:text-[64px] leading-[0.95] tracking-tightest mt-2 text-ink">
                        Cars <em className="italic text-champagne">management.</em>
                    </h1>
                    <p className="mt-2 text-[14px] text-ink-muted max-w-xl">
                        Manage your vehicle inventory — add, edit, and update listings, mark cars as sold, and feature
                        them on the homepage.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleAddNew}
                    className="inline-flex items-center gap-2 rounded-full bg-ink text-ivory px-5 py-3 text-[13.5px] hover:bg-champagne-deep transition-colors self-start whitespace-nowrap"
                >
                    <Plus size={14} /> Add new car
                </button>
            </div>

            <div className="mt-7 rounded-2xl border border-ink/10 bg-white/60 p-3 flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-1 min-w-[220px] bg-ivory/60 border border-ink/10 rounded-xl px-3 py-2 focus-within:border-ink/40 transition-colors">
                    <Search size={14} className="text-ink-faint" />
                    <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by make, model, year…"
                        className="flex-1 bg-transparent text-[13.5px] placeholder:text-ink-faint outline-none text-ink"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="text-ink-faint hover:text-ink"
                            aria-label="Clear search"
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>

                <div className="relative" ref={sortRef}>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSortOpen((o) => !o);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-ink/15 bg-white/70 px-3.5 py-2.5 text-[13px] text-ink hover:bg-ink hover:text-ivory transition-colors whitespace-nowrap"
                    >
                        <ArrowDownWideNarrow size={13} /> {currentSort.label} <ChevronDown size={13} />
                    </button>
                    {sortOpen && (
                        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-ink/10 bg-ivory shadow-xl overflow-hidden z-20">
                            {SORTS.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => {
                                        setSortBy(s.id);
                                        setSortOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-ivory-soft flex items-center justify-between text-ink ${sortBy === s.id ? 'bg-ivory-soft' : ''}`}
                                >
                                    {s.label} {sortBy === s.id && <Check size={14} />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={handleExportCsv}
                    disabled={!filteredCars.length}
                    className="inline-flex items-center gap-2 rounded-xl border border-ink/15 px-3.5 py-2.5 text-[13px] text-ink hover:bg-ink hover:text-ivory transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download size={13} /> Export CSV
                </button>
            </div>

            <div className="mt-5 flex items-center gap-2 flex-wrap">
                {FILTER_PILLS.map((p) => {
                    const on = filter === p.id;
                    const n = counts[p.id] ?? 0;
                    return (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => setFilter(p.id)}
                            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors whitespace-nowrap ${
                                on
                                    ? 'bg-ink text-ivory border-ink'
                                    : 'border-ink/15 text-ink hover:border-ink/40'
                            }`}
                        >
                            {p.label}
                            <span
                                className={`num text-[10.5px] px-1.5 py-0.5 rounded-full ${
                                    on ? 'bg-ivory/20 text-ivory' : 'bg-ink/[0.07] text-ink-muted'
                                }`}
                            >
                                {n}
                            </span>
                        </button>
                    );
                })}
            </div>

            {selected.size > 0 && (
                <div className="mt-5 sticky top-16 z-20">
                    <div className="rounded-2xl bg-ink text-ivory px-4 py-3 flex items-center gap-3 flex-wrap shadow-[0_20px_50px_-20px_rgba(14,14,12,0.55)]">
                        <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ivory/65">Selected</div>
                        <div className="font-display text-[28px] leading-none num">{selected.size}</div>
                        <div className="flex-1" />
                        <button
                            type="button"
                            onClick={handleBulkMarkSold}
                            className="inline-flex items-center gap-2 rounded-full bg-champagne text-ink px-3.5 py-2 text-[12.5px] hover:bg-champagne-light transition-colors"
                        >
                            <BadgeCheck size={13} /> Mark as sold
                        </button>
                        <button
                            type="button"
                            onClick={handleBulkToggleFeatured}
                            className="inline-flex items-center gap-2 rounded-full border border-ivory/20 px-3.5 py-2 text-[12.5px] hover:bg-ivory hover:text-ink transition-colors"
                        >
                            <Star size={13} /> Toggle featured
                        </button>
                        <button
                            type="button"
                            onClick={handleBulkDelete}
                            className="inline-flex items-center gap-2 rounded-full border border-[#d05a5a]/40 text-[#ff8c8c] hover:bg-[#8b1f1f] hover:border-[#8b1f1f] hover:text-white px-3.5 py-2 text-[12.5px] transition-colors"
                        >
                            <Trash2 size={13} /> Delete
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelected(new Set())}
                            className="w-9 h-9 rounded-full border border-ivory/20 flex items-center justify-center hover:bg-ivory/10"
                            aria-label="Clear selection"
                        >
                            <X size={13} />
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-[13px]">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin w-8 h-8 border-4 border-ink border-t-transparent rounded-full mx-auto" />
                </div>
            ) : filteredCars.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-ink/10 bg-white/60 py-16 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full border border-ink/15 flex items-center justify-center text-ink-muted">
                        <Search size={14} />
                    </div>
                    <div className="font-display text-[28px] leading-tight mt-4 text-ink">
                        No cars <em className="italic text-champagne">match.</em>
                    </div>
                    <div className="text-[13px] text-ink-muted mt-1">
                        {cars.length === 0 ? 'Add your first car to get started.' : 'Try a different filter or search term.'}
                    </div>
                </div>
            ) : (
                <>
                    <section className="mt-6 hidden md:block rounded-2xl border border-ink/10 bg-white/60 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-[13.5px]">
                                <thead className="bg-ivory-soft/70">
                                    <tr className="text-left font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-faint">
                                        <th className="w-10 px-3 py-3.5">
                                            <button
                                                type="button"
                                                onClick={toggleSelectAll}
                                                className={`w-4 h-4 rounded border flex items-center justify-center ${allSelected ? 'bg-ink border-ink text-ivory' : 'border-ink/30'}`}
                                                aria-label={allSelected ? 'Deselect all' : 'Select all'}
                                            >
                                                {allSelected && <Check size={11} />}
                                            </button>
                                        </th>
                                        <th className="w-10 px-2 py-3.5">
                                            <Star size={11} />
                                        </th>
                                        <th className="px-3 py-3.5">Vehicle</th>
                                        <th className="px-3 py-3.5 text-right">Price</th>
                                        <th className="px-3 py-3.5">Status</th>
                                        <th className="px-3 py-3.5">Owner</th>
                                        <th className="px-3 py-3.5">Added</th>
                                        <th className="w-24 px-3 py-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCars.map((c) => {
                                        const checked = selected.has(c.id);
                                        const km = c.kilometers ?? c.mileage;
                                        return (
                                            <tr
                                                key={c.id}
                                                className={`group border-t border-ink/[0.08] ${checked ? 'bg-ivory-soft/60' : 'hover:bg-ivory-soft/40'} transition-colors`}
                                            >
                                                <td className="px-3 py-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleSelect(c.id)}
                                                        className={`w-4 h-4 rounded border flex items-center justify-center ${checked ? 'bg-ink border-ink text-ivory' : 'border-ink/30 hover:border-ink/60'}`}
                                                        aria-label={checked ? 'Deselect' : 'Select'}
                                                    >
                                                        {checked && <Check size={11} />}
                                                    </button>
                                                </td>
                                                <td className="px-2 py-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleFeatured(c)}
                                                        aria-label={c.featured ? 'Unfeature' : 'Feature on homepage'}
                                                    >
                                                        <Star
                                                            size={14}
                                                            className={c.featured ? 'text-champagne' : 'text-ink-faint hover:text-ink'}
                                                            fill={c.featured ? 'currentColor' : 'none'}
                                                        />
                                                    </button>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <Thumb car={c} />
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <span className="font-medium truncate text-ink">
                                                                    {c.year} {c.make} {c.model}
                                                                </span>
                                                                <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-faint shrink-0">
                                                                    #{(c.id || '').toString().slice(-6)}
                                                                </span>
                                                            </div>
                                                            <div className="text-[11.5px] text-ink-muted mt-0.5 truncate">
                                                                <span className="num">{km != null ? Number(km).toLocaleString('en-IN') : '—'} km</span> · {c.fuelType || '—'} · {c.transmission || '—'}
                                                                {typeof c.views === 'number' && c.views > 0 && (
                                                                    <>
                                                                        {' · '}
                                                                        <Eye size={10} className="inline mb-0.5" /> <span className="num">{c.views}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-right">
                                                    <div className="font-display text-[20px] leading-none num text-ink">
                                                        ₹{formatLakh(c.price)}
                                                        <span className="text-[12px] text-ink-muted ml-0.5">L</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <StatusBadge status={c.status || 'Available'} />
                                                </td>
                                                <td className="px-3 py-3 text-[12.5px] text-ink">{c.owner || '—'}</td>
                                                <td className="px-3 py-3 text-[12.5px] text-ink-muted num">
                                                    {formatAdded(c)}
                                                </td>
                                                <td className="px-3 py-3 text-right">
                                                    <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditCar(c)}
                                                            aria-label="Edit"
                                                            className="w-8 h-8 rounded-full border border-ink/15 text-ink flex items-center justify-center hover:bg-ink hover:text-ivory transition-colors"
                                                        >
                                                            <Edit2 size={12} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteCar(c.id)}
                                                            aria-label="Delete"
                                                            className="w-8 h-8 rounded-full border border-ink/15 text-[#8b1f1f] hover:bg-[#8b1f1f] hover:text-white hover:border-[#8b1f1f] flex items-center justify-center transition-colors"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex items-center justify-between px-4 py-3 border-t border-ink/10 bg-ivory-soft/40 text-[12px] text-ink-muted">
                            <div>
                                Showing <span className="text-ink num">{filteredCars.length}</span> of{' '}
                                <span className="text-ink num">{cars.length}</span>
                            </div>
                            <div className="font-mono text-[10px] uppercase tracking-[0.2em]">
                                Auto-synced ·{' '}
                                {new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                            </div>
                        </div>
                    </section>

                    <section className="mt-6 md:hidden space-y-3">
                        {filteredCars.map((c) => {
                            const checked = selected.has(c.id);
                            const km = c.kilometers ?? c.mileage;
                            return (
                                <article
                                    key={c.id}
                                    className={`rounded-2xl border border-ink/10 bg-white/60 p-4 ${checked ? 'ring-2 ring-ink' : ''}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <button
                                            type="button"
                                            onClick={() => toggleSelect(c.id)}
                                            className={`mt-1 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${checked ? 'bg-ink border-ink text-ivory' : 'border-ink/30'}`}
                                            aria-label={checked ? 'Deselect' : 'Select'}
                                        >
                                            {checked && <Check size={11} />}
                                        </button>
                                        <div className="w-24 aspect-[4/3] rounded-lg overflow-hidden shrink-0 bg-ink/5">
                                            {c.imageUrls?.[0] ? (
                                                <img src={c.imageUrls[0]} alt={c.model} className="w-full h-full object-cover" />
                                            ) : (
                                                <div
                                                    className="w-full h-full"
                                                    style={{ background: `repeating-linear-gradient(135deg, #1c1c19 0 10px, #232320 10px 20px)` }}
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="font-medium truncate text-ink">
                                                    {c.year} {c.make} {c.model}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleFeatured(c)}
                                                    aria-label={c.featured ? 'Unfeature' : 'Feature'}
                                                >
                                                    <Star
                                                        size={14}
                                                        className={c.featured ? 'text-champagne' : 'text-ink-faint'}
                                                        fill={c.featured ? 'currentColor' : 'none'}
                                                    />
                                                </button>
                                            </div>
                                            <div className="text-[11.5px] text-ink-muted mt-0.5">
                                                <span className="num">{km != null ? Number(km).toLocaleString('en-IN') : '—'} km</span> · {c.fuelType || '—'}
                                            </div>
                                            <div className="mt-2 flex items-center justify-between">
                                                <div className="font-display text-[22px] leading-none num text-ink">
                                                    ₹{formatLakh(c.price)}
                                                    <span className="text-[11px] text-ink-muted ml-0.5">L</span>
                                                </div>
                                                <StatusBadge status={c.status || 'Available'} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleEditCar(c)}
                                            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-ink/15 py-2 text-[12.5px] text-ink hover:bg-ink hover:text-ivory transition-colors"
                                        >
                                            <Edit2 size={12} /> Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteCar(c.id)}
                                            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#8b1f1f]/30 text-[#8b1f1f] py-2 text-[12.5px] hover:bg-[#8b1f1f] hover:text-white hover:border-[#8b1f1f] transition-colors"
                                        >
                                            <Trash2 size={12} /> Delete
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                </>
            )}

            {isFormOpen && (
                <div
                    className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-stretch md:items-center justify-center md:p-4"
                    style={{ opacity: modalShown ? 1 : 0, transition: 'opacity 300ms ease' }}
                    onClick={handleFormClose}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            opacity: modalShown ? 1 : 0,
                            transform: modalShown ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.98)',
                            transition: 'opacity 380ms cubic-bezier(.2,.7,.2,1), transform 380ms cubic-bezier(.2,.7,.2,1)',
                        }}
                        className="w-full max-w-4xl flex"
                    >
                        <AdminCarForm
                            editingCar={editingCar}
                            setEditingCar={setEditingCar}
                            onCarUpdated={handleCarUpdated}
                            onClose={handleFormClose}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCarsPage;
