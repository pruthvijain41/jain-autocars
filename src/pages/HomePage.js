import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import {
    Search, ArrowRight, ArrowUpRight, ArrowLeft, ArrowDown,
    ShieldCheck, Award, FileCheck2, RefreshCw, Star,
    BadgeCheck, Wallet, FileSignature, UserX, Sparkles,
    Phone, Calendar, Clock, MapPin, Mail,
} from 'lucide-react';
import OfferModal from '../components/forms/OfferModal';
import EditorialCarCard from '../components/cars/EditorialCarCard';

import HeroEditorial from '../assets/images/hero_editorial.png';

/* ============================================================
   Small atoms reused throughout the page
   ============================================================ */

const Eyebrow = ({ children, dark = false, className = '' }) => (
    <span className={`inline-flex items-center gap-2 font-mono uppercase tracking-[0.18em] text-[10.5px] ${dark ? 'text-ivory/70' : 'text-ink-muted'} ${className}`}>
        <span className={`inline-block w-4 h-px ${dark ? 'bg-ivory/40' : 'bg-ink/30'}`} />
        {children}
    </span>
);

const PrimaryBtn = ({ children, icon: Icon = ArrowRight, onClick, dark = false, type = 'button', className = '' }) => {
    const cls = dark
        ? 'bg-ivory text-ink hover:bg-champagne hover:text-ink'
        : 'bg-ink text-ivory hover:bg-champagne-deep';
    return (
        <button type={type} onClick={onClick} className={`group inline-flex items-center gap-3 rounded-full pl-5 pr-2 py-2 text-[13.5px] font-medium transition-colors ${cls} ${className}`}>
            <span>{children}</span>
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-ink/10 group-hover:bg-ink/20 transition-colors">
                <Icon size={14} />
            </span>
        </button>
    );
};

const GhostBtn = ({ children, icon: Icon, onClick, dark = false, as: As = 'button', to, href, className = '' }) => {
    const cls = dark
        ? 'border-ivory/25 text-ivory hover:bg-ivory hover:text-ink'
        : 'border-ink/20 text-ink hover:bg-ink hover:text-ivory';
    const inner = (
        <>
            {Icon && <Icon size={14} />}
            <span>{children}</span>
        </>
    );
    const common = `inline-flex items-center gap-2 rounded-full border px-5 py-2 text-[13.5px] font-medium transition-colors ${cls} ${className}`;
    if (As === Link && to) return <Link to={to} className={common}>{inner}</Link>;
    if (href) return <a href={href} className={common}>{inner}</a>;
    return <button onClick={onClick} className={common}>{inner}</button>;
};

const SectionHeader = ({ kicker, title, italic, lead, dark = false, actions }) => (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="max-w-3xl">
            <Eyebrow dark={dark}>{kicker}</Eyebrow>
            <h2 className={`font-display font-normal mt-4 text-[44px] sm:text-[56px] lg:text-[72px] leading-[0.95] tracking-tightest ${dark ? 'text-ivory' : 'text-ink'}`}>
                {title}{' '}
                {italic && <em className="font-display italic text-champagne">{italic}</em>}
            </h2>
            {lead && <p className={`mt-5 text-[15px] leading-relaxed max-w-xl ${dark ? 'text-ivory/70' : 'text-ink-muted'}`}>{lead}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
);

const Reveal = ({ children, delay = 0, y = 24, className = '' }) => {
    const ref = useRef(null);
    const [vis, setVis] = useState(false);
    useEffect(() => {
        const el = ref.current; if (!el) return;
        const io = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) { setVis(true); io.disconnect(); }
        }, { rootMargin: '-60px' });
        io.observe(el); return () => io.disconnect();
    }, []);
    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: vis ? 1 : 0,
                transform: vis ? 'translateY(0)' : `translateY(${y}px)`,
                transition: `opacity 700ms cubic-bezier(.2,.7,.2,1) ${delay}s, transform 700ms cubic-bezier(.2,.7,.2,1) ${delay}s`,
                willChange: 'opacity, transform',
            }}
        >
            {children}
        </div>
    );
};

/* ============================================================
   Brands section with collapsible chip grid
   ============================================================ */

const BrandsSection = ({ brands }) => {
    const [expanded, setExpanded] = useState(false);
    const MOBILE_LIMIT = 5;
    const visibleMobile = expanded ? brands : brands.slice(0, MOBILE_LIMIT);
    const canCollapse = brands.length > MOBILE_LIMIT;

    return (
        <section className="bg-ivory py-16 md:py-24">
            <div className="max-w-[1480px] mx-auto px-6 md:px-12">
                <div className="flex items-end justify-between flex-wrap gap-6">
                    <div>
                        <Eyebrow>Browse by brand</Eyebrow>
                        <h3 className="font-display font-normal text-ink text-[32px] sm:text-[40px] md:text-[56px] leading-[0.95] mt-3 tracking-tightest">
                            {brands.length}+ makes. <em className="italic text-champagne">One floor.</em>
                        </h3>
                    </div>
                    <Link to="/used-cars-in-mysore" className="link-u text-[13.5px] inline-flex items-center gap-1.5">
                        See all brands <ArrowUpRight size={13} />
                    </Link>
                </div>

                {/* Mobile: collapsible list */}
                <div className="mt-8 md:hidden">
                    <div className="flex flex-wrap gap-2.5">
                        {visibleMobile.map(b => (
                            <Link
                                key={b}
                                to={`/used-cars-in-mysore?makes=${encodeURIComponent(b)}`}
                                className="chip rounded-full border border-ink/15 px-5 py-2.5 text-[13.5px] bg-white/50 hover:bg-ink hover:text-ivory hover:border-ink"
                            >
                                {b}
                            </Link>
                        ))}
                    </div>
                    {canCollapse && (
                        <button
                            type="button"
                            onClick={() => setExpanded(e => !e)}
                            className="mt-5 inline-flex items-center gap-1.5 link-u text-[13px] text-ink-muted hover:text-ink"
                        >
                            {expanded
                                ? <>Show less</>
                                : <>Show {brands.length - MOBILE_LIMIT} more</>}
                        </button>
                    )}
                </div>

                {/* Desktop / tablet: full grid */}
                <div className="mt-10 hidden md:flex flex-wrap gap-2.5">
                    {brands.map(b => (
                        <Link
                            key={b}
                            to={`/used-cars-in-mysore?makes=${encodeURIComponent(b)}`}
                            className="chip rounded-full border border-ink/15 px-5 py-2.5 text-[13.5px] bg-white/50 hover:bg-ink hover:text-ivory hover:border-ink"
                        >
                            {b}
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* ============================================================
   Horizontal scroll rail with prev / next controls
   ============================================================ */

const ScrollRail = ({ children, dark = false }) => {
    const ref = useRef(null);
    const scroll = (dir) => {
        const el = ref.current; if (!el) return;
        el.scrollBy({ left: dir * 420, behavior: 'smooth' });
    };
    return (
        <div className="relative">
            <div ref={ref} className="no-scrollbar overflow-x-auto -mx-6 px-6 md:-mx-12 md:px-12">
                <div className="flex gap-5 pb-2">{children}</div>
            </div>
            <div className="hidden md:flex absolute -top-16 right-0 gap-2">
                <button
                    onClick={() => scroll(-1)}
                    aria-label="Previous"
                    className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${dark ? 'border-ivory/20 text-ivory/80 hover:bg-ivory hover:text-ink' : 'border-ink/20 text-ink hover:bg-ink hover:text-ivory'}`}
                >
                    <ArrowLeft size={15} />
                </button>
                <button
                    onClick={() => scroll(1)}
                    aria-label="Next"
                    className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${dark ? 'border-ivory/20 text-ivory/80 hover:bg-ivory hover:text-ink' : 'border-ink/20 text-ink hover:bg-ink hover:text-ivory'}`}
                >
                    <ArrowRight size={15} />
                </button>
            </div>
        </div>
    );
};

/* ============================================================
   Page
   ============================================================ */

const QUICK_CHIPS = [
    { label: 'Under ₹5L', to: '/used-cars-in-mysore?priceMax=500000' },
    { label: '₹5L – ₹10L', to: '/used-cars-in-mysore?priceMin=500000&priceMax=1000000' },
    { label: '₹10L – ₹20L', to: '/used-cars-in-mysore?priceMin=1000000&priceMax=2000000' },
    { label: 'Diesel', to: '/used-cars-in-mysore?fuelType=Diesel' },
    { label: 'Automatic', to: '/used-cars-in-mysore?transmission=Automatic' },
    { label: 'SUVs', to: '/used-cars-in-mysore?bodyType=SUV' },
    { label: 'Sedans', to: '/used-cars-in-mysore?bodyType=Sedan' },
    { label: '1st Owner', to: '/used-cars-in-mysore?owners=1st+Owner' },
];

const HomePage = () => {
    const [featuredCars, setFeaturedCars] = useState([]);
    const [allCars, setAllCars] = useState([]);
    const [recentlyViewed, setRecentlyViewed] = useState([]);
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSellOpen, setIsSellOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const carsRef = collection(db, 'cars');
                const allCarsSnap = await getDocs(query(carsRef, orderBy('createdAt', 'desc')));
                const allCarsData = allCarsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                setAllCars(allCarsData);

                const featured = allCarsData.filter(c => c.featured && c.status !== 'Sold');
                const fallback = allCarsData.filter(c => c.status !== 'Sold').slice(0, 6);
                setFeaturedCars((featured.length > 0 ? featured : fallback).slice(0, 8));

                const testimonialsRef = collection(db, 'testimonials');
                const testimonialsQuery = query(testimonialsRef, where('approved', '==', true), orderBy('createdAt', 'desc'));
                const testimonialsSnapshot = await getDocs(testimonialsQuery);
                const testimonialsData = testimonialsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    const date = data.createdAt
                        ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                        : '';
                    return { id: doc.id, ...data, text: data.text || data.testimonial, date };
                });
                setTestimonials(testimonialsData);

                try {
                    const ids = JSON.parse(localStorage.getItem('jain:recentlyViewed') || '[]');
                    const map = new Map(allCarsData.map(c => [c.id, c]));
                    const found = ids.map(id => map.get(id)).filter(Boolean);
                    setRecentlyViewed(found.slice(0, 6));
                } catch (_) {
                    setRecentlyViewed([]);
                }
            } catch (error) {
                console.error('Error fetching homepage data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const brands = useMemo(() => {
        const set = new Set();
        allCars.forEach(c => c.make && set.add(c.make));
        return Array.from(set).sort();
    }, [allCars]);

    const stats = useMemo(() => {
        const inStock = allCars.filter(c => c.status !== 'Sold').length;
        const soldCount = allCars.filter(c => c.status === 'Sold').length;
        const happyCustomers = testimonials.length;
        const totalCars = allCars.length;
        return { inStock, soldCount, happyCustomers, totalCars };
    }, [allCars, testimonials]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) navigate(`/used-cars-in-mysore?search=${encodeURIComponent(searchTerm)}`);
        else navigate('/used-cars-in-mysore');
    };

    const sellItems = [
        { icon: BadgeCheck, t: 'Honest valuation', d: 'Priced by certified evaluators using live market data — no lowballing.' },
        { icon: Wallet, t: 'Instant payment', d: 'Paid on the spot via bank transfer the moment paperwork is signed.' },
        { icon: FileSignature, t: 'RTO handled by us', d: 'Form 28/29/30, NOC, ownership transfer — we do every step.' },
        { icon: UserX, t: 'No middlemen', d: 'Direct deal with the dealership. The number we quote is the number you get.' },
    ];

    const whyCards = [
        { icon: ShieldCheck, n: '01', t: '150-point inspection', d: 'Engine, transmission, electricals, body, interiors and underbody — every car is signed off by a certified evaluator before it touches the floor.' },
        { icon: Award, n: '02', t: 'Transparent pricing', d: 'A single, honest number anchored to market data. No "on-road extras", no inflated processing fees, no negotiation theatre.' },
        { icon: RefreshCw, n: '03', t: 'Lifetime support', d: 'A dedicated relationship manager, free service consults and priority callbacks for as long as you own the car.' },
    ];

    const marqueeBrands = brands.length > 0
        ? brands
        : ['Maruti Suzuki', 'Hyundai', 'Honda', 'Toyota', 'BMW', 'Mercedes-Benz', 'Audi', 'Volvo', 'Kia', 'Mahindra'];

    return (
        <div className="bg-ivory text-ink">
            {/* ============================================
               HERO
               ============================================ */}
            <section className="relative min-h-[100svh] hero-ph text-ivory overflow-hidden grain">
                {/* fine vertical grid lines */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.07]" style={{
                    backgroundImage: 'linear-gradient(to right, #F4F0E8 1px, transparent 1px)',
                    backgroundSize: '120px 100%',
                }} />

                {/* Hero image block (right side) */}
                <div className="absolute right-[-6%] bottom-[6%] w-[64%] h-[58%] hidden md:block opacity-95">
                    <div className="absolute inset-0 rounded-[40px] overflow-hidden">
                        <img
                            src={HeroEditorial}
                            alt="Premium pre-owned car"
                            className="w-full h-full object-cover object-center"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-ink/40 via-transparent to-transparent" />
                    </div>
                    <div className="absolute inset-0 flex items-end p-8 pointer-events-none">
                        <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-ivory/40">[ premium · selection · 2026 ]</div>
                    </div>
                </div>

                <div className="relative max-w-[1480px] mx-auto px-6 md:px-12 pt-32 md:pt-40 pb-20">
                    <Reveal>
                        <div className="inline-flex items-center gap-2 rounded-full border border-ivory/20 bg-ivory/5 backdrop-blur px-3 py-1.5 text-[11.5px]">
                            <Star size={12} className="text-champagne" />
                            <span className="text-ivory/85">Premium pre-owned cars in Mysore</span>
                            <span className="text-ivory/40">·</span>
                            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ivory/60">since 2011</span>
                        </div>
                    </Reveal>

                    <Reveal delay={0.06}>
                        <h1 className="font-display font-normal text-ivory mt-7 text-[64px] sm:text-[88px] md:text-[120px] lg:text-[148px] leading-[0.88] tracking-tightest">
                            Elevate
                            <br />
                            your <em className="italic text-champagne">drive.</em>
                        </h1>
                    </Reveal>

                    <Reveal delay={0.12}>
                        <p className="mt-6 max-w-xl text-[15.5px] leading-relaxed text-ivory/70">
                            A curated collection of quality pre-owned vehicles — every car inspected on 150 points,
                            priced transparently and backed by a dealership that stays in touch long after delivery.
                        </p>
                    </Reveal>

                    {/* Search */}
                    <Reveal delay={0.18}>
                        <form onSubmit={handleSearchSubmit} className="mt-9 max-w-2xl">
                            <div className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-ivory text-ink p-1.5 sm:p-2 pl-4 sm:pl-5 shadow-editorial">
                                <Search size={16} className="text-ink-muted shrink-0" />
                                <input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder='Search make, model…'
                                    aria-label="Search inventory"
                                    className="flex-1 min-w-0 bg-transparent placeholder:text-ink-faint text-[14px] py-2 outline-none border-0 focus:ring-0"
                                />
                                <button
                                    type="submit"
                                    aria-label="Search"
                                    className="inline-flex items-center justify-center gap-2 rounded-full bg-ink text-ivory px-4 sm:px-5 py-2 sm:py-2.5 text-[13.5px] hover:bg-champagne-deep transition-colors shrink-0"
                                >
                                    <span className="hidden sm:inline">Search</span>
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </form>
                    </Reveal>

                    {/* Chips */}
                    <Reveal delay={0.24}>
                        <div className="mt-6 flex items-center gap-3 flex-wrap">
                            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ivory/50">Popular —</span>
                            {QUICK_CHIPS.map(c => (
                                <Link
                                    key={c.label}
                                    to={c.to}
                                    className="chip inline-flex items-center gap-2 rounded-full border border-ivory/15 text-ivory/85 hover:bg-ivory hover:text-ink px-3.5 py-1.5 text-[12.5px]"
                                >
                                    {c.label}
                                </Link>
                            ))}
                        </div>
                    </Reveal>

                    {/* Trust */}
                    <Reveal delay={0.32}>
                        <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-[12.5px] text-ivory/70">
                            <div className="flex items-center gap-2"><ShieldCheck size={14} className="text-champagne" /> 150-point check</div>
                            <div className="flex items-center gap-2"><Award size={14} className="text-champagne" /> 1-year warranty included</div>
                            <div className="flex items-center gap-2"><FileCheck2 size={14} className="text-champagne" /> Verified ownership & service history</div>
                            <div className="flex items-center gap-2"><RefreshCw size={14} className="text-champagne" /> 5-day no-questions return</div>
                        </div>
                    </Reveal>

                    {/* Bottom corners */}
                    <div className="hidden md:flex absolute bottom-8 left-12 items-center gap-3 text-ivory/60">
                        <div className="w-10 h-10 rounded-full border border-ivory/20 flex items-center justify-center"><ArrowDown size={14} /></div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.2em]">Scroll · explore inventory</div>
                    </div>
                    <div className="hidden md:flex absolute bottom-8 right-12 items-end gap-6 text-ivory/60">
                        <div className="text-right">
                            <div className="font-mono text-[10px] uppercase tracking-[0.2em]">Live</div>
                            <div className="font-display text-[28px] leading-none text-ivory num">
                                {loading ? '—' : stats.inStock}<span className="text-champagne">+</span>
                            </div>
                            <div className="text-[11px]">cars on the floor</div>
                        </div>
                        <div className="w-px h-12 bg-ivory/15" />
                        <div className="text-right">
                            <div className="font-mono text-[10px] uppercase tracking-[0.2em]">Today</div>
                            <div className="font-display text-[28px] leading-none text-ivory num">9<span className="text-champagne">·</span>30 – 8<span className="text-champagne">·</span>00</div>
                            <div className="text-[11px]">open in Mysore</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================
               BRAND MARQUEE
               ============================================ */}
            <section className="bg-ink text-ivory/70 py-6 border-y border-ivory/10 overflow-hidden">
                <div className="flex items-center gap-12">
                    <div className="pl-6 md:pl-12 font-mono text-[10px] uppercase tracking-[0.22em] whitespace-nowrap text-ivory/45">
                        Stocked brands —
                    </div>
                    <div className="overflow-hidden flex-1">
                        <div className="marquee-track inline-flex gap-12 whitespace-nowrap">
                            {[...marqueeBrands, ...marqueeBrands].map((b, i) => (
                                <span key={i} className="font-display text-[28px] tracking-tight">
                                    {b} <span className="text-champagne/70">·</span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================
               WHY US
               ============================================ */}
            <section id="why" className="bg-ivory py-24 md:py-36">
                <div className="max-w-[1480px] mx-auto px-6 md:px-12">
                    <SectionHeader
                        kicker="Why Jain Autocars"
                        title="Excellence in"
                        italic="every detail."
                        lead="Used cars have a trust problem. We have spent fifteen years solving it — with rigorous checks, plain-English paperwork and a team that picks up the phone long after delivery."
                    />

                    <div className="mt-12 md:mt-16 grid md:grid-cols-3 gap-4">
                        {whyCards.map((c, i) => (
                            <Reveal key={c.n} delay={i * 0.08}>
                                <div className="group relative h-full rounded-3xl border border-ink/10 bg-white/50 p-8 overflow-hidden lift">
                                    <div className="absolute top-6 right-6 font-mono text-[11px] tracking-[0.2em] text-ink-faint">— {c.n}</div>
                                    <div className="w-12 h-12 rounded-full border border-ink/20 flex items-center justify-center text-ink">
                                        <c.icon size={20} />
                                    </div>
                                    <h3 className="font-display font-normal text-ink text-[30px] md:text-[34px] leading-tight mt-6">{c.t}</h3>
                                    <p className="mt-3 text-[14.5px] leading-relaxed text-ink-muted">{c.d}</p>
                                    <div className="mt-8 pt-5 border-t border-ink/10 flex items-center justify-between text-[12.5px]">
                                        <span className="font-mono uppercase tracking-[0.2em] text-ink-faint">Promise</span>
                                        <Link to="/contact" className="link-u inline-flex items-center gap-1">Talk to us <ArrowUpRight size={13} /></Link>
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============================================
               FEATURED
               ============================================ */}
            <section id="inventory" className="bg-ink text-ivory py-24 md:py-36 relative">
                <div className="max-w-[1480px] mx-auto px-6 md:px-12">
                    <SectionHeader
                        dark
                        kicker="Featured vehicles"
                        title="This week,"
                        italic="on the floor."
                        lead="A rotating selection from our showroom — hand-picked for condition, history and value. Swipe to explore the full set."
                        actions={<GhostBtn dark icon={ArrowRight} as={Link} to="/used-cars-in-mysore">View all inventory</GhostBtn>}
                    />

                    <div className="mt-12 md:mt-16">
                        <ScrollRail dark>
                            {loading
                                ? [1, 2, 3, 4].map(n => (
                                    <div key={n} className="shrink-0 w-[300px] sm:w-[340px] md:w-[420px] h-[460px] rounded-2xl border border-ivory/10 bg-ink-soft animate-pulse" />
                                ))
                                : featuredCars.length > 0
                                    ? featuredCars.map(car => <EditorialCarCard key={car.id} car={car} variant="rail" dark size="lg" />)
                                    : (
                                        <div className="shrink-0 w-full text-ivory/60 py-12 text-center">
                                            <p className="font-display text-[28px] italic text-ivory/70">No cars on the floor right now — check back soon.</p>
                                        </div>
                                    )
                            }
                            {/* Trailing CTA */}
                            <Link
                                to="/used-cars-in-mysore"
                                className="shrink-0 w-[300px] md:w-[340px] rounded-2xl border border-ivory/15 bg-ivory/5 hover:bg-ivory hover:text-ink transition-colors group flex flex-col justify-between p-7"
                            >
                                <div>
                                    <Eyebrow dark>Browse</Eyebrow>
                                    <div className="font-display text-[40px] leading-[0.95] mt-4">
                                        All <em className="italic text-champagne group-hover:text-champagne-deep">vehicles</em>
                                    </div>
                                    <p className="mt-3 text-[13.5px] text-ivory/65 group-hover:text-ink-muted">Filter by budget, body, fuel, transmission and year.</p>
                                </div>
                                <div className="flex items-center justify-between mt-10">
                                    <span className="font-mono text-[11px] uppercase tracking-[0.2em]">{stats.totalCars || '—'} cars</span>
                                    <span className="w-12 h-12 rounded-full bg-ivory text-ink group-hover:bg-ink group-hover:text-ivory flex items-center justify-center transition-colors">
                                        <ArrowRight size={16} />
                                    </span>
                                </div>
                            </Link>
                        </ScrollRail>
                    </div>

                    {/* Body type chips */}
                    <div className="mt-14 flex flex-wrap items-center gap-3">
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ivory/45">Browse by body —</span>
                        {['Sedan', 'SUV', 'Hatchback', 'MUV', 'Coupe', 'Convertible'].map(b => (
                            <Link
                                key={b}
                                to={`/used-cars-in-mysore?bodyType=${encodeURIComponent(b)}`}
                                className="chip inline-flex items-center gap-2 rounded-full border border-ivory/15 text-ivory/85 hover:bg-ivory hover:text-ink px-3.5 py-1.5 text-[12.5px]"
                            >
                                {b}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============================================
               STATS
               ============================================ */}
            <section className="bg-ivory py-16 md:py-28 border-y border-ink/10">
                <div className="max-w-[1480px] mx-auto px-6 md:px-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 md:gap-y-0">
                        {[
                            { num: loading ? '—' : `${stats.inStock}${stats.inStock > 0 ? '+' : ''}`, label: 'Cars in stock', sub: 'curated every week' },
                            { num: loading ? '—' : (stats.happyCustomers > 0 ? `${stats.happyCustomers}+` : 'New'), label: 'Happy customers', sub: 'reviews on Google' },
                            { num: loading ? '—' : `${stats.soldCount || 0}+`, label: 'Cars delivered', sub: 'across Karnataka' },
                            { num: '150', label: 'Point inspection', sub: 'on every vehicle' },
                        ].map((s, i) => (
                            <Reveal key={s.label} delay={i * 0.07}>
                                <div className={`px-4 sm:px-6 md:px-8 ${i % 2 === 1 ? 'border-l border-ink/10' : ''} ${i > 0 ? 'md:border-l md:border-ink/10' : ''}`}>
                                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">— {String(i + 1).padStart(2, '0')}</div>
                                    <div className="font-display text-[44px] sm:text-[56px] md:text-[88px] leading-none mt-3 tracking-tightest num">
                                        {s.num}
                                    </div>
                                    <div className="mt-3 font-medium text-[14.5px]">{s.label}</div>
                                    <div className="text-[12.5px] text-ink-muted">{s.sub}</div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============================================
               BRANDS GRID
               ============================================ */}
            {brands.length > 0 && (
                <BrandsSection brands={brands} />
            )}

            {/* ============================================
               RECENTLY VIEWED
               ============================================ */}
            {recentlyViewed.length > 0 && (
                <section className="bg-ivory-soft py-20 md:py-28 border-t border-ink/5">
                    <div className="max-w-[1480px] mx-auto px-6 md:px-12">
                        <SectionHeader
                            kicker="Recently viewed"
                            title="Pick up"
                            italic="where you left off."
                            lead="The cars you spent time with, still here. Saved to this device — no account required."
                            actions={<Link to="/favorites" className="link-u text-[13.5px] inline-flex items-center gap-1.5">View saved <ArrowUpRight size={13} /></Link>}
                        />
                        <div className="mt-12 md:mt-16">
                            <ScrollRail>
                                {recentlyViewed.map(c => <EditorialCarCard key={c.id} car={c} variant="rail" />)}
                            </ScrollRail>
                        </div>
                    </div>
                </section>
            )}

            {/* ============================================
               STORIES / TESTIMONIALS
               ============================================ */}
            {testimonials.length > 0 && (
                <section id="stories" className="bg-ivory py-24 md:py-36">
                    <div className="max-w-[1480px] mx-auto px-6 md:px-12">
                        <SectionHeader
                            kicker="Customer stories"
                            title="Real drivers,"
                            italic="real deliveries."
                            lead="Reviews are easy to fake. We share full names, the car they bought, and the month — verify it yourself."
                        />
                        <div className="mt-12 md:mt-16 grid md:grid-cols-3 gap-4">
                            {[...testimonials]
                                .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
                                .slice(0, 3)
                                .map((t, i) => (
                                    <Reveal key={t.id} delay={i * 0.07}>
                                        <article className="h-full rounded-3xl border border-ink/10 bg-white/50 p-8 flex flex-col">
                                            <div className="flex items-center gap-1 text-champagne">
                                                {Array.from({ length: 5 }).map((_, k) => (
                                                    <Star key={k} size={14} fill={k < (t.rating || 5) ? 'currentColor' : 'none'} />
                                                ))}
                                                <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">— {(t.rating || 5).toFixed?.(1) || t.rating || '5.0'}</span>
                                            </div>
                                            <p className="font-display italic text-[22px] md:text-[24px] leading-[1.25] mt-6 text-ink">
                                                "{t.text}"
                                            </p>
                                            <div className="mt-auto pt-8 flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-full bg-ink text-ivory font-display text-[20px] flex items-center justify-center">
                                                    {(t.name || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-[14px]">{t.name}</div>
                                                    <div className="text-[12px] text-ink-muted">{t.date}</div>
                                                </div>
                                            </div>
                                        </article>
                                    </Reveal>
                                ))}
                        </div>
                        <div className="mt-10 flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-3 text-[13px] text-ink-muted">
                                <div className="flex items-center gap-1 text-champagne">
                                    {Array.from({ length: 5 }).map((_, k) => <Star key={k} size={13} />)}
                                </div>
                                <span><span className="text-ink font-medium">{testimonials.length}</span> verified review{testimonials.length === 1 ? '' : 's'}</span>
                            </div>
                            <Link to="/contact" className="link-u text-[13px] inline-flex items-center gap-1.5">Share your story <ArrowUpRight size={13} /></Link>
                        </div>
                    </div>
                </section>
            )}

            {/* ============================================
               SELL YOUR CAR
               ============================================ */}
            <section id="sell" className="bg-ink text-ivory py-24 md:py-36 relative overflow-hidden grain">
                <div className="absolute -top-12 -right-8 font-display text-[280px] md:text-[420px] leading-none text-ivory/[0.03] select-none pointer-events-none">07</div>

                <div className="relative max-w-[1480px] mx-auto px-6 md:px-12 grid lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-7">
                        <div className="inline-flex items-center gap-2 rounded-full border border-champagne/40 bg-champagne/10 px-3 py-1.5 text-[11.5px] text-champagne-light">
                            <Sparkles size={12} /> Sell to Jain Autocars
                        </div>
                        <h2 className="font-display font-normal text-ivory mt-6 text-[48px] sm:text-[80px] lg:text-[104px] leading-[0.9] tracking-tightest">
                            Looking to <em className="italic text-champagne">sell</em>
                            <br />your car?
                        </h2>
                        <p className="mt-6 max-w-xl text-[15.5px] leading-relaxed text-ivory/70">
                            Get a fair, written offer from our valuation team — in under 45 minutes at our Mysore showroom,
                            or share details online and get a quote by tomorrow. If you accept, we handle the rest.
                        </p>

                        <div className="mt-10 grid sm:grid-cols-2 gap-x-8 gap-y-6 max-w-2xl">
                            {sellItems.map(it => (
                                <div key={it.t} className="flex gap-4">
                                    <div className="shrink-0 w-10 h-10 rounded-full border border-ivory/20 flex items-center justify-center text-champagne">
                                        <it.icon size={16} />
                                    </div>
                                    <div>
                                        <div className="font-display text-[22px] leading-tight">{it.t}</div>
                                        <div className="text-[13px] text-ivory/65 leading-relaxed mt-1">{it.d}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 flex flex-wrap items-center gap-3">
                            <PrimaryBtn dark onClick={() => setIsSellOpen(true)} icon={ArrowRight}>Get an offer</PrimaryBtn>
                            <GhostBtn dark icon={Phone} href="tel:+919986619282">+91 99866 19282</GhostBtn>
                            <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ivory/45">avg. quote · under 45 min</span>
                        </div>
                    </div>

                    {/* Side card */}
                    <div className="lg:col-span-5">
                        <div className="rounded-3xl border border-ivory/10 bg-ivory/[0.04] backdrop-blur p-7">
                            <div className="flex items-center justify-between">
                                <Eyebrow dark>Quick estimate</Eyebrow>
                                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ivory/40">step 1 / 3</span>
                            </div>
                            <h3 className="font-display font-normal text-ivory text-[28px] md:text-[32px] leading-tight mt-4">What are you driving?</h3>

                            <div className="mt-6 space-y-3">
                                <div className="rounded-2xl border border-ivory/15 px-4 py-3">
                                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ivory/50">Make · Model</div>
                                    <div className="text-[15px] mt-1 text-ivory/80">e.g. Hyundai Creta SX</div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl border border-ivory/15 px-4 py-3">
                                        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ivory/50">Year</div>
                                        <div className="text-[15px] mt-1 text-ivory/80 num">2021</div>
                                    </div>
                                    <div className="rounded-2xl border border-ivory/15 px-4 py-3">
                                        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ivory/50">KMs driven</div>
                                        <div className="text-[15px] mt-1 text-ivory/80 num">38,200</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsSellOpen(true)}
                                    className="w-full rounded-2xl border border-ivory/15 px-4 py-3 flex items-center justify-between hover:bg-ivory/5 transition-colors"
                                >
                                    <div className="text-left">
                                        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ivory/50">Get my offer</div>
                                        <div className="font-display text-[22px] leading-tight mt-1">Start in 60 seconds</div>
                                    </div>
                                    <span className="w-11 h-11 rounded-full bg-champagne text-ink flex items-center justify-center hover:bg-champagne-light transition-colors">
                                        <ArrowRight size={16} />
                                    </span>
                                </button>
                            </div>

                            <p className="mt-5 text-[11.5px] text-ivory/45">
                                Indicative only. Final offer after a 20-minute physical inspection at our showroom.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================
               FINAL CTA
               ============================================ */}
            <section id="visit" className="bg-ivory py-24 md:py-40">
                <div className="max-w-[1480px] mx-auto px-6 md:px-12">
                    <div className="grid lg:grid-cols-12 gap-12 items-end">
                        <div className="lg:col-span-8">
                            <Eyebrow>Visit · book · drive</Eyebrow>
                            <h2 className="font-display font-normal text-ink mt-5 text-[56px] sm:text-[96px] lg:text-[140px] leading-[0.88] tracking-tightest">
                                Ready to upgrade<br /> your <em className="italic text-champagne">ride?</em>
                            </h2>
                            <p className="mt-7 max-w-xl text-[15.5px] leading-relaxed text-ink-muted">
                                Visit our showroom in Kuvempu Nagara, Mysuru for a no-pressure walk-through,
                                or browse the inventory online and book a test drive at home.
                            </p>
                            <div className="mt-9 flex flex-wrap items-center gap-3">
                                <PrimaryBtn icon={ArrowRight} onClick={() => navigate('/used-cars-in-mysore')}>Browse inventory</PrimaryBtn>
                                <GhostBtn icon={Phone} as={Link} to="/contact">Contact us</GhostBtn>
                                <GhostBtn icon={Calendar} as={Link} to="/used-cars-in-mysore">Book a test drive</GhostBtn>
                            </div>
                        </div>

                        <div className="lg:col-span-4">
                            <div className="rounded-3xl border border-ink/10 p-7 bg-white/60">
                                <Eyebrow>Showroom</Eyebrow>
                                <div className="font-display text-[24px] md:text-[28px] leading-tight mt-3">
                                    Jain Autocars,<br />Kuvempu Nagara, Mysore.
                                </div>
                                <div className="mt-5 space-y-2.5 text-[13.5px] text-ink-muted">
                                    <div className="flex items-center gap-2.5"><Clock size={14} className="text-ink" /> Mon – Sun · 9:30 AM – 8:00 PM</div>
                                    <div className="flex items-center gap-2.5"><Phone size={14} className="text-ink" /> <a href="tel:+919986619282" className="hover:text-ink transition-colors">+91 99866 19282</a></div>
                                    <div className="flex items-center gap-2.5"><Mail size={14} className="text-ink" /> <a href="mailto:crsurajjain@gmail.com" className="hover:text-ink transition-colors">crsurajjain@gmail.com</a></div>
                                    <div className="flex items-center gap-2.5"><MapPin size={14} className="text-ink" /> 480, Chithrabhanu Rd</div>
                                </div>
                                <Link to="/contact" className="mt-6 pt-5 border-t border-ink/10 flex items-center justify-between group">
                                    <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-faint group-hover:text-ink">Get directions</span>
                                    <span className="w-9 h-9 rounded-full border border-ink/20 flex items-center justify-center group-hover:bg-ink group-hover:text-ivory transition-colors">
                                        <ArrowUpRight size={13} />
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3-step Get-an-offer modal */}
            <OfferModal open={isSellOpen} onClose={() => setIsSellOpen(false)} />
        </div>
    );
};

export default HomePage;
