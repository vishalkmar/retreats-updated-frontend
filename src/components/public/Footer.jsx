import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-ink text-white mt-20">
      <div className="container-app py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="mb-4">
            <img
              src="/retreatlogo.png"
              alt="Retreats by Traveon"
              className="h-12 w-auto object-contain bg-white/95 rounded-lg px-2 py-1"
            />
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            Curated wellness, yoga and travel retreats — designed to transform how you travel
            and how you feel.
          </p>
          <div className="flex gap-3 mt-5">
            {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
              <a key={i} href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-brand flex items-center justify-center transition">
                <Icon size={18} />
              </a>
            ))}
          </div>
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
            <li className="flex items-center gap-2">
              <Mail size={16} /> hello@traveon.com
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} /> +91 00000 00000
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-app py-5 flex flex-col md:flex-row items-center justify-between text-xs text-white/60 gap-2">
          <span>© {new Date().getFullYear()} Retreats by Traveon. All rights reserved.</span>
          <span>Made with care for mindful travellers.</span>
        </div>
      </div>
    </footer>
  );
}
