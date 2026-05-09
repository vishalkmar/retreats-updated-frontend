import { Routes, Route, Navigate } from 'react-router-dom';

import PublicLayout from './layouts/PublicLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import ProtectedRoute from './components/admin/ProtectedRoute.jsx';

import HomePage from './pages/public/HomePage.jsx';
import RetreatsPage from './pages/public/RetreatsPage.jsx';
import PackageDetailPage from './pages/public/PackageDetailPage.jsx';
import BlogsListPage from './pages/public/BlogsListPage.jsx';
import BlogDetailPage from './pages/public/BlogDetailPage.jsx';
import NotFoundPage from './pages/public/NotFoundPage.jsx';

import AdminLoginPage from './pages/admin/AdminLoginPage.jsx';
import DashboardPage from './pages/admin/DashboardPage.jsx';
import HeroManagementPage from './pages/admin/HeroManagementPage.jsx';
import HeaderLinksPage from './pages/admin/HeaderLinksPage.jsx';
import ThemeManagementPage from './pages/admin/ThemeManagementPage.jsx';
import CitiesPage from './pages/admin/CitiesPage.jsx';
import CategoriesPage from './pages/admin/CategoriesPage.jsx';
import ProblemsPage from './pages/admin/ProblemsPage.jsx';
import ActivitiesPage from './pages/admin/ActivitiesPage.jsx';
import PackagesPage from './pages/admin/PackagesPage.jsx';
import PackageFormPage from './pages/admin/PackageFormPage.jsx';
import TestimonialsPage from './pages/admin/TestimonialsPage.jsx';
import BlogsPage from './pages/admin/BlogsPage.jsx';
import BlogFormPage from './pages/admin/BlogFormPage.jsx';
import BlogCategoriesPage from './pages/admin/BlogCategoriesPage.jsx';
import ReviewsPage from './pages/admin/ReviewsPage.jsx';

export default function App() {
  return (
    <Routes>
      {/* Public site */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/retreats" element={<RetreatsPage />} />
        <Route path="/retreats/:slug" element={<PackageDetailPage />} />
        <Route path="/blogs" element={<BlogsListPage />} />
        <Route path="/blogs/:slug" element={<BlogDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="website/hero" element={<HeroManagementPage />} />
        <Route path="website/header-links" element={<HeaderLinksPage />} />
        <Route path="website/theme" element={<ThemeManagementPage />} />
        <Route path="content/cities" element={<CitiesPage />} />
        <Route path="content/categories" element={<CategoriesPage />} />
        <Route path="content/problems" element={<ProblemsPage />} />
        <Route path="content/activities" element={<ActivitiesPage />} />
        <Route path="content/blog-categories" element={<BlogCategoriesPage />} />
        <Route path="packages" element={<PackagesPage />} />
        <Route path="packages/new" element={<PackageFormPage />} />
        <Route path="packages/:id/edit" element={<PackageFormPage />} />
        <Route path="testimonials" element={<TestimonialsPage />} />
        <Route path="blogs" element={<BlogsPage />} />
        <Route path="blogs/new" element={<BlogFormPage />} />
        <Route path="blogs/:id/edit" element={<BlogFormPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
      </Route>
    </Routes>
  );
}
