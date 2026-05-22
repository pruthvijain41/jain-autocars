import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, UserCircle, Phone, Heart, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFavorites } from '../../utils/favorites';

const NAV_LINKS = [
    { name: 'Inventory', path: '/used-cars-in-mysore', kind: 'route' },
    { name: 'Why Us', path: '/#why', kind: 'anchor' },
    { name: 'Sell Your Car', path: '/#sell', kind: 'anchor' },
    { name: 'Stories', path: '/#stories', kind: 'anchor' },
    { name: 'Visit', path: '/contact', kind: 'route' },
];

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [favCount, setFavCount] = useState(0);
    const location = useLocation();

    // The home hero is dark — we can let the navbar float transparently on top
    // of it. Every other page has a light ivory background, so the navbar
    // needs the dark ink/85 backdrop right from the top to stay legible.
    const isHome = location.pathname === '/';

    useEffect(() => {
        const update = () => setFavCount(getFavorites().length);
        update();
        window.addEventListener('jain:storage', update);
        return () => window.removeEventListener('jain:storage', update);
    }, []);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => { setIsOpen(false); }, [location]);

    const onScrolledBg = scrolled || isOpen || !isHome;
    const headerCls = onScrolledBg
        ? 'bg-ink/85 backdrop-blur-md border-b border-ivory/10 py-2'
        : 'bg-transparent py-4';

    const isActiveRoute = (link) => {
        if (link.kind === 'route') return location.pathname === link.path;
        return false;
    };

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 text-ivory ${headerCls}`}>
            <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-12">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-ivory/30">
                            <span className="font-display text-[20px] leading-none text-ivory">J</span>
                        </span>
                        <span className="font-display text-[22px] leading-none text-ivory">
                            Jain Autocars
                        </span>
                        <span className="hidden lg:inline font-mono text-[10px] uppercase tracking-[0.18em] ml-2 text-ivory/50">
                            est. 2011 · Mysore
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6 lg:gap-8">
                        {NAV_LINKS.map((link) => {
                            const active = isActiveRoute(link);
                            const className = `link-u text-[13.5px] font-medium transition-colors ${active ? 'text-champagne' : 'text-ivory/85 hover:text-ivory'}`;
                            if (link.kind === 'route') {
                                return (
                                    <Link key={link.name} to={link.path} className={className}>
                                        {link.name}
                                    </Link>
                                );
                            }
                            return (
                                <a key={link.name} href={link.path} className={className}>
                                    {link.name}
                                </a>
                            );
                        })}
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                        <a
                            href="tel:+919986619282"
                            className="hidden lg:inline-flex items-center gap-2 text-[13px] text-ivory/85 hover:text-ivory transition-colors"
                        >
                            <Phone size={14} />
                            <span>+91 99866 19282</span>
                        </a>

                        <Link
                            to="/favorites"
                            className="relative p-2 rounded-full text-ivory/70 hover:text-ivory hover:bg-ivory/10 transition-colors"
                            title="Favorites"
                        >
                            <Heart size={18} fill={favCount > 0 ? 'currentColor' : 'none'} className={favCount > 0 ? 'text-red-500' : ''} />
                            {favCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 inline-flex items-center justify-center">
                                    {favCount}
                                </span>
                            )}
                        </Link>

                        <Link
                            to="/admin/login"
                            className="p-2 rounded-full text-ivory/70 hover:text-ivory hover:bg-ivory/10 transition-colors"
                            title="Admin Login"
                        >
                            <UserCircle size={18} />
                        </Link>

                        <Link
                            to="/used-cars-in-mysore"
                            className="ml-1 inline-flex items-center gap-2 rounded-full border border-ivory/25 text-ivory hover:bg-ivory hover:text-ink px-4 py-2 text-[13px] font-medium transition-colors"
                        >
                            <Calendar size={14} />
                            <span>Book a test drive</span>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden p-2 rounded-lg text-ivory hover:bg-ivory/10 transition-colors"
                        aria-label="Menu"
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
                        className="md:hidden bg-ink border-t border-ivory/10 overflow-hidden"
                    >
                        <div className="px-4 py-6 space-y-4">
                            {NAV_LINKS.map((link) => {
                                const active = isActiveRoute(link);
                                const className = `block text-lg font-medium py-3 border-b border-ivory/10 last:border-0 ${active ? 'text-champagne' : 'text-ivory/85'}`;
                                if (link.kind === 'route') {
                                    return (
                                        <Link key={link.name} to={link.path} className={className}>{link.name}</Link>
                                    );
                                }
                                return (
                                    <a key={link.name} href={link.path} className={className}>{link.name}</a>
                                );
                            })}
                            <div className="pt-4 flex items-center justify-between">
                                <a href="tel:+919986619282" className="flex items-center gap-2 text-ivory font-medium">
                                    <Phone size={16} className="text-champagne" /> +91 99866 19282
                                </a>
                                <Link to="/admin/login" className="flex items-center gap-2 text-sm font-medium text-ivory/60">
                                    <UserCircle size={18} /> Admin
                                </Link>
                            </div>
                            <Link to="/favorites" className="flex items-center justify-between pt-4 text-ivory/80">
                                <span className="flex items-center gap-2"><Heart size={16} /> Favorites</span>
                                {favCount > 0 && (
                                    <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5">{favCount}</span>
                                )}
                            </Link>
                            <Link
                                to="/used-cars-in-mysore"
                                className="inline-flex items-center gap-2 rounded-full border border-ivory/25 text-ivory px-4 py-2 text-[13px] font-medium mt-2"
                            >
                                <Calendar size={14} /> Book a test drive
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
