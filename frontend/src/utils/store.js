// Centralized localStorage CRUD for multi-tenant restaurant data

const KEYS = {
  RESTAURANTS: 'qrdine_restaurants',
  ORDERS: 'qrdine_orders',
};

// ─── Helpers ───
const getAll = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const saveAll = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// ─── Restaurant CRUD ───
export function createRestaurant(data) {
  const restaurants = getAll(KEYS.RESTAURANTS);
  const restaurant = {
    id: 'rest_' + Date.now(),
    categories: [],
    menuItems: [],
    tables: [],
    paymentInfo: {},
    isLive: false,
    createdAt: new Date().toISOString(),
    ...data, // Spread LAST so wizard data (paymentInfo, isLive, etc.) overrides defaults
  };
  restaurants.push(restaurant);
  saveAll(KEYS.RESTAURANTS, restaurants);
  return restaurant;
}

export function getRestaurant(id) {
  return getAll(KEYS.RESTAURANTS).find(r => r.id === id) || null;
}

export function getRestaurantByOwner(ownerId) {
  return getAll(KEYS.RESTAURANTS).find(r => r.ownerId === ownerId) || null;
}

export function getAllRestaurants() {
  return getAll(KEYS.RESTAURANTS);
}

export function updateRestaurant(id, updates) {
  const restaurants = getAll(KEYS.RESTAURANTS);
  const idx = restaurants.findIndex(r => r.id === id);
  if (idx === -1) return null;
  restaurants[idx] = { ...restaurants[idx], ...updates };
  saveAll(KEYS.RESTAURANTS, restaurants);
  return restaurants[idx];
}

// ─── Categories ───
export function addCategory(restaurantId, categoryName) {
  const restaurants = getAll(KEYS.RESTAURANTS);
  const r = restaurants.find(r => r.id === restaurantId);
  if (!r) return;
  if (!r.categories.includes(categoryName)) {
    r.categories.push(categoryName);
    saveAll(KEYS.RESTAURANTS, restaurants);
  }
  return r.categories;
}

export function removeCategory(restaurantId, categoryName) {
  const restaurants = getAll(KEYS.RESTAURANTS);
  const r = restaurants.find(r => r.id === restaurantId);
  if (!r) return;
  r.categories = r.categories.filter(c => c !== categoryName);
  r.menuItems = r.menuItems.filter(i => i.category !== categoryName);
  saveAll(KEYS.RESTAURANTS, restaurants);
  return r;
}

// ─── Menu Items ───
export function addMenuItem(restaurantId, item) {
  const restaurants = getAll(KEYS.RESTAURANTS);
  const r = restaurants.find(r => r.id === restaurantId);
  if (!r) return;
  const menuItem = {
    id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    ...item,
    available: true,
  };
  r.menuItems.push(menuItem);
  saveAll(KEYS.RESTAURANTS, restaurants);
  return menuItem;
}

export function updateMenuItem(restaurantId, itemId, updates) {
  const restaurants = getAll(KEYS.RESTAURANTS);
  const r = restaurants.find(r => r.id === restaurantId);
  if (!r) return;
  const idx = r.menuItems.findIndex(i => i.id === itemId);
  if (idx === -1) return;
  r.menuItems[idx] = { ...r.menuItems[idx], ...updates };
  saveAll(KEYS.RESTAURANTS, restaurants);
  return r.menuItems[idx];
}

export function removeMenuItem(restaurantId, itemId) {
  const restaurants = getAll(KEYS.RESTAURANTS);
  const r = restaurants.find(r => r.id === restaurantId);
  if (!r) return;
  r.menuItems = r.menuItems.filter(i => i.id !== itemId);
  saveAll(KEYS.RESTAURANTS, restaurants);
}

// ─── Tables & QR ───
export function setupTables(restaurantId, tableCount) {
  const restaurants = getAll(KEYS.RESTAURANTS);
  const r = restaurants.find(r => r.id === restaurantId);
  if (!r) return;
  const tables = [];
  for (let i = 1; i <= tableCount; i++) {
    tables.push({
      id: `T${i}`,
      number: i,
      qrUrl: `/r/${restaurantId}/table/${i}`,
      active: true,
    });
  }
  r.tables = tables;
  saveAll(KEYS.RESTAURANTS, restaurants);
  return tables;
}

export function toggleTable(restaurantId, tableId) {
  const restaurants = getAll(KEYS.RESTAURANTS);
  const r = restaurants.find(r => r.id === restaurantId);
  if (!r) return;
  const table = r.tables.find(t => t.id === tableId);
  if (table) table.active = !table.active;
  saveAll(KEYS.RESTAURANTS, restaurants);
  return r.tables;
}

export function addTables(restaurantId, count) {
  const restaurants = getAll(KEYS.RESTAURANTS);
  const r = restaurants.find(r => r.id === restaurantId);
  if (!r) return;
  const currentMax = r.tables.length > 0 ? Math.max(...r.tables.map(t => t.number)) : 0;
  for (let i = 1; i <= count; i++) {
    const num = currentMax + i;
    r.tables.push({
      id: `T${num}`,
      number: num,
      qrUrl: `/r/${restaurantId}/table/${num}`,
      active: true,
    });
  }
  saveAll(KEYS.RESTAURANTS, restaurants);
  return r.tables;
}

export function removeTable(restaurantId, tableId) {
  const restaurants = getAll(KEYS.RESTAURANTS);
  const r = restaurants.find(r => r.id === restaurantId);
  if (!r) return;
  r.tables = r.tables.filter(t => t.id !== tableId);
  saveAll(KEYS.RESTAURANTS, restaurants);
  return r.tables;
}

// ─── Orders ───
export function createOrder(order) {
  const orders = getAll(KEYS.ORDERS);
  const newOrder = {
    id: 'ord_' + Date.now(),
    ...order,
    status: 'received',
    createdAt: new Date().toISOString(),
  };
  orders.push(newOrder);
  saveAll(KEYS.ORDERS, orders);
  return newOrder;
}

export function getOrdersByRestaurant(restaurantId) {
  return getAll(KEYS.ORDERS)
    .filter(o => o.restaurantId === restaurantId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getAllOrders() {
  return getAll(KEYS.ORDERS).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function updateOrderStatus(orderId, status) {
  const orders = getAll(KEYS.ORDERS);
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) return;
  orders[idx].status = status;
  saveAll(KEYS.ORDERS, orders);
  return orders[idx];
}

// ─── Analytics Helpers ───
export function getRestaurantAnalytics(restaurantId) {
  const orders = getOrdersByRestaurant(restaurantId);
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  
  // Orders by hour
  const hourCounts = {};
  orders.forEach(o => {
    const hour = new Date(o.createdAt).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  // Peak hour
  let peakHour = null;
  let peakCount = 0;
  Object.entries(hourCounts).forEach(([hour, count]) => {
    if (count > peakCount) { peakHour = parseInt(hour); peakCount = count; }
  });

  return { totalOrders, totalRevenue, hourCounts, peakHour, peakCount };
}

export function getPlatformAnalytics() {
  const restaurants = getAllRestaurants();
  const orders = getAllOrders();
  return {
    totalRestaurants: restaurants.length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
    restaurants: restaurants.map(r => ({
      ...r,
      orderCount: orders.filter(o => o.restaurantId === r.id).length,
      revenue: orders.filter(o => o.restaurantId === r.id).reduce((s, o) => s + (o.total || 0), 0),
    })),
  };
}

// ─── Menu Cache (in-memory per session) ───
const menuCache = new Map();

export function getRestaurantCached(id) {
  if (menuCache.has(id)) return menuCache.get(id);
  const r = getRestaurant(id);
  if (r) menuCache.set(id, r);
  return r;
}

export function invalidateCache(id) {
  menuCache.delete(id);
}

// ─── Single Fetch: Restaurant + Menu + Payment Config ───
export function fetchRestaurantBundle(restaurantId) {
  const r = getRestaurantCached(restaurantId);
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    logo: r.logo,
    categories: r.categories,
    menuItems: r.menuItems.filter(i => i.available),
    tables: r.tables,
    paymentInfo: r.paymentInfo,
    isLive: r.isLive,
  };
}

// ─── Payment Routing (CRITICAL: isolated per restaurant_id) ───
export function generatePaymentLink(restaurantId, amount, orderId) {
  // STRICT: fetch payment config ONLY from the QR's restaurant_id
  const r = getRestaurant(restaurantId);
  if (!r || !r.paymentInfo) return null;

  const payment = r.paymentInfo;
  const restaurantName = encodeURIComponent(r.name);
  const txnNote = encodeURIComponent(`Order ${orderId} at ${r.name}`);

  if (payment.method === 'upi' && payment.upiId) {
    // Generate UPI deep link — money routes directly to THIS restaurant's UPI
    return {
      type: 'upi',
      upiId: payment.upiId,
      link: `upi://pay?pa=${encodeURIComponent(payment.upiId)}&pn=${restaurantName}&am=${amount}&tn=${txnNote}&cu=INR`,
      displayName: payment.upiId,
    };
  }

  if (payment.method === 'bank') {
    // Bank transfer display — for manual or gateway integration
    return {
      type: 'bank',
      bankName: payment.bankName,
      accountNumber: payment.accountNumber,
      ifscCode: payment.ifscCode,
      displayName: `${payment.bankName} ••${payment.accountNumber.slice(-4)}`,
    };
  }

  return null;
}
