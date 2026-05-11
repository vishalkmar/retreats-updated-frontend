import CityCarousel from '../../components/public/CityCarousel.jsx';
import ProblemFilterSection from '../../components/public/ProblemFilterSection.jsx';
import ActivityFilterSection from '../../components/public/ActivityFilterSection.jsx';
import FeaturedRetreats from '../../components/public/FeaturedRetreats.jsx';
import TestimonialsSection from '../../components/public/TestimonialsSection.jsx';
import ClientReviewsSection from '../../components/public/ClientReviewsSection.jsx';
import VideoTestimonialsBand from '../../components/public/VideoTestimonialsBand.jsx';
import BlogsSection from '../../components/public/BlogsSection.jsx';

export default function HomePage() {
  return (
    <>
      {/* Hero is now rendered by <PageHero/> in PublicLayout based on URL → pageKey */}
      <CityCarousel />
      <FeaturedRetreats />
      <ProblemFilterSection />
      <VideoTestimonialsBand />
      <ActivityFilterSection />
      <ClientReviewsSection />
      <TestimonialsSection />
      <BlogsSection />
    </>
  );
}
