import { Link } from "react-router-dom";
import { CalendarClock, ShieldCheck, Star } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-paper">
      <div className="max-w-5xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="max-w-2xl">
          <p className="hero-rise text-sage-600 font-medium mb-4">Local services, booked in seconds</p>
          <h1 className="hero-rise hero-rise-delay-1 text-4xl md:text-6xl font-serif font-semibold text-ink-900 leading-[1.08] mb-6">
            Find your next salon, tutor, or consultant — and book them live.
          </h1>
          <p className="hero-rise hero-rise-delay-2 text-ink-500 text-lg leading-relaxed mb-10 max-w-lg">
            ServiceSpot shows real, live availability from providers near you.
            No calling around, no double-booking, no waiting for a reply —
            reserve a slot the moment you see it open.
          </p>
          <div className="hero-rise hero-rise-delay-3 flex gap-4 flex-wrap">
            <Link
              to="/register"
              className="bg-ink-900 text-paper px-7 py-3 rounded-full font-medium hover:bg-ink-800 transition-colors"
            >
              Get started
            </Link>
            <Link
              to="/login"
              className="border border-ink-300 text-ink-700 px-7 py-3 rounded-full font-medium hover:border-ink-900 transition-colors"
            >
              I have an account
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-24 pt-12 border-t border-ink-100">
          <div>
            <CalendarClock className="text-brass-500 mb-3" size={26} strokeWidth={1.5} />
            <h3 className="font-serif font-medium text-lg text-ink-900 mb-1.5">Live availability</h3>
            <p className="text-ink-500 text-sm leading-relaxed">
              Slots update in real time, so what you see is what's actually open right now.
            </p>
          </div>
          <div>
            <Star className="text-brass-500 mb-3" size={26} strokeWidth={1.5} />
            <h3 className="font-serif font-medium text-lg text-ink-900 mb-1.5">Verified reviews</h3>
            <p className="text-ink-500 text-sm leading-relaxed">
              Ratings are tied to each specific service, from people who actually booked it.
            </p>
          </div>
          <div>
            <ShieldCheck className="text-brass-500 mb-3" size={26} strokeWidth={1.5} />
            <h3 className="font-serif font-medium text-lg text-ink-900 mb-1.5">Secure booking</h3>
            <p className="text-ink-500 text-sm leading-relaxed">
              Pay safely when a service needs it, or reserve instantly when it's free.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
