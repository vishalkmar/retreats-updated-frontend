import SearchTabs from '../../components/public/SearchTabs.jsx';
import HomeResultsTabs from '../../components/public/HomeResultsTabs.jsx';
import TestimonialsSection from '../../components/public/TestimonialsSection.jsx';
import ClientReviewsSection from '../../components/public/ClientReviewsSection.jsx';
import VideoTestimonialsBand from '../../components/public/VideoTestimonialsBand.jsx';
import BlogsSection from '../../components/public/BlogsSection.jsx';

export default function HomePage() {
  return (
    <>
      {/* Hero is rendered by <PageHero/> in PublicLayout. Search bar sits
          right below it (with a negative top margin to overlap the hero edge).
          HomeResultsTabs shows either featured items (default) OR location-
          filtered Hotels/Packages/Events when search params are present. */}
      <SearchTabs />
      <HomeResultsTabs />
      <VideoTestimonialsBand />
      <ClientReviewsSection />
      <TestimonialsSection />
      <BlogsSection />
    </>
  );
}
