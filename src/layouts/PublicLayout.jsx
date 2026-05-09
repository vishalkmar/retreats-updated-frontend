import { Outlet } from 'react-router-dom';
import Header from '../components/public/Header.jsx';
import Footer from '../components/public/Footer.jsx';
import PageHero, { PageHeroProvider } from '../components/public/PageHero.jsx';

/**
 * Header is `fixed` and transparent at the top of pages that have a hero —
 * the hero shows through. On pages without a hero, Header stays solid so
 * its links are readable. PageHeroProvider broadcasts that state to both
 * Header and PageHero so the two stay in lockstep.
 */
export default function PublicLayout() {
  return (
    <PageHeroProvider>
      <div className="flex flex-col min-h-screen bg-surface">
        <Header />
        <main className="flex-1">
          <PageHero />
          <Outlet />
        </main>
        <Footer />
      </div>
    </PageHeroProvider>
  );
}
