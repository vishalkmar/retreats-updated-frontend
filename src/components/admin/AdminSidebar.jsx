import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Image,
  Globe,
  Palette,
  ChevronDown,
  X,
  Settings,
  MapPin,
  Tag,
  HeartPulse,
  Activity,
  Layers,
  Package as PkgIcon,
  MessageSquareQuote,
  FileText,
  BookOpen,
  Star,
} from 'lucide-react';
import api from '../../services/api';

const websiteItems = [
  { to: '/admin/website/hero', label: 'Hero Sections', icon: Image },
  { to: '/admin/website/header-links', label: 'Header Links', icon: Globe },
  { to: '/admin/website/theme', label: 'Theme', icon: Palette },
];

const contentItems = [
  { to: '/admin/content/cities', label: 'Cities', icon: MapPin },
  { to: '/admin/content/categories', label: 'Categories', icon: Tag },
  { to: '/admin/content/problems', label: 'Problems', icon: HeartPulse },
  { to: '/admin/content/activities', label: 'Activities', icon: Activity },
  { to: '/admin/content/blog-categories', label: 'Blog Categories', icon: BookOpen },
];

export default function AdminSidebar({ open, onClose }) {
  const [websiteOpen, setWebsiteOpen] = useState(true);
  const [contentOpen, setContentOpen] = useState(true);
  const [pendingReviews, setPendingReviews] = useState(0);

  // Poll pending review count once on mount + when window refocuses
  useEffect(() => {
    const fetchPending = () => {
      api.get('/packages/admin/reviews', { params: { status: 'pending', limit: 1 } })
        .then((res) => setPendingReviews(res.data?.data?.pendingCount || 0))
        .catch(() => {});
    };
    fetchPending();
    window.addEventListener('focus', fetchPending);
    return () => window.removeEventListener('focus', fetchPending);
  }, []);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
      isActive
        ? 'bg-brand text-white shadow-soft'
        : 'text-slate-300 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/10">
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <img
              src="/retreatlogo.png"
              alt="Retreats by Traveon"
              className="h-9 w-auto object-contain bg-white/95 rounded px-1.5 py-0.5"
            />
            <span className="font-display font-bold text-sm">Admin</span>
          </Link>
          <button onClick={onClose} className="lg:hidden text-white/70 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          <NavLink to="/admin/dashboard" className={linkClass}>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>

          <NavLink to="/admin/packages" className={linkClass}>
            <PkgIcon size={18} /> Packages
          </NavLink>

          <NavLink to="/admin/reviews" className={linkClass}>
            {({ isActive }) => (
              <>
                <Star size={18} />
                <span className="flex-1">Reviews</span>
                {pendingReviews > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white text-brand' : 'bg-amber-400 text-amber-900'}`}>
                    {pendingReviews}
                  </span>
                )}
              </>
            )}
          </NavLink>

          <NavLink to="/admin/testimonials" className={linkClass}>
            <MessageSquareQuote size={18} /> Testimonials
          </NavLink>

          <NavLink to="/admin/blogs" className={linkClass}>
            <FileText size={18} /> Blogs
          </NavLink>

          <button
            onClick={() => setWebsiteOpen(!websiteOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition"
          >
            <span className="flex items-center gap-3">
              <Settings size={18} /> Website Configure
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform ${websiteOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {websiteOpen && (
            <div className="ml-3 pl-3 border-l border-white/10 space-y-1">
              {websiteItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={linkClass}>
                  <item.icon size={16} /> {item.label}
                </NavLink>
              ))}
            </div>
          )}

          <button
            onClick={() => setContentOpen(!contentOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition mt-2"
          >
            <span className="flex items-center gap-3">
              <Layers size={18} /> Content
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform ${contentOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {contentOpen && (
            <div className="ml-3 pl-3 border-l border-white/10 space-y-1">
              {contentItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={linkClass}>
                  <item.icon size={16} /> {item.label}
                </NavLink>
              ))}
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
