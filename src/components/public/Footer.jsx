import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Facebook, Instagram, Twitter, Youtube, Linkedin, Globe,
  Mail, Phone, MapPin,
} from 'lucide-react';
import api, { fileUrl } from '../../services/api';

const SOCIAL_ICONS = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
  website: Globe,
};

const FALLBACK = {
  companyName: 'Retreats by Traveon',
  tagline: '',
  description:
    'Curated wellness, yoga and travel retreats — designed to transform how you travel and how you feel.',
  logoUrl: '/retreatlogo.png',
  emails: [],
  phones: [],
  addresses: [],
  socials: [],
};

export default function Footer() {
  const [info, setInfo] = useState(FALLBACK);

  useEffect(() => {
    let cancelled = false;
    api.get('/site-info')
      .then((res) => {
        if (cancelled) return;
        const remote = res.data?.data?.siteInfo || {};
        // Merge remote on top of fallback so missing keys keep sane defaults
        setInfo({
          ...FALLBACK,
          ...remote,
          // For arrays, prefer remote only if non-empty
          emails: remote.emails?.length ? remote.emails : FALLBACK.emails,
          phones: remote.phones?.length ? remote.phones : FALLBACK.phones,
          addresses: remote.addresses?.length ? remote.addresses : FALLBACK.addresses,
          socials: remote.socials?.length ? remote.socials : FALLBACK.socials,
          logoUrl: remote.logoUrl || FALLBACK.logoUrl,
          description: remote.description || FALLBACK.description,
          companyName: remote.companyName || FALLBACK.companyName,
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const logoSrc = info.logoUrl
    ? (info.logoUrl.startsWith('/uploads/') || /^https?:\/\//.test(info.logoUrl) ? fileUrl(info.logoUrl) : info.logoUrl)
    : '/retreatlogo.png';

  return (
    <footer className="bg-ink text-white mt-20">
      <div className="container-app py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div>
          <div className="mb-4">
            <img
              src={logoSrc}
              alt={info.companyName}
              className="h-12 w-auto object-contain bg-white/95 rounded-lg px-2 py-1"
            />
          </div>
          {info.tagline && (
            <p className="text-sm font-semibold text-white/90">{info.tagline}</p>
          )}
          {info.description && (
            <p className="text-sm text-white/70 leading-relaxed mt-2">
              {info.description}
            </p>
          )}
          {info.socials.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-5">
              {info.socials.map((s, i) => {
                const Icon = SOCIAL_ICONS[s.platform] || Globe;
                return (
                  <a
                    key={`${s.platform}-${i}`}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.platform}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-brand flex items-center justify-center transition"
                  >
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h4 className="font-display font-semibold mb-4 text-white">Explore</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/retreats" className="hover:text-brand-light">All Retreats</Link></li>
            <li><Link to="/retreats?category=yoga" className="hover:text-brand-light">Yoga</Link></li>
            <li><Link to="/retreats?category=ayurveda" className="hover:text-wellness-light">Ayurveda</Link></li>
            <li><Link to="/retreats?category=detox" className="hover:text-wellness-light">Detox</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-semibold mb-4">Company</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/about" className="hover:text-brand-light">About</Link></li>
            <li><Link to="/blogs" className="hover:text-brand-light">Blogs</Link></li>
            <li><Link to="/contact" className="hover:text-brand-light">Contact</Link></li>
            <li><Link to="/privacy" className="hover:text-brand-light">Privacy</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-semibold mb-4">Get in touch</h4>
          <ul className="space-y-3 text-sm text-white/70">
            {info.emails.map((e, i) => (
              <li key={`e-${i}`} className="flex items-start gap-2 break-all">
                <Mail size={16} className="mt-0.5 shrink-0" />
                <a href={`mailto:${e}`} className="hover:text-brand-light">{e}</a>
              </li>
            ))}
            {info.phones.map((p, i) => (
              <li key={`p-${i}`} className="flex items-start gap-2">
                <Phone size={16} className="mt-0.5 shrink-0" />
                <a href={`tel:${p.replace(/\s+/g, '')}`} className="hover:text-brand-light">{p}</a>
              </li>
            ))}
            {info.addresses.map((a, i) => (
              <li key={`a-${i}`} className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 shrink-0" />
                <span>{a}</span>
              </li>
            ))}
            {info.emails.length === 0 && info.phones.length === 0 && info.addresses.length === 0 && (
              <li className="text-white/50 text-xs italic">
                Add contact details from Admin → Site Details.
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-app py-5 flex flex-col md:flex-row items-center justify-between text-xs text-white/60 gap-2">
          <span>© {new Date().getFullYear()} {info.companyName}. All rights reserved.</span>
          <span>Made with care for mindful travellers.</span>
        </div>
      </div>
    </footer>
  );
}
