import React, { useState } from 'react';
import { apiClient } from '../../api/client';

interface Props {
  onTokenUpdated?: () => void;
}

export const HFAuthPanel: React.FC<Props> = ({ onTokenUpdated }) => {
  const [showToken, setShowToken] = useState(false);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAuthenticate = async () => {
    if (!token) {
      setMessage({ type: 'error', text: 'Please enter a token' });
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/admin/hf/auth/login', { token });
      setMessage({ type: 'success', text: 'Authenticated successfully!' });
      setToken('');
      setShowToken(false);
      if (onTokenUpdated) onTokenUpdated();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Authentication failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/hf/auth/status');
      if (response.data.authenticated) {
        setMessage({ type: 'success', text: '✓ Token is valid and authenticated' });
      } else {
        setMessage({ type: 'error', text: '✗ No valid authentication found' });
      }
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to verify token' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setShowToken(false);
    setMessage({ type: 'success', text: 'Logged out. Please provide a new token to re-authenticate.' });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">HuggingFace Authentication</h3>

      {message && (
        <div
          className={`mb-4 p-3 rounded ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-3">
        {!showToken ? (
          <button
            onClick={() => setShowToken(true)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
          >
            Add/Update Token
          </button>
        ) : (
          <>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your HuggingFace API token (hf_xxxx)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <button
              onClick={handleAuthenticate}
              disabled={loading || !token}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded font-medium"
            >
              {loading ? 'Authenticating...' : 'Authenticate'}
            </button>
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleVerify}
            disabled={loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded font-medium text-sm"
          >
            {loading ? '...' : 'Verify'}
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};
