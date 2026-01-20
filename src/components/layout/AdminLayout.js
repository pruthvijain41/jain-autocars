import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    MessageSquare,
    Star,
    LogOut,
    Menu,
    X,
    Car,
    ChevronRight
} from 'lucide-react';
import { auth } from '../../firebase/firebase';
import { signOut } from 'firebase/auth';

const AdminLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/admin/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const navItems = [
        { name: 'Dashboard', path: '/admin/cars', icon: LayoutDashboard },
        { name: 'Inquiries', path: '/admin/inquiries', icon: MessageSquare },
        { name: 'Testimonials', path: '/admin/testimonials', icon: Star },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 shadow-xl lg:shadow-none transform transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="h-full flex flex-col">
                    {/* Logo Area */}
                    <div className="h-16 flex items-center px-6 border-b border-slate-100">
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="bg-primary text-white p-1.5 rounded-lg">
                                <span className="font-heading font-bold text-lg tracking-tighter">JA</span>
                            </div>
                            <span className="font-heading font-bold text-lg text-slate-900">Admin Panel</span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        <div className="mb-6">
                            <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Overview</p>
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.path);
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsSidebarOpen(false)}
                                        className={`
                                            flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                                            ${active
                                                ? 'bg-primary text-white shadow-md shadow-primary/20'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                            }
                                        `}
                                    >
                                        <Icon size={20} className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'} />
                                        {item.name}
                                        {active && <ChevronRight size={16} className="ml-auto opacity-50" />}
                                    </Link>
                                );
                            })}
                        </div>

                        <div>
                            <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Quick Links</p>
                            <Link
                                to="/"
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
                            >
                                <Car size={20} className="text-slate-400" />
                                View Live Site
                            </Link>
                        </div>
                    </nav>

                    {/* User Profile / Logout */}
                    <div className="p-4 border-t border-slate-100">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
                        >
                            <LogOut size={20} />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="lg:hidden bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                            <Menu size={24} />
                        </button>
                        <span className="font-heading font-bold text-lg text-slate-900">Admin Panel</span>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
