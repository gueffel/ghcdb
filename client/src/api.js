const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }

  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { throw new Error(`Server error (status ${res.status})`); }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  login: (username, password) => request('POST', '/auth/login', { username, password }),
  register: (username, password, first_name, last_name, email) => request('POST', '/auth/register', { username, password, first_name, last_name, email }),
  me: () => request('GET', '/auth/me'),
  updateProfile: (data) => request('PUT', '/auth/profile', data),
  forgotPassword: (email) => request('POST', '/auth/forgot-password', { email }),
  resetPassword: (token, password) => request('POST', '/auth/reset-password', { token, password }),

  // Cards
  getCards: (params = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined));
    return request('GET', `/cards?${q}`);
  },
  getProducts: () => request('GET', '/cards/products'),
  getSetNames: (year, product) => {
    const q = new URLSearchParams();
    if (year) q.set('year', year);
    if (product) q.set('product', product);
    return request('GET', `/cards/set-names?${q}`);
  },
  getCard: (id) => request('GET', `/cards/${id}`),
  addCard: (card) => request('POST', '/cards', card),
  updateCard: (id, card) => request('PUT', `/cards/${id}`, card),
  toggleOwned: (id, owned, serial) => request('PATCH', `/cards/${id}/owned`, serial !== undefined ? { owned, serial } : { owned }),
  toggleWishlist: (id, wishlisted) => request('PATCH', `/cards/${id}/wishlist`, { wishlisted }),
  deleteCard: (id) => request('DELETE', `/cards/${id}`),
  importCards: (cards) => request('POST', '/cards/import', { cards }),
  deleteProduct: (year, product) => request('DELETE', '/cards/product/all', { year, product }),

  // Stats
  getStats: () => request('GET', '/stats'),

  // Catalog
  getCatalogSets: () => request('GET', '/catalog'),
  getCatalogCards: (year, product) => {
    const q = new URLSearchParams({ year, product });
    return request('GET', `/catalog/cards?${q}`);
  },
  importToCatalog: (cards, replaceExisting) => request('POST', '/catalog/import', { cards, replaceExisting }),
  deleteCatalogSet: (year, product) => request('DELETE', '/catalog/set', { year, product }),
  updateCatalogCard: (id, data) => request('PUT', `/catalog/card/${id}`, data),
  addToCollection: async (year, product, mode = 'add', onProgress) => {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE}/catalog/add-to-collection`, {
      method: 'POST', headers, body: JSON.stringify({ year, product, mode }),
    });
    if (res.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; return; }
    if (!res.ok) {
      const data = JSON.parse(await res.text());
      throw new Error(data.error || 'Request failed');
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n'); buf = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue;
        const data = JSON.parse(line);
        if (data.error) throw new Error(data.error);
        if (data.added !== undefined) return data;
        if (data.progress !== undefined && onProgress) onProgress(data);
      }
    }
    if (buf.trim()) {
      const data = JSON.parse(buf);
      if (data.error) throw new Error(data.error);
      if (data.added !== undefined) return data;
    }
  },

  // Admin
  getAdminUsers: () => request('GET', '/admin/users'),
  toggleAdminUser: (id) => request('PATCH', `/admin/users/${id}/admin`),
  deleteAdminUser: (id) => request('DELETE', `/admin/users/${id}`),
  getAdminBugs: () => request('GET', '/admin/bugs'),
  scrapeChecklist: (url) => request('POST', '/admin/scrape-checklist', { url }),

  // Announcements
  getAnnouncement: () => request('GET', '/announcements'),
  setAnnouncement: (title, message) => request('PUT', '/announcements', { title, message }),
  deleteAnnouncement: () => request('DELETE', '/announcements'),

  // Bugs
  submitBug: (title, description) => request('POST', '/bugs', { title, description }),
  getMyBugs: () => request('GET', '/bugs/mine'),
  getBug: (id) => request('GET', `/bugs/${id}`),
  replyToBug: (id, message) => request('POST', `/bugs/${id}/reply`, { message }),
  setBugStatus: (id, status) => request('PATCH', `/bugs/${id}/status`, { status }),
  deleteBug: (id) => request('DELETE', `/bugs/${id}`),
};
