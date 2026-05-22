import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import BrowseCarsPage from '../pages/BrowseCarsPage';
import CarDetailPage from '../pages/CarDetailPage';
import ComparePage from '../pages/ComparePage';
import FavoritesPage from '../pages/FavoritesPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import AdminCarsPage from '../pages/AdminCarsPage';
import AdminLoginPage from '../pages/AdminLoginPage';
import AdminInquiriesPage from '../pages/AdminInquiriesPage';
import AdminTestDrivesPage from '../pages/AdminTestDrivesPage';
import AdminSettingsPage from '../pages/AdminSettingsPage';
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
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Protected Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout contained={false}>
                <AdminDashboardPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/cars" element={
            <ProtectedRoute>
              <AdminLayout contained={false}>
                <AdminCarsPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/inquiries" element={
            <ProtectedRoute>
              <AdminLayout contained={false}>
                <AdminInquiriesPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/test-drives" element={
            <ProtectedRoute>
              <AdminLayout contained={false}>
                <AdminTestDrivesPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/testimonials" element={
            <ProtectedRoute>
              <AdminLayout contained={false}>
                <AdminTestimonialsPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute>
              <AdminLayout contained={false}>
                <AdminSettingsPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default AppRouter;