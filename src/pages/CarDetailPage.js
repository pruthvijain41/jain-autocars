import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, X, Phone, MessageCircle, Share2,
    Calendar, Gauge, Fuel, Settings, MapPin, ShieldCheck, Info
} from 'lucide-react';
import CarCard from '../components/cars/CarCard';

const CarDetailPage = () => {
    const { carId } = useParams();
    const [car, setCar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [similarCars, setSimilarCars] = useState([]);
    const [isViewerOpen, setIsViewerOpen] = useState(false);

    useEffect(() => {
        const fetchCarAndSimilar = async () => {
            if (!carId) { setError('No car ID provided.'); setLoading(false); return; };
            setLoading(true); setCar(null); setSimilarCars([]); setActiveImageIndex(0); window.scrollTo(0, 0);
            try {
                const carDocRef = doc(db, 'cars', carId);
                const carDocSnap = await getDoc(carDocRef);
                if (carDocSnap.exists()) {
                    const mainCarData = { id: carDocSnap.id, ...carDocSnap.data() };
                    setCar(mainCarData);

                    if (mainCarData.price) {
                        const price = Number(mainCarData.price);
                        const priceRange = 100000;
                        const carsRef = collection(db, 'cars');
                        const similarCarsQuery = query(
                            carsRef,
                            where('price', '>=', price - priceRange),
                            where('price', '<=', price + priceRange),
                            limit(5)
                        );

                        const similarCarsSnapshot = await getDocs(similarCarsQuery);
                        const similarCarsData = similarCarsSnapshot.docs
                            .map(d => ({ id: d.id, ...d.data() }))
                            .filter(c => c.id !== carId);

                        setSimilarCars(similarCarsData.slice(0, 4));
                    }
                } else { setError('Car not found.'); }
            } catch (err) { setError('Error fetching car details.'); console.error('Error fetching car details:', err); }
            finally { setLoading(false); }
        };
        fetchCarAndSimilar();
    }, [carId]);

    const nextImage = useCallback(() => {
        if (!car?.imageUrls) return;
        setActiveImageIndex((prev) => (prev + 1) % car.imageUrls.length);
    }, [car]);

    const prevImage = useCallback(() => {
        if (!car?.imageUrls) return;
        setActiveImageIndex((prev) => (prev - 1 + car.imageUrls.length) % car.imageUrls.length);
    }, [car]);

    // Keyboard navigation for lightbox
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isViewerOpen) return;
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') prevImage();
            if (e.key === 'Escape') setIsViewerOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isViewerOpen, nextImage, prevImage]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-surface-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    if (error || !car) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-surface-50 gap-4">
            <h2 className="text-2xl font-bold text-slate-900">Car Not Found</h2>
            <Link to="/used-cars-in-mysore" className="btn-primary">Browse Inventory</Link>
        </div>
    );

    const activeImageUrl = car.imageUrls?.[activeImageIndex] || 'https://via.placeholder.com/800x600';

    return (
        <div className="bg-surface-50 min-h-screen pt-24 pb-20">
            <Helmet>
                <title>{`${car.year} ${car.make} ${car.model} - Jain Autocars`}</title>
            </Helmet>

            {/* Lightbox */}
            <AnimatePresence>
                {isViewerOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-xl flex items-center justify-center p-4"
                        onClick={() => setIsViewerOpen(false)}
                    >
                        <button className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 p-2 rounded-full transition-colors">
                            <X size={32} />
                        </button>

                        <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-4 text-slate-400 hover:text-primary p-2 rounded-full transition-colors hidden md:block">
                            <ChevronLeft size={48} />
                        </button>

                        <img
                            src={activeImageUrl}
                            alt="Full screen view"
                            className="max-w-full max-h-[90vh] object-contain select-none shadow-2xl rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />

                        <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-4 text-slate-400 hover:text-primary p-2 rounded-full transition-colors hidden md:block">
                            <ChevronRight size={48} />
                        </button>

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-500 font-medium bg-white/80 px-4 py-1 rounded-full">
                            {activeImageIndex + 1} / {car.imageUrls?.length}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                    <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                    <ChevronRight size={14} />
                    <Link to="/used-cars-in-mysore" className="hover:text-primary transition-colors">Inventory</Link>
                    <ChevronRight size={14} />
                    <span className="text-slate-900 font-medium truncate">{car.year} {car.make} {car.model}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-24 lg:pb-0">
                    {/* 1. Gallery Section (Desktop: Col 1-2, Mobile: Order 1) */}
                    <div className="lg:col-span-2 order-1">
                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                            <div
                                className="relative aspect-[16/10] bg-slate-100 cursor-pointer group"
                                onClick={() => setIsViewerOpen(true)}
                            >
                                <img
                                    src={activeImageUrl}
                                    alt={`${car.make} ${car.model}`}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                                    <span className="bg-white/90 text-slate-900 px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm flex items-center gap-2 shadow-lg font-medium">
                                        <Info size={16} /> View Fullscreen
                                    </span>
                                </div>
                            </div>

                            {/* Thumbnails */}
                            {car.imageUrls && car.imageUrls.length > 1 && (
                                <div className="p-4 flex gap-3 overflow-x-auto pb-6 scrollbar-hide">
                                    {car.imageUrls.map((url, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImageIndex(idx)}
                                            className={`relative flex-shrink-0 w-24 aspect-[16/10] rounded-lg overflow-hidden border-2 transition-all ${activeImageIndex === idx ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-70 hover:opacity-100'
                                                }`}
                                        >
                                            <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. Info Card (Desktop: Col 3, Row 1-2, Mobile: Order 2) */}
                    <div className="lg:col-span-1 order-2 lg:row-span-2">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100">
                                <div className="mb-6">
                                    <h1 className="text-3xl font-heading font-bold text-slate-900 mb-2">
                                        {car.year} {car.make} {car.model}
                                    </h1>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
                                        <MapPin size={16} />
                                        <span>Mysore, Karnataka</span>
                                    </div>
                                    <div className="text-4xl font-bold text-primary">
                                        ₹{Number(car.price).toLocaleString()}
                                    </div>
                                    {car.originalPrice && (
                                        <div className="text-slate-400 text-sm line-through mt-1">
                                            ₹{Number(car.originalPrice).toLocaleString()}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-surface-50 p-3 rounded-xl border border-slate-100">
                                        <div className="text-slate-400 text-xs mb-1 flex items-center gap-1"><Gauge size={12} /> Mileage</div>
                                        <div className="font-semibold text-slate-900">{Number(car.kilometers || car.mileage || 0).toLocaleString()} km</div>
                                    </div>
                                    <div className="bg-surface-50 p-3 rounded-xl border border-slate-100">
                                        <div className="text-slate-400 text-xs mb-1 flex items-center gap-1"><Fuel size={12} /> Fuel</div>
                                        <div className="font-semibold text-slate-900">{car.fuelType || 'N/A'}</div>
                                    </div>
                                    <div className="bg-surface-50 p-3 rounded-xl border border-slate-100">
                                        <div className="text-slate-400 text-xs mb-1 flex items-center gap-1"><Settings size={12} /> Transmission</div>
                                        <div className="font-semibold text-slate-900">{car.transmission || 'Manual'}</div>
                                    </div>
                                    <div className="bg-surface-50 p-3 rounded-xl border border-slate-100">
                                        <div className="text-slate-400 text-xs mb-1 flex items-center gap-1"><Calendar size={12} /> Year</div>
                                        <div className="font-semibold text-slate-900">{car.year}</div>
                                    </div>
                                </div>

                                {/* Desktop Actions (Hidden on Mobile) */}
                                <div className="hidden lg:block space-y-3">
                                    <a
                                        href="tel:9986619282"
                                        className="btn-primary w-full flex items-center justify-center gap-2 text-lg"
                                    >
                                        <Phone size={20} /> Call Seller
                                    </a>
                                    <a
                                        href={`https://wa.me/919986619282?text=Hi, I'm interested in the ${car.year} ${car.make} ${car.model} listed for ₹${car.price}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-lg shadow-sm"
                                    >
                                        <MessageCircle size={20} /> Chat on WhatsApp
                                    </a>
                                </div>
                            </div>

                            {/* Safety/Trust Badge */}
                            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 flex items-start gap-4">
                                <ShieldCheck className="text-blue-600 shrink-0 mt-1" size={24} />
                                <div>
                                    <h4 className="font-bold text-blue-900 text-base">Verified Dealer</h4>
                                    <p className="text-blue-700 text-sm mt-1 leading-relaxed">This vehicle has been inspected and verified by Jain Autocars. Buy with confidence.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Description & Features (Desktop: Col 1-2, Mobile: Order 3) */}
                    <div className="lg:col-span-2 order-3 space-y-8">
                        {/* Description */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                            <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">Vehicle Description</h2>
                            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                                <p className="whitespace-pre-line">{car.description || "No description available for this vehicle."}</p>
                            </div>
                        </div>

                        {/* Features Grid */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                            <h2 className="text-2xl font-heading font-bold text-slate-900 mb-6">Key Features</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {[
                                    { label: 'Power Steering', icon: ShieldCheck },
                                    { label: 'Power Windows', icon: ShieldCheck },
                                    { label: 'Air Conditioner', icon: ShieldCheck },
                                    { label: 'Music System', icon: ShieldCheck },
                                    { label: 'Central Locking', icon: ShieldCheck },
                                    { label: 'ABS', icon: ShieldCheck },
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3 text-slate-700 bg-surface-50 p-3 rounded-xl">
                                        <feature.icon size={18} className="text-primary" />
                                        <span className="font-medium">{feature.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Sticky Action Bar */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] lg:hidden z-40 flex gap-3">
                    <a
                        href="tel:9986619282"
                        className="flex-1 btn-primary flex items-center justify-center gap-2 text-base py-3"
                    >
                        <Phone size={18} /> Call
                    </a>
                    <a
                        href={`https://wa.me/919986619282?text=Hi, I'm interested in the ${car.year} ${car.make} ${car.model} listed for ₹${car.price}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-[#25D366] text-white font-bold rounded-xl flex items-center justify-center gap-2 text-base py-3"
                    >
                        <MessageCircle size={18} /> WhatsApp
                    </a>
                </div>

                {/* Similar Cars */}
                {similarCars.length > 0 && (
                    <div className="mt-20">
                        <h2 className="text-3xl font-heading font-bold text-slate-900 mb-8">Similar Vehicles</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {similarCars.map(car => (
                                <CarCard key={car.id} car={car} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CarDetailPage;