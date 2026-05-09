import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import api from '../../services/api';
import BlogCard from './BlogCard.jsx';

export default function BlogsSection() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get('/blogs', { params: { limit: 3 } })
      .then((res) => { if (!cancelled) setBlogs(res.data?.data?.items || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (!loading && !blogs.length) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="container-app">
        <div className="flex items-end justify-between mb-8 gap-3">
          <div>
            <h2 className="heading">From our <span className="heading-accent">Journal</span></h2>
            <p className="text-ink-muted mt-2">Wellness tips, travel stories, retreat reflections.</p>
          </div>
          <Link to="/blogs" className="text-sm text-brand font-semibold hover:underline inline-flex items-center gap-1 whitespace-nowrap">
            All articles <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-72 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {blogs.map((b, i) => <BlogCard key={b.id} blog={b} index={i} />)}
          </div>
        )}
      </div>
    </section>
  );
}
