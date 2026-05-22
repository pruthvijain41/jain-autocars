import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Gauge, Fuel, Settings, Calendar, MapPin, ArrowUpRight,
    Heart, GitCompareArrows, ShieldCheck, Images,
} from 'lucide-react';
import {
    isFavorite, toggleFavorite,
    isInCompare, toggleCompare, COMPARE_LIMIT,
} from '../../utils/favorites';

const formatLakh = (price) => {
    if (price == null || isNaN(Number(price))) return '—';
    const lakh = Number(price) / 100000;
    return lakh.toFixed(2);
};

/**
 * Editorial-style car card used on Home and Browse Inventory.
 *
 * Variants:
 *  - variant="rail"  : fixed-width card used in horizontal scroll rails
 *  - variant="grid"  : full-width 16:10 card used in the inventory grid (default)
 *  - dark=true       : ink-soft background for use on dark sections
 *  - size="lg"       : larger rail-card width
 */
const EditorialCarCard = ({ car, variant = 'grid', dark = false, size = 'md' }) => {
    const isRail = variant === 'rail';
    const isLg = size === 'lg';
    const bg = dark ? 'bg-ink-soft' : 'bg-white/55';
    const border = dark ? 'border-ivory/10' : 'border-ink/10';
    const txt = dark ? 'text-ivory' : 'text-ink';
    const sub = dark ? 'text-ivory/60' : 'text-ink-muted';

    const km = car.kilometers ?? car.mileage;
    const image = car.imageUrls?.[0];
    const isSold = car.status === 'Sold';
    const isReserved = car.status === 'Reserved';
    const owner = car.ownership || car.owner;

    const [fav, setFav] = useState(false);
    const [inCompare, setInCompare] = useState(false);

    useEffect(() => {
        setFav(isFavorite(car.id));
        setInCompare(isInCompare(car.id));
        const handler = () => {
            setFav(isFavorite(car.id));
            setInCompare(isInCompare(car.id));
        };
        window.addEventListener('jain:storage', handler);
        return () => window.removeEventListener('jain:storage', handler);
    }, [car.id]);

    const onFav = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setFav(toggleFavorite(car.id));
    };

    const onCompare = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const result = toggleCompare(car.id);
        if (result === null) {
            alert(`You can compare up to ${COMPARE_LIMIT} cars at a time.`);
            return;
        }
        setInCompare(result);
    };

    const imageWrapClass = isRail
        ? `relative ${isLg ? 'h-[240px]' : 'h-[220px]'} overflow-hidden ${image ? '' : 'car-ph'}`
        : `relative aspect-[16/10] overflow-hidden ${image ? '' : 'car-ph'}`;

    const wrapWidth = isRail
        ? `shrink-0 w-[300px] sm:w-[340px] ${isLg ? 'md:w-[420px]' : 'md:w-[380px]'}`
        : '';

    const photoCount = Array.isArray(car.imageUrls) ? car.imageUrls.length : 0;

    return (
        <article className={`lift group relative rounded-2xl border ${border} ${bg} overflow-hidden ${wrapWidth} ${isSold ? 'opacity-90' : ''}`}>
            <Link to={`/car/${car.id}`} className="block">
                <div className={imageWrapClass}>
                    {image ? (
                        <img
                            src={image}
                            alt={`${car.year} ${car.make} ${car.model}`}
                            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${isSold ? 'grayscale' : ''}`}
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-champagne/80">— {car.year} {car.bodyType ? `· ${car.bodyType}` : ''} —</div>
                                <div className="font-display text-[34px] leading-none mt-1 text-champagne-light">{(car.make || '').split(' ')[0]}</div>
                            </div>
                        </div>
                    )}

                    {/* Bottom gradient (helps text on image) */}
                    {image && <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent pointer-events-none" />}

                    {isSold && !image && (
                        <div className="absolute inset-0 bg-ink/30 flex items-center justify-center">
                            <span className="font-mono text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full bg-[#8b1f1f] text-white shadow-md -rotate-[3deg]">Sold</span>
                        </div>
                    )}

                    {/* Status + owner badges (top-left) */}
                    <div className="absolute top-3 left-3 flex gap-1.5 z-10">
                        {isSold && (
                            <span className="font-mono text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full bg-[#8b1f1f] text-white shadow-md -rotate-[3deg]">
                                Sold
                            </span>
                        )}
                        {isReserved && (
                            <span className="font-mono text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full bg-champagne text-ink shadow-md">
                                Reserved
                            </span>
                        )}
                        {owner && !isSold && !isReserved && (
                            <span className="font-mono text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full bg-ivory/90 text-ink">
                                {owner} owner
                            </span>
                        )}
                    </div>

                    {/* Certified strip (bottom-left, image variant only) */}
                    {!isRail && (
                        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 text-ivory/95 text-[11px]">
                            <ShieldCheck size={12} className="text-champagne" /> JA Certified
                        </div>
                    )}

                    {/* Photo count (bottom-right, image variant only) */}
                    {!isRail && photoCount > 0 && (
                        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 text-ivory/95 text-[11px] bg-black/30 backdrop-blur px-2 py-0.5 rounded-full">
                            <Images size={11} /> <span className="num">{photoCount}</span>
                        </div>
                    )}

                    {/* JA Certified pill (rail variant only) */}
                    {isRail && (
                        <div className="absolute top-3 right-3 z-10">
                            <span className="font-mono text-[10px] uppercase tracking-[0.16em] px-2 py-1 rounded-full bg-ink/70 text-ivory backdrop-blur">JA Certified</span>
                        </div>
                    )}
                </div>

                <div className="p-5">
                    <div className="flex items-baseline justify-between gap-3">
                        <div className="min-w-0">
                            <div className={`font-mono text-[10px] uppercase tracking-[0.18em] ${sub}`}>{car.make}</div>
                            <h3 className={`font-display font-normal text-[22px] sm:text-[24px] md:text-[26px] leading-tight mt-0.5 truncate ${txt}`}>{car.model}</h3>
                        </div>
                        <div className="text-right shrink-0">
                            <div className={`font-mono text-[10px] uppercase tracking-[0.18em] ${sub}`}>Price</div>
                            <div className={`font-display font-normal text-[22px] sm:text-[24px] md:text-[26px] leading-none ${txt} num`}>
                                ₹{formatLakh(car.price)}<span className={`text-[14px] ${sub} ml-0.5`}>L</span>
                            </div>
                        </div>
                    </div>

                    {/* Specs: 2x2 grid for grid variant, 3-col compact for rail */}
                    {isRail ? (
                        <div className={`mt-5 grid grid-cols-3 gap-2 text-[11.5px] ${sub}`}>
                            <div className="flex items-center gap-1.5"><Gauge size={13} /><span className="num truncate">{km != null ? `${Number(km).toLocaleString()} km` : '—'}</span></div>
                            <div className="flex items-center gap-1.5"><Fuel size={13} /><span className="truncate">{car.fuelType || '—'}</span></div>
                            <div className="flex items-center gap-1.5"><Settings size={13} /><span className="truncate">{car.transmission || '—'}</span></div>
                        </div>
                    ) : (
                        <div className={`mt-5 grid grid-cols-2 gap-2.5 text-[12px] ${sub}`}>
                            <div className={`flex items-center gap-2 border ${dark ? 'border-ivory/10 bg-ink-soft' : 'border-ink/10 bg-ivory-soft/50'} rounded-xl px-3 py-2`}>
                                <Gauge size={14} /> <span className="num truncate">{km != null ? `${Number(km).toLocaleString()} km` : '—'}</span>
                            </div>
                            <div className={`flex items-center gap-2 border ${dark ? 'border-ivory/10 bg-ink-soft' : 'border-ink/10 bg-ivory-soft/50'} rounded-xl px-3 py-2`}>
                                <Fuel size={14} /> <span className="truncate">{car.fuelType || '—'}</span>
                            </div>
                            <div className={`flex items-center gap-2 border ${dark ? 'border-ivory/10 bg-ink-soft' : 'border-ink/10 bg-ivory-soft/50'} rounded-xl px-3 py-2`}>
                                <Settings size={14} /> <span className="truncate">{car.transmission || '—'}</span>
                            </div>
                            <div className={`flex items-center gap-2 border ${dark ? 'border-ivory/10 bg-ink-soft' : 'border-ink/10 bg-ivory-soft/50'} rounded-xl px-3 py-2`}>
                                <Calendar size={14} /> <span className="num">{car.year || '—'}</span>
                            </div>
                        </div>
                    )}

                    <div className={`mt-5 pt-4 border-t ${border} flex items-center justify-between`}>
                        <div className={`flex items-center gap-1.5 text-[11.5px] ${sub}`}>
                            <MapPin size={12} /> Mysore · Verified history
                        </div>
                        <span className={`link-u text-[12.5px] ${txt} inline-flex items-center gap-1`}>
                            {isSold ? 'View details' : 'View'} <ArrowUpRight size={13} />
                        </span>
                    </div>
                </div>
            </Link>

            {/* Action buttons — outside the Link so clicks never reach it */}
            <div className={`absolute z-10 top-3 right-3 flex gap-1.5 ${isRail ? '' : 'opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300'}`}>
                <button
                    type="button"
                    onClick={onCompare}
                    title={inCompare ? 'Remove from compare' : 'Add to compare'}
                    aria-label={inCompare ? 'Remove from compare' : 'Add to compare'}
                    className={`w-9 h-9 rounded-full backdrop-blur flex items-center justify-center shadow-md transition-colors ${inCompare ? 'bg-ink text-ivory' : 'bg-ivory/95 hover:bg-ivory text-ink'}`}
                >
                    <GitCompareArrows size={14} />
                </button>
                <button
                    type="button"
                    onClick={onFav}
                    title={fav ? 'Remove from favorites' : 'Save'}
                    aria-label={fav ? 'Remove from favorites' : 'Save'}
                    className={`w-9 h-9 rounded-full backdrop-blur flex items-center justify-center shadow-md transition-colors ${fav ? 'bg-red-500 text-ivory' : 'bg-ivory/95 hover:bg-ivory text-ink'}`}
                >
                    <Heart size={14} fill={fav ? 'currentColor' : 'none'} />
                </button>
            </div>
        </article>
    );
};

export default EditorialCarCard;
