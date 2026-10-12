import { Link } from "react-router-dom";
import {
  ShieldCheck,
  BadgeCheck,
  Zap,
  Mail,
  Phone,
  MapPin,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
} from "lucide-react";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <>
      {/* About / info section - the kind of descriptive copy that makes a
          site feel established, sitting just above the main footer */}
      <section className="bg-paper-200 border-t border-ink-100">
        <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 sm:grid-cols-3 gap-10">
          <div>
            <h3 className="font-serif font-semibold text-lg text-ink-900 mb-3">Why ServiceSpot?</h3>
            <p className="text-sm text-ink-500 leading-relaxed">
              ServiceSpot connects you with real, local service providers -
              salons, tutors, consultants, and more - and shows their actual
              live availability, not a rough estimate. Every slot you see is
              open right now, so you can book instantly instead of waiting
              on a call back. With verified providers, secure payments, and
              instant confirmations, we aim to make finding and booking a
              service as easy as ordering anything else online.
            </p>
          </div>
          <div>
            <h3 className="font-serif font-semibold text-lg text-ink-900 mb-3">Booking with ServiceSpot</h3>
            <p className="text-sm text-ink-500 leading-relaxed">
              Browse services near you, compare providers by rating and
              price, and reserve an open slot in a few taps. Payments are
              handled securely through Razorpay, and you'll get a real-time
              notification the moment your booking is confirmed. Need to
              plan ahead? Every provider's calendar updates live, so the
              slots you see are always accurate - no double-booking, no
              awkward back-and-forth to confirm a time.
            </p>
          </div>
          <div>
            <h3 className="font-serif font-semibold text-lg text-ink-900 mb-3">For Service Providers</h3>
            <p className="text-sm text-ink-500 leading-relaxed">
              List your services, set your own available slots, and let
              ServiceSpot handle discovery, scheduling, and payment for you.
              Track bookings from a dedicated dashboard, build your
              reputation through genuine customer ratings and reviews, and
              get notified in real time the moment a new booking comes in -
              so you never miss a customer.
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-ink-900 text-ink-100 border-t border-ink-700 mt-auto">
      {/* Trust strip - the kind of detail that makes a service site feel real */}
      <div className="border-b border-ink-700">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap items-center justify-center sm:justify-between gap-4 text-xs text-ink-300">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-brass-400" strokeWidth={1.75} />
            Secure payments via Razorpay
          </div>
          <div className="flex items-center gap-2">
            <BadgeCheck size={16} className="text-brass-400" strokeWidth={1.75} />
            Verified service providers
          </div>
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-brass-400" strokeWidth={1.75} />
            Real-time slot availability
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <Link to="/" className="font-serif font-semibold text-xl text-paper">
            ServiceSpot
          </Link>
          <p className="text-sm text-ink-300 leading-relaxed mt-3 max-w-xs">
            Live availability from real local providers - book a slot the
            moment it opens, no calling around, no waiting for a reply.
          </p>
          <div className="flex items-center gap-4 mt-5">
            <a href="#" aria-label="Facebook" className="text-ink-300 hover:text-brass-400 transition-colors">
              <Facebook size={18} strokeWidth={1.75} />
            </a>
            <a href="#" aria-label="Instagram" className="text-ink-300 hover:text-brass-400 transition-colors">
              <Instagram size={18} strokeWidth={1.75} />
            </a>
            <a href="#" aria-label="Twitter" className="text-ink-300 hover:text-brass-400 transition-colors">
              <Twitter size={18} strokeWidth={1.75} />
            </a>
            <a href="#" aria-label="LinkedIn" className="text-ink-300 hover:text-brass-400 transition-colors">
              <Linkedin size={18} strokeWidth={1.75} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-serif font-medium text-paper mb-4">Explore</h4>
          <ul className="space-y-2.5 text-sm text-ink-300">
            <li>
              <Link to="/" className="hover:text-brass-400 transition-colors">Home</Link>
            </li>
            <li>
              <Link to="/browse" className="hover:text-brass-400 transition-colors">Browse Services</Link>
            </li>
            <li>
              <Link to="/register" className="hover:text-brass-400 transition-colors">Create an account</Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-brass-400 transition-colors">Log in</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif font-medium text-paper mb-4">Company</h4>
          <ul className="space-y-2.5 text-sm text-ink-300">
            <li>
              <a href="#" className="hover:text-brass-400 transition-colors">About us</a>
            </li>
            <li>
              <a href="#" className="hover:text-brass-400 transition-colors">Privacy Policy</a>
            </li>
            <li>
              <a href="#" className="hover:text-brass-400 transition-colors">Terms of Service</a>
            </li>
            <li>
              <a href="#" className="hover:text-brass-400 transition-colors">Cancellation Policy</a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif font-medium text-paper mb-4">Get in touch</h4>
          <ul className="space-y-3 text-sm text-ink-300">
            <li className="flex items-center gap-2.5">
              <Mail size={16} className="text-brass-400 shrink-0" strokeWidth={1.75} />
              support@servicespot.in
            </li>
            <li className="flex items-center gap-2.5">
              <Phone size={16} className="text-brass-400 shrink-0" strokeWidth={1.75} />
              +91 8858787826
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin size={16} className="text-brass-400 shrink-0 mt-0.5" strokeWidth={1.75} />
              Kanpur, Uttar Pradesh, India
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-ink-700">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-300">
          <p>&copy; {year} ServiceSpot. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-brass-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-brass-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-brass-400 transition-colors">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
    </>
  );
};

export default Footer;
