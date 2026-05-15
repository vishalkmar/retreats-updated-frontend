import { Routes, Route, Navigate } from 'react-router-dom';

import PublicLayout from './layouts/PublicLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import ProtectedRoute from './components/admin/ProtectedRoute.jsx';

import HomePage from './pages/public/HomePage.jsx';
import RetreatsPage from './pages/public/RetreatsPage.jsx';
import PackageDetailPage from './pages/public/PackageDetailPage.jsx';
import HotelsListPage from './pages/public/HotelsListPage.jsx';
import HotelDetailPage from './pages/public/HotelDetailPage.jsx';
import RoomDetailPage from './pages/public/RoomDetailPage.jsx';
import EventsListPage from './pages/public/EventsListPage.jsx';
import EventDetailPage from './pages/public/EventDetailPage.jsx';
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
import AreasPage from './pages/admin/AreasPage.jsx';
import CulturesPage from './pages/admin/CulturesPage.jsx';
import LocationsPage from './pages/admin/LocationsPage.jsx';
import FacilitiesPage from './pages/admin/FacilitiesPage.jsx';
import RoomViewsPage from './pages/admin/RoomViewsPage.jsx';
import NearbyPlacesPage from './pages/admin/NearbyPlacesPage.jsx';
import HotelsPage from './pages/admin/HotelsPage.jsx';
import HotelFormPage from './pages/admin/HotelFormPage.jsx';
import AvailableRoomsPage from './pages/admin/AvailableRoomsPage.jsx';
import AvailableRoomFormPage from './pages/admin/AvailableRoomFormPage.jsx';
import AddOnActivitiesPage from './pages/admin/AddOnActivitiesPage.jsx';
import AddOnActivityFormPage from './pages/admin/AddOnActivityFormPage.jsx';
import EventTypesPage from './pages/admin/EventTypesPage.jsx';
import EventsPage from './pages/admin/EventsPage.jsx';
import EventFormPage from './pages/admin/EventFormPage.jsx';
import PackagesPage from './pages/admin/PackagesPage.jsx';
import PackageFormPage from './pages/admin/PackageFormPage.jsx';
import TestimonialsPage from './pages/admin/TestimonialsPage.jsx';
import BlogsPage from './pages/admin/BlogsPage.jsx';
import BlogFormPage from './pages/admin/BlogFormPage.jsx';
import BlogCategoriesPage from './pages/admin/BlogCategoriesPage.jsx';
import ReviewsPage from './pages/admin/ReviewsPage.jsx';
import SiteDetailsPage from './pages/admin/SiteDetailsPage.jsx';
import AuditorsPage from './pages/admin/AuditorsPage.jsx';
import OfficersPage from './pages/admin/OfficersPage.jsx';
import SignedPropertiesPage from './pages/admin/SignedPropertiesPage.jsx';

export default function App() {
  return (
    <Routes>
      {/* Public site */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/retreats" element={<RetreatsPage />} />
        <Route path="/retreats/:slug" element={<PackageDetailPage />} />
        <Route path="/hotels" element={<HotelsListPage />} />
        <Route path="/hotels/:slug" element={<HotelDetailPage />} />
        <Route path="/hotels/:hotelSlug/rooms/:roomSlug" element={<RoomDetailPage />} />
        <Route path="/events" element={<EventsListPage />} />
        <Route path="/events/:slug" element={<EventDetailPage />} />
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
        <Route path="website/site-details" element={<SiteDetailsPage />} />
        <Route path="content/cities" element={<CitiesPage />} />
        <Route path="content/categories" element={<CategoriesPage />} />
        <Route path="content/problems" element={<ProblemsPage />} />
        <Route path="content/activities" element={<ActivitiesPage />} />
        <Route path="content/areas" element={<AreasPage />} />
        <Route path="content/cultures" element={<CulturesPage />} />
        <Route path="content/blog-categories" element={<BlogCategoriesPage />} />
        <Route path="hotels-config/locations" element={<LocationsPage />} />
        <Route path="hotels-config/facilities" element={<FacilitiesPage />} />
        <Route path="hotels-config/room-views" element={<RoomViewsPage />} />
        <Route path="hotels-config/nearby-places" element={<NearbyPlacesPage />} />
        <Route path="hotels" element={<HotelsPage />} />
        <Route path="hotels/new" element={<HotelFormPage />} />
        <Route path="hotels/:id/edit" element={<HotelFormPage />} />
        <Route path="rooms" element={<AvailableRoomsPage />} />
        <Route path="rooms/new" element={<AvailableRoomFormPage />} />
        <Route path="rooms/:id/edit" element={<AvailableRoomFormPage />} />
        <Route path="add-ons" element={<AddOnActivitiesPage />} />
        <Route path="add-ons/new" element={<AddOnActivityFormPage />} />
        <Route path="add-ons/:id/edit" element={<AddOnActivityFormPage />} />
        <Route path="content/event-types" element={<EventTypesPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/new" element={<EventFormPage />} />
        <Route path="events/:id/edit" element={<EventFormPage />} />
        <Route path="packages" element={<PackagesPage />} />
        <Route path="packages/new" element={<PackageFormPage />} />
        <Route path="packages/:id/edit" element={<PackageFormPage />} />
        <Route path="testimonials" element={<TestimonialsPage />} />
        <Route path="blogs" element={<BlogsPage />} />
        <Route path="blogs/new" element={<BlogFormPage />} />
        <Route path="blogs/:id/edit" element={<BlogFormPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="pwa/auditors" element={<AuditorsPage />} />
        <Route path="pwa/officers" element={<OfficersPage />} />
        <Route path="pwa/signed-properties" element={<SignedPropertiesPage />} />
      </Route>
    </Routes>
  );
}
