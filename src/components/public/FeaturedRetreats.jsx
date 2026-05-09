import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import api from '../../services/api';
import PackageCard from './PackageCard.jsx';

export default function FeaturedRetreats() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get('/packages', { params: { featured: true, limit: 4 } })
      .then((res) => { if (!cancelled) setPackages(res.data?.data?.items || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (!loading && !packages.length) return null;

  return (
    <section className="py-12 md:py-16 bg-surface-alt">
      <div className="container-app">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="heading">
              Featured <span className="heading-accent">Retreats</span>
            </h2>
            <p className="text-ink-muted mt-2">Hand-picked by our wellness team.</p>
          </div>
          <Link to="/retreats" className="text-sm text-brand font-semibold hover:underline inline-flex items-center gap-1">
            See all <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            {packages.map((p) => <PackageCard key={p.id} pkg={p} />)}
          </div>
        )}
      </div>
    </section>
  );
}
