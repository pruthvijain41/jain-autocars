import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import CompareBar from '../cars/CompareBar';
import { useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            {!isAdminRoute && <Navbar />}

            <main className={`flex-grow ${!isAdminRoute ? 'pt-0' : ''}`}>
                {children}
            </main>

            {!isAdminRoute && <Footer />}
            {!isAdminRoute && <CompareBar />}
        </div>
    );
};

export default Layout;
