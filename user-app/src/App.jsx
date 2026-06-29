import { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000/api' });

export default function App() {
  const [orgs, setOrgs] = useState([]);
  const [organizationId, setOrganizationId] = useState('');
  const [featureKey, setFeatureKey] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/organizations/public').then(res => setOrgs(res.data)).catch(() => {});
  }, []);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!featureKey.trim() || !organizationId) return;
    setLoading(true); setResult(null); setError('');
    try {
      const res = await api.get('/flags/check', {
        params: { feature_key: featureKey.trim(), organization_id: organizationId }
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Check failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 border border-indigo-100">
        <div className="mb-8 text-center">
          <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Feature Check</h1>
          <p className="text-gray-500 text-sm mt-1">Check if a feature is enabled for your organization</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
        )}

        <form onSubmit={handleCheck} className="space-y-5">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Organization</label>
            <select
              value={organizationId} onChange={e => setOrganizationId(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-gray-700"
            >
              <option value="">Select your organization</option>
              {orgs.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Feature Key</label>
            <input
              type="text" value={featureKey} onChange={e => setFeatureKey(e.target.value)} required
              placeholder="e.g. dark_mode"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit" disabled={loading || !featureKey.trim() || !organizationId}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {loading ? 'Checking...' : 'Check Feature'}
          </button>
        </form>

        {result && (
          <div className={`mt-6 rounded-xl p-5 border-2 text-center ${result.is_enabled ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'}`}>
            <div className={`text-4xl mb-2 ${result.is_enabled ? '' : 'grayscale'}`}>
              {result.exists ? (result.is_enabled ? '✅' : '🚫') : '❓'}
            </div>
            <p className={`font-bold text-lg ${result.is_enabled ? 'text-green-700' : 'text-gray-600'}`}>
              {!result.exists
                ? 'Feature not found'
                : result.is_enabled
                  ? 'Feature is ENABLED'
                  : 'Feature is DISABLED'}
            </p>
            <p className="text-sm text-gray-500 mt-1 font-mono">{featureKey}</p>
          </div>
        )}
      </div>
    </div>
  );
}