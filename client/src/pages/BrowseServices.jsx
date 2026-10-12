import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  MapPin,
  Phone,
  Search,
  Star,
  Globe,
  Image as ImageIcon,
  MessageCircle,
  SlidersHorizontal,
  X,
} from "lucide-react";
import api from "../api/axios";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import SlotCard from "../components/SlotCard";
import ServiceCard from "../components/ServiceCard";
import ReviewsList from "../components/ReviewsList";
import PhotoLightbox from "../components/PhotoLightbox";
import { FilterPanel, FilterSheet, PRICE_OPTIONS, RATING_OPTIONS } from "../components/BrowseFilters";
import { EmptyState, ServiceCardSkeleton } from "../components/ui";
import { dayKey, formatDayLabel, formatINR, formatTime } from "../utils/format";

const PLACEHOLDER = "https://placehold.co/700x300?text=No+Photo";

const SORTS = [
  { id: "relevance", label: "Default" },
  { id: "rating", label: "Top rated" },
  { id: "priceAsc", label: "Price: low to high" },
  { id: "priceDesc", label: "Price: high to low" },
  { id: "newest", label: "Newest" },
];

const sortServices = (list, sort) => {
  const arr = [...list];
  switch (sort) {
    case "rating":
      return arr.sort(
        (a, b) => (b.avgRating || 0) - (a.avgRating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0)
      );
    case "priceAsc":
      return arr.sort((a, b) => a.price - b.price);
    case "priceDesc":
      return arr.sort((a, b) => b.price - a.price);
    case "newest":
      return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    default:
      return arr;
  }
};

// Providers may have saved their number in all sorts of formats
// ("9876543210", "+91 98765 43210", "098765-43210"). WhatsApp's click-to-chat
// link needs just digits with the country code and no leading 0 or +.
// Assume India (91) when a 10-digit local number was entered.
const buildWhatsAppLink = (rawPhone, message) => {
  let digits = rawPhone.replace(/\D/g, "");
  if (digits.length === 10) digits = `91${digits}`;
  else if (digits.length === 11 && digits.startsWith("0")) digits = `91${digits.slice(1)}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
};

const BrowseServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Search / sort / filters
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("relevance");
  const [price, setPrice] = useState("any");
  const [minRating, setMinRating] = useState(0);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [listingFilter, setListingFilter] = useState("all"); // "all" | "mine" - providers only
  const [sheetOpen, setSheetOpen] = useState(false);

  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [selectedService, setSelectedService] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [reviewData, setReviewData] = useState({ reviews: [], avgRating: 0, count: 0 });
  const [banner, setBanner] = useState(null); // { text, tone: "success" | "error" }
  const [paying, setPaying] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null); // null = closed
  const socketCtx = useSocket();
  const { user } = useAuth();
  const detailRef = useRef(null);
  const activeServiceRef = useRef(null);

  const flash = (text, tone = "success") => setBanner({ text, tone });

  // All photos for the currently open service - main photo first, then gallery
  const allPhotos = selectedService
    ? [selectedService.imageUrl, ...(selectedService.galleryUrls || [])].filter(Boolean)
    : [];

  const loadServices = () => {
    setLoading(true);
    setLoadError(false);
    api
      .get("/services")
      .then(({ data }) => setServices(data))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadServices();

    // Favorites only apply to "user" role accounts (providers don't book)
    if (user?.role === "user") {
      api
        .get("/favorites/mine")
        .then(({ data }) => setFavoriteIds(new Set(data.map((s) => s._id))))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleFavorite = async (serviceId) => {
    // Optimistic update so the heart flips instantly
    const flip = () =>
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        next.has(serviceId) ? next.delete(serviceId) : next.add(serviceId);
        return next;
      });
    flip();
    try {
      await api.post("/favorites/toggle", { serviceId });
    } catch {
      flip(); // revert on failure
    }
  };

  const activeCount =
    (price !== "any" ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (showFavoritesOnly ? 1 : 0) +
    (listingFilter === "mine" ? 1 : 0);

  const resetFilters = () => {
    setPrice("any");
    setMinRating(0);
    setShowFavoritesOnly(false);
    setListingFilter("all");
  };

  const visibleServices = useMemo(() => {
    let list = services;
    if (user?.role === "provider" && listingFilter === "mine") {
      list = list.filter((s) => s.provider?._id === user._id);
    }
    if (showFavoritesOnly) {
      list = list.filter((s) => favoriteIds.has(s._id));
    }
    const priceTest = PRICE_OPTIONS.find((o) => o.id === price)?.test;
    if (priceTest) list = list.filter((s) => priceTest(s.price));
    if (minRating > 0) list = list.filter((s) => (s.avgRating || 0) >= minRating);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.address?.toLowerCase().includes(q) ||
          s.provider?.name?.toLowerCase().includes(q)
      );
    }
    return sortServices(list, sort);
  }, [services, search, sort, price, minRating, showFavoritesOnly, favoriteIds, listingFilter, user]);

  // Removable chips summarising what's currently narrowing the results
  const chips = [];
  if (search.trim()) chips.push({ key: "q", label: `“${search.trim()}”`, clear: () => setSearch("") });
  if (price !== "any")
    chips.push({ key: "price", label: PRICE_OPTIONS.find((o) => o.id === price)?.label, clear: () => setPrice("any") });
  if (minRating > 0)
    chips.push({ key: "rating", label: RATING_OPTIONS.find((o) => o.v === minRating)?.label, clear: () => setMinRating(0) });
  if (showFavoritesOnly) chips.push({ key: "fav", label: "Favorites", clear: () => setShowFavoritesOnly(false) });
  if (listingFilter === "mine") chips.push({ key: "mine", label: "My listings", clear: () => setListingFilter("all") });

  // Slots for the open service. `quiet` skips the loading skeleton (used for live refreshes).
  const loadSlots = async (service, { quiet = false } = {}) => {
    if (!quiet) setSlotsLoading(true);
    try {
      const { data } = await api.get(`/slots/service/${service._id}`);
      if (activeServiceRef.current === service._id) setSlots(data);
    } finally {
      if (!quiet) setSlotsLoading(false);
    }
  };

  const openService = async (service) => {
    activeServiceRef.current = service._id;
    setSelectedService(service);
    setBanner(null);
    setLightboxIndex(null);
    setSelectedSlotId(null);
    setSlots([]);
    setSlotsLoading(true);
    try {
      // Reviews are loaded for THIS SPECIFIC SERVICE (not the provider's overall
      // rating - a Music Teacher service shouldn't inherit reviews left for that
      // provider's unrelated Hair Spa service)
      const [slotsRes, reviewsRes] = await Promise.all([
        api.get(`/slots/service/${service._id}`),
        api.get(`/reviews/service/${service._id}`),
      ]);
      if (activeServiceRef.current !== service._id) return; // user already opened another one
      setSlots(slotsRes.data);
      setReviewData(reviewsRes.data);
    } catch {
      if (activeServiceRef.current === service._id) flash("Couldn't load this service. Please try again.", "error");
    } finally {
      if (activeServiceRef.current === service._id) setSlotsLoading(false);
    }
  };

  const closeService = () => {
    activeServiceRef.current = null;
    setSelectedService(null);
    setSelectedSlotId(null);
    setBanner(null);
  };

  // Scroll the detail panel into view whenever a new service is picked.
  useEffect(() => {
    if (selectedService && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedService?._id]);

  // Real-time: remove a slot the moment ANY user books it, add new ones as
  // providers create them, and add cancelled ones back to the pool.
  useEffect(() => {
    const socket = socketCtx?.socket;
    if (!socket) return;

    const handleBooked = ({ slotId }) => {
      setSlots((prev) => prev.filter((s) => s._id !== slotId));
      setSelectedSlotId((prev) => (prev === slotId ? null : prev));
    };
    const handleCreated = (slot) => {
      if (selectedService && slot.service === selectedService._id) {
        setSlots((prev) => (prev.some((s) => s._id === slot._id) ? prev : [...prev, slot]));
      }
    };
    const handleReopened = () => {
      if (selectedService) loadSlots(selectedService, { quiet: true }).catch(() => {});
    };

    socket.on("slot:booked", handleBooked);
    socket.on("slot:created", handleCreated);
    socket.on("slot:reopened", handleReopened);

    return () => {
      socket.off("slot:booked", handleBooked);
      socket.off("slot:created", handleCreated);
      socket.off("slot:reopened", handleReopened);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketCtx?.socket, selectedService]);

  // Shared final step for both free and paid bookings - actually creates the
  // Booking document. For paid bookings, razorpayDetails carries the fields
  // the backend needs to verify the payment signature server-side.
  const finalizeBooking = async (slotId, razorpayDetails = {}) => {
    try {
      await api.post("/bookings", { slotId, ...razorpayDetails });
      setSlots((prev) => prev.filter((s) => s._id !== slotId));
      setSelectedSlotId(null);
      flash("Booking confirmed.", "success");
    } catch (err) {
      // e.g. someone else grabbed it a moment before us - the atomic
      // backend check returns 409 in that case
      flash(err.response?.data?.message || "Could not book this slot", "error");
      if (err.response?.status === 409 && selectedService) {
        setSelectedSlotId(null);
        loadSlots(selectedService, { quiet: true }).catch(() => {});
      }
    } finally {
      setPaying(false);
    }
  };

  const handleBook = async (slotId) => {
    setBanner(null);

    // Free service - skip payment entirely
    if (!selectedService?.price || selectedService.price <= 0) {
      return finalizeBooking(slotId);
    }

    // Paid service - create a Razorpay order first, then open the checkout modal
    try {
      setPaying(true);
      const { data } = await api.post("/payments/order", { serviceId: selectedService._id });

      const options = {
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency,
        order_id: data.order.id,
        name: "ServiceSpot",
        description: selectedService.title,
        prefill: { name: user?.name, email: user?.email },
        handler: (response) => {
          // Runs only after Razorpay confirms the payment succeeded.
          // We still verify the signature again on the backend before
          // actually creating the booking - never trust the client alone.
          finalizeBooking(slotId, {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
        },
        modal: {
          ondismiss: () => setPaying(false), // user closed the checkout without paying
        },
        theme: { color: "#14213D" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      flash(err.response?.data?.message || "Could not start payment", "error");
      setPaying(false);
    }
  };

  // Slots grouped by day, earliest first
  const groupedSlots = useMemo(() => {
    const map = new Map();
    [...slots]
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .forEach((s) => {
        const key = dayKey(s.startTime);
        if (!map.has(key)) map.set(key, { key, label: formatDayLabel(s.startTime), slots: [] });
        map.get(key).slots.push(s);
      });
    return [...map.values()];
  }, [slots]);

  const selectedSlot = slots.find((s) => s._id === selectedSlotId) || null;
  const isProvider = user?.role === "provider";
  const isPaid = selectedService?.price > 0;

  const filterPanel = (
    <FilterPanel
      userRole={user?.role}
      price={price}
      setPrice={setPrice}
      minRating={minRating}
      setMinRating={setMinRating}
      showFavoritesOnly={showFavoritesOnly}
      setShowFavoritesOnly={setShowFavoritesOnly}
      listingFilter={listingFilter}
      setListingFilter={setListingFilter}
      activeCount={activeCount}
      onReset={resetFilters}
    />
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-paper pb-12">
      <div className="max-w-6xl mx-auto px-4">
        <header className="pt-8 pb-4">
          <h1 className="font-serif font-semibold text-2xl sm:text-3xl text-ink-900">Find a service</h1>
          <p className="text-sm text-ink-500 mt-1">Salons, tutors, consultants and more. Open slots update live.</p>
        </header>

        {/* Search + sort + (mobile) filters. Sticks under the navbar while scrolling. */}
        <div className="sticky top-16 z-30 bg-paper/95 backdrop-blur -mx-4 px-4 py-2.5 mb-4 border-b border-ink-100/60">
          <div className="flex gap-2">
            <div className="relative flex-1 min-w-0">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
              <input
                type="search"
                aria-label="Search services"
                placeholder="Search by service, place or provider"
                className="border border-ink-100 rounded-full pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brass-400 bg-white w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              aria-label="Sort services"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="hidden sm:block border border-ink-100 rounded-full px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brass-400"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="lg:hidden flex items-center gap-1.5 border border-ink-100 bg-white rounded-full px-4 py-2.5 text-sm text-ink-700 whitespace-nowrap"
            >
              <SlidersHorizontal size={15} strokeWidth={1.75} />
              Filters
              {activeCount > 0 && (
                <span className="bg-ink-900 text-paper text-[11px] rounded-full w-5 h-5 flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </button>
          </div>
          {/* Sort on small screens sits on its own row so the search box keeps its width */}
          <div className="sm:hidden mt-2">
            <select
              aria-label="Sort services"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border border-ink-100 rounded-full px-4 py-2 text-sm bg-white w-full focus:outline-none focus:ring-2 focus:ring-brass-400"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  Sort: {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[230px_1fr] lg:gap-8">
          <aside className="hidden lg:block self-start lg:sticky lg:top-36" aria-label="Filters">
            {filterPanel}
          </aside>

          <section aria-label="Results">
            <div className="flex flex-wrap items-center gap-2 mb-4 min-h-[28px]">
              <p className="text-sm text-ink-500 mr-1" aria-live="polite">
                {loading ? "Loading…" : `${visibleServices.length} ${visibleServices.length === 1 ? "service" : "services"}`}
              </p>
              {chips.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={c.clear}
                  className="flex items-center gap-1 bg-brass-50 border border-brass-300 text-brass-700 text-xs rounded-full pl-2.5 pr-1.5 py-1 hover:bg-brass-100 transition-colors"
                  aria-label={`Remove filter ${c.label}`}
                >
                  {c.label} <X size={12} />
                </button>
              ))}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <ServiceCardSkeleton key={i} />
                ))}
              </div>
            ) : loadError ? (
              <EmptyState
                icon={Search}
                title="Couldn't load services"
                text="Check that the server is running, then try again."
                action={{ label: "Try again", onClick: loadServices }}
              />
            ) : visibleServices.length === 0 ? (
              <EmptyState
                icon={Search}
                title={
                  listingFilter === "mine" && activeCount === 1 && !search.trim()
                    ? "You haven't listed any services yet"
                    : showFavoritesOnly && activeCount === 1 && !search.trim()
                    ? "No favorites yet"
                    : "No services match"
                }
                text={
                  listingFilter === "mine" && activeCount === 1 && !search.trim()
                    ? "Create a service from your dashboard and it will appear here."
                    : showFavoritesOnly && activeCount === 1 && !search.trim()
                    ? "Tap the heart on a service to save it here."
                    : "Try a different search or loosen a filter."
                }
                action={
                  listingFilter === "mine" && activeCount === 1 && !search.trim()
                    ? { label: "Go to dashboard", to: "/dashboard" }
                    : activeCount > 0 || search.trim()
                    ? {
                        label: "Clear search and filters",
                        onClick: () => {
                          setSearch("");
                          resetFilters();
                        },
                      }
                    : undefined
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {visibleServices.map((s) => (
                  <ServiceCard
                    key={s._id}
                    service={s}
                    active={selectedService?._id === s._id}
                    onSelect={openService}
                    isFavorited={favoriteIds.has(s._id)}
                    onToggleFavorite={user?.role === "user" ? handleToggleFavorite : undefined}
                    isOwn={user?.role === "provider" && s.provider?._id === user._id}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {selectedService && (
          <div
            ref={detailRef}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10 pt-8 border-t border-ink-100 scroll-mt-36"
          >
            {/* Service profile */}
            <div className="lg:col-span-2 bg-white rounded-md border border-ink-100 overflow-hidden self-start">
              <div
                className="relative group cursor-pointer"
                onClick={() => allPhotos.length > 0 && setLightboxIndex(0)}
              >
                <img
                  src={selectedService.imageUrl || PLACEHOLDER}
                  alt={selectedService.title}
                  className="w-full h-48 sm:h-56 object-cover transition-opacity group-hover:opacity-90"
                  onError={(e) => (e.target.src = PLACEHOLDER)}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeService();
                  }}
                  className="absolute top-3 left-3 bg-white/90 hover:bg-white rounded-full w-9 h-9 flex items-center justify-center shadow-sm"
                  aria-label="Close service details"
                >
                  <X size={17} />
                </button>
                {allPhotos.length > 1 && (
                  <span className="absolute bottom-3 right-3 bg-ink-950/70 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                    <ImageIcon size={13} strokeWidth={1.75} /> {allPhotos.length} photos
                  </span>
                )}
              </div>
              {selectedService.galleryUrls?.length > 0 && (
                <div className="flex gap-2 p-3 overflow-x-auto no-scrollbar bg-paper-200">
                  {selectedService.galleryUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`${selectedService.title} photo ${i + 2}`}
                      onClick={() => setLightboxIndex(i + 1)}
                      className="w-20 h-20 object-cover rounded-md flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  ))}
                </div>
              )}
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-serif font-semibold text-xl text-ink-900">{selectedService.title}</h2>
                    <p className="text-sm text-ink-500">by {selectedService.provider?.name}</p>
                  </div>
                  <span className="text-lg font-semibold text-ink-900 whitespace-nowrap">
                    {isPaid ? formatINR(selectedService.price) : "Free"}
                  </span>
                </div>
                <div className="flex flex-col gap-1 mt-3 text-sm text-ink-500">
                  {selectedService.address && (
                    <p className="flex items-center gap-1.5">
                      <MapPin size={13} /> {selectedService.address}
                    </p>
                  )}
                  {selectedService.provider?.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone size={13} /> {selectedService.provider.phone}
                    </p>
                  )}
                  {!selectedService.address && selectedService.provider?.location && (
                    <p className="flex items-center gap-1.5">
                      <Globe size={13} /> Based in {selectedService.provider.location}
                    </p>
                  )}
                </div>
                {selectedService.provider?.phone && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <a
                      href={`tel:${selectedService.provider.phone.replace(/\s+/g, "")}`}
                      className="flex items-center gap-1.5 text-sm border border-ink-200 rounded-full px-3.5 py-2 text-ink-700 hover:border-ink-400 hover:bg-ink-50 transition-colors"
                    >
                      <Phone size={14} strokeWidth={1.75} /> Call provider
                    </a>
                    <a
                      href={buildWhatsAppLink(
                        selectedService.provider.phone,
                        `Hi, I'm interested in your "${selectedService.title}" service on ServiceSpot.`
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-sm border border-sage-500 text-sage-600 rounded-full px-3.5 py-2 hover:bg-sage-100 transition-colors"
                    >
                      <MessageCircle size={14} strokeWidth={1.75} /> WhatsApp
                    </a>
                  </div>
                )}
                {selectedService.description && (
                  <p className="text-sm text-ink-600 mt-3 leading-relaxed">{selectedService.description}</p>
                )}
                {reviewData.count > 0 && (
                  <p className="text-sm text-brass-600 font-medium mt-3 flex items-center gap-1">
                    <Star size={13} className="fill-brass-500 text-brass-500" /> {reviewData.avgRating} ·{" "}
                    {reviewData.count} {reviewData.count === 1 ? "review" : "reviews"}
                  </p>
                )}
              </div>
            </div>

            {/* Slots. On mobile this sits right under the profile, above reviews. */}
            <section
              aria-label="Available slots"
              className="lg:col-start-3 lg:row-start-1 lg:row-span-2 lg:self-start lg:sticky lg:top-36 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif font-medium text-lg text-ink-900">Available slots</h3>
                {socketCtx?.socket && (
                  <span className="flex items-center gap-1.5 text-xs text-sage-600">
                    <span className="live-dot" /> Live
                  </span>
                )}
              </div>

              {paying && (
                <p className="text-sm mb-3 text-brass-700 bg-brass-50 border border-brass-300 rounded-md px-3 py-2">
                  Opening payment window…
                </p>
              )}
              {banner && (
                <div
                  role="status"
                  className={`text-sm mb-3 rounded-md px-3 py-2 border ${
                    banner.tone === "success"
                      ? "bg-sage-100 border-sage-500/30 text-sage-600"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  {banner.text}
                  {banner.tone === "success" && user?.role === "user" && (
                    <>
                      {" "}
                      <Link to="/my-bookings" className="underline font-medium">
                        View my bookings
                      </Link>
                    </>
                  )}
                </div>
              )}

              {slotsLoading ? (
                <div className="flex flex-col gap-4" aria-hidden="true">
                  {[1, 2].map((i) => (
                    <div key={i}>
                      <div className="skeleton h-3 w-20 rounded mb-2" />
                      <div className="flex gap-2">
                        <div className="skeleton h-9 w-32 rounded-full" />
                        <div className="skeleton h-9 w-32 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : groupedSlots.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-md border border-ink-100 px-4">
                  <p className="text-ink-900 text-sm font-medium">No open slots right now</p>
                  <p className="text-ink-500 text-sm mt-1">New times appear here the moment the provider adds them.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {groupedSlots.map((g) => (
                    <div key={g.key}>
                      <p className="text-sm font-medium text-ink-700 mb-2">{g.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {g.slots.map((slot) => (
                          <SlotCard
                            key={slot._id}
                            slot={slot}
                            selected={slot._id === selectedSlotId}
                            disabled={isProvider || paying}
                            onSelect={(id) => setSelectedSlotId((prev) => (prev === id ? null : id))}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isProvider && groupedSlots.length > 0 && (
                <p className="text-xs text-ink-500 mt-4">Switch to a customer account to book a slot.</p>
              )}

              {selectedSlot && !isProvider && (
                <div className="mt-5 bg-white border border-brass-300 rounded-lg p-4">
                  <p className="text-xs text-ink-500">Your selection</p>
                  <p className="font-medium text-ink-900 mt-0.5">
                    {formatDayLabel(selectedSlot.startTime)}, {formatTime(selectedSlot.startTime)} –{" "}
                    {formatTime(selectedSlot.endTime)}
                  </p>
                  <p className="text-sm text-ink-500">{selectedService.title}</p>
                  <div className="flex items-center justify-between gap-3 mt-3">
                    <span className="font-serif font-semibold text-lg text-ink-900">
                      {isPaid ? formatINR(selectedService.price) : "Free"}
                    </span>
                    {user ? (
                      <button
                        type="button"
                        onClick={() => handleBook(selectedSlot._id)}
                        disabled={paying}
                        className="bg-sage-500 hover:bg-sage-600 disabled:opacity-50 transition-colors text-white text-sm font-medium px-5 py-2.5 rounded-full"
                      >
                        {paying ? "Please wait…" : isPaid ? "Pay and book" : "Confirm booking"}
                      </button>
                    ) : (
                      <Link
                        to="/login"
                        className="bg-ink-900 hover:bg-ink-800 transition-colors text-paper text-sm font-medium px-5 py-2.5 rounded-full"
                      >
                        Log in to book
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </section>

            <div className="lg:col-span-2">
              <ReviewsList reviews={reviewData.reviews} avgRating={reviewData.avgRating} count={reviewData.count} />
            </div>
          </div>
        )}
      </div>

      <FilterSheet open={sheetOpen} onClose={() => setSheetOpen(false)} resultCount={visibleServices.length}>
        {filterPanel}
      </FilterSheet>

      {lightboxIndex !== null && allPhotos.length > 0 && (
        <PhotoLightbox
          photos={allPhotos}
          index={lightboxIndex}
          setIndex={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
};

export default BrowseServices;
