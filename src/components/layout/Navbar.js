import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, UserCircle, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsOpen(false);
    }, [location]);

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Inventory', path: '/used-cars-in-mysore' },
        { name: 'Contact', path: '/contact' },
    ];

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled || isOpen
                ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100 py-2'
                : 'bg-transparent py-4'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="bg-primary text-white p-2 rounded-xl transition-colors">
                            <span className="font-heading font-bold text-xl tracking-tighter">JA</span>
                        </div>
                        <span className={`font-heading font-bold text-xl tracking-tight transition-colors ${scrolled || isOpen ? 'text-slate-900' : 'text-slate-900'}`}>
                            Jain Autocars
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={`text-sm font-bold transition-colors hover:text-primary ${location.pathname === link.path
                                    ? 'text-primary'
                                    : 'text-slate-600'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}

                        <div className="h-6 w-px bg-slate-200"></div>

                        <a
                            href="tel:9986619282"
                            className="flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-primary transition-colors"
                        >
                            <Phone size={18} />
                            <span>+91 99866 19282</span>
                        </a>

                        <Link
                            to="/admin/login"
                            className="p-2 rounded-full text-slate-400 hover:text-primary hover:bg-slate-100 transition-colors"
                            title="Admin Login"
                        >
                            <UserCircle size={20} />
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden p-2 rounded-lg text-slate-900 hover:bg-slate-100 transition-colors"
                    >
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-t border-slate-100 overflow-hidden shadow-xl"
                    >
                        <div className="px-4 py-6 space-y-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className={`block text-lg font-bold py-3 border-b border-slate-50 last:border-0 ${location.pathname === link.path ? 'text-primary' : 'text-slate-600'
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <div className="pt-4 flex items-center justify-between">
                                <a href="tel:9986619282" className="flex items-center gap-2 text-slate-900 font-bold">
                                    <Phone size={18} className="text-primary" /> +91 99866 19282
                                </a>
                                <Link
                                    to="/admin/login"
                                    className="flex items-center gap-2 text-slate-400 text-sm font-medium"
                                >
                                    <UserCircle size={18} /> Admin
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
