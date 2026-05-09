import { Image, Globe, Palette, Package, MapPin, Tag, HeartPulse, Activity, MessageSquareQuote, FileText, BookOpen, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const cards = [
  { label: 'Hero Sections', icon: Image, to: '/admin/website/hero', color: 'brand' },
  { label: 'Header Links', icon: Globe, to: '/admin/website/header-links', color: 'brand' },
  { label: 'Theme Manager', icon: Palette, to: '/admin/website/theme', color: 'brand' },
  { label: 'Cities', icon: MapPin, to: '/admin/content/cities', color: 'brand' },
  { label: 'Categories', icon: Tag, to: '/admin/content/categories', color: 'wellness' },
  { label: 'Problems', icon: HeartPulse, to: '/admin/content/problems', color: 'wellness' },
  { label: 'Activities', icon: Activity, to: '/admin/content/activities', color: 'wellness' },
  { label: 'Packages', icon: Package, to: '/admin/packages', color: 'wellness' },
  { label: 'Reviews', icon: Star, to: '/admin/reviews', color: 'wellness' },
  { label: 'Testimonials', icon: MessageSquareQuote, to: '/admin/testimonials', color: 'wellness' },
  { label: 'Blogs', icon: FileText, to: '/admin/blogs', color: 'brand' },
  { label: 'Blog Categories', icon: BookOpen, to: '/admin/content/blog-categories', color: 'brand' },
];

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-1">Dashboard</h1>
      <p className="text-ink-muted text-sm mb-8">Manage every part of your site from here.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="card p-6 hover:shadow-lg transition group relative"
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                c.color === 'wellness' ? 'bg-wellness/10 text-wellness' : 'bg-brand/10 text-brand'
              } group-hover:scale-110 transition`}
            >
              <c.icon size={22} />
            </div>
            <div className="font-semibold">{c.label}</div>
            <div className="text-xs text-ink-muted mt-1">
              {c.soon ? 'Coming next' : 'Open & manage'}
            </div>
            {c.soon && (
              <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                SOON
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
