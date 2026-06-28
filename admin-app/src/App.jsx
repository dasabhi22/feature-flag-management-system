import { useState, useEffect } from 'react';
import api from './api';

// ─── AUTH PAGES ─────────────────────────────────────────────
function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [orgs, setOrgs] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/organizations/public').then(res => setOrgs(res.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      if (mode === 'login') {
        const res = await api.post('/auth/login', { email, password });
        if (res.data.user.role !== 'org_admin') {
          setError('Access denied. Org admin accounts only.');
          return;
        }
        localStorage.setItem('admin_token', res.data.token);
        onLogin(res.data.user);
      } else {
        await api.post('/auth/signup', { email, password, organizationId: Number(organizationId) });
        setSuccess('Account created! You can now log in.');
        setMode('login');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-gray-100">
        <div className="mb-8">
          <span className="text-xs font-bold tracking-widest text-emerald-600 uppercase">Feature Flags</span>
          <h1 className="text-3xl font-bold text-gray-900 mt-1">
            {mode === 'login' ? 'Admin Login' : 'Create Account'}
          </h1>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          {mode === 'signup' && (
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Organization</label>
              <select
                value={organizationId} onChange={e => setOrganizationId(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
              >
                <option value="">Select your organization</option>
                {orgs.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>
          )}
          <button
            type="submit" disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess(''); }}
            className="text-emerald-600 font-semibold hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── FLAG CARD ──────────────────────────────────────────────
function FlagCard({ flag, onToggle, onDelete }) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    await onToggle(flag.id, !flag.is_enabled);
    setToggling(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${flag.feature_key}"?`)) return;
    setDeleting(true);
    await onDelete(flag.id);
    setDeleting(false);
  };

  return (
    <div className="flex items-center justify-between bg-white rounded-xl px-5 py-4 border border-gray-200 shadow-sm">
      <div>
        <p className="font-mono font-semibold text-gray-800">{flag.feature_key}</p>
        <p className="text-gray-400 text-xs mt-0.5">Created {new Date(flag.created_at).toLocaleDateString()}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${flag.is_enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
          {flag.is_enabled ? 'Enabled' : 'Disabled'}
        </span>
        <button
          onClick={handleToggle} disabled={toggling}
          className={`relative w-11 h-6 rounded-full transition-colors ${flag.is_enabled ? 'bg-emerald-500' : 'bg-gray-300'} disabled:opacity-50`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${flag.is_enabled ? 'translate-x-5' : ''}`} />
        </button>
        <button
          onClick={handleDelete} disabled={deleting}
          className="text-red-400 hover:text-red-600 transition-colors text-sm font-medium disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ─── DASHBOARD ──────────────────────────────────────────────
function Dashboard({ user, onLogout }) {
  const [flags, setFlags] = useState([]);
  const [newKey, setNewKey] = useState('');
  const [newEnabled, setNewEnabled] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchFlags = async () => {
    try {
      const res = await api.get('/flags');
      setFlags(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchFlags(); }, []);

  const createFlag = async (e) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.post('/flags', { feature_key: newKey.trim(), is_enabled: newEnabled });
      setSuccess(`Flag "${newKey.trim()}" created.`);
      setNewKey(''); setNewEnabled(false);
      fetchFlags();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create flag');
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (id, is_enabled) => {
    try {
      await api.patch(`/flags/${id}`, { is_enabled });
      fetchFlags();
    } catch (err) { console.error(err); }
  };

  const deleteFlag = async (id) => {
    try {
      await api.delete(`/flags/${id}`);
      fetchFlags();
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <span className="text-xs font-bold tracking-widest text-emerald-600 uppercase">Feature Flags</span>
          <h1 className="text-lg font-bold text-gray-900">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-sm">{user.email}</span>
          <button onClick={handleLogout} className="text-gray-400 hover:text-gray-700 text-sm transition-colors">Logout</button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Create flag */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">New Feature Flag</h2>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">{success}</div>}
          <form onSubmit={createFlag} className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Feature Key</label>
              <input
                type="text" value={newKey} onChange={e => setNewKey(e.target.value)}
                placeholder="e.g. dark_mode, new_checkout, beta_feature"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-gray-400 text-xs mt-1">Lowercase, underscores recommended. Will be normalized automatically.</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox" id="enabled" checked={newEnabled} onChange={e => setNewEnabled(e.target.checked)}
                className="w-4 h-4 accent-emerald-600"
              />
              <label htmlFor="enabled" className="text-gray-700 text-sm">Enable immediately</label>
            </div>
            <button
              type="submit" disabled={loading || !newKey.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Creating...' : 'Create Flag'}
            </button>
          </form>
        </div>

        {/* Flags list */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Your Flags <span className="text-gray-400 text-sm font-normal">({flags.length})</span>
          </h2>
          {flags.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-gray-200 text-center">
              <p className="text-gray-400 text-sm">No flags yet. Create your first one above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {flags.map(flag => (
                <FlagCard key={flag.id} flag={flag} onToggle={toggleFlag} onDelete={deleteFlag} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ROOT ────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role === 'org_admin') setUser(payload);
        else localStorage.removeItem('admin_token');
      } catch {
        localStorage.removeItem('admin_token');
      }
    }
  }, []);

  if (!user) return <AuthPage onLogin={setUser} />;
  return <Dashboard user={user} onLogout={() => setUser(null)} />;
}