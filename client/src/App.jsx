import { useEffect, useMemo, useState, createContext, useContext } from 'react';
import { Navigate, Route, Routes, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, ShieldCheck, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import DetectProfilePage from './pages/DetectProfilePage';

const AuthContext = createContext(null);

function readStoredUser() {
  const storedUser = localStorage.getItem('fpds_user');

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem('fpds_user');
    localStorage.removeItem('fpds_token');
    return null;
  }
}

function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const storedToken = localStorage.getItem('fpds_token');
    return {
      token: storedToken,
      user: readStoredUser(),
    };
  });

  const value = useMemo(() => ({
    auth,
    login: (payload) => {
      setAuth(payload);
      localStorage.setItem('fpds_token', payload.token);
      localStorage.setItem('fpds_user', JSON.stringify(payload.user));
    },
    logout: () => {
      setAuth({ token: null, user: null });
      localStorage.removeItem('fpds_token');
      localStorage.removeItem('fpds_user');
      toast.success('Logged out');
    },
  }), [auth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  return useContext(AuthContext);
}

function ProtectedRoute({ children }) {
  const { auth } = useAuth();
  if (!auth.token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function Navbar() {
  const [open, setOpen] = useState(false);
  const { auth, logout } = useAuth();
  const location = useLocation();
  const navItems = [
    { label: 'Home', to: '/' },
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Detect', to: '/detect' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/30">
            <ShieldCheck size={20} />
          </span>
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200/80">FPDS</div>
            <div className="text-xs text-slate-400">Fake Profile Detection System</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`text-sm transition hover:text-cyan-300 ${location.pathname === item.to ? 'text-cyan-300' : 'text-slate-300'}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {auth.token ? (
            <>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">{auth.user?.name}</span>
              <button onClick={logout} className="rounded-full bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50 hover:text-cyan-300">Login</Link>
              <Link to="/register" className="rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02]">Get Started</Link>
            </>
          )}
        </div>

        <button className="rounded-xl border border-white/10 p-2 text-slate-100 md:hidden" onClick={() => setOpen((value) => !value)}>
          <Menu size={22} />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="border-t border-white/10 bg-slate-950/95 px-4 py-4 md:hidden"
          >
            <div className="grid gap-3">
              {navItems.map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-200">
                  {item.label}
                </Link>
              ))}
              {auth.token ? (
                <button onClick={() => { logout(); setOpen(false); }} className="rounded-2xl bg-white/10 px-4 py-3 text-left text-sm text-white">Logout</button>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white">Login</Link>
                  <Link to="/register" onClick={() => setOpen(false)} className="rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-3 text-sm font-semibold text-slate-950">Get Started</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function AppShell() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/detect" element={<ProtectedRoute><DetectProfilePage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export { useAuth };
