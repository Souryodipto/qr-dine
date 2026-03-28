import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { publicApi } from '../utils/api';
import { Plus, Minus, X, Mail, Phone, User, ArrowRight, ShoppingBag, UtensilsCrossed, Package, AlertCircle, Clock, Store } from 'lucide-react';

// Lazy image component
function LazyImg({ src, alt, className }) {
  const [loaded, setLoaded] = useState(false);
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      className={`${className} transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
    />
  );
}

// Format "09:00" -> "9:00 AM"
function fmt(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

// Restaurant Closed Popup
function ClosedPopup({ restaurantData, onClose }) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[new Date().getDay()];
  const todayHours = restaurantData?.operatingHours?.[today];
  const openTime = todayHours?.open;
  const closeTime = todayHours?.close;
  const isClosedToday = !todayHours?.isOpen;

  // Find next day that's open
  const getNextOpenDay = () => {
    for (let i = 1; i <= 7; i++) {
      const nextDay = days[(new Date().getDay() + i) % 7];
      const h = restaurantData?.operatingHours?.[nextDay];
      if (h?.isOpen) {
        return { day: nextDay.charAt(0).toUpperCase() + nextDay.slice(1), time: h.open };
      }
    }
    return null;
  };

  const nextOpen = isClosedToday ? getNextOpenDay() : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-slide-up">
        {/* Red header */}
        <div className="bg-red-600 px-6 py-5 text-center">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Store className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-white font-black text-xl tracking-tight">We're Closed</h2>
          <p className="text-red-100 text-[11px] mt-1 font-medium">{restaurantData?.name}</p>
        </div>

        {/* Body */}
        <div className="p-6 text-center">
          <Clock className="w-8 h-8 text-gray-300 mx-auto mb-4" />

          {isClosedToday ? (
            <>
              <p className="text-gray-600 text-sm font-medium">We're closed today.</p>
              {nextOpen && (
                <div className="mt-3 bg-green-50 border border-green-100 rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-green-700 mb-0.5">Next Opening</p>
                  <p className="text-green-800 font-black text-base">{nextOpen.day} at {fmt(nextOpen.time)}</p>
                </div>
              )}
            </>
          ) : openTime ? (
            <>
              <p className="text-gray-600 text-sm font-medium mb-3">
                We're currently closed. Our doors are open during:
              </p>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Today's Hours</p>
                <p className="text-gray-900 font-black text-xl">{fmt(openTime)} – {fmt(closeTime)}</p>
              </div>
              <p className="text-gray-400 text-[11px] mt-3">
                Come back during opening hours to place your order.
              </p>
            </>
          ) : (
            <p className="text-gray-600 text-sm">This restaurant is currently not accepting orders.</p>
          )}
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full bg-black text-white py-3 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-800 transition"
          >
            Browse Menu Anyway
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CustomerMenu() {
  const { slug, tableNumber: routeTable } = useParams();
  const [tableNumber, setTableNumber] = useState(routeTable);

  const [restaurantData, setRestaurantData] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [dietFilter, setDietFilter] = useState('all');

  // Cart state
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('Takeaway');
  const [isCheckout, setIsCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  // Closed popup state
  const [showClosedPopup, setShowClosedPopup] = useState(false);

  // Extract table from hash fallback if path param missing
  useEffect(() => {
    if (routeTable) {
      setTableNumber(routeTable);
      setOrderType('Dine-In');
    } else if (window.location.hash) {
      const hashVal = window.location.hash.replace('#', '');
      if (hashVal && !isNaN(hashVal)) {
        setTableNumber(hashVal);
        setOrderType('Dine-In');
      }
    }
  }, [routeTable]);

  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [formError, setFormError] = useState('');

  // Load menu from real backend
  useEffect(() => {
    if (!slug) {
      setError('Invalid QR code — no restaurant found.');
      setLoading(false);
      return;
    }
    publicApi.getMenu(slug)
      .then(data => {
        setRestaurantData(data.restaurant);
        setMenu(data.menu || []);
        if (data.menu && data.menu.length > 0) {
          setActiveCategory('all');
        }
        // Show closed popup immediately if restaurant is closed
        if (data.restaurant && !data.restaurant.isOpen) {
          setShowClosedPopup(true);
        }
      })
      .catch(err => {
        setError(err.message || 'Restaurant not found or unavailable.');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  // Category items before dietary filter
  const categoryItems = useMemo(() => {
    if (activeCategory === 'all') {
      return menu.flatMap(c => c.items.filter(i => i.isAvailable !== false));
    }
    const cat = menu.find(c => c._id === activeCategory);
    return cat ? cat.items.filter(i => i.isAvailable !== false) : [];
  }, [menu, activeCategory]);

  // Current items after dietary filter
  const currentItems = useMemo(() => {
    if (dietFilter === 'all') return categoryItems;
    return categoryItems.filter(i => i.dietType === dietFilter);
  }, [categoryItems, dietFilter]);

  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);
  const cartSubtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
  const cartTotal = cartSubtotal;

  const addToCart = useCallback((item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item._id);
      if (existing) return prev.map(i => i.id === item._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: item._id, name: item.name, price: item.price, qty: 1 }];
    });
  }, []);

  const updateQty = useCallback((id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = i.qty + delta;
        return newQty > 0 ? { ...i, qty: newQty } : i;
      }
      return i;
    }).filter(i => i.qty > 0));
  }, []);

  // Handle checkout button click — show popup if closed
  const handleCheckoutClick = () => {
    if (!restaurantData?.isOpen) {
      setShowClosedPopup(true);
    } else {
      setIsCheckout(true);
    }
  };

  const placeOrder = async () => {
    setFormError('');
    if (!customerName.trim()) { setFormError('Please enter your name.'); return; }
    if (!customerPhone.trim() || customerPhone.trim().length < 10) { setFormError('Please enter a valid phone number.'); return; }
    if (cart.length === 0) return;

    setIsProcessing(true);
    try {
      const result = await publicApi.placeOrder({
        restaurantId: restaurantData._id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        tableNumber: orderType === 'Dine-In' && tableNumber ? parseInt(tableNumber) : null,
        orderType,
        specialInstructions: specialInstructions.trim(),
        items: cart.map(i => ({
          name: i.name,
          quantity: i.qty,
          unitPrice: i.price,
        })),
      });
      setPlacedOrder(result.order);
      setOrderPlaced(true);
      setCart([]);
      setIsCheckout(false);
    } catch (err) {
      setFormError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Loading ───
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ─── Error ───
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <h1 className="text-white text-2xl font-bold mb-3">Unavailable</h1>
          <p className="text-white/40 text-xs">{error}</p>
        </div>
      </div>
    );
  }

  // ─── Order Confirmed ───
  if (orderPlaced && placedOrder) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-black flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-black mb-2">Order Placed!</h1>
        <p className="text-muted text-sm mb-6">Your order is being prepared.</p>
        <div className="border border-border p-6 w-full max-w-sm">
          <p className="text-[10px] font-bold tracking-widest uppercase text-muted mb-4">Order Summary</p>
          {(placedOrder.items || []).map((item, i) => (
            <div key={i} className="flex justify-between text-sm mb-1">
              <span>{item.quantity}× {item.name}</span>
              <span className="font-bold">₹{(item.unitPrice * item.quantity).toFixed(0)}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-black pt-3 border-t border-border mt-3">
            <span>Total</span><span>₹{(placedOrder.totalAmount || 0).toFixed(0)}</span>
          </div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-muted mt-4">Order ID: #{placedOrder.orderIdString || (placedOrder._id ? placedOrder._id.toString().slice(-6).toUpperCase() : 'N/A')}</p>
          {tableNumber && <p className="text-xs text-muted mt-1">Table {tableNumber} • Pay at counter</p>}
        </div>
        <button onClick={() => { setOrderPlaced(false); setPlacedOrder(null); }} className="btn-primary mt-6">
          Order More
        </button>
      </div>
    );
  }

  // Today's hours for header display
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayKey = days[new Date().getDay()];
  const todayHours = restaurantData?.operatingHours?.[todayKey];
  const isOpen = restaurantData?.isOpen;

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Closed Restaurant Popup */}
      {showClosedPopup && (
        <ClosedPopup
          restaurantData={restaurantData}
          onClose={() => setShowClosedPopup(false)}
        />
      )}

      {/* Restaurant Header */}
      <header className="bg-black text-white flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          {restaurantData?.logo && (
            <LazyImg src={restaurantData.logo} alt={restaurantData.name} className="w-10 h-10 object-cover border border-white/20 rounded flex-shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold truncate">{restaurantData?.name}</h1>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              {tableNumber && (
                <p className="text-white/40 text-[10px] tracking-widest uppercase">Table {tableNumber}</p>
              )}
              {restaurantData?.cuisineTags?.length > 0 && (
                <p className="text-white/30 text-[10px]">{restaurantData.cuisineTags.join(', ')}</p>
              )}
            </div>
          </div>

          {/* Open/Closed badge */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
              isOpen
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : 'bg-red-500 text-white border-red-600'
            }`}>
              {isOpen ? '● Open' : '✕ Closed'}
            </span>
            {todayHours?.isOpen && todayHours?.open && (
              <p className="text-white/30 text-[9px]">{fmt(todayHours.open)} – {fmt(todayHours.close)}</p>
            )}
          </div>
        </div>
      </header>

      {/* Closed Banner */}
      {!isOpen && (
        <div
          className="bg-red-50 border-b border-red-100 px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer"
          onClick={() => setShowClosedPopup(true)}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-[11px] font-bold">
              {todayHours?.isOpen && todayHours?.open
                ? `We're closed right now. Opens at ${fmt(todayHours.open)}`
                : "We're closed today. Tap to see next opening."}
            </p>
          </div>
          <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest underline whitespace-nowrap">See Hours</span>
        </div>
      )}

      {/* Category Tabs */}
      {menu.length > 0 && (
        <div className="border-b border-border sticky top-0 bg-white z-40 flex-shrink-0">
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex gap-0.5 overflow-x-auto hide-scrollbar py-2">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase whitespace-nowrap transition-colors ${activeCategory === 'all' ? 'bg-black text-white' : 'text-muted hover:text-black'}`}
              >
                All
              </button>
              {menu.map(cat => (
                <button
                  key={cat._id}
                  onClick={() => setActiveCategory(cat._id)}
                  className={`px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase whitespace-nowrap transition-colors ${activeCategory === cat._id ? 'bg-black text-white' : 'text-muted hover:text-black'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Diet Filters */}
      {menu.length > 0 && categoryItems.length > 0 && (
        <div className="bg-gray-50 border-b border-border z-30 flex-shrink-0">
          <div className="max-w-2xl mx-auto px-4 py-2 flex items-center gap-3 overflow-x-auto hide-scrollbar">
            {['all', 'veg', 'non-veg', 'vegan'].map((type) => (
              <button
                key={type}
                onClick={() => setDietFilter(type)}
                className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest border transition-colors rounded ${dietFilter === type ? 'bg-black text-white border-black' : 'bg-white text-muted border-border hover:bg-gray-100'}`}
              >
                {type === 'veg' && <span className="w-2 h-2 rounded-full bg-green-500" />}
                {type === 'non-veg' && <span className="w-2 h-2 rounded-full bg-red-500" />}
                {type === 'vegan' && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-3">
          {currentItems.length === 0 ? (
            <p className="text-center text-muted text-xs py-12">No items in this category.</p>
          ) : (
            <div className="space-y-2">
              {currentItems.map(item => {
                const inCart = cart.find(i => i.id === item._id);
                return (
                  <div key={item._id} className="flex items-center gap-3 p-3 border border-border">
                    {item.imageUrl && (
                      <LazyImg src={item.imageUrl} alt={item.name} className="w-14 h-14 object-cover flex-shrink-0 rounded" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm truncate">{item.name}</h3>
                        {item.isBestSeller && <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 font-bold uppercase rounded">🔥 Best Seller</span>}
                        {item.isChefSpecial && <span className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 font-bold uppercase rounded">👨‍🍳 Chef Special</span>}
                        {item.dietType === 'veg' && <span className="text-[8px] text-green-600 border border-green-600 px-1 py-0.5 font-bold">V</span>}
                        {item.dietType === 'non-veg' && <span className="text-[8px] text-red-600 border border-red-600 px-1 py-0.5 font-bold">N</span>}
                      </div>
                      {item.description && <p className="text-xs text-muted mt-0.5 line-clamp-2">{item.description}</p>}
                      <p className="text-sm font-bold mt-0.5">{restaurantData?.currency || '₹'}{item.price}</p>
                    </div>
                    {inCart ? (
                      <div className="flex items-center gap-2 bg-black text-white px-2 py-1 flex-shrink-0">
                        <button onClick={() => updateQty(item._id, -1)} className="p-0.5 active:scale-90"><Minus className="w-3.5 h-3.5" /></button>
                        <span className="font-bold text-xs w-4 text-center">{inCart.qty}</span>
                        <button onClick={() => updateQty(item._id, 1)} className="p-0.5 active:scale-90"><Plus className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(item)} className="bg-black text-white text-[9px] font-bold tracking-wider uppercase px-3 py-2 flex-shrink-0 active:scale-95 transition-transform">
                        ADD
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cart Bar */}
      {cartCount > 0 && !isCheckout && (
        <div className="sticky bottom-0 bg-black text-white px-4 py-3 flex items-center justify-between z-40">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            <span className="text-xs font-bold">{cartCount} item{cartCount > 1 ? 's' : ''}</span>
            <span className="text-white/40 text-xs">•</span>
            <span className="font-bold">₹{cartSubtotal.toFixed(0)}</span>
          </div>
          <button
            onClick={handleCheckoutClick}
            className="bg-white text-black text-[10px] font-bold tracking-widest uppercase px-5 py-2 active:scale-95 transition-transform flex items-center gap-1.5"
          >
            Checkout <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Checkout Panel */}
      {isCheckout && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-black text-white flex-shrink-0">
            <h2 className="text-sm font-bold tracking-widest uppercase">Checkout</h2>
            <button onClick={() => setIsCheckout(false)} className="p-1.5 text-white/60 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
            {/* Order Type */}
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-2">Order Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setOrderType('Dine-In')} className={`flex items-center justify-center gap-2 py-3 text-xs font-bold tracking-wider uppercase border transition-colors ${orderType === 'Dine-In' ? 'bg-black text-white border-black' : 'bg-white border-border text-muted'}`}>
                  <UtensilsCrossed className="w-3.5 h-3.5" /> Dine-In
                </button>
                <button onClick={() => setOrderType('Takeaway')} className={`flex items-center justify-center gap-2 py-3 text-xs font-bold tracking-wider uppercase border transition-colors ${orderType === 'Takeaway' ? 'bg-black text-white border-black' : 'bg-white border-border text-muted'}`}>
                  <Package className="w-3.5 h-3.5" /> Packed
                </button>
              </div>
              {orderType === 'Dine-In' && tableNumber && (
                <p className="text-[10px] text-muted mt-1.5">Table {tableNumber} • auto-selected from QR</p>
              )}
            </div>

            {/* Items */}
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-2">Items</label>
              <div className="space-y-1.5">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between py-2 px-3 border border-border">
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-xs truncate block">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex items-center gap-1.5 border border-border px-1.5 py-0.5">
                        <button onClick={() => updateQty(item.id, -1)} className="p-0.5"><Minus className="w-3 h-3" /></button>
                        <span className="text-[10px] font-bold w-3 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="p-0.5"><Plus className="w-3 h-3" /></button>
                      </div>
                      <span className="font-bold text-xs w-14 text-right">₹{(item.price * item.qty).toFixed(0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Info */}
            <div className="space-y-4">
              <label className="block text-[10px] font-bold tracking-widest uppercase text-muted">Your Details</label>
              <div className="relative">
                <User className="w-4 h-4 text-muted-light absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="input-premium pl-10 !py-3 !text-sm" placeholder="Your name *" />
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 text-muted-light absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="input-premium pl-10 !py-3 !text-sm" placeholder="Phone number * (for order updates)" />
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-light absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="input-premium pl-10 !py-3 !text-sm" placeholder="Email for confirmation (optional)" autoComplete="email" />
              </div>
              <textarea
                value={specialInstructions}
                onChange={e => setSpecialInstructions(e.target.value)}
                className="input-premium !py-3 !text-sm resize-none"
                placeholder="Special instructions (optional)"
                rows={2}
              />
            </div>

            {formError && <p className="text-xs text-danger font-bold">{formError}</p>}
          </div>

          {/* Checkout Footer */}
          <div className="flex-shrink-0 px-4 py-4 border-t border-border bg-white">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold tracking-widest uppercase text-muted">Total</span>
              <span className="text-2xl font-black">₹{cartTotal.toFixed(0)}</span>
            </div>
            <p className="text-[10px] text-muted mb-3">💵 Pay at the counter when your food arrives.</p>
            <button
              onClick={placeOrder}
              disabled={isProcessing || cart.length === 0}
              className="btn-primary w-full !py-4 disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
              ) : (
                <>Place Order • ₹{cartTotal.toFixed(0)}</>
              )}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.25s ease-out; }
      `}</style>
    </div>
  );
}
