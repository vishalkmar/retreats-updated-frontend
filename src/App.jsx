import { Routes, Route, Navigate } from 'react-router-dom';

import PublicLayout from './layouts/PublicLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import UserDashboardLayout from './layouts/UserDashboardLayout.jsx';
import ProtectedRoute from './components/admin/ProtectedRoute.jsx';
import UserProtectedRoute from './components/public/UserProtectedRoute.jsx';
import UserDashboardHomePage from './pages/user/UserDashboardHomePage.jsx';
import UserProfilePage from './pages/user/UserProfilePage.jsx';
import UserBookingsPage from './pages/user/UserBookingsPage.jsx';
import UserTransactionsPage from './pages/user/UserTransactionsPage.jsx';
import UserWishlistPage from './pages/user/UserWishlistPage.jsx';
import UserReferEarnPage from './pages/user/UserReferEarnPage.jsx';
import BookingPreviewPage from './pages/user/BookingPreviewPage.jsx';
import BookingCheckoutPage from './pages/user/BookingCheckoutPage.jsx';
import BookingSuccessPage from './pages/user/BookingSuccessPage.jsx';

import HomePage from './pages/public/HomePage.jsx';
import RetreatsPage from './pages/public/RetreatsPage.jsx';
import PackageDetailPage from './pages/public/PackageDetailPage.jsx';
import HotelsListPage from './pages/public/HotelsListPage.jsx';
import HotelDetailPage from './pages/public/HotelDetailPage.jsx';
import RoomDetailPage from './pages/public/RoomDetailPage.jsx';
import EventsListPage from './pages/public/EventsListPage.jsx';
import EventDetailPage from './pages/public/EventDetailPage.jsx';
import AddOnDetailPage from './pages/public/AddOnDetailPage.jsx';
import EventActivitiesListPage from './pages/public/EventActivitiesListPage.jsx';
import EventActivityDetailPage from './pages/public/EventActivityDetailPage.jsx';
import BlogsListPage from './pages/public/BlogsListPage.jsx';
import BlogDetailPage from './pages/public/BlogDetailPage.jsx';
import LegalPage from './pages/public/LegalPage.jsx';
import NotFoundPage from './pages/public/NotFoundPage.jsx';

import AdminLoginPage from './pages/admin/AdminLoginPage.jsx';
import DashboardPage from './pages/admin/DashboardPage.jsx';
import AdminBookingsPage from './pages/admin/AdminBookingsPage.jsx';
import AdminTransactionsPage from './pages/admin/AdminTransactionsPage.jsx';
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx';
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage.jsx';
import AdminReferralConfigPage from './pages/admin/AdminReferralConfigPage.jsx';
import AdminRefundPolicyPage from './pages/admin/AdminRefundPolicyPage.jsx';
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
import EventActivitiesPage from './pages/admin/EventActivitiesPage.jsx';
import EventActivityFormPage from './pages/admin/EventActivityFormPage.jsx';
import EventTypesPage from './pages/admin/EventTypesPage.jsx';
import EventsPage from './pages/admin/EventsPage.jsx';
import EventFormPage from './pages/admin/EventFormPage.jsx';
import PromoBannersPage from './pages/admin/PromoBannersPage.jsx';
import PromoBannerFormPage from './pages/admin/PromoBannerFormPage.jsx';
import PackagesPage from './pages/admin/PackagesPage.jsx';
import PackageFormPage from './pages/admin/PackageFormPage.jsx';
import TrainersPage from './pages/admin/TrainersPage.jsx';
import TrainerFormPage from './pages/admin/TrainerFormPage.jsx';
import ChecklistPage from './pages/admin/ChecklistPage.jsx';
import FeaturedTabsPage from './pages/admin/FeaturedTabsPage.jsx';
import TestimonialsPage from './pages/admin/TestimonialsPage.jsx';
import BlogsPage from './pages/admin/BlogsPage.jsx';
import BlogFormPage from './pages/admin/BlogFormPage.jsx';
import BlogCategoriesPage from './pages/admin/BlogCategoriesPage.jsx';
import ReviewsPage from './pages/admin/ReviewsPage.jsx';
import SiteDetailsPage from './pages/admin/SiteDetailsPage.jsx';
import PersonalisedRecommendationPage from './pages/admin/PersonalisedRecommendationPage.jsx';
import AuditorsPage from './pages/admin/AuditorsPage.jsx';
import OfficersPage from './pages/admin/OfficersPage.jsx';
import SignedPropertiesPage from './pages/admin/SignedPropertiesPage.jsx';
import PwaListingPage from './pages/admin/PwaListingPage.jsx';
import PwaListingConfigPage from './pages/admin/PwaListingConfigPage.jsx';
import PropertyListingImagesPage from './pages/admin/PropertyListingImagesPage.jsx';
import SalespeoplePage from './pages/admin/SalespeoplePage.jsx';

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
        <Route path="/events-activities" element={<EventActivitiesListPage />} />
        <Route path="/events-activities/:slug" element={<EventActivityDetailPage />} />
        <Route path="/add-ons/:slug" element={<AddOnDetailPage />} />
        <Route path="/blogs" element={<BlogsListPage />} />
        <Route path="/blogs/:slug" element={<BlogDetailPage />} />
        <Route path="/privacy" element={<LegalPage type="privacy" />} />
        <Route path="/terms" element={<LegalPage type="terms" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Booking flow — both pages require auth. They live outside the dashboard
          layout because we want a clean, full-bleed checkout surface free of
          the sidebar (matches every other booking platform's checkout UX). */}
      <Route
        path="/book/:type/:id"
        element={
          <UserProtectedRoute>
            <BookingPreviewPage />
          </UserProtectedRoute>
        }
      />
      <Route
        path="/checkout/:code"
        element={
          <UserProtectedRoute>
            <BookingCheckoutPage />
          </UserProtectedRoute>
        }
      />
      <Route
        path="/booking-success/:code"
        element={
          <UserProtectedRoute>
            <BookingSuccessPage />
          </UserProtectedRoute>
        }
      />

      {/* Authenticated user dashboard — sidebar layout with nested routes.
          Lives OUTSIDE PublicLayout so it doesn't inherit the public header,
          footer and "Book Retreats" CTA. UserProtectedRoute handles the
          "not signed in → open login modal" flow. */}
      <Route
        path="/dashboard"
        element={
          <UserProtectedRoute>
            <UserDashboardLayout />
          </UserProtectedRoute>
        }
      >
        <Route index element={<UserDashboardHomePage />} />
        <Route path="profile" element={<UserProfilePage />} />
        <Route path="bookings" element={<UserBookingsPage />} />
        <Route path="transactions" element={<UserTransactionsPage />} />
        <Route path="wishlist" element={<UserWishlistPage />} />
        <Route path="refer" element={<UserReferEarnPage />} />
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
        <Route path="bookings" element={<AdminBookingsPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="users/:id" element={<AdminUserDetailPage />} />
        <Route path="transactions" element={<AdminTransactionsPage />} />
        <Route path="config/referrals" element={<AdminReferralConfigPage />} />
        <Route path="config/refunds" element={<AdminRefundPolicyPage />} />
        <Route path="website/hero" element={<HeroManagementPage />} />
        <Route path="website/header-links" element={<HeaderLinksPage />} />
        <Route path="website/theme" element={<ThemeManagementPage />} />
        <Route path="website/site-details" element={<SiteDetailsPage />} />
        <Route path="website/personalised-recommendation" element={<PersonalisedRecommendationPage />} />
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
        <Route path="event-activities" element={<EventActivitiesPage />} />
        <Route path="event-activities/new" element={<EventActivityFormPage />} />
        <Route path="event-activities/:id/edit" element={<EventActivityFormPage />} />
        <Route path="content/event-types" element={<EventTypesPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/new" element={<EventFormPage />} />
        <Route path="events/:id/edit" element={<EventFormPage />} />
        <Route path="website/promo-banners" element={<PromoBannersPage />} />
        <Route path="promo-banners" element={<PromoBannersPage />} />
        <Route path="promo-banners/new" element={<PromoBannerFormPage />} />
        <Route path="promo-banners/:id/edit" element={<PromoBannerFormPage />} />
        <Route path="packages" element={<PackagesPage />} />
        <Route path="packages/new" element={<PackageFormPage />} />
        <Route path="packages/:id/edit" element={<PackageFormPage />} />
        <Route path="trainers" element={<TrainersPage />} />
        <Route path="trainers/new" element={<TrainerFormPage />} />
        <Route path="trainers/:id/edit" element={<TrainerFormPage />} />
        <Route path="checklist" element={<ChecklistPage />} />
        <Route path="website/featured-tabs" element={<FeaturedTabsPage />} />
        <Route path="testimonials" element={<TestimonialsPage />} />
        <Route path="blogs" element={<BlogsPage />} />
        <Route path="blogs/new" element={<BlogFormPage />} />
        <Route path="blogs/:id/edit" element={<BlogFormPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="pwa/listings" element={<PwaListingPage />} />
        <Route path="pwa/listings/:propertyId" element={<PwaListingConfigPage />} />
        <Route path="pwa/auditors" element={<AuditorsPage />} />
        <Route path="pwa/signed-properties" element={<SignedPropertiesPage />} />
        <Route path="pwa/listing-images" element={<PropertyListingImagesPage />} />
        <Route path="pwa/salespersons" element={<SalespeoplePage />} />
      </Route>
    </Routes>
  );
}
