import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthCard from '../components/AuthCard';
import Spinner from '../components/Spinner';
import { registerUser } from '../lib/api';
import { useAuth } from '../App';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await registerUser(form);
      login(response);
      toast.success('Account created');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Create account" subtitle="Register to unlock profile scans, saved reports, and AI insights.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} type="text" placeholder="Full name" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50" />
        <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" placeholder="Email" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50" />
        <input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" placeholder="Password" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50" />
        <button disabled={loading} className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-3 font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70">
          {loading ? <Spinner label="Creating account" /> : 'Create account'}
        </button>
      </form>
      <div className="mt-5 text-center text-sm text-slate-400">
        Already have an account? <Link to="/login" className="text-cyan-300 transition hover:text-cyan-200">Login</Link>
      </div>
    </AuthCard>
  );
}
