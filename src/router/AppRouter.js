import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import BrowseCarsPage from '../pages/BrowseCarsPage';
import CarDetailPage from '../pages/CarDetailPage';
import AdminCarsPage from '../pages/AdminCarsPage';
import AdminLoginPage from '../pages/AdminLoginPage';
import AdminInquiriesPage from '../pages/AdminInquiriesPage';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import ContactUsPage from '../pages/ContactUsPage';
import AdminTestimonialsPage from '../pages/AdminTestimonialsPage';
import Layout from '../components/layout/Layout';
import AdminLayout from '../components/layout/AdminLayout';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/used-cars-in-mysore" element={<BrowseCarsPage />} />
          <Route path="/contact" element={<ContactUsPage />} />
          <Route path="/car/:carId" element={<CarDetailPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Protected Admin Routes */}
          {/* Protected Admin Routes */}
          <Route path="/admin/cars" element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminCarsPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/inquiries" element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminInquiriesPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/testimonials" element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminTestimonialsPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default AppRouter;