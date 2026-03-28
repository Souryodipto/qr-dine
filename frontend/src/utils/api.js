// ─── Centralized API Client ───
// All communication with the backend goes through this module.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Core fetch wrapper with credentials (cookies) support.
 */
async function request(method, path, data = null, isFormData = false) {
  const options = {
    method,
    credentials: 'include', // Send cookies (JWT)
    headers: {},
  };

  if (data) {
    if (isFormData) {
      options.body = data; // FormData, let browser set content-type
    } else {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(data);
    }
  }

  const response = await fetch(`${BASE_URL}${path}`, options);
  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(json.message || `Request failed with status ${response.status}`);
  }

  return json;
}

// ─── Convenience Methods ───
const get = (path) => request('GET', path);
const post = (path, data, isFormData = false) => request('POST', path, data, isFormData);
const put = (path, data, isFormData = false) => request('PUT', path, data, isFormData);
const patch = (path, data) => request('PATCH', path, data);
const del = (path) => request('DELETE', path);

// ─── Auth API ───
export const authApi = {
  login: (email, password) => post('/auth/restaurant/login', { email, password }),
  adminLogin: (email, password) => post('/auth/admin/login', { email, password }),
  register: (ownerName, email, password, name) => post('/auth/register', { ownerName, email, password, name }),
  logout: () => post('/auth/logout'),
  me: () => get('/auth/me'),
};

// ─── Public Menu API (no auth required) ───
export const publicApi = {
  getMenu: (slug) => get(`/public/menu/${slug}`),
  validateTable: (slug, tableNumber) => get(`/public/table/${slug}/${tableNumber}`),
  placeOrder: (orderData) => post('/public/place-order', orderData),
  getSessionOrders: (sessionId) => get(`/public/orders/session/${sessionId}`),
};

// ─── Restaurant Profile API ───
export const restaurantApi = {
  getProfile: () => get('/restaurant/profile'),
  updateProfile: (data) => put('/restaurant/profile', data),
  uploadLogo: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return post('/restaurant/upload/logo', fd, true);
  },
  uploadCover: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return post('/restaurant/upload/cover', fd, true);
  },
  changePassword: (currentPassword, newPassword) =>
    put('/restaurant/change-password', { currentPassword, newPassword }),
  getAnalytics: () => get('/restaurant/analytics'),
  getPayouts: () => get('/restaurant/payouts'),
  updateOperatingHours: (operatingHours) => put('/restaurant/operating-hours', { operatingHours }),
};


// ─── Menu API ───
export const menuApi = {
  // Categories
  getCategories: () => get('/menu/categories'),
  createCategory: (name) => post('/menu/categories', { name }),
  updateCategory: (id, data) => put(`/menu/categories/${id}`, data),
  deleteCategory: (id) => del(`/menu/categories/${id}`),
  toggleCategory: (id) => patch(`/menu/categories/${id}/toggle`),
  reorderCategories: (orderedIds) => put('/menu/categories-reorder', { orderedIds }),

  // Items
  getItems: (categoryId) => get(`/menu/items${categoryId ? `?categoryId=${categoryId}` : ''}`),
  createItem: (data) => {
    // Supports both JSON and FormData (when image file is provided)
    if (data instanceof FormData) return post('/menu/items', data, true);
    return post('/menu/items', data);
  },
  updateItem: (id, data) => {
    if (data instanceof FormData) return put(`/menu/items/${id}`, data, true);
    return put(`/menu/items/${id}`, data);
  },
  deleteItem: (id) => del(`/menu/items/${id}`),
  toggleItem: (id) => patch(`/menu/items/${id}/toggle`),
  reorderItems: (orderedIds) => put('/menu/items-reorder', { orderedIds }),
};

// ─── Tables API ───
export const tablesApi = {
  getTables: () => get('/tables'),
  createTable: (tableName, tableNumber) => post('/tables', { tableName, tableNumber }),
  bulkCreateTables: (count, startFrom, prefix) => post('/tables/bulk', { count, startFrom, prefix }),
  updateTable: (id, tableName) => put(`/tables/${id}`, { tableName }),
  toggleTable: (id) => patch(`/tables/${id}/toggle`),
  deleteTable: (id) => del(`/tables/${id}`),
  deleteAllTables: () => del('/tables/all'),
  regenerateQR: (id) => patch(`/tables/${id}/regenerate-qr`),
};

// ─── Orders API (restaurant owner) ───
export const ordersApi = {
  getOrders: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/orders${qs ? `?${qs}` : ''}`);
  },
  getLiveOrders: () => get('/orders/live'),
  getStats: () => get('/orders/stats'),
  getDailyEarnings: () => get('/orders/daily-earnings'),
  getDailyEarningsSummary: () => get('/orders/daily-earnings-summary'),
  updateStatus: (id, status) => patch(`/orders/${id}/status`, { status }),
};


// ─── Admin API ───
export const adminApi = {
  getDashboard: () => get('/admin/dashboard'),
  getRestaurants: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/admin/restaurants${qs ? `?${qs}` : ''}`);
  },
  createRestaurant: (data) => post('/admin/restaurants', data),
  updateRestaurant: (id, data) => put(`/admin/restaurants/${id}`, data),
  toggleRestaurant: (id) => patch(`/admin/restaurants/${id}/toggle`),
  deleteRestaurant: (id) => del(`/admin/restaurants/${id}`),
  resetPassword: (id) => patch(`/admin/restaurants/${id}/reset-password`),
  getOrders: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/admin/orders${qs ? `?${qs}` : ''}`);
  },
  getPlans: () => get('/admin/plans'),
  getSubscriptions: () => get('/admin/subscriptions'),
  getSettings: () => get('/admin/settings'),
  
  getPayouts: () => get('/admin/payouts'),
  createPayout: (data) => post('/admin/payouts', data),
  updatePayout: (id, data) => put(`/admin/payouts/${id}`, data),
  deletePayout: (id) => del(`/admin/payouts/${id}`),
  getEarningsOverview: () => get('/admin/earnings-overview'),
  quickSendPayout: (data) => post('/admin/payouts/quick-send', data),
};

// ─── Coupons API ───
export const couponsApi = {
  getCoupons: () => get('/coupons'),
  createCoupon: (data) => post('/coupons', data),
  updateCoupon: (id, data) => put(`/coupons/${id}`, data),
  deleteCoupon: (id) => del(`/coupons/${id}`),
};
