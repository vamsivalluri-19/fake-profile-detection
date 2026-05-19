import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthCard from '../components/AuthCard';
import Spinner from '../components/Spinner';
import { loginUser } from '../lib/api';
import { useAuth } from '../App';

const demoCredentials = {
  email: 'demo@fpds.ai',
  password: 'Demo123!',
};

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await loginUser(form);
      login(response);
      toast.success('Welcome back');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  function fillDemoCredentials() {
    setForm(demoCredentials);
  }

  return (
    <AuthCard title="Login" subtitle="Access your scan history and AI detection dashboard.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" placeholder="Email" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-400/50" />
        <input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" placeholder="Password" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-400/50" />
        <button disabled={loading} className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-3 font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70">
          {loading ? <Spinner label="Logging in" /> : 'Login'}
        </button>
      </form>
      <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-sm text-slate-300">
        Demo access: <span className="font-semibold text-cyan-200">demo@fpds.ai</span> / <span className="font-semibold text-cyan-200">Demo123!</span>
        <button type="button" onClick={fillDemoCredentials} className="ml-3 text-cyan-300 transition hover:text-cyan-200">Fill demo credentials</button>
      </div>
      <div className="mt-5 flex items-center justify-between text-sm text-slate-400">
        <Link to="/forgot-password" className="transition hover:text-cyan-300">Forgot password?</Link>
        <Link to="/register" className="transition hover:text-cyan-300">Create account</Link>
      </div>
    </AuthCard>
  );
}
