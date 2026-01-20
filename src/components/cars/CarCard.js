import React from 'react';
import { Link } from 'react-router-dom';
import { Fuel, Settings, Gauge, Calendar } from 'lucide-react';

const CarCard = ({ car }) => {
    const { id, make, model, year, price, fuelType, transmission, kilometers, imageUrls } = car;
    const mainImage = imageUrls?.[0] || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1000';

    // Format price to Indian Rupee format
    const formattedPrice = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(price);

    return (
        <Link to={`/car/${id}`} className="group block h-full">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 h-full border border-slate-100 flex flex-col">
                {/* Image Container */}
                <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                        src={mainImage}
                        alt={`${year} ${make} ${model}`}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-3 left-3 right-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                        <span className="bg-white/90 backdrop-blur text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                            View Details
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="text-lg font-heading font-bold text-slate-900 group-hover:text-primary transition-colors">
                                {make} {model}
                            </h3>
                            <p className="text-slate-500 text-sm">{year}</p>
                        </div>
                        <p className="text-accent font-bold text-lg">
                            {formattedPrice}
                        </p>
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100 grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                            <Gauge size={16} className="text-slate-400" />
                            <span>{kilometers?.toLocaleString()} km</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Fuel size={16} className="text-slate-400" />
                            <span>{fuelType}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Settings size={16} className="text-slate-400" />
                            <span>{transmission}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-slate-400" />
                            <span>{year}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default CarCard;
