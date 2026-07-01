import { supabase } from './lib/supabase.js';
import { normalizeCard } from './lib/normalizeCard.js';

// ── Auth ──────────────────────────────────────────────────────

export const api = {
  register: (email, password, first_name, last_name) =>
    supabase.auth.signUp({
      email, password,
      options: { data: { first_name: first_name || null, last_name: last_name || null } },
    }),

  login: (email, password) =>
    supabase.auth.signInWithPassword({ email, password }),

  forgotPassword: (email) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    }),

  resetPassword: (password) =>
    supabase.auth.updateUser({ password }),

  deleteAccount: () =>
    supabase.rpc('delete_my_account'),

  // ── Profile ────────────────────────────────────────────────

  getProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (error) throw error;
    return data;
  },

  updateProfile: async ({ first_name, last_name, current_password, new_password }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    if (new_password) {
      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current_password,
      });
      if (reAuthError) throw new Error('Current password is incorrect');
      const { error: pwError } = await supabase.auth.updateUser({ password: new_password });
      if (pwError) throw pwError;
    }

    const { error } = await supabase.from('profiles')
      .update({ first_name: first_name || null, last_name: last_name || null })
      .eq('id', user.id);
    if (error) throw error;

    return { ok: true };
  },

  // ── Cards ──────────────────────────────────────────────────

  getCards: async (params = {}) => {
    const { year, product, owned, wishlisted, rookie, auto, search, page = 1, limit = 200 } = params;
    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.min(10000, Math.max(1, parseInt(limit) || 200));
    const from = (parsedPage - 1) * parsedLimit;
    const to = from + parsedLimit - 1;

    let q = supabase.from('cards').select('*', { count: 'exact' }).range(from, to);

    if (year) q = q.eq('year', year);
    if (product) q = q.eq('product', product);
    const toBoolFilter = v => v === true || v === 1 || v === 'true' || v === '1';
    if (owned !== undefined && owned !== '') q = q.eq('owned', toBoolFilter(owned));
    if (wishlisted !== undefined && wishlisted !== '') q = q.eq('wishlisted', toBoolFilter(wishlisted));
    if (rookie !== undefined && rookie !== '') q = q.eq('rookie', toBoolFilter(rookie));
    if (auto !== undefined && auto !== '') q = q.eq('auto', toBoolFilter(auto));
    if (search) {
      const tokens = search.trim().split(/\s+/).filter(Boolean).slice(0, 3);
      const cols = ['description', 'team_city', 'team_name', 'card_number', 'set_name', 'product', 'year'];
      for (const token of tokens) {
        q = q.or(cols.map(c => `${c}.ilike.%${token}%`).join(','));
      }
    }

    q = q.order('year', { ascending: false }).order('product').order('card_number');

    const { data: cards, count, error } = await q;
    if (error) throw error;
    return { cards, total: count, page: parsedPage, limit: parsedLimit };
  },

  getProducts: async () => {
    const { data, error } = await supabase.rpc('get_user_products');
    if (error) throw error;
    return data.map(r => ({ year: r.year, product: r.product, total: Number(r.total), owned: Number(r.owned) }));
  },

  getSetNames: async (year, product) => {
    let q = supabase.from('cards').select('set_name').not('set_name', 'is', null).neq('set_name', '').order('set_name').limit(500);
    if (year) q = q.eq('year', year);
    if (product) q = q.eq('product', product);
    const { data, error } = await q;
    if (error) throw error;
    return [...new Set(data.map(r => r.set_name))];
  },

  getCard: async (id) => {
    const { data, error } = await supabase.from('cards').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  addCard: async (card) => {
    const { data: { user } } = await supabase.auth.getUser();
    const owned = card.owned === true || card.owned === 1;
    const c = {
      ...normalizeCard(card),
      user_id: user.id,
      owned,
      duplicates: parseInt(card.duplicates) || 0,
      owned_at: owned ? new Date().toISOString() : null,
    };

    if (c.card_number) {
      let q = supabase.from('cards').select('id, owned, duplicates').eq('year', c.year).eq('product', c.product).eq('card_number', c.card_number);
      q = c.set_name ? q.eq('set_name', c.set_name) : q.is('set_name', null);
      const { data: existing } = await q.maybeSingle();

      if (existing) {
        if (!existing.owned) {
          const { error } = await supabase.from('cards').update({ owned: true, owned_at: new Date().toISOString() }).eq('id', existing.id);
          if (error) throw error;
          return { id: existing.id, action: 'marked_owned' };
        } else {
          const { error } = await supabase.from('cards').update({ duplicates: existing.duplicates + 1 }).eq('id', existing.id);
          if (error) throw error;
          return { id: existing.id, action: 'duplicated' };
        }
      }
    }

    const { data, error } = await supabase.from('cards').insert(c).select('id').single();
    if (error) throw error;
    return { id: data.id, action: 'inserted', ...c };
  },

  updateCard: async (id, card) => {
    const { error } = await supabase.from('cards').update(normalizeCard(card)).eq('id', id);
    if (error) throw error;
    return { ok: true };
  },

  toggleOwned: async (id, owned, serial) => {
    const update = { owned, wishlisted: owned ? false : undefined };
    if (owned) update.owned_at = new Date().toISOString();
    else { update.owned_at = null; delete update.wishlisted; }
    if (serial !== undefined) update.serial = serial !== null && serial !== '' ? Number(serial) : null;
    const { error } = await supabase.from('cards').update(update).eq('id', id);
    if (error) throw error;
    return { ok: true };
  },

  toggleWishlist: async (id, wishlisted) => {
    const { error } = await supabase.from('cards').update({ wishlisted }).eq('id', id);
    if (error) throw error;
    return { ok: true };
  },

  deleteCard: async (id) => {
    const { error } = await supabase.from('cards').delete().eq('id', id);
    if (error) throw error;
    return { ok: true };
  },

  importCards: async (cards) => {
    const { data: { user } } = await supabase.auth.getUser();
    const normalized = cards.map(raw => ({ ...normalizeCard(raw), user_id: user.id }));
    const CHUNK = 500;
    for (let i = 0; i < normalized.length; i += CHUNK) {
      const { error } = await supabase.from('cards').insert(normalized.slice(i, i + CHUNK));
      if (error) throw error;
    }
    return { imported: cards.length };
  },

  deleteProduct: async (year, product) => {
    const { error, count } = await supabase.from('cards').delete({ count: 'exact' }).eq('year', year).eq('product', product);
    if (error) throw error;
    return { deleted: count };
  },

  // ── Stats ──────────────────────────────────────────────────

  getStats: async () => {
    const { data, error } = await supabase.rpc('get_stats');
    if (error) throw error;
    return data;
  },

  getRecentAdditions: async () => {
    const { data, error } = await supabase
      .from('cards')
      .select('year, product')
      .order('created_at', { ascending: false })
      .limit(150);
    if (error || !data) return { years: [], products: [] };
    const years    = [...new Set(data.map(r => r.year).filter(Boolean))].slice(0, 3);
    const products = [...new Set(data.map(r => r.product).filter(Boolean))].slice(0, 3);
    return { years, products };
  },

  getCatalogProducts: async () => {
    const { data, error } = await supabase
      .from('catalog_cards')
      .select('year, product')
      .order('year', { ascending: false });
    if (error) throw error;
    const seen = new Set();
    return data.filter(r => { const k = `${r.year}||${r.product}`; return seen.has(k) ? false : seen.add(k); });
  },

  getCatalogSetNames: async (year, product, search) => {
    const { data, error } = await supabase.rpc('get_catalog_set_names', {
      p_year: year || null,
      p_product: product || null,
      p_search: search || null,
    });
    if (error) throw error;
    return (data || []).map(r => r.set_name);
  },

  // ── Catalog ────────────────────────────────────────────────

  getCatalogSets: async () => {
    const { data, error } = await supabase.rpc('get_catalog_sets');
    if (error) throw error;
    return data;
  },

  getCatalogCards: async (year, product) => {
    const { data, error } = await supabase
      .from('catalog_cards')
      .select('*')
      .eq('year', year)
      .eq('product', product)
      .order('card_number')
      .limit(5000);
    if (error) throw error;
    return data;
  },

  importToCatalog: async (cards, replaceExisting) => {
    const normalized = cards.map(normalizeCard);
    const first = normalized[0];
    if (!first?.year || !first?.product) throw new Error('Cards must have year and product columns');

    if (replaceExisting) {
      const { error } = await supabase.from('catalog_cards').delete().eq('year', first.year).eq('product', first.product);
      if (error) throw error;
    }

    const CHUNK = 500;
    for (let i = 0; i < normalized.length; i += CHUNK) {
      const { error } = await supabase.from('catalog_cards').insert(normalized.slice(i, i + CHUNK));
      if (error) throw error;
    }
    return { imported: cards.length, year: first.year, product: first.product };
  },

  deleteCatalogSet: async (year, product) => {
    const { error } = await supabase.from('catalog_cards').delete().eq('year', year).eq('product', product);
    if (error) throw error;
    return { ok: true };
  },

  updateCatalogCard: async (id, data) => {
    const { error } = await supabase.from('catalog_cards').update(normalizeCard(data)).eq('id', id);
    if (error) throw error;
    return { ok: true };
  },

  addToCollection: async (year, product, mode = 'add') => {
    const { data, error } = await supabase.rpc('add_catalog_to_collection', {
      p_year: year, p_product: product, p_mode: mode,
    });
    if (error) throw error;
    if (data?.error === 'already_exists') {
      const err = new Error('already_exists');
      err.count = data.count;
      throw err;
    }
    if (data?.error) throw new Error(data.error);
    return data;
  },

  // ── Admin ──────────────────────────────────────────────────

  getAdminUsers: async () => {
    const { data, error } = await supabase.rpc('admin_get_users');
    if (error) throw error;
    return data;
  },

  toggleAdminUser: async (id) => {
    const { data, error } = await supabase.rpc('admin_toggle_admin', { target_id: id });
    if (error) throw error;
    return data;
  },

  deleteAdminUser: async (id) => {
    const { data, error } = await supabase.rpc('admin_delete_user', { target_id: id });
    if (error) throw error;
    return data;
  },

  getAdminBugs: async () => {
    const { data, error } = await supabase.rpc('admin_get_bugs');
    if (error) throw error;
    return data;
  },

  // ── Announcements ──────────────────────────────────────────

  getAnnouncement: async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, message')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  setAnnouncement: async (title, message) => {
    await supabase.from('announcements').delete().neq('id', 0);
    const { data, error } = await supabase.from('announcements').insert({ title: title.trim(), message: message.trim() }).select().single();
    if (error) throw error;
    return data;
  },

  deleteAnnouncement: async () => {
    const { error } = await supabase.from('announcements').delete().neq('id', 0);
    if (error) throw error;
    return { deleted: true };
  },

  // ── Bug Reports ────────────────────────────────────────────

  submitBug: async (title, description) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('bug_reports')
      .insert({ user_id: user.id, title: title.trim(), description: description.trim() })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getMyBugs: async () => {
    const { data, error } = await supabase
      .from('bug_reports')
      .select('id, title, status, created_at, bug_replies(count)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(b => ({ ...b, reply_count: b.bug_replies?.[0]?.count ?? 0 }));
  },

  getBug: async (id) => {
    const { data, error } = await supabase
      .from('bug_reports')
      .select('id, title, description, status, created_at, bug_replies(id, message, created_at, profiles(username))')
      .eq('id', id)
      .single();
    if (error) throw error;
    const replies = (data.bug_replies || []).map(r => ({
      ...r, admin_username: r.profiles?.username,
    }));
    return { ...data, replies };
  },

  replyToBug: async (id, message) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('bug_replies')
      .insert({ bug_id: id, admin_id: user.id, message: message.trim() })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  setBugStatus: async (id, status) => {
    const { error } = await supabase.from('bug_reports')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return { ok: true, status };
  },

  deleteBug: async (id) => {
    const { error } = await supabase.from('bug_reports').delete().eq('id', id);
    if (error) throw error;
    return { ok: true };
  },

  // ── Hints ──────────────────────────────────────────────────

  getHintsState: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from('profiles')
      .select('hints_enabled, hints_seen')
      .eq('id', user.id)
      .single();
    return data;
  },

  saveHintsState: async (hints_enabled, hints_seen) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('profiles')
      .update({ hints_enabled, hints_seen })
      .eq('id', user.id);
    if (error) throw error;
  },
};
