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

const PAGE_TITLES = {
  '/overview': 'Overview',
  '/collection': 'Collection',
  '/search': 'Search',
  '/add': 'Add Card',
  '/import': 'Import CSV',
  '/admin': 'Admin',
  '/settings': 'Settings',
  '/help': 'Help',
  '/about': 'About',
  '/how-it-works': 'How It Works',
  '/report-bug': 'Report a Bug',
};

function TitleUpdater() {
  const { pathname } = useLocation();
  useEffect(() => {
    const page = PAGE_TITLES[pathname];
    document.title = page ? `GHCdb — ${page}` : 'GHCdb';
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
