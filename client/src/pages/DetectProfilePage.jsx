import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, LoaderCircle, ShieldAlert, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import GlassCard from '../components/GlassCard';
import SectionTitle from '../components/SectionTitle';
import Spinner from '../components/Spinner';
import Sidebar from '../components/Sidebar';
import { detectProfile } from '../lib/api';
import { useAuth } from '../App';

const initialForm = {
  username: 'demo_profile_01',
  followersCount: '1250',
  followingCount: '320',
  numberOfPosts: '48',
  bio: 'Travel, tech, and product updates.',
  engagementRate: '4.2',
  accountAge: '18',
  instagramUrl: 'https://instagram.com/demo_profile_01',
  twitterUrl: 'https://x.com/demo_profile_01',
  linkedinUrl: '',
  githubUrl: '',
  snapchatUrl: '',
  telegramUrl: '',
  contactNumber: '',
  websiteUrl: 'https://demo-profile.example',
  tiktokUrl: '',
  verifiedStatus: 'false',
  profilePictureAvailability: 'true',
};

const profilePresets = {
  fake: {
    username: 'promo_offer1234',
    followersCount: '16',
    followingCount: '2',
    numberOfPosts: '0',
    bio: 'DM for collab',
    engagementRate: '0.1',
    accountAge: '1',
    instagramUrl: '',
    twitterUrl: '',
    linkedinUrl: '',
    githubUrl: '',
    snapchatUrl: '',
    telegramUrl: '',
    contactNumber: '',
    websiteUrl: '',
    tiktokUrl: '',
    verifiedStatus: 'false',
    profilePictureAvailability: 'false',
  },
  real: {
    username: 'founder.nia',
    followersCount: '5400',
    followingCount: '430',
    numberOfPosts: '128',
    bio: 'Speaker and founder',
    engagementRate: '3.7',
    accountAge: '51',
    instagramUrl: 'https://instagram.com/founder.nia',
    twitterUrl: 'https://x.com/founder_nia',
    linkedinUrl: 'https://linkedin.com/in/founder-nia',
    githubUrl: 'https://github.com/founder-nia',
    snapchatUrl: '',
    telegramUrl: '',
    contactNumber: '+15550001111',
    websiteUrl: 'https://foundernia.com',
    tiktokUrl: '',
    verifiedStatus: 'true',
    profilePictureAvailability: 'true',
  },
};

export default function DetectProfilePage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const { auth } = useAuth();

  const socialLinks = useMemo(() => [
    { label: 'Instagram', value: form.instagramUrl },
    { label: 'Twitter / X', value: form.twitterUrl },
    { label: 'LinkedIn', value: form.linkedinUrl },
    { label: 'GitHub', value: form.githubUrl },
    { label: 'Snapchat', value: form.snapchatUrl },
    { label: 'Telegram', value: form.telegramUrl },
    { label: 'Website', value: form.websiteUrl },
    { label: 'TikTok', value: form.tiktokUrl },
  ].filter((item) => item.value && item.value.trim()), [form]);

  const profileInitials = useMemo(() => {
    const clean = form.username.trim();
    if (!clean) return 'FP';
    return clean
      .replace(/[^a-zA-Z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'FP';
  }, [form.username]);

  function loadPreset(name) {
    const preset = profilePresets[name];
    if (!preset) return;
    setResult(null);
    setError('');
    setForm(preset);
  }

  function resetForm() {
    setResult(null);
    setError('');
    setForm(initialForm);
  }

  const riskColor = useMemo(() => {
    if (!result) return 'from-slate-700 to-slate-600';
    if (result.riskLevel === 'High') return 'from-rose-500 to-orange-500';
    if (result.riskLevel === 'Medium') return 'from-amber-400 to-orange-500';
    return 'from-emerald-400 to-cyan-400';
  }, [result]);

  const canSubmit = useMemo(() => (
    form.username.trim() &&
    form.followersCount !== '' &&
    form.followingCount !== '' &&
    form.numberOfPosts !== '' &&
    form.engagementRate !== '' &&
    form.accountAge !== ''
  ), [form]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!canSubmit) {
      setError('Fill in all required profile metrics before analyzing.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        followersCount: Number(form.followersCount),
        followingCount: Number(form.followingCount),
        numberOfPosts: Number(form.numberOfPosts),
        engagementRate: Number(form.engagementRate),
        accountAge: Number(form.accountAge),
        instagramUrl: form.instagramUrl.trim(),
        twitterUrl: form.twitterUrl.trim(),
        linkedinUrl: form.linkedinUrl.trim(),
        githubUrl: form.githubUrl.trim(),
        snapchatUrl: form.snapchatUrl.trim(),
        telegramUrl: form.telegramUrl.trim(),
        contactNumber: form.contactNumber.trim(),
        websiteUrl: form.websiteUrl.trim(),
        tiktokUrl: form.tiktokUrl.trim(),
        verifiedStatus: form.verifiedStatus === 'true',
        profilePictureAvailability: form.profilePictureAvailability === 'true',
      };
      const response = await detectProfile(payload, auth.token);
      setResult(response.result);
      toast.success('Profile analyzed successfully');
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr] lg:gap-8">
        <Sidebar />
        <div className="space-y-8">
          <GlassCard>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <SectionTitle eyebrow="Detection engine" title="Scan a social profile" description="Enter the profile metrics and the AI model will return a Real or Fake prediction with a confidence score and explanation." />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => loadPreset('fake')} className="rounded-full border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-rose-200 transition hover:bg-rose-500/20">Load fake sample</button>
                <button type="button" onClick={() => loadPreset('real')} className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200 transition hover:bg-emerald-500/20">Load real sample</button>
                <button type="button" onClick={resetForm} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-200 transition hover:bg-white/10">Reset</button>
              </div>
            </div>
          </GlassCard>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:gap-8">
            <GlassCard>
              <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                {error ? <div className="md:col-span-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
                <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="Username" className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50" />
                <input value={form.followersCount} onChange={(event) => setForm({ ...form, followersCount: event.target.value })} type="number" placeholder="Followers Count" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50" />
                <input value={form.followingCount} onChange={(event) => setForm({ ...form, followingCount: event.target.value })} type="number" placeholder="Following Count" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50" />
                <input value={form.numberOfPosts} onChange={(event) => setForm({ ...form, numberOfPosts: event.target.value })} type="number" placeholder="Number of Posts" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50" />
                <input value={form.engagementRate} onChange={(event) => setForm({ ...form, engagementRate: event.target.value })} type="number" step="0.1" placeholder="Engagement Rate" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50" />
                <input value={form.accountAge} onChange={(event) => setForm({ ...form, accountAge: event.target.value })} type="number" placeholder="Account Age (months)" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50" />
                <input value={form.instagramUrl} onChange={(event) => setForm({ ...form, instagramUrl: event.target.value })} placeholder="Instagram URL" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50" />
                <input value={form.twitterUrl} onChange={(event) => setForm({ ...form, twitterUrl: event.target.value })} placeholder="Twitter / X URL" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50" />
                <input value={form.linkedinUrl} onChange={(event) => setForm({ ...form, linkedinUrl: event.target.value })} placeholder="LinkedIn URL" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50" />
                <input value={form.githubUrl} onChange={(event) => setForm({ ...form, githubUrl: event.target.value })} placeholder="GitHub URL" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50" />
                <input value={form.snapchatUrl} onChange={(event) => setForm({ ...form, snapchatUrl: event.target.value })} placeholder="Snapchat URL" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50" />
                <input value={form.telegramUrl} onChange={(event) => setForm({ ...form, telegramUrl: event.target.value })} placeholder="Telegram URL" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50" />
                <input value={form.contactNumber} onChange={(event) => setForm({ ...form, contactNumber: event.target.value })} placeholder="Contact Number" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50" />
                <input value={form.websiteUrl} onChange={(event) => setForm({ ...form, websiteUrl: event.target.value })} placeholder="Website / Portfolio URL" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50" />
                <input value={form.tiktokUrl} onChange={(event) => setForm({ ...form, tiktokUrl: event.target.value })} placeholder="TikTok URL" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50" />
                <select value={form.verifiedStatus} onChange={(event) => setForm({ ...form, verifiedStatus: event.target.value })} className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400/50">
                  <option value="true">Verified</option>
                  <option value="false">Not verified</option>
                </select>
                <select value={form.profilePictureAvailability} onChange={(event) => setForm({ ...form, profilePictureAvailability: event.target.value })} className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400/50">
                  <option value="true">Profile picture available</option>
                  <option value="false">No profile picture</option>
                </select>
                <textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} placeholder="Bio" rows={4} className="sm:col-span-2 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50" />
                <button disabled={loading || !canSubmit} className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-3 font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70">
                  {loading ? <Spinner label="Analyzing profile" /> : <><LoaderCircle size={18} /> Detect profile</>}
                </button>
              </form>
            </GlassCard>

            <div className="space-y-8">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <GlassCard className="h-full">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.45em] text-slate-400">Live preview</p>
                        <h3 className="mt-2 text-3xl font-semibold text-white">{form.username.trim() || 'Enter a username'}</h3>
                      </div>
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-lg font-semibold text-cyan-200 ring-1 ring-cyan-300/20">
                        {profileInitials}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-xs uppercase tracking-[0.35em] text-slate-400">Visible links</div>
                        <div className="mt-2 text-2xl font-semibold text-white">{socialLinks.length}</div>
                        <div className="mt-1 text-sm text-slate-300">Profile links entered by the user</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-xs uppercase tracking-[0.35em] text-slate-400">Contact</div>
                        <div className="mt-2 text-xl font-semibold text-white">{form.contactNumber.trim() || 'Not added'}</div>
                        <div className="mt-1 text-sm text-slate-300">Phone or contact number visibility</div>
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 text-xs uppercase tracking-[0.35em] text-slate-400">Social profile links</div>
                      {socialLinks.length ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {socialLinks.map((item) => (
                            <a key={item.label} href={item.value} target="_blank" rel="noreferrer" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-cyan-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-100">
                              <div className="text-xs uppercase tracking-[0.35em] text-slate-400">{item.label}</div>
                              <div className="mt-1 break-all">{item.value}</div>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                          Add Instagram, Twitter, LinkedIn, GitHub, Snapchat, Telegram, website, or TikTok links to make the profile visible here.
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <GlassCard className="h-full">
                  {result ? (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.45em] text-slate-400">Prediction</p>
                          <h3 className={`mt-2 text-4xl font-semibold ${result.prediction === 'Fake' ? 'text-rose-300' : 'text-emerald-300'}`}>{result.prediction}</h3>
                        </div>
                        {result.prediction === 'Fake' ? <ShieldAlert className="text-rose-300" size={34} /> : <ShieldCheck className="text-emerald-300" size={34} />}
                      </div>
                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                          <span>Confidence Score</span>
                          <span>{result.confidence}%</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                          <div className={`h-full rounded-full bg-gradient-to-r ${riskColor}`} style={{ width: `${Math.min(result.confidence, 100)}%` }} />
                        </div>
                      </div>
                      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                        <div className="text-xs uppercase tracking-[0.35em] text-slate-400">Risk Level</div>
                        <div className="mt-2 text-2xl font-semibold text-white">{result.riskLevel}</div>
                      </div>
                      <div>
                        <div className="mb-3 text-xs uppercase tracking-[0.35em] text-slate-400">Reasons for detection</div>
                        <div className="space-y-2 text-sm text-slate-300">
                          {result.reasons?.map((reason) => (
                            <div key={reason} className="flex items-start gap-2 rounded-2xl bg-white/5 p-3"><CheckCircle2 className="mt-0.5 text-cyan-300" size={16} />{reason}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-[320px] items-center justify-center text-center text-slate-400">
                      <div>
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-300">
                          <ShieldCheck size={28} />
                        </div>
                        Submit a profile to see the AI result card.
                      </div>
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
