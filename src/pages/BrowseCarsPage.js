import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
    Search, SlidersHorizontal, X, Plus, Minus, Bookmark, ArrowDownWideNarrow,
    ChevronDown, Check, ArrowLeft, ArrowRight, Trash2,
} from 'lucide-react';
import EditorialCarCard from '../components/cars/EditorialCarCard';

/* =====================================================================
   Filter shape (multi-select arrays everywhere)
   ===================================================================== */

const PRICE_MIN = 0;            // ₹ rupees
const PRICE_MAX = 10000000;     // 1 Cr
const KM_MIN = 0;
const KM_MAX = 300000;

const DEFAULT_FILTERS = {
    q: '',
    price: [PRICE_MIN, PRICE_MAX],
    km: [KM_MIN, KM_MAX],
    makes: [],
    bodies: [],
    fuels: [],
    transmissions: [],
    owners: [],
    years: [],
    showSold: false,
};

const BODIES = ['Hatchback', 'Sedan', 'SUV', 'MUV', 'Coupe', 'Convertible', 'Pickup'];
const FUELS = ['Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid'];
const TRANSMISSIONS = ['Manual', 'Automatic'];
const OWNERSHIP = ['1st Owner', '2nd Owner', '3rd Owner', '4th Owner', '5th Owner'];

const SORTS = [
    { id: 'newest', label: 'Newest first' },
    { id: 'priceLow', label: 'Price · low to high' },
    { id: 'priceHigh', label: 'Price · high to low' },
    { id: 'yearNew', label: 'Year · newest first' },
    { id: 'kmLow', label: 'KMs · low to high' },
];

const SAVED_SEARCHES_KEY = 'jain:savedSearches';
const loadSavedSearches = () => {
    try { return JSON.parse(localStorage.getItem(SAVED_SEARCHES_KEY) || '[]'); }
    catch (_) { return []; }
};
const persistSavedSearches = (list) => {
    try { localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(list)); } catch (_) { /* ignore */ }
};

/* =====================================================================
   URL <-> filter serialization (keeps existing param names so the
   home-page chip links and external bookmarks still work)
   ===================================================================== */

const parseList = (v) => (v ? v.split(',').map(s => s.trim()).filter(Boolean) : []);

const filtersFromParams = (params) => {
    const next = {
        ...DEFAULT_FILTERS,
        price: [...DEFAULT_FILTERS.price],
        km: [...DEFAULT_FILTERS.km],
        makes: [], bodies: [], fuels: [], transmissions: [], owners: [], years: [],
    };
    const priceMin = params.get('priceMin');
    const priceMax = params.get('priceMax');
    if (priceMin) next.price[0] = Math.max(PRICE_MIN, Number(priceMin));
    if (priceMax) next.price[1] = Math.min(PRICE_MAX, Number(priceMax));

    const kmMin = params.get('kmMin');
    const kmMax = params.get('kmMax');
    if (kmMin) next.km[0] = Math.max(KM_MIN, Number(kmMin));
    if (kmMax) next.km[1] = Math.min(KM_MAX, Number(kmMax));

    next.makes = parseList(params.get('makes'));
    next.bodies = parseList(params.get('bodyType'));
    next.fuels = parseList(params.get('fuelType'));
    next.transmissions = parseList(params.get('transmission'));
    next.owners = parseList(params.get('owners'));
    next.years = parseList(params.get('year'));
    if (params.get('showSold') === 'true') next.showSold = true;
    return next;
};

const filtersToParams = (filters, searchTerm, sortBy, page) => {
    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (sortBy && sortBy !== 'newest') params.sort = sortBy;
    if (page > 1) params.page = String(page);
    if (filters.price[0] > PRICE_MIN) params.priceMin = String(filters.price[0]);
    if (filters.price[1] < PRICE_MAX) params.priceMax = String(filters.price[1]);
    if (filters.km[0] > KM_MIN) params.kmMin = String(filters.km[0]);
    if (filters.km[1] < KM_MAX) params.kmMax = String(filters.km[1]);
    if (filters.makes.length) params.makes = filters.makes.join(',');
    if (filters.bodies.length) params.bodyType = filters.bodies.join(',');
    if (filters.fuels.length) params.fuelType = filters.fuels.join(',');
    if (filters.transmissions.length) params.transmission = filters.transmissions.join(',');
    if (filters.owners.length) params.owners = filters.owners.join(',');
    if (filters.years.length) params.year = filters.years.join(',');
    if (filters.showSold) params.showSold = 'true';
    return params;
};

/* =====================================================================
   Building blocks
   ===================================================================== */

const FilterSection = ({ title, count = 0, defaultOpen = true, children }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="py-5 border-b border-ink/10">
            <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">— {title}</span>
                    {count > 0 && <span className="text-[10px] num text-champagne-deep">{count}</span>}
                </div>
                {open ? <Minus size={13} className="text-ink-muted" /> : <Plus size={13} className="text-ink-muted" />}
            </button>
            {open && <div className="mt-4">{children}</div>}
        </div>
    );
};

const ChipGroup = ({ options, values, onToggle, cols = 'grid-cols-2', initialLimit }) => {
    const [expanded, setExpanded] = useState(false);
    const canCollapse = typeof initialLimit === 'number' && options.length > initialLimit;
    // Keep any active chips visible even when collapsed
    let visible = options;
    if (canCollapse && !expanded) {
        const head = options.slice(0, initialLimit);
        const activeExtras = options.slice(initialLimit).filter(o => values.includes(o));
        visible = [...head, ...activeExtras];
    }
    const hiddenCount = options.length - visible.length;

    return (
        <div>
            <div className={`grid ${cols} gap-1.5`}>
                {visible.map(opt => {
                    const on = values.includes(opt);
                    return (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => onToggle(opt)}
                            className={`text-left text-[12.5px] px-3 py-2 rounded-xl border transition-colors ${on
                                ? 'bg-ink text-ivory border-ink'
                                : 'bg-ivory/40 border-ink/15 hover:border-ink/40'
                            }`}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>
            {canCollapse && (
                <button
                    type="button"
                    onClick={() => setExpanded(e => !e)}
                    className="mt-2.5 link-u text-[11.5px] text-ink-muted hover:text-ink inline-flex items-center gap-1"
                >
                    {expanded
                        ? <>Show less</>
                        : <>Show {hiddenCount} more</>}
                </button>
            )}
        </div>
    );
};

const Toggle = ({ checked, onChange, label }) => (
    <label className="flex items-center justify-between cursor-pointer">
        <span className="text-[13px] text-ink">{label}</span>
        <span
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-ink' : 'bg-ink/20'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-ivory transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </span>
    </label>
);

/* Dual-thumb range slider (no third-party deps) */
const RangeDual = ({ min, max, step, value, onChange, format }) => {
    const [lo, hi] = value;
    const safeLo = Math.min(lo, hi - step);
    const safeHi = Math.max(hi, lo + step);
    const pct = (v) => ((v - min) / (max - min)) * 100;
    return (
        <div>
            <div className="flex items-baseline justify-between mb-3">
                <div>
                    <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-faint">Min</div>
                    <div className="font-display font-normal text-ink text-[18px] leading-none mt-1 num">{format(safeLo)}</div>
                </div>
                <div className="text-right">
                    <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-faint">Max</div>
                    <div className="font-display font-normal text-ink text-[18px] leading-none mt-1 num">{format(safeHi)}</div>
                </div>
            </div>
            <div className="relative h-7">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full bg-ink/10" />
                <div
                    className="absolute top-1/2 -translate-y-1/2 h-[3px] rounded-full bg-ink"
                    style={{ left: `${pct(safeLo)}%`, width: `${Math.max(0, pct(safeHi) - pct(safeLo))}%` }}
                />
                <input
                    type="range" min={min} max={max} step={step} value={safeLo}
                    onChange={(e) => onChange([Math.min(Number(e.target.value), safeHi - step), safeHi])}
                    className="range-thumb absolute inset-0 w-full appearance-none bg-transparent pointer-events-none"
                />
                <input
                    type="range" min={min} max={max} step={step} value={safeHi}
                    onChange={(e) => onChange([safeLo, Math.max(Number(e.target.value), safeLo + step)])}
                    className="range-thumb absolute inset-0 w-full appearance-none bg-transparent pointer-events-none"
                />
            </div>
        </div>
    );
};

/* =====================================================================
   Filters panel (shared by sidebar + mobile drawer)
   ===================================================================== */

const FiltersPanel = ({
    filters, setFilters, availableMakes, availableYears, onClose,
}) => {
    const tog = (key, val) => setFilters(f => ({
        ...f, [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val],
    }));
    const reset = () => setFilters({
        ...DEFAULT_FILTERS,
        price: [...DEFAULT_FILTERS.price],
        km: [...DEFAULT_FILTERS.km],
        makes: [], bodies: [], fuels: [], transmissions: [], owners: [], years: [],
    });

    const activeCount =
        filters.makes.length + filters.bodies.length + filters.fuels.length +
        filters.transmissions.length + filters.owners.length + filters.years.length +
        (filters.q ? 1 : 0) +
        ((filters.price[0] !== PRICE_MIN || filters.price[1] !== PRICE_MAX) ? 1 : 0) +
        ((filters.km[0] !== KM_MIN || filters.km[1] !== KM_MAX) ? 1 : 0) +
        (filters.showSold ? 1 : 0);

    const formatLakh = (v) => v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v.toLocaleString('en-IN')}`;
    const formatKm = (v) => `${v.toLocaleString('en-IN')} km`;

    return (
        <aside className="rounded-2xl border border-ink/10 bg-white/55 backdrop-blur p-5 h-fit">
            <div className="flex items-center justify-between pb-4 border-b border-ink/10">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal size={15} />
                    <span className="font-display font-normal text-ink text-[22px] leading-none">Filters</span>
                    {activeCount > 0 && (
                        <span className="ml-1 num text-[10px] px-2 py-0.5 rounded-full bg-ink text-ivory">{activeCount}</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={reset} className="link-u text-[12px] text-ink-muted">Reset all</button>
                    {onClose && (
                        <button onClick={onClose} aria-label="Close filters" className="lg:hidden w-8 h-8 rounded-full border border-ink/15 flex items-center justify-center">
                            <X size={13} />
                        </button>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="mt-4">
                <div className="flex items-center gap-2 rounded-xl bg-ivory border border-ink/10 px-3 py-2.5">
                    <Search size={14} className="text-ink-faint shrink-0" />
                    <input
                        type="text"
                        value={filters.q}
                        onChange={(e) => setFilters(f => ({ ...f, q: e.target.value }))}
                        placeholder="Make, model…"
                        className="flex-1 min-w-0 bg-transparent text-[13px] placeholder:text-ink-faint outline-none border-0 focus:ring-0 focus:border-0 text-ink p-0 leading-none h-5"
                    />
                    {filters.q && (
                        <button onClick={() => setFilters(f => ({ ...f, q: '' }))} className="text-ink-faint hover:text-ink shrink-0">
                            <X size={13} />
                        </button>
                    )}
                </div>
            </div>

            <FilterSection
                title="Price range"
                count={(filters.price[0] !== PRICE_MIN || filters.price[1] !== PRICE_MAX) ? 1 : 0}
            >
                <RangeDual
                    min={PRICE_MIN} max={PRICE_MAX} step={50000}
                    value={filters.price}
                    onChange={(v) => setFilters(f => ({ ...f, price: v }))}
                    format={formatLakh}
                />
            </FilterSection>

            <FilterSection
                title="Kilometers driven"
                count={(filters.km[0] !== KM_MIN || filters.km[1] !== KM_MAX) ? 1 : 0}
            >
                <RangeDual
                    min={KM_MIN} max={KM_MAX} step={5000}
                    value={filters.km}
                    onChange={(v) => setFilters(f => ({ ...f, km: v }))}
                    format={formatKm}
                />
            </FilterSection>

            {availableMakes.length > 0 && (
                <FilterSection title="Make" count={filters.makes.length}>
                    <ChipGroup options={availableMakes} values={filters.makes} onToggle={(v) => tog('makes', v)} cols="grid-cols-2" initialLimit={4} />
                </FilterSection>
            )}

            <FilterSection title="Body type" count={filters.bodies.length}>
                <ChipGroup options={BODIES} values={filters.bodies} onToggle={(v) => tog('bodies', v)} cols="grid-cols-2" />
            </FilterSection>

            <FilterSection title="Fuel" count={filters.fuels.length}>
                <ChipGroup options={FUELS} values={filters.fuels} onToggle={(v) => tog('fuels', v)} cols="grid-cols-2" />
            </FilterSection>

            <FilterSection title="Transmission" count={filters.transmissions.length}>
                <ChipGroup options={TRANSMISSIONS} values={filters.transmissions} onToggle={(v) => tog('transmissions', v)} cols="grid-cols-2" />
            </FilterSection>

            <FilterSection title="Ownership" count={filters.owners.length}>
                <ChipGroup options={OWNERSHIP} values={filters.owners} onToggle={(v) => tog('owners', v)} cols="grid-cols-2" />
            </FilterSection>

            {availableYears.length > 0 && (
                <FilterSection title="Year" count={filters.years.length}>
                    <ChipGroup
                        options={availableYears.map(String)}
                        values={filters.years}
                        onToggle={(v) => tog('years', v)}
                        cols="grid-cols-3"
                    />
                </FilterSection>
            )}

            <div className="pt-5">
                <Toggle
                    checked={filters.showSold}
                    onChange={(v) => setFilters(f => ({ ...f, showSold: v }))}
                    label="Include sold cars"
                />
            </div>
        </aside>
    );
};

/* =====================================================================
   Pagination
   ===================================================================== */

const Pagination = ({ page, total, onChange }) => {
    if (total <= 1) return null;
    const pages = [];
    for (let i = 1; i <= total; i++) pages.push(i);
    return (
        <div className="flex items-center justify-between flex-wrap gap-4 mt-12">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-faint">
                Page <span className="text-ink num">{String(page).padStart(2, '0')}</span> /
                <span className="num"> {String(total).padStart(2, '0')}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <button
                    onClick={() => page > 1 && onChange(page - 1)}
                    disabled={page <= 1}
                    aria-label="Previous page"
                    className={`w-10 h-10 rounded-full border flex items-center justify-center ${page <= 1 ? 'border-ink/10 text-ink-faint cursor-not-allowed' : 'border-ink/20 hover:bg-ink hover:text-ivory'} transition-colors`}
                >
                    <ArrowLeft size={14} />
                </button>
                {pages.map(p => (
                    <button
                        key={p}
                        onClick={() => onChange(p)}
                        className={`min-w-10 h-10 px-3 rounded-full border text-[13px] num transition-colors ${p === page ? 'bg-ink text-ivory border-ink' : 'border-ink/15 hover:border-ink/40'}`}
                    >{p}</button>
                ))}
                <button
                    onClick={() => page < total && onChange(page + 1)}
                    disabled={page >= total}
                    aria-label="Next page"
                    className={`w-10 h-10 rounded-full border flex items-center justify-center ${page >= total ? 'border-ink/10 text-ink-faint cursor-not-allowed' : 'border-ink/20 hover:bg-ink hover:text-ivory'} transition-colors`}
                >
                    <ArrowRight size={14} />
                </button>
            </div>
        </div>
    );
};

const EmptyState = ({ onClear }) => {
    const navigate = useNavigate();
    return (
        <div className="rounded-3xl border border-ink/10 bg-white/40 py-20 px-8 text-center">
            <div className="mx-auto w-14 h-14 rounded-full border border-ink/15 flex items-center justify-center">
                <Search size={18} />
            </div>
            <h3 className="font-display font-normal text-ink text-[36px] sm:text-[44px] leading-tight mt-6 tracking-tightest">
                No cars <em className="italic text-champagne">match</em> your search.
            </h3>
            <p className="mt-3 text-[14px] text-ink-muted max-w-md mx-auto">
                Try loosening a filter or two — or let us know what you're looking for and we'll source it within seven days.
            </p>
            <div className="mt-7 inline-flex items-center gap-3 flex-wrap justify-center">
                <button
                    onClick={onClear}
                    className="rounded-full bg-ink text-ivory px-5 py-2.5 text-[13.5px] hover:bg-champagne-deep transition-colors"
                >Clear all filters</button>
                <button
                    onClick={() => navigate('/contact?type=request')}
                    className="rounded-full border border-ink/20 px-5 py-2.5 text-[13.5px] hover:bg-ink hover:text-ivory transition-colors"
                >Request a car</button>
            </div>
        </div>
    );
};

/* =====================================================================
   Mobile drawer
   ===================================================================== */

const MobileDrawer = ({ open, onClose, children }) => {
    const [mounted, setMounted] = useState(false);
    const [shown, setShown] = useState(false);
    useEffect(() => {
        if (open) {
            setMounted(true);
            document.body.style.overflow = 'hidden';
            requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
        } else {
            setShown(false);
            document.body.style.overflow = '';
            const t = setTimeout(() => setMounted(false), 350);
            return () => clearTimeout(t);
        }
    }, [open]);
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    if (!mounted) return null;
    return (
        <div className="fixed inset-0 z-50 lg:hidden" style={{ pointerEvents: shown ? 'auto' : 'none' }}>
            <div
                onClick={onClose}
                className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
                style={{ opacity: shown ? 1 : 0, transition: 'opacity 300ms ease' }}
            />
            <div
                className="absolute right-0 top-0 h-full w-[88%] max-w-[420px] bg-ivory border-l border-ink/10 overflow-y-auto"
                style={{
                    transform: shown ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 380ms cubic-bezier(.2,.7,.2,1)',
                }}
            >
                {children}
            </div>
        </div>
    );
};

/* =====================================================================
   Page
   ===================================================================== */

const PER_PAGE = 9;

const BrowseCarsPage = () => {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();

    const [filters, setFilters] = useState(() => {
        const initial = filtersFromParams(searchParams);
        initial.q = searchParams.get('search') || '';
        return initial;
    });
    const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
    const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

    const [sortOpen, setSortOpen] = useState(false);
    const [savedOpen, setSavedOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [savedSearches, setSavedSearches] = useState(loadSavedSearches);

    /* Close menus on outside click */
    useEffect(() => {
        const close = () => { setSortOpen(false); setSavedOpen(false); };
        document.addEventListener('click', close);
        return () => document.removeEventListener('click', close);
    }, []);

    /* Fetch cars once */
    useEffect(() => {
        const fetchCars = async () => {
            setLoading(true);
            try {
                const carsRef = collection(db, 'cars');
                const q = query(carsRef, orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(q);
                setCars(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error('Error fetching cars:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCars();
    }, []);

    /* Sync state to URL */
    useEffect(() => {
        setSearchParams(filtersToParams(filters, filters.q, sort, page), { replace: true });
    }, [filters, sort, page, setSearchParams]);

    /* Reset page when a filter changes */
    const setFiltersAndResetPage = (updater) => {
        setFilters(prev => (typeof updater === 'function' ? updater(prev) : updater));
        setPage(1);
    };

    const availableMakes = useMemo(() => {
        const set = new Set();
        cars.forEach(c => c.make && set.add(c.make));
        return Array.from(set).sort();
    }, [cars]);

    const availableYears = useMemo(() => {
        const set = new Set();
        cars.forEach(c => c.year && set.add(Number(c.year)));
        return Array.from(set).sort((a, b) => b - a);
    }, [cars]);

    const filtered = useMemo(() => {
        let list = cars.slice();
        if (!filters.showSold) list = list.filter(c => c.status !== 'Sold');

        if (filters.q) {
            const q = filters.q.toLowerCase();
            list = list.filter(c =>
                `${c.make || ''} ${c.model || ''} ${c.year || ''}`.toLowerCase().includes(q)
            );
        }

        list = list.filter(c => {
            const price = Number(c.price) || 0;
            return price >= filters.price[0] && price <= filters.price[1];
        });

        list = list.filter(c => {
            const km = Number(c.kilometers ?? c.mileage ?? 0);
            return km >= filters.km[0] && km <= filters.km[1];
        });

        if (filters.makes.length) list = list.filter(c => filters.makes.includes(c.make));
        if (filters.bodies.length) list = list.filter(c => filters.bodies.includes(c.bodyType));
        if (filters.fuels.length) list = list.filter(c => filters.fuels.includes(c.fuelType));
        if (filters.transmissions.length) list = list.filter(c => filters.transmissions.includes(c.transmission));
        if (filters.owners.length) list = list.filter(c => filters.owners.includes(c.ownership || c.owner));
        if (filters.years.length) list = list.filter(c => filters.years.includes(String(c.year)));

        switch (sort) {
            case 'priceLow': list.sort((a, b) => Number(a.price) - Number(b.price)); break;
            case 'priceHigh': list.sort((a, b) => Number(b.price) - Number(a.price)); break;
            case 'yearNew': list.sort((a, b) => Number(b.year) - Number(a.year)); break;
            case 'kmLow': {
                const km = (c) => Number(c.kilometers ?? c.mileage ?? 0);
                list.sort((a, b) => km(a) - km(b));
                break;
            }
            default: {
                const t = (c) => c.createdAt?.seconds || 0;
                list.sort((a, b) => t(b) - t(a));
            }
        }
        return list;
    }, [cars, filters, sort]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);
    const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    /* Active chips. setFilters and setPage are stable from useState, so the
       handlers close over them safely without needing a dep array entry. */
    const clearFilterValue = (updater) => {
        setFilters(updater);
        setPage(1);
    };
    const activeChips = useMemo(() => {
        const chips = [];
        if (filters.q) chips.push({ k: 'q', label: `"${filters.q}"`, clear: () => clearFilterValue(f => ({ ...f, q: '' })) });
        if (filters.price[0] !== PRICE_MIN || filters.price[1] !== PRICE_MAX) {
            const a = (filters.price[0] / 100000).toFixed(1);
            const b = (filters.price[1] / 100000).toFixed(1);
            chips.push({ k: 'price', label: `₹${a}L – ₹${b}L`, clear: () => clearFilterValue(f => ({ ...f, price: [PRICE_MIN, PRICE_MAX] })) });
        }
        if (filters.km[0] !== KM_MIN || filters.km[1] !== KM_MAX) {
            chips.push({
                k: 'km',
                label: `${filters.km[0].toLocaleString('en-IN')}–${filters.km[1].toLocaleString('en-IN')} km`,
                clear: () => clearFilterValue(f => ({ ...f, km: [KM_MIN, KM_MAX] })),
            });
        }
        ['makes', 'bodies', 'fuels', 'transmissions', 'owners', 'years'].forEach(group => {
            filters[group].forEach(v => chips.push({
                k: `${group}-${v}`,
                label: v,
                clear: () => clearFilterValue(f => ({ ...f, [group]: f[group].filter(x => x !== v) })),
            }));
        });
        if (filters.showSold) {
            chips.push({ k: 'sold', label: 'Incl. sold', clear: () => clearFilterValue(f => ({ ...f, showSold: false })) });
        }
        return chips;
    }, [filters]);

    const clearAll = () => {
        setFiltersAndResetPage({
            ...DEFAULT_FILTERS,
            price: [...DEFAULT_FILTERS.price],
            km: [...DEFAULT_FILTERS.km],
            makes: [], bodies: [], fuels: [], transmissions: [], owners: [], years: [],
        });
        setSort('newest');
    };

    /* Saved searches */
    const handleSaveSearch = () => {
        const name = window.prompt('Name this search', `Search ${savedSearches.length + 1}`);
        if (!name) return;
        const entry = { id: Date.now(), name, filters, sort };
        const next = [entry, ...savedSearches].slice(0, 8);
        setSavedSearches(next);
        persistSavedSearches(next);
        setSavedOpen(false);
    };

    const applySavedSearch = (entry) => {
        setFilters({
            ...DEFAULT_FILTERS,
            ...entry.filters,
            price: entry.filters.price || [...DEFAULT_FILTERS.price],
            km: entry.filters.km || [...DEFAULT_FILTERS.km],
        });
        setSort(entry.sort || 'newest');
        setPage(1);
        setSavedOpen(false);
    };

    const deleteSavedSearch = (id) => {
        const next = savedSearches.filter(s => s.id !== id);
        setSavedSearches(next);
        persistSavedSearches(next);
    };

    const currentSort = SORTS.find(s => s.id === sort) || SORTS[0];

    return (
        <div className="bg-ivory min-h-screen">
            <main className="pt-28 pb-24">
                <div className="max-w-[1480px] mx-auto px-6 md:px-12">

                    {/* Page header */}
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                        <div className="max-w-2xl">
                            <span className="inline-flex items-center gap-2 font-mono uppercase tracking-[0.18em] text-[10.5px] text-ink-muted">
                                <span className="inline-block w-4 h-px bg-ink/30" />
                                Inventory · Mysore
                            </span>
                            <h1 className="font-display font-normal text-ink mt-4 text-[48px] sm:text-[80px] lg:text-[112px] leading-[0.9] tracking-tightest">
                                Browse <em className="italic text-champagne">inventory.</em>
                            </h1>
                            <div className="mt-4 flex items-baseline gap-3 text-ink-muted">
                                <span className="font-display font-normal text-ink text-[28px] num">{filtered.length}</span>
                                <span className="text-[14px]">vehicle{filtered.length === 1 ? '' : 's'} {loading ? 'loading…' : 'available'}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                onClick={() => setDrawerOpen(true)}
                                className="lg:hidden inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 text-[13.5px]"
                            >
                                <SlidersHorizontal size={14} /> Filters
                                {activeChips.length > 0 && (
                                    <span className="num text-[10px] px-1.5 py-0.5 rounded-full bg-ink text-ivory">{activeChips.length}</span>
                                )}
                            </button>

                            {/* Saved searches */}
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={() => { setSavedOpen(s => !s); setSortOpen(false); }}
                                    className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 text-[13.5px] hover:bg-ink hover:text-ivory transition-colors"
                                >
                                    <Bookmark size={14} /> Saved
                                    {savedSearches.length > 0 && (
                                        <span className="num text-[10px] px-1.5 py-0.5 rounded-full bg-champagne text-ink">{savedSearches.length}</span>
                                    )}
                                </button>
                                {savedOpen && (
                                    <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-ink/10 bg-ivory shadow-xl overflow-hidden z-30">
                                        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                                            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">— Saved searches</span>
                                        </div>
                                        {savedSearches.length === 0 ? (
                                            <p className="px-4 pb-4 text-[12px] text-ink-faint">No saved searches yet.</p>
                                        ) : (
                                            <ul>
                                                {savedSearches.map(s => (
                                                    <li key={s.id} className="border-t border-ink/5 flex items-center group">
                                                        <button
                                                            onClick={() => applySavedSearch(s)}
                                                            className="flex-1 text-left px-4 py-3 hover:bg-ivory-soft"
                                                        >
                                                            <div className="text-[13.5px] text-ink truncate">{s.name}</div>
                                                        </button>
                                                        <button
                                                            onClick={() => deleteSavedSearch(s.id)}
                                                            aria-label="Delete saved search"
                                                            className="p-3 text-ink-faint hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        <button
                                            onClick={handleSaveSearch}
                                            disabled={activeChips.length === 0}
                                            className="w-full text-left px-4 py-3 hover:bg-ivory-soft border-t border-ink/5 text-[13px] flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <Plus size={13} /> Save current search
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Sort */}
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={() => { setSortOpen(s => !s); setSavedOpen(false); }}
                                    className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 text-[13.5px] hover:bg-ink hover:text-ivory transition-colors"
                                >
                                    <ArrowDownWideNarrow size={14} />
                                    {currentSort.label}
                                    <ChevronDown size={14} />
                                </button>
                                {sortOpen && (
                                    <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-ink/10 bg-ivory shadow-xl overflow-hidden z-30">
                                        {SORTS.map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => { setSort(s.id); setSortOpen(false); }}
                                                className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-ivory-soft flex items-center justify-between ${sort === s.id ? 'bg-ivory-soft' : ''}`}
                                            >
                                                {s.label}
                                                {sort === s.id && <Check size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Active chips */}
                    {activeChips.length > 0 && (
                        <div className="mt-10 flex items-center flex-wrap gap-2">
                            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">Active —</span>
                            {activeChips.map(c => (
                                <button
                                    key={c.k}
                                    onClick={c.clear}
                                    className="group inline-flex items-center gap-1.5 rounded-full bg-ink text-ivory px-3 py-1.5 text-[12px]"
                                >
                                    <span>{c.label}</span>
                                    <X size={12} className="opacity-70 group-hover:opacity-100" />
                                </button>
                            ))}
                            <button onClick={clearAll} className="link-u text-[12.5px] text-ink-muted ml-2">Clear all</button>
                        </div>
                    )}

                    <div className="mt-10 hairline" />

                    {/* Grid */}
                    <div className="mt-10 grid lg:grid-cols-12 gap-8">
                        {/* Desktop sidebar */}
                        <div className="hidden lg:block lg:col-span-3">
                            <div className="sticky top-24">
                                <FiltersPanel
                                    filters={filters}
                                    setFilters={setFiltersAndResetPage}
                                    availableMakes={availableMakes}
                                    availableYears={availableYears}
                                />
                            </div>
                        </div>

                        <div className="lg:col-span-9">
                            {loading ? (
                                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                                    {[1, 2, 3, 4, 5, 6].map(n => (
                                        <div key={n} className="rounded-2xl h-[460px] bg-white/40 border border-ink/10 animate-pulse" />
                                    ))}
                                </div>
                            ) : pageItems.length === 0 ? (
                                <EmptyState onClear={clearAll} />
                            ) : (
                                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                                    {pageItems.map(c => <EditorialCarCard key={c.id} car={c} />)}
                                </div>
                            )}

                            <Pagination
                                page={page}
                                total={totalPages}
                                onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            />
                        </div>
                    </div>

                    {/* Browse-by-brand chip strip below */}
                    {availableMakes.length > 0 && (
                        <div className="mt-20 pt-10 border-t border-ink/10">
                            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">Browse by brand —</span>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {availableMakes.map(b => {
                                    const active = filters.makes.includes(b);
                                    return (
                                        <button
                                            key={b}
                                            onClick={() => setFiltersAndResetPage(f => ({
                                                ...f,
                                                makes: active ? f.makes.filter(x => x !== b) : [...f.makes, b],
                                            }))}
                                            className={`chip rounded-full border px-4 py-2 text-[13px] transition-colors ${active ? 'bg-ink text-ivory border-ink' : 'bg-white/50 border-ink/15 hover:bg-ink hover:text-ivory hover:border-ink'}`}
                                        >
                                            {b}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Mobile drawer */}
            <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <div className="p-5">
                    <FiltersPanel
                        filters={filters}
                        setFilters={setFiltersAndResetPage}
                        availableMakes={availableMakes}
                        availableYears={availableYears}
                        onClose={() => setDrawerOpen(false)}
                    />
                    <div className="mt-5">
                        <button
                            onClick={() => setDrawerOpen(false)}
                            className="w-full rounded-full bg-ink text-ivory py-3 text-[14px] font-medium hover:bg-champagne-deep transition-colors"
                        >
                            Show {filtered.length} result{filtered.length === 1 ? '' : 's'}
                        </button>
                    </div>
                </div>
            </MobileDrawer>
        </div>
    );
};

export default BrowseCarsPage;
