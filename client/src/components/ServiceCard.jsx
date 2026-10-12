import { Clock, Heart, MapPin, Star, Image as ImageIcon } from "lucide-react";
import { formatINR } from "../utils/format";

const PLACEHOLDER = "https://placehold.co/400x240?text=No+Photo";

const ServiceCard = ({ service, onSelect, active, isFavorited, onToggleFavorite, isOwn }) => {
  const handleHeartClick = (e) => {
    e.stopPropagation(); // don't also trigger onSelect (opening the detail view)
    onToggleFavorite?.(service._id);
  };

  const photoCount = 1 + (service.galleryUrls?.length || 0);

  return (
    <div
      onClick={() => onSelect(service)}
      className={`relative text-left bg-white rounded-md overflow-hidden border cursor-pointer transition-colors ${
        active ? "border-brass-500 ring-1 ring-brass-500" : "border-ink-100 hover:border-ink-300"
      }`}
    >
      {onToggleFavorite && (
        <button
          onClick={handleHeartClick}
          className="absolute top-2 right-2 z-10 bg-white/90 rounded-full w-8 h-8 flex items-center justify-center shadow-sm"
          aria-label="Toggle favorite"
        >
          <Heart size={16} className={isFavorited ? "fill-rose-500 text-rose-500" : "text-ink-300"} />
        </button>
      )}
      {isOwn && (
        <span className="absolute top-2 left-2 z-10 bg-brass-500 text-ink-900 text-[10px] font-medium px-2 py-0.5 rounded-full">
          Your listing
        </span>
      )}
      <div className="relative">
        <img
          src={service.imageUrl || PLACEHOLDER}
          alt={service.title}
          className="w-full h-36 object-cover"
          onError={(e) => (e.target.src = PLACEHOLDER)}
        />
        {service.imageUrl && photoCount > 1 && (
          <span className="absolute bottom-2 left-2 bg-ink-950/70 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
            <ImageIcon size={11} strokeWidth={1.75} /> {photoCount}
          </span>
        )}
      </div>
      <div className="p-3.5">
        <p className="font-medium text-ink-900">{service.title}</p>
        <p className="text-xs text-ink-500 mb-1.5">by {service.provider?.name}</p>
        {service.address && (
          <p className="text-xs text-ink-500 mb-1.5 flex items-center gap-1">
            <MapPin size={12} strokeWidth={1.75} /> {service.address}
          </p>
        )}
        {service.durationMinutes > 0 && (
          <p className="text-xs text-ink-500 mb-1.5 flex items-center gap-1">
            <Clock size={12} strokeWidth={1.75} /> {service.durationMinutes} min
          </p>
        )}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-ink-100">
          <span className="text-sm font-semibold text-ink-900">
            {service.price > 0 ? formatINR(service.price) : "Free"}
          </span>
          {service.avgRating ? (
            <span className="text-xs text-brass-600 font-medium flex items-center gap-1">
              <Star size={12} className="fill-brass-500 text-brass-500" /> {service.avgRating} ({service.reviewCount})
            </span>
          ) : (
            <span className="text-xs text-ink-400">No ratings yet</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
