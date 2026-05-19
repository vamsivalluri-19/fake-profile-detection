import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthCard from '../components/AuthCard';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    toast.success(`Reset instructions prepared for ${email || 'your email address'}`);
  }

  return (
    <AuthCard title="Forgot password" subtitle="Use the form below to prepare a reset flow for your account.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Email" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50" />
        <button className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-3 font-semibold text-slate-950">Send reset link</button>
      </form>
      <div className="mt-5 text-center text-sm text-slate-400">
        <Link to="/login" className="text-cyan-300 transition hover:text-cyan-200">Back to login</Link>
      </div>
    </AuthCard>
  );
}
