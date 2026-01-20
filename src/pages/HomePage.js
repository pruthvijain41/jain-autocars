import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { motion } from 'framer-motion';
import { Search, ArrowRight, ShieldCheck, Award, ThumbsUp, Star, ChevronRight } from 'lucide-react';
import CarCard from '../components/cars/CarCard';
import ScrollSection from '../components/ScrollSection';

import HeroImage from '../assets/images/hero_background.png';

const HomePage = () => {
    const [featuredCars, setFeaturedCars] = useState([]);
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const carsRef = collection(db, 'cars');
                const carsQuery = query(carsRef, orderBy('createdAt', 'desc'), limit(4));
                const carsSnapshot = await getDocs(carsQuery);
                setFeaturedCars(carsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                const testimonialsRef = collection(db, 'testimonials');
                const testimonialsQuery = query(testimonialsRef, where("approved", "==", true), orderBy('createdAt', 'desc'), limit(3));
                const testimonialsSnapshot = await getDocs(testimonialsQuery);
                const testimonialsData = testimonialsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    const date = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A';
                    return { id: doc.id, ...data, text: data.text || data.testimonial, date: date };
                });
                setTestimonials(testimonialsData);
            } catch (error) { console.error("Error fetching homepage data:", error); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) { navigate(`/used-cars-in-mysore?search=${encodeURIComponent(searchTerm)}`); }
        else { navigate('/used-cars-in-mysore'); }
    }

    return (
        <div className="bg-surface-50 min-h-screen font-sans selection:bg-primary/20">
            {/* Hero Section */}
            <section className="relative h-[85vh] min-h-[500px] md:min-h-[700px] flex items-center overflow-hidden bg-slate-50">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={HeroImage}
                        alt="Luxury Car Showroom"
                        className="w-full h-full object-cover"
                    />
                    {/* Gradient Overlay - Made much more transparent */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent/20" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent" />
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-20 md:pt-32">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs md:text-sm font-bold mb-4 md:mb-6 border border-primary/20">
                            <Star size={14} fill="currentColor" /> Premium Used Cars in Mysore
                        </div>
                        <h1 className="text-4xl sm:text-6xl md:text-7xl font-heading font-bold text-slate-900 leading-[1.1] mb-4 md:mb-6 tracking-tight">
                            Elevate Your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Drive Today.</span>
                        </h1>
                        <p className="text-base md:text-xl text-slate-600 mb-8 md:mb-10 max-w-lg font-medium leading-relaxed">
                            Discover a curated collection of quality pre-owned vehicles.
                            Transparent pricing, verified history, and unmatched service.
                        </p>

                        {/* Search Bar */}
                        <form onSubmit={handleSearchSubmit} className="max-w-md bg-white p-2 rounded-2xl border border-slate-200 flex gap-2 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                            <div className="flex-grow relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search Make, Model..."
                                    className="w-full bg-transparent border-none text-slate-900 placeholder:text-slate-400 pl-12 pr-4 py-3 focus:ring-0 focus:outline-none font-medium text-sm md:text-base"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="bg-primary hover:bg-primary-hover text-white px-4 md:px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg flex items-center gap-2 text-sm md:text-base">
                                Search
                            </button>
                        </form>

                        <div className="mt-6 md:mt-8 flex flex-wrap items-center gap-4 md:gap-6 text-xs md:text-sm font-medium text-slate-500">
                            <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-primary" /> 150+ Point Check</span>
                            <span className="flex items-center gap-2"><Award size={16} className="text-primary" /> 1 Year Warranty</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section - Premium Grid Layout (No Sticky Scroll) */}
            <section className="py-12 md:py-24 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-left mb-12 md:mb-16"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-50 border border-slate-100 text-primary text-sm font-bold mb-6 shadow-sm">
                            <Star size={14} fill="currentColor" /> Why Choose Jain Autocars?
                        </div>
                        <h2 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-6">
                            Excellence in <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Every Detail</span>
                        </h2>
                        <p className="text-slate-600 text-lg md:text-xl max-w-2xl leading-relaxed">
                            We don't just sell cars; we deliver peace of mind, transparency, and a premium ownership experience.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: ShieldCheck,
                                title: "150+ Point Inspection",
                                desc: "Every vehicle undergoes a rigorous technical assessment by certified engineers to ensure absolute quality.",
                                color: "text-blue-600",
                                bg: "bg-blue-50"
                            },
                            {
                                icon: Award,
                                title: "Transparent Pricing",
                                desc: "Best-in-market prices with zero hidden charges. We believe in complete honesty and fair value.",
                                color: "text-emerald-600",
                                bg: "bg-emerald-50"
                            },
                            {
                                icon: ThumbsUp,
                                title: "Lifetime Support",
                                desc: "Our relationship doesn't end at delivery. Enjoy dedicated after-sales support and service assistance.",
                                color: "text-purple-600",
                                bg: "bg-purple-50"
                            }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: idx * 0.2 }}
                                className="group relative bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between h-full min-h-[300px]"
                            >
                                <div>
                                    <div className={`w-16 h-16 md:w-20 md:h-20 ${feature.bg} rounded-2xl flex items-center justify-center mb-6 md:mb-8 group-hover:scale-110 transition-transform duration-500`}>
                                        <feature.icon size={32} className={`md:w-10 md:h-10 ${feature.color}`} />
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-heading font-bold text-slate-900 mb-4 group-hover:text-primary transition-colors">
                                        {feature.title}
                                    </h3>
                                    <p className="text-slate-600 leading-relaxed text-base md:text-lg">
                                        {feature.desc}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Cars Section */}
            <section className="bg-surface-50">
                <ScrollSection
                    height="300vh"
                    className="bg-surface-50"
                    title={
                        <div>
                            <h2 className="text-3xl md:text-5xl font-heading font-bold text-slate-900 mb-2 md:mb-4">Featured Vehicles</h2>
                            <p className="text-slate-600 text-sm md:text-lg">Swipe to explore our premium collection.</p>
                        </div>
                    }
                >
                    {loading ? (
                        [1, 2, 3, 4].map(n => <div key={n} className="w-[85vw] md:w-[25vw] h-80 md:h-[500px] bg-white rounded-2xl animate-pulse" />)
                    ) : (
                        featuredCars.map((car) => (
                            <div key={car.id} className="flex-shrink-0 w-[85vw] md:w-[25vw] md:min-w-[350px]">
                                <CarCard car={car} />
                            </div>
                        ))
                    )}
                    <div className="flex-shrink-0 w-[50vw] md:w-[20vw] flex items-center justify-center">
                        <Link to="/used-cars-in-mysore" className="flex flex-col items-center gap-4 text-primary font-bold group">
                            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <ArrowRight size={24} className="md:w-10 md:h-10" />
                            </div>
                            <span className="text-lg md:text-xl">View All Inventory</span>
                        </Link>
                    </div>
                </ScrollSection>
            </section>

            {/* Testimonials Section */}
            <section className="py-12 md:py-24 bg-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-surface-50 skew-x-12 translate-x-1/4 opacity-50"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-10 md:mb-16">
                        <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-2 md:mb-4">Customer Stories</h2>
                        <p className="text-slate-600 text-base md:text-lg">Real experiences from our valued clients.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                        {loading ? (
                            [1, 2, 3].map(n => <div key={n} className="h-64 bg-surface-50 rounded-2xl animate-pulse" />)
                        ) : testimonials.length > 0 ? (
                            testimonials.map((testimonial) => (
                                <div key={testimonial.id} className="bg-white p-6 md:p-8 rounded-3xl shadow-card hover:shadow-card-hover transition-all duration-300 border border-slate-100">
                                    <div className="flex gap-1 mb-4 md:mb-6 text-accent">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={16} fill={i < testimonial.rating ? "currentColor" : "none"} className={i < testimonial.rating ? "" : "text-slate-200"} />
                                        ))}
                                    </div>
                                    <p className="text-slate-700 mb-6 md:mb-8 italic text-base md:text-lg leading-relaxed">"{testimonial.text}"</p>
                                    <div className="flex items-center gap-4 border-t border-slate-100 pt-6">
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-surface-50 flex items-center justify-center font-bold text-primary text-lg md:text-xl">
                                            {testimonial.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-sm md:text-base">{testimonial.name}</h4>
                                            <p className="text-xs md:text-sm text-slate-500">{testimonial.date}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-3 text-center text-slate-500">No testimonials yet.</div>
                        )}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-12 md:py-20 bg-primary relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl md:text-5xl font-heading font-bold text-white mb-4 md:mb-8">Ready to Upgrade Your Ride?</h2>
                    <p className="text-white/90 text-lg md:text-xl mb-8 md:mb-10 max-w-2xl mx-auto font-medium">Visit our showroom in Mysore or browse our inventory online.</p>
                    <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center">
                        <Link to="/used-cars-in-mysore" className="px-8 py-4 bg-white text-primary text-lg font-bold rounded-xl hover:bg-surface-50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2">
                            Browse Inventory <ChevronRight size={20} />
                        </Link>
                        <Link to="/contact" className="px-8 py-4 bg-primary-hover border border-white/20 text-white text-lg font-bold rounded-xl hover:bg-primary-hover/80 transition-all duration-300">
                            Contact Us
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;