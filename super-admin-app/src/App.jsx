import { useState, useEffect } from 'react';
import api from './api';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.user.role !== 'super_admin') {
        setError('Access denied. Super admin only.');
        return;
      }
      localStorage.setItem('token', res.data.token);
      onLogin(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md">
        <div className="mb-8">
          <span className="text-xs font-bold tracking-widest text-violet-400 uppercase">System Control</span>
          <h1 className="text-3xl font-bold text-white mt-1">Super Admin</h1>
          <p className="text-slate-400 mt-1 text-sm">Restricted access — authorized personnel only</p>
        </div>
        {error && <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              placeholder="superadmin@system.com"
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Dashboard({ user, onLogout }) {
  const [organizations, setOrganizations] = useState([]);
  const [newOrgName, setNewOrgName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchOrgs = async () => {
    try {
      const res = await api.get('/organizations');
      setOrganizations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchOrgs(); }, []);

  const createOrg = async (e) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.post('/organizations', { name: newOrgName.trim() });
      setSuccess(`Organization "${newOrgName.trim()}" created.`);
      setNewOrgName('');
      fetchOrgs();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogout();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold tracking-widest text-violet-400 uppercase">System Control</span>
          <h1 className="text-lg font-bold text-white">Super Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm">{user.email}</span>
          <button onClick={handleLogout} className="text-slate-400 hover:text-white text-sm transition-colors">Logout</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Create Org */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4">Create Organization</h2>
          {error && <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
          {success && <div className="bg-green-900/50 border border-green-500 text-green-300 px-4 py-3 rounded-lg mb-4 text-sm">{success}</div>}
          <form onSubmit={createOrg} className="flex gap-3">
            <input
              type="text" value={newOrgName} onChange={e => setNewOrgName(e.target.value)}
              placeholder="Organization name"
              className="flex-1 bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
            <button
              type="submit" disabled={loading}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </form>
        </div>

        {/* Orgs list */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4">Organizations <span className="text-slate-400 text-sm font-normal">({organizations.length})</span></h2>
          {organizations.length === 0 ? (
            <p className="text-slate-500 text-sm">No organizations yet. Create one above.</p>
          ) : (
            <div className="space-y-3">
              {organizations.map(org => (
                <div key={org.id} className="flex items-center justify-between bg-slate-700/50 rounded-lg px-4 py-3 border border-slate-600">
                  <div>
                    <p className="font-medium">{org.name}</p>
                    <p className="text-slate-400 text-xs mt-0.5">ID: {org.id} · Created {new Date(org.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="bg-violet-900/50 text-violet-300 text-xs px-2 py-1 rounded">Active</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role === 'super_admin') setUser(payload);
        else localStorage.removeItem('token');
      } catch {
        localStorage.removeItem('token');
      }
    }
  }, []);

  if (!user) return <Login onLogin={setUser} />;
  return <Dashboard user={user} onLogout={() => setUser(null)} />;
}