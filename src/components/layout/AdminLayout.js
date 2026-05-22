import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, MessageSquare, Star, LogOut, Menu, X,
    Car, Calendar, Settings, ChevronRight, Search, Bell,
    ExternalLink, Globe, Mail, ArrowUpRight,
} from 'lucide-react';
import { auth, db } from '../../firebase/firebase';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

const navItems = (counts) => [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Cars', path: '/admin/cars', icon: Car, badge: counts.totalCars, badgeTone: 'muted' },
    { name: 'Inquiries', path: '/admin/inquiries', icon: MessageSquare, badge: counts.newInquiries, badgeTone: 'alert' },
    { name: 'Test drives', path: '/admin/test-drives', icon: Calendar, badge: counts.pendingTestDrives, badgeTone: 'alert' },
    { name: 'Testimonials', path: '/admin/testimonials', icon: Star, badge: counts.pendingTestimonials, badgeTone: 'alert' },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
];

const isActiveNav = (path, location, exact) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
};

const SidebarBody = ({ counts, user, onClose, onLogout, onNavigate }) => {
    const location = useLocation();
    const [searchValue, setSearchValue] = useState('');
    const navigate = useNavigate();

    const items = navItems(counts);

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            const q = searchValue.trim();
            navigate(`/admin/cars${q ? `?q=${encodeURIComponent(q)}` : ''}`);
            if (onNavigate) onNavigate();
        }
    };

    return (
        <aside className="w-72 shrink-0 bg-ivory-soft border-r border-ink/10 flex flex-col h-full">
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
                <Link to="/admin" className="flex items-center gap-2.5" onClick={onNavigate}>
                    <div className="w-9 h-9 rounded-xl bg-ink text-champagne flex items-center justify-center">
                        <span className="font-display text-[18px] leading-none">JA</span>
                    </div>
                    <div className="leading-tight">
                        <div className="font-display text-[18px] text-ink">Jain Autocars</div>
                        <div className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-ink-faint">Admin · v2.1</div>
                    </div>
                </Link>
                {onClose && (
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="lg:hidden w-8 h-8 rounded-full border border-ink/15 flex items-center justify-center text-ink"
                    >
                        <X size={13} />
                    </button>
                )}
            </div>

            <div className="px-4 pb-3">
                <div className="flex items-center gap-2 rounded-xl border border-ink/10 bg-ivory/70 px-3 py-2 focus-within:border-ink/40 transition-colors">
                    <Search size={13} className="text-ink-faint" />
                    <input
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyDown={handleSearch}
                        placeholder="Search cars, inquiries…"
                        className="flex-1 bg-transparent text-[12.5px] placeholder:text-ink-faint outline-none border-0 focus:ring-0 text-ink"
                    />
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-faint border border-ink/10 rounded px-1.5">⏎</span>
                </div>
            </div>

            <div className="hairline mx-4" />

            <nav className="px-3 py-3 flex-1 overflow-y-auto">
                <div className="px-2 pt-1 pb-2 font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-faint">
                    Overview
                </div>
                <ul className="space-y-1">
                    {items.map((it) => {
                        const Icon = it.icon;
                        const on = isActiveNav(it.path, location, it.exact);
                        const hasBadge = it.badge != null && it.badge > 0;
                        return (
                            <li key={it.path}>
                                <Link
                                    to={it.path}
                                    onClick={onNavigate}
                                    className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-[13.5px] transition-colors ${
                                        on
                                            ? 'bg-ink text-ivory shadow-[0_10px_30px_-12px_rgba(14,14,12,0.45)]'
                                            : 'text-ink/85 hover:bg-ink/5'
                                    }`}
                                >
                                    <span className="flex items-center gap-3 min-w-0">
                                        <span className={`shrink-0 ${on ? 'text-champagne' : 'text-ink-muted'}`}>
                                            <Icon size={15} />
                                        </span>
                                        <span className="truncate">{it.name}</span>
                                    </span>
                                    {hasBadge && (
                                        <span
                                            className="num text-[10.5px] px-1.5 py-0.5 rounded-full"
                                            style={{
                                                background:
                                                    it.badgeTone === 'alert'
                                                        ? on ? 'rgba(255,255,255,0.18)' : 'rgba(139,31,31,0.10)'
                                                        : on ? 'rgba(255,255,255,0.18)' : 'rgba(14,14,12,0.07)',
                                                color:
                                                    it.badgeTone === 'alert'
                                                        ? on ? '#fff' : '#8b1f1f'
                                                        : on ? '#fff' : '#5C5A52',
                                            }}
                                        >
                                            {it.badge}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                <div className="px-2 pt-6 pb-2 font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-faint">
                    Quick links
                </div>
                <Link
                    to="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-[13px] text-ink/85 hover:bg-ink/5 transition-colors"
                >
                    <span className="flex items-center gap-3"><ExternalLink size={14} className="text-ink-muted" /> View live site</span>
                    <ArrowUpRight size={13} className="text-ink-faint" />
                </Link>
                <Link
                    to="/used-cars-in-mysore"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-[13px] text-ink/85 hover:bg-ink/5 transition-colors"
                >
                    <span className="flex items-center gap-3"><Globe size={14} className="text-ink-muted" /> Public inventory</span>
                    <ArrowUpRight size={13} className="text-ink-faint" />
                </Link>
                <Link
                    to="/contact"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-[13px] text-ink/85 hover:bg-ink/5 transition-colors"
                >
                    <span className="flex items-center gap-3"><Mail size={14} className="text-ink-muted" /> Customer-facing forms</span>
                    <ArrowUpRight size={13} className="text-ink-faint" />
                </Link>
            </nav>

            <div className="px-4 py-4 border-t border-ink/10">
                <div className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white/60 px-3 py-2.5">
                    <div className="w-9 h-9 rounded-full bg-ink text-ivory font-display text-[17px] flex items-center justify-center shrink-0">
                        {(user?.displayName?.[0] || user?.email?.[0] || 'A').toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[13px] truncate text-ink">{user?.displayName || 'Admin'}</div>
                        <div className="text-[11px] text-ink-muted truncate">{user?.email || ''}</div>
                    </div>
                    <button
                        onClick={onLogout}
                        aria-label="Sign out"
                        className="w-9 h-9 rounded-full text-[#8b1f1f] hover:bg-[#8b1f1f]/10 flex items-center justify-center transition-colors"
                    >
                        <LogOut size={14} />
                    </button>
                </div>
            </div>
        </aside>
    );
};

const AdminHeader = ({ onMenu, totalAlerts, user, breadcrumbs, headerActions }) => (
    <header className="sticky top-0 z-30 bg-ivory/85 backdrop-blur border-b border-ink/10">
        <div className="flex items-center justify-between px-4 lg:px-8 py-3 gap-3">
            <div className="flex items-center gap-3 min-w-0">
                <button
                    onClick={onMenu}
                    className="lg:hidden w-10 h-10 rounded-full border border-ink/15 bg-white/60 flex items-center justify-center relative text-ink"
                    aria-label="Open menu"
                >
                    <Menu size={15} />
                    {totalAlerts > 0 && (
                        <span className="absolute -top-1 -right-1 num text-[9.5px] rounded-full bg-[#8b1f1f] text-white px-1.5">
                            {totalAlerts}
                        </span>
                    )}
                </button>
                <div className="hidden lg:flex items-center gap-2 text-[12.5px] text-ink-muted">
                    <span>Admin</span>
                    <ChevronRight size={12} className="text-ink-faint" />
                    <span className="text-ink">{breadcrumbs}</span>
                </div>
                <div className="lg:hidden font-display text-[18px] whitespace-nowrap text-ink">Admin Panel</div>
            </div>

            <div className="flex items-center gap-2">
                {headerActions}
                <button
                    aria-label="Notifications"
                    className="relative w-10 h-10 rounded-full border border-ink/15 bg-white/60 flex items-center justify-center hover:bg-ink hover:text-ivory text-ink transition-colors"
                >
                    <Bell size={14} />
                    {totalAlerts > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#8b1f1f]" />
                    )}
                </button>
                <div className="hidden md:flex items-center gap-2 pl-2">
                    <div className="w-9 h-9 rounded-full bg-ink text-ivory font-display text-[17px] flex items-center justify-center">
                        {(user?.displayName?.[0] || user?.email?.[0] || 'A').toUpperCase()}
                    </div>
                </div>
            </div>
        </div>
    </header>
);

const AdminLayout = ({ children, headerActions, breadcrumbs, contained = true }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [counts, setCounts] = useState({ newInquiries: 0, pendingTestimonials: 0, pendingTestDrives: 0, totalCars: 0 });
    const [user, setUser] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const unsubInq = onSnapshot(
            query(collection(db, 'inquiries'), where('status', '==', 'new')),
            (snap) => setCounts((prev) => ({ ...prev, newInquiries: snap.size })),
            (err) => console.error('Inquiries badge snapshot error:', err)
        );
        const unsubTest = onSnapshot(
            query(collection(db, 'testimonials'), where('approved', '==', false)),
            (snap) => setCounts((prev) => ({ ...prev, pendingTestimonials: snap.size })),
            (err) => console.error('Testimonials badge snapshot error:', err)
        );
        const unsubDrives = onSnapshot(
            query(collection(db, 'testDrives'), where('status', '==', 'pending')),
            (snap) => setCounts((prev) => ({ ...prev, pendingTestDrives: snap.size })),
            (err) => console.error('Test drives badge snapshot error:', err)
        );
        const unsubCars = onSnapshot(
            collection(db, 'cars'),
            (snap) => setCounts((prev) => ({ ...prev, totalCars: snap.size })),
            (err) => console.error('Cars badge snapshot error:', err)
        );
        const unsubAuth = auth.onAuthStateChanged((u) => setUser(u));
        return () => {
            unsubInq();
            unsubTest();
            unsubDrives();
            unsubCars();
            unsubAuth();
        };
    }, []);

    useEffect(() => {
        document.body.style.overflow = isSidebarOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isSidebarOpen]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/admin/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const items = navItems(counts);
    const activeItem = items.find((i) => isActiveNav(i.path, location, i.exact)) || items[0];
    const totalAlerts = counts.newInquiries + counts.pendingTestimonials + counts.pendingTestDrives;

    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <div className="min-h-screen bg-ivory text-ink flex">
            <div className="hidden lg:block" style={{ height: '100vh', position: 'sticky', top: 0 }}>
                <SidebarBody
                    counts={counts}
                    user={user}
                    onLogout={handleLogout}
                />
            </div>

            {isSidebarOpen && (
                <div className="lg:hidden fixed inset-0 z-40">
                    <div
                        onClick={closeSidebar}
                        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
                    />
                    <div className="absolute left-0 top-0 h-full">
                        <SidebarBody
                            counts={counts}
                            user={user}
                            onClose={closeSidebar}
                            onNavigate={closeSidebar}
                            onLogout={handleLogout}
                        />
                    </div>
                </div>
            )}

            <div className="flex-1 min-w-0 flex flex-col">
                <AdminHeader
                    onMenu={() => setIsSidebarOpen(true)}
                    totalAlerts={totalAlerts}
                    user={user}
                    breadcrumbs={breadcrumbs || activeItem.name}
                    headerActions={headerActions}
                />
                <main className="flex-1">
                    {contained ? (
                        <div className="p-4 sm:p-6 lg:p-8">
                            <div className="max-w-7xl mx-auto">{children}</div>
                        </div>
                    ) : (
                        children
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
