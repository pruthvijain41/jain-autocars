import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
    const location = useLocation();
    // Hide Navbar/Footer on Admin Login if desired, or keep them. 
    // For now, we'll keep them everywhere for consistency, 
    // but maybe simplify Navbar for admin.

    const isAdminRoute = location.pathname.startsWith('/admin');

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            {!isAdminRoute && <Navbar />}
            {/* For admin routes, we might want a different layout, but for now let's just render children if it's admin, 
          or maybe we want the public navbar on admin login? 
          Let's assume Admin has its own internal layout, but for public pages we use this.
          Actually, let's wrap everything. If it's an admin internal page, the page itself might handle the sidebar.
      */}

            <main className={`flex-grow ${!isAdminRoute ? 'pt-0' : ''}`}>
                {children}
            </main>

            {!isAdminRoute && <Footer />}
        </div>
    );
};

export default Layout;
