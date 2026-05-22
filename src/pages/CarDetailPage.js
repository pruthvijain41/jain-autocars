import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { doc, getDoc, collection, getDocs, query, limit, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight, X, Phone, MessageCircle, Share2, Heart, GitCompareArrows,
    Calendar, Gauge, Fuel, Settings, MapPin, ShieldCheck, FileCheck2, RefreshCw,
    Award, Check, Eye, ArrowRight, ArrowLeft, ArrowUpRight, Expand, Images,
    User, Tag, CarFront, LayoutGrid, Cog, Zap, Palette, Armchair, Barcode,
    Flag, Calculator,
} from 'lucide-react';
import EditorialCarCard from '../components/cars/EditorialCarCard';
import InquiryForm from '../components/forms/InquiryForm';
import EmiCalculator from '../components/cars/EmiCalculator';
import TestDriveForm from '../components/forms/TestDriveForm';
import { isFavorite, toggleFavorite, isInCompare, toggleCompare, COMPARE_LIMIT } from '../utils/favorites';

const formatLakh = (price) => {
    if (price == null || isNaN(Number(price))) return '—';
    return (Number(price) / 100000).toFixed(2);
};

const Eyebrow = ({ children, className = '' }) => (
    <span className={`inline-flex items-center gap-2 font-mono uppercase tracking-[0.18em] text-[10.5px] text-ink-muted ${className}`}>
        <span className="inline-block w-4 h-px bg-ink/30" />
        {children}
    </span>
);

/* ============================================================
   Breadcrumbs
   ============================================================ */
const Breadcrumbs = ({ items }) => (
    <nav className="flex items-center flex-wrap gap-1 text-[12.5px] text-ink-muted">
        {items.map((it, i) => (
            <React.Fragment key={i}>
                {i > 0 && <ChevronRight size={12} className="text-ink-faint mx-0.5" />}
                {it.to ? (
                    <Link to={it.to} className="link-u text-ink-muted hover:text-ink">{it.label}</Link>
                ) : (
                    <span className="text-ink truncate max-w-[60vw]">{it.label}</span>
                )}
            </React.Fragment>
        ))}
    </nav>
);

/* ============================================================
   Gallery — real images + thumbnails + fullscreen viewer
   ============================================================ */
const Gallery = ({ car, isSold, isReserved }) => {
    const [active, setActive] = useState(0);
    const [zoom, setZoom] = useState(false);
    const images = car.imageUrls && car.imageUrls.length > 0 ? car.imageUrls : [];
    const hasImages = images.length > 0;

    const next = useCallback(() => {
        if (!hasImages) return;
        setActive(a => (a + 1) % images.length);
    }, [hasImages, images.length]);
    const prev = useCallback(() => {
        if (!hasImages) return;
        setActive(a => (a - 1 + images.length) % images.length);
    }, [hasImages, images.length]);

    useEffect(() => {
        if (!zoom) return;
        const onKey = (e) => {
            if (e.key === 'Escape') setZoom(false);
            if (e.key === 'ArrowRight') next();
            if (e.key === 'ArrowLeft') prev();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [zoom, next, prev]);

    const activeImage = images[active];
    const owner = car.ownership || car.owner;

    return (
        <div>
            <div className={`relative aspect-[16/10] rounded-2xl overflow-hidden border border-ink/10 group ${hasImages ? '' : 'car-ph'}`}>
                {hasImages ? (
                    <img
                        src={activeImage}
                        alt={`${car.year} ${car.make} ${car.model} – view ${active + 1}`}
                        className={`w-full h-full object-cover ${isSold ? 'grayscale' : ''}`}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-champagne/70">— {car.year} · {car.bodyType || 'Vehicle'} —</div>
                            <div className="font-display text-[60px] sm:text-[80px] leading-none mt-3 text-champagne-light">{car.make}</div>
                            <div className="font-display italic text-[20px] sm:text-[26px] text-ivory/40 mt-1">{car.model}</div>
                        </div>
                    </div>
                )}

                {/* Status overlay (sold) */}
                {isSold && (
                    <div className="absolute inset-0 bg-ink/30 flex items-center justify-center pointer-events-none">
                        <span className="bg-red-600 text-ivory text-sm font-bold uppercase tracking-[0.18em] px-5 py-2 rounded-full rotate-[-8deg] shadow-lg">Sold</span>
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-1.5 z-10">
                    {isReserved && (
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full bg-champagne text-ink shadow-md">Reserved</span>
                    )}
                    {owner && !isSold && (
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full bg-ivory/90 text-ink">{owner} owner</span>
                    )}
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full bg-ink/70 text-ivory backdrop-blur">JA Certified</span>
                </div>

                {hasImages && (
                    <button
                        onClick={() => setZoom(true)}
                        className="absolute top-4 right-4 inline-flex items-center gap-2 rounded-full bg-ink/60 hover:bg-ink text-ivory backdrop-blur px-3 py-1.5 text-[11.5px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Expand size={13} /> View fullscreen
                    </button>
                )}

                {hasImages && images.length > 1 && (
                    <>
                        <button
                            onClick={prev}
                            aria-label="Previous image"
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-ivory/95 hover:bg-ivory text-ink flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <ArrowLeft size={15} />
                        </button>
                        <button
                            onClick={next}
                            aria-label="Next image"
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-ivory/95 hover:bg-ivory text-ink flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <ArrowRight size={15} />
                        </button>
                    </>
                )}

                {hasImages && (
                    <div className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 text-ivory/90 text-[11px] bg-black/35 backdrop-blur px-2.5 py-1 rounded-full">
                        <Images size={11} />
                        <span className="num">{active + 1}</span>
                        <span className="text-ivory/55"> / </span>
                        <span className="num">{images.length}</span>
                    </div>
                )}
            </div>

            {/* Thumbnails */}
            {hasImages && images.length > 1 && (
                <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {images.map((url, i) => (
                        <button
                            key={i}
                            onClick={() => setActive(i)}
                            className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-colors ${i === active ? 'border-ink' : 'border-transparent hover:border-ink/30'}`}
                        >
                            <img src={url} alt={`Thumbnail ${i + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}

            {/* Fullscreen modal */}
            <AnimatePresence>
                {zoom && hasImages && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-ink/95 flex items-center justify-center p-4 sm:p-6"
                        onClick={() => setZoom(false)}
                    >
                        <button
                            onClick={(e) => { e.stopPropagation(); setZoom(false); }}
                            className="absolute top-5 right-5 w-11 h-11 rounded-full border border-ivory/25 text-ivory flex items-center justify-center hover:bg-ivory hover:text-ink transition-colors z-10"
                            aria-label="Close"
                        >
                            <X size={16} />
                        </button>

                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); prev(); }}
                                    aria-label="Previous"
                                    className="absolute left-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-ivory/25 text-ivory flex items-center justify-center hover:bg-ivory hover:text-ink transition-colors z-10"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); next(); }}
                                    aria-label="Next"
                                    className="absolute right-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-ivory/25 text-ivory flex items-center justify-center hover:bg-ivory hover:text-ink transition-colors z-10"
                                >
                                    <ArrowRight size={18} />
                                </button>
                            </>
                        )}

                        <img
                            src={activeImage}
                            alt={`${car.make} ${car.model} fullscreen`}
                            onClick={(e) => e.stopPropagation()}
                            className="max-w-full max-h-[88vh] object-contain rounded-2xl"
                        />

                        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 text-ivory/90 text-[11px] bg-black/40 backdrop-blur px-3 py-1 rounded-full">
                            <span className="num">{active + 1}</span>
                            <span className="text-ivory/55"> / </span>
                            <span className="num">{images.length}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ============================================================
   Section card wrapper
   ============================================================ */
const DetailCard = ({ kicker, title, italic, children, action }) => (
    <section className="rounded-3xl border border-ink/10 bg-white/55 p-6 md:p-10">
        <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
                <Eyebrow>{kicker}</Eyebrow>
                <h3 className="font-display font-normal text-ink text-[28px] sm:text-[36px] md:text-[48px] leading-[1] tracking-tightest mt-3">
                    {title} {italic && <em className="italic text-champagne">{italic}</em>}
                </h3>
            </div>
            {action}
        </div>
        <div className="mt-7">{children}</div>
    </section>
);

/* ============================================================
   Sticky purchase card
   ============================================================ */
const PurchaseCard = ({
    car, fav, inCompare, onFav, onCompare, onShare, onTestDrive,
    shareNotice, monthlyEmi,
}) => {
    const km = car.kilometers ?? car.mileage;
    const phoneDigits = '+919986619282';
    const whatsappText = encodeURIComponent(`Hi, I'm interested in the ${car.year} ${car.make} ${car.model} at Jain Autocars.`);
    const isSold = car.status === 'Sold';
    const isReserved = car.status === 'Reserved';

    return (
        <div className="rounded-3xl border border-ink/10 bg-white/60 backdrop-blur p-6 lg:p-7 shadow-[0_24px_60px_-30px_rgba(14,14,12,0.25)]">
            {/* header */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">{car.make}</div>
                    <h2 className="font-display font-normal text-ink text-[28px] md:text-[34px] leading-[1.05] mt-1 tracking-tightest truncate">
                        <span className="num">{car.year}</span> <em className="italic text-champagne">·</em> {car.model}
                    </h2>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={onFav}
                        aria-label={fav ? 'Remove from favorites' : 'Save to favorites'}
                        title={fav ? 'Remove from favorites' : 'Save to favorites'}
                        className={`w-10 h-10 rounded-full border border-ink/15 flex items-center justify-center transition-colors ${fav ? 'bg-red-500 text-ivory border-red-500' : 'hover:bg-ink hover:text-ivory'}`}
                    >
                        <Heart size={14} fill={fav ? 'currentColor' : 'none'} />
                    </button>
                    <button
                        onClick={onShare}
                        aria-label="Share"
                        title="Share"
                        className="w-10 h-10 rounded-full border border-ink/15 flex items-center justify-center hover:bg-ink hover:text-ivory transition-colors"
                    >
                        <Share2 size={14} />
                    </button>
                </div>
            </div>

            {shareNotice && (
                <div className="mt-3 text-[11.5px] text-ink-muted bg-ivory-soft/70 rounded-lg px-3 py-1.5 inline-block">
                    {shareNotice}
                </div>
            )}

            {/* meta */}
            <div className="mt-4 flex items-center gap-x-5 gap-y-1 flex-wrap text-[12.5px] text-ink-muted">
                <span className="inline-flex items-center gap-1.5"><MapPin size={12} /> Mysore</span>
                {typeof car.views === 'number' && car.views > 0 && (
                    <span className="inline-flex items-center gap-1.5"><Eye size={12} /> <span className="num">{car.views}</span> views</span>
                )}
                <span className="inline-flex items-center gap-1.5 text-champagne-deep"><ShieldCheck size={12} /> Verified</span>
            </div>

            {/* price */}
            <div className="mt-6 pt-6 border-t border-ink/10">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">Asking price</div>
                <div className="flex items-baseline gap-2 mt-1">
                    <div className="font-display font-normal text-ink text-[48px] md:text-[64px] leading-none tracking-tightest num">
                        ₹{formatLakh(car.price)}
                        <span className="text-[24px] md:text-[28px] text-ink-muted ml-1">L</span>
                    </div>
                </div>
                {monthlyEmi > 0 && (
                    <div className="mt-2 flex items-center justify-between text-[12.5px] text-ink-muted">
                        <span>EMI from <span className="text-ink num">₹{Math.round(monthlyEmi).toLocaleString('en-IN')}</span> / mo</span>
                        <a href="#emi" className="link-u">Calculator</a>
                    </div>
                )}
            </div>

            {/* 2x2 specs */}
            <div className="mt-6 grid grid-cols-2 gap-2">
                {[
                    { Icon: Gauge, l: 'KMs', v: km != null ? `${Number(km).toLocaleString('en-IN')} km` : '—' },
                    { Icon: Fuel, l: 'Fuel', v: car.fuelType || '—' },
                    { Icon: Settings, l: 'Transmission', v: car.transmission || '—' },
                    { Icon: Calendar, l: 'Year', v: String(car.year || '—') },
                ].map(s => (
                    <div key={s.l} className="rounded-xl border border-ink/10 bg-ivory-soft/50 px-3.5 py-3">
                        <div className="flex items-center gap-2 text-ink-faint">
                            <s.Icon size={13} />
                            <span className="font-mono text-[10px] uppercase tracking-[0.16em]">{s.l}</span>
                        </div>
                        <div className="text-[13.5px] mt-1 num truncate">{s.v}</div>
                    </div>
                ))}
            </div>

            {/* Compare toggle */}
            <button
                onClick={onCompare}
                className={`mt-3 w-full inline-flex items-center justify-center gap-2 rounded-full border py-2.5 text-[12.5px] font-medium transition-colors ${inCompare ? 'bg-ink text-ivory border-ink' : 'border-ink/15 hover:bg-ink hover:text-ivory'}`}
            >
                <GitCompareArrows size={14} />
                {inCompare ? 'In compare' : 'Add to compare'}
            </button>

            {/* actions */}
            <div className="mt-5 space-y-2.5">
                <a
                    href={`tel:${phoneDigits}`}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-ink text-ivory py-3.5 text-[14px] font-medium hover:bg-champagne-deep transition-colors"
                >
                    <Phone size={15} /> Call seller — +91 99866 19282
                </a>
                <a
                    href={`https://wa.me/919986619282?text=${whatsappText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#0f7a3e] hover:bg-[#0c6231] text-white py-3.5 text-[14px] font-medium transition-colors"
                >
                    <MessageCircle size={15} /> Chat on WhatsApp
                </a>
                <button
                    onClick={onTestDrive}
                    disabled={isSold}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-ink/20 hover:bg-ink hover:text-ivory py-3.5 text-[14px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Calendar size={15} /> {isSold ? 'Sold' : isReserved ? 'Reserved — still drive it' : 'Book a test drive'}
                </button>
            </div>

            {/* trust */}
            <div className="mt-5 rounded-2xl bg-ink text-ivory p-4 flex gap-3">
                <div className="w-9 h-9 rounded-full border border-ivory/20 shrink-0 flex items-center justify-center text-champagne">
                    <ShieldCheck size={15} />
                </div>
                <div>
                    <div className="font-medium text-[13.5px]">Verified by Jain Autocars</div>
                    <div className="text-[12px] text-ivory/65 mt-0.5 leading-relaxed">
                        150-point inspection passed · papers checked · service history on file. One-year warranty included.
                    </div>
                </div>
            </div>

            <div className="mt-5 flex items-center justify-between text-[12px] text-ink-muted">
                <span className="inline-flex items-center gap-1.5"><RefreshCw size={12} /> 5-day return</span>
                <span className="inline-flex items-center gap-1.5"><Award size={12} /> 1-yr warranty</span>
                <span className="inline-flex items-center gap-1.5"><FileCheck2 size={12} /> RTO handled</span>
            </div>
        </div>
    );
};

/* ============================================================
   Specs table
   ============================================================ */
const SpecsTable = ({ car }) => {
    const km = car.kilometers ?? car.mileage;
    const rows = [
        { l: 'Make', v: car.make, Icon: Tag },
        { l: 'Model', v: car.model, Icon: CarFront },
        { l: 'Year', v: car.year, Icon: Calendar },
        { l: 'Body type', v: car.bodyType, Icon: LayoutGrid },
        { l: 'Kilometers', v: km != null ? `${Number(km).toLocaleString('en-IN')} km` : null, Icon: Gauge },
        { l: 'Fuel', v: car.fuelType, Icon: Fuel },
        { l: 'Transmission', v: car.transmission, Icon: Settings },
        { l: 'Engine', v: car.engineSize, Icon: Cog },
        { l: 'Power', v: car.power, Icon: Zap },
        { l: 'Ownership', v: car.ownership || car.owner, Icon: User },
        { l: 'Exterior', v: car.exteriorColor || car.color, Icon: Palette },
        { l: 'Interior', v: car.interiorColor, Icon: Armchair },
        { l: 'Registration', v: car.registrationState, Icon: MapPin },
        { l: 'Insurance', v: car.insurance, Icon: ShieldCheck },
        { l: 'VIN', v: car.vin, Icon: Barcode },
    ].filter(r => r.v != null && r.v !== '');

    if (rows.length === 0) {
        return <p className="text-[14px] text-ink-muted">Detailed specifications coming soon.</p>;
    }

    return (
        <div className="grid sm:grid-cols-2 gap-x-10">
            {rows.map(r => (
                <div key={r.l} className="flex items-center justify-between gap-4 py-3 border-b border-ink/10 last:border-0">
                    <div className="flex items-center gap-2.5 text-ink-muted">
                        <r.Icon size={13} />
                        <span className="text-[13px]">{r.l}</span>
                    </div>
                    <div className="text-[13.5px] text-ink num text-right truncate">{String(r.v)}</div>
                </div>
            ))}
        </div>
    );
};

/* ============================================================
   Page
   ============================================================ */
const CarDetailPage = () => {
    const { carId } = useParams();
    const [car, setCar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [similarCars, setSimilarCars] = useState([]);
    const [shareNotice, setShareNotice] = useState(null);
    const [showReport, setShowReport] = useState(false);
    const [isTestDriveOpen, setIsTestDriveOpen] = useState(false);
    const [fav, setFav] = useState(false);
    const [inCompare, setInCompare] = useState(false);

    /* Favorite + compare sync */
    useEffect(() => {
        if (!carId) return;
        setFav(isFavorite(carId));
        setInCompare(isInCompare(carId));
        const handler = () => {
            setFav(isFavorite(carId));
            setInCompare(isInCompare(carId));
        };
        window.addEventListener('jain:storage', handler);
        return () => window.removeEventListener('jain:storage', handler);
    }, [carId]);

    const handleFavoriteToggle = useCallback(() => {
        if (!carId) return;
        setFav(toggleFavorite(carId));
    }, [carId]);

    const handleCompareToggle = useCallback(() => {
        if (!carId) return;
        const result = toggleCompare(carId);
        if (result === null) {
            alert(`You can compare up to ${COMPARE_LIMIT} cars at a time.`);
            return;
        }
        setInCompare(result);
    }, [carId]);

    /* Fetch + similar scoring (preserves existing logic) */
    useEffect(() => {
        const run = async () => {
            if (!carId) { setError('No car ID provided.'); setLoading(false); return; }
            setLoading(true); setCar(null); setSimilarCars([]);
            window.scrollTo(0, 0);
            try {
                const carDocSnap = await getDoc(doc(db, 'cars', carId));
                if (!carDocSnap.exists()) {
                    setError('Car not found.');
                    return;
                }
                const mainCar = { id: carDocSnap.id, ...carDocSnap.data() };
                setCar(mainCar);

                const candidatesSnap = await getDocs(query(collection(db, 'cars'), limit(40)));
                const price = Number(mainCar.price) || 0;
                const priceTolerance = price * 0.15 || 100000;
                const scored = candidatesSnap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(c => c.id !== carId && c.status !== 'Sold')
                    .map(c => {
                        let score = 0;
                        if (mainCar.make && c.make === mainCar.make) score += 3;
                        if (mainCar.bodyType && c.bodyType === mainCar.bodyType) score += 2;
                        if (mainCar.fuelType && c.fuelType === mainCar.fuelType) score += 1;
                        const priceDelta = Math.abs(Number(c.price || 0) - price);
                        if (priceDelta <= priceTolerance) score += 2;
                        else if (priceDelta <= priceTolerance * 2) score += 1;
                        return { car: c, score };
                    })
                    .sort((a, b) => b.score - a.score)
                    .map(s => s.car);
                setSimilarCars(scored.slice(0, 4));
            } catch (err) {
                console.error('Error fetching car details:', err);
                setError('Error fetching car details.');
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [carId]);

    /* View counter + recently-viewed (preserves existing logic) */
    const viewedRef = useRef(false);
    useEffect(() => {
        if (!car?.id || viewedRef.current) return;
        viewedRef.current = true;
        try {
            const viewedKey = 'jain:recentlyViewed';
            const list = JSON.parse(localStorage.getItem(viewedKey) || '[]');
            const next = [car.id, ...list.filter(id => id !== car.id)].slice(0, 8);
            localStorage.setItem(viewedKey, JSON.stringify(next));

            const stampKey = `jain:viewed:${car.id}`;
            const last = Number(localStorage.getItem(stampKey) || 0);
            const now = Date.now();
            if (now - last > 24 * 60 * 60 * 1000) {
                localStorage.setItem(stampKey, String(now));
                updateDoc(doc(db, 'cars', car.id), { views: increment(1) }).catch(() => { /* best-effort */ });
            }
        } catch (_) { /* ignore */ }
    }, [car?.id]);

    const handleShare = useCallback(async () => {
        if (!car) return;
        const url = window.location.href;
        const title = `${car.year} ${car.make} ${car.model} — Jain Autocars`;
        const text = `Check out this ${car.year} ${car.make} ${car.model} at Jain Autocars`;
        if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
                return;
            } catch (_) { /* fall through */ }
        }
        try {
            await navigator.clipboard.writeText(url);
            setShareNotice('Link copied to clipboard');
        } catch (_) {
            setShareNotice('Could not copy. Long-press the URL bar to copy.');
        }
        setTimeout(() => setShareNotice(null), 2500);
    }, [car]);

    /* Indicative EMI for the purchase card meta line */
    const indicativeEmi = useMemo(() => {
        if (!car?.price) return 0;
        const priceRupees = Number(car.price) || 0;
        const dp = priceRupees * 0.2;
        const loan = priceRupees - dp;
        const n = 60;
        const r = 9.25 / 100 / 12;
        if (loan <= 0) return 0;
        const pow = Math.pow(1 + r, n);
        return (loan * r * pow) / (pow - 1);
    }, [car?.price]);

    if (loading) {
        return (
            <div className="bg-ivory min-h-screen pt-32 pb-20">
                <div className="max-w-[1480px] mx-auto px-6 md:px-12">
                    <div className="grid lg:grid-cols-12 gap-10">
                        <div className="lg:col-span-8 space-y-6">
                            <div className="aspect-[16/10] rounded-2xl bg-white/40 border border-ink/10 animate-pulse" />
                            <div className="h-32 rounded-3xl bg-white/40 border border-ink/10 animate-pulse" />
                        </div>
                        <div className="lg:col-span-4">
                            <div className="h-[600px] rounded-3xl bg-white/40 border border-ink/10 animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !car) {
        return (
            <div className="bg-ivory min-h-screen flex flex-col items-center justify-center gap-5 px-6 text-center">
                <h2 className="font-display font-normal text-ink text-[48px] leading-tight tracking-tightest">
                    Car <em className="italic text-champagne">not found.</em>
                </h2>
                <p className="text-[14px] text-ink-muted max-w-md">
                    {error || 'This listing may have been removed.'}
                </p>
                <Link
                    to="/used-cars-in-mysore"
                    className="inline-flex items-center gap-2 rounded-full bg-ink text-ivory px-5 py-2.5 text-[13.5px] hover:bg-champagne-deep transition-colors"
                >
                    Browse inventory <ArrowRight size={14} />
                </Link>
            </div>
        );
    }

    const isSold = car.status === 'Sold';
    const isReserved = car.status === 'Reserved';
    const phoneHref = 'tel:+919986619282';
    const whatsappHref = `https://wa.me/919986619282?text=${encodeURIComponent(`Hi, I'm interested in the ${car.year} ${car.make} ${car.model} at Jain Autocars.`)}`;

    return (
        <div className="bg-ivory min-h-screen">
            <Helmet>
                <title>{`${car.year} ${car.make} ${car.model} — Jain Autocars`}</title>
            </Helmet>

            {/* Test drive modal */}
            <AnimatePresence>
                {isTestDriveOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-ink/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
                        onClick={() => setIsTestDriveOpen(false)}
                    >
                        <motion.div
                            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
                            className="bg-ivory text-ink rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-ink/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="sticky top-0 bg-ivory z-10 px-6 py-5 border-b border-ink/10 flex justify-between items-center">
                                <div>
                                    <Eyebrow>Book a test drive</Eyebrow>
                                    <div className="font-display italic text-[20px] text-ink mt-1">{car.year} {car.make} {car.model}</div>
                                </div>
                                <button
                                    onClick={() => setIsTestDriveOpen(false)}
                                    className="w-9 h-9 rounded-full border border-ink/15 flex items-center justify-center hover:bg-ink hover:text-ivory transition-colors"
                                    aria-label="Close"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="p-6">
                                <TestDriveForm
                                    carId={car.id}
                                    carName={`${car.year} ${car.make} ${car.model}`}
                                    onSuccess={() => setIsTestDriveOpen(false)}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="pt-24 pb-32 lg:pb-24">
                <div className="max-w-[1480px] mx-auto px-6 md:px-12">

                    {/* breadcrumbs */}
                    <div className="pt-6">
                        <Breadcrumbs items={[
                            { label: 'Home', to: '/' },
                            { label: 'Inventory', to: '/used-cars-in-mysore' },
                            { label: `${car.year} ${car.make} ${car.model}` },
                        ]} />
                    </div>

                    {/* Title block */}
                    <div className="mt-6 sm:mt-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                        <div>
                            <Eyebrow>Listing · #{car.id?.slice?.(0, 8) || ''}</Eyebrow>
                            <h1 className="font-display font-normal text-ink mt-3 text-[44px] sm:text-[80px] lg:text-[104px] leading-[0.9] tracking-tightest">
                                <span className="num">{car.year}</span> {car.make}
                                <br />
                                <em className="italic text-champagne">{car.model}</em>
                            </h1>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                onClick={handleFavoriteToggle}
                                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] transition-colors ${fav ? 'bg-red-500 text-ivory border-red-500' : 'border-ink/15 hover:bg-ink hover:text-ivory'}`}
                            >
                                <Heart size={13} fill={fav ? 'currentColor' : 'none'} /> {fav ? 'Saved' : 'Save'}
                            </button>
                            <button
                                onClick={handleCompareToggle}
                                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] transition-colors ${inCompare ? 'bg-ink text-ivory border-ink' : 'border-ink/15 hover:bg-ink hover:text-ivory'}`}
                            >
                                <GitCompareArrows size={13} /> {inCompare ? 'In compare' : 'Compare'}
                            </button>
                            <button
                                onClick={handleShare}
                                className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-[13px] hover:bg-ink hover:text-ivory transition-colors"
                            >
                                <Share2 size={13} /> Share
                            </button>
                        </div>
                    </div>

                    <div className="mt-10 hairline" />

                    {/* Main grid
                       Mobile order: Gallery → PurchaseCard → Highlights + Description + rest
                       Desktop: Gallery + content stacked in the 8-col left column with the
                                native space-y-8 rhythm, PurchaseCard sticky in the 4-col right
                                column (row-span-2). lg:gap-y-8 keeps the gallery-to-content
                                gap identical to the in-column spacing. */}
                    <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-y-8 gap-x-10 lg:gap-x-12">
                        {/* Gallery — mobile 1st, desktop top-left */}
                        <div className="order-1 lg:col-span-8">
                            <Gallery car={car} isSold={isSold} isReserved={isReserved} />
                        </div>

                        {/* PurchaseCard — mobile 2nd, desktop right column spanning both rows
                           (order-2 + row-span-2 places it at cols 9-12 of rows 1+2 on desktop) */}
                        <aside className="order-2 lg:col-span-4 lg:row-span-2">
                            <div className="lg:sticky lg:top-24">
                                <PurchaseCard
                                    car={car}
                                    fav={fav}
                                    inCompare={inCompare}
                                    onFav={handleFavoriteToggle}
                                    onCompare={handleCompareToggle}
                                    onShare={handleShare}
                                    onTestDrive={() => setIsTestDriveOpen(true)}
                                    shareNotice={shareNotice}
                                    monthlyEmi={indicativeEmi}
                                />
                            </div>
                        </aside>

                        {/* Everything else — mobile 3rd, desktop bottom-left */}
                        <div className="order-3 lg:col-span-8 space-y-8">
                            {/* Highlights strip */}
                            <div className="grid grid-cols-2 md:grid-cols-4 rounded-3xl border border-ink/10 bg-white/55 overflow-hidden">
                                {[
                                    { Icon: Gauge, l: 'KMs', v: (car.kilometers ?? car.mileage) != null ? `${((car.kilometers ?? car.mileage) / 1000).toFixed(1)}k` : '—' },
                                    { Icon: Fuel, l: 'Fuel', v: car.fuelType || '—' },
                                    { Icon: Settings, l: 'Transmission', v: car.transmission || '—' },
                                    { Icon: User, l: 'Ownership', v: car.ownership || car.owner ? `${car.ownership || car.owner} owner` : '—' },
                                ].map((s, i) => (
                                    <div
                                        key={s.l}
                                        className={`p-5 md:p-6 ${i > 0 ? 'border-t md:border-t-0 md:border-l border-ink/10' : ''} ${i === 2 ? 'border-t md:border-t-0 md:border-l border-ink/10' : ''} ${i === 1 ? 'border-l md:border-l border-ink/10' : ''} ${i === 3 ? 'border-l border-ink/10' : ''}`}
                                    >
                                        <div className="flex items-center gap-2 text-ink-muted">
                                            <s.Icon size={14} />
                                            <span className="font-mono text-[10px] uppercase tracking-[0.18em]">{s.l}</span>
                                        </div>
                                        <div className="font-display font-normal text-ink text-[24px] md:text-[28px] leading-none mt-2 num truncate">{s.v}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Description */}
                            {car.description && (
                                <DetailCard kicker="About this car" title="Vehicle" italic="description.">
                                    <div className="prose prose-sm max-w-none">
                                        {String(car.description).split(/\n\n+/).map((p, i) => (
                                            <p key={i} className={`text-[15px] leading-[1.7] text-ink/85 ${i > 0 ? 'mt-4' : ''}`}>{p}</p>
                                        ))}
                                    </div>
                                    <div className="mt-7 pt-6 border-t border-ink/10 grid sm:grid-cols-3 gap-4">
                                        {[
                                            { l: 'Owner', v: (car.ownership || car.owner) ? `${car.ownership || car.owner} owner` : 'On record', Icon: User },
                                            { l: 'Service history', v: 'Full · on file', Icon: FileCheck2 },
                                            { l: 'Accident report', v: 'No claims', Icon: ShieldCheck },
                                        ].map(b => (
                                            <div key={b.l} className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-ivory-soft border border-ink/10 flex items-center justify-center text-ink">
                                                    <b.Icon size={14} />
                                                </div>
                                                <div>
                                                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">{b.l}</div>
                                                    <div className="text-[13.5px]">{b.v}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </DetailCard>
                            )}

                            {/* Specs */}
                            <DetailCard kicker="The detail" title="Full" italic="specifications.">
                                <SpecsTable car={car} />
                            </DetailCard>

                            {/* Features */}
                            {Array.isArray(car.features) && car.features.length > 0 && (
                                <DetailCard kicker="What it comes with" title="Key" italic="features.">
                                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
                                        {car.features.map(f => (
                                            <div key={f} className="flex items-center gap-2.5 text-[14px]">
                                                <span className="shrink-0 w-5 h-5 rounded-full bg-ink text-champagne flex items-center justify-center">
                                                    <Check size={12} />
                                                </span>
                                                <span>{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                </DetailCard>
                            )}

                            {/* EMI */}
                            <div id="emi">
                                <DetailCard
                                    kicker="Make it yours"
                                    title="EMI"
                                    italic="calculator."
                                    action={<span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-faint">Indicative · pre-tax</span>}
                                >
                                    <EmiCalculator price={car.price} />
                                </DetailCard>
                            </div>

                            {/* Inquiry */}
                            <DetailCard kicker="Talk to us" title="Send an" italic="inquiry.">
                                <InquiryForm
                                    carId={car.id}
                                    carName={`${car.year} ${car.make} ${car.model}`}
                                    defaultType="buy"
                                    compact
                                />
                            </DetailCard>

                            {/* Report listing */}
                            <div className="text-center">
                                {!showReport ? (
                                    <button
                                        onClick={() => setShowReport(true)}
                                        className="inline-flex items-center gap-2 text-[13px] text-ink-muted hover:text-red-600 transition-colors"
                                    >
                                        <Flag size={13} /> Report this listing
                                    </button>
                                ) : (
                                    <div className="rounded-3xl border border-ink/10 bg-white/55 p-6 md:p-10 text-left">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <Eyebrow>Spot something off?</Eyebrow>
                                                <h3 className="font-display font-normal text-ink text-[28px] sm:text-[36px] leading-tight tracking-tightest mt-2">
                                                    Report <em className="italic text-champagne">this listing.</em>
                                                </h3>
                                            </div>
                                            <button
                                                onClick={() => setShowReport(false)}
                                                className="w-9 h-9 rounded-full border border-ink/15 flex items-center justify-center hover:bg-ink hover:text-ivory transition-colors"
                                                aria-label="Close"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <p className="text-[13.5px] text-ink-muted mb-5">
                                            Wrong price, incorrect details, or anything suspicious? Let us know.
                                        </p>
                                        <InquiryForm
                                            carId={car.id}
                                            carName={`${car.year} ${car.make} ${car.model}`}
                                            defaultType="report"
                                            compact
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Similar */}
                    {similarCars.length > 0 && (
                        <section className="mt-24">
                            <div className="flex items-end justify-between flex-wrap gap-6">
                                <div>
                                    <Eyebrow>You may also like</Eyebrow>
                                    <h2 className="font-display font-normal text-ink mt-3 text-[36px] sm:text-[56px] leading-[0.95] tracking-tightest">
                                        Similar <em className="italic text-champagne">vehicles.</em>
                                    </h2>
                                    <p className="mt-3 text-[14px] text-ink-muted max-w-md">More from this segment, available on our floor today.</p>
                                </div>
                                <Link
                                    to="/used-cars-in-mysore"
                                    className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-5 py-2 text-[13.5px] hover:bg-ink hover:text-ivory transition-colors"
                                >
                                    <ArrowUpRight size={14} /> All inventory
                                </Link>
                            </div>
                            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                {similarCars.map(c => <EditorialCarCard key={c.id} car={c} />)}
                            </div>
                        </section>
                    )}
                </div>
            </main>

            {/* Mobile sticky bottom bar */}
            <div
                className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-ivory/95 backdrop-blur border-t border-ink/10 px-4 py-3"
                style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
            >
                <div className="grid grid-cols-3 gap-2">
                    <a
                        href={phoneHref}
                        className="inline-flex items-center justify-center gap-1.5 rounded-full bg-ink text-ivory py-3 text-[12.5px] font-medium"
                    >
                        <Phone size={14} /> Call
                    </a>
                    <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#0f7a3e] text-white py-3 text-[12.5px] font-medium"
                    >
                        <MessageCircle size={14} /> WhatsApp
                    </a>
                    <button
                        onClick={() => setIsTestDriveOpen(true)}
                        disabled={isSold}
                        className="inline-flex items-center justify-center gap-1.5 rounded-full border border-ink/25 py-3 text-[12.5px] font-medium disabled:opacity-50"
                    >
                        <Calendar size={14} /> Test drive
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CarDetailPage;
