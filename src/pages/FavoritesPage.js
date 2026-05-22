import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { Helmet } from 'react-helmet';
import { Heart, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import EditorialCarCard from '../components/cars/EditorialCarCard';
import { getFavorites, clearFavorites } from '../utils/favorites';

const FavoritesPage = () => {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);

    const refresh = async () => {
        const ids = getFavorites();
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
            setCars(docs.filter(d => d && d.exists()).map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error('Error loading favorites:', err);
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

    const handleClear = () => {
        if (window.confirm('Remove all saved cars from your favorites?')) clearFavorites();
    };

    return (
        <div className="min-h-screen bg-ivory pt-24 pb-20">
            <Helmet>
                <title>Saved Cars · Jain Autocars</title>
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
                            — Your shortlist · <span className="num">{cars.length}</span> saved
                        </div>
                        <h1 className="font-display text-[44px] md:text-[64px] leading-[0.95] tracking-tightest mt-2 text-ink flex items-center gap-3 flex-wrap">
                            <span className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-ink text-champagne">
                                <Heart size={20} fill="currentColor" />
                            </span>
                            Saved <em className="italic text-champagne">cars.</em>
                        </h1>
                        <p className="mt-2 text-[14px] text-ink-muted max-w-xl">
                            The cars you've heart-marked while browsing. Saved locally to this device — sync is not
                            required.
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
                        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                            {[1, 2, 3, 4, 5, 6].map((n) => (
                                <div
                                    key={n}
                                    className="rounded-2xl h-[460px] bg-white/40 border border-ink/10 animate-pulse"
                                />
                            ))}
                        </div>
                    ) : cars.length === 0 ? (
                        <div className="rounded-3xl border border-ink/10 bg-white/60 py-20 px-8 text-center">
                            <div className="mx-auto w-12 h-12 rounded-full border border-ink/15 flex items-center justify-center text-ink-muted">
                                <Heart size={16} />
                            </div>
                            <div className="font-display text-[32px] md:text-[40px] leading-tight mt-4 text-ink">
                                Nothing saved <em className="italic text-champagne">yet.</em>
                            </div>
                            <p className="text-[13.5px] text-ink-muted mt-2 max-w-md mx-auto">
                                Tap the heart on any car card while browsing the inventory and it'll wait for you here.
                            </p>
                            <Link
                                to="/used-cars-in-mysore"
                                className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink text-ivory px-5 py-2.5 text-[13px] hover:bg-champagne-deep transition-colors"
                            >
                                Browse inventory <ArrowRight size={13} />
                            </Link>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                            {cars.map((car) => (
                                <EditorialCarCard key={car.id} car={car} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FavoritesPage;
