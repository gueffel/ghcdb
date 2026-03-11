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

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  login: (username, password) => request('POST', '/auth/login', { username, password }),
  register: (username, password, first_name, last_name, email) => request('POST', '/auth/register', { username, password, first_name, last_name, email }),
  me: () => request('GET', '/auth/me'),
  updateProfile: (data) => request('PUT', '/auth/profile', data),

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
  addToCollection: (year, product, mode = 'add') => request('POST', '/catalog/add-to-collection', { year, product, mode }),

  // Admin
  getAdminUsers: () => request('GET', '/admin/users'),
  toggleAdminUser: (id) => request('PATCH', `/admin/users/${id}/admin`),
  deleteAdminUser: (id) => request('DELETE', `/admin/users/${id}`),
};
