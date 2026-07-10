import React from 'react';
import { Language, Listing } from '../types';
import { translations } from '../translations';
import { MapPin, Phone, MessageSquare, Plus, Search, Check, Sparkles, Tag, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ListingsViewProps {
  currentLanguage: Language;
  listings: Listing[];
  onAddListing: (listing: Omit<Listing, 'id' | 'createdAt' | 'isSold'>) => void;
  onMarkAsSold: (id: string) => void;
  user: any;
}

export default function ListingsView({
  currentLanguage,
  listings,
  onAddListing,
  onMarkAsSold,
  user,
}: ListingsViewProps) {
  const t = translations[currentLanguage];
  const isRtl = currentLanguage === 'ar' || currentLanguage === 'darija';

  const [search, setSearch] = React.useState('');
  const [selectedLocation, setSelectedLocation] = React.useState('All');
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  
  // Contact mock states
  const [activeContactListing, setActiveContactListing] = React.useState<Listing | null>(null);

  // Listing creation form fields
  const [title, setTitle] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [location, setLocation] = React.useState('Settat');
  const [breed, setBreed] = React.useState('');
  const [weight, setWeight] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [sellerName, setSellerName] = React.useState(user?.fullName || 'Mohamed El Haouzi');
  const [sellerPhone, setSellerPhone] = React.useState(user?.phone || '0612345678');
  const [animalImage, setAnimalImage] = React.useState('Sheep'); // 'Sheep' | 'Goat' | 'Cattle'

  const filteredListings = React.useMemo(() => {
    return listings.filter(l => {
      const matchSearch =
        l.title.toLowerCase().includes(search.toLowerCase()) ||
        l.description.toLowerCase().includes(search.toLowerCase()) ||
        (l.breed && l.breed.toLowerCase().includes(search.toLowerCase()));

      const matchLoc = selectedLocation === 'All' || l.location === selectedLocation;

      return matchSearch && matchLoc;
    });
  }, [listings, search, selectedLocation]);

  const locations = React.useMemo(() => {
    return ['All', ...Array.from(new Set(listings.map(l => l.location)))];
  }, [listings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !sellerPhone) return;

    let imgUrl = 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&q=80&w=600';
    if (animalImage === 'Goat') {
      imgUrl = 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&q=80&w=600';
    } else if (animalImage === 'Cattle') {
      imgUrl = 'https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&q=80&w=600';
    }

    onAddListing({
      title,
      price: parseFloat(price),
      location,
      breed: breed || undefined,
      weight: weight ? parseFloat(weight) : undefined,
      description,
      sellerName,
      sellerPhone,
      image: imgUrl,
    });

    // Reset fields
    setTitle('');
    setPrice('');
    setBreed('');
    setWeight('');
    setDescription('');
    setCreateModalOpen(false);
  };

  const getWhatsAppLink = (listing: Listing) => {
    const defaultText = isRtl
      ? `السلام عليكم، أنا مهتم بـ "${listing.title}" المعروض للبيع على فلاح لينك بسعر ${listing.price} درهم. هل هو متاح؟`
      : `Bonjour, je suis intéressé par "${listing.title}" sur FellahLink au prix de ${listing.price} MAD. Est-il disponible ?`;
    return `https://wa.me/${listing.sellerPhone.replace(/\s+/g, '')}?text=${encodeURIComponent(defaultText)}`;
  };

  return (
    <div className="space-y-8 py-4 relative">
      {/* Header Area */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
        isRtl ? 'sm:flex-row-reverse' : ''
      }`}>
        <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-primary">{t.marketplaceTitle}</h2>
          <p className="text-sm text-on-surface-variant/80 mt-1">{t.marketplaceSubtitle}</p>
        </div>

        <button
          id="create-listing-btn"
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-5 py-3 bg-primary text-on-primary hover:bg-primary-container text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer"
        >
          <Plus size={18} />
          <span>{t.createListing}</span>
        </button>
      </div>

      {/* Filters Area */}
      <div className={`bg-white border border-secondary-container/60 rounded-2xl p-4 shadow-sm space-y-4 md:space-y-0 md:flex items-center gap-4 ${
        isRtl ? 'md:flex-row-reverse' : 'md:flex-row'
      }`}>
        {/* Search listings */}
        <div className="relative flex-1">
          <Search size={18} className={`absolute top-3.5 text-secondary/60 ${isRtl ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className={`w-full py-2.5 bg-surface-container-low border border-secondary-container/50 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-all ${
              isRtl ? 'pr-10 text-right' : 'pl-10 text-left'
            }`}
          />
        </div>

        {/* Location Filter */}
        <div className="flex items-center gap-2 md:w-56">
          <MapPin size={16} className="text-secondary shrink-0" />
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full py-2 bg-surface-container-low border border-secondary-container/50 rounded-xl text-xs font-bold focus:outline-none focus:border-primary"
          >
            <option value="All">{t.location}: {t.all}</option>
            {locations.filter(l => l !== 'All').map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Listings */}
      {filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredListings.map((listing) => (
            <motion.div
              layout
              key={listing.id}
              className="bg-white border border-secondary-container rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/20 transition-all flex flex-col justify-between"
            >
              {/* Image with sold badge */}
              <div className="relative h-56 bg-surface-container-low overflow-hidden">
                <img
                  src={listing.image || 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&q=80&w=600'}
                  alt={listing.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                
                {listing.isSold && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="px-4 py-2 bg-error text-white font-bold rounded-xl text-sm uppercase tracking-wide">
                      {t.sold}
                    </span>
                  </div>
                )}

                <div className={`absolute bottom-3 ${isRtl ? 'left-3' : 'right-3'}`}>
                  <span className="px-3 py-1.5 bg-primary text-on-primary font-extrabold text-sm rounded-xl shadow-md">
                    {listing.price} MAD
                  </span>
                </div>
              </div>

              {/* Info Body */}
              <div className="p-6 space-y-4 flex-grow">
                <div className="space-y-1.5" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                  <div className={`flex items-center gap-1 text-[10px] text-on-surface-variant/70 font-mono font-bold uppercase ${
                    isRtl ? 'flex-row-reverse' : ''
                  }`}>
                    <span className="text-primary font-semibold">{listing.breed || 'Moroccan'}</span>
                    <span>•</span>
                    <span>{listing.weight ? `${listing.weight} kg` : 'N/A'}</span>
                  </div>
                  
                  <h3 className="text-lg font-extrabold text-primary line-clamp-1">
                    {listing.title}
                  </h3>
                  
                  <p className="text-xs text-on-surface-variant/90 line-clamp-2 leading-relaxed">
                    {listing.description}
                  </p>
                </div>

                <div className={`flex items-center gap-1.5 text-xs text-secondary/90 font-semibold ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <MapPin size={14} className="text-primary shrink-0" />
                  <span>{listing.location}</span>
                </div>
              </div>

              {/* Action bar footer */}
              <div className="p-4 bg-surface-container-low border-t border-secondary-container/40 flex gap-2">
                {/* Contact Seller Trigger */}
                {!listing.isSold ? (
                  <button
                    onClick={() => setActiveContactListing(listing)}
                    className="flex-1 py-2.5 bg-primary text-on-primary hover:bg-primary-container font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <MessageSquare size={14} />
                    <span>{isRtl ? 'اتصل بالبائع' : 'Contacter'}</span>
                  </button>
                ) : (
                  <div className="flex-1 text-center py-2 text-xs font-semibold text-on-surface-variant/60">
                    {t.sold}
                  </div>
                )}

                {/* Mark as Sold for Seller profile */}
                {!listing.isSold && user && (listing.sellerPhone === user.phone || listing.sellerName === user.fullName) && (
                  <button
                    onClick={() => onMarkAsSold(listing.id)}
                    className="px-3.5 py-2.5 bg-secondary-container text-primary hover:bg-primary/5 border border-secondary-fixed font-bold text-xs rounded-xl flex items-center justify-center transition-all cursor-pointer"
                    title={t.markAsSold}
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center border-2 border-dashed border-secondary-container rounded-2xl max-w-xl mx-auto">
          <p className="text-sm text-on-surface-variant font-bold px-6">{t.noListings}</p>
        </div>
      )}

      {/* Listing creation modal */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setCreateModalOpen(false)}
              className="absolute inset-0 bg-black"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden z-10 border border-secondary-container"
            >
              {/* Close */}
              <button
                onClick={() => setCreateModalOpen(false)}
                className={`absolute top-4 p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-all ${
                  isRtl ? 'left-4' : 'right-4'
                }`}
              >
                <X size={18} />
              </button>

              <div className="p-5 bg-primary text-on-primary text-center">
                <h3 className="text-lg font-bold">{t.createListing}</h3>
                <p className="text-xs text-primary-fixed/80">{t.marketplaceSubtitle}</p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* Title */}
                <div>
                  <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t.listingTitle} <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. كبش صردي ممتاز لعيد الأضحى"
                    required
                    className={`w-full py-2 bg-surface-container-low border border-secondary-container/50 rounded-lg text-xs focus:outline-none focus:border-primary ${
                      isRtl ? 'text-right pr-3' : 'text-left pl-3'
                    }`}
                  />
                </div>

                {/* Price & Weight */}
                <div className={`grid grid-cols-2 gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div>
                    <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t.priceLabel} (MAD) <span className="text-error">*</span>
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="e.g. 4500"
                      required
                      className={`w-full py-2 bg-surface-container-low border border-secondary-container/50 rounded-lg text-xs focus:outline-none focus:border-primary ${
                        isRtl ? 'text-right pr-3' : 'text-left pl-3'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t.weightKg}
                    </label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="e.g. 68"
                      className={`w-full py-2 bg-surface-container-low border border-secondary-container/50 rounded-lg text-xs focus:outline-none focus:border-primary ${
                        isRtl ? 'text-right pr-3' : 'text-left pl-3'
                      }`}
                    />
                  </div>
                </div>

                {/* Breed & Location */}
                <div className={`grid grid-cols-2 gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div>
                    <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t.breedLabel}
                    </label>
                    <input
                      type="text"
                      value={breed}
                      onChange={(e) => setBreed(e.target.value)}
                      placeholder="e.g. Sardi"
                      className={`w-full py-2 bg-surface-container-low border border-secondary-container/50 rounded-lg text-xs focus:outline-none focus:border-primary ${
                        isRtl ? 'text-right pr-3' : 'text-left pl-3'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t.location}
                    </label>
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className={`w-full py-2 bg-surface-container-low border border-secondary-container/50 rounded-lg text-xs focus:outline-none focus:border-primary ${
                        isRtl ? 'text-right pr-3' : 'text-left pl-3'
                      }`}
                    >
                      {['Settat', 'El Kelaa des Sraghna', 'Oujda', 'Marrakech', 'Chefchaouen'].map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Type Selection for visual */}
                <div>
                  <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t.filterType}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Sheep', 'Goat', 'Cattle'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAnimalImage(type)}
                        className={`py-1.5 text-xs font-bold border rounded-lg transition-all ${
                          animalImage === type
                            ? 'bg-primary text-on-primary border-primary'
                            : 'bg-surface-container-low border-secondary-container text-secondary hover:bg-surface-container'
                        }`}
                      >
                        {t[type.toLowerCase()]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t.description}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="e.g. خروف سمين، تغذية طبيعية 100%..."
                    className={`w-full py-2 bg-surface-container-low border border-secondary-container/50 rounded-lg text-xs focus:outline-none focus:border-primary ${
                      isRtl ? 'text-right pr-3' : 'text-left pl-3'
                    }`}
                  />
                </div>

                {/* Seller specs */}
                <div className={`grid grid-cols-2 gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div>
                    <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t.seller}
                    </label>
                    <input
                      type="text"
                      value={sellerName}
                      onChange={(e) => setSellerName(e.target.value)}
                      className={`w-full py-2 bg-surface-container-low border border-secondary-container/50 rounded-lg text-xs focus:outline-none focus:border-primary ${
                        isRtl ? 'text-right pr-3' : 'text-left pl-3'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t.phone} <span className="text-error">*</span>
                    </label>
                    <input
                      type="tel"
                      value={sellerPhone}
                      onChange={(e) => setSellerPhone(e.target.value)}
                      required
                      className={`w-full py-2 bg-surface-container-low border border-secondary-container/50 rounded-lg text-xs focus:outline-none focus:border-primary ${
                        isRtl ? 'text-right pr-3' : 'text-left pl-3'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-primary text-on-primary font-bold text-sm rounded-xl shadow-md hover:bg-primary-container transition-all cursor-pointer"
                >
                  {t.listForSale}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Contact simulation sheet */}
      <AnimatePresence>
        {activeContactListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveContactListing(null)}
              className="absolute inset-0 bg-black"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden z-10 border border-secondary-container p-6 space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-lg font-bold text-primary">{isRtl ? 'اتصل بالمربي' : 'Contacter l\'éleveur'}</h3>
                <p className="text-xs text-on-surface-variant/80">
                  {activeContactListing.sellerName} • {activeContactListing.location}
                </p>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <a
                  href={getWhatsAppLink(activeContactListing)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 bg-[#25D366] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow"
                >
                  <MessageSquare size={16} />
                  <span>{t.whatsappChat}</span>
                </a>

                <a
                  href={`tel:${activeContactListing.sellerPhone}`}
                  className="w-full py-3 bg-primary text-on-primary hover:bg-primary-container font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow"
                >
                  <Phone size={16} />
                  <span>{t.callSeller} ({activeContactListing.sellerPhone})</span>
                </a>
              </div>

              <button
                onClick={() => setActiveContactListing(null)}
                className="w-full py-2 border border-secondary-container text-secondary font-semibold text-xs rounded-lg hover:bg-surface-container transition-all"
              >
                {t.cancel}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
