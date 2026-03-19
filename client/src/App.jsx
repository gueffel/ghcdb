import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { api } from './api.js';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Login from './pages/Login.jsx';
import Overview from './pages/Overview.jsx';
import Collection from './pages/Collection.jsx';
import Search from './pages/Search.jsx';
import AddCard from './pages/AddCard.jsx';
import Import from './pages/Import.jsx';
import Admin from './pages/Admin.jsx';
import Settings from './pages/Settings.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Help from './pages/Help.jsx';
import About from './pages/About.jsx';
import BugReport from './pages/BugReport.jsx';
import HowItWorks from './pages/HowItWorks.jsx';

export const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

const DEFAULT_DESCRIPTION = 'Track your hockey card collection. Log what you own, find what you\'re missing, and see stats by player, team, year, and set.';

const PAGE_META = {
  '/overview':    { title: 'Overview',      description: 'Your collection at a glance — stats, charts, and progress across every set you track.' },
  '/collection':  { title: 'Collection',    description: 'Browse and manage every card in your hockey card collection.' },
  '/search':      { title: 'Search',        description: 'Search across your entire collection and catalog by player, team, year, set, and more.' },
  '/add':         { title: 'Add Card',      description: 'Add a new card to your hockey card collection.' },
  '/import':      { title: 'Import CSV',    description: 'Import a set into your catalog from a CSV file.' },
  '/admin':       { title: 'Admin',         description: null },
  '/settings':    { title: 'Settings',      description: 'Manage your GHCdb account settings.' },
  '/help':        { title: 'Help',          description: 'Help and documentation for GHCdb.' },
  '/about':       { title: 'About',         description: 'About GHCdb — the hockey card collection tracker.' },
  '/how-it-works':{ title: 'How It Works',  description: 'See how GHCdb helps you track your hockey card collection — dashboard, sets, CSV import, and more.' },
  '/report-bug':  { title: 'Report a Bug',  description: null },
};

function setMetaTag(name, content, property = false) {
  const attr = property ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
  el.setAttribute('content', content);
}

function TitleUpdater() {
  const { pathname } = useLocation();
  useEffect(() => {
    const meta = PAGE_META[pathname];
    const title = meta ? `GHCdb — ${meta.title}` : 'GHCdb — Hockey Card Collection Tracker';
    const description = (meta?.description) ?? DEFAULT_DESCRIPTION;
    document.title = title;
    setMetaTag('description', description);
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setUser(null); return; }
    api.me().then(u => setUser({ username: u.username, is_admin: u.is_admin, first_name: u.first_name || null })).catch(() => { localStorage.removeItem('token'); setUser(null); });
  }, []);

  const login = (token, username, is_admin, first_name = null) => {
    localStorage.setItem('token', token);
    setUser({ username, is_admin, first_name });
  };
  const updateUser = (fields) => setUser(prev => ({ ...prev, ...fields }));
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (user === undefined) {
    return <div className="loading-screen"><div className="spinner" /><span>Loading...</span></div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <TitleUpdater />
        {user && <Navbar />}
        <main className={user ? 'with-nav' : ''}>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/overview" replace /> : <Login />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/overview" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
            <Route path="/collection" element={<ProtectedRoute><Collection /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
            <Route path="/add" element={<ProtectedRoute><AddCard /></ProtectedRoute>} />
            <Route path="/import" element={<ProtectedRoute><Import /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
            <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
            <Route path="/report-bug" element={<ProtectedRoute><BugReport /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to={user ? '/overview' : '/login'} replace />} />
          </Routes>
        </main>
        {user && <Footer />}
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
