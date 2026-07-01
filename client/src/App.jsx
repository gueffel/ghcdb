import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase.js';
import { api } from './api.js';
import { HintsProvider } from './context/HintsContext.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Landing from './pages/Landing.jsx';
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
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';

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
  '/add': 'Add Single',
  '/import': 'Import CSV',
  '/admin': 'Admin',
  '/settings': 'Settings',
  '/help': 'Help',
  '/about': 'About',
  '/privacy': 'Privacy Policy',
  '/report-bug': 'Report a Bug',
};

function TitleUpdater() {
  const { pathname } = useLocation();
  useEffect(() => {
    const page = PAGE_TITLES[pathname];
    document.title = page ? `GHCdb · ${page}` : 'GHCdb';
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const FULLSCREEN_PATHS = ['/collection', '/search'];
const NO_CHROME_PATHS = ['/reset-password'];

function AppChrome({ children }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const showChrome = user && !NO_CHROME_PATHS.includes(pathname);
  const showFooter = showChrome && !FULLSCREEN_PATHS.includes(pathname);
  return (
    <>
      {showChrome && <Navbar />}
      <main className={showChrome ? 'with-nav' : ''}>
        {children}
      </main>
      {showFooter && <Footer />}
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [profile, setProfile] = useState(null);
  const [openBugCount, setOpenBugCount] = useState(0);

  async function loadProfile(supabaseUser) {
    if (!supabaseUser) { setProfile(null); return; }
    const { data } = await supabase
      .from('profiles')
      .select('username, first_name, last_name, is_admin')
      .eq('id', supabaseUser.id)
      .single();
    setProfile(data);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      loadProfile(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      loadProfile(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = () => supabase.auth.signOut();

  const updateProfile = (fields) => setProfile(prev => ({ ...prev, ...fields }));

  const refreshOpenBugCount = useCallback(() => {
    api.getOpenBugCount().then(setOpenBugCount).catch(() => {});
  }, []);

  useEffect(() => {
    if (profile?.is_admin) refreshOpenBugCount();
    else setOpenBugCount(0);
  }, [profile?.is_admin]);

  if (user === undefined) {
    return <div className="loading-screen"><div className="spinner" /><span>Loading...</span></div>;
  }

  const authValue = { user, profile, logout, updateProfile, openBugCount, refreshOpenBugCount };

  return (
    <AuthContext.Provider value={authValue}>
      <HintsProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <TitleUpdater />
        <AppChrome>
          <Routes>
            <Route path="/" element={user ? <Navigate to="/overview" replace /> : <Landing />} />
            <Route path="/login" element={user ? <Navigate to="/overview" replace /> : <Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
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
            <Route path="*" element={<Navigate to={user ? '/overview' : '/'} replace />} />
          </Routes>
        </AppChrome>
      </BrowserRouter>
      </HintsProvider>
    </AuthContext.Provider>
  );
}
