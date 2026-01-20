import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import CarCard from '../components/cars/CarCard';
import { Search, Filter, X, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';

const BrowseCarsPage = () => {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();

    // Filters State
    const [filters, setFilters] = useState({
        priceRange: [0, 5000000],
        fuelType: '',
        transmission: '',
        year: '',
    });

    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [sortBy, setSortBy] = useState('newest');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const carsPerPage = 9;

    useEffect(() => {
        const fetchCars = async () => {
            setLoading(true);
            try {
                const carsRef = collection(db, 'cars');
                const q = query(carsRef, orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(q);
                const carsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCars(carsData);
            } catch (error) {
                console.error("Error fetching cars:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCars();
    }, []);

    // Filter Logic
    const filteredCars = useMemo(() => {
        return cars.filter(car => {
            const matchesSearch = searchTerm === '' ||
                `${car.make} ${car.model} ${car.year}`.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesPrice = (Number(car.price) >= filters.priceRange[0]) &&
                (Number(car.price) <= filters.priceRange[1]);
            const matchesFuel = filters.fuelType === '' || car.fuelType === filters.fuelType;
            const matchesTransmission = filters.transmission === '' || car.transmission === filters.transmission;

            return matchesSearch && matchesPrice && matchesFuel && matchesTransmission;
        }).sort((a, b) => {
            if (sortBy === 'priceLow') return Number(a.price) - Number(b.price);
            if (sortBy === 'priceHigh') return Number(b.price) - Number(a.price);
            return new Date(b.createdAt) - new Date(a.createdAt); // newest
        });
    }, [cars, searchTerm, filters, sortBy]);

    // Pagination Logic
    const indexOfLastCar = currentPage * carsPerPage;
    const indexOfFirstCar = indexOfLastCar - carsPerPage;
    const currentCars = filteredCars.slice(indexOfFirstCar, indexOfLastCar);
    const totalPages = Math.ceil(filteredCars.length / carsPerPage);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setFilters({
            priceRange: [0, 5000000],
            fuelType: '',
            transmission: '',
            year: '',
        });
        setSearchTerm('');
        setSearchParams({});
    };

    return (
        <div className="bg-surface-50 min-h-screen pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header & Mobile Filter Toggle */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-heading font-bold text-slate-900">Browse Inventory</h1>
                        <p className="text-slate-500 mt-1">{filteredCars.length} vehicles available</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={() => setIsMobileFilterOpen(true)}
                            className="md:hidden flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold shadow-md hover:bg-primary-hover transition-colors"
                        >
                            <Filter size={18} /> Filters
                        </button>

                        <div className="relative flex-grow md:flex-grow-0">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full md:w-48 appearance-none bg-white border border-slate-200 text-slate-700 py-2.5 px-4 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                            >
                                <option value="newest">Newest First</option>
                                <option value="priceLow">Price: Low to High</option>
                                <option value="priceHigh">Price: High to Low</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Filters (Desktop) */}
                    <aside className="hidden md:block w-64 flex-shrink-0 space-y-8">
                        {/* Search */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Search size={18} className="text-primary" /> Search
                            </h3>
                            <input
                                type="text"
                                placeholder="Make, Model..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="form-input text-sm"
                            />
                        </div>

                        {/* Filters */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <SlidersHorizontal size={18} className="text-primary" /> Filters
                                </h3>
                                <button onClick={clearFilters} className="text-xs text-primary hover:underline font-medium">Reset</button>
                            </div>

                            {/* Price Range */}
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-2 block">Max Price: ₹{(filters.priceRange[1] / 100000).toFixed(1)} Lakh</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="5000000"
                                    step="50000"
                                    value={filters.priceRange[1]}
                                    onChange={(e) => handleFilterChange('priceRange', [0, parseInt(e.target.value)])}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <div className="flex justify-between text-xs text-slate-400 mt-1">
                                    <span>₹0</span>
                                    <span>₹50L+</span>
                                </div>
                            </div>

                            {/* Fuel Type */}
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-2 block">Fuel Type</label>
                                <div className="space-y-2">
                                    {['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'].map(type => (
                                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="fuelType"
                                                checked={filters.fuelType === type}
                                                onChange={() => handleFilterChange('fuelType', type)}
                                                className="w-4 h-4 text-primary border-slate-300 focus:ring-primary"
                                            />
                                            <span className="text-sm text-slate-600">{type}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Transmission */}
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-2 block">Transmission</label>
                                <div className="flex gap-2">
                                    {['Manual', 'Automatic'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => handleFilterChange('transmission', filters.transmission === type ? '' : type)}
                                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${filters.transmission === type
                                                ? 'bg-primary text-white border-primary'
                                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-primary/50'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Car Grid */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map(n => (
                                    <div key={n} className="bg-white rounded-2xl h-80 animate-pulse border border-slate-100" />
                                ))}
                            </div>
                        ) : currentCars.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {currentCars.map(car => (
                                        <CarCard key={car.id} car={car} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="mt-12 flex justify-center gap-2">
                                        {[...Array(totalPages)].map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentPage(i + 1)}
                                                className={`w-10 h-10 rounded-lg font-medium transition-colors ${currentPage === i + 1
                                                    ? 'bg-primary text-white shadow-md'
                                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search size={32} className="text-slate-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No cars found</h3>
                                <p className="text-slate-500 mb-6">Try adjusting your filters or search terms.</p>
                                <button onClick={clearFilters} className="btn-primary">Clear All Filters</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filter Drawer */}
            <AnimatePresence>
                {isMobileFilterOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50 md:hidden"
                            onClick={() => setIsMobileFilterOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'tween' }}
                            className="fixed inset-y-0 right-0 w-80 bg-white z-50 p-6 overflow-y-auto shadow-2xl md:hidden"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-xl font-bold text-slate-900">Filters</h2>
                                <button onClick={() => setIsMobileFilterOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                    <X size={24} className="text-slate-500" />
                                </button>
                            </div>

                            {/* Mobile Filter Content (Reused Logic) */}
                            <div className="space-y-8">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-2 block">Search</label>
                                    <input
                                        type="text"
                                        placeholder="Make, Model..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="form-input"
                                    />
                                </div>
                                {/* ... (Other filters same as desktop, simplified for brevity in this artifact) ... */}
                                {/* Re-implementing filters for mobile to ensure functionality */}
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-2 block">Max Price</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="5000000"
                                        step="50000"
                                        value={filters.priceRange[1]}
                                        onChange={(e) => handleFilterChange('priceRange', [0, parseInt(e.target.value)])}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none accent-primary"
                                    />
                                    <div className="text-right text-sm font-medium text-primary mt-1">₹{(filters.priceRange[1] / 100000).toFixed(1)} Lakh</div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-2 block">Fuel Type</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Petrol', 'Diesel', 'Electric', 'Hybrid'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => handleFilterChange('fuelType', filters.fuelType === type ? '' : type)}
                                                className={`px-3 py-1.5 rounded-full text-sm border ${filters.fuelType === type ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => { clearFilters(); setIsMobileFilterOpen(false); }}
                                    className="w-full py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50"
                                >
                                    Reset Filters
                                </button>
                                <button
                                    onClick={() => setIsMobileFilterOpen(false)}
                                    className="w-full btn-primary"
                                >
                                    Show {filteredCars.length} Cars
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BrowseCarsPage;